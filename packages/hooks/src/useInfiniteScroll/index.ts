import { useEffect, useState } from 'react';

import { useRequest } from '../useRequest';

type InfiniteScrollResult<T> = {
  list: T[];
};

type InfiniteScrollOptions<T> = {
  target: React.RefObject<HTMLElement | null>;
  isNoMore?: (data: InfiniteScrollResult<T>) => boolean;
  manual?: boolean;
  buffer?: number;
  pageSize?: number;
};

export function useInfiniteScroll<T>(
  service: (params: { page: number; pageSize: number }) => Promise<InfiniteScrollResult<T>>,
  options: InfiniteScrollOptions<T>,
) {
  const { target, isNoMore, manual = false, buffer = 0, pageSize = 10 } = options;

  // 指下次請求的頁面
  const [page, setPage] = useState(1);
  const [list, setList] = useState<T[]>([]);
  const [noMore, setNoMore] = useState(false);

  const { runAsync, loading } = useRequest(service, { manual: true });

  const loadMore = async () => {
    if (loading || noMore) return;

    const currentPage = page;
    const data = await runAsync({ page: currentPage, pageSize });

    if (!data) return;

    setList(prev => [...prev, ...data.list]);
    setPage(prev => prev + 1);
    setNoMore(isNoMore?.(data) ?? false);
  };

  useEffect(() => {
    if (!manual) {
      loadMore();
    }
  }, []);

  useEffect(() => {
    const el = target.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight + buffer >= el.scrollHeight) {
        loadMore();
      }
    };

    el.addEventListener('scroll', handleScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [target, loading, noMore, page, buffer]);

  return {
    list,
    loading,
    noMore,
    loadMore,
  };
}
