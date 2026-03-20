import { useEffect, useState } from 'react';

import { useMemoizedFn } from '../useMemorizedFn';
import { useRequest } from '../useRequest';

type PaginationParams = {
  current: number;
  pageSize: number;
};

type PaginationResult<TData> = {
  list: TData[];
  total: number;
};

type PaginationService<TData> = (params: PaginationParams) => Promise<PaginationResult<TData>>;

type Options = {
  defaultCurrent?: number;
  defaultPageSize?: number;
  manual?: boolean;
};

export function usePagination<TData>(service: PaginationService<TData>, options: Options = {}) {
  const { defaultCurrent = 1, defaultPageSize = 10, manual = false } = options;

  // 1. current / pageSize state
  const [current, setCurrent] = useState(defaultCurrent);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // 2. useRequest(service, { manual: true })
  const request = useRequest(service, { manual: true });

  // 3. useEffect: current / pageSize 改變時，如果不是 manual，就重新請求
  useEffect(() => {
    if (!manual) {
      request.run({ current, pageSize });
    }
  }, [current, pageSize, manual]);

  // 4. 算 total / totalPage
  const total = request.data?.total ?? 0;
  const totalPage = Math.ceil(total / pageSize);

  // 5. changeCurrent
  const changeCurrent = useMemoizedFn((page: number) => {
    if (page <= totalPage && page > 0) {
      setCurrent(page);
    }
  });
  // 6. changePageSize
  const changePageSize = useMemoizedFn((size: number) => {
    if (size > 0) {
      setPageSize(size);
      setCurrent(1);
    }
  });

  // 7. onChange
  const onChange = useMemoizedFn((page: number, newPageSize: number) => {
    if (pageSize !== newPageSize) {
      changePageSize(newPageSize);
    } else {
      changeCurrent(page);
    }
  });

  // 8. return request + pagination
  return {
    ...request,
    pagination: {
      current,
      pageSize,
      total,
      totalPage,
      onChange,
      changeCurrent,
      changePageSize,
    },
  };
}
