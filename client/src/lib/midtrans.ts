// Frontend utility untuk integrasi Midtrans Snap
export interface MidtransSnapWindow extends Window {
  snap?: {
    pay: (token: string, options?: {
      onSuccess?: (result: any) => void;
      onPending?: (result: any) => void;
      onError?: (result: any) => void;
      onClose?: () => void;
    }) => void;
  };
}

/**
 * Load Midtrans Snap script dynamically
 */
export function loadMidtransScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if ((window as MidtransSnapWindow).snap) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'; // Use production URL in production
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Midtrans script'));
    document.head.appendChild(script);
  });
}

/**
 * Open Midtrans payment popup
 */
export async function openMidtransPayment(
  token: string,
  callbacks: {
    onSuccess?: (result: any) => void;
    onPending?: (result: any) => void;
    onError?: (result: any) => void;
    onClose?: () => void;
  } = {}
): Promise<void> {
  await loadMidtransScript();
  const snapWindow = window as MidtransSnapWindow;
  
  if (!snapWindow.snap) {
    throw new Error('Midtrans Snap not loaded');
  }

  snapWindow.snap.pay(token, callbacks);
}