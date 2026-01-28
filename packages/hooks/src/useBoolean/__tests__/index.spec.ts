import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useBoolean } from '..';

describe('useBoolean', () => {
  test('test defaultValue', async () => {
    const hook = renderHook(() => useBoolean(true));
    expect(hook.result.current[0]).toBe(true);

    const hookWithoutDefault = renderHook(() => useBoolean());
    expect(hookWithoutDefault.result.current[0]).toBe(false);

    // @ts-expect-error: testing only
    const strHook = renderHook(() => useBoolean(''));

    expect(strHook.result.current[0]).toBe(false);

    // @ts-expect-error: testing only
    const numHook = renderHook(() => useBoolean(1));

    expect(numHook.result.current[0]).toBe(true);
  });

  test('test actions', async () => {
    const hook = renderHook(() => useBoolean());

    act(() => hook.result.current[1].toggle());

    expect(hook.result.current[0]).toBe(true);

    // @ts-expect-error: testing only
    act(() => hook.result.current[1].set(0));

    expect(hook.result.current[0]).toBe(false);

    // @ts-expect-error: testing only
    act(() => hook.result.current[1].set('hello'));

    expect(hook.result.current[0]).toBe(true);

    act(() => hook.result.current[1].setFalse());

    expect(hook.result.current[0]).toBe(false);

    act(() => hook.result.current[1].setTrue());

    expect(hook.result.current[0]).toBe(true);
  });
});
