import { useEffect, useRef, useState } from 'react';

import { useMemoizedFn } from '../';
import { useRequest } from '../useRequest';

type InfiniteScrollResult<T> = {
  list: T[];
  total?: number;
};

type InfiniteScrollOptions<T> = {
  target: React.RefObject<HTMLElement | null>;
  isNoMore?: (data: InfiniteScrollResult<T>) => boolean;
  manual?: boolean;
  buffer?: number;
  pageSize?: number;
  reloadDeps?: React.DependencyList;
};

type InfiniteScrollPage<T> = InfiniteScrollResult<T>;

export function useInfiniteScroll<T>(
  service: (params: { page: number; pageSize: number }) => Promise<InfiniteScrollResult<T>>,
  options: InfiniteScrollOptions<T>,
) {
  const { target, isNoMore, manual = false, buffer = 0, pageSize = 10, reloadDeps = [] } = options;

  /**
   * nextPage 代表「下一次要請求的頁數」
   * 不是目前顯示到第幾頁
   */
  const [nextPage, setNextPage] = useState(1);
  const [pages, setPages] = useState<InfiniteScrollPage<T>[]>([]);
  const [list, setList] = useState<T[]>([]);
  const [noMore, setNoMore] = useState(false);

  /**
   * 避免 auto fill / scroll / 手動點擊在某些時序下重複進入
   * 第一層 guard: request.loading
   * 第二層 guard: loadingMoreRef
   */
  const loadingMoreRef = useRef(false);

  const { runAsync, loading, error, cancel } = useRequest(service, {
    manual: true,
  });

  const resolveNoMore = useMemoizedFn((data: InfiniteScrollResult<T>) => {
    // 如果使用者提供判斷，優先使用
    if (isNoMore) {
      return isNoMore(data);
    }

    // 否則最基本策略：回空陣列就停
    return data.list.length === 0;
  });

  const appendPage = useMemoizedFn((data: InfiniteScrollResult<T>) => {
    setPages(prev => [...prev, data]);
    setList(prev => [...prev, ...data.list]);
  });

  const reset = useMemoizedFn(() => {
    cancel();
    loadingMoreRef.current = false;
    setPages([]);
    setList([]);
    setNextPage(1);
    setNoMore(false);
  });

  const reload = useMemoizedFn(async () => {
    if (loadingMoreRef.current) return;

    loadingMoreRef.current = true;

    try {
      const data = await runAsync({ page: 1, pageSize });
      if (!data) return;

      setPages([data]);
      setList(data.list);
      setNextPage(2);
      setNoMore(resolveNoMore(data));
    } finally {
      loadingMoreRef.current = false;
    }
  });

  const loadMore = useMemoizedFn(async () => {
    if (loading || loadingMoreRef.current || noMore) return;

    loadingMoreRef.current = true;

    try {
      const pageToLoad = nextPage;
      const data = await runAsync({ page: pageToLoad, pageSize });
      if (!data) return;

      appendPage(data);
      setNextPage(prev => prev + 1);
      setNoMore(resolveNoMore(data));
    } finally {
      loadingMoreRef.current = false;
    }
  });

  const isReachBottom = useMemoizedFn((el: HTMLElement) => {
    return el.scrollTop + el.clientHeight + buffer >= el.scrollHeight;
  });

  const isContainerNotFull = useMemoizedFn((el: HTMLElement) => {
    return el.scrollHeight <= el.clientHeight;
  });

  /**
   * 初始自動載入
   */
  useEffect(() => {
    if (!manual) {
      loadMore();
    }
  }, [manual]);

  /**
   * reloadDeps 改變時，重置並重新抓第一頁
   * manual 模式下不自動 reload
   */
  useEffect(() => {
    if (manual) return;

    reset();
    loadMore();
  }, reloadDeps);

  /**
   * scroll 觸底載入更多
   */
  useEffect(() => {
    const el = target.current;
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
  }, [target, buffer]);

  /**
   * auto fill:
   * 如果內容還沒撐滿容器，就自動再載下一頁
   */
  useEffect(() => {
    const el = target.current;
    if (!el) return;

    if (manual) return;
    if (loading || loadingMoreRef.current || noMore) return;

    if (list.length === 0 && nextPage === 1) return;

    if (isContainerNotFull(el)) {
      loadMore();
    }
  }, [list, manual, noMore, nextPage, target]);

  return {
    list,
    pages,
    loading,
    error,
    noMore,
    loadMore,
    reload,
    reset,
    cancel,
  };
}
