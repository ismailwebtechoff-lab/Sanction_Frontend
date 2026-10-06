import React, { useEffect, useState } from "react";
import usePWAInstallPrompt from "../../hooks/usePWAInstallPrompt";

const DISMISS_KEY = "pwaInstallDismissedUntil";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export default function InstallPopup() {
  const { isInstallable, promptInstall } = usePWAInstallPrompt();
  const [visible, setVisible] = useState(false);

  // decide whether to show based on dismiss timestamp
  useEffect(() => {
    const dismissedUntil = parseInt(localStorage.getItem(DISMISS_KEY), 10) || 0;
    const now = Date.now();

    // show popup only if browser says installable AND dismissal expired/not set
    if (isInstallable && now > dismissedUntil) {
      // small delay so UI has time to mount
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result && result.outcome === "accepted") {
      // user installed — set very long dismissal so popup won't show again
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)); // 100 years
      setVisible(false);
    } else {
      // user dismissed native dialog — treat it like Later (2 weeks)
      localStorage.setItem(DISMISS_KEY, String(Date.now() + TWO_WEEKS_MS));
      setVisible(false);
    }
  };

  const handleLater = () => {
    // user chose Later — store two-weeks dismissal
    localStorage.setItem(DISMISS_KEY, String(Date.now() + TWO_WEEKS_MS));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      left: 16,
      right: 16,
      bottom: 24,
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "auto",
    }}>
      <div style={{
        width: 420,
        maxWidth: "calc(100% - 32px)",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Install Construction OMT</div>
          <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>
            Add this app to your device for faster access.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleInstall}
            style={{
              background: "#1E3A8A",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}>
            Install
          </button>

          <button onClick={handleLater}
            style={{
              background: "transparent",
              color: "#333",
              border: "1px solid #e0e0e0",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}