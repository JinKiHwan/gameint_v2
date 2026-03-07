import { defineStore } from 'pinia'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'

export interface UserProfile {
    uid: string
    nickname: string
    profileImageId: string
    tier?: string
    level?: number
    status?: string
}

export const useUsersStore = defineStore('users', {
    state: () => ({
        users: {} as Record<string, UserProfile>,
        isInitialized: false
    }),

    actions: {
        async initUsers() {
            if (this.isInitialized) return

            const { $firebase } = useNuxtApp()
            const firestore = ($firebase as any).firestore
            const usersRef = collection(firestore, 'users')

            // 실시간 구독 (닉네임/이미지 변경 시 모든 페이지에 즉시 반영하기 위함)
            // 비용 최적화를 위해 active 상태인 유저만 가져옴
            const q = query(usersRef, where('status', '==', 'active'))

            onSnapshot(q, (snapshot) => {
                snapshot.docs.forEach(doc => {
                    const data = doc.data() as UserProfile
                    this.users[doc.id] = {
                        uid: doc.id,
                        nickname: data.nickname,
                        profileImageId: data.profileImageId,
                        tier: data.tier,
                        level: data.level,
                        status: data.status
                    }
                })
                this.isInitialized = true
            }, (error) => {
                console.error('Error subscribing to users:', error)
            })
        },

        getUser(uid: string): UserProfile | undefined {
            return this.users[uid]
        }
    }
})
