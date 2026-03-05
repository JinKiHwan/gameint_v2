import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp, increment 
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export const useBoard = () => {
  const nuxtApp = useNuxtApp()
  
  const getDb = () => {
    const fb = nuxtApp.$firebase as any
    if (!fb) throw new Error('Firebase client-only plugin not loaded yet.')
    return fb.firestore
  }

  const getStorage = () => {
    const fb = nuxtApp.$firebase as any
    if (!fb) throw new Error('Firebase client-only plugin not loaded yet.')
    return fb.storage
  }
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 1. 게시글 목록조회 (카테고리 필터 지원)
  const fetchPosts = async (category: string = '전체') => {
    loading.value = true
    error.value = null
    try {
      const postsRef = collection(getDb(), 'posts')
      let q = query(postsRef, orderBy('createdAt', 'desc'))
      
      if (category !== '전체') {
        q = query(postsRef, where('category', '==', category), orderBy('createdAt', 'desc'))
      }

      const snapshot = await getDocs(q)
      const posts = snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
      }))
      return posts
    } catch (err: any) {
      console.error('Fetch posts error:', err)
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
      await deleteDoc(docRef)
      return true
    } catch (err: any) {
      console.error('Delete post error:', err)
      error.value = '게시글 삭제에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 6. 이미지 업로드 (브라우저 압축 후 스토리지 업로드)
  const uploadImage = async (file: File): Promise<string> => {
    try {
      // import imageCompression dynamically to avoid SSR crashes since it uses window object
      const imageLib = await import('browser-image-compression')
      const imageCompression = imageLib.default || imageLib

      // 1. 이미지 압축 (최대 1MB, 권장 가로사이즈 1920)
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      const compressedFile = await imageCompression(file, options)
      
      // 2. Firebase Storage 업로드 (경로: board_images/timestamp_filename)
      const filename = `board_images/${Date.now()}_${compressedFile.name}`
      const fileRef = storageRef(getStorage(), filename)
      
      const snapshot = await uploadBytes(fileRef, compressedFile)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (err) {
      console.error('Image upload/compression error:', err)
      throw new Error('이미지 처리 중 오류가 발생했습니다.')
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
    uploadImage
  }
}
