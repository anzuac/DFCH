'use strict';

/**
 * Build an isolated Cloudflare Pages site for the six-star hero gift guide.
 *
 * The repository root remains unchanged for GitHub Pages (expedition simulator).
 * Only files explicitly listed here are copied to dist-heroes.
 *
 * Cloudflare Pages build command: node scripts/build-heroes-pages.cjs
 * Cloudflare Pages build output directory: dist-heroes
 */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'dist-heroes');

const guideFiles = [
  'heroes.html',
  'guide-footer.js',
  'display-settings.js',
  'public-official-labels.js',
  'public-tool-i18n.js',
  'public-display.css',
  'styles.css',
  'hero-preferences-data.js',
  'hero-gift-ranking.js',
  'hero-preferences-view.js',
  // Player-visible six-star bond and ability modal resources.
  'sixstar-abilities.js',
  'sixstar-abilities.css',
  'data/sixstar-visible-abilities.json',
  'frigg-abilities.js',
  'public-nav.js',
  'public-nav.css',
  'site-counter.js',
  'diamond-draw.js',
  'diamond-view.js',
  'diamond-public.css',
];

// Bond30 uses an independent directory; only player-facing files are published.
const bondFiles = [
  'Bond30/index.html',
  'Bond30/css/style.css',
  'Bond30/js/app.js',
  'Bond30/js/data.js',
  'Bond30/embed-height.js',
];

const teamFiles = [
  'team/index.html',
  'team/css/style.css',
  'team/js/app.js',
  'team/js/data.js',
  'team/js/i18n.js',
  'team/embed-height.js',
  'team/assets/abyss-liberator.png',
  'team/assets/greed-iii.png',
];

const imageDirectories = [
  'assets/heroes',
  'assets/gifts',
];

// Validate sources before deleting an existing output directory.
for (const relativePath of [...guideFiles, ...bondFiles, ...teamFiles, ...imageDirectories, 'Bond30/assets/icons', 'index.html']) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    throw new Error(`Missing guide source: ${relativePath}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const relativePath of guideFiles) {
  const destination = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, relativePath), destination);
}

// The public lineup uses the same standalone files as GitHub Pages.
for (const relativePath of teamFiles) {
  const destination = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, relativePath), destination);
}

for (const relativePath of imageDirectories) {
  fs.cpSync(path.join(repoRoot, relativePath), path.join(outputDir, relativePath), {
    recursive: true,
  });
}

// Publish Bond30's player UI, algorithm, data and icons without internal notes.
for (const relativePath of bondFiles) {
  const dest = path.join(outputDir, relativePath.replace(/^Bond30\//, 'bond30/'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(repoRoot,relativePath),dest);
}
fs.cpSync(
  path.join(repoRoot,'Bond30/assets/icons'),
  path.join(outputDir,'bond30/assets/icons'),
  { recursive:true }
);
const bondHtmlPath=path.join(outputDir,'bond30/index.html');
let bondHtml=fs.readFileSync(bondHtmlPath,'utf8');
// Bond30 already includes shared settings, navigation, and localization exactly once.
if(!bondHtml.includes('public-tool-i18n.js'))throw new Error('Bond30 localization entry missing');
bondHtml=bondHtml.replace('</body>', '<script src="../site-counter.js?v=1.0.0"></script></body>');
fs.writeFileSync(bondHtmlPath,bondHtml);

// Extract the live Diamond controls from the internal page: no duplicate probability tables.
const expeditionHtml=fs.readFileSync(path.join(repoRoot,'index.html'),'utf8');
const diamondStart=expeditionHtml.indexOf('<section class="tab-panel" id="tab-diamond">');
const diamondEnd=expeditionHtml.indexOf('<section id="tab-heroes"',diamondStart);
if(diamondStart<0||diamondEnd<=diamondStart)throw new Error('Diamond markup anchors changed');
const diamondMarkup=expeditionHtml.slice(diamondStart,diamondEnd)
  .replace('class="tab-panel"','class="tab-panel active"');
const diamondPage=[
  '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<meta name="description" content="非官方鑽石及獎勵輪盤抽取模擬器">',
  '<title>鑽石抽取模擬器｜DFCH</title>',
  '<script src="../display-settings.js?v=2.1.0"></script>',
  '<script src="../public-official-labels.js?v=1.0.0" defer></script>',
  '<script src="../public-tool-i18n.js?v=1.0.0" defer></script>',
  '<link rel="stylesheet" href="../styles.css?v=2.4.1">',
  '<link rel="stylesheet" href="../public-nav.css?v=1.0.0">',
  '<link rel="stylesheet" href="../diamond-public.css?v=1.0.0">',
  '<link rel="stylesheet" href="../public-display.css?v=1.0.1">',
  '<script src="../public-nav.js?v=1.2.0" defer></script>',
  '</head><body class="public-diamond">',
  '<div class="app-shell"><header class="hero-guide-header"><p class="eyebrow">DFCH · DIAMOND SIMULATOR</p>',
  '<h1>鑽石抽取模擬器</h1><p class="helper">鑽石與獎勵輪盤抽選，在瀏覽器內直接執行。</p></header>',
  '<main>'+diamondMarkup+'</main>',
  '<footer class="guide-footer">非官方機率試算工具，結果不影響遊戲帳號。</footer></div>',
  '<script src="../diamond-draw.js?v=2.2.0"></script>',
  '<script src="../diamond-view.js?v=2.2.0"></script>',
  '<script src="../site-counter.js?v=1.0.0"></script>',
  '</body></html>'
].join('\n');
fs.mkdirSync(path.join(outputDir,'diamond'),{recursive:true});
fs.writeFileSync(path.join(outputDir,'diamond/index.html'),diamondPage);

// The Cloudflare homepage is the hero guide, not the expedition simulator.
// Preserve heroes.html so existing /heroes or /heroes.html links continue to work.
// Use the relevant content commit, never the build clock or filesystem mtime.
const {execFileSync}=require('node:child_process');
const git=(...args)=>execFileSync('git',args,{cwd:repoRoot,encoding:'utf8',timeout:60000}).trim();
let updatedAt='';
try{
 if(git('rev-parse','--is-shallow-repository')==='true')git('fetch','--unshallow','origin');
 updatedAt=git('log','-1','--format=%cI','--',...guideFiles,...teamFiles,...imageDirectories,'data/hero-preferences.json','data/hero-acquisition.json','data/hero-bond-gains.json','data/hero-gift-locations.json','data/hero-gift-supplements.json');
 if(Number.isNaN(Date.parse(updatedAt)))updatedAt='';
}catch{console.warn('Content timestamp unavailable; showing a dash.');}
const html=fs.readFileSync(path.join(repoRoot,'heroes.html'),'utf8').replace('</head>',`<meta name="dfch-updated-at" content="${updatedAt}">\n</head>`);
for(const name of ['index.html','heroes.html'])fs.writeFileSync(path.join(outputDir,name),html);
fs.copyFileSync(path.join(repoRoot,'cloudflare/guide-worker.mjs'),path.join(outputDir,'_worker.js'));
fs.writeFileSync(path.join(outputDir,'_routes.json'),JSON.stringify({version:1,include:['/api/guide-views'],exclude:[]}));

// Having a real 404 page also prevents Cloudflare Pages SPA fallback from
// treating missing simulator paths as an application route.
fs.writeFileSync(
  path.join(outputDir, '404.html'),
  [
    '<!doctype html>',
    '<html lang="zh-Hant"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>找不到頁面｜六星英靈喜好圖鑑</title>',
    '</head><body>',
    '<main><h1>找不到此頁面</h1>',
    '<p>本站提供六星英靈喜好、羈絆能力及鑽石抽取模擬器。</p>',
    '<p><a href="/">返回六星英靈圖鑑</a></p></main>',
    '</body></html>',
  ].join('\n'),
  'utf8',
);

console.log('Cloudflare Pages: four public tools output prepared in dist-heroes/');
console.log('Published: six-star guide, Bond30, Diamond, Hero Lineup and whitelisted assets.');
