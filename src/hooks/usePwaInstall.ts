import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [browserInfo, setBrowserInfo] = useState<{
    isChrome: boolean;
    isEdge: boolean;
    isSafari: boolean;
    isIos: boolean;
    isAndroid: boolean;
    isDesktop: boolean;
  }>({
    isChrome: false,
    isEdge: false,
    isSafari: false,
    isIos: false,
    isAndroid: false,
    isDesktop: true
  });

  useEffect(() => {
    // Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect browser & device environment
    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isEdge = /Edg/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua) && !isEdge;
    const isSafari = /Safari/i.test(ua) && !isChrome && !isEdge;
    const isDesktop = !isIos && !isAndroid;

    setBrowserInfo({
      isChrome,
      isEdge,
      isSafari,
      isIos,
      isAndroid,
      isDesktop
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const p = e as BeforeInstallPromptEvent;
      setDeferredPrompt(p);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Error triggering install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    deferredPrompt,
    browserInfo,
    promptInstall
  };
}
