/* Home labels and view counter; update dates are generated at build time from relevant content commits. */
(() => {
  'use strict';
  const dict={
    zh_tw:{title:'DFCH 英靈工具站',intro:'查詢英靈喜好、模擬招募與羈絆，探索鑽石獎勵並規劃隊伍。',
      featured:'主要工具',other:'其他工具',heroes:'六星英靈喜好圖鑑',heroesDesc:'查詢喜愛與最愛物品、英靈資料及取得方式。',
      recruit:'英靈抽取模擬器',recruitDesc:'九個招募池、能力組合、指定抽選與鑽石花費。',
      bond30:'羈絆 30 等抽選',bondDesc:'模擬英靈能力變化。',diamond:'鑽石抽取模擬器',diamondDesc:'鑽石與獎勵輪盤抽選。',
      team:'英靈編隊',teamDesc:'配置英靈與隊伍能力。',updates:'最近更新',lastUpdated:'網站最後更新',
      views:'累積瀏覽次數',disclaimer:'非官方玩家工具站，模擬結果僅供參考。'},
    ja:{title:'DFCH 英霊ツール',intro:'英霊の好み、召喚と絆の抽選、ダイヤ報酬、編成ツール。',
      featured:'主なツール',other:'その他のツール',heroes:'六星英霊の好み',heroesDesc:'好きな贈り物や入手方法を確認。',
      recruit:'英霊召喚シミュレーター',recruitDesc:'召喚、能力の組み合わせ、目標抽選。',
      bond30:'絆 Lv.30 抽選',bondDesc:'能力変化を試す。',diamond:'ダイヤ抽選',diamondDesc:'ダイヤと報酬ルーレット。',
      team:'英霊編成',teamDesc:'パーティ編成と能力確認。',updates:'最近の更新',lastUpdated:'最終更新',
      views:'累計閲覧',disclaimer:'非公式ファンツールです。シミュレーション結果は参考用です。'},
    en:{title:'DFCH Hero Tools',intro:'Explore hero gifts, simulate recruitment and bonds, draw rewards, and plan teams.',
      featured:'Featured tools',other:'More tools',heroes:'Six-star hero gifts',heroesDesc:'Look up favorite gifts and hero details.',
      recruit:'Hero recruitment simulator',recruitDesc:'Recruitment pools, abilities and targeted draws.',
      bond30:'Bond Lv.30 draw',bondDesc:'Simulate ability changes.',diamond:'Diamond simulator',diamondDesc:'Diamond and reward roulette draws.',
      team:'Hero lineup',teamDesc:'Configure your team and abilities.',updates:'Recently updated',lastUpdated:'Site updated',
      views:'Total visits',disclaimer:'Unofficial fan tools. Simulated outcomes are for reference only.'},
    ko:{title:'DFCH 영령 도구',intro:'영령 선물, 모집과 인연, 다이아 보상 및 팀 편성을 살펴보세요.',
      featured:'주요 도구',other:'기타 도구',heroes:'6성 영령 선물',heroesDesc:'영령의 선호 선물과 정보를 확인하세요.',
      recruit:'영령 모집 시뮬레이터',recruitDesc:'모집 풀, 능력 조합과 지정 추첨.',
      bond30:'인연 Lv.30 추첨',bondDesc:'능력 변화 시뮬레이션.',diamond:'다이아 추첨',diamondDesc:'다이아 및 보상 룰렛.',
      team:'영령 편성',teamDesc:'파티와 능력 설정.',updates:'최근 업데이트',lastUpdated:'사이트 업데이트',
      views:'누적 방문',disclaimer:'비공식 팬 도구이며 시뮬레이션 결과는 참고용입니다.'}
  };
  const keys=['heroes','recruit','bond30','diamond','team'];
  function language(){
    try{const k=localStorage.getItem('dfch-hero-language');return dict[k]?k:'zh_tw';}
    catch{return 'zh_tw';}
  }
  function translate(k){
    const t=dict[k]||dict.zh_tw;
    for(const node of document.querySelectorAll('[data-dfch-home]'))node.textContent=t[node.dataset.dfchHome]||node.textContent;
    for(const row of document.querySelectorAll('.dfch-update-row')){
      const title=row.querySelector('strong');
      if(title)title.textContent=t[row.dataset.tool]||title.textContent;
    }
  }
  function views(count){
    const node=document.getElementById('dfchHomeViews');
    if(node&&Number.isSafeInteger(count)&&count>=0)node.textContent=count.toLocaleString();
  }
  try{const old=Number(sessionStorage.getItem('dfch-last-view-count-v1'));if(sessionStorage.getItem('dfch-last-view-count-v1')!==null)views(old);}catch{}
  window.addEventListener('dfch:views',event=>views(event.detail?.views));
  window.addEventListener('dfch:language-change',event=>translate(event.detail?.language));
  window.addEventListener('storage',e=>{if(e.key==='dfch-hero-language')translate(language());});
  translate(language());
})();