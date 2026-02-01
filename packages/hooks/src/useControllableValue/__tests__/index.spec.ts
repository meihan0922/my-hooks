import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { useControllableValue } from '..';

describe('useControllableValue', () => {
  test('uncontrolled: should init from defaultValue', async () => {
    const hook = renderHook(() => useControllableValue({ defaultValue: 123 }));
    expect(hook.result.current[0]).toBe(123);
  });
  test('uncontrolled: setValue should update internal value and rerender', async () => {
    const hook = renderHook(() => useControllableValue({ defaultValue: 123 }));
    expect(hook.result.current[0]).toBe(123);

    act(() => {
      const setState = hook.result.current[1];
      setState(789);
    });

    expect(hook.result.current[0]).toBe(789);
  });
  test('controlled: value should always come from props.value', async () => {
    const hook = renderHook(({ value }) => useControllableValue({ value, defaultValue: 123 }), {
      initialProps: { value: 1 },
    });
    expect(hook.result.current[0]).toBe(1);

    hook.rerender({
      value: 111,
    });

    expect(hook.result.current[0]).toBe(111);
  });
  test('controlled: setValue should NOT change value if props.value does not change', async () => {
    const mockChange = vi.fn();
    const hook = renderHook(({ value }) => useControllableValue({ value, onChange: mockChange }), {
      initialProps: { value: 1 },
    });
    expect(hook.result.current[0]).toBe(1);

    act(() => {
      hook.result.current[1](111);
    });
    // 外部狀態沒改變，就不會改
    expect(hook.result.current[0]).toBe(1);
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenCalledWith(111);
  });
  test('setValue should forward extra args to onChange', () => {
    const onChange = vi.fn();

    const { result } = renderHook(() => useControllableValue<number>({ defaultValue: 0, onChange }));

    act(() => {
      const [, setValue] = result.current;
      setValue(7, 'event', { meta: 1 });
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(7, 'event', { meta: 1 });
  });

  test('should keep stable setter reference across rerenders', () => {
    const { result } = renderHook(() => useControllableValue<number>({ defaultValue: 0 }));

    const firstSetter = result.current[1];

    act(() => {
      firstSetter(1);
    });

    expect(result.current[1]).toBe(firstSetter);

    act(() => {
      firstSetter(2);
    });

    expect(result.current[1]).toBe(firstSetter);
  });
  test('uncontrolled: defaultValue should be used only once', () => {
    const { result, rerender } = renderHook(
      ({ dv }: { dv: number }) => useControllableValue<number>({ defaultValue: dv }),
      { initialProps: { dv: 1 } },
    );

    expect(result.current[0]).toBe(1);

    // 改 defaultValue 不應影響當前值
    rerender({ dv: 999 });
    expect(result.current[0]).toBe(1);

    act(() => {
      const [, setValue] = result.current;
      setValue(5);
    });

    expect(result.current[0]).toBe(5);

    // 再改 defaultValue 也不應回跳
    rerender({ dv: 123 });
    expect(result.current[0]).toBe(5);
  });

  test('controlled: should work in a parent-controlled scenario', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);

      const [innerValue, setInnerValue] = useControllableValue<number>({
        value,
        onChange: (v: number) => setValue(v),
      });

      return { value, setValue, innerValue, setInnerValue };
    });

    expect(result.current.innerValue).toBe(0);

    act(() => {
      result.current.setInnerValue(10);
    });

    // 父層更新 value 後，hook value 也跟著變
    expect(result.current.value).toBe(10);
    expect(result.current.innerValue).toBe(10);
  });
});
