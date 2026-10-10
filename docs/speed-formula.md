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

1. 追 `CharaManager.skill2Value` 初始化來源
2. 找出哪些技能／神器／全局效果會改變 Skill2Value
3. 用實際面板 0.577 km/s 等樣本反推並交叉驗證
4. 完成 `visible km/s → WalkSpd L → Expedition Multiplier`
5. 再把 V1 隊伍速度改成自動即時計算
