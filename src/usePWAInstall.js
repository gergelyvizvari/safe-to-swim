import { useEffect, useState } from 'react'

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandaloneMode)
  const [isIOS] = useState(isIOSDevice)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => {
      setInstallPrompt(null)
      setInstalled(true)
    }
    const handleDisplayMode = (event) => setInstalled(event.matches)

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    displayMode.addEventListener('change', handleDisplayMode)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      displayMode.removeEventListener('change', handleDisplayMode)
    }
  }, [])

  const requestInstall = async () => {
    if (!installPrompt) return false
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
    return true
  }

  return { installed, installReady: Boolean(installPrompt), isIOS, requestInstall }
}
