# useFocusWithin

監聽焦點是否在目標元素內部。當焦點進入或離開目標區域時，會觸發對應回調。使用 `focusin` / `focusout` 事件（🌟會冒泡），可正確處理內部多個可聚焦元素的焦點切換。適用於表單區塊、下拉選單、搜尋框等需要「焦點在內/外」狀態的場景。

## API

```typescript
function useFocusWithin<T extends HTMLElement>(ref: React.RefObject<T | null>, options?: FocusWithinOptions): void;

type FocusWithinOptions = {
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
};
```

### Params

| Parameters | Details              | Type                         | Default |
| ---------- | -------------------- | ---------------------------- | ------- |
| ref        | 要監聽的目標元素 ref | `React.RefObject<T \| null>` | -       |
| options    | 回調設定             | `FocusWithinOptions`         | `{}`    |

## Basic

```jsx
import React, { useRef, useState } from 'react';
import { useFocusWithin } from '@my-hooks/hooks';

function Demo() {
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  useFocusWithin(containerRef, {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  return (
    <div ref={containerRef} style={{ border: focused ? '2px solid blue' : '1px solid gray' }}>
      <input placeholder="輸入框 1" />
      <input placeholder="輸入框 2" />
      <p>焦點在內：{focused ? '是' : '否'}</p>
    </div>
  );
}
```

## 焦點在內部移動不觸發 onBlur

當焦點從一個可聚焦元素移到同容器內另一個元素時，不會觸發 `onBlur`：

```jsx
import React, { useRef, useState } from 'react';
import { useFocusWithin } from '@my-hooks/hooks';

function Demo() {
  const [blurCount, setBlurCount] = useState(0);
  const ref = useRef(null);

  useFocusWithin(ref, {
    onBlur: () => setBlurCount(c => c + 1),
  });

  return (
    <div ref={ref}>
      <input />
      <button type="button">按鈕</button>
      <p>離開容器次數：{blurCount}</p>
    </div>
  );
}
```

## 行為說明

- **focusin / focusout**：使用會冒泡的事件，可正確處理容器內多個可聚焦元素
- **relatedTarget 判定**：`onBlur` 透過 `event.relatedTarget` 判斷焦點是否移到容器外；若為 `null`（如點擊 body）或不在容器內，則觸發
- **可選回調**：`onFocus`、`onBlur` 皆可省略，未傳入時不會執行任何操作
- **事件清理**：元件卸載時會自動移除事件監聽
