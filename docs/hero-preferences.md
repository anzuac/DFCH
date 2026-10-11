# V2.2.0 六星英靈喜好

第五頁提供官方 3.16.0 資料中的 23 位六星英靈之固定喜愛與最愛物品。英靈原表共有 64 筆，取 `rarity=5`（六星／God），同名不同版本依獨立 index 保留。

## 來源與對應

- `UniquePlayerParamTable`：datapack.unity3d 的 MonoBehaviour pathID 76187。解析繼承欄位 `ParamMasterBase → PlayerParamMasterBase → UniquePlayerParamMaster`，完整消耗原始資料並驗證長度。
- `lovedInheritanceIds` 為最愛物品，`favoriteInheritanceIds` 為喜愛物品；0 是空欄，不是物品。
- `UniqueSoldierInheritanceStatusTable` 的 `commonPreference` 與個別例外優先於英靈清單。目前資料的三種例外陣列全部為空。
- `UniqueFavoriteItemLogic.AssignFavoriteItems`（0x2d3e894）先加入固定清單；rarity > 4 直接跳過隨機補齊，因此本頁六星喜好不套用性格抽選。
- `UniqueSoldierData.GetPresentPreference`（0x2dcf66c）先檢查通用規則，再檢查最愛，最後檢查喜愛。`TryGetCommonPreference`（0x2e7dccc）在 commonPreference 非零時採通用／例外設定。
- 喜好值：1 一般、2 喜愛、3 最愛。本頁不列一般物品。

所有六星共同喜愛：巧克力、魔女的糖果籃、聖誕節蛋糕、聖誕烤雞、吉備糰子、蘭姆酒。這 6 項在上方集中列出，每位英靈的卡片補列個別喜好；搜尋與篩選仍將通用物品計入。共 31 種物品至少被一位六星喜愛或最愛。

名稱與稱號取自 `localize_master`／`localize_master2` 的繁中欄位。フレイヤ（index 59）與フリッグ（index 60）的繁中名稱與稱號均空白，保留官方日文並標明，未自行捏造官方譯名。

## 使用

可搜尋姓名、稱號或物品，指定英靈、物品及「只查最愛／只查喜愛」。多個條件取交集；清除篩選恢復全部。喜好程度篩選決定符合條件的英靈，卡片仍展示其完整喜好。

頂部分頁保持單列左右滑動，選取超出可視範圍的頁籤時自動捲入；不再於窄螢幕改成兩排。原遠征與鑽石計算、存檔皆不變。

## 重建與驗證

先於儲存庫上一層執行 `python DFCH/scripts/extract-map-tables.py`，再執行 `python DFCH/scripts/build-hero-preferences.py`。需要 UnityPy 與原始 APK／assets 資源。

- `data/hero-preferences.json` 與 `hero-preferences-data.js` 為同一份供介面使用的資料。
- `docs/evidence/hero-preferences-source.json` 保留 23 位英靈的來源清單、全部 48 筆贈禮物品規則與原表／metadata 雜湊。
- `docs/evidence/hero-preferences-arm64.txt` 為相關原始 ARM64 指令。
- `tests/hero-preferences.test.cjs` 逐筆比對全部喜好、通用規則、同名版本及中文／日文名稱。
- `scripts/verify-heroes-ui.cjs` 檢查第五頁、篩選交集、清除、空結果與名稱回退；另執行既有頁面回歸。

範圍限使用者提供的 3.16.0 資料，不宣稱含後續新增角色。尚未進行真實手機瀏覽器截圖驗收。
