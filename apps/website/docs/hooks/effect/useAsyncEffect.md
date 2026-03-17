# useAsyncEffect

用來執行非同步副作用的 hook，類似 `useEffect`，但支援 async/await。當元件卸載時，會標記為已取消，讓你在 effect 內透過 `isCancelled()` 檢查，避免在 unmount 後執行 setState 等操作。

## API

```typescript
useAsyncEffect(effect: (isCancelled: () => boolean) => Promise<void>, deps?: any[]);
```

### Params

| Parameters | Details                    | Type                                            | Default |
| ---------- | -------------------------- | ----------------------------------------------- | ------- |
| effect     | 非同步 effect 函式         | `(isCancelled: () => boolean) => Promise<void>` | -       |
| deps       | 依賴陣列，變更時會重新執行 | `any[]`                                         | `[]`    |

### Result

無回傳值。

## Basic

```tsx
import { useAsyncEffect } from '@my-hooks/hooks';

function Demo() {
  const [data, setData] = useState(null);

  useAsyncEffect(async isCancelled => {
    const res = await fetch('/api/data');
    const json = await res.json();

    // 避免 unmount 後 setState
    if (!isCancelled()) {
      setData(json);
    }
  }, []);

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}
```

## 行為說明

- **依賴變更重新執行**：當 `deps` 陣列中的值變更時，會重新執行 effect
- **卸載時標記取消**：元件 unmount 時，`isCancelled()` 會回傳 `true`
- **避免記憶體洩漏**：在 async 流程完成後，應先呼叫 `isCancelled()` 再執行 setState，避免對已卸載元件更新狀態
- **錯誤處理**：effect 內的錯誤會被 catch，若未取消則會輸出至 console.error
