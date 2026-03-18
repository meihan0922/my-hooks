# useClickAway

監聽點擊發生在目標元素外部的事件。當使用者點擊或觸碰目標區域以外時，會觸發回調。適用於下拉選單、彈窗、tooltip 等需要「點擊外部關閉」的場景。

## API

```typescript
function useClickAway<T extends HTMLElement = HTMLElement>(
  target: Target<T>,
  onClickAway: (event: Event) => void,
  events?: string[],
): void;
```

### Params

| Parameters  | Details                                 | Type                                                         | Default                       |
| ----------- | --------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| target      | 要排除的目標元素（ref、DOM 元素或陣列） | `RefObject<T> \| T \| null \| undefined \| TargetValue<T>[]` | -                             |
| onClickAway | 點擊目標外部時觸發的回調                | `(event: Event) => void`                                     | -                             |
| events      | 要監聽的事件名稱列表                    | `string[]`                                                   | `['mousedown', 'touchstart']` |

## Basic

```jsx
import React, { useState, useRef } from 'react';
import { useClickAway } from '@my-hooks/hooks';

function Demo() {
  const [visible, setVisible] = useState(false);
  const dropdownRef = useRef(null);

  useClickAway(dropdownRef, () => {
    setVisible(false);
  });

  return (
    <div>
      <button onClick={() => setVisible(true)}>開啟選單</button>
      {visible && (
        <div ref={dropdownRef} className="dropdown">
          下拉選單內容
        </div>
      )}
    </div>
  );
}
```

## 多個目標元素

`target` 可傳入單一 ref/元素，或 ref/元素陣列。點擊在任一目標內部時，不會觸發 `onClickAway`：

```jsx
import React, { useState, useRef } from 'react';
import { useClickAway } from '@my-hooks/hooks';

function Demo() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useClickAway([triggerRef, panelRef], () => {
    setOpen(false);
  });

  return (
    <div>
      <button ref={triggerRef} onClick={() => setOpen(!open)}>
        切換
      </button>
      {open && <div ref={panelRef}>面板內容</div>}
    </div>
  );
}
```

## 自訂監聽事件

預設監聽 `mousedown` 與 `touchstart`，可透過第三參數自訂。建議傳入穩定引用（如 `useMemo` 或模組級常數），避免每次 render 產生新陣列導致重複綁定：

```jsx
import React, { useState, useRef, useMemo } from 'react';
import { useClickAway } from '@my-hooks/hooks';

function Demo() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  const events = useMemo(() => ['click'], []);

  useClickAway(ref, () => setVisible(false), events);

  return <div ref={ref}>{visible ? '已開啟' : '已關閉'}</div>;
}
```

## 行為說明

- **目標支援**：`target` 可為 React `RefObject`、DOM 元素，或兩者的陣列
- **點擊判定**：使用 `contains` 判斷點擊是否在目標內部，在內部則不觸發
- **SSR 安全**：在 `document` 不存在時（如 SSR）不會註冊事件
- **事件清理**：元件卸載時會自動移除所有事件監聽
