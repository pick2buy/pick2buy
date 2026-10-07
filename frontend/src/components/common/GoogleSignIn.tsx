import { useEffect, useRef, useState } from 'react';

type GoogleIdentity = {
  accounts: { id: {
    initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
    renderButton: (element: HTMLElement, options: { type: string; theme: string; size: string; text: string; shape: string; width: number }) => void;
  } };
};

declare global { interface Window { google?: GoogleIdentity } }

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error('Google sign-in could not load. Please try again.')); };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function GoogleSignIn({ onCredential, text = 'signin_with' }: {
  onCredential: (credential: string) => Promise<void>;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [error, setError] = useState('');
  callback.current = onCredential;

  useEffect(() => {
    if (!clientId) return;
    let mounted = true;
    loadGoogleScript().then(() => {
      if (!mounted || !container.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (!credential) { setError('Google did not return a credential.'); return; }
          setError('');
          callback.current(credential).catch((err) => setError(err?.message || 'Google sign-in failed.'));
        },
      });
      container.current.replaceChildren();
      window.google.accounts.id.renderButton(container.current, {
        type: 'standard', theme: 'outline', size: 'large', text, shape: 'pill',
        width: Math.min(280, Math.floor(container.current.clientWidth || 280)),
      });
    }).catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, [clientId, text]);

  if (!clientId) return null;
  return <div className="space-y-2">
    <div ref={container} className="flex justify-center min-h-10" />
    {error && <p role="alert" className="text-xs text-rose-700 text-center">{error}</p>}
  </div>;
}
