import { ref } from 'vue'
import { collection, query, orderBy, limit, startAfter, getDocs, type QueryDocumentSnapshot } from 'firebase/firestore'
import { useNuxtApp } from '#app'

export const useActivityFeed = () => {
    const nuxtApp = useNuxtApp()

    const getDb = () => {
        const fb = nuxtApp.$firebase as any
        if (!fb) return null
        return fb.firestore
    }

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
            const db = getDb()
            if (!db) return

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

            // 실시간 구독 (isMore가 아닐 때만 구독 시작, isMore는 스냅샷 대신 1회성 조회가 일반적이나 
            // 여기서는 단순성을 위해 초기 로드 시만 onSnapshot 적용 고려. 
            // 하지만 Nuxt 환경에서는 복합적인 처리가 필요하므로, 
            // 일단 fetchActivities 호출 시점의 데이터만 실시간으로 받도록 처리)

            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    if (!isMore) {
                        activities.value = []
                        hasMore.value = false
                    }
                    loading.value = false
                    return
                }

                const newActivities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))

                if (isMore) {
                    // 더보기 시 기존 데이터와 병합 (필요 시 중복 제거)
                    const existingIds = new Set(activities.value.map(a => a.id))
                    const filteredNew = newActivities.filter(a => !existingIds.has(a.id))
                    activities.value = [...activities.value, ...filteredNew]
                } else {
                    activities.value = newActivities
                }

                lastDoc.value = snapshot.docs[snapshot.docs.length - 1] as QueryDocumentSnapshot

                if (snapshot.docs.length < pageSize) {
                    hasMore.value = false
                }
                loading.value = false
            }, (err: any) => {
                console.error('onSnapshot error:', err)
                error.value = '활동 소식을 불러오는 중 오류가 발생했습니다.'
                loading.value = false
            })

            // Store unsubscribe for cleanup if needed, but for now we let it run
            // In a real app, you'd handle unmounting in onUnmounted
            return unsubscribe

        } catch (err: any) {
            console.error('Fetch activities error:', err)
            error.value = '활동 소식을 불러오는 중 오류가 발생했습니다.'
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
