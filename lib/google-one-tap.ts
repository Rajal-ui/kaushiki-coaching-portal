export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export function promptGoogleOneTap(
  clientId: string,
  callback: (credential: string) => void,
  errorCallback?: (error: string) => void,
) {
  const { google } = window as unknown as { google?: { accounts: { id: { initialize: Function; prompt: Function } } } };
  if (!google?.accounts?.id) {
    errorCallback?.('Google Identity Services not loaded');
    return;
  }
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      if (response.credential) {
        callback(response.credential);
      } else {
        errorCallback?.('No credential returned');
      }
    },
    cancel_on_tap_outside: false,
  });
  google.accounts.id.prompt();
}
