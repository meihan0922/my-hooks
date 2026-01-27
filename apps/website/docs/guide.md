# 快速開始

## 說明

（模擬的，並沒有真的發佈到 npm）
假設發佈到私有 npm 倉庫上，只需要安裝在指定的 registry。

```bash
npm i @my-hooks/hooks --registry https://someRegistry.com
```

## 導入依賴

```tsx
import { useToggle } from '@my-hooks/hooks';

function App() {
  const [state, { set, toggle }] = useToggle();

  return <div>{state}</div>;
}
```
