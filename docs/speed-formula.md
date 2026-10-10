# 遠征速度公式逆向紀錄

版本基準：遊戲 3.16.0 / Unity 2022.3.62f2 / IL2CPP

本文件只記錄已從遊戲二進位確認的公式，以及尚未確認的部分。不要把推測值當成官方值。

## 1. 隊伍容量

### 已確認

方法：

- `BattlerParamCalculator.CalculatePartyMemberCount`
- ARM64 code address: `0x34bfd10`

公式：

```text
PartySlots = max(1, floor(Leadership / 20) + 1)
```

例如統率力 230：

```text
floor(230 / 20) + 1
= 11 + 1
= 12
```

因此目前角色畫面所示統率力 230 對應：

- 隊長 1 名
- 隊員最多 11 名
- 合計 12 名

`UseCase_Expedition_PartyEdit.GetEmptyMemberSlotCount` 會取得這個 PartyMemberCount，再扣除目前已編制人數。

> V1 UI 目前另外以 12 人作為遊戲實際畫面上限，避免使用者輸入更高統率力後建立超出目前已觀察編制的隊伍。底層官方容量公式仍獨立保留。

---

## 2. 隊伍步行等級平均

### 已確認

方法：

- `ExpeditionLevelLogic.CalcAverageWalkSpdLevel`
- token: `0x06001074`
- ARM64 code address: `0x2d07c48`

遊戲不是把所有角色等權平均。

隊長：

```text
weight = 2
```

每名隊員：

```text
weight = 1
```

因此：

```text
Lavg =
(2 × LeaderWalkSpdLevel + Σ MemberWalkSpdLevel)
/
(2 + MemberCount)
```

舉例：

隊長步行等級 20，3 名隊員分別 10、15、25：

```text
Lavg
= (2×20 + 10 + 15 + 25) / (2 + 3)
= 90 / 5
= 18
```

---

## 3. 遠征步行倍率

### 已確認

`CalcAverageWalkSpdLevel` 接著使用：

```text
WalkSpeedMultiplier
= 0.8 + (Lavg / 100) × 3.2
```

二進位常數：

- base = `0.8`
- range = `3.2`
- divisor = `100`

前例 `Lavg = 18`：

```text
0.8 + (18 / 100) × 3.2
= 1.376
```

所以：

```text
WalkSpeedMultiplier = 1.376
```

這個結果會寫入 `ExpeditionContext.<WalkSpeedMultiplier>k__BackingField`。

---

## 4. 公式使用的是什麼角色值？

### 已確認

`CalcAverageWalkSpdLevel` 對每名遠征角色呼叫：

```text
UniqueStatusData.GetTotalLevel(2)
```

也就是遠征公式讀取的是角色內部的「步行速度狀態總等級」。

### 尚未確認

角色資訊畫面顯示例如：

```text
0.577 km/s
```

目前尚不能直接證明：

```text
0.577 km/s == GetTotalLevel(2) 的某個簡單線性值
```

而且 `UniquePlayerParams.get_walkSpd` 還會取得基礎 walkSpd，再乘上一個百分比修正，因此：

> **目前不能直接把面板 km/s 拿去套隊長 ×2、隊員 ×1 的公式。**

V1 因此把兩欄分開：

- 面板步行速度 km/s：玩家辨識角色用
- 內部步行等級：目前用於官方公式驗證

下一個逆向目標是：

```text
角色 Master / UniqueStatusData
→ GetTotalLevel(2)
→ GetActualValue
→ UniquePlayerParams.get_walkSpd
→ 面板 km/s
```

把這條鏈完全接起來後，網頁就不再需要手動輸入內部步行等級。

---

## 5. 已實作到 DFCH

`speed.js` 目前提供：

```js
calcPartySlotCount(leadership)
calcAverageWalkSpdLevel(leaderLevel, memberLevels)
calcWalkSpeedMultiplier(averageWalkSpdLevel)
calcPartyWalkSpeed({ leaderLevel, memberLevels })
```

UI：

- 1 隊長
- 最多 11 隊員
- 統率力
- 面板 km/s
- 內部步行等級
- 官方加權平均
- 官方 WalkSpeedMultiplier

---

## 6. 下一步

優先順序：

1. 找到角色 Master 中「面板步行 km/s」的來源
2. 確認 `GetTotalLevel(2)` 的所有加成來源
3. 確認速度能力是否先加 level 或最後乘 actual speed
4. 對照遊戲實際角色面板數字，例如 0.577 km/s
5. 有足夠樣本後把手動「步行等級」欄位改成角色資料自動計算
