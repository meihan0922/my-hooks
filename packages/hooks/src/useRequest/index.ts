import { RefObject, useRef } from 'react';

import { useMemoizedFn, useMount, type UseSetState, useSetState, useUnmount } from '..';

type Service<TData, TParams extends any[]> = (...args: TParams) => Promise<TData>;

type Options<TParams extends any[]> = {
  defaultParams?: TParams;
  manual?: boolean;
};

const EMPTY_PARAMS: unknown[] = [];

type FetchState<TData> = {
  loading: boolean;
  data?: TData;
  error?: Error;
};

type SetFetchState<TData> = UseSetState<FetchState<TData>>;

/**
 * FetchInstance is a class that encapsulates the logic of a fetch request.
 * 管理請求的狀態和邏輯，管理 requestId 和 mounted 的狀態，管理 setState 的邏輯。
 * 提供 run 和 runAsync 方法。
 *
 * useRequest 會創建一個 FetchInstance 實例，並在 mount 時自動請求，除非 manual 為 true。把結果 export 出去，讓使用者可以呼叫 run 和 runAsync 方法。
 */
class FetchInstance<TData, TParams extends any[]> {
  service: Service<TData, TParams>;
  setState: SetFetchState<TData>;
  requestIdRef: React.RefObject<number>;
  mountedRef: React.RefObject<boolean>;

  constructor(
    service: Service<TData, TParams>,
    requestIdRef: RefObject<number>,
    mountedRef: RefObject<boolean>,
    setState: SetFetchState<TData>,
  ) {
    this.service = service;
    this.requestIdRef = requestIdRef;
    this.mountedRef = mountedRef;
    this.setState = setState;
  }

  runAsync = async (...args: TParams) => {
    const currentRequestId = ++this.requestIdRef.current;

    this.setState({ loading: true, error: undefined });

    try {
      const result = await this.service(...args);

      if (currentRequestId !== this.requestIdRef.current) {
        throw new Error('Request aborted');
      }

      if (this.mountedRef.current) {
        this.setState({ data: result, loading: false, error: undefined });
      }

      return result;
    } catch (error) {
      if (currentRequestId !== this.requestIdRef.current) {
        throw new Error('Request aborted');
      }

      const err = error instanceof Error ? error : new Error(String(error));

      if (this.mountedRef.current) {
        this.setState({ loading: false, error: err });
      }

      throw err;
    }
  };

  run = (...args: TParams) => {
    this.runAsync(...args).catch(() => {
      // ignore error，錯誤已透過 setError 更新
    });
  };
}

export function useRequest<TData, TParams extends any[]>(
  service: Service<TData, TParams>,
  { defaultParams = EMPTY_PARAMS as TParams, manual = false }: Options<TParams> = {},
) {
  const [{ loading, data, error }, setState] = useSetState<FetchState<TData>>({
    loading: false,
    data: undefined,
    error: undefined,
  });
  const lastService = useMemoizedFn(service);
  const requestId = useRef(0);
  const mounted = useRef(false);

  const fetchInstanceRef = useRef<FetchInstance<TData, TParams> | null>(null);

  if (!fetchInstanceRef.current) {
    fetchInstanceRef.current = new FetchInstance(lastService, requestId, mounted, setState);
  }

  const fetchInstance = fetchInstanceRef.current;

  useMount(() => {
    mounted.current = true;
    if (!manual) {
      fetchInstance.run(...defaultParams);
    }
  });
  useUnmount(() => {
    mounted.current = false;
  });

  return {
    loading,
    data,
    error,
    run: fetchInstance.run,
    runAsync: fetchInstance.runAsync,
  };
}
