import { useRef } from 'react';

/**
 * 一個不觸發 render 的同步快照。
 * 回傳一個 ref，ref.current 永遠是最新的 value，而且 更新不觸發 re-render。
 * @param val - 任意值
 * @returns val
 */
export function useLatest<T>(val: T): Readonly<{ current: T }> {
  const valueRef = useRef<T>(val);

  valueRef.current = val;

  return valueRef;
}
