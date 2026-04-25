'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const DISMISS_STORAGE_KEY = 'restaurant_pwa_install_dismissed_v1';

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isSupportedInstallPlatform() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /android|windows/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [manualHint, setManualHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('Service worker registration failed:', error);
        });
      } else {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)))
          )
          .catch(() => undefined);
      }
    }

    setInstalled(isStandaloneMode());
    setDismissed(localStorage.getItem(DISMISS_STORAGE_KEY) === '1');
    setReady(true);

    const manualHintTimer = window.setTimeout(() => {
      if (!isStandaloneMode() && isSupportedInstallPlatform()) {
        setManualHint(true);
      }
    }, 4000);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setManualHint(false);
    };

    const handleInstalled = () => {
      localStorage.removeItem(DISMISS_STORAGE_KEY);
      setInstalled(true);
      setInstallEvent(null);
      setManualHint(false);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.clearTimeout(manualHintTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (pathname === '/display' || !ready || installed || dismissed || (!installEvent && !manualHint)) {
    return null;
  }

  const closeBanner = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    setDismissed(true);
  };

  const installApplication = async () => {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const result = await installEvent.userChoice;

    if (result.outcome === 'accepted') {
      setInstallEvent(null);
      setManualHint(false);
      return;
    }

    localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="theme-card fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-3xl p-4 text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Installer l&apos;application</p>
          <p className="mt-1 text-xs text-[var(--sand-400)]">
            Ajoutez Safi Cavaliers sur Android ou Windows pour l&apos;ouvrir comme une vraie application.
          </p>
          {!installEvent && (
            <p className="mt-2 text-xs text-[var(--sand-200)]">
              Ouvrez le menu du navigateur puis choisissez `Installer l&apos;application`.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={closeBanner}
          className="theme-action-secondary rounded-full px-2.5 py-1 text-xs"
        >
          Fermer
        </button>
      </div>

      {installEvent && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void installApplication()}
            className="theme-action rounded-2xl px-4 py-2 text-sm font-semibold text-white"
          >
            Installer
          </button>
        </div>
      )}
    </div>
  );
}

export default InstallPrompt;
