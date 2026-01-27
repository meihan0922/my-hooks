import { useMemo } from 'react';

import { useToggle } from '../useToggle';

export interface Actions {
  set: (value: boolean) => void;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
}

/**
 * Toggle between booleans
 *
 * @param defaultValue - Initial value. Default is false.
 * @returns [currentValue, { toggle: Fn, set: Fn, setTrue: Fn, setFalse: Fn }]
 **/
export function useBoolean(defaultValue = false): [boolean, Actions] {
  const [state, { set, toggle }] = useToggle(!!defaultValue);

  const actions: Actions = useMemo(() => {
    return {
      set: value => set(!!value),
      toggle,
      setTrue: () => set(true),
      setFalse: () => set(false),
    };
  }, []);

  return [state, actions];
}
