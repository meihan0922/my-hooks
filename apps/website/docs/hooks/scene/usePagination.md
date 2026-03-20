# usePagination

管理分頁資料的請求與狀態。基於 `useRequest` 封裝，當 `current` 或 `pageSize` 變更時會自動重新請求。適用於表格、列表等需要分頁載入的場景。

## API

```typescript
function usePagination<TData>(
  service: (params: PaginationParams) => Promise<PaginationResult<TData>>,
  options?: Options,
): UsePaginationResult<TData>;

type PaginationParams = {
  current: number;
  pageSize: number;
};

type PaginationResult<TData> = {
  list: TData[];
  total: number;
};

type Options = {
  defaultCurrent?: number;
  defaultPageSize?: number;
  manual?: boolean;
};

type UsePaginationResult<TData> = {
  // -- 👇 為 useRequest 返回值
  data?: PaginationResult<TData>;
  loading: boolean;
  error?: Error;
  run: (params: PaginationParams) => void;
  runAsync: (params: PaginationParams) => Promise<PaginationResult<TData> | undefined>;
  refresh: () => void;
  cancel: () => void;
  // -- 👆 為 useRequest 返回值
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPage: number;
    onChange: (page: number, pageSize: number) => void;
    changeCurrent: (page: number) => void;
    changePageSize: (size: number) => void;
  };
};
```

### Params

| 參數    | 說明                                                         | 型別                                                             | 預設值 |
| ------- | ------------------------------------------------------------ | ---------------------------------------------------------------- | ------ |
| service | 分頁請求函式，接收 current、pageSize，回傳 `{ list, total }` | `(params: PaginationParams) => Promise<PaginationResult<TData>>` | -      |
| options | 可選配置                                                     | `Options`                                                        | `{}`   |

### Options

| 參數            | 說明                   | 型別      | 預設值  |
| --------------- | ---------------------- | --------- | ------- |
| defaultCurrent  | 預設當前頁碼           | `number`  | `1`     |
| defaultPageSize | 預設每頁筆數           | `number`  | `10`    |
| manual          | 為 `true` 時不自動請求 | `boolean` | `false` |

### Returns

| 回傳值     | 說明                               | 型別                                   |
| ---------- | ---------------------------------- | -------------------------------------- |
| data       | 請求成功後的資料 `{ list, total }` | `PaginationResult<TData> \| undefined` |
| loading    | 請求進行中                         | `boolean`                              |
| error      | 請求失敗時的錯誤                   | `Error \| undefined`                   |
| run        | 觸發請求                           | `(params) => void`                     |
| runAsync   | 觸發請求（回傳 Promise）           | `(params) => Promise<...>`             |
| refresh    | 使用當前分頁參數重新請求           | `() => void`                           |
| cancel     | 取消請求                           | `() => void`                           |
| pagination | 分頁狀態與操作方法                 | `Pagination`                           |

### Pagination

| 屬性           | 說明                                                      | 型別                                       |
| -------------- | --------------------------------------------------------- | ------------------------------------------ |
| current        | 當前頁碼                                                  | `number`                                   |
| pageSize       | 每頁筆數                                                  | `number`                                   |
| total          | 總筆數                                                    | `number`                                   |
| totalPage      | 總頁數                                                    | `number`                                   |
| onChange       | 分頁變更回調，`(page, pageSize)` 可同時處理換頁與換頁大小 | `(page: number, pageSize: number) => void` |
| changeCurrent  | 切換頁碼，僅在 `1 <= page <= totalPage` 時生效            | `(page: number) => void`                   |
| changePageSize | 變更每頁筆數，會將 current 重置為 1                       | `(size: number) => void`                   |

## Basic

```jsx
import React from 'react';
import { usePagination } from '@my-hooks/hooks';

const fetchList = ({ current, pageSize }) =>
  fetch(`/api/list?page=${current}&size=${pageSize}`)
    .then(res => res.json())
    .then(res => ({ list: res.items, total: res.total }));

function Demo() {
  const { data, loading, pagination } = usePagination(fetchList);

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <ul>
        {data?.list?.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      <div>
        <button disabled={pagination.current <= 1} onClick={() => pagination.changeCurrent(pagination.current - 1)}>
          上一頁
        </button>
        <span>
          第 {pagination.current} / {pagination.totalPage} 頁
        </span>
        <button
          disabled={pagination.current >= pagination.totalPage}
          onClick={() => pagination.changeCurrent(pagination.current + 1)}
        >
          下一頁
        </button>
      </div>
    </div>
  );
}
```

## 搭配 Ant Design Table

`onChange` 的簽名與 Ant Design Table 的 `pagination.onChange` 一致，可直接傳入：

```jsx
import React from 'react';
import { Table } from 'antd';
import { usePagination } from '@my-hooks/hooks';

const fetchList = ({ current, pageSize }) =>
  fetch(`/api/list?page=${current}&size=${pageSize}`)
    .then(res => res.json())
    .then(res => ({ list: res.items, total: res.total }));

function Demo() {
  const { data, loading, pagination } = usePagination(fetchList);

  return (
    <Table
      dataSource={data?.list}
      loading={loading}
      rowKey="id"
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        onChange: pagination.onChange,
      }}
      columns={[
        { title: 'ID', dataIndex: 'id' },
        { title: '名稱', dataIndex: 'name' },
      ]}
    />
  );
}
```

## 自訂預設分頁

```jsx
const { pagination } = usePagination(fetchList, {
  defaultCurrent: 2,
  defaultPageSize: 20,
});
// 初始為第 2 頁，每頁 20 筆
```

## Manual 模式

當 `manual` 為 `true` 時，不會在 mount 時自動請求，需手動呼叫 `run` 並傳入 `{ current, pageSize }` 觸發：

```jsx
const { data, loading, run } = usePagination(fetchList, {
  manual: true,
});

// 手動觸發請求
return (
  <button onClick={() => run({ current: 1, pageSize: 10 })} disabled={loading}>
    載入資料
  </button>
);
```

## refresh

使用當前 `current`、`pageSize` 重新請求，適合「重新整理」按鈕：

```jsx
const { data, loading, refresh, pagination } = usePagination(fetchList);

return (
  <div>
    <button onClick={refresh} disabled={loading}>
      重新整理
    </button>
    {/* ... */}
  </div>
);
```

## 行為說明

- **自動請求**：`current` 或 `pageSize` 變更時會自動呼叫 service（`manual: false` 時）
- **changeCurrent 邊界**：僅在 `1 <= page <= totalPage` 時更新，否則忽略
- **changePageSize 邊界**：僅在 `size > 0` 時更新，且會將 `current` 重置為 1
- **onChange 邏輯**：若 `pageSize` 與當前不同則呼叫 `changePageSize`，否則呼叫 `changeCurrent`
- **繼承 useRequest**：回傳值包含 `data`、`loading`、`error`、`run`、`runAsync`、`refresh`、`cancel` 等
