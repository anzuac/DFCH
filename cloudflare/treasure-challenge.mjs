/*
 * DFCH Treasure challenge V1: authoritative RNG, atomic quota admission,
 * resumable reveals, and idempotent scoring. The client never rolls draws.
 */
const CHALLENGE_POINTS=Object.freeze({N:1,R:3,SR:10,SSR:20,UR:50,A:1000,B:2500,C:100000});
const CHALLENGE_WEIGHTS=Object.freeze({N:50,R:30,SR:15,SSR:4,UR:1});
const CHALLENGE_LIMIT=5;
const CHALLENGE_MAX_REWARDS=5000;
const CHALLENGE_POOL=0.9998493;
const CHALLENGE_REVEAL_LIMIT=5000;
let challengeSchemaReady=false;

function challengeTaiwanDay(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=type=>parts.find(part=>part.type===type)?.value;
  return get('year')+'-'+get('month')+'-'+get('day');
}
function challengeScore(rewards){
  let score=0;
  for(const type of rewards){
    if(!Object.hasOwn(CHALLENGE_POINTS,type))throw new Error('Invalid reward');
    score+=CHALLENGE_POINTS[type];
    if(!Number.isSafeInteger(score))throw new Error('Score exceeded safe integer');
  }
  return score;
}
function challengeGenerate(random){
  const result=[];
  for(let i=0;i<CHALLENGE_MAX_REWARDS;i++){
    const roll=random();
    if(!(roll>=0&&roll<1))throw new Error('Invalid random roll');
    let tier;
    if(roll<0.0001)tier='A';
    else if(roll<0.00015)tier='B';
    else if(roll<0.0001507)tier='C';
    else{
      let remaining=(roll-0.0001507)/CHALLENGE_POOL*100;
      tier='UR';
      for(const type of ['N','R','SR','SSR','UR']){
        remaining-=CHALLENGE_WEIGHTS[type];
        if(remaining<0){tier=type;break;}
      }
    }
    result.push(tier);
    if(result.length>=4&&random()>=0.95)break;
  }
  return result;
}
function challengeSecureRandom(){
  let buffer=new Uint32Array(128);
  let index=buffer.length;
  return ()=>{
    if(index>=buffer.length){crypto.getRandomValues(buffer);index=0;}
    return buffer[index++]/4294967296;
  };
}
async function challengeInit(db){
  if(challengeSchemaReady)return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS treasure_challenge_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES treasure_players(id) ON DELETE CASCADE,
      day_key TEXT NOT NULL, request_id TEXT NOT NULL UNIQUE,
      rewards_json TEXT NOT NULL, reward_count INTEGER NOT NULL CHECK(reward_count>=4),
      total_points INTEGER NOT NULL CHECK(total_points>=0),
      revealed_count INTEGER NOT NULL DEFAULT 0 CHECK(revealed_count>=0 AND revealed_count<=reward_count),
      started_at INTEGER NOT NULL, completed_at INTEGER
    )`),
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_treasure_challenge_active ON treasure_challenge_runs(player_id) WHERE completed_at IS NULL'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_treasure_challenge_day ON treasure_challenge_runs(player_id,day_key)')
  ]);
  challengeSchemaReady=true;
}
async function challengeReconcile(db,playerId){
  // Both actions commit together; repeated calls cannot credit a draw twice.
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO treasure_official_draws
      (player_id,draw_date,request_id,score,reward_count,reward_summary,completed_at)
      SELECT player_id,day_key,request_id,total_points,reward_count,rewards_json,completed_at
      FROM treasure_challenge_runs WHERE player_id=? AND completed_at IS NOT NULL`).bind(playerId),
    db.prepare('INSERT OR IGNORE INTO treasure_player_scores(player_id) VALUES (?)').bind(playerId),
    db.prepare(`UPDATE treasure_player_scores SET
      total_points=(SELECT COALESCE(SUM(score),0) FROM treasure_official_draws WHERE player_id=?),
      best_single_points=(SELECT COALESCE(MAX(score),0) FROM treasure_official_draws WHERE player_id=?),
      official_draw_count=(SELECT COUNT(*) FROM treasure_official_draws WHERE player_id=?)
      WHERE player_id=?`).bind(playerId,playerId,playerId,playerId)
  ]);
}
function challengeView(row){
  if(!row)return null;
  const rewards=JSON.parse(row.rewards_json);
  if(!Array.isArray(rewards)||rewards.length!==row.reward_count)throw new Error('Saved challenge is invalid');
  const count=row.revealed_count;
  if(!Number.isSafeInteger(count)||count<0||count>rewards.length)throw new Error('Saved progress is invalid');
  const shown=rewards.slice(0,count).map((type,i)=>({type,number:i+1,points:CHALLENGE_POINTS[type]}));
  const completed=row.completed_at!==null;
  return {id:row.id,day:row.day_key,startedAt:row.started_at,
    revealedCount:count,rewardCount:completed?row.reward_count:null,
    revealedPoints:challengeScore(rewards.slice(0,count)),
    score:completed?row.total_points:null,completed,rewards:shown};
}
async function challengePlayerSnapshot(db,playerId,dayKey){
  await challengeReconcile(db,playerId);
  const [active,last,quota,score,totals,best]=await db.batch([
    db.prepare('SELECT * FROM treasure_challenge_runs WHERE player_id=? AND completed_at IS NULL LIMIT 1').bind(playerId),
    db.prepare('SELECT * FROM treasure_challenge_runs WHERE player_id=? ORDER BY id DESC LIMIT 1').bind(playerId),
    db.prepare('SELECT COUNT(*) AS used FROM treasure_challenge_runs WHERE player_id=? AND day_key=?').bind(playerId,dayKey),
    db.prepare('SELECT total_points AS totalPoints,best_single_points AS bestSinglePoints,official_draw_count AS drawCount FROM treasure_player_scores WHERE player_id=?').bind(playerId),
    db.prepare(`SELECT p.nickname, s.total_points AS points FROM treasure_player_scores s
      JOIN treasure_players p ON p.id=s.player_id
      WHERE s.official_draw_count>0 AND p.nickname IS NOT NULL
      ORDER BY s.total_points DESC,s.player_id ASC LIMIT 3`),
    db.prepare(`SELECT p.nickname, s.best_single_points AS points FROM treasure_player_scores s
      JOIN treasure_players p ON p.id=s.player_id
      WHERE s.official_draw_count>0 AND p.nickname IS NOT NULL
      ORDER BY s.best_single_points DESC,s.player_id ASC LIMIT 3`)
  ]);
  const current=active.results[0]||last.results[0]||null;
  const used=quota.results[0]?.used||0;
  return {day:dayKey,dailyLimit:CHALLENGE_LIMIT,used,remaining:Math.max(0,CHALLENGE_LIMIT-used),
    hasActive:!!active.results[0],run:challengeView(current),
    totals:score.results[0]||{totalPoints:0,bestSinglePoints:0,drawCount:0},
    leaderboards:{total:totals.results,best:best.results}};
}
async function challengeBody(request){
  if(Number(request.headers.get('Content-Length')||0)>1000)throw new Error('invalid');
  const raw=await request.text();
  if(raw.length>1000)throw new Error('invalid');
  const data=JSON.parse(raw);
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('invalid');
  return data;
}
export async function handleTreasureChallengeRequest(request,env,{treasureReply,treasureLoggedInPlayer}){
  const url=new URL(request.url),path=url.pathname,db=env.TREASURE_DB;
  if(!db)return treasureReply({error:'挑戰模式資料庫尚未設定'},503);
  if(!['/api/treasure/challenge/status','/api/treasure/challenge/start','/api/treasure/challenge/reveal'].includes(path))
    return treasureReply({error:'找不到挑戰功能'},404);
  if(path.endsWith('/status')&&request.method!=='GET')return treasureReply({error:'請求方法不支援'},405);
  if(!path.endsWith('/status')&&request.method!=='POST')return treasureReply({error:'請求方法不支援'},405);
  // No scoring from Cloudflare previews / GitHub Pages / cross-origin forms.
  if(request.method==='POST'&&(url.hostname!=='dfch.pages.dev'||request.headers.get('Origin')!==url.origin||
      !request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')))
    return treasureReply({error:'僅正式網站允許發起挑戰'},403);
  let player;
  try{player=await treasureLoggedInPlayer(request,db);}
  catch(_){return treasureReply({error:'無法讀取登入狀態'},503);}
  if(!player)return treasureReply({error:'請先使用 Google 帳號登入'},401);
  if(!player.nickname)return treasureReply({error:'請先設定遊戲暱稱'},403);
  const today=challengeTaiwanDay();
  try{
    await challengeInit(db);
    if(path.endsWith('/status'))return treasureReply(await challengePlayerSnapshot(db,player.id,today));
    let data;
    try{data=await challengeBody(request);}catch(_){return treasureReply({error:'挑戰參數格式錯誤'},400);}
    if(path.endsWith('/start')){
      if(typeof data.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(data.requestId)||
         typeof data.fast!=='boolean')return treasureReply({error:'開始挑戰參數錯誤'},400);
      const old=await db.prepare('SELECT id FROM treasure_challenge_runs WHERE player_id=? AND completed_at IS NULL LIMIT 1').bind(player.id).first();
      if(old)return treasureReply(await challengePlayerSnapshot(db,player.id,today));
      const rewards=challengeGenerate(challengeSecureRandom()),now=Math.floor(Date.now()/1000);
      const completed=data.fast===true,score=challengeScore(rewards);
      const admitted=await db.prepare(`INSERT OR IGNORE INTO treasure_challenge_runs
        (player_id,day_key,request_id,rewards_json,reward_count,total_points,revealed_count,started_at,completed_at)
        SELECT ?,?,?,?,?,?,?,?,?
        WHERE (SELECT COUNT(*) FROM treasure_challenge_runs WHERE player_id=? AND day_key=?)<?
        AND NOT EXISTS (SELECT 1 FROM treasure_challenge_runs WHERE player_id=? AND completed_at IS NULL)
        RETURNING id`).bind(player.id,today,data.requestId,JSON.stringify(rewards),rewards.length,score,
          completed?rewards.length:1,now,completed?now:null,player.id,today,CHALLENGE_LIMIT,player.id).first();
      const snapshot=await challengePlayerSnapshot(db,player.id,today);
      if(admitted||snapshot.hasActive||snapshot.run?.completed&&snapshot.run?.id===admitted?.id)return treasureReply(snapshot);
      return treasureReply({...snapshot,error:'今日挑戰次數已用完，或有其他進行中的挑戰'},409);
    }
    if(!Number.isSafeInteger(data.id)||data.id<1||!Number.isSafeInteger(data.expectedCount)||
       data.expectedCount<1||data.expectedCount>CHALLENGE_REVEAL_LIMIT||
       typeof data.fast!=='boolean')return treasureReply({error:'揭曉參數錯誤'},400);
    const now=Math.floor(Date.now()/1000);
    await db.prepare(`UPDATE treasure_challenge_runs SET
      revealed_count=CASE WHEN ? THEN reward_count ELSE MIN(reward_count,revealed_count+1) END,
      completed_at=CASE WHEN ? OR revealed_count+1>=reward_count THEN ? ELSE NULL END
      WHERE player_id=? AND id=? AND revealed_count=? AND completed_at IS NULL`
    ).bind(data.fast?1:0,data.fast?1:0,now,player.id,data.id,data.expectedCount).run();
    return treasureReply(await challengePlayerSnapshot(db,player.id,today));
  }catch(error){
    // Do not expose SQL details, crypto state or sealed unrevealed rewards.
    return treasureReply({error:'挑戰服務暫時無法處理，請重新整理以恢復進度'},503);
  }
}
