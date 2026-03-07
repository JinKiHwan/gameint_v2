import { ref } from 'vue'
import { collection, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore'
import { useNuxtApp } from '#app'

export const useActivityFeed = () => {
    const { $firebase } = useNuxtApp()
    const db = ($firebase as any).firestore

    const activities = ref<any[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastDoc = ref<QueryDocumentSnapshot | null>(null)
    const hasMore = ref(true)

    const fetchActivities = async (pageSize = 5, isMore = false) => {
        if (loading.value || (!isMore && activities.value.length > 0)) return
        if (isMore && !hasMore.value) return

        loading.value = true
        error.value = null

        try {
            const activitiesRef = collection(db, 'activities')
            let q = query(
                activitiesRef,
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            )

            if (isMore && lastDoc.value) {
                q = query(
                    activitiesRef,
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc.value),
                    limit(pageSize)
                )
            }

            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                hasMore.value = false
                if (!isMore) activities.value = []
                return
            }

            const newActivities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

            if (isMore) {
                activities.value = [...activities.value, ...newActivities]
            } else {
                activities.value = newActivities
            }

            lastDoc.value = snapshot.docs[snapshot.docs.length - 1]

            // 만약 가져온 개수가 요청한 개수보다 적으면 더 이상 데이터 없음
            if (snapshot.docs.length < pageSize) {
                hasMore.value = false
            }

            // 최대 20개까지만 노출 (사용자 요청 사항)
            if (activities.value.length >= 20) {
                hasMore.value = false
                activities.value = activities.value.slice(0, 20)
            }

        } catch (err: any) {
            console.error('Fetch activities error:', err)
            error.value = '활동 소식을 불러오는 중 오류가 발생했습니다.'
        } finally {
            loading.value = false
        }
    }

    return {
        activities,
        loading,
        error,
        hasMore,
        fetchActivities
    }
}
