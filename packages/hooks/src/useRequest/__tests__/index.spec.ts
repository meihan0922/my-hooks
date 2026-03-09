import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { useRequest } from '..';

/**
    1.	mount 時自動請求
  2.	manual: true 不自動請求
  3.	runAsync 成功時更新 data/loading
  4.	runAsync 失敗時更新 error/loading
  5.	race condition：後發先至時，只保留最新結果
  6.	unmount 後 resolve，不應該再 setState
 */
describe('useRequest', () => {
  test('should automatically request when mounted', async () => {
    const mockData = { data: 'testing' };
    const service = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useRequest(service));
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeUndefined();
    expect(service).toHaveBeenCalledTimes(1);
  });
  test('should not automatically request when manual is true', async () => {
    const mockData = { data: 'testing' };
    const service = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useRequest(service, { manual: true }));
    expect(service).not.toHaveBeenCalled();

    act(() => {
      result.current.run('param1', 'param2');
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(service).toHaveBeenCalledWith('param1', 'param2');
  });
  test('should update data and loading when runAsync succeeds', async () => {
    const mockData = { data: 'testing' };
    const service = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    let out;
    await act(async () => {
      out = await result.current.runAsync('param1');
    });

    expect(out).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeUndefined();
    expect(service).toHaveBeenCalledWith('param1');
  });
  test('should throw error when runAsync fails', async () => {
    const service = vi.fn().mockRejectedValue(new Error('test error'));
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    await act(async () => {
      expect(result.current.runAsync('param1')).rejects.toEqual(new Error('test error'));
    });
  });
  test('should update error and loading when runAsync fails', async () => {
    const error = new Error('test error');
    const service = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useRequest(service));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toEqual(error);
    expect(service).toHaveBeenCalledTimes(1);
  });
  test('throw error when runAsync fails', async () => {
    const service = vi.fn().mockRejectedValue('test error');
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    await expect(result.current.runAsync()).rejects.toEqual(new Error('test error'));
  });
  test('should handle race condition and keep latest result', async () => {
    const firstData = { id: 1, value: 'first' };
    const secondData = { id: 2, value: 'second' };

    const service = vi.fn().mockImplementation((id: number) => {
      const data = id === 1 ? firstData : secondData;
      const delay = id === 1 ? 100 : 50; // 第一個請求較慢，第二個較快
      return new Promise(resolve => setTimeout(() => resolve(data), delay));
    });

    const { result } = renderHook(() => useRequest(service, { manual: true }));

    // 快速連續發送兩個請求：先發 1，再發 2（第一個請求會被 abort，需 catch 避免 unhandled rejection）
    act(() => {
      result.current.run(1);
      result.current.run(2);
    });

    // 第二個請求 (50ms) 會先完成，第一個 (100ms) 後完成
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 150 },
    );

    // 應保留最快請求 (id: 2) 的結果
    expect(result.current.data).toEqual(secondData);
    expect(service).toHaveBeenCalledTimes(2);
  });
  test('should resolve when unmounting', async () => {
    vi.useFakeTimers();
    const service = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: 'testing' });
        }, 1000);
      });
    });
    const { result, unmount } = renderHook(() => useRequest(service));

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(service).toHaveBeenCalledTimes(1);
  });
  test('should not update state after unmount when request rejects', async () => {
    vi.useFakeTimers();

    const service = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('test error'));
        }, 1000);
      });
    });

    const { result, unmount } = renderHook(() => useRequest(service));

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(service).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
  test('should update error when run fails in manual mode', async () => {
    const error = new Error('run failed');
    const service = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    act(() => {
      void result.current.run('param');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
    expect(service).toHaveBeenCalledWith('param');
  });
  test('should use defaultParams on mount', async () => {
    const mockData = { data: 'testing' };
    const service = vi.fn().mockResolvedValue(mockData);
    const defaultParams = ['id-1', 'id-2'];
    const { result } = renderHook(() => useRequest(service, { defaultParams }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(service).toHaveBeenCalledWith('id-1', 'id-2');
  });
});
