import { useEffect, useRef, useState } from 'react';

import { useMemoizedFn, useUnmount } from '..';

type Service<TData, TParams extends any[]> = (...args: TParams) => Promise<TData>;

type Options<TParams extends any[]> = {
  defaultParams?: TParams;
  manual?: boolean;
};

const EMPTY_PARAMS: unknown[] = [];

export function useRequest<TData, TParams extends any[]>(
  service: Service<TData, TParams>,
  { defaultParams = EMPTY_PARAMS as TParams, manual = false }: Options<TParams> = {},
) {
  // 1) state: loading / data / error
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  // 2) refs: latest service / requestId / mounted
  const lastService = useMemoizedFn(service);
  const requestId = useRef(0);
  const mounted = useRef(true);

  // 3) runAsync
  const runAsync = useMemoizedFn(async (...args: TParams) => {
    const currentRequestId = ++requestId.current;
    try {
      setLoading(true);
      setError(undefined);
      const result = await lastService(...args);

      // 如果後續有新的請求則忽略結果
      if (currentRequestId !== requestId.current) throw new Error('Request aborted');
      // 如果組件已經 unmount 則忽略結果
      if (mounted.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (e) {
      // 如果後續有新的請求則忽略結果
      // runAsync 將錯誤往外拋，使用者可以明確知道這次請求已過期
      if (currentRequestId !== requestId.current) throw new Error('Request aborted');
      const err = e instanceof Error ? e : new Error(String(e));
      if (mounted.current) {
        setLoading(false);
        setError(err);
      }

      throw err;
    }
  });

  // 4) run
  const run = useMemoizedFn(async (...args: TParams) => {
    await runAsync(...args).catch(() => {
      // ignore error，錯誤已透過 setError 更新
    });
  });

  // 5) mount auto run when manual !== true
  useEffect(() => {
    if (!manual) {
      run(...defaultParams).catch(() => {
        // 避免 unhandled rejection，錯誤已透過 setError 更新
      });
    }
  }, [manual, defaultParams]);

  useUnmount(() => {
    mounted.current = false;
  });

  return { data, error, loading, run, runAsync };
}
