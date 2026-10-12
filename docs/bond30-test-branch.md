# 第七項羈絆 30 等模擬器：隔離測試版

狀態：只在 `feature/bond30-seventh-tab` 分支；沒有修改 `main`、`heroes.html`，也沒有建立或合併 PR。

## 使用方法
1. 進入 GitHub 測試分支，下載該分支 ZIP。
2. 解壓後以靜態伺服器執行，例如 `python -m http.server 8000`。
3. 開啟 `http://localhost:8000/`，頂部左右滑到「⑦ 羈絆30等抽選 BETA」。
4. 選擇招募池，系統會自動載入 `data/bond30-pools-3.16.1.json` 的 540 筆 Optional 候選。也支援匯入相同格式 JSON。
5. 選擇英靈（目前只按來源池對照 ID，完整名稱與固定技能仍待補），勾選現有技能；有需要可手動輸入固定技能 ID。查看機率後試抽。

## 來源與限制
- APK 版本為 3.16.1，對應 `UniqueSoldierGachaTable` 與 `UniqueAffectionRandomRewardLogic`。
- 候選取 chooseGroupType=1 (Optional)，使用原始候選 weight 加權。
- 現有技能採 ID 排除；排他群組排除為實驗模式，預設關閉。
- 權重百分比為該技能權重除以所有有效候選權重總和。
- JSON 從二進位模式比對獲得，尚須完整序列化層級確認；不是保證百分之百一致的官方模擬。
- 固定技能對照在 `data/bond30-heroes.json` 預留，尚無可信的 3、4、5 星完整對照，不能假設空白代表沒有固定技能。

## 需完成的驗證
1. 3、4、5 星英靈名稱、固定能力與自由格數的對照。
2. ResolveGachaMaster 的來源池回退規則。
3. 同系列不同等級去重、原有九格與排他群組判定。
4. 截圖可獲得能力列表和候選權重對照。
5. 完整圖片、多語言、手機與桌面 UI 測試。

## 變更檔案
- 新增 `bond30-engine.js`、`bond30-view.js`、`bond30.css`。
- 新增 `data/bond30-pools-3.16.1.json`、`data/bond30-heroes.json`、`tests/bond30.test.cjs`。
- 僅在本分支修改 `index.html` 新增「⑦」分頁，原有五頁內容不變；第六項未在目前主導覽列實作。
- `node tests/bond30.test.cjs` 可測基本抽選權重與排除。

公開 GitHub 分支的程式碼仍可被他人查看，但不代表已部署給正式網站玩家。待使用者明確確認之後才考慮合併到正式分支。
