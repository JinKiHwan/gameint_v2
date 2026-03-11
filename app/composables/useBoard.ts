import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp, increment, writeBatch, limit
} from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'

export const useBoard = () => {
  const nuxtApp = useNuxtApp()
  
  const getDb = () => {
    const fb = nuxtApp.$firebase as any
    if (!fb) throw new Error('Firebase client-only plugin not loaded yet.')
    return fb.firestore
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  // 1. 게시글 목록조회 (카테고리 필터 및 리밋 지원)
  const fetchPosts = async (category: string = '전체', fetchLimit: number = 0) => {
    loading.value = true
    error.value = null
    try {
      const postsRef = collection(getDb(), 'posts')
      let q = query(postsRef, orderBy('createdAt', 'desc'))
      
      if (category !== '전체') {
        if (fetchLimit > 0) {
          // 카테고리별 정렬된 최신글 조회를 위해 복합 인덱스가 필요함
          q = query(postsRef, where('category', '==', category), orderBy('createdAt', 'desc'), limit(fetchLimit))
        } else {
          q = query(postsRef, where('category', '==', category), orderBy('createdAt', 'desc'))
        }
      } else if (fetchLimit > 0) {
        q = query(postsRef, orderBy('createdAt', 'desc'), limit(fetchLimit))
      }

      const snapshot = await getDocs(q)
      const posts = snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
      }))
      
      // 항상 클라이언트에서 정렬 보장 (복합 인덱스 누락 대비)
      posts.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime()
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      
      return posts
    } catch (err: any) {
      console.error('Fetch posts error:', err)
      error.value = '게시글을 불러오는데 실패했습니다.'
      return []
    } finally {
      loading.value = false
    }
  }

  // 1-1. 특정 유저의 게시글 목록조회 (마이페이지용)
  const fetchUserPosts = async (userId: string) => {
    loading.value = true
    error.value = null
    try {
      const postsRef = collection(getDb(), 'posts')
      const q = query(postsRef, where('author.uid', '==', userId))
      const snapshot = await getDocs(q)
      
      const posts = snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
      }))
      
      // 최신순 정렬 (클라이언트 사이즈)
      posts.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime()
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      
      return posts
    } catch (err: any) {
      console.error('Fetch user posts error:', err)
      error.value = '게시글을 불러오는데 실패했습니다.'
      return []
    } finally {
      loading.value = false
    }
  }

  // 2. 특정 게시글 상세 조회 (+조회수 증가 로직은 여기서 수행하지 않거나 분리)
  const fetchPost = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const docRef = doc(getDb(), 'posts', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (err: any) {
      console.error('Fetch post error:', err)
      error.value = '게시글 상세 정보를 불러오는데 실패했습니다.'
      return null
    } finally {
      loading.value = false
    }
  }

  // 2-1. 조회수 1 증가 (상세 페이지 진입 시 호출)
  const incrementViewCount = async (id: string) => {
    try {
      const docRef = doc(getDb(), 'posts', id)
      await updateDoc(docRef, {
        viewCount: increment(1)
      })
    } catch (err) {
      console.error('Failed to increment view count:', err)
    }
  }

  // 3. 게시글 작성
  const createPost = async (postData: any) => {
    loading.value = true
    error.value = null
    try {
      const postsRef = collection(getDb(), 'posts')
      const docRef = await addDoc(postsRef, {
        ...postData,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        isEdited: false
      })

      // 유저 문서의 postCount 증가 및 로컬 상태 업데이트
      const authStore = useAuthStore()
      if (authStore.user && authStore.user.uid === postData.author?.uid) {
        const userRef = doc(getDb(), 'users', authStore.user.uid)
        await updateDoc(userRef, { postCount: increment(1) })
        if (authStore.userData) {
          authStore.userData.postCount = (authStore.userData.postCount || 0) + 1
        }
      }

      return docRef.id
    } catch (err: any) {
      console.error('Create post error:', err)
      error.value = '게시글 작성에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 4. 게시글 수정
  const updatePost = async (id: string, updateData: any) => {
    loading.value = true
    error.value = null
    try {
      const docRef = doc(getDb(), 'posts', id)
      await updateDoc(docRef, {
        ...updateData,
        isEdited: true
      })
      return true
    } catch (err: any) {
      console.error('Update post error:', err)
      error.value = '게시글 수정에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 5. 게시글 삭제
  const deletePost = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const docRef = doc(getDb(), 'posts', id)
      
      const docSnap = await getDoc(docRef)
      let authorUid = null
      if (docSnap.exists()) {
        authorUid = docSnap.data().author?.uid
      }

      await deleteDoc(docRef)

      if (authorUid) {
        const userRef = doc(getDb(), 'users', authorUid)
        await updateDoc(userRef, { postCount: increment(-1) })
        const authStore = useAuthStore()
        if (authStore.user?.uid === authorUid && authStore.userData) {
          authStore.userData.postCount = Math.max(0, (authStore.userData.postCount || 0) - 1)
        }
      }

      return true
    } catch (err: any) {
      console.error('Delete post error:', err)
      error.value = '게시글 삭제에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 6. 댓글 목록 조회
  const fetchComments = async (postId: string) => {
    try {
      const commentsRef = collection(getDb(), 'posts', postId, 'comments')
      const q = query(commentsRef, orderBy('createdAt', 'asc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err: any) {
      console.error('Fetch comments error:', err)
      throw new Error('댓글을 불러오는데 실패했습니다.')
    }
  }

  // 7. 댓글 작성
  const createComment = async (postId: string, commentData: any) => {
    loading.value = true
    error.value = null
    try {
      const commentsRef = collection(getDb(), 'posts', postId, 'comments')
      
      // 1) 댓글 서브컬렉션에 추가
      const docRef = await addDoc(commentsRef, {
        ...commentData,
        createdAt: serverTimestamp(),
        isEdited: false
      })
      
      // 2) 부모 문서의 commentCount 증가
      const postRef = doc(getDb(), 'posts', postId)
      await updateDoc(postRef, {
        commentCount: increment(1)
      })

      // 3) 유저 문서의 commentCount 증가
      const authStore = useAuthStore()
      if (authStore.user && authStore.user.uid === commentData.author?.uid) {
        const userRef = doc(getDb(), 'users', authStore.user.uid)
        await updateDoc(userRef, { commentCount: increment(1) })
        if (authStore.userData) {
          authStore.userData.commentCount = (authStore.userData.commentCount || 0) + 1
        }
      }
      
      return docRef.id
    } catch (err: any) {
      console.error('Create comment error:', err)
      error.value = '댓글 작성에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 7-1. 댓글 수정
  const updateComment = async (postId: string, commentId: string, content: string) => {
    loading.value = true
    error.value = null
    try {
      const commentRef = doc(getDb(), 'posts', postId, 'comments', commentId)
      await updateDoc(commentRef, {
        content,
        isEdited: true,
        updatedAt: serverTimestamp()
      })
      return true
    } catch (err: any) {
      console.error('Update comment error:', err)
      error.value = '댓글 수정에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 8. 댓글 삭제
  const deleteComment = async (postId: string, commentId: string) => {
    loading.value = true
    error.value = null
    try {
      const commentRef = doc(getDb(), 'posts', postId, 'comments', commentId)
      
      const commentSnap = await getDoc(commentRef)
      let authorUid = null
      if (commentSnap.exists()) {
        authorUid = commentSnap.data().author?.uid
      }

      // 1) 댓글 삭제
      await deleteDoc(commentRef)
      
      // 2) 부모 문서의 commentCount 감소 (0 미만이 되지 않게 조심해야하지만, 로직상 맞출 수 있음. -1 처리)
      const postRef = doc(getDb(), 'posts', postId)
      await updateDoc(postRef, {
        commentCount: increment(-1)
      })

      // 3) 유저 문서의 commentCount 감소
      if (authorUid) {
        const userRef = doc(getDb(), 'users', authorUid)
        await updateDoc(userRef, { commentCount: increment(-1) })
        const authStore = useAuthStore()
        if (authStore.user?.uid === authorUid && authStore.userData) {
          authStore.userData.commentCount = Math.max(0, (authStore.userData.commentCount || 0) - 1)
        }
      }
      
      return true
    } catch (err: any) {
      console.error('Delete comment error:', err)
      error.value = '댓글 삭제에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 9. 좋아요 상태 확인
  const checkUserLiked = async (postId: string, userId: string) => {
    try {
      const likeRef = doc(getDb(), 'posts', postId, 'likes', userId)
      const likeSnap = await getDoc(likeRef)
      return likeSnap.exists()
    } catch (err) {
      console.error('Check like error:', err)
      return false
    }
  }

  // 10. 좋아요 토글 (Batch Write)
  const toggleLike = async (postId: string, userId: string, isCurrentlyLiked: boolean) => {
    try {
      const db = getDb()
      const batch = writeBatch(db)
      
      const likeRef = doc(db, 'posts', postId, 'likes', userId)
      const postRef = doc(db, 'posts', postId)

      if (isCurrentlyLiked) {
        // 좋아요 취소: 문서 삭제 및 좋아요 수 1 감소
        batch.delete(likeRef)
        batch.update(postRef, { likeCount: increment(-1) })
      } else {
        // 좋아요 추가: 문서 생성 및 좋아요 수 1 증가
        batch.set(likeRef, { createdAt: serverTimestamp() })
        batch.update(postRef, { likeCount: increment(1) })
      }

      await batch.commit()
      return !isCurrentlyLiked // 변경된 상태 반환
    } catch (err: any) {
      console.error('Toggle like error:', err)
      throw new Error('좋아요 처리에 실패했습니다.')
    }
  }

  // 11. HOT 게시글 조회 (좋아요 높은 순, 최대 3개)
  const fetchHotPosts = async () => {
    try {
      const postsRef = collection(getDb(), 'posts')
      const q = query(postsRef, orderBy('likeCount', 'desc'), limit(3))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err: any) {
      console.error('Fetch hot posts error:', err)
      return []
    }
  }

  return {
    loading,
    error,
    fetchPosts,
    fetchPost,
    incrementViewCount,
    createPost,
    updatePost,
    deletePost,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    checkUserLiked,
    toggleLike,
    fetchHotPosts,
    fetchUserPosts
  }
}
