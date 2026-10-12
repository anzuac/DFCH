# Cloudflare Pages：六星英靈圖鑑專用部署

本儲存庫同時提供兩個網站，但發布內容彼此獨立：

- GitHub Pages（`https://anzuac.github.io/DFCH/`）：沿用根目錄的 `index.html`，提供完整遠征模擬器。
- Cloudflare Pages（`https://dfch.pages.dev/`）：只發布六星英靈喜好圖鑑。

## Cloudflare Pages 專案設定

- Git repository：`anzuac/DFCH`
- Production branch：`main`
- Framework preset：`None`
- Build command：`node scripts/build-heroes-pages.cjs`
- Build output directory：`dist-heroes`
- Root directory：留空（倉庫根目錄）

Cloudflare 的自動部署需保持啟用。變更 Build configuration 後，需重新部署一次才能讓新的發布目錄生效。往後每次更新 `main` 分支，Cloudflare 會自動重建。

## 發布清單

`scripts/build-heroes-pages.cjs` 執行時，會由原始碼建立 `dist-heroes/`：

- `index.html`（從 `heroes.html` 複製，作為圖鑑首頁）
- `heroes.html`
- `styles.css`
- `hero-preferences-data.js`
- `hero-preferences-view.js`
- `docs/hero-preferences.md`
- `assets/heroes/`
- `assets/gifts/`
- `404.html`

遠征模擬器的 `index.html`、`simulator.js`、`app.js`、`artifact-data.js` 等不會複製到 Cloudflare 發布目錄。

## 驗證

重新部署完成後，請測試：

1. `https://dfch.pages.dev/`：顯示六星英靈喜好圖鑑。
2. `https://dfch.pages.dev/heroes`：維持六星英靈喜好圖鑑。
3. `https://dfch.pages.dev/simulator.js`：應回傳 404。
4. `https://dfch.pages.dev/artifact-data.js`：應回傳 404。
5. `https://anzuac.github.io/DFCH/`：原本遠征模擬器仍正常。

提醒：GitHub 倉庫仍是 Public，完整來源及 Git 歷史可在 GitHub 取得；舊的 Cloudflare 版本部署 URL 也可能保留過往發布檔案。此設定僅限制新的正式 Cloudflare Pages 網站所發布的檔案，並非存取控制。
