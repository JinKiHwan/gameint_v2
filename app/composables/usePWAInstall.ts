import { ref, onMounted } from 'vue'

export const usePWAInstall = () => {
  const installEvent = ref<any>(null)
  const isInstallable = ref(false)
  const isPWA = ref(false)
  const isIOS = ref(false)
  const showInstallBanner = ref(false)

  onMounted(() => {
    // 1. 현재 PWA 모드(Standalone)인지 확인
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      isPWA.value = true
    }

    // 2. iOS 여부 확인 (Safari에서의 수동 설치 가이드 제공용)
    const ua = window.navigator.userAgent
    const isIPad = !!ua.match(/iPad/i)
    const isIPhone = !!ua.match(/iPhone/i)
    isIOS.value = isIPad || isIPhone

    // 3. Android/Chrome 설치 이벤트 리스너 (beforeinstallprompt)
    window.addEventListener('beforeinstallprompt', (e) => {
      // 브라우저 기본 설치 팝업 방지
      e.preventDefault()
      // 이벤트 저장 후 커스텀 UI 노출용으로 사용
      installEvent.value = e
      isInstallable.value = true
      
      // 이미 PWA가 아니라면 배너 노출 결정
      if (!isPWA.value) {
        showInstallBanner.value = true
      }
    })

    // 4. 앱이 설치되었을 때 이벤트
    window.addEventListener('appinstalled', () => {
      isPWA.value = true
      isInstallable.value = false
      showInstallBanner.value = false
      installEvent.value = null
    })

    // iOS Safari의 경우, beforeinstallprompt가 없으므로 
    // PWA가 아닐 때 항상 가이드를 보여줄 수 있도록 설정 (사용자 선택)
    if (isIOS.value && !isPWA.value) {
      isInstallable.value = true // 가이드 배너를 띄우기 위해 true로 설정
      showInstallBanner.value = true
    }
  })

  // 실제 설치 프로세스 시작 (Android/Chrome 전용)
  const installApp = async () => {
    if (!installEvent.value) return
    
    await installEvent.value.prompt()
    const { outcome } = await installEvent.value.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    
    installEvent.value = null
    isInstallable.value = false
    showInstallBanner.value = false
  }

  const closeBanner = () => {
    showInstallBanner.value = false
  }

  return {
    isInstallable,
    isPWA,
    isIOS,
    showInstallBanner,
    installApp,
    closeBanner
  }
}
