# useCreation

旨在解決「絕對只執行一次的初始化」工具。React 無法保證 `useRef`、`useMemo` 的初始化語意。（`useMemo` 設計重點是快取計算結果，在某些情境下（開發 mode、Strict Mode），以 function 為參數的初始化會不只執行一次。）

`useCreation` 可取代 `useRef` `useMemo` ，適用於建立 class 實例、昂貴物件、或只想在 deps 改變時重建的資源。透過自行比對 deps 來決定是否重建，確保 factory 只在依賴變動時執行。

## API

```typescript
const value = useCreation<T>(factory: () => T, deps: React.DependencyList): T;
```

### Params

| Parameters | Details              | Type                   | Default |
| ---------- | -------------------- | ---------------------- | ------- |
| factory    | 建立值的工廠函式     | `() => T`              | -       |
| deps       | 依賴陣列，變動時重建 | `React.DependencyList` | -       |

### Result

| Parameters | Details                                      | Type |
| ---------- | -------------------------------------------- | ---- |
| value      | 由 factory 建立的值，deps 不變時保持同一引用 | `T`  |

## Basic

```jsx
import { useCreation } from '@my-hooks/hooks';

function Demo() {
  const expensiveObj = useCreation(
    () => ({
      count: 0,
      data: new Map(),
    }),
    [],
  );

  return <div>{/* 使用 expensiveObj，不會因重新渲染而重建 */}</div>;
}
```

## 建立 Class 實例

```jsx
import { useCreation } from '@my-hooks/hooks';

class Store {
  constructor(initialState) {
    this.state = initialState;
  }
  // ...
}

function Demo({ userId }) {
  const store = useCreation(() => new Store({ userId }), [userId]);

  return <div>{/* store 只在 userId 改變時重建 */}</div>;
}
```

## 行為說明

- **deps 比對**：使用 `Object.is` 逐項比對 deps，只有當任一依賴變動時才會重新執行 factory
- **穩定引用**：deps 不變時，回傳值保持同一引用，不會因重新渲染而重建
- **與 useMemo 差異**：`useCreation` 保證 factory 的執行時機完全由 deps 控制，不受 React Strict Mode 等影響
