import { act, renderHook, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useInfiniteScroll } from '..';

function createScrollContainer(overrides?: { scrollTop?: number; clientHeight?: number; scrollHeight?: number }) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  Object.defineProperty(container, 'scrollTop', {
    value: overrides?.scrollTop ?? 0,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(container, 'clientHeight', {
    value: overrides?.clientHeight ?? 100,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(container, 'scrollHeight', {
    value: overrides?.scrollHeight ?? 200,
    writable: true,
    configurable: true,
  });

  return container;
}

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  test('should load initial data when not manual', async () => {
    const mockList = [{ id: 1 }, { id: 2 }];
    const service = vi.fn().mockResolvedValue({ list: mockList });
    const container = createScrollContainer();

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, { target: ref });
    });

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(1);
      expect(service).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    });

    await waitFor(() => {
      expect(result.current.list).toEqual(mockList);
      expect(result.current.loading).toBe(false);
      expect(result.current.noMore).toBe(false);
    });
  });

  test('should not load on mount when manual is true', async () => {
    const service = vi.fn().mockResolvedValue({ list: [] });
    const container = createScrollContainer();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, { target: ref, manual: true });
    });

    expect(service).not.toHaveBeenCalled();
  });

  test('should append data when loadMore is called', async () => {
    const page1List = [{ id: 1 }, { id: 2 }];
    const page2List = [{ id: 3 }, { id: 4 }];
    const service = vi.fn().mockResolvedValueOnce({ list: page1List }).mockResolvedValueOnce({ list: page2List });

    const container = createScrollContainer();

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, { target: ref });
    });

    await waitFor(() => {
      expect(result.current.list).toEqual(page1List);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.list).toEqual([...page1List, ...page2List]);
      expect(service).toHaveBeenCalledTimes(2);
      expect(service).toHaveBeenNthCalledWith(1, { page: 1, pageSize: 10 });
      expect(service).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 10 });
    });
  });

  test('should use custom pageSize', async () => {
    const service = vi.fn().mockResolvedValue({ list: [] });
    const container = createScrollContainer();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, { target: ref, pageSize: 20 });
    });

    await waitFor(() => {
      expect(service).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });
  });

  test('should set noMore when isNoMore returns true', async () => {
    const mockList = [{ id: 1 }];
    const service = vi.fn().mockResolvedValue({ list: mockList });
    const container = createScrollContainer();

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, {
        target: ref,
        isNoMore: data => data.list.length < 10,
      });
    });

    await waitFor(() => {
      expect(result.current.list).toEqual(mockList);
      expect(result.current.noMore).toBe(true);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(service).toHaveBeenCalledTimes(1);
  });

  test('should not load more when noMore is true', async () => {
    const mockList = [{ id: 1 }];
    const service = vi.fn().mockResolvedValue({ list: mockList });
    const container = createScrollContainer();

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, {
        target: ref,
        isNoMore: () => true,
      });
    });

    await waitFor(() => {
      expect(result.current.noMore).toBe(true);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(service).toHaveBeenCalledTimes(1);
  });

  test('should trigger loadMore on scroll when reaching bottom', async () => {
    const page1List = [{ id: 1 }];
    const page2List = [{ id: 2 }];
    const service = vi.fn().mockResolvedValueOnce({ list: page1List }).mockResolvedValueOnce({ list: page2List });

    const container = createScrollContainer({
      scrollTop: 100,
      clientHeight: 100,
      scrollHeight: 200,
    });

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, { target: ref, buffer: 0 });
    });

    await waitFor(() => {
      expect(result.current.list).toEqual(page1List);
    });

    act(() => {
      container.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(result.current.list).toEqual([...page1List, ...page2List]);
      expect(service).toHaveBeenCalledTimes(2);
    });
  });

  test('should not throw when target.current is null', () => {
    const service = vi.fn().mockResolvedValue({ list: [] });

    expect(() => {
      renderHook(() => {
        const ref = useRef<HTMLDivElement | null>(null);
        return useInfiniteScroll(service, { target: ref });
      });
    }).not.toThrow();
  });

  test('should not load more when loading', async () => {
    let resolveFirst: (value: { list: { id: number }[] }) => void;
    const firstPromise = new Promise<{ list: { id: number }[] }>(resolve => {
      resolveFirst = resolve;
    });
    const service = vi.fn().mockReturnValue(firstPromise);

    const container = createScrollContainer();

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, { target: ref });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(service).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst!({ list: [{ id: 1 }] });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  test('should trigger loadMore before reaching bottom when buffer is set', async () => {
    const page1List = [{ id: 1 }];
    const page2List = [{ id: 2 }];
    const service = vi.fn().mockResolvedValueOnce({ list: page1List }).mockResolvedValueOnce({ list: page2List });

    const container = createScrollContainer({
      scrollTop: 80,
      clientHeight: 100,
      scrollHeight: 200,
    });

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(container);
      return useInfiniteScroll(service, { target: ref, buffer: 20 });
    });

    await waitFor(() => {
      expect(result.current.list).toEqual(page1List);
    });

    act(() => {
      container.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(result.current.list).toEqual([...page1List, ...page2List]);
      expect(service).toHaveBeenCalledTimes(2);
    });
  });
});
