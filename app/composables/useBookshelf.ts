import { ref } from 'vue'
import { useNuxtApp } from '#app'
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, limit
} from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'

export type BookStatus = 'available' | 'requested' | 'rented'

export interface BookshelfItem {
  id?: string
  ownerUid: string
  ownerNickname: string
  ownerProfileImageId: string
  book: {
    title: string
    authors: string[]
    publisher: string
    thumbnail: string
    isbn: string
  }
  memo: string
  status: BookStatus
  borrowerUid: string | null
  borrowerNickname: string | null
  requestedAt: any
  rentedAt: any
  createdAt: any
  updatedAt: any
}

export const useBookshelf = () => {
  const nuxtApp = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(false)
  const getDb = () => {
    const fb = nuxtApp.$firebase as any
    if (!fb) throw new Error('Firebase not loaded')
    return fb.firestore
  }

  // ── 알림 발송 유틸 ────────────────────────────────────────────────
  const sendNotification = async (recipientId: string, type: string, title: string, message: string) => {
    try {
      const ref = collection(getDb(), 'users', recipientId, 'notifications')
      await addDoc(ref, {
        type,
        title,
        message,
        isRead: false,
        createdAt: serverTimestamp(),
        recipientId // 필터링용
      })
    } catch (err) {
      console.error('Failed to send notification:', err)
    }
  }

  // ── 전체 책 목록 조회 ──────────────────────────────────────────────
  const fetchAllBooks = async () => {
    loading.value = true
    try {
      const ref = collection(getDb(), 'bookshelf')
      const q = query(ref, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BookshelfItem[]
    } catch (err) {
      console.error('Fetch bookshelf error:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // ── 내 책 목록 조회 ────────────────────────────────────────────────
  const fetchMyBooks = async () => {
    const uid = authStore.user?.uid
    if (!uid) return []
    try {
      const ref = collection(getDb(), 'bookshelf')
      const q = query(ref, where('ownerUid', '==', uid), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BookshelfItem[]
    } catch (err) {
      console.error('Fetch my books error:', err)
      return []
    }
  }

  // ── 책 등록 ────────────────────────────────────────────────────────
  const addBook = async (book: any, memo: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const data: Partial<BookshelfItem> = {
      ownerUid: uid,
      ownerNickname: authStore.userData?.nickname || '익명',
      ownerProfileImageId: authStore.userData?.profileImageId || 'avatar_bronze_01',
      book: {
        title: book.title,
        authors: book.authors || [],
        publisher: book.publisher || '',
        thumbnail: book.thumbnail || '',
        isbn: book.isbn || '',
      },
      memo,
      status: 'available',
      borrowerUid: null,
      borrowerNickname: null,
      requestedAt: null,
      rentedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(getDb(), 'bookshelf'), data)
    return docRef.id
  }

  // ── 책 삭제 (소유자만) ─────────────────────────────────────────────
  const removeBook = async (bookId: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const docRef = doc(getDb(), 'bookshelf', bookId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error('존재하지 않는 책입니다.')
    if (snap.data().ownerUid !== uid) throw new Error('본인의 책만 삭제할 수 있습니다.')
    if (snap.data().status === 'rented') throw new Error('대여 중인 책은 삭제할 수 없습니다.')
    await deleteDoc(docRef)
  }

  // ── 대여 신청 ──────────────────────────────────────────────────────
  const requestRental = async (bookId: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const docRef = doc(getDb(), 'bookshelf', bookId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error('존재하지 않는 책입니다.')
    const data = snap.data()
    if (data.ownerUid === uid) throw new Error('본인의 책은 대여 신청할 수 없습니다.')
    if (data.status !== 'available') throw new Error('현재 대여 가능한 상태가 아닙니다.')
    await updateDoc(docRef, {
      status: 'requested',
      borrowerUid: uid,
      borrowerNickname: authStore.userData?.nickname || '익명',
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    // 소유자에게 알림
    await sendNotification(
      data.ownerUid,
      'BOOK_RENTAL',
      '📖 대여 신청 알림',
      `[${data.book.title}] 책에 대한 대여 신청이 들어왔습니다!`
    )
  }

  // ── 대여 수락 (소유자만) ───────────────────────────────────────────
  const acceptRental = async (bookId: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const docRef = doc(getDb(), 'bookshelf', bookId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error('존재하지 않는 책입니다.')
    if (snap.data().ownerUid !== uid) throw new Error('소유자만 대여를 수락할 수 있습니다.')
    if (snap.data().status !== 'requested') throw new Error('대여 신청 상태가 아닙니다.')
    await updateDoc(docRef, {
      status: 'rented',
      rentedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    // 신청자에게 알림
    const data = snap.data()
    if (data.borrowerUid) {
      await sendNotification(
        data.borrowerUid,
        'BOOK_RENTAL',
        '✅ 대여 수락 알림',
        `[${data.book.title}] 대여 신청이 수락되었습니다! 즐거운 독서 되세요.`
      )
    }
  }

  // ── 대여 거절 (소유자만) ───────────────────────────────────────────
  const rejectRental = async (bookId: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const docRef = doc(getDb(), 'bookshelf', bookId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error('존재하지 않는 책입니다.')
    if (snap.data().ownerUid !== uid) throw new Error('소유자만 대여를 거절할 수 있습니다.')
    if (snap.data().status !== 'requested') throw new Error('대여 신청 상태가 아닙니다.')
    await updateDoc(docRef, {
      status: 'available',
      borrowerUid: null,
      borrowerNickname: null,
      requestedAt: null,
      updatedAt: serverTimestamp(),
    })
    // 신청자에게 알림
    const data = snap.data()
    if (data.borrowerUid) {
      await sendNotification(
        data.borrowerUid,
        'BOOK_RENTAL',
        '❌ 대여 거절 알림',
        `아쉽게도 [${data.book.title}] 대여 신청이 거절되었습니다.`
      )
    }
  }

  // ── 반납 완료 (소유자만) ───────────────────────────────────────────
  const returnBook = async (bookId: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const docRef = doc(getDb(), 'bookshelf', bookId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error('존재하지 않는 책입니다.')
    if (snap.data().ownerUid !== uid) throw new Error('소유자만 반납 처리할 수 있습니다.')
    if (snap.data().status !== 'rented') throw new Error('대여 중인 상태가 아닙니다.')
    await updateDoc(docRef, {
      status: 'available',
      borrowerUid: null,
      borrowerNickname: null,
      requestedAt: null,
      rentedAt: null,
      updatedAt: serverTimestamp(),
    })
    // 대여자에게 알림
    const data = snap.data()
    if (data.borrowerUid) {
      await sendNotification(
        data.borrowerUid,
        'BOOK_RENTAL',
        '📚 반납 완료 알림',
        `[${data.book.title}] 반납 확인이 완료되었습니다. 감사합니다!`
      )
    }
  }

  // ── 대여 신청 취소 (신청자만) ──────────────────────────────────────
  const cancelRequest = async (bookId: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const docRef = doc(getDb(), 'bookshelf', bookId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error('존재하지 않는 책입니다.')
    if (snap.data().borrowerUid !== uid) throw new Error('본인의 신청만 취소할 수 있습니다.')
    if (snap.data().status !== 'requested') throw new Error('신청 상태가 아닙니다.')
    await updateDoc(docRef, {
      status: 'available',
      borrowerUid: null,
      borrowerNickname: null,
      requestedAt: null,
      updatedAt: serverTimestamp(),
    })
  }

  // ── 반납 신청 (대여자만) ──────────────────────────────────────────
  const requestReturn = async (bookId: string) => {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('로그인이 필요합니다.')
    const docRef = doc(getDb(), 'bookshelf', bookId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) throw new Error('존재하지 않는 책입니다.')
    if (snap.data().borrowerUid !== uid) throw new Error('대여자만 반납을 신청할 수 있습니다.')
    if (snap.data().status !== 'rented') throw new Error('대여 중인 상태가 아닙니다.')

    // 소유자에게 알림 발송
    const data = snap.data()
    await sendNotification(
      data.ownerUid,
      'BOOK_RENTAL',
      '↩️ 반납 신청 알림',
      `[${data.book.title}] 도서에 대한 반납 신청이 도착했습니다. 반납을 확인해주세요!`
    )
  }

  return {
    loading,
    fetchAllBooks,
    fetchMyBooks,
    addBook,
    removeBook,
    requestRental,
    acceptRental,
    rejectRental,
    returnBook,
    cancelRequest,
    requestReturn,
  }
}
