# useStorageState

將 state 持久化儲存至 `localStorage` 或 `sessionStorage`，用法與 `useState` 一致。

此模組提供三個 Hook：

- **useLocalStorageState**：儲存至 `localStorage`，資料在瀏覽器關閉後仍會保留
- **useSessionStorageState**：儲存至 `sessionStorage`，資料在分頁關閉後即清除
- **useCookieState**：儲存至 Cookie，資料可隨請求傳送至伺服器

## API

### useLocalStorageState

```typescript
const [state, setState] = useLocalStorageState<T>(
  key: string,
  options?: {
    defaultValue?: T | (() => T);
  }
);
```

### useSessionStorageState

```typescript
const [state, setState] = useSessionStorageState<T>(
  key: string,
  options?: {
    defaultValue?: T | (() => T);
  }
);
```

### useCookieState

```typescript
const [state, setState] = useCookieState<T>(
  key: string,
  options?: {
    defaultValue?: T | (() => T);
  }
);
```

### Params

| Parameters           | Details              | Type             | Default     |
| -------------------- | -------------------- | ---------------- | ----------- |
| key                  | 儲存鍵名             | `string`         | `-`         |
| options              | 可選配置             | `object`         | `{}`        |
| options.defaultValue | 預設值，可為值或函數 | `T \| (() => T)` | `undefined` |

### Result

| Parameters | Details  | Type                                   |
| ---------- | -------- | -------------------------------------- |
| state      | 當前狀態 | `T \| undefined`                       |
| setState   | 更新狀態 | `React.SetStateAction<T \| undefined>` |

### 行為說明

- 儲存時會使用 `JSON.stringify` 序列化，讀取時使用 `JSON.parse` 反序列化
- 當 `setState(undefined)` 時，會從 storage 中移除該 key
- 在 SSR 環境（`window` / `document` 為 undefined）時，會回傳 `defaultValue`，不會存取 storage
- 若 JSON 解析失敗，會回傳 `defaultValue` 並在 console 輸出錯誤
- **useCookieState**：Cookie 預設 `path=/`，清除時會設定過期時間以刪除

## Basic - useLocalStorageState

```jsx
import { useLocalStorageState } from '@my-hooks/hooks';

function Demo() {
  const [value, setValue] =
    useLocalStorageState <
    string >
    ('user-name',
    {
      defaultValue: 'Guest',
    });

  return (
    <div>
      <p>current value: {value}</p>
      <input value={value} onChange={e => setValue(e.target.value)} />
    </div>
  );
}
```

## Basic - useSessionStorageState

```jsx
import { useSessionStorageState } from '@my-hooks/hooks';

function Demo() {
  const [value, setValue] =
    useSessionStorageState <
    string >
    ('session-data',
    {
      defaultValue: 'initial',
    });

  return (
    <div>
      <p>current value: {value}</p>
      <button onClick={() => setValue('updated')}>更新</button>
    </div>
  );
}
```

## Basic - useCookieState

```jsx
import { useCookieState } from '@my-hooks/hooks';

function Demo() {
  const [value, setValue] =
    useCookieState <
    string >
    ('theme',
    {
      defaultValue: 'light',
    });

  return (
    <div>
      <p>current theme: {value}</p>
      <button onClick={() => setValue('light')}>Light</button>
      <button onClick={() => setValue('dark')}>Dark</button>
    </div>
  );
}
```

## 使用函數作為 defaultValue

```jsx
import { useLocalStorageState } from '@my-hooks/hooks';

function Demo() {
  const [state, setState] = useLocalStorageState('complex-state', {
    defaultValue: () => ({ count: 0, name: '' }),
  });

  return (
    <div>
      <p>{JSON.stringify(state)}</p>
      <button onClick={() => setState(prev => (prev ? { ...prev, count: prev.count + 1 } : undefined))}>
        increment
      </button>
    </div>
  );
}
```

## 清除儲存的值

將 state 設為 `undefined` 會從 storage 中移除該 key：

```jsx
import { useLocalStorageState } from '@my-hooks/hooks';

function Demo() {
  const [value, setValue] = useLocalStorageState < string > 'temp-data';

  return (
    <div>
      <p>current value: {value ?? '(empty)'}</p>
      <button onClick={() => setValue('saved')}>儲存</button>
      <button onClick={() => setValue(undefined)}>清除</button>
    </div>
  );
}
```
