import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { usePagination } from '..';

describe('usePagination', () => {
  test('should mount with default current and page size', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 0 });

    const { result } = renderHook(() => usePagination(service));

    expect(result.current.pagination.current).toBe(1);
    expect(result.current.pagination.pageSize).toBe(10);

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(1);
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 10 });
    });
  });

  test('should change current when changeCurrent is called', async () => {
    const mockList = new Array(15).fill(0).map((_, index) => ({ id: index }));
    const service = vi.fn().mockResolvedValue({ list: mockList, total: mockList.length });

    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(1);
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 10 });
    });

    act(() => {
      result.current.pagination.changeCurrent(2);
    });

    await waitFor(() => {
      expect(result.current.pagination.current).toBe(2);
      expect(service).toHaveBeenCalledTimes(2);
      expect(service).toHaveBeenLastCalledWith({ current: 2, pageSize: 10 });
    });
  });

  test('should change page size when changePageSize is called', async () => {
    const mockList = new Array(15).fill(0).map((_, index) => ({ id: index }));
    const service = vi.fn().mockResolvedValue({ list: mockList, total: mockList.length });

    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(1);
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 10 });
    });

    act(() => {
      result.current.pagination.changePageSize(20);
    });

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(2);
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 20 });
      expect(result.current.pagination.pageSize).toBe(20);
      expect(result.current.pagination.current).toBe(1);
      expect(result.current.pagination.totalPage).toBe(1);
    });
  });

  test('refresh should call service with current pagination params', async () => {
    const mockList = new Array(15).fill(0).map((_, index) => ({ id: index }));
    const service = vi.fn().mockResolvedValue({ list: mockList, total: mockList.length });

    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(1);
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 10 });
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(2);
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 10 });
    });
  });

  test('totalPages should be 0 when total is 0', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 0 });

    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(result.current.pagination.totalPage).toBe(0);
    });
  });
  test('onChange should update current and pageSize', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 30 });

    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.pagination.onChange(2, 20);
    });

    await waitFor(() => {
      expect(result.current.pagination.current).toBe(1);
      expect(result.current.pagination.pageSize).toBe(20);
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 20 });
    });
  });
  test('onChange should not call service if pageSize is not changed', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 30 });
    const { result } = renderHook(() => usePagination(service));
    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(1);
    });
    act(() => {
      result.current.pagination.onChange(2, 10);
    });
    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(2);
      expect(service).toHaveBeenLastCalledWith({ current: 2, pageSize: 10 });
    });
  });

  test('should use defaultCurrent option', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 0 });
    const { result } = renderHook(() => usePagination(service, { defaultCurrent: 3 }));
    expect(result.current.pagination.current).toBe(3);
    await waitFor(() => {
      expect(service).toHaveBeenLastCalledWith({ current: 3, pageSize: 10 });
    });
  });

  test('should use defaultPageSize option', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 0 });
    const { result } = renderHook(() => usePagination(service, { defaultPageSize: 20 }));
    expect(result.current.pagination.pageSize).toBe(20);
    await waitFor(() => {
      expect(service).toHaveBeenLastCalledWith({ current: 1, pageSize: 20 });
    });
  });

  test('should not auto-fetch when manual is true', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 0 });
    renderHook(() => usePagination(service, { manual: true }));
    expect(service).not.toHaveBeenCalled();
  });

  test('changeCurrent should not change when page > totalPage', async () => {
    const mockList = new Array(15).fill(0).map((_, index) => ({ id: index }));
    const service = vi.fn().mockResolvedValue({ list: mockList, total: mockList.length });
    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(result.current.pagination.total).toBe(15);
    });

    act(() => {
      result.current.pagination.changeCurrent(5);
    });

    expect(result.current.pagination.current).toBe(1);
    expect(service).toHaveBeenCalledTimes(1);
  });

  test('changeCurrent should not change when page <= 0', async () => {
    const mockList = new Array(15).fill(0).map((_, index) => ({ id: index }));
    const service = vi.fn().mockResolvedValue({ list: mockList, total: mockList.length });
    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(result.current.pagination.total).toBe(15);
    });

    act(() => {
      result.current.pagination.changeCurrent(0);
    });
    expect(result.current.pagination.current).toBe(1);

    act(() => {
      result.current.pagination.changeCurrent(-1);
    });
    expect(result.current.pagination.current).toBe(1);
  });

  test('changePageSize should not change when size <= 0', async () => {
    const service = vi.fn().mockResolvedValue({ list: [], total: 0 });
    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(service).toHaveBeenCalled();
    });

    act(() => {
      result.current.pagination.changePageSize(0);
    });
    expect(result.current.pagination.pageSize).toBe(10);

    act(() => {
      result.current.pagination.changePageSize(-5);
    });
    expect(result.current.pagination.pageSize).toBe(10);
  });

  test('changePageSize should reset current to 1', async () => {
    const mockList = new Array(25).fill(0).map((_, index) => ({ id: index }));
    const service = vi.fn().mockResolvedValue({ list: mockList, total: mockList.length });
    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(result.current.pagination.total).toBe(25);
    });

    act(() => {
      result.current.pagination.changeCurrent(2);
    });
    await waitFor(() => {
      expect(result.current.pagination.current).toBe(2);
    });

    act(() => {
      result.current.pagination.changePageSize(20);
    });
    await waitFor(() => {
      expect(result.current.pagination.current).toBe(1);
      expect(result.current.pagination.pageSize).toBe(20);
    });
  });

  test('should return request data including list', async () => {
    const mockList = new Array(5).fill(0).map((_, index) => ({ id: index }));
    const service = vi.fn().mockResolvedValue({ list: mockList, total: 5 });
    const { result } = renderHook(() => usePagination(service));

    await waitFor(() => {
      expect(result.current.data).toEqual({ list: mockList, total: 5 });
      expect(result.current.data?.list).toHaveLength(5);
    });
  });
});
