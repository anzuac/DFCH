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
  'styles.css',
  'hero-preferences-data.js',
  'hero-preferences-view.js',
];

const imageDirectories = [
  'assets/heroes',
  'assets/gifts',
];

// Validate sources before deleting an existing output directory.
for (const relativePath of [...guideFiles, ...imageDirectories]) {
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

for (const relativePath of imageDirectories) {
  fs.cpSync(path.join(repoRoot, relativePath), path.join(outputDir, relativePath), {
    recursive: true,
  });
}

// The Cloudflare homepage is the hero guide, not the expedition simulator.
// Preserve heroes.html so existing /heroes or /heroes.html links continue to work.
// Use the relevant content commit, never the build clock or filesystem mtime.
const {execFileSync}=require('node:child_process');
const git=(...args)=>execFileSync('git',args,{cwd:repoRoot,encoding:'utf8',timeout:60000}).trim();
let updatedAt='';
try{
 if(git('rev-parse','--is-shallow-repository')==='true')git('fetch','--unshallow','origin');
 updatedAt=git('log','-1','--format=%cI','--',...guideFiles,...imageDirectories,'data/hero-preferences.json','data/hero-acquisition.json','data/hero-bond-gains.json','data/hero-gift-locations.json','data/hero-gift-supplements.json');
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
    '<p>這個網站只提供六星英靈喜好圖鑑。</p>',
    '<p><a href="/">返回六星英靈圖鑑</a></p></main>',
    '</body></html>',
  ].join('\n'),
  'utf8',
);

console.log('Cloudflare Pages: six-star hero guide output prepared in dist-heroes/');
console.log('Published: guide HTML, its CSS/JavaScript, and hero/gift images.');
