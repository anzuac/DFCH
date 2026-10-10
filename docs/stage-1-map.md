# 第一張遠征地圖：米維克威茲 外緣部

來源：3.16.0 的 assets.zip / assets/bin/Data/datapack.unity3d；欄位結構與 enum 值由 APK global-metadata.dat 核對。每個已解析表都驗證讀取游標恰好抵達物件末端，沒有猜測欄位後忽略剩餘 bytes。float32 權重保留可回讀數值，沒有先四捨五入為百分比。

## 地圖設定

- dungeonId=1001，key=stage_1，referenceDungeonId=900。
- duration=600 秒；depth=60。ExpeditionContext constructor 0x34b62f4–0x34b6304 把 dungeon +0x24 的 depth 放入 goalProgress，因此目標進度為 60；不能把它直接稱為 60 km。
- 一般戰鬥群組 100100，1–4 名怪物，事件權重 20。
- 原始物品事件權重：50→1、51→5、100150→5、100170→float32 的 0.48。
- 解鎖群組 100 權重 5，條件旗標 6504；群組 0 權重 0。
- Boss 群組 100190；Boss 掉落組 [100190,90,80,0]，multiDropContinuousRate=0.75。這不是每個 Boss 神器的 75% 掉率，需追對應程式如何使用。
- 限定獎勵：☆遺忘的金幣袋、★遠征隊的吊墜。
- 每日鑽石上限 500；gemScaler=1、chestScaler=1，expRate=7、bossExpBonus=500，elapsedYears=2。

## 解析涵蓋

7 個共用事件、22 個條件模板、69 條有序指令、15 個探索率獎勵、67 個掉落樣本、13 個怪物樣本、16 個獎勵主資料；掉落 rewardId 全部能對應到名稱。模板共享事件 ID 時保留各自條件與權重。

一般移動事件 1：ConsumeSp(5) → Progress(1) → WalkLog；事件 2：ConsumeSp(10) → Progress(2) → WalkLog。休息事件 3：HealHpPartyByRecoveryHp(5) → HealSpFixed(20) → Progress(1) → RestLog。探索率事件 200/201/202 原始參數為 0.1/0.5/1；實際經地圖深度換算，第一張地圖約增加 0.2/1/2 個百分點。區域事件 901 施加 buff 1（dia_fever）。這些只是序列，耐力消耗參數不能未追函式就稱為最終扣除量。

## 掉落組對照

| 群組 | 樣本數 | 原始權重加總 |
|---|---:|---:|
| 50 | 5 | 100.02999999932945 |
| 51 | 5 | 99.95000009611249 |
| 80 | 2 | 10.0 |
| 90 | 20 | 413.05000000074506 |
| 100 | 4 | 100.0 |
| 100150 | 7 | 100.0 |
| 100151 | 2 | 100.0 |
| 100152 | 2 | 100.0 |
| 100160 | 2 | 100.0 |
| 100161 | 2 | 100.0 |
| 100170 | 4 | 98.0 |
| 100190 | 2 | 7.0 |
| 1000050 | 1 | 100.0 |
| 1000051 | 1 | 100.0 |
| 1000052 | 1 | 100.0 |
| 1000053 | 1 | 100.0 |

以上加總是資料核對，不是全地圖掉率。不能把事件權重、群組內權重、稀有度處理、條件與連續掉落合成同一個固定百分比。額外掉落組與戰鬥組依本輪起始探索率生成，當輪跨門檻不重建；數量與限定增權另讀當輪探索率；技能模板也有各自 requiredAbilities、conditionTypes、conditionValues。minValue/maxValue 保留原值，包含 maxValue=0 的哨兵；其取量語意須由官方函式確認。

## 秒殺模式

使用者指定：combat=instant-victory，combatDurationSeconds=0；仍保留遭遇、勝利掉落及下一條事件。省略攻速、傷害、敵人攻擊及戰鬥勝負運算。這是模擬假設，不是官方的耗時設定。移動／休息／耐力與其他非戰鬥事件保留；不擅自改為無限耐力。

目前接入資料檢視與戰鬥模式設定，尚未宣稱完成整場遠征模擬。待接：官方動態事件生成器、事件條件與效果的實際執行、權重修正與掉落次數、亂數流、取得／解鎖狀態及每日上限。

## 重現

在含 project_sources/ 與 DFCH/ 的工作區執行：

```sh
python DFCH/scripts/extract-map-tables.py
python DFCH/scripts/build-stage-1.py
node DFCH/tests/map-data.test.cjs
```

scripts/extract-map-tables.py 使用 zipfile 完整讀取並檢查 CRC，UnityPy 取出目標 MonoBehaviour；依 metadata 欄位解碼並核對全長。不將 APK、bundle 或原始美術上傳 git。資料輸出在 data/stage-1.json，map-data.js 為相同內容的離線網頁載入版本。


## 中文檢視與探索完成配置

詳細資訊改為中文用途、技能名稱與效果說明，不再顯示群組／模板／能力代號及 JSON 下載連結。權重在畫面使用 8 位有效數字方便閱讀，原始資料保留完整 float32 值。大豐收與盛宴的官方繁中欄位為空，分別依日文「大豊作」「豪華な晩餐」補譯。

新增探索已達 100% 開關，更新 DFCHMapConfig.completionRate（0 或 100）與 15 個門檻的達標狀態；不是本次行走完成度，也不把候選事件當成必然掉落。完整事件引擎尚未接入，這個配置目前用於條件／解鎖預覽及保留後續模擬輸入。

本次修正 conditionValues 的型別：metadata type index 23998 是 Int64 陣列，不是 double 陣列。先前把整數 90 誤讀為極小浮點數；原始 bytes 不變，現已正確解析為 90 與 50 等整數，並補上測試。
