# useEventEmitter

是一個用來處理跨元件「事件通知」的 hook。
它特別適合一次性、瞬時、解耦的互動場景，例如 toast 通知、區塊刷新、modal 控制、快捷鍵廣播等。
相較於 props、context 或全域狀態管理，它更輕量，也更適合處理「發生了一件事」而不是「保存一份狀態」。
_事件發出者不需要知道接收者是誰，可以更鬆耦合_

比方：某個地方的變動需要通知另一個元件，接收方距離遙遠（不一定是父子關係）、不想用 context 或是全域狀態，不想要因為事件造成重新渲染、不需要保存與讀取當前值、不需要資料流。

- 適合的場景
  1. Modal / Drawer / Toast 的開關通知
  2. 某區塊操作成功後（表單送出、重新抓列表等），通知另一區塊刷新
  3. 跨元件通知（播放器切換歌，通知歌詞曲）（工具列操作，切換畫布元件切換 mode）
  4. 全域快捷鍵或是操作廣播給多區塊
  5. 與 useRequest 搭配，成功後顯示 toast、刷新列表等等

## API

```typescript
const { emit, useSubscription } = useEventEmitter<T>();
```

### Result

| Parameters      | Details                           | Type                                   |
| --------------- | --------------------------------- | -------------------------------------- |
| emit            | 發出事件，將 value 傳給所有訂閱者 | `(value: T) => void`                   |
| useSubscription | 訂閱 hook，註冊 callback 接收事件 | `(callback: (val: T) => void) => void` |

## Basic

```jsx
import { useEventEmitter } from '@my-hooks/hooks';

function App() {
  const { emit, useSubscription } = useEventEmitter<string>();

  return (
    <div>
      <Toolbar emit={emit} />
      <Content useSubscription={useSubscription} />
    </div>
  );
}

function Toolbar({ emit }) {
  return (
    <div>
      <button onClick={() => emit('refresh')}>重新整理</button>
      <button onClick={() => emit('reset')}>重置</button>
    </div>
  );
}

function Content({ useSubscription }) {
  useSubscription((event) => {
    if (event === 'refresh') {
      // 重新抓取資料
    } else if (event === 'reset') {
      // 重置狀態
    }
  });

  return <div>內容區塊</div>;
}
```

## Modal 開關通知

```jsx
import { useEventEmitter } from '@my-hooks/hooks';

function App() {
  const modalEvent$ = useEventEmitter<'open' | 'close'>();

  return (
    <div>
      <Header onOpenModal={() => modalEvent$.emit('open')} />
      <MainContent />
      <Modal emit={modalEvent$.emit} useSubscription={modalEvent$.useSubscription} />
    </div>
  );
}

function Modal({ emit, useSubscription }) {
  const [visible, setVisible] = React.useState(false);

  useSubscription((action) => {
    setVisible(action === 'open');
  });

  return visible ? (
    <div className="modal">
      <button onClick={() => emit('close')}>關閉</button>
      ...
    </div>
  ) : null;
}
```

## 行為說明

- **不觸發訂閱者 re-render**：emit 時僅呼叫 callback，不會造成訂閱元件因事件而重新渲染（除非 callback 內有 setState）
- **鬆耦合**：發出者與接收者互不知曉，只需共享同一個 emitter 實例
- **自動清理**：元件 unmount 時，useSubscription 會自動移除對應的 listener
