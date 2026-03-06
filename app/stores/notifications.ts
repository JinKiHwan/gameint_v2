import { defineStore } from 'pinia'
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  setDoc,
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore'
import { useAuthStore } from './auth'

export interface Notification {
  id: string
  type: 'LIKE' | 'COMMENT' | 'TIER_UP' | 'CYCLE_PHASE'
  title: string
  message: string
  link?: string
  createdAt: any
  isRead: boolean
  isDeleted?: boolean // 로컬/전역 상태 병합용
  recipientId?: string // personal if exists, global if not
}

interface NotiState {
  read: boolean
  deleted: boolean
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    rawPersonal: [] as Notification[],
    rawGlobal: [] as Notification[],
    globalStates: {} as Record<string, NotiState>,
    personalUnsub: null as any,
    globalUnsub: null as any,
    statesUnsub: null as any,
    isInitialized: false
  }),

  getters: {
    notifications: (state): Notification[] => {
      // 개인 알림 + (전역 알림 + 상태 병합 - 삭제된 것)
      const personal = state.rawPersonal.map(n => ({ ...n, isDeleted: false }))
      
      const global = state.rawGlobal
        .map(n => {
          const s = state.globalStates[n.id]
          return {
            ...n,
            isRead: s?.read ?? false,
            isDeleted: s?.deleted ?? false
          }
        })
        .filter(n => !n.isDeleted)

      return [...personal, ...global].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0
        const timeB = b.createdAt?.seconds || 0
        return timeB - timeA
      })
    },
    unreadCount(): number {
      return this.notifications.filter(n => !n.isRead).length
    }
  },

  actions: {
    initNotifications() {
      const authStore = useAuthStore()
      if (!authStore.user) return
      if (this.isInitialized) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      // 1. 개인 알림 구독
      const personalRef = collection(firestore, 'users', authStore.user.uid, 'notifications')
      const personalQuery = query(personalRef, orderBy('createdAt', 'desc'), limit(50))
      this.personalUnsub = onSnapshot(personalQuery, (snapshot) => {
        this.rawPersonal = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
      })

      // 2. 전역 알림 구독
      const globalRef = collection(firestore, 'global_notifications')
      const globalQuery = query(globalRef, orderBy('createdAt', 'desc'), limit(50))
      this.globalUnsub = onSnapshot(globalQuery, (snapshot) => {
        this.rawGlobal = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
      })

      // 3. 전역 알림 상태(읽음/삭제) 구독
      const statesRef = collection(firestore, 'users', authStore.user.uid, 'notification_states')
      this.statesUnsub = onSnapshot(statesRef, (snapshot) => {
        const newStates: Record<string, NotiState> = {}
        snapshot.docs.forEach(d => {
          newStates[d.id] = d.data() as NotiState
        })
        this.globalStates = newStates
      })

      this.isInitialized = true
    },

    async markAsRead(notificationId: string) {
      const authStore = useAuthStore()
      if (!authStore?.user?.uid) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      const target = this.notifications.find(n => n.id === notificationId)
      if (!target || target.isRead) return

      try {
        if (target.recipientId) {
          // 개인 알림 업데이트
          const docRef = doc(firestore, 'users', authStore.user.uid, 'notifications', notificationId)
          await setDoc(docRef, { isRead: true }, { merge: true })
        } else {
          // 전역 알림 상태 업데이트 (전역 컬렉션이 아닌 유저별 상태 컬렉션에 저장)
          const stateRef = doc(firestore, 'users', authStore.user.uid, 'notification_states', notificationId)
          await setDoc(stateRef, { read: true }, { merge: true })
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    },

    async deleteNotification(notificationId: string) {
      const authStore = useAuthStore()
      if (!authStore?.user?.uid) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      const target = this.notifications.find(n => n.id === notificationId)
      if (!target) return

      try {
        if (target.recipientId) {
          // 개인 알림 삭제
          const docRef = doc(firestore, 'users', authStore.user.uid, 'notifications', notificationId)
          await deleteDoc(docRef)
        } else {
          // 전역 알림 숨김 (유저별 상태 컬렉션에 deleted: true 저장)
          const stateRef = doc(firestore, 'users', authStore.user.uid, 'notification_states', notificationId)
          await setDoc(stateRef, { deleted: true }, { merge: true })
        }
      } catch (err) {
        console.error('Failed to delete notification:', err)
      }
    },

    async markAllAsRead() {
      const authStore = useAuthStore()
      if (!authStore?.user?.uid) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore
      const batch = writeBatch(firestore)

      // 1. 읽지 않은 개인 알림들
      const uid = authStore.user.uid
      const unreadPersonal = this.rawPersonal.filter(n => !n.isRead)
      unreadPersonal.forEach(n => {
        const docRef = doc(firestore, 'users', uid, 'notifications', n.id)
        batch.update(docRef, { isRead: true })
      })

      // 2. 읽지 않은 전역 알림들
      const unreadGlobal = this.rawGlobal.filter(n => !this.globalStates[n.id]?.read)
      unreadGlobal.forEach(n => {
        const stateRef = doc(firestore, 'users', uid, 'notification_states', n.id)
        batch.set(stateRef, { read: true }, { merge: true })
      })

      await batch.commit()
    },

    async clearAll() {
      const authStore = useAuthStore()
      if (!authStore?.user?.uid) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore
      const batch = writeBatch(firestore)

      // 1. 모든 개인 알림 삭제
      const uid = authStore.user.uid
      this.rawPersonal.forEach(n => {
        const docRef = doc(firestore, 'users', uid, 'notifications', n.id)
        batch.delete(docRef)
      })

      // 2. 모든 전역 알림 삭제(숨김)
      this.rawGlobal.forEach(n => {
        const stateRef = doc(firestore, 'users', uid, 'notification_states', n.id)
        batch.set(stateRef, { deleted: true }, { merge: true })
      })

      await batch.commit()
    },

    stopSubscriptions() {
      if (this.personalUnsub) this.personalUnsub()
      if (this.globalUnsub) this.globalUnsub()
      if (this.statesUnsub) this.statesUnsub()
      this.rawPersonal = []
      this.rawGlobal = []
      this.globalStates = {}
      this.isInitialized = false
    }
  }
})
