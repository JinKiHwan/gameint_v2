import { ref } from 'vue'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { useNuxtApp } from '#app'

export const useRanking = () => {
    const nuxtApp = useNuxtApp()
    
    const getDb = () => {
        const fb = nuxtApp.$firebase as any
        if (!fb) throw new Error('Firebase client-only plugin not loaded yet.')
        return fb.firestore
    }

    const loading = ref(false)
    const error = ref<string | null>(null)
    const topUsers = ref<any[]>([])

    const fetchTopUsersByExp = async (limitCount = 10) => {
        loading.value = true
        error.value = null
        try {
            const usersRef = collection(getDb(), 'users')
            // status: 'active' 필터와 exp: 'desc' 정렬을 사용함 (복합 색인 필요)
            const q = query(
                usersRef,
                where('status', '==', 'active'),
                orderBy('exp', 'desc'),
                limit(limitCount)
            )

            const snapshot = await getDocs(q)
            topUsers.value = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }))
            return topUsers.value
        } catch (err: any) {
            console.error('Fetch top users error:', err)
            error.value = '랭킹 정보를 불러오는데 실패했습니다.'
            return []
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        topUsers,
        fetchTopUsersByExp
    }
}
