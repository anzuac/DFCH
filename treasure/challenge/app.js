(()=>{
'use strict';
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat('zh-TW');
const scores=Object.freeze({N:1,R:3,SR:10,SSR:20,UR:50,A:1000,B:2500,C:100000});
const jackpotSymbol={A:'✦',B:'◆',C:'✹'};
let snapshot=null,busy=false,rankExpanded=false;
const effectQueue=[];
let effectTimer=null;
const open=$('challengeOpen'),skip=$('challengeSkip'),status=$('challengeStatus'),overlay=$('challengeJackpot');

function message(text,error=false){
  status.textContent=text;
  status.classList.toggle('is-error',error);
}
async function api(endpoint,body){
  const response=await fetch('/api/treasure/challenge/'+endpoint,{
    method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',
    headers:body===undefined?{}:{'Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  let data;
  try{data=await response.json();}
  catch(_){throw new Error('伺服器暫時沒有回應');}
  if(!response.ok)throw new Error(data?.error||'挑戰服務發生錯誤');
  return data;
}
function drawRank(rows,target){
  const dest=$(target);
  dest.replaceChildren();
  const visible=rankExpanded?rows.slice(0,3):rows.slice(0,1);
  if(!visible.length){
    const p=document.createElement('p');p.className='ranking-empty';p.textContent='尚無成績';dest.append(p);return;
  }
  visible.forEach((entry,i)=>{
    const row=document.createElement('div');row.className='ranking-row';
    const rank=document.createElement('span');rank.className='position';rank.textContent=i===0?'♛':String(i+1);
    const nick=document.createElement('span');nick.className='name';nick.textContent=entry.nickname||'玩家';nick.title=nick.textContent;
    const points=document.createElement('strong');points.className='points';points.textContent=nf.format(entry.points);
    row.append(rank,nick,points);dest.append(row);
  });
}
function itemTile(reward){
  const node=document.createElement('div');
  node.className='challenge-item type-'+reward.type;
  const icon=document.createElement('span');
  if(reward.type in jackpotSymbol){
    icon.className='challenge-symbol';icon.textContent=jackpotSymbol[reward.type];
  }else{
    const img=document.createElement('img');
    img.src='../assets/rarity-'+reward.type.toLowerCase()+'.webp';
    img.alt='';img.width=36;img.height=36;img.decoding='async';
    icon.append(img);
  }
  const tier=document.createElement('small');tier.textContent=reward.type;
  const pts=document.createElement('span');pts.className='reward-score';pts.textContent='+'+nf.format(reward.points);
  node.title='第 '+reward.number+' 格：'+reward.type+' +'+nf.format(reward.points)+' 分';
  node.setAttribute('aria-label',node.title);
  node.append(icon,tier,pts);
  return node;
}
function render(data){
  snapshot=data;
  const run=data.run;
  $('dailyRemaining').textContent=nf.format(data.remaining)+' / '+nf.format(data.dailyLimit);
  $('challengeDate').textContent=data.day+'（台灣）';
  $('totalPoints').textContent=nf.format(data.totals.totalPoints);
  $('bestPoints').textContent=nf.format(data.totals.bestSinglePoints);
  $('revealedCount').textContent=run?nf.format(run.revealedCount):'0';
  $('runPoints').textContent=run?nf.format(run.revealedPoints):'0';
  $('runState').textContent=!run?'未開始':run.completed?'已完成':'進行中';
  const grid=$('challengeGrid');
  const followBottom=grid.scrollHeight-grid.scrollTop-grid.clientHeight<40;
  grid.replaceChildren(...(run?.rewards||[]).map(itemTile));
  if(followBottom)grid.scrollTop=grid.scrollHeight;
  drawRank(data.leaderboards?.total||[],'rankTotal');
  drawRank(data.leaderboards?.best||[],'rankBest');
  if(data.hasActive){
    message('本箱正在進行中；已揭曉 '+nf.format(run.revealedCount)+' 格，可繼續點擊或長按。');
    $('challengeOpenLabel').textContent='開啟下一格';
    open.disabled=busy;
    skip.disabled=busy;
  }else if(data.remaining>0){
    message(run?.completed?'上一箱已完成並結算。要繼續，請重新點擊開始下一箱。':'點擊開始第 1 格，才會消耗今日 1 次挑戰。');
    $('challengeOpenLabel').textContent=run?.completed?'開始下一箱':'開始挑戰 · 第 1 格';
    open.disabled=busy;
    skip.disabled=true;
  }else{
    message('今日 5 次挑戰已用完；請於台灣時間 00:00 後再來。');
    $('challengeOpenLabel').textContent='今日挑戰已用完';
    open.disabled=true;
    skip.disabled=true;
  }
}
function advanceEffect(){
  if(effectTimer!==null){clearTimeout(effectTimer);effectTimer=null;}
  const reward=effectQueue.shift();
  if(!reward){
    overlay.hidden=true;overlay.className='challenge-jackpot';
    return;
  }
  overlay.className='challenge-jackpot tier-'+reward.type;
  overlay.hidden=false;
  $('jackpotName').textContent='大獎 '+reward.type;
  $('jackpotPoints').textContent='+'+nf.format(scores[reward.type])+' 分';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  effectTimer=setTimeout(advanceEffect,reduced?750:reward.type==='C'?3500:reward.type==='B'?2300:1600);
}
function enqueueEffects(rewards){
  for(const reward of rewards)if(reward.type in jackpotSymbol)effectQueue.push(reward);
  if(overlay.hidden&&effectQueue.length)advanceEffect();
}
$('jackpotSkip').addEventListener('click',advanceEffect);
$('rankToggle').addEventListener('click',()=>{
  rankExpanded=!rankExpanded;
  $('rankToggle').setAttribute('aria-expanded',String(rankExpanded));
  $('rankToggle').firstChild.textContent=rankExpanded?'收合排行榜 ':'展開前三名 ';
  drawRank(snapshot?.leaderboards?.total||[],'rankTotal');
  drawRank(snapshot?.leaderboards?.best||[],'rankBest');
});
async function reload(){
  if(busy)return;
  busy=true;open.disabled=true;skip.disabled=true;
  try{render(await api('status'));}
  catch(error){
    snapshot=null;
    message(error.message,error.message!=='請先使用 Google 帳號登入');
    $('challengeOpenLabel').textContent='登入後可挑戰';
    open.disabled=true;
    skip.disabled=true;
  }finally{busy=false;if(snapshot)render(snapshot);}
}
// Skipping reveals the rest of the EXISTING chest instantly.
// The backend owns the completed result, score, and daily quota.
async function step(fast){
  if(busy||!snapshot)return;
  if(!snapshot.hasActive&&snapshot.remaining<=0)return;
  if(fast&&!snapshot.hasActive)return;
  busy=true;open.disabled=true;skip.disabled=true;
  const previous=snapshot.run;
  const previousId=snapshot.hasActive?previous?.id:null;
  const before=snapshot.hasActive?previous.revealedCount:0;
  message(fast?'正在揭曉本箱剩餘獎勵…':'正在揭曉下一格…');
  try{
    const current=snapshot.hasActive
      ? await api('reveal',{id:previous.id,expectedCount:previous.revealedCount,fast})
      : await api('start',{requestId:crypto.randomUUID(),fast});
    const newlyShown=current.run?.id===previousId?current.run.rewards.slice(before):current.run?.rewards||[];
    render(current);
    enqueueEffects(newlyShown);
  }catch(error){
    message(error.message,true);
    try{render(await api('status'));}catch(_){/* Keep first error visible. */}
  }finally{busy=false;if(snapshot)render(snapshot);}
}
open.addEventListener('click',()=>step(false));
skip.addEventListener('click',()=>step(true));
document.addEventListener('treasure:auth-changed',()=>{reload();});
reload();
})();
