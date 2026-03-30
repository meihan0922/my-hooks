import React, { useEffect } from 'react';

import { useMemoizedFn } from '../useMemoizedFn';

type FocusWithinOptions = {
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
};

const noop = () => {};

export function useFocusWithin<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: FocusWithinOptions = {},
) {
  const { onFocus, onBlur } = options;
  const onFocusHandler = useMemoizedFn(onFocus ?? noop);
  const onBlurHandler = useMemoizedFn(onBlur ?? noop);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleFocusIn = (event: FocusEvent) => {
      onFocusHandler?.(event);
    };

    const handleFocusOut = (event: FocusEvent) => {
      // relatedTarget 是失去焦點的元素，是 FocusEvent 介面的一個只讀屬性，它代表著一個次要的目標
      const relatedTarget = event.relatedTarget as Node | null;
      // 許多元素無法獲得焦點，relatedTarget 就有可能 null
      if (!relatedTarget || !el.contains(relatedTarget)) {
        onBlurHandler?.(event);
      }
    };

    el.addEventListener('focusin', handleFocusIn);
    el.addEventListener('focusout', handleFocusOut);

    return () => {
      el.removeEventListener('focusin', handleFocusIn);
      el.removeEventListener('focusout', handleFocusOut);
    };
  }, [ref]);
}
