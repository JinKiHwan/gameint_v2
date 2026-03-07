export default defineNuxtRouteMiddleware(async (to, from) => {
  // SSR 환경에서는 Firebase SDK가 초기화되지 않으므로 건너뜁니다
  if (import.meta.server) return

  const { $firebase } = useNuxtApp()
  const auth = ($firebase as any).auth

  // Wait for auth to initialize if it hasn't already
  await new Promise<void>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      unsubscribe()
      resolve()
    })
  })

  const publicPages = ['/', '/login', '/signup', '/reset-password']

  // Check if current path matches any public page (allowing trailing slashes)
  const isPublicPage = publicPages.some(page => to.path === page || to.path === `${page}/`)

  // Redirect unauthenticated users to login page
  if (!auth.currentUser && !isPublicPage) {
    return navigateTo('/login')
  }

  // Redirect authenticated users away from login page
  if (auth.currentUser && to.path === '/login') {
    return navigateTo('/')
  }

  // ── Pending User Protection ──
  // If logged in but status is 'pending', only allow access to the home page ('/')
  // This prevents direct URL access to internal pages like /cycles, /board, etc.
  const authStore = useAuthStore()
  if (auth.currentUser && !isMasterPage) {
    // We need to check userData which is fetched in initAuth (App.vue)
    // For pending users, we only allow='/' and logout (done via home page)
    if (authStore.userData?.status === 'pending' && to.path !== '/') {
      return navigateTo('/')
    }
  }
})
