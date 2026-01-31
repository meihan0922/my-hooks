import { useState } from 'react';

import { useMemoizedFn } from '../useMemorizedFn';

/**
 * Return a function which can be used to force update the component.
 * @return fn
 */
export function useUpdate() {
  const [, setState] = useState({});
  // 必須回傳一個 stable 函式，確定他是穩定的引用，不然會破壞使用者的 memo
  const forceUpdate = useMemoizedFn(() => setState({}));

  return forceUpdate;
}
