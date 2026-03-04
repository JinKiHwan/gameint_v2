import { defineStore } from 'pinia'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
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

    async login(username: string, password: string) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore

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

      try {
        await signInWithEmailAndPassword(auth, mappedEmail, password)
        return true
      } catch (error: any) {
        throw new Error('비밀번호가 일치하지 않거나 오류가 발생했습니다.')
      }
    },

    // 1. 회원가입용 인증 메일 발송
    async sendSignupEmailLink(email: string) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth

      const actionCodeSettings = {
        url: window.location.origin + '/signup',
        handleCodeInApp: true,
      }

      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', email)
    },

    // 2. 이메일 링크 인증 처리
    async verifyEmailLink(url: string) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth

      if (isSignInWithEmailLink(auth, url)) {
        let email = window.localStorage.getItem('emailForSignIn')
        if (!email) {
          throw new Error('브라우저 환경이 변경되어 이메일 정보가 유실되었습니다. 동일한 이메일을 다시 입력해주세요.')
        }
        
        try {
          const result = await signInWithEmailLink(auth, email, url)
          window.localStorage.removeItem('emailForSignIn')
          return result.user
        } catch (error) {
           throw new Error('만료되었거나 유효하지 않은 인증 링크입니다.')
        }
      }
      return null
    },

    // 3. 비밀번호 업데이트 및 Firestore 계정 생성
    async signup(payload: { username: string, password: string, realName: string, nickname: string }) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore
      
      const user = auth.currentUser
      if (!user) throw new Error('이메일 인증이 완료되지 않았습니다.')

      try {
        // 비밀번호 설정 (초기 회원가입이므로)
        await updatePassword(user, payload.password)

        // Firestore에 회원 정보 저장
        const newUserData = {
          uid: user.uid,
          username: payload.username,
          email: user.email,
          realName: payload.realName,
          nickname: payload.nickname,
          profileImageId: 'avatar_bronze_01', 
          tier: 'Bronze',
          exp: 0,
          dnaTitle: '아직 데이터가 부족해요',
          role: 'user', 
          status: 'pending', 
          createdAt: serverTimestamp()
        }
        
        const userDocRef = doc(firestore, 'users', user.uid)
        await setDoc(userDocRef, newUserData)
        this.userData = newUserData

        return true
      } catch (error: any) {
        console.error('Signup profile error:', error)
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
