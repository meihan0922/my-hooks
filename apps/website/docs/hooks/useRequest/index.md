# useRequest

把非同步請求的生命週期包進去的 hook，並且：

- mount 時自動請求，除非 `manual` 為 `true`
- `run` / `runAsync` 成功與失敗時自動更新 `data` / `loading` / `error`
- 處理 race condition，保留最新請求的結果
- unmount 後不再 setState，避免 memory leak

## API

```typescript
const { data, error, loading, run, runAsync } = useRequest<TData, TParams>(
  service,
  { defaultParams?, manual? }
);
```

### Params

| Parameters | Details        | Type                                   | Default |
| ---------- | -------------- | -------------------------------------- | ------- |
| service    | 非同步請求函式 | `(...args: TParams) => Promise<TData>` | -       |
| options    | 請求的控制選項 | `Options<TParams>`                     | `{}`    |

### Options

| Parameters    | Details                | Type      | Default |
| ------------- | ---------------------- | --------- | ------- |
| defaultParams | mount 時自動請求的參數 | `TParams` | `[]`    |
| manual        | 為 true 時不自動請求   | `boolean` | `false` |

### Result

| Parameters | Details                                  | Type                                   |
| ---------- | ---------------------------------------- | -------------------------------------- |
| data       | 請求成功後的資料                         | `TData \| undefined`                   |
| error      | 請求失敗時的錯誤                         | `Error \| undefined`                   |
| loading    | 請求進行中                               | `boolean`                              |
| run        | 觸發請求，錯誤會更新到 error，不會往外拋 | `(...args: TParams) => void`           |
| runAsync   | 觸發請求，錯誤會往外拋並更新到 error     | `(...args: TParams) => Promise<TData>` |

## Basic

```tsx
import React from 'react';
import { useRequest } from '@my-hooks/hooks';

const fetchUser = (id: string) => fetch(`https://api.example.com/users/${id}`).then(res => res.json());

export default () => {
  const { data, loading, error } = useRequest(fetchUser, {
    defaultParams: ['1'],
  });

  if (loading) return <p>載入中...</p>;
  if (error) return <p>錯誤：{error.message}</p>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};
```

## Manual

當 `manual` 為 `true` 時，不會在 mount 時自動請求，需手動呼叫 `run` 或 `runAsync`：

```tsx
import React from 'react';
import { useRequest } from '@my-hooks/hooks';

const fetchUser = (id: string) => fetch(`https://api.example.com/users/${id}`).then(res => res.json());

export default () => {
  const { data, loading, error, run } = useRequest(fetchUser, {
    manual: true,
  });

  return (
    <div>
      <button onClick={() => run('1')} disabled={loading}>
        {loading ? '載入中...' : '取得使用者'}
      </button>
      {error && <p>錯誤：{error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};
```

## run vs runAsync

- **run**：錯誤會更新到 `error`，不會往外拋，適合一般 UI 觸發
- **runAsync**：錯誤會往外拋並更新到 `error`，適合需要 await 或 try/catch 的場景

```tsx
const { run, runAsync } = useRequest(fetchUser, { manual: true });

// run：不處理 promise
run('1');

// runAsync：可 await 或 catch
try {
  const user = await runAsync('1');
  console.log(user);
} catch (e) {
  // 錯誤已更新到 error，這裡可做額外處理
}
```
