import { useEffect } from 'react';

export function useAsyncEffect(effect: (isCancelled: () => boolean) => Promise<void>, deps: any[] = []) {
  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    async function run() {
      try {
        await effect(isCancelled); // 假設有人在此之中 setState，但已經 unmount 了，必須要阻止
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, deps);
}
