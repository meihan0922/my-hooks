import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { cachePlugin, debouncePlugin, pollingPlugin, retryPlugin, useRequest } from '..';

describe('retryPlugin', () => {
  test('should retry until success', async () => {
    vi.useRealTimers();
    const service = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValueOnce({ data: 'success' });

    const { result } = renderHook(() =>
      useRequest(service, {
        manual: true,
        pluginFactories: [retryPlugin(2, 1000)],
      }),
    );

    vi.useFakeTimers();

    await act(async () => {
      result.current.run('A');
    });

    expect(service).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenLastCalledWith('A');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(service).toHaveBeenCalledTimes(2);
    expect(service).toHaveBeenLastCalledWith('A');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(service).toHaveBeenCalledTimes(3);
    expect(service).toHaveBeenLastCalledWith('A');

    expect(result.current.data).toEqual({ data: 'success' });
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(false);
    vi.useRealTimers();
  });

  test('should stop retrying after retryCount is exhausted', async () => {
    vi.useRealTimers();
    const service = vi.fn().mockRejectedValue(new Error('always fail'));

    const { result } = renderHook(() =>
      useRequest(service, {
        manual: true,
        pluginFactories: [retryPlugin(2, 1000)],
      }),
    );

    vi.useFakeTimers();

    await act(async () => {
      result.current.run('A');
    });
    expect(service).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(service).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(service).toHaveBeenCalledTimes(3);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(service).toHaveBeenCalledTimes(3);

    expect(result.current.error).toEqual(new Error('always fail'));
    expect(result.current.loading).toBe(false);
    vi.useRealTimers();
  });

  test('manual new run should invalidate previous pending retry', async () => {
    vi.useRealTimers();
    const service = vi.fn().mockRejectedValueOnce(new Error('fail-old')).mockResolvedValueOnce({ data: 'new-success' });

    const { result } = renderHook(() =>
      useRequest(service, {
        manual: true,
        pluginFactories: [retryPlugin(2, 1000)],
      }),
    );

    vi.useFakeTimers();

    await act(async () => {
      result.current.run('old');
    });
    expect(service).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenLastCalledWith('old');

    await act(async () => {
      result.current.run('new');
    });
    expect(service).toHaveBeenCalledTimes(2);
    expect(service).toHaveBeenLastCalledWith('new');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(service).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ data: 'new-success' });
    vi.useRealTimers();
  });

  test('cancel should clear pending retry', async () => {
    vi.useRealTimers();
    const service = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      useRequest(service, {
        manual: true,
        pluginFactories: [retryPlugin(2, 1000)],
      }),
    );

    vi.useFakeTimers();

    await act(async () => {
      result.current.run('A');
    });
    expect(service).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.cancel();
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(service).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  test('unmount should clear pending retry', async () => {
    vi.useRealTimers();
    const service = vi.fn().mockRejectedValue(new Error('fail'));

    const { result, unmount } = renderHook(() =>
      useRequest(service, {
        manual: true,
        pluginFactories: [retryPlugin(2, 1000)],
      }),
    );

    vi.useFakeTimers();

    await act(async () => {
      result.current.run('A');
    });
    expect(service).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(service).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

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
      await expect(result.current.runAsync('param1')).rejects.toEqual(new Error('test error'));
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
    vi.useRealTimers();
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
  test('refresh should call service with last params', async () => {
    const service = vi.fn().mockResolvedValue({ data: 'testing' });
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    await act(async () => {
      await result.current.runAsync('param1');
    });

    expect(service).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenLastCalledWith('param1');

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(2);
    });

    expect(service).toHaveBeenLastCalledWith('param1');
  });
  test('refreshAsync should call service with last params', async () => {
    const mockData = { data: 'testing' };
    const service = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    await act(async () => {
      await result.current.runAsync('param1');
    });

    expect(service).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenLastCalledWith('param1');

    let out;
    await act(async () => {
      out = await result.current.refreshAsync();
    });

    expect(out).toEqual(mockData);
    expect(service).toHaveBeenCalledTimes(2);
    expect(service).toHaveBeenLastCalledWith('param1');
  });
  test('refreshAsync should not call service if last params is not set', async () => {
    const service = vi.fn().mockResolvedValue({ data: 'testing' });
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    let out;
    await act(async () => {
      out = await result.current.refreshAsync();
    });

    expect(out).toBeUndefined();
    expect(service).not.toHaveBeenCalled();
  });
  test('refresh should use latest params', async () => {
    const service = vi.fn().mockResolvedValue({ data: 'testing' });
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    await act(async () => {
      await result.current.runAsync('param1');
    });

    await act(async () => {
      await result.current.runAsync('param2');
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(service).toHaveBeenCalledTimes(3);
    });

    expect(service).toHaveBeenNthCalledWith(1, 'param1');
    expect(service).toHaveBeenNthCalledWith(2, 'param2');
    expect(service).toHaveBeenNthCalledWith(3, 'param2');
  });
  test('refreshAsync should retry with last params after previous failure', async () => {
    const service = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({ data: 'success' });

    const { result } = renderHook(() => useRequest(service, { manual: true }));

    await expect(result.current.runAsync('param1')).rejects.toThrow('fail');

    let out;
    await act(async () => {
      out = await result.current.refreshAsync();
    });

    expect(out).toEqual({ data: 'success' });
    expect(service).toHaveBeenCalledTimes(2);
    expect(service).toHaveBeenNthCalledWith(1, 'param1');
    expect(service).toHaveBeenNthCalledWith(2, 'param1');
  });

  describe('plugins', () => {
    test('onBefore with stopNow: true should not call service', async () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });
      const onBefore = vi.fn().mockReturnValue({ stopNow: true });
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [() => ({ onBefore })] }),
      );

      act(() => {
        result.current.run('param');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(service).not.toHaveBeenCalled();
      expect(onBefore).toHaveBeenCalledWith(['param']);
      expect(result.current.data).toBeUndefined();
    });
    test('onBefore with returnNow: true should return data without calling service', async () => {
      const returnData = { id: 1, value: 'from plugin' };
      const service = vi.fn().mockResolvedValue({ data: 'from service' });
      const onBefore = vi.fn().mockReturnValue({ returnNow: true, data: returnData });
      const onSuccess = vi.fn();
      const onFinally = vi.fn();
      const { result } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [() => ({ onBefore, onSuccess, onFinally })],
        }),
      );

      act(() => {
        result.current.run('param');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(service).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(returnData);
      expect(onSuccess).toHaveBeenCalledWith(returnData, ['param']);
      expect(onFinally).toHaveBeenCalledWith(['param'], returnData, undefined);
    });
    test('onSuccess should be called when request succeeds', async () => {
      const mockData = { data: 'testing' };
      const service = vi.fn().mockResolvedValue(mockData);
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [() => ({ onSuccess })] }),
      );

      await act(async () => {
        await result.current.runAsync('param1', 'param2');
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData, ['param1', 'param2']);
    });
    test('onError should be called when request fails', async () => {
      const error = new Error('test error');
      const service = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [() => ({ onError })] }),
      );

      await act(async () => {
        try {
          await result.current.runAsync('param');
        } catch {
          // ignore
        }
      });

      expect(onError).toHaveBeenCalledWith(error, ['param']);
    });
    test('onFinally should be called on success with data', async () => {
      const mockData = { data: 'testing' };
      const service = vi.fn().mockResolvedValue(mockData);
      const onFinally = vi.fn();
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [() => ({ onFinally })] }),
      );

      await act(async () => {
        await result.current.runAsync('param');
      });

      expect(onFinally).toHaveBeenCalledWith(['param'], mockData, undefined);
    });
    test('onFinally should be called on error with error', async () => {
      const error = new Error('test error');
      const service = vi.fn().mockRejectedValue(error);
      const onFinally = vi.fn();
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [() => ({ onFinally })] }),
      );

      await act(async () => {
        try {
          await result.current.runAsync('param');
        } catch {
          // ignore
        }
      });

      expect(onFinally).toHaveBeenCalledWith(['param'], undefined, error);
    });
    test('multiple plugins should all be invoked', async () => {
      const mockData = { data: 'testing' };
      const service = vi.fn().mockResolvedValue(mockData);
      const onSuccess1 = vi.fn();
      const onSuccess2 = vi.fn();
      const { result } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [() => ({ onSuccess: onSuccess1 }), () => ({ onSuccess: onSuccess2 })],
        }),
      );

      await act(async () => {
        await result.current.runAsync('param');
      });

      expect(onSuccess1).toHaveBeenCalledWith(mockData, ['param']);
      expect(onSuccess2).toHaveBeenCalledWith(mockData, ['param']);
    });
    test('later plugin onBefore with stopNow should stop request', async () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });

      const onBefore1 = vi.fn();
      const onBefore2 = vi.fn().mockReturnValue({ stopNow: true });

      const { result } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [() => ({ onBefore: onBefore1 }), () => ({ onBefore: onBefore2 })],
        }),
      );

      act(() => {
        result.current.run('param');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(onBefore1).toHaveBeenCalledWith(['param']);
      expect(onBefore2).toHaveBeenCalledWith(['param']);
      expect(service).not.toHaveBeenCalled();
    });
    test('later plugin onBefore with returnNow should return data without calling service', async () => {
      const returnData = { id: 2, value: 'from second plugin' };
      const service = vi.fn().mockResolvedValue({ data: 'from service' });

      const onBefore1 = vi.fn();
      const onBefore2 = vi.fn().mockReturnValue({ returnNow: true, data: returnData });

      const onSuccess1 = vi.fn();
      const onSuccess2 = vi.fn();

      const { result } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [
            () => ({ onBefore: onBefore1, onSuccess: onSuccess1 }),
            () => ({ onBefore: onBefore2, onSuccess: onSuccess2 }),
          ],
        }),
      );

      act(() => {
        result.current.run('param');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(service).not.toHaveBeenCalled();
      expect(result.current.data).toEqual(returnData);
      expect(onSuccess1).toHaveBeenCalledWith(returnData, ['param']);
      expect(onSuccess2).toHaveBeenCalledWith(returnData, ['param']);
    });
    test('runAsync should resolve plugin data when onBefore returns returnNow', async () => {
      const returnData = { id: 1, value: 'from plugin' };
      const service = vi.fn().mockResolvedValue({ data: 'from service' });

      const { result } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [() => ({ onBefore: () => ({ returnNow: true, data: returnData }) })],
        }),
      );

      let out;
      await act(async () => {
        out = await result.current.runAsync('param');
      });

      expect(out).toEqual(returnData);
      expect(service).not.toHaveBeenCalled();
    });
  });

  describe('cachePlugin', () => {
    test('should cache data when request succeeds', async () => {
      const service = vi.fn().mockResolvedValueOnce({ name: 'A' }).mockResolvedValueOnce({ name: 'B' });

      const { result } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [cachePlugin()],
        }),
      );

      await act(async () => {
        await result.current.run(1);
      });

      await act(async () => {
        await result.current.run(1);
      });

      expect(service).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual({ name: 'A' });
    });
  });

  describe('pollingPlugin', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    test('should poll request repeatedly', async () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [pollingPlugin(1000)] }),
      );

      await act(() => {
        result.current.run('A');
      });

      expect(service).toHaveBeenCalledTimes(1);

      await act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(service).toHaveBeenCalledTimes(2);

      await act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(service).toHaveBeenCalledTimes(3);
    });
    test('should cancel request when unmount', async () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });
      const { result, unmount } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [pollingPlugin(1000)] }),
      );
      act(() => {
        result.current.run('A');
      });

      expect(service).toHaveBeenCalledTimes(1);

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(service).toHaveBeenCalledTimes(1);
    });
    test('pollingPlugin should stop polling when cancel is called', () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });

      const { result } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [pollingPlugin(1000)],
        }),
      );

      act(() => {
        result.current.run('A');
      });

      expect(service).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.cancel();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(service).toHaveBeenCalledTimes(1);
    });
  });

  describe('debouncePlugin', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    test('debouncePlugin should clear pending request after unmount', () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });

      const { result, unmount } = renderHook(() =>
        useRequest(service, {
          manual: true,
          pluginFactories: [debouncePlugin(1000)],
        }),
      );

      act(() => {
        result.current.run('A');
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(service).toHaveBeenCalledTimes(0);
    });
    test('debouncePlugin should cancel request when cancel is called', async () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [debouncePlugin(1000)] }),
      );
      await act(async () => {
        result.current.run('A');
      });

      expect(service).toHaveBeenCalledTimes(0);

      await act(async () => {
        result.current.cancel();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(service).toHaveBeenCalledTimes(0);
    });
    test('should debounce request', async () => {
      const service = vi.fn().mockResolvedValue({ data: 'testing' });
      const { result } = renderHook(() =>
        useRequest(service, { manual: true, pluginFactories: [debouncePlugin(1000)] }),
      );

      act(() => {
        result.current.run('A');
        result.current.run('B');
        result.current.run('C');
      });

      // 時間還沒到，不應該發 request
      expect(service).toHaveBeenCalledTimes(0);

      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(service).toHaveBeenCalledTimes(0);

      act(async () => {
        vi.advanceTimersByTime(1);
      });

      expect(service).toHaveBeenCalledTimes(1);
      expect(service).toHaveBeenCalledWith('C');
    });
  });
});
