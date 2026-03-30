# my-hooks

參照 ahooks 的工具庫，抽出十幾個 hooks 做練習。
通過 pnpm 與 turbo 建立 monorepo，在 apps 包當中搭配 rspress 做 hooks 文件。

- 構建與打包：使用 tsup 作為打包工具
- 測試：vitest、react-testing-library，實現單元測試與覆蓋率報告
- 代碼規範： eslint, cspell, prettier
- 提交規範： commitizen, commitlint

## 選用方案

1. 使用 monorepo 可代碼復用與統一依賴管理、統一管理版本與原子化提交，
   工具函式集中放到 core 中，主代碼放在 hooks 當中。
   - 選用 pnpm workspaces 通過非扁平化的 node_modules 結構與 hard links，實現了極速安裝與節省內存空間，確保依賴關係穩定（no 幽靈依賴）。
   - 搭配 turbo repo 增量構建與緩存特性來節省時間與簡單的管理任務。turbo 可以理解不同任務之間的依賴關係，選擇並行執行。且配置相當簡潔。
2. tsup 基於 esbuild 開發，零配置快速啟動，可快速將程式碼打包成多種模塊格式。
3. rspress 快速且簡單的編寫方式，輕鬆寫出 hook 文檔與展示示例。
4. vitest 與 jest 幾乎兼容，與 ts, esm 結合，配置簡單。
5. react-testing-library 測試 hooks 在組建中的行為。
6. eslint + prettier + cspell：代碼風格與拼字檢查。
7. husky + lint-staged：檢查提交到 staged 的程式碼。
8. commitlint + cz-git：降低 commit 規範門檻，讓每次提交都能遵守規範？

## hooks 列表

| 分类             | Hook 名称                                                                                 | 目的                                                                                |
| :--------------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **副作用管理**   | `useUpdate`                                                                               | 強制更新 re-render 一次                                                             |
|                  | `useInterval`                                                                             | hook 方式建立 setInterval                                                           |
|                  | `useTimeout`                                                                              | hook 方式建立 setTimeout                                                            |
| **狀態管理**     | `useSetState`                                                                             | 管理物件型的 state，用法與 class 組件的 `this.setState` 一致                        |
|                  | `useBoolean` / `useToggle`                                                                | 管理兩個值之間的切換                                                                |
|                  | `useDebounceFn`                                                                           | 處理防抖的 hook                                                                     |
|                  | `useThrottleFn`                                                                           | 處理節流的 hook                                                                     |
|                  | `useStorageState` 提供 `useLocalStorageState`、`useSessionStorageState`、`useCookieState` | 將狀態儲存到 localStorage、sessionStorage 與 Cookie 的 hook                         |
| **DOM 與瀏覽器** | `useEventListener`                                                                        | 監聽元素事件                                                                        |
|                  | `useClickAway`                                                                            | 監聽點擊發生在目標元素外部的事件                                                    |
|                  | `useFocusWithin`                                                                          | 監聽焦點是否在目標元素內部                                                          |
| **場景**         | `useTextSelection`                                                                        | 監聽文字選取狀態，回傳選取內容與邊界矩形，適用於高亮、複製、浮動工具列              |
|                  | `usePagination`                                                                           | 管理分頁資料的請求與狀態，適用於表格、列表等分頁載入場景                            |
| **生命周期**     | `useUnmount`                                                                              | 僅在組件卸載時行清理函式                                                            |
|                  | `useMount`                                                                                | 元件 mount 時，執行一次函式                                                         |
| **Advanced**     | `useMemoizedFn`                                                                           | 持久化函式的 hook                                                                   |
|                  | `useControllableValue`                                                                    | 讓元件可以同時支援受控與非受控                                                      |
|                  | `useLatest`                                                                               | 不觸發 render 的快照，回傳 ref，ref.current 永遠存最新的值                          |
|                  | `useCreation`                                                                             | 解決「絕對只執行一次的初始化」的 hook                                               |
| **Request**      | `useRequest`                                                                              | 管理異步數據的 hooks，已包含自動與手動請求、防抖、重新請求、polling、錯誤重試、緩存 |

---

## 筆記

- 自定義 hook 必須處理競態條件與過時閉包的問題。比方使用者多次異步請求，或是異步請求回來後組建已經重新渲染或卸載。可使用 ref 與 useEffect clean function 來記錄組建是否 active。
- 支持 esm，可支援 tree-shaking
- 考慮某些 hook 必須要使用瀏覽器 api，測試要配置 environment，來模擬
- husky 觸發 pre-commit 再調用 lint-staged，再對暫存文件檢查與修正後觸發 commit-msg 再調用 commitlint。
