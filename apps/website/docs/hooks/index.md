# Hooks 列表

| 分类             | Hook 名称                  | 目的                                                         |
| :--------------- | :------------------------- | :----------------------------------------------------------- |
| **副作用管理**   | `useUpdate`                | 強制更新 re-render 一次                                      |
| **狀態管理**     | `useSetState`              | 管理物件型的 state，用法與 class 組件的 `this.setState` 一致 |
|                  | `useBoolean` / `useToggle` | 管理兩個值之間的切換                                         |
| **DOM 與瀏覽器** | `useEventListener`         | 監聽元素事件                                                 |
| **生命周期**     | `useUnmount`               | 僅在組件卸載時行清理函式                                     |
|                  | `useMount`                 | 元件 mount 時，執行一次函式                                  |
| **Advanced**     | `useMemoizedFn`            | 持久化函式的 hook                                            |
|                  | `useControllableValue`     | 讓元件可以同時支援受控與非受控                               |
|                  | `useLatest`                | 不觸發 render 的快照，回傳 ref，ref.current 永遠存最新的值   |
