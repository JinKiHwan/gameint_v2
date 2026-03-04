import { defineStore } from 'pinia'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  type User 
} from 'firebase/auth'
import { getDoc, doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    userData: null as any, // Firestore user document
    isInitialized: false,
  }),
  actions: {
    initAuth() {
      if (this.isInitialized) return
      
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore

      onAuthStateChanged(auth, async (firebaseUser) => {
        this.user = firebaseUser
        
        if (firebaseUser) {
          try {
            const userDocRef = doc(firestore, 'users', firebaseUser.uid)
            const userDocSnap = await getDoc(userDocRef)
            
            if (userDocSnap.exists()) {
              this.userData = userDocSnap.data()
            } else {
               this.userData = null
            }
          } catch (e) {
            console.error("Failed to fetch user data", e)
          }
        } else {
          this.userData = null
        }
        this.isInitialized = true
      })
    },

    async checkIdDuplicate(username: string) {
      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore
      
      const usersRef = collection(firestore, 'users')
      const q = query(usersRef, where('username', '==', username))
      const querySnapshot = await getDocs(q)
      
      return !querySnapshot.empty // true 면 중복
    },

    // 사용자는 username(커스텀 ID)을 입력하지만 파이어베이스 Auth는 이메일을 요구하므로
    // Firestore에서 username으로 email을 찾아 인증합니다.
    async login(username: string, password: string) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore

      // 1. 커스텀 ID(username)로 가입된 이메일 찾기
      const usersRef = collection(firestore, 'users')
      const q = query(usersRef, where('username', '==', username))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        throw new Error('존재하지 않는 아이디입니다.')
      }

      const userDoc = querySnapshot.docs[0]?.data()
      const mappedEmail = userDoc?.email

      if (!mappedEmail) {
        throw new Error('계정 정보를 불러오는데 실패했습니다.')
      }

      // 2. 찾아낸 이메일로 Firebase Auth 로그인 시도
      try {
        await signInWithEmailAndPassword(auth, mappedEmail, password)
        return true
      } catch (error: any) {
        throw new Error('비밀번호가 일치하지 않거나 오류가 발생했습니다.')
      }
    },

    async signup(payload: { email: string, username: string, password: string, realName: string, nickname: string }) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore

      // 1. Firebase Auth 계정 생성
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password)
        const user = userCredential.user

        // 2. Firestore에 회원 정보 저장
        const newUserData = {
          uid: user.uid,
          username: payload.username,
          email: payload.email,
          realName: payload.realName,
          nickname: payload.nickname,
          profileImageId: 'avatar_bronze_01', 
          tier: 'Bronze',
          exp: 0,
          dnaTitle: '아직 데이터가 부족해요',
          role: 'user', // Default role
          status: 'pending', // Waiting for master approval
          createdAt: serverTimestamp()
        }
        
        const userDocRef = doc(firestore, 'users', user.uid)
        await setDoc(userDocRef, newUserData)
        this.userData = newUserData

        return true
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
           throw new Error('이미 가입된 회사 이메일입니다.')
        }
        console.error('Signup error:', error)
        throw new Error('회원가입 처리 중 오류가 발생했습니다.')
      }
    },

    async logout() {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      
      try {
        await signOut(auth)
        this.user = null
        this.userData = null
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
  }
})
