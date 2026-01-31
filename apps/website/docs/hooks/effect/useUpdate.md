# useUpdate

回傳一個函式，呼叫它可以強制更新 re-render 一次。

- 典型用途：
  - 強刷畫面
  - 搭配 useRef 做 “非受控資料＋手動刷新”

## API

```typescript
const forceUpdate = useUpdate();
```

## Basic

```jsx
import { useUpdate } from '@my-hooks/hooks';

function Demo() {
  const forceUpdate = useUpdate();

  return (
    <div>
      <p>current time: {Date.now()}</p>
    </div>
  );
}
```
