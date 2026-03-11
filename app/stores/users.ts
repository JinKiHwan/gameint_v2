import { defineStore } from 'pinia'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'

export interface UserProfile {
    uid: string
    nickname: string
    realName?: string
    profileImageId: string
    tier?: string
    level?: number
    status?: string
    exp?: number
    dna?: {
        dnaName?: string
        scores?: Record<string, number>
    }
}

export const useUsersStore = defineStore('users', {
    state: () => ({
        users: {} as Record<string, UserProfile>,
        isInitialized: false,
        unsubUsers: null as any
    }),

    actions: {
        async initUsers() {
            if (this.isInitialized) return

            const { $firebase } = useNuxtApp()
            const firestore = ($firebase as any).firestore
            const usersRef = collection(firestore, 'users')

            // 닉네임/이미지 변경 시 반영 및 멤버 관리 실시간 반영을 위해 active/pending 유저 구독
            const q = query(usersRef, where('status', 'in', ['active', 'pending']))

            if (this.unsubUsers) this.unsubUsers()
            this.unsubUsers = onSnapshot(q, (snapshot) => {
                snapshot.docs.forEach(doc => {
                    const data = doc.data() as UserProfile
                    this.users[doc.id] = {
                        uid: doc.id,
                        nickname: data.nickname,
                        realName: data.realName,
                        profileImageId: data.profileImageId,
                        tier: data.tier,
                        level: data.level,
                        status: data.status,
                        exp: data.exp,
                        dna: data.dna
                    }
                })
                this.isInitialized = true
            }, (error) => {
                console.error('Error subscribing to users:', error)
            })
        },

        stopSubscriptions() {
            if (this.unsubUsers) {
                this.unsubUsers()
                this.unsubUsers = null
            }
            this.users = {}
            this.isInitialized = false
        },

        getUser(uid: string): UserProfile | undefined {
            return this.users[uid]
        }
    }
})
