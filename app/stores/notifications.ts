import { defineStore } from 'pinia'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
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
  recipientId?: string // personal if exists, global if not
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
    personalUnsub: null as any,
    globalUnsub: null as any,
    isInitialized: false
  }),

  getters: {
    unreadCount: (state) => state.notifications.filter(n => !n.isRead).length,
    sortedNotifications: (state) => {
      return [...state.notifications].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0
        const timeB = b.createdAt?.seconds || 0
        return timeB - timeA
      })
    }
  },

  actions: {
    initNotifications() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      // 1. 개인 알림 구독
      const personalRef = collection(firestore, 'users', authStore.user.uid, 'notifications')
      const personalQuery = query(personalRef, orderBy('createdAt', 'desc'), limit(50))
      
      this.personalUnsub = onSnapshot(personalQuery, (snapshot) => {
        const personalItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
        this.mergeNotifications(personalItems, 'personal')
      })

      // 2. 전역 알림 구독 (최근 50개)
      const globalRef = collection(firestore, 'global_notifications')
      const globalQuery = query(globalRef, orderBy('createdAt', 'desc'), limit(50))

      this.globalUnsub = onSnapshot(globalQuery, (snapshot) => {
        const globalItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
        this.mergeNotifications(globalItems, 'global')
      })

      this.isInitialized = true
    },

    mergeNotifications(newItems: Notification[], source: 'personal' | 'global') {
      // 기존 알림에서 해당 소스(개인/전역)인 것들을 제외하고 새로 합침
      const otherSourceItems = this.notifications.filter(n => {
        if (source === 'personal') return !n.recipientId // recipientId가 없으면 global
        return !!n.recipientId // recipientId가 있으면 personal
      })
      
      this.notifications = [...otherSourceItems, ...newItems]
    },

    async markAsRead(notificationId: string) {
      const authStore = useAuthStore()
      if (!authStore?.user?.uid) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      const target = this.notifications.find(n => n.id === notificationId)
      if (!target) return

      try {
        if (target.recipientId) {
          // 개인 알림 업데이트
          const docRef = doc(firestore, 'users', authStore.user.uid, 'notifications', notificationId)
          await updateDoc(docRef, { isRead: true })
        } else {
          // 전역 알림은 유저별 읽음 처리가 복잡하므로 (N:M), 
          // 현재는 로컬에서만 처리하거나, 개별 알림 스키마 구조상 한계가 있으나 
          // 우선 로컬 상태만 변경 (전역 알림은 모든 유저가 공유하므로 서버 isRead를 바꾸면 안됨)
          target.isRead = true
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    },

    async markAllAsRead() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore
      const batch = writeBatch(firestore)

      const unreadPersonal = this.notifications.filter(n => n.recipientId && !n.isRead)
      
      unreadPersonal.forEach(n => {
        const docRef = doc(firestore, 'users', authStore.user.uid, 'notifications', n.id)
        batch.update(docRef, { isRead: true })
      })

      // 전역 알림은 로컬에서만 처리
      this.notifications.forEach(n => { if (!n.recipientId) n.isRead = true })

      await batch.commit()
    },

    stopSubscriptions() {
      if (this.personalUnsub) this.personalUnsub()
      if (this.globalUnsub) this.globalUnsub()
      this.notifications = []
      this.isInitialized = false
    }
  }
})
