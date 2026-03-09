import { defineStore } from 'pinia'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  confirmPasswordReset,
  signOut,
  type User
} from 'firebase/auth'
import { getDoc, doc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    userData: null as any, // Firestore user document
    isInitialized: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isMaster: (state) => state.userData?.role === 'master',
  },
  actions: {
    initAuth() {
      if (this.isInitialized) return

      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore

      onAuthStateChanged(auth, async (firebaseUser) => {
        this.user = firebaseUser

        if (firebaseUser) {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid)

          // 실시간 데이터 구독 (경험치, 레벨 등 실시간 반영을 위해)
          onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const newData = docSnap.data()
              this.userData = newData
            } else {
              this.userData = null
            }
          })
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

    // 회원가입: Firebase Auth 사용자 생성 및 Firestore 보류(pending) 상태 저장
    async signup(payload: { username: string, email: string, password: string, realName: string, nickname: string, securityQuestion: string, securityAnswer: string }) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore

      try {
        // 1. Firebase Auth에 이메일/비밀번호로 사용자 생성
        const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password)
        const user = userCredential.user

        // 2. Firestore에 회원 정보 저장 (status: pending 부여)
        const newUserData = {
          uid: user.uid,
          username: payload.username,
          email: payload.email,
          realName: payload.realName,
          nickname: payload.nickname,
          profileImageId: 'avatar_bronze_01',
          tier: 'Bronze',
          exp: 0,
          level: 1,
          dnaTitle: '아직 데이터가 부족해요',
          expTracker: {
            lastAttendanceDate: '',
            lastRewardedDate: '',
            lastPostDate: '',
            lastRecommendBookDate: '',
            commentCountToday: 0,
            lastCommentDate: '',
          },
          role: 'user',
          status: 'pending',
          securityQuestion: payload.securityQuestion,
          securityAnswer: payload.securityAnswer,
          createdAt: serverTimestamp()
        }

        const userDocRef = doc(firestore, 'users', user.uid)
        await setDoc(userDocRef, newUserData)
        this.userData = newUserData

        return true
      } catch (error: any) {
        console.error('Signup profile error:', error)
        if (error.code === 'auth/email-already-in-use') {
          throw new Error('이미 가입된 회사 이메일입니다.')
        }
        throw new Error('회원가입 처리 중 오류가 발생했습니다.')
      }
    },

    // 4. 아이디 찾기 (이메일 + 가입시 등록한 질문/답변 교차검증)
    async findIdByEmail(securityQuestion: string, securityAnswer: string, email: string) {
      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      const usersRef = collection(firestore, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty || !querySnapshot.docs[0]) {
        throw new Error('해당 이메일로 가입된 계정이 없습니다.')
      }

      const userDoc = querySnapshot.docs[0].data()
      if (userDoc.securityQuestion !== securityQuestion || userDoc.securityAnswer !== securityAnswer) {
        throw new Error('입력하신 답변이 가입 정보와 일치하지 않습니다.')
      }

      return userDoc.username
    },

    // 5. 비밀번호 재설정 이메일 발송 (아이디+이메일+질문/답변 교차검증)
    async sendPasswordReset(username: string, securityQuestion: string, securityAnswer: string, email: string) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth
      const firestore = ($firebase as any).firestore

      try {
        // 1. Firestore에서 해당 이메일의 유저 정보 조회
        const usersRef = collection(firestore, 'users')
        const q = query(usersRef, where('email', '==', email))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty || !querySnapshot.docs[0]) {
          throw new Error('해당 이메일로 가입된 계정이 없습니다.')
        }

        // 2. 입력한 인증 정보와 DB 교차 검증
        const userDoc = querySnapshot.docs[0].data()
        if (userDoc.username !== username || userDoc.securityQuestion !== securityQuestion || userDoc.securityAnswer !== securityAnswer) {
          throw new Error('입력하신 정보가 계정 정보와 일치하지 않습니다.')
        }

        // 3. 검증 통과 시 재설정 메일 발송
        const actionCodeSettings = {
          url: window.location.origin + '/reset-password',
          handleCodeInApp: false
        }
        await sendPasswordResetEmail(auth, email, actionCodeSettings)
        return true
      } catch (error: any) {
        console.error('Password reset error:', error)
        if (error.code === 'auth/user-not-found') {
          throw new Error('해당 이메일로 가입된 계정이 없습니다.')
        }
        // Firestore 등에서 던진 커스텀 에러는 그대로 전달
        if (error.message) throw error
        throw new Error('비밀번호 재설정 메일 발송 중 오류가 발생했습니다.')
      }
    },

    // 5-1. 비밀번호 재설정 확인 (이메일 링크 클릭 후 코드와 새 비밀번호로 업데이트)
    async confirmResetPassword(oobCode: string, newPassword: string) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth

      try {
        await confirmPasswordReset(auth, oobCode, newPassword)
        return true
      } catch (error: any) {
        console.error('Confirm reset password error:', error)
        if (error.code === 'auth/expired-action-code') {
          throw new Error('만료된 링크입니다. 비밀번호 찾기를 다시 진행해주세요.')
        }
        if (error.code === 'auth/invalid-action-code') {
          throw new Error('유효하지 않은 링크입니다.')
        }
        throw new Error('비밀번호 변경 중 오류가 발생했습니다.')
      }
    },

    // 6. 마이페이지에서 비밀번호 변경 (로그인 된 상태)
    async changePassword(newPassword: string) {
      const { $firebase } = useNuxtApp()
      const auth = ($firebase as any).auth

      const user = auth.currentUser
      if (!user) throw new Error('로그아웃 상태입니다.')

      try {
        await updatePassword(user, newPassword)
        return true
      } catch (error: any) {
        console.error('Change password error:', error)
        if (error.code === 'auth/requires-recent-login') {
          throw new Error('보안을 위해 다시 로그인한 후 변경해주세요.')
        }
        throw new Error('비밀번호 변경 중 오류가 발생했습니다.')
      }
    },

    async updateNickname(newNickname: string) {
      if (!this.user || !this.userData) throw new Error('로그아웃 상태입니다.')

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      try {
        const uid = this.user.uid

        // ── 1. users 문서만 업데이트 (게시글/댓글은 프론트엔드에서 매핑 처리) ──
        const userDocRef = doc(firestore, 'users', uid)
        await updateDoc(userDocRef, {
          nickname: newNickname,
          updatedAt: serverTimestamp()
        })

        // ── 2. 로컬 상태 업데이트 ──
        this.userData.nickname = newNickname
        return true
      } catch (error: any) {
        console.error('Update nickname error:', error)
        throw new Error('닉네임 변경 중 오류가 발생했습니다.')
      }
    },

    async updateProfileImage(newImageId: string) {
      if (!this.user || !this.userData) throw new Error('로그아웃 상태입니다.')

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      try {
        const uid = this.user.uid

        // ── 1. users 문서만 업데이트 ──
        const userDocRef = doc(firestore, 'users', uid)
        await updateDoc(userDocRef, {
          profileImageId: newImageId,
          updatedAt: serverTimestamp()
        })

        // ── 2. 로컬 상태 업데이트 ──
        this.userData.profileImageId = newImageId
        return true
      } catch (error: any) {
        console.error('Update profile image error:', error)
        throw new Error('프로필 이미지 변경 중 오류가 발생했습니다.')
      }
    },

    async checkAttendance() {
      if (!this.user || !this.userData) throw new Error('로그아웃 상태입니다.')

      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore

      // KST 오늘 날짜 구하기
      const getKstDate = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const kstOffset = 9 * 60 * 60 * 1000;
        return new Date(utc + kstOffset).toISOString().split("T")[0];
      };
      const today = getKstDate();

      if (this.userData.expTracker?.lastAttendanceDate === today) {
        throw new Error('오늘의 출석은 이미 완료되었습니다.')
      }

      try {
        const uid = this.user.uid
        const userDocRef = doc(firestore, 'users', uid)

        // 오직 날짜만 업데이트 (EXP는 백엔드 트리거가 처리)
        await updateDoc(userDocRef, {
          'expTracker.lastAttendanceDate': today,
          updatedAt: serverTimestamp()
        })

        return true
      } catch (error: any) {
        console.error('Check attendance error:', error)
        throw new Error('출석 체크 중 오류가 발생했습니다.')
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
    },

    // ── 멤버 관리 ────────────────────────────────────────────────────

    // 전체 멤버 목록 조회
    async fetchAllUsers() {
      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore
      try {
        const usersRef = collection(firestore, 'users')
        const q = query(usersRef, where('status', 'in', ['active', 'pending']))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(d => d.data())
      } catch (error) {
        console.error('Fetch all users error:', error)
        throw new Error('멤버 목록을 불러오는데 실패했습니다.')
      }
    },

    // 멤버 승인 (status: pending -> active)
    async updateUserStatus(uid: string, status: string) {
      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore
      try {
        const userRef = doc(firestore, 'users', uid)
        await updateDoc(userRef, { status, updatedAt: serverTimestamp() })
        return true
      } catch (error) {
        console.error('Update user status error:', error)
        throw new Error('상태 변경에 실패했습니다.')
      }
    },

    // 멤버 탈퇴/삭제 (status: active/pending -> withdrawn)
    async removeUser(uid: string) {
      const { $firebase } = useNuxtApp()
      const firestore = ($firebase as any).firestore
      try {
        const userRef = doc(firestore, 'users', uid)
        // 실제 삭제대신 status 변경 (안전성 고려)
        await updateDoc(userRef, { status: 'withdrawn', updatedAt: serverTimestamp() })
        return true
      } catch (error) {
        console.error('Remove user error:', error)
        throw new Error('멤버 삭제에 실패했습니다.')
      }
    }
  }
})

//force HMR test
