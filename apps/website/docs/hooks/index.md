# Hooks 列表

| 分类             | Hook 名称                    | 目的                                |
| :--------------- | :--------------------------- | :---------------------------------- |
| **副作用管理**   | `useRequest`                 | 自動化管理數據狀態                  |
|                  | `useInterval` / `useTimeout` | 聲明式使用計時器並自動清理          |
| **狀態管理**     | `useLocalStorageState`       | 將 state 与 `localStorage` 自動同步 |
|                  | `useBoolean` / `useToggle`   | 管理兩個值之間的切換                |
|                  | `usePrevious`                | 獲取上一次渲染的 props, state       |
| **UI 交互優化**  | `useDebounceFn`              | 防抖                                |
|                  | `useThrottleFn`              | 節流                                |
| **DOM 与瀏覽器** | `useClickOutside`            | 監聽點擊元素的外部區域的事件        |
|                  | `useScroll`                  | 獲取頁面或元素滾動的位置            |
| **生命周期**     | `useUnmount`                 | 僅在組件卸載時行清理函式            |
