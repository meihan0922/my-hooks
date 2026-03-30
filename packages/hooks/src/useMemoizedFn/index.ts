import { useRef } from 'react';

/**
 * 讓函式引用永遠穩定（stable reference）永遠用到最新的 props/state（no stale closure）
 * @param fn - 目標函式
 * @returns 穩定的函式引用
 */
export function useMemoizedFn<T extends (...args: any[]) => any>(fn: T): T {
  // 儲存最新的函式參考
  const fnRef = useRef<T>(fn);

  // 回傳給外面的穩定 wrapper
  const memoizedFn = useRef<T | null>(null);

  // 每次渲染都更新成最新的函式參考
  fnRef.current = fn;

  if (!memoizedFn.current) {
    memoizedFn.current = function (...args: Parameters<T>): ReturnType<T> {
      // @ts-expect-error: this typing issue，讓外部可以正確使用 this
      return fnRef.current.apply(this, args) as ReturnType<T>;
    } as T;
  }

  return memoizedFn.current;
}
