# DFCH Treasure V1.5 — Google 登入與 D1 部署（第一階段）

本階段只啟用 Google 登入和瀏覽器登入工作階段。**沒有啟用正式抽獎、每日五次扣除或世界排行榜**；既有秘寶頁面仍為純練習，不計分。

## 基礎設施（已由使用者在 Cloudflare 設定）

- 現有 Pages 專案：dfch → https://dfch.pages.dev/
- 現有統計資料庫綁定：GUIDE_STATS → dfch-guide-stats，完全保留
- 新 D1 綁定：TREASURE_DB → dfch-treasure-leaderboard
- Google Cloud 專案：dfch-treasure-login
- Google OAuth 應用程式：DFCH Treasure（External）
- OAuth Web client 名稱：DFCH Treasure Web
- JavaScript 來源：https://dfch.pages.dev（無路徑）
- 用戶端 ID 已由網站管理員建立，請放入 Pages 環境變數，不要放入密鑰

## 下一步需管理員手動操作（完成前登入保持關閉）

### 1. 初始化 D1 SQL 資料表

到 Cloudflare 控制台 → D1 → **dfch-treasure-leaderboard** → Console／主控台，
在這個新資料庫中執行 **cloudflare/treasure-schema.sql**。
請絕對不要在 dfch-guide-stats 執行，並且不要刪除既有資料表。

SQL 使用 IF NOT EXISTS，可重複執行而不會重新清空紀錄。完成後確認資料表：
treasure_players、treasure_sessions、treasure_player_scores、treasure_official_draws。

### 2. 設定 Pages 環境變數

Cloudflare → Workers & Pages → dfch → Settings → Variables and Secrets：

- 類型：Text（非密鑰亦可）
- 變數名稱：GOOGLE_CLIENT_ID
- 變數值：Google OAuth Web Client 的完整 ID（以 .apps.googleusercontent.com 結尾）
- 環境：Production

Google Client ID 本身不是 Client Secret；不要將 Client Secret 放進 GitHub。
請保留 GUIDE_STATS 和 TREASURE_DB 原有 D1 綁定。

### 3. 建置與重新部署

GitHub 倉庫仍是 anzuac/DFCH、main 分支。
Cloudflare Pages 的原設定請維持：

- Build command: node scripts/build-heroes-pages.cjs
- Build output directory: dist-heroes
- Root directory: 倉庫根目錄

這個建置腳本現在會另發布 /treasure/ 前端、合併現有 _worker.js 的 guide-views API，
並把 /api/treasure/* 加進 _routes.json，沒有替換舊資料庫。
重新部署 Production 才會讓 GOOGLE_CLIENT_ID 與新綁定生效。

### 4. 確認登入

- 開啟 https://dfch.pages.dev/treasure/
- 應顯示 Google 登入。若顯示未啟用，檢查 SQL 與環境變數、是否已重新部署。
- 第一次登入後 D1 應新增一筆 treasure_players 與 treasure_sessions。
- 重新整理仍應保持登入；按「登出」後應解除工作階段。
- 關閉／開啟瀏覽器，預期在 30 天有效期內可恢復登入（瀏覽器須保留 Cookie）。
- 原本 https://dfch.pages.dev/ 及 /api/guide-views 應維持正常。
- https://dfch.pages.dev/api/treasure/official-draws 目前應回應 501（未啟用）。

## 安全性規劃

1. Google ID Token 會在 Worker 驗證 Google 公開金鑰 RS256 簽章、aud、iss、exp、iat、sub、nonce，不信任瀏覽器自行回傳的玩家 ID。
2. nonce 使用短效、Host-only、Secure、HttpOnly Cookie，拒絕沒有 nonce 的登入請求。
3. 登入工作階段是獨立生成的 32-byte 隨機權杖，D1 只保存 SHA-256 雜湊；瀏覽器透過 __Host- Cookie 保存，HttpOnly、Secure、SameSite=Lax，30 天過期。
4. 修改登入狀態的 POST 必須從同源 Origin 發出，且使用 application/json。
5. Worker 尚未提供寫入積分或新增正式抽獎的 API。不可使用本機 Math.random() 成績直接寫入 D1 排名。

## 正式計榜下一階段（未實作）

- Cloudflare Worker 從伺服器端使用不可預測的安全隨機來源產生正式開箱結果。
- 以單次正式開箱作為每日五次配額的一次；按台灣時間 00:00 重置。
- 同一請求 request_id 冪等，避免重送造成重複扣額、加分。
- 寫入 treasure_official_draws 並更新 treasure_player_scores 的 best_single_points 與 total_points。
- 只有正式抽獎成績參與「單次最幸運 TOP 3」及「累積最幸運 TOP 3」。
- 普通練習保留原有無限次長按和跳過動畫，永遠不計榜。

**注意：** 已完成 Google OAuth 與 D1 綁定，不代表登入已經上線。必須先執行 SQL、設定 GOOGLE_CLIENT_ID 並重新部署。
