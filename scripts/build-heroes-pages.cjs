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
  'public-accessibility.css',
  'cloudflare-home.css',
  'cloudflare-home.js',
  'recruit-public.css',
];
const recruitFiles=[
  'index.html','style.css','recruit-ui-fix.css','tabs.css','target-draw.css','bond.css',
  'config.js','status-data.js','recruit-bonus.js','stats-core.js','ability-stats.js',
  'bond.js','app.js','stats.js','target-draw.js','tabs.js'
].map(file=>'Recruit/'+file);

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
  'team/assets/ocean-ruler.png',
];

const imageDirectories = [
  'assets/heroes',
  'assets/gifts',
];

// Validate sources before deleting an existing output directory.
for (const relativePath of [...guideFiles, ...bondFiles, ...teamFiles, ...recruitFiles, ...imageDirectories, 'Bond30/assets/icons', 'cloudflare/home.html', 'index.html']) {
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

// Cloudflare uses lowercase paths; repair only published copies, not the source files.
for(const relativePath of recruitFiles){
  const destination=path.join(outputDir,relativePath.replace(/^Recruit\//,'recruit/'));
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  let content=fs.readFileSync(path.join(repoRoot,relativePath),'utf8');
  content=content.replaceAll('../Bond30/','../bond30/');
  if(relativePath==='Recruit/index.html'){
    content=content.replace('<head>',`<head>
<script src="../display-settings.js?v=3.0.0"></script>
<link rel="stylesheet" href="../public-nav.css?v=3.0.0">
<link rel="stylesheet" href="../public-display.css?v=3.0.0">
<link rel="stylesheet" href="../recruit-public.css?v=3.0.0">
<link rel="stylesheet" href="../public-accessibility.css?v=3.0.0">
<script src="../public-nav.js?v=3.0.0" defer></script>`);
    content=content.replace('<body>','<body class="recruit-public">');
    content=content.replace('</body>','<script src="../site-counter.js?v=1.0.0"></script></body>');
    // Shared public styles must follow the simulator's dark-only stylesheet.
    content=content.replace('<link rel="stylesheet" href="../recruit-public.css?v=3.0.0">','')
      .replace('<link rel="stylesheet" href="../public-accessibility.css?v=3.0.0">','');
    content=content.replace('</head>',`<link rel="stylesheet" href="../recruit-public.css?v=3.0.0">
<link rel="stylesheet" href="../public-accessibility.css?v=3.0.0"></head>`);
  }
  fs.writeFileSync(destination,content);
}
for(const optional of ['Recruit/icons','Recruit/images']){
  const from=path.join(repoRoot,optional);
  if(fs.existsSync(from))fs.cpSync(from,path.join(outputDir,optional.replace(/^Recruit\//,'recruit/')),{recursive:true});
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
bondHtml=bondHtml
 .replace(/display-settings\.js\?v=[^"]+/g,'display-settings.js?v=3.0.0')
 .replace(/public-nav\.js\?v=[^"]+/g,'public-nav.js?v=3.0.0')
 .replace(/public-nav\.css\?v=[^"]+/g,'public-nav.css?v=3.0.0')
 .replace(/public-display\.css\?v=[^"]+/g,'public-display.css?v=3.0.0')
 .replace('</head>','<link rel="stylesheet" href="../public-accessibility.css?v=3.0.0"></head>');
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
  '<script src="../display-settings.js?v=3.0.0"></script>',
  '<script src="../public-official-labels.js?v=1.0.0" defer></script>',
  '<script src="../public-tool-i18n.js?v=1.0.1" defer></script>',
  '<link rel="stylesheet" href="../styles.css?v=2.4.1">',
  '<link rel="stylesheet" href="../public-nav.css?v=3.0.0">',
  '<link rel="stylesheet" href="../diamond-public.css?v=1.0.0">',
  '<link rel="stylesheet" href="../public-display.css?v=3.0.0">',
  '<link rel="stylesheet" href="../public-accessibility.css?v=3.0.0">',
  '<script src="../public-nav.js?v=3.0.0" defer></script>',
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

// Produce a standalone landing page and keep both legacy and canonical hero-guide URLs.
// Dates are per-tool content commits, never current build time.
const {execFileSync}=require('node:child_process');
const git=(...args)=>execFileSync('git',args,{cwd:repoRoot,encoding:'utf8',timeout:60000}).trim();
try{if(git('rev-parse','--is-shallow-repository')==='true')git('fetch','--unshallow','origin');}
catch{console.warn('Full git history unavailable; dates will use available commits.');}
function lastContentDate(paths){
 try{
  const stamp=git('log','-1','--format=%cI','--',...paths);
  return Number.isNaN(Date.parse(stamp))?'':stamp;
 }catch{return '';}
}
function taiwanDate(iso){
 if(!iso)return '—';
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'})
  .format(new Date(iso)).replace(/-/g,'/');
}
const items=[
  {key:'heroes',name:'六星英靈喜好圖鑑',url:'heroes/',files:[
    'heroes.html','hero-preferences-data.js','hero-preferences-view.js','hero-gift-ranking.js',
    'sixstar-abilities.js','data/hero-preferences.json','data/hero-gift-locations.json']},
  {key:'recruit',name:'英靈抽取模擬器',url:'recruit/',files:recruitFiles},
  {key:'bond30',name:'羈絆 30 等抽選',url:'bond30/',files:bondFiles},
  {key:'diamond',name:'鑽石抽取模擬器',url:'diamond/',files:[
    'diamond-draw.js','diamond-view.js','diamond-public.css','index.html']},
  {key:'team',name:'英靈編隊',url:'team/',files:teamFiles}
].map(item=>({...item,stamp:lastContentDate(item.files)}));
const heroesUpdated=items[0].stamp;
const guideHtml=fs.readFileSync(path.join(repoRoot,'heroes.html'),'utf8')
 .replace('</head>',`<meta name="dfch-updated-at" content="${heroesUpdated}">\n</head>`)
 .replace(/display-settings\.js\?v=[^"]+/g,'display-settings.js?v=3.0.0')
 .replace(/public-nav\.js\?v=[^"]+/g,'public-nav.js?v=3.0.0')
 .replace(/public-nav\.css\?v=[^"]+/g,'public-nav.css?v=3.0.0')
 .replace(/public-display\.css\?v=[^"]+/g,'public-display.css?v=3.0.0')
 .replace('</head>','<link rel="stylesheet" href="./public-accessibility.css?v=3.0.0">\n</head>');
fs.writeFileSync(path.join(outputDir,'heroes.html'),guideHtml);
fs.mkdirSync(path.join(outputDir,'heroes'),{recursive:true});
fs.writeFileSync(path.join(outputDir,'heroes/index.html'),
  guideHtml.replace('<head>','<head><base href="/">'));
const homePaths=['cloudflare/home.html','cloudflare-home.css','cloudflare-home.js',
  'public-nav.js','public-nav.css','display-settings.js','public-accessibility.css'];
const homeUpdated=lastContentDate(homePaths);
const updates=items.filter(item=>item.stamp)
 .sort((a,b)=>Date.parse(b.stamp)-Date.parse(a.stamp)).slice(0,3);
const escaped=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const updateMarkup=updates.map(item=>
  `<a class="dfch-update-row" data-tool="${escaped(item.key)}" href="./${escaped(item.url)}"><strong>${escaped(item.name)}</strong><time datetime="${escaped(item.stamp)}">${taiwanDate(item.stamp)}</time></a>`
).join('\n');
let homepage=fs.readFileSync(path.join(repoRoot,'cloudflare/home.html'),'utf8');
if(!homepage.includes('<!-- DFCH_RECENT_UPDATES -->'))throw new Error('Homepage updates slot missing');
homepage=homepage.replace('<!-- DFCH_RECENT_UPDATES -->',updateMarkup)
 .replace('<time id="dfchSiteUpdated">—</time>',
  `<time id="dfchSiteUpdated" datetime="${escaped(homeUpdated)}">${taiwanDate(homeUpdated)}</time>`);
fs.writeFileSync(path.join(outputDir,'index.html'),homepage);
// The team tool had theme styles but no display-settings script; add it only to published HTML.
const teamPage=path.join(outputDir,'team/index.html');
let teamHtml=fs.readFileSync(teamPage,'utf8');
if(!teamHtml.includes('display-settings.js'))teamHtml=teamHtml.replace('<head>','<head><script src="../display-settings.js?v=3.0.0"></script>');
teamHtml=teamHtml
 .replace(/display-settings\.js\?v=[^"]+/g,'display-settings.js?v=3.0.0')
 .replace(/public-nav\.js\?v=[^"]+/g,'public-nav.js?v=3.0.0')
 .replace(/public-nav\.css\?v=[^"]+/g,'public-nav.css?v=3.0.0')
 .replace(/public-display\.css\?v=[^"]+/g,'public-display.css?v=3.0.0')
 .replace('</head>',`<link rel="stylesheet" href="../public-accessibility.css?v=3.0.0"></head>`);
teamHtml=teamHtml.replace('</body>','<script src="../site-counter.js?v=1.0.0"></script></body>');
fs.writeFileSync(teamPage,teamHtml);
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
    '<title>找不到頁面｜DFCH 英靈工具站</title>',
    '</head><body>',
    '<main><h1>找不到此頁面</h1>',
    '<p>DFCH 提供英靈圖鑑、招募、羈絆、鑽石抽取與編隊工具。</p>',
    '<p><a href="/">返回 DFCH 首頁</a></p></main>',
    '</body></html>',
  ].join('\n'),
  'utf8',
);

// Fail the deployment rather than silently publishing broken scripts or stylesheets.
for(const page of ['index.html','heroes.html','heroes/index.html',
  'recruit/index.html','bond30/index.html','diamond/index.html','team/index.html']){
 const htmlPath=path.join(outputDir,page);
 const markup=fs.readFileSync(htmlPath,'utf8');
 const base=markup.includes('<base href="/">')?outputDir:path.dirname(htmlPath);
 for(const match of markup.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)){
  const raw=match[1].split(/[?#]/)[0];
  if(!raw||/^(?:https?:|data:|\/\/)/i.test(raw))continue;
  const target=raw.startsWith('/')?path.join(outputDir,raw.slice(1)):path.resolve(base,raw);
  if(!target.startsWith(outputDir+path.sep)||!fs.existsSync(target)){
   throw new Error('Missing published asset on '+page+': '+raw);
  }
 }
}

console.log('Cloudflare Pages: homepage plus five public tools prepared in dist-heroes/');
console.log('Published: Home, Heroes, Recruit, Bond30, Diamond and Team (whitelisted assets).');
