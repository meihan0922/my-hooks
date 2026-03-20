import { useEffect, useState } from 'react';

type SelectionState = {
  text: string;
  rect: DOMRect | null;
} | null;

export function useTextSelection() {
  const [selection, setSelection] = useState<SelectionState>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const text = selection.toString();

      // 可能是 ''
      if (!text) {
        setSelection(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({ text, rect });
    };

    document.addEventListener('selectionchange', handler);

    return () => {
      document.removeEventListener('selectionchange', handler);
    };
  }, []);

  return selection;
}
