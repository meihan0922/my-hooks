# useTextSelection

監聽使用者的文字選取狀態。當使用者在頁面上選取文字時，會回傳選取的文字內容與其邊界矩形（`DOMRect`）。適用於高亮註解、選取複製、浮動工具列等需要取得選取範圍的場景。

## API

```typescript
function useTextSelection(): SelectionState | null;

type SelectionState = {
  text: string;
  rect: DOMRect | null;
};
```

### Returns

| 回傳值    | Details                     | Type                     |
| --------- | --------------------------- | ------------------------ |
| selection | 選取狀態，無選取時為 `null` | `SelectionState \| null` |

### SelectionState

| 屬性 | 說明             | 型別              |
| ---- | ---------------- | ----------------- |
| text | 選取的文字內容   | `string`          |
| rect | 選取範圍邊界矩形 | `DOMRect \| null` |

## Basic

```jsx
import React from 'react';
import { useTextSelection } from '@my-hooks/hooks';

function Demo() {
  const selection = useTextSelection();

  return (
    <div>
      <p>請選取這段文字試試看。選取後會顯示選取內容與位置。</p>
      {selection ? (
        <div>
          <p>選取文字：{selection.text}</p>
          <p>邊界矩形：{selection.rect ? `${selection.rect.width}x${selection.rect.height}` : 'N/A'}</p>
        </div>
      ) : (
        <p>目前無選取</p>
      )}
    </div>
  );
}
```

## 搭配浮動工具列

利用 `rect` 可將工具列定位在選取文字附近：

```jsx
import React, { useState } from 'react';
import { useTextSelection } from '@my-hooks/hooks';

function Demo() {
  const selection = useTextSelection();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (selection?.text) {
      navigator.clipboard.writeText(selection.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div>
      <p>選取文字後會出現複製按鈕。</p>
      {selection?.rect && (
        <div
          style={{
            position: 'fixed',
            left: selection.rect.left,
            top: selection.rect.top - 40,
            padding: '4px 8px',
            background: '#333',
            color: '#fff',
            borderRadius: 4,
          }}
        >
          <button type="button" onClick={handleCopy}>
            {copied ? '已複製' : '複製'}
          </button>
        </div>
      )}
    </div>
  );
}
```

## 行為說明

- **selectionchange 事件**：監聽 `document` 的 `selectionchange`，選取變更時即時更新
- **無選取時為 null**：未選取、選取為空字串、或 `rangeCount === 0` 時回傳 `null`
- **rect 來源**：透過 `Range.getBoundingClientRect()` 取得，為相對於視窗的座標
- **SSR 安全**：在 `window` 不存在時（如 SSR）不會註冊事件
- **事件清理**：元件卸載時會自動移除 `selectionchange` 監聽
