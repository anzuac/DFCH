# DFCH 遠征模擬器

以遊戲遠征系統為研究基礎的網頁模擬器專案。

目前目標不是模擬戰鬥數值，而是完整保留會影響遠征抽選的流程，最後只統計：

- 鑽石（含普通掉落、Dia Fever、5000 / 7777 / 9999）
- 羈絆道具（28 種 rewardId）
- 後續的效率比較（依英靈步行速度）

## 開發階段

### V1 — UI（目前）

- 地圖選擇
- 隊長
- 多隊員（目前 UI 上限 20 名，可再調）
- 每名英靈個別步行速度 km/s
- 收集家 I / II / III 選取
- 觀緣眼鏡 +30%
- 模擬次數設定
- 鑽石 / 羈絆統計版面
- 手機優先響應式 UI

目前不執行正式事件抽選。

### V2 — 英靈速度公式

需要從官方資料確認：

- 隊長與隊員的速度如何合成
- 隊長是否有特殊權重
- 多隊員如何參與
- 速度能力 / 修正項如何套用

V1 已預留 `calcPartyWalkSpeed` 所需的 UI 資料。

### V3 — 地圖邏輯

接入：

- Dungeon Master
- Progress
- 地區事件
- 一般戰鬥事件
- Boss 流程
- Dia Fever / MergeDungeon
- 地圖條件事件

戰鬥處理固定為：

> 必勝 / 無敵

不模擬 HP、SP、攻擊、防禦、死亡等戰鬥細節；但戰鬥事件本身仍保留，因為會影響事件池與遠征流程。

### V4 — 官方權重引擎

接入：

- Expedition Event Lottery
- 鑽石 Group 50
- Dia Fever Group 990100
- 5000 / 7777 / 9999
- 羈絆 Group
- 28 種羈絆 rewardId
- 收集家 I / II / III
- 觀緣眼鏡
- Progress Weight 重分配
- 一次性 / 條件事件
- Boss Drop / 連續率

## 專案結構

```
index.html   V1 主介面
styles.css  響應式樣式
app.js      UI 狀態與互動
```

之後會逐步拆成：

```
data/
  dungeons.json
  events.json
  drops.json
  abilities.json
  artifacts.json

src/
  speed.js
  dungeon.js
  weights.js
  simulator.js
  statistics.js
```

資料層與公式層會分開，避免把官方數值直接寫死在 UI 裡。

## V1 注意

畫面上顯示的個體速度、收集家、神器設定目前只是 UI 配置資料。

- 隊伍速度：尚未套官方公式
- 地圖時間：尚未計算
- 羈絆加成：尚未套官方疊加公式
- 模擬按鈕：目前只驗證操作流程

後續每確認一條官方公式，就直接替換對應模組，不重做 UI。
