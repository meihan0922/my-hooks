import { useEffect, useRef, useState } from 'react';

import { useMemoizedFn } from '../';
import { useRequest } from '../useRequest';

type InfiniteScrollResult<T> = {
  list: T[];
  total?: number;
};

type BaseParams = {
  page: number;
  pageSize: number;
};

type InfiniteScrollOptions<T, TExtra extends Record<string, any> = Record<string, any>> = {
  target?: React.RefObject<HTMLElement | null>;
  observerTarget?: React.RefObject<Element | null>;
  isNoMore?: (data: InfiniteScrollResult<T>, allPages: InfiniteScrollResult<T>[]) => boolean;
  manual?: boolean;
  buffer?: number;
  pageSize?: number;
  reloadDeps?: React.DependencyList;
  params?: TExtra;
  maxLength?: number;
  useObserver?: boolean;
  observerInit?: IntersectionObserverInit;
};

type InfiniteScrollPage<T> = InfiniteScrollResult<T>;

type Service<T, TExtra extends Record<string, any> = Record<string, any>> = (
  params: BaseParams & TExtra,
) => Promise<InfiniteScrollResult<T>>;

export function useInfiniteScroll<T, TExtra extends Record<string, any> = Record<string, any>>(
  service: Service<T, TExtra>,
  options: InfiniteScrollOptions<T, TExtra> = {},
) {
  const {
    target,
    observerTarget,
    isNoMore,
    manual = false,
    buffer = 0,
    pageSize = 10,
    reloadDeps = [],
    params,
    maxLength,
    useObserver = false,
    observerInit,
  } = options;

  /**
   * nextPage = 下一次要請求的頁數
   */
  const [nextPage, setNextPage] = useState(1);
  const [pages, setPages] = useState<InfiniteScrollPage<T>[]>([]);
  const [list, setList] = useState<T[]>([]);
  const [noMore, setNoMore] = useState(false);

  /**
   * 避免 loading state 還沒刷新前，重複進入 loadMore
   */
  const loadingMoreRef = useRef(false);

  /**
   * 記住最新外部 params，避免 stale closure
   */
  const latestParamsRef = useRef(params);
  latestParamsRef.current = params;

  const { runAsync, loading, error, cancel } = useRequest(service, {
    manual: true,
  });

  const mergeList = useMemoizedFn((prev: T[], next: T[]) => {
    const merged = [...prev, ...next];
    if (typeof maxLength === 'number' && maxLength > 0 && merged.length > maxLength) {
      return merged.slice(-maxLength);
    }
    return merged;
  });

  const resolveNoMore = useMemoizedFn((data: InfiniteScrollResult<T>, allPages: InfiniteScrollPage<T>[]) => {
    if (isNoMore) {
      return isNoMore(data, allPages);
    }
    return data.list.length === 0;
  });

  const makeRequestParams = useMemoizedFn((page: number) => {
    return {
      ...(latestParamsRef.current ?? ({} as TExtra)),
      page,
      pageSize,
    } as BaseParams & TExtra;
  });

  const reset = useMemoizedFn(() => {
    cancel();
    loadingMoreRef.current = false;
    setPages([]);
    setList([]);
    setNoMore(false);
    setNextPage(1);
  });

  const reloadAsync = useMemoizedFn(async () => {
    if (loadingMoreRef.current) return undefined;

    loadingMoreRef.current = true;
    try {
      const data = await runAsync(makeRequestParams(1));
      if (!data) return undefined;

      const nextPages = [data];
      setPages(nextPages);
      setList(data.list);
      setNextPage(2);
      setNoMore(resolveNoMore(data, nextPages));

      return data;
    } finally {
      loadingMoreRef.current = false;
    }
  });

  const reload = useMemoizedFn(() => {
    reloadAsync().catch(() => {
      // error 已由 useRequest 處理
    });
  });

  const loadMoreAsync = useMemoizedFn(async () => {
    if (loading || loadingMoreRef.current || noMore) return undefined;

    loadingMoreRef.current = true;
    try {
      const pageToLoad = nextPage;
      const data = await runAsync(makeRequestParams(pageToLoad));
      if (!data) return undefined;

      setPages(prevPages => {
        const nextPages = [...prevPages, data];
        setNoMore(resolveNoMore(data, nextPages));
        return nextPages;
      });

      setList(prev => mergeList(prev, data.list));
      setNextPage(prev => prev + 1);

      return data;
    } finally {
      loadingMoreRef.current = false;
    }
  });

  const loadMore = useMemoizedFn(() => {
    loadMoreAsync().catch(() => {
      // error 已由 useRequest 處理
    });
  });

  const isReachBottom = useMemoizedFn((el: HTMLElement) => {
    return el.scrollTop + el.clientHeight + buffer >= el.scrollHeight;
  });

  const isContainerNotFull = useMemoizedFn((el: HTMLElement) => {
    return el.scrollHeight <= el.clientHeight;
  });

  /**
   * 初始載入
   */
  useEffect(() => {
    if (!manual) {
      loadMore();
    }
  }, [manual]);

  /**
   * 外部 reloadDeps 改變時，reset + reload
   */
  useEffect(() => {
    if (manual) return;

    reset();
    loadMore();
  }, reloadDeps);

  /**
   * scroll 模式
   */
  useEffect(() => {
    if (useObserver) return;

    const el = target?.current;
    if (!el) return;

    const handleScroll = () => {
      if (isReachBottom(el)) {
        loadMore();
      }
    };

    el.addEventListener('scroll', handleScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [target, buffer, useObserver]);

  /**
   * IntersectionObserver 模式
   * observerTarget 通常是一個底部 sentinel
   */
  useEffect(() => {
    if (!useObserver) return;

    const observeEl = observerTarget?.current;
    if (!observeEl) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(entries => {
      const first = entries[0];
      if (first?.isIntersecting) {
        loadMore();
      }
    }, observerInit);

    observer.observe(observeEl);

    return () => {
      observer.disconnect();
    };
  }, [observerTarget, useObserver, observerInit]);

  /**
   * auto fill：
   * 如果內容還沒撐滿 container，就繼續載
   */
  useEffect(() => {
    if (manual) return;
    if (useObserver) return;
    if (loading || loadingMoreRef.current || noMore) return;

    const el = target?.current;
    if (!el) return;

    // 首次完全沒資料時，避免和初始載入重疊
    if (list.length === 0 && nextPage === 1) return;

    if (isContainerNotFull(el)) {
      loadMore();
    }
  }, [list, manual, noMore, nextPage, target, useObserver]);

  /**
   * 對外暴露一個比較語意化的 loadingMore
   * 讓使用者知道是否正在執行 loadMore
   */
  const loadingMore = loading || loadingMoreRef.current;

  return {
    list,
    pages,
    loading,
    loadingMore,
    error,
    noMore,
    loadMore,
    loadMoreAsync,
    reload,
    reloadAsync,
    reset,
    cancel,
    nextPage,
  };
}
