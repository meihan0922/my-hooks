import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useToggle } from '..';

describe('useToggle', () => {
  test('test defaultValue on init', async () => {
    const hook = renderHook(() => useToggle());
    expect(hook.result.current[0]).toBe(false);
  });

  test("test toggle when reverseValue isn't provided", async () => {
    const hook = renderHook(() => useToggle('hello'));

    act(() => hook.result.current[1].toggle());

    expect(hook.result.current[0]).toBeFalsy();
  });

  test('test reverseValue on toggle', async () => {
    const hook = renderHook(() => useToggle('hello', 'world'));

    act(() => hook.result.current[1].toggle());
    expect(hook.result.current[0]).toBe('world');

    act(() => hook.result.current[1].set('hello'));
    expect(hook.result.current[0]).toBe('hello');
  });
});
