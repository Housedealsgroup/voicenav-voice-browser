import { useEffect, useState } from 'react';

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
};

export function useNetworkState(): NetworkState {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkNetwork() {
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        const unsubscribe = NetInfo.addEventListener((state: any) => {
          if (!mounted) return;
          setIsConnected(state.isConnected ?? false);
          setIsInternetReachable(state.isInternetReachable ?? true);
        });
        return unsubscribe;
      } catch {
        // NetInfo not installed — assume online
        return () => {};
      }
    }

    let unsubscribe: (() => void) | undefined;
    checkNetwork().then(fn => { unsubscribe = fn; });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return { isConnected, isInternetReachable, isOffline: !isConnected || !isInternetReachable };
}
