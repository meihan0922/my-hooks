# useRequest

把非同步請求的生命週期包進去的 hook，並且：

- mount 時自動請求，除非 `manual` 為 `true`
- `run` / `runAsync` 成功與失敗時自動更新 `data` / `loading` / `error`
- 處理 race condition，保留最新請求的結果
- unmount 後不再 setState，避免 memory leak
- 支援 `pluginFactories` 擴充請求前後邏輯（onBefore、onSuccess、onError、onFinally、onCancel）

## API

```typescript
const { data, error, loading, run, runAsync, cancel, refresh, refreshAsync } = useRequest<TData, TParams>(
  service,
  { defaultParams?, manual?, pluginFactories? }
);
```

### Params

| Parameters | Details        | Type                                   | Default |
| ---------- | -------------- | -------------------------------------- | ------- |
| service    | 非同步請求函式 | `(...args: TParams) => Promise<TData>` | -       |
| options    | 請求的控制選項 | `Options<TData, TParams>`              | `{}`    |

### Options

| Parameters      | Details                    | Type                              | Default |
| --------------- | -------------------------- | --------------------------------- | ------- |
| defaultParams   | mount 時自動請求的參數     | `TParams`                         | `[]`    |
| manual          | 為 true 時不自動請求       | `boolean`                         | `false` |
| pluginFactories | 擴充請求生命週期的插件工廠 | `PluginFactory<TData, TParams>[]` | `[]`    |

### PluginFactory

`PluginFactory` 是一個函式，接收 `FetchInstance` 並回傳 `Plugin` 物件。透過工廠模式，插件可以存取 `fetchInstance.run` 等方法，實作 debounce、retry、polling 等進階功能。

```typescript
type PluginFactory<TData, TParams> = (fetchInstance: FetchInstance<TData, TParams>) => Plugin<TData, TParams>;
```

### Plugin

| Parameters | Details                                                      | Type                                   |
| ---------- | ------------------------------------------------------------ | -------------------------------------- |
| onBefore   | 請求前執行，可回傳 stopNow 中止請求或 returnNow 直接回傳資料 | `(params) => OnBeforeResult` 或 `void` |
| onSuccess  | 請求成功時執行                                               | `(data, params) => void`               |
| onError    | 請求失敗時執行                                               | `(error, params) => void`              |
| onFinally  | 請求結束時執行（成功或失敗）                                 | `(params, data?, error?) => void`      |
| onCancel   | cancel 被呼叫時執行，用於清理 timer 等資源                   | `() => void`                           |

### OnBeforeResult

| Parameters | Details                                                    | Type      |
| ---------- | ---------------------------------------------------------- | --------- |
| stopNow    | 為 true 時中止請求，不呼叫 service                         | `boolean` |
| returnNow  | 為 true 時不呼叫 service，直接以 data 作為結果並更新 state | `boolean` |
| data       | 搭配 returnNow 使用，作為回傳的資料                        | `TData`   |

### Result

| Parameters   | Details                                      | Type                                                  |
| ------------ | -------------------------------------------- | ----------------------------------------------------- |
| data         | 請求成功後的資料                             | `TData` 或 `undefined`                                |
| error        | 請求失敗時的錯誤                             | `Error` 或 `undefined`                                |
| loading      | 請求進行中                                   | `boolean`                                             |
| run          | 觸發請求，錯誤會更新到 error，不會往外拋     | `(...args: TParams) => void`                          |
| runAsync     | 觸發請求，錯誤會往外拋並更新到 error         | `(...args: TParams) => Promise<TData>` 或 `undefined` |
| cancel       | 取消請求，停止 loading 並觸發插件的 onCancel | `() => void`                                          |
| refresh      | 使用上次參數重新請求，錯誤會更新到 error     | `() => void`                                          |
| refreshAsync | 使用上次參數重新請求，錯誤會往外拋           | `() => Promise<TData>` 或 `undefined`                 |

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

## cancel

呼叫 `cancel` 會停止 loading 狀態，並觸發所有插件的 `onCancel`。適合用於 unmount 時清理、或使用者手動取消請求（如 debounce、retry、polling 的 pending 狀態）。

```tsx
const { run, cancel } = useRequest(fetchUser, { manual: true });

return (
  <div>
    <button onClick={() => run('1')}>取得</button>
    <button onClick={() => cancel()}>取消</button>
  </div>
);
```

## refresh / refreshAsync

使用上次請求的參數重新發送請求。若尚未發過請求（`lastParams` 為空），則不會執行。

- **refresh**：錯誤會更新到 `error`，不會往外拋
- **refreshAsync**：錯誤會往外拋並更新到 `error`，可 await

```tsx
const { data, run, refresh } = useRequest(fetchUser, { manual: true });

return (
  <div>
    <button onClick={() => run('1')}>取得使用者</button>
    <button onClick={() => refresh()} disabled={!data}>
      重新整理
    </button>
  </div>
);
```

## PluginFactories

透過 `pluginFactories` 擴充請求生命週期。每個 factory 是接收 `fetchInstance` 並回傳 `Plugin` 的函式：

```tsx
import { useRequest } from '@my-hooks/hooks';

const fetchUser = (id: string) => fetch(`https://api.example.com/users/${id}`).then(res => res.json());

// 自訂 plugin factory：onBefore 可中止或直接回傳資料（如快取）
const cachePluginFactory = () => ({
  onBefore: (params: [string]) => {
    const cached = localStorage.getItem(`user-${params[0]}`);
    if (cached) return { returnNow: true, data: JSON.parse(cached) };
    return undefined;
  },
  onSuccess: (data: unknown, params: [string]) => {
    localStorage.setItem(`user-${params[0]}`, JSON.stringify(data));
  },
});

// onSuccess / onError / onFinally：請求後處理
const logPluginFactory = () => ({
  onSuccess: (data: unknown, params: unknown[]) => console.log('success', data, params),
  onError: (err: Error, params: unknown[]) => console.error('error', err, params),
  onFinally: (params: unknown[], data?: unknown, error?: Error) => console.log('finally', params, data, error),
});

export default () => {
  const { data, loading, run } = useRequest(fetchUser, {
    manual: true,
    pluginFactories: [cachePluginFactory, logPluginFactory],
  });

  return (
    <button onClick={() => run('1')} disabled={loading}>
      取得使用者
    </button>
  );
};
```

### onBefore 進階用法

- `stopNow: true`：中止請求，不呼叫 service
- `returnNow: true, data`：不呼叫 service，直接以 data 更新 state 並觸發 onSuccess / onFinally

## 內建 Plugins

`@my-hooks/hooks` 提供以下內建 plugin factories，可直接使用：

### cachePlugin

快取請求結果，相同參數時直接回傳快取，不發送請求。

```typescript
cachePlugin<TData, TParams>(getKey?: (...params: TParams) => string): PluginFactory<TData, TParams>
```

- `getKey`：可選，自訂快取 key。預設使用 `JSON.stringify(params)`。

```tsx
import { useRequest, cachePlugin } from '@my-hooks/hooks';

const { data, run } = useRequest(fetchUser, {
  manual: true,
  pluginFactories: [cachePlugin()],
});

// 第一次 run('1') 會發請求，第二次 run('1') 直接回傳快取
run('1');
run('1'); // 不發請求
```

### debouncePlugin

對請求做 debounce，短時間內多次觸發只會發送最後一次。

```typescript
debouncePlugin<TData, TParams>(debounceTime: number): PluginFactory<TData, TParams>
```

```tsx
import { useRequest, debouncePlugin } from '@my-hooks/hooks';

const { data, run } = useRequest(searchAPI, {
  manual: true,
  pluginFactories: [debouncePlugin(300)],
});

// 300ms 內多次輸入，只會發送最後一次
<input onChange={e => run(e.target.value)} />;
```

### retryPlugin

請求失敗時自動重試。

```typescript
retryPlugin<TData, TParams>(retryCount: number, retryInterval: number): PluginFactory<TData, TParams>
```

- `retryCount`：重試次數
- `retryInterval`：重試間隔（ms）

```tsx
import { useRequest, retryPlugin } from '@my-hooks/hooks';

const { data, run } = useRequest(fetchUser, {
  manual: true,
  pluginFactories: [retryPlugin(2, 1000)],
});

// 失敗時會自動重試 2 次，每次間隔 1 秒
run('1');
```

### pollingPlugin

請求成功後，每隔固定時間自動再次請求（輪詢）。

```typescript
pollingPlugin<TData, TParams>(interval: number): PluginFactory<TData, TParams>
```

- `interval`：輪詢間隔（ms）

```tsx
import { useRequest, pollingPlugin } from '@my-hooks/hooks';

const { data, run, cancel } = useRequest(fetchStatus, {
  manual: true,
  pluginFactories: [pollingPlugin(3000)],
});

// 第一次 run() 後，每 3 秒自動再請求一次
run();
// 呼叫 cancel() 可停止輪詢
```
