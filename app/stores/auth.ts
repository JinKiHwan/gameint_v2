import { defineStore } from 'pinia'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'

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
            // Fetch extra user data from Firestore (denormalized config)
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
    }
  }
})
