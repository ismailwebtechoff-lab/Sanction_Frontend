import { useEffect, useRef, useState } from "react";

export default function usePWAInstallPrompt() {
  const deferredPromptRef = useRef(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault(); // stop automatic mini-banner
      deferredPromptRef.current = e;
      setIsInstallable(true);
    };

    const onAppInstalled = () => {
      // If app installed, clear prompt state
      deferredPromptRef.current = null;
      setIsInstallable(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return { outcome: "no-prompt" };

    try {
      promptEvent.prompt();
      const result = await promptEvent.userChoice;
      // clear after prompt used
      deferredPromptRef.current = null;
      setIsInstallable(false);
      return result; // { outcome: 'accepted' | 'dismissed' }
    } catch (err) {
      deferredPromptRef.current = null;
      setIsInstallable(false);
      return { outcome: "error", error: err };
    }
  };

  return { isInstallable, promptInstall };
}