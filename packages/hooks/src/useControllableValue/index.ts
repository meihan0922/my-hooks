import { useState } from 'react';

import { useMemoizedFn } from '..';

type Options<T> = {
  value?: T;
  defaultValue?: T;
  onChange?: (v: T, ...args: any[]) => void;
};

export function useControllableValue<T>(options: Options<T>): [T | undefined, (v: T, ...args: any[]) => void] {
  const isControlled = options.value !== undefined;

  // 非受控內部狀態：defaultValue 只用來初始化一次
  const [innerValue, setInnerValue] = useState<T | undefined>(() => options.defaultValue);

  // 受控組件，永遠只提供父層 value，
  // 非受控組件，提供內部狀態
  const value = isControlled ? options.value : innerValue;

  const setState = useMemoizedFn((v: T, ...args: any[]) => {
    options?.onChange?.(v, ...args);
    // 非受控組件，觸發更新
    if (!isControlled) {
      setInnerValue(v);
    }
  });

  return [value, setState];
}
