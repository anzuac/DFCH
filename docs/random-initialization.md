# 3.16.0 遠征亂數初始化核對

來源為既有 SHA-256 鎖定的 arm64 `libil2cpp.so` 與 metadata，不是 JavaScript Math.random 或從掉率倒猜亂數。

## 實際呼叫鏈

`ExpeditionLogsBuilder.Build` 的 async MoveNext 在 `0x2d08c50` 呼叫 `ExpeditionStatus.get_Seed` (`0x2d097fc`)，讀取狀態 +0x30 的 CryptoInt。`CryptoInt.op_Implicit` (`0x2fd54f0`) 呼叫 `CryptoInt.get_value` (`0x2fd4cc4`)；後者將低／高兩個 32 位字 XOR，作為有號 32 位種子。它不是將時間戳直接當種子，也不是已確認種子的最初產生／寫入流程。

`0x2d08c6c` 將這個種子傳入真正的 System.Random 有種子建構函式 `0x5712e38`。此 BCL 模組不在 Assembly-CSharp method-pointer 陣列；method-addresses.py 現拒絕跨模組索引，避免回傳貌似有效但錯誤的位址。

## 已核對的演算法

56 個 int32 元素；常數 161803398、2147483647；55 槽排列、四輪扣減，起始索引 0 / 21。加減使用 ARM64 int32 溢位語義。Sample 倍率由二進位讀出為 4.656612875245797e-10。

Next(min,max) 的 max 為排除上限；min=max 仍消耗 Sample。跨度大於 int32 最大值時消耗兩個 InternalSample，第二個的偶數判定決定正負，再以 `(值 + 2147483646) / 4294967293` 換算。NextDouble 經 Sample，不替換為任何 JS 原生乱數。

## 獨立驗證

`scripts/verify-random-native.py` 使用 Unicorn 直接執行 APK 原指令；僅替換配置陣列與 Object 空建構函式。七種種子（含 0、負數、int32 極值）各取得 128 個 double，跨過索引回繞，並測試固定／負數／大跨度整數。896 個 double 與 35 個整數均和 JS 實作逐值一致。腳本依賴原二進位與 unicorn；測試向量及反組譯隨 repo 保存。

事件 alias 抽選與小數進度均使用同一個 context.nextDouble；整數取量使用同一個 Random。初始化與前置檢查不消耗亂數。已測試強制事件不抽亂數、整數進度仍抽一次、固定數量仍抽一次。

## V1.1 時點的整輪一致性（歷史記錄）

初始化與亂數原語一致，不等於整輪遠征一致。完整候選池建構、能力來源／條件、24 種事件處理器、結束／區域生命週期、獎勵修正與結算、所有日志與怪物配置的亂數呼叫順序，仍未完整接上。亦未驗證官方 seed 最初寫入路徑、跨輪種子生成及每日重置時區。

`simulation-runtime.js` 提供共用亂數的初始化、狀態快照及有處理器的序列重播邊界。preflight 會檢查動態事件也可能用到的全部函式，不能只檢查靜態 69 列。它是模擬器防漏機制，不主張官方在執行前做相同檢查。現行 UI 只初始化並列出阻擋項目，尚不產生整輪結果。

使用者指定的秒殺、戰鬥 0 秒與自訂／無限耐力是明確覆寫條件；即使後續整輪串接完成，也不能稱為包含原始戰鬥的逐局重現。面板速度反推另有顯示取整的不確定性。

## V1.2 更新

第一張地圖的現有 UI 配置已串接整輪及批次，詳見 [本版範圍](v1.2-simulator.md)。上述「現行 UI 只初始化」是上一版狀態；目前會產生限定配置的結果。其他專屬角色事件與原版戰鬥逐局重現仍未完成。

## 正常出發種子來源已確認

正常出發在 0x328f020 呼叫 UnityEngine.Random.Range(0,2147483647)，再存入 ExpeditionStatus.Start。完整產生／包裝／還原／事件 RNG 的區分见 [seed-origin.md](seed-origin.md)。先前「未驗證最初寫入」記錄是較早狀態；Unity 全域原始狀態與所有其他系統的消耗尚未還原。
