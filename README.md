# DFCH 遠征模擬器 V2.0.0

以官方 3.16.0 資料建立的十三張地圖遠征模擬器。戰鬥採無敵必勝、立即勝利與陷阱免傷，可選無限耐力或自行輸入隊伍最終耐力。

## V2.0.0

- 上方集中設定六種遠征神器，以及全部地圖探索 100%；也可逐圖輸入探索率。
- 帳號神器跨地圖共用、自動保存，支援獨立匯入／匯出。
- 接入羈絆加成、探索事件加權、首領連續掉落率、限定神器加權、首領額外道具池及寶石數量加成。
- 掉落預覽與模擬共用有效權重及數量換算；魂之果物不計入羈絆贈禮統計。
- 畫面依帳號配置、地圖、隊伍、執行與結果重新編排，公式及原始資料可展開查看。
- 保留 V1.6.0 的鑽石抽取、獎勵輪盤、十三張地圖、每輪種子、批次中止及歷史統計。

獨立模式每輪使用固定起始配置；連續模式結算後累積神器、探索及解鎖狀態，當日鑽石依地圖保存。重置統計不清除帳號神器及探索設定。舊版統計繼續保留，不同版本或配置的累積平均值代表混合結果。

活動倍率、其他角色專屬事件、經驗、年齡、寶箱開箱及跨日重置未接入；速度由面板值推算。此專案不宣稱逐種子完整重現原版遊戲。

完整變更、來源及限制：[V2.0.0 說明](docs/v2.0.0.md)。

## 使用與驗證

無需建置：以靜態網頁伺服器開啟 `index.html`，例如 `python -m http.server 8000`。

核心回歸測試（Node.js）：

```bash
for testfile in tests/*.test.cjs; do node "$testfile" || exit 1; done
```

HTML 互動驗證需要 jsdom；可透過 `DFCH_JSDOM_PATH` 指定既有安裝：

```bash
node scripts/verify-simulator-ui.cjs
node scripts/verify-v2-ui.cjs
node scripts/verify-diamond-ui.cjs
```

官方資料擷取需原始 APK 和 UnityPy，見 `scripts/extract-map-tables.py`；執行擷取後，於儲存庫上一層執行 `python DFCH/scripts/build-artifacts.py` 可重建神器資料。

## 主要模組

| 模組 | 用途 |
| --- | --- |
| `account-settings.js` | 帳號設定、舊版遷移與保存 |
| `artifact-data.js`、`artifacts.js` | 官方神器資料及效果 |
| `map-data.js`、`data/` | 十三張地圖資料 |
| `event-pool.js`、`drop-state.js` | 事件候選、有效掉落權重與數量 |
| `simulator.js`、`simulation-batch.js` | 遠征及批次執行 |
| `records.js`、`record-view.js` | 歷史統計 |
| `diamond-draw.js`、`diamond-view.js` | 獨立鑽石抽取及輪盤 |

歷次地圖與公式核對紀錄保留於 `docs/`。
