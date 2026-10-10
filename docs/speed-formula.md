# 遠征速度公式逆向紀錄

版本基準：遊戲 3.16.0 / Unity 2022.3.62f2 / IL2CPP

本文件只記錄已從二進位確認的內容。玩家端 UI 只應使用遊戲實際顯示的步行速度（km/s），不要要求玩家輸入內部狀態等級。

## 1. 玩家面板的「步行速度」怎麼來

### 已確認

`UniquePlayerParams.get_walkSpd`
ARM64 address: `0x2d441c0`

核心運算：

```text
visibleWalkSpd = walkSpd1 × Skill2Value / 100
```

其中：

- `walkSpd1`：角色 WalkSpd 狀態換算後的基礎步行值
- `Skill2Value`：由 `ISkillAndPotionCalc.get_Skill2Value` 取得的百分比修正
- 玩家面板顯示的 km/s 是上面兩者乘完後的結果

`walkSpd1` 對應欄位 getter：
`UniquePlayerParams.get_walkSpd1`
ARM64 address: `0x2d43d14`

`ISkillAndPotionCalc` 的四個介面方法包括：

- PotionHpUp
- PotionAtkUp
- Skill1Value
- Skill2Value

`CharaManager.get_Skill2Value`
ARM64 address: `0x2ee4e50`

目前下一個重點就是繼續追 `skill2Value` 的來源與變動條件。

---

## 2. WalkSpd 內部值怎麼換成 walkSpd1

### 已確認

`UniquePlayerParams.ApplyParamAfterMaster`
ARM64 address: `0x2d45060`

它會用 WalkSpd 狀態類型取得實際值，並寫入 `walkSpd1`。

`UniqueStatusData.GetActualValue`
ARM64 address: `0x2df779c`

最後進入 WalkSpd 的實際值換算。

對 WalkSpd 狀態值 L：

### L < 80

```text
walkSpd1 = 0.05 + 0.00875 × L
```

### L >= 80

```text
walkSpd1 = 0.75 + 0.0035175872035324574 × (L - 80)
```

兩段在 L = 80 時連續：

```text
0.05 + 0.00875 × 80 = 0.75
```

所以完整玩家面板公式是：

```text
visible km/s
=
WalkSpdActualValue(L)
× Skill2Value
/ 100
```

---

## 3. 從玩家面板 km/s 反推 WalkSpd 狀態

如果已知 `Skill2Value`：

```text
base = visibleKmPerSec × 100 / Skill2Value
```

若 `base < 0.75`：

```text
L = (base - 0.05) / 0.00875
```

若 `base >= 0.75`：

```text
L = 80 + (base - 0.75) / 0.0035175872035324574
```

因此目前唯一缺口不是「步行等級公式」，而是：

> `Skill2Value` 在玩家帳號／當前狀態下到底是多少，以及它由哪些技能或全局效果決定。

這一項確認後，就能只靠玩家看到的 km/s 自動反推出遠征所需的內部 WalkSpd 值。

---

## 4. 遠征隊伍速度怎麼合成

### 已確認

`ExpeditionLevelLogic.CalcAverageWalkSpdLevel`
ARM64 address: `0x2d07c48`

對每名遠征英靈取得 WalkSpd 狀態值後：

- 隊長權重 = 2
- 每名隊員權重 = 1

```text
Lavg =
(2 × LeaderWalkSpd + Σ MemberWalkSpd)
/
(2 + MemberCount)
```

然後：

```text
WalkSpeedMultiplier
=
0.8 + (Lavg / 100) × 3.2
```

二進位常數已確認：

- 0.8
- 3.2
- 100

所以遠征真正的鏈是：

```text
玩家面板 km/s
→ 去除 Skill2Value 修正
→ 反推 WalkSpd 狀態 L
→ 隊長×2 / 隊員×1 加權
→ 0.8 + (Lavg/100)×3.2
→ Expedition WalkSpeedMultiplier
```

---

## 5. 隊伍人數

目前 DFCH V1 依實際遊戲編制需求固定 UI 為：

```text
1 隊長 + 最多 11 隊員
```

不再使用角色面板上的 230 或其他耐力數值推算隊伍容量。

遊戲程式內確實另外存在：

`BattlerParamCalculator.CalculatePartyMemberCount`

以及 Leadership 相關邏輯，但這是另一條系統，不能把角色畫面上的耐力 230 當 Leadership。這部分目前不列入 V1 速度研究。

---

## 6. DFCH V1 原則

玩家只會看到：

- 角色名稱
- 步行速度 km/s
- 收集家技能
- 神器開關

不會看到：

- WalkSpd internal level
- GetTotalLevel
- Skill2Value
- Leadership 內部計算

這些全部屬於模擬器內部實作。

---

## 7. 下一步

此處為最初待辦；面板換算、技能修正寫入、隊伍即時倍率與事件進度作用已在第 8–10 節更新。後續工作為官方 RNG 與地圖事件序列重播、顯示取整規則及縮時效果名稱。


## 8. 本次 APK 核對（2026-10-10）

來源：上傳的 `net.room6.horizon.apk` 與 `config.arm64_v8a(1).apk`。
本次使用 ARM64 指令直接核對，不依賴缺失的 `individual_.bundle`。

- `0x2d441c0`：面板 getter 讀取基礎值，呼叫 Skill2Value 介面，乘後除以 100。
- `0x2ee4e50`：CharaManager 的 Skill2Value getter 讀取 +0x3c。
- `0x2f08608`：取得角色管理器；已追到主動技能流程對該欄位的寫入。
- `0x3398d74`–`0x3398d84`：技能流程取得管理器，讀取技能物件 +0x64 的修正值。
- `0x3398da8`–`0x3398db8`：另一分支取得管理器，把 100 寫回 +0x3c。
  此分支與技能觸發／結束流程相連。因此只能在主動步行加速未生效時採 100%，不能把所有面板無條件當成未修正速度。
- `0x2d07df0`–`0x2d07e38`：取得狀態類型 2，首位權重 2，其餘 1，除以權重總和，再套入遠征倍率。

V1 現在接入「未加速面板速度」模式，UI 不要求輸入 Skill2Value。
如果使用者貼的是加速中的數字，必須改讀取技能結束後的面板；目前不自動猜測加速倍率。

顯示最終倍率，詳細資訊列出角色、面板 km/s、反推 L、權重、加權值、平均值貢獻及完整最終算式。
面板三位小數不足以恢復精確隱藏值，故所有反推結果標為估算。
±0.0005 的區間僅在官方面板採四捨五入時成立，尚未確認顯示取整規則，不稱為官方精確區間。
地圖耗時及事件時間仍未接入，不把倍率誤稱為隊伍 km/s；事件進度作用已在第 10 節確認。

舊文第 3、7 節的「來源仍在解析」描述為先前進度；本節更新該結論。


## 9. 分段公式與明細再次核對

`GetActualValue` 在 `0x2df7818` 轉到 `0x2d4f0b8`；該函式的跳表索引 2 指向 `0x2d4f1c0`，確認是 WalkSpd 分支。
- 低段常數位址 `0x1221310`（float32 約 0.00875）、`0x1221248`（float32 約 0.05）。
- 分界是 80；高段 `0x2d4f458` 使用 `0x12212dc` 的 0.0035175872035324574，以及基底 0.75。
- 遠征倍率常數 `0x1221024`、`0x12210a4` 是 float32 的 3.2 與 0.8。
網頁採十進位公式與 JavaScript double，並未聲稱與 ARM64 float32 每一步位元完全相同；面板反推仍為估算。

詳細資訊按鈕可展開／收起角色明細。新增個體远征倍率欄，定義為該角色單獨组成隊伍时的倍率；隊伍公式只加權 L，不累加個體倍率。


## 10. 速度實際作用：事件進度（2026-10-10）

來源仍是同一份 3.16.0 ARM64 APK。重新完整解壓 libil2cpp.so，ZIP CRC 檢查通過，長度 116410672 bytes；先前研究暫存副本缺少尾端，現已修復。以下可重現工具存於 scripts/trace-speed.py。

已由方法表與 metadata 名稱對齊確認：

| 方法 | ARM64 位址 | 行為 |
| --- | --- | --- |
| ExpeditionContext.get_WalkSpeedMultiplier | 0x34b6178 | 讀取 context +0xc0 |
| ExpeditionContext constructor | 0x34b61f0 | 0x34b6390 呼叫 CalcAverageWalkSpdLevel，0x34b6394 保存倍率 |
| Progress.Execute | 0x34b2710 | 讀取事件 arg[0] 為 float；arg[1] 轉整數後 >0 時跳過速度乘算，其餘乘 context 倍率 |
| ExpeditionContext.AddProgress | 0x34b28e8 | 接收取整後進度、處理強制事件邊界，再限制至目標進度 |
| ExpeditionContext.IsGoalReached | 0x34b802c | currentProgress >= goalProgress |

### 小數進度不是固定捨去

0x34b27e4 呼叫 0x64c89e0；ELF relocation 0x691e8d0 對應 libc `fmodf`，第二參數是 1。
0x34b2874 比較亂數與餘數，0x34b2888 截斷浮點數為整數，0x34b2898 再加上比較結果。

對非負進度，並採通常的 [0,1) 均勻亂數條件：

```
x = float32(事件基礎進度 × 隊伍倍率)  // arg[1] <= 0
r = fmodf(x, 1)
整數進度 = trunc(x) + (亂數 < r ? 1 : 0)
```

基礎進度 1、倍率 0.8：單次可得到 0 或 1；約 80% 得到 1，長期平均約 0.8。這是單次事件的說明，不能保證每五次必定四次前進。
基礎進度 10、倍率 0.8：乘算結果 8，整數進度為 8。
速度倍率本身沒有在 CalcAverageWalkSpdLevel 中限制到 1；進度套用處也沒有把倍率夾到 1。

`AddProgress` 會呼叫事件抽選管理器的邊界檢查（0x2d05fac），可能先停在可觸發的強制事件位置；最後 currentProgress 不超過 goalProgress。因此不能把每個事件乘算結果無條件直接累加到最終通關進度。

speed.js 新增 calcProgressEvent，使用 float32 乘算並由呼叫端提供亂數；尚未接入地圖模擬，避免擅自使用另一套 RNG 破壞官方事件序列。

### 遠征倒數與倍率是兩條路徑

ExpeditionDungeonMaster.get_DurationTimeSpan（0x2e192f4）從 master +0x20 讀整數，經 TimeSpan 秒數建構路徑（0x57196e0，scale=1000）轉換。
GetReducedDurationTimeSpan（0x2e19358）另外讀取識別值 0x290b 的效果，與 50 取最小值後除以 100，使用 duration × (1 - reduction)，截斷後建立 TimeSpan；此方法沒有讀取隊伍步行倍率。
0x328efe0 的出發流程使用該 reduced duration，0x328f00c 將它加入取得的時間。這條路徑未使用 WalkSpeedMultiplier。

因此目前不能用「地圖秒數 ÷ 隊伍速度倍率」表示遊戲遠征倒數。速度乘算已確認用於事件進度；倒數使用地圖 duration 與獨立縮時效果。

### 已完成與仍需資料的邊界

面板 → 反推狀態 → 隊長／隊員加權 → 遠征倍率 → 條件式事件進度 → 機率取整 → 目標進度限制，已有官方程式證據與實作。
仍未宣稱完成：面板顯示的取整規則、官方 seeded RNG 重現、全地圖事件序列／強制事件完整重播，以及縮時效果 0x290b 的玩家名稱。地圖資料未接入前不顯示猜測的通關時間。


## 11. 新增隊員的取捨

不是面板速度加總，也不是最快與最慢的平均。先反推每名角色的狀態 L，再以隊長 2、隊員 1 加權平均。若目前平均 A、總權重 W，新隊員 L 為 N，加入後平均為 (W×A+N)/(W+1)，差為 (N-A)/(W+1)。所以 N>A 加快、N<A 拖慢、相等不變。面板速度跨過 0.750 時有分段，不能直接平均 km/s。

UI 新增隊伍移動倍率名稱、依現有隊伍計算的新隊員速度門檻，以及不改變實際編制的候選速度試算。門檻保留六位小數並標估算，避免三位小數四捨五入掩蓋變快／變慢界線。
