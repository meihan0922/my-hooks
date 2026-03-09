import { RefObject, useRef } from 'react';

import { useMemoizedFn, useMount, type UseSetState, useSetState, useUnmount } from '..';

type Service<TData, TParams extends any[]> = (...args: TParams) => Promise<TData>;

type Options<TData, TParams extends any[]> = {
  defaultParams?: TParams;
  manual?: boolean;
  plugins?: Plugin<TData, TParams>[];
};

const EMPTY_PARAMS: unknown[] = [];

type FetchState<TData> = {
  loading: boolean;
  data?: TData;
  error?: Error;
};

type OnBeforeResult<TData> = {
  stopNow?: boolean;
  returnNow?: boolean;
  data?: TData;
};

type Plugin<TData, TParams extends any[]> = {
  onBefore?: (params: TParams) => OnBeforeResult<TData> | void;
  onSuccess?: (data: TData, params: TParams) => void;
  onError?: (error: Error, params: TParams) => void;
  onFinally?: (params: TParams, data?: TData, error?: Error) => void;
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
  plugins?: Plugin<TData, TParams>[];

  constructor(
    service: Service<TData, TParams>,
    requestIdRef: RefObject<number>,
    mountedRef: RefObject<boolean>,
    setState: SetFetchState<TData>,
    plugins?: Plugin<TData, TParams>[],
  ) {
    this.service = service;
    this.requestIdRef = requestIdRef;
    this.mountedRef = mountedRef;
    this.setState = setState;
    this.plugins = plugins;
  }

  runAsync = async (...args: TParams): Promise<TData | undefined> => {
    const currentRequestId = ++this.requestIdRef.current;

    if (this.plugins?.length) {
      for (const plugin of this.plugins) {
        const onBeforeResult = plugin.onBefore?.(args);

        if (onBeforeResult?.stopNow) {
          return undefined;
        }

        if (onBeforeResult?.returnNow) {
          const data = onBeforeResult.data;

          if (this.mountedRef.current) {
            this.setState({
              data,
              loading: false,
              error: undefined,
            });

            for (const p of this.plugins) {
              p.onSuccess?.(data as TData, args);
            }

            for (const p of this.plugins) {
              p.onFinally?.(args, data, undefined);
            }
          }

          return data;
        }
      }
    }
    this.setState({ loading: true, error: undefined });

    try {
      const result = await this.service(...args);

      if (currentRequestId !== this.requestIdRef.current) {
        throw new Error('Request aborted');
      }
      if (!this.mountedRef.current) {
        return result;
      }

      this.setState({ data: result, loading: false, error: undefined });
      if (this.plugins?.length) {
        for (const plugin of this.plugins) {
          plugin.onSuccess?.(result, args);
        }
      }
      if (this.plugins?.length) {
        for (const plugin of this.plugins) {
          plugin.onFinally?.(args, result, undefined);
        }
      }

      return result;
    } catch (error) {
      if (currentRequestId !== this.requestIdRef.current) {
        throw new Error('Request aborted');
      }

      const err = error instanceof Error ? error : new Error(String(error));
      if (!this.mountedRef.current) {
        throw err;
      }

      if (this.plugins?.length) {
        for (const plugin of this.plugins) {
          plugin.onError?.(err, args);
        }
      }
      if (this.plugins?.length) {
        for (const plugin of this.plugins) {
          plugin.onFinally?.(args, undefined, err);
        }
      }
      this.setState({ loading: false, error: err });

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
  { defaultParams = EMPTY_PARAMS as TParams, manual = false, plugins = [] }: Options<TData, TParams> = {},
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
    fetchInstanceRef.current = new FetchInstance(lastService, requestId, mounted, setState, plugins);
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
