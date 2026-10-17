# 英靈養成｜開發者專用第九分頁

網址：GitHub Pages 根目錄第九點，亦可直接開啟 `/training/`。**不包含於 Cloudflare 正式工具站打包清單。**

- 使用預設英靈：23 位六星英靈的官方 `UniquePlayerParamTable` 初始 11 維內部能力等級，各版本分開。
- 自訂：自行輸入 11 個初始能力 L（0～99.9）；自訂與預設資料互不覆蓋。
- 果實：11 種普通能力果實，每顆效果值 1；使用逐顆獨立繼承累積公式。
- SP：獨立強化進度；×1、×10、MAX、超強化 (Rank) 依 APK 模擬扣點。各英靈分開儲存果實、SP 與上限。
- 上限：SSS 99.9／GOD 109.9／GOD+ 119.9；更改上限並不會自動把內部能力推升。
- 值：11 項依 `CalcBasicStatusValue()` 基礎值公式換算；畫面採官方相近排列、等級配色與數值格式。

實作參照之前從 APK 3.16.1 原生 IL2CPP ARM64 拆出的五輪研究，尤其是 `UniqueLevelLogic.CalcBasicStatusLevelUp()`、`UniqueLevelLogic.SimulateStatusReinforce()` 與 `UniqueStatusData.GetTotalLevel()`。★弗雷雅在 GOD 上限、859 SP、實機果實配置下的 **11/11 MAX 成本**均已核對。

**已知差異：** 本工具不會寫回遊戲；Android 原生 `powf` 浮點末位可能與 JavaScript 不完全一致。此介面不模擬道具背包的實際果實餘額、角色升級取得 SP、非標準繼承道具、SP 真實存檔回滾成本、GOD+ 正常解鎖來源，也不保證所有特殊來源對能力的影響。自訂強化重置會返還本地模擬已花 SP，並非官方遊戲功能。

本地測試：`node --test tests/developer-training.test.cjs`。此頁的存檔鍵為 `dfch-developer-training-v1`，與招募及編隊存檔獨立。
