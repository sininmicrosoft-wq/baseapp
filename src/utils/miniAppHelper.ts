export interface MiniAppContext {
  isInMiniApp: boolean;
  platform: 'farcaster' | 'telegram' | 'coinbase_wallet' | 'browser' | 'standalone';
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
}

// Detect whether running in a Mini App iframe/webview environment
export function detectMiniAppContext(): MiniAppContext {
  if (typeof window === 'undefined') {
    return { isInMiniApp: false, platform: 'browser' };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const isExplicitMiniApp = searchParams.get('miniapp') === 'true' || hash.includes('miniapp');

  // Check Telegram WebApp
  const isTelegram = !!(window as any).Telegram?.WebApp?.initData;

  // Check Farcaster / Warpcast client
  const isFarcaster = !!(window as any).farcaster || isExplicitMiniApp || window.parent !== window;

  return {
    isInMiniApp: isExplicitMiniApp || isTelegram || isFarcaster,
    platform: isTelegram ? 'telegram' : isFarcaster ? 'farcaster' : 'browser',
    user: {
      fid: 8453,
      username: 'basebuilder',
      displayName: 'Base Builder',
      pfpUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
  };
}

// Notify host frame that Mini App is loaded and ready to display
export function notifyMiniAppReady() {
  try {
    // 1. Farcaster Frame SDK compatibility
    if ((window as any).farcaster?.actions?.ready) {
      (window as any).farcaster.actions.ready();
    }
    // 2. Telegram WebApp ready
    if ((window as any).Telegram?.WebApp?.ready) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }
    // 3. Standard postMessage
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'FRAME_READY', source: 'base-b20-app' }, '*');
    }
  } catch (err) {
    console.debug('MiniApp ready signal skipped in standalone mode', err);
  }
}
