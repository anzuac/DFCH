# 官方 3.16.0 遠征種子：產生、保存與使用

正常出發的種子寫入路徑已由本版 APK 原指令確認，補足先前僅確認讀取／System.Random 初始化的範圍。使用原有已鎖定 SHA256 的 arm64 libil2cpp.so 與 global-metadata.dat；沒有依掉落統計反推。原指令保存在 [seed-origin-arm64.txt](evidence/seed-origin-arm64.txt)。

## 1. 型別與產生

metadata method 4331，ExpeditionStatus.Start 的三個參數名稱依序是 targetStageId、finishTimeUtc、seed。方法的種子參數是 int；ExpeditionStatus 的 seed 欄位是 CryptoInt 包裝，位置為物件 +0x30。

正常出發 UseCase_Expedition.<StartExpedition>d__41.MoveNext：

- 0x328efbc–0x328f010：先取得時間及地圖縮時後期間，計算 finishTimeUtc。
- 0x328f014：w1 = 0x7fffffff（2147483647）。
- 0x328f018：w0 = 0。
- 0x328f020：呼叫 0x6229824。
- 0x328f028：回傳值傳為 w3，也就是 Start 的 seed 參數。
- 0x328f03c：呼叫 ExpeditionStatus.Start。

0x6229824 的 icall resolver 字串位於 0x123b49b，內容為 `UnityEngine.Random::RandomRangeInt(System.Int32,System.Int32)`。這不是 System.Random 的整數抽選，也不是直接以時間戳、地圖 ID、速度或玩家 ID 當種子。

等價流程（說明性重建，不是反編譯出的原始 C#）：

```csharp
var finishTimeUtc = currentTimeUtc + dungeon.GetReducedDurationTimeSpan();
var seed = UnityEngine.Random.Range(0, int.MaxValue);
status.Start(targetStageId, finishTimeUtc, seed);
```

Unity 2022.3 整數 Range 下限包含、上限排除，正常新遠征種子範圍 **0–2147483646**，可為 0，不包含負數及 2147483647。整數／浮點 Range 邊界不同，這裡確定是整數版本。API 語義來源：[Unity 2022.3 Random.Range](https://docs.unity3d.com/2022.3/Documentation/ScriptReference/Random.Range.html)。

## 2. 包裝與保存

Start 0x2d0e234–0x2d0e240 把 seed 透過 CryptoInt.op_Implicit(int) 包裝後存入 +0x30。CryptoInt 將兩個 32 位值存為「遮罩」及「遮罩 XOR 真值」，讀取時 XOR 還原。遮罩更新可見 0x2fd4b80–0x2fd4b98 的 13／17／5 shift 與 XOR；遮罩來源不是遠征事件 RNG。

這是數值混淆包裝，不表示 Cryptographically Secure 的種子產生機制。改變遮罩不改變解碼後種子；不得把 64 位包裝內容直接當 System.Random 種子。

ExpeditionStatus.Reset 在 0x2d0d534–0x2d0d540 將邏輯種子初始化為 0。正常出發會重新抽新值覆寫；完成遠征不是將上一次事件 Random.Next 結果寫為下一輪 seed。

Deserialize 在 0x2d0f744–0x2d0f748／0x2d0fb1c–0x2d0fb20 還原存檔中的包裝 seed 至 +0x30。Seed getter 0x2d097fc 返回解碼後 int。這提供穩定重建輸入，但僅 seed 不足以保證跨版本、改配置後完整結果相同。

## 3. 遠征使用

ExpeditionLogsBuilder.Build 的 MoveNext 0x2d08c50 讀取狀態種子，0x2d08c74 建立 `new System.Random(seed)`。之後已核對的事件 alias、怪物配置、數量、演出、小數進度等依呼叫順序使用該遠征 RNG。

**產生新種子使用 UnityEngine.Random；遠征事件使用另外建立的 System.Random。** 不應把這兩個演算法或遮罩更新混為同一條流。強制首領由條件保證，不靠 seed 決定是否出現；seed 不直接修改候選權重，也不是稀有度／必出物品編號。

DebugPanelUI.SimBuildExpeditionStatus (0x2e5878c) 的另一處 Start 呼叫 0x2e58990，從參數取得種子，沒有在該呼叫點重新 Range。因此應區分正常玩家出發與 debug 模擬。這也不能將整個遊戲所有 seed 寫入一概宣稱為正常出發抽選。

## 4. V1.3.1 實作差異（歷史）

V1.3.1 網頁新種子由瀏覽器 crypto.getRandomValues 取得完整有號 int32；批次後續子種子由另一個 System.Random.next() 排程。兩者是模擬器策略，**不是正常官方出發種子產生路徑**。System.Random 本身接受負數，且 +seed／-seed 通常得到相同序列；官方正常出發僅取非負區間，因此網頁負數可供測試，但不代表官方正常抽出的值。

後續可將新遠征入口限於已確認的非負範圍。若要逐局重現官方產生的新 seed，還需要 Unity 全域 Random 的狀態、初始化與先前其他系統的消耗；不能僅換成相同範圍就宣稱已重現 Unity RNG。秒殺設定亦略過原版戰鬥亂數，仍不宣稱原版全流程逐局一致。

本次只核對並保存來源，未改變網頁模擬行為、權重或存檔格式。

## 5. V1.4.0 更新

主要畫面移除手動種子，UI 每輪獨立使用瀏覽器 crypto 取得 0–2147483646 的種子（拒絕取樣避免取餘數偏差）。種子範圍與正常官方出發相同，來源仍非 Unity 全域狀態。固定種子核心仍供驗證重播。詳見 [第二張地圖與本版範圍](stage-2-map.md)。
