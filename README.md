# DFCH 遠征模擬器

以遊戲遠征系統為研究基礎的網頁模擬器專案。

目前目標不是模擬戰鬥數值，而是完整保留會影響遠征抽選的流程，最後只統計：

- 鑽石（含普通掉落、Dia Fever、5000 / 7777 / 9999）
- 羈絆道具（28 種 rewardId）
- 後續的效率比較（依英靈步行速度）

## 開發階段

### V1 — UI（目前）

- 地圖選擇
- 1 名隊長 + 最多 11 名隊員
- 固定 1 名隊長 + 最多 11 名隊員
- 每名英靈只輸入遊戲面板看得到的步行速度 km/s
- 內部 WalkSpd 狀態與遠征倍率由模擬器自行換算，不暴露給玩家
- 收集家 I / II / III 選取
- 觀緣眼鏡「擁有 / 未擁有」開關
- 模擬次數設定
- 鑽石 / 羈絆統計版面
- 手機優先響應式 UI

目前不執行正式事件抽選。

### V2 — 英靈速度公式

已從 3.16.0 IL2CPP 確認：

- 玩家面板顯示的步行速度不是遠征公式直接拿來平均的值。
- `UniquePlayerParams.get_walkSpd`：
  `visibleWalkSpd = walkSpd1 × Skill2Value / 100`
- `walkSpd1` 由 WalkSpd 內部狀態值經 `GetActualValue` 換算。
- 遠征 `CalcAverageWalkSpdLevel` 使用角色內部 WalkSpd 狀態，隊長權重 2、每名隊員權重 1。
- `WalkSpeedMultiplier = 0.8 + (加權平均 WalkSpd 狀態 / 100) × 3.2`

本次已追到主動技能流程對 `Skill2Value` 的更新與恢復 100% 的分支。請輸入未啟動步行加速技能時的面板 km/s；網頁即時顯示估算遠征倍率與各隊員的加權明細。三位小數面板無法恢復精確隱藏值。

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

目前 V1：

- 隊伍 UI 固定為 1 隊長 + 最多 11 隊員。
- 玩家只輸入角色面板可見的步行速度 km/s。
- 不再顯示或要求玩家輸入「步行等級」。
- 230 等角色面板數值不再拿來推隊伍容量。
- 未加速面板速度已接入官方換算鏈，顯示最終倍率與可展開的各角色換算明細。
- 地圖時間尚未計算。
- 羈絆加成尚未套官方最終疊加公式。
- 模擬按鈕目前只驗證操作流程。

詳細逆向紀錄見 `docs/speed-formula.md`。

後續每確認一條官方公式，就直接替換對應模組，不重做 UI。


### 第一張地圖資料

已接入米維克威茲 外緣部的官方地圖資料檢視，包含事件、條件模板、探索率獎勵、怪物、掉落組及原始權重。詳細來源與解析邊界見 [docs/stage-1-map.md](docs/stage-1-map.md)，機器資料見 [data/stage-1.json](data/stage-1.json)。

戰鬥採使用者指定的立即勝利、耗時 0 秒模式，保留遭遇與勝利掉落；整場事件重播與最終掉率尚未接入。


### V1.1

羈絆道具獨立顯示，確認羈絆加成合併與事件權重轉移、固定數量及含上限取量規則。逐項證據與未完成項目見 [docs/v1.1-audit.md](docs/v1.1-audit.md)。
