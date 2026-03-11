import { defineStore } from 'pinia'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'

export const useProfileModalStore = defineStore('profileModal', {
    state: () => ({
        isOpen: false,
        targetUid: null as string | null,
        recentPostsCache: {} as Record<string, any[]>,
        isLoadingPosts: false,
    }),

    actions: {
        async openModal(uid: string) {
            this.targetUid = uid
            this.isOpen = true

            // Fetch recent posts if not cached
            if (!this.recentPostsCache[uid]) {
                await this.fetchRecentPosts(uid)
            }
        },

        closeModal() {
            this.isOpen = false
            setTimeout(() => {
                this.targetUid = null
            }, 300) // Delay clearing uid for transition
        },

        async fetchRecentPosts(uid: string) {
            this.isLoadingPosts = true
            try {
                const { $firebase } = useNuxtApp()
                const firestore = ($firebase as any).firestore
                const postsRef = collection(firestore, 'posts')
                
                const q = query(
                    postsRef,
                    where('authorId', '==', uid),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                )

                const snapshot = await getDocs(q)
                const posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))

                this.recentPostsCache[uid] = posts
            } catch (error) {
                console.error('Error fetching recent posts for profile modal:', error)
                // Optionally cache empty array to prevent repeated failures
                this.recentPostsCache[uid] = [] 
            } finally {
                this.isLoadingPosts = false
            }
        }
    }
})
