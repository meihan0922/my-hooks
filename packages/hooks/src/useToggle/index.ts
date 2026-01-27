import { useMemo, useState } from 'react';

export interface Actions<T> {
  set: (value: T) => void;
  toggle: () => void;
}

/**
 * Toggle between a boolean or any two values.
 *
 * @param defaultValue - Initial value. Default is false.
 * @param reverseValue - Toggle value. If not provided, it will be the opposite of the default value.
 * @returns [currentValue, { toggle: Fn, set: Fn }]
 **/
export function useToggle<T = boolean, R = T>(
  defaultValue: T = false as unknown as T,
  reverseValue?: R,
): [T | R, Actions<T | R>] {
  const [state, setState] = useState<T | R>(defaultValue);

  const actions: Actions<T | R> = useMemo(() => {
    const reverseValueOriginal = reverseValue ?? !defaultValue;
    return {
      toggle: () =>
        setState(prev =>
          prev === defaultValue ? (reverseValueOriginal as unknown as R) : (defaultValue as unknown as T),
        ),
      set: (value: T | R) => setState(value),
    };
  }, []);

  return [state, actions];
}
