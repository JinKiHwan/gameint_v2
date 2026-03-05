import { ref } from 'vue'
import { useNuxtApp } from '#app'
import {
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
    query, orderBy, serverTimestamp, increment, setDoc
} from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'

export const useCycle = () => {
    const nuxtApp = useNuxtApp()
    const authStore = useAuthStore()

    const getDb = () => {
        const fb = nuxtApp.$firebase as any
        if (!fb) throw new Error('Firebase client-only plugin not loaded yet.')
        return fb.firestore
    }

    const loading = ref(false)
    const error = ref<string | null>(null)

    // ── 활성 사이클 조회 ─────────────────────────────────────────────
    const fetchActiveCycle = async () => {
        loading.value = true
        error.value = null
        try {
            const cyclesRef = collection(getDb(), 'cycles')
            const q = query(cyclesRef, orderBy('createdAt', 'desc'))
            const snapshot = await getDocs(q)
            const cycles = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
            // closed가 아닌 첫 번째 사이클 반환
            const active = cycles.find((c: any) => c.phase !== 'closed')
            return active || null
        } catch (err: any) {
            console.error('Fetch cycle error:', err)
            error.value = '사이클 정보를 불러오는데 실패했습니다.'
            return null
        } finally {
            loading.value = false
        }
    }

    // ── 사이클 생성 (마스터 전용) ──────────────────────────────────────
    const createCycle = async (data: {
        keyword: string
        description: string
        heroImageUrl: string
        phase1Start: string
        phase1End: string
        phase2Start: string
        phase2End: string
    }) => {
        const cycleData = {
            ...data,
            phase: 'phase1_reading',
            commonBook: null,
            commonBookRecommenderUid: null,
            createdAt: serverTimestamp(),
        }
        const ref = await addDoc(collection(getDb(), 'cycles'), cycleData)
        return ref.id
    }

    // ── 사이클 Phase 변경 (마스터 전용) ────────────────────────────────
    const updateCyclePhase = async (cycleId: string, phase: string, extraData?: any) => {
        await updateDoc(doc(getDb(), 'cycles', cycleId), { phase, ...extraData })
    }

    // ── 참여자 (책 등록) 조회 ────────────────────────────────────────
    const fetchParticipants = async (cycleId: string) => {
        try {
            const ref = collection(getDb(), 'cycles', cycleId, 'participants')
            const q = query(ref, orderBy('createdAt', 'asc'))
            const snapshot = await getDocs(q)
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
        } catch (err) {
            console.error('Fetch participants error:', err)
            return []
        }
    }

    // ── 책 등록 ───────────────────────────────────────────────────────
    const registerBook = async (cycleId: string, book: any, reason: string) => {
        const uid = authStore.user?.uid
        if (!uid) throw new Error('로그인이 필요합니다.')
        const data = {
            uid,
            nickname: authStore.userData?.nickname || '익명',
            profileImageId: authStore.userData?.profileImageId || 'avatar_bronze_01',
            book,
            reason,
            voteCount: 0,
            hasReviewed: false,
            createdAt: serverTimestamp(),
        }
        // uid를 문서 ID로 사용 (1인 1책)
        await setDoc(doc(getDb(), 'cycles', cycleId, 'participants', uid), data)
    }

    // ── 내 참여 정보 조회 ──────────────────────────────────────────────
    const fetchMyParticipation = async (cycleId: string) => {
        const uid = authStore.user?.uid
        if (!uid) return null
        try {
            const d = await getDoc(doc(getDb(), 'cycles', cycleId, 'participants', uid))
            return d.exists() ? { id: d.id, ...d.data() } : null
        } catch (err) {
            return null
        }
    }

    // ── 투표 ──────────────────────────────────────────────────────────
    const castVote = async (cycleId: string, targetUid: string) => {
        const uid = authStore.user?.uid
        if (!uid) throw new Error('로그인이 필요합니다.')
        // 내 투표 기록
        await setDoc(doc(getDb(), 'cycles', cycleId, 'votes', uid), { targetUid, votedAt: serverTimestamp() })
        // 득표수 +1
        await updateDoc(doc(getDb(), 'cycles', cycleId, 'participants', targetUid), {
            voteCount: increment(1)
        })
    }

    // ── 내 투표 조회 ───────────────────────────────────────────────────
    const fetchMyVote = async (cycleId: string) => {
        const uid = authStore.user?.uid
        if (!uid) return null
        try {
            const d = await getDoc(doc(getDb(), 'cycles', cycleId, 'votes', uid))
            return d.exists() ? d.data() : null
        } catch {
            return null
        }
    }

    // ── 투표 결과 → 공통도서 확정 (마스터 전용) ─────────────────────────
    const confirmCommonBook = async (cycleId: string, participants: any[]) => {
        const top = [...participants].sort((a, b) => b.voteCount - a.voteCount)[0]
        if (!top) return
        await updateDoc(doc(getDb(), 'cycles', cycleId), {
            phase: 'phase2_reading',
            commonBook: top.book,
            commonBookRecommenderUid: top.uid,
        })
    }

    // ── 리뷰 목록 조회 ────────────────────────────────────────────────
    const fetchReviews = async (cycleId: string) => {
        try {
            const ref = collection(getDb(), 'cycles', cycleId, 'reviews')
            const q = query(ref, orderBy('createdAt', 'desc'))
            const snapshot = await getDocs(q)
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
        } catch (err) {
            console.error('Fetch reviews error:', err)
            return []
        }
    }

    // ── 리뷰 등록 ─────────────────────────────────────────────────────
    const submitReview = async (cycleId: string, rating: number, content: string, phase: string) => {
        const uid = authStore.user?.uid
        if (!uid) throw new Error('로그인이 필요합니다.')
        await addDoc(collection(getDb(), 'cycles', cycleId, 'reviews'), {
            authorUid: uid,
            nickname: authStore.userData?.nickname || '익명',
            profileImageId: authStore.userData?.profileImageId || 'avatar_bronze_01',
            rating,
            content,
            phase,
            createdAt: serverTimestamp(),
        })
        // 참여자 리뷰 완료 표시
        try {
            await updateDoc(doc(getDb(), 'cycles', cycleId, 'participants', uid), { hasReviewed: true })
        } catch { }
    }

    // ── 내 리뷰 조회 ──────────────────────────────────────────────────
    const fetchMyReview = async (cycleId: string) => {
        const uid = authStore.user?.uid
        if (!uid) return null
        try {
            const snapshot = await getDocs(collection(getDb(), 'cycles', cycleId, 'reviews'))
            const myReview = snapshot.docs.find(d => d.data().authorUid === uid)
            return myReview ? { id: myReview.id, ...myReview.data() } : null
        } catch {
            return null
        }
    }

    // ── 모임 기록 조회 ────────────────────────────────────────────────
    const fetchMeetingRecords = async (cycleId: string) => {
        try {
            const ref = collection(getDb(), 'cycles', cycleId, 'meetings')
            const q = query(ref, orderBy('createdAt', 'desc'))
            const snapshot = await getDocs(q)
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
        } catch (err) {
            console.error('Fetch meetings error:', err)
            return []
        }
    }

    // ── 모임 기록 작성 (마스터 전용) ───────────────────────────────────
    const addMeetingRecord = async (cycleId: string, title: string, content: string) => {
        await addDoc(collection(getDb(), 'cycles', cycleId, 'meetings'), {
            title,
            content,
            authorUid: authStore.user?.uid,
            authorNickname: authStore.userData?.nickname || '마스터',
            createdAt: serverTimestamp(),
        })
    }

    return {
        loading, error,
        fetchActiveCycle, createCycle, updateCyclePhase,
        fetchParticipants, registerBook, fetchMyParticipation,
        castVote, fetchMyVote, confirmCommonBook,
        fetchReviews, submitReview, fetchMyReview,
        fetchMeetingRecords, addMeetingRecord,
    }
}
