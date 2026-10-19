/*
 * DFCH Treasure V1.5 Google login foundation.
 * Server-side signature verification, nonce-bound login and opaque cookie sessions.
 * Official draws are deliberately NOT enabled in this stage.
 */
const TREASURE_COOKIE = '__Host-dfch_treasure_session';
const TREASURE_NONCE_COOKIE = '__Host-dfch_treasure_nonce';
const TREASURE_SESSION_SECONDS = 30 * 24 * 60 * 60;
const TREASURE_NONCE_SECONDS = 10 * 60;
const TREASURE_GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
let treasureKeysCache = null;
let treasureKeysUntil = 0;

function treasureReply(data, status = 200, cookie = null) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  if (cookie) for (const item of Array.isArray(cookie) ? cookie : [cookie]) headers.append('Set-Cookie', item);
  return new Response(JSON.stringify(data), {status, headers});
}
function treasureCookie(name, value, maxAge) {
  return name + '=' + value + '; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=' + maxAge;
}
function treasureGetCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const item = header.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return item ? item.slice(name.length + 1) : '';
}
function treasureRandom() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function treasureHash(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
function treasureDecode(segment) {
  if (!/^[\w-]+$/.test(segment) || segment.length > 12000) throw new Error('invalid token');
  const raw = atob(segment.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - segment.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function treasureReadJson(segment) {
  return JSON.parse(new TextDecoder().decode(treasureDecode(segment)));
}
async function treasureSigningKey(kid, forceRefresh = false) {
  const now = Date.now();
  if (forceRefresh || !treasureKeysCache || now >= treasureKeysUntil) {
    const response = await fetch(TREASURE_GOOGLE_KEYS_URL, {signal: AbortSignal.timeout(7000)});
    if (!response.ok) throw new Error('Google keys unavailable');
    const document = await response.json();
    if (!Array.isArray(document.keys)) throw new Error('Google keys invalid');
    treasureKeysCache = document.keys;
    treasureKeysUntil = now + 30 * 60 * 1000;
  }
  return treasureKeysCache.find(k => k.kid === kid && k.kty === 'RSA' && k.use === 'sig');
}
async function treasureVerifyIdToken(credential, audience, nonce) {
  if (typeof credential !== 'string' || credential.length > 12000) throw new Error('invalid credential');
  const parts = credential.split('.');
  if (parts.length !== 3) throw new Error('invalid credential');
  const header = treasureReadJson(parts[0]);
  const claims = treasureReadJson(parts[1]);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('unsupported signature');
  let jwk = await treasureSigningKey(header.kid);
  if (!jwk) jwk = await treasureSigningKey(header.kid, true);
  if (!jwk) throw new Error('signing key not found');
  const key = await crypto.subtle.importKey('jwk', jwk, {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key,
    treasureDecode(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!valid) throw new Error('invalid signature');
  const now = Math.floor(Date.now() / 1000);
  if (!['accounts.google.com','https://accounts.google.com'].includes(claims.iss) ||
      claims.aud !== audience ||
      !Number.isInteger(claims.exp) || claims.exp <= now ||
      !Number.isInteger(claims.iat) || claims.iat > now + 60 ||
      !claims.sub || typeof claims.sub !== 'string' || claims.sub.length > 255 ||
      !nonce || claims.nonce !== nonce) throw new Error('invalid claims');
  return {sub:claims.sub, name:typeof claims.name === 'string' ? claims.name.slice(0,80) : '玩家'};
}
// Separate publicly unique game nickname from Google's non-unique profile name.
// Unicode normalization + case folding ensure e.g. Ａｎｚｕ and Anzu are the same nickname.
function treasureNormalizeNickname(value) {
  if (typeof value !== 'string' || value.length > 64) return null;
  const nickname = value.normalize('NFKC').trim();
  const size = Array.from(nickname).length;
  if (size < 2 || size > 16 || !/^[\p{L}\p{N}]+$/u.test(nickname)) return null;
  return {nickname, nicknameKey:nickname.toLowerCase().normalize('NFKC')};
}
function treasurePublicPlayer(player) {
  return {id:player.id, displayName:player.displayName, nickname:player.nickname || null};
}
async function treasureSetNickname(request, db) {
  const player=await treasureLoggedInPlayer(request,db);
  if (!player) return treasureReply({error:'請先使用 Google 帳號登入'},401);
  if (player.nickname) return treasureReply({error:'此帳號已設定暱稱'},409);
  let selection;
  try {
    if (Number(request.headers.get('Content-Length') || 0) > 2000) throw new Error('size');
    const raw=await request.text();
    if (raw.length > 2000) throw new Error('size');
    selection=treasureNormalizeNickname(JSON.parse(raw)?.nickname);
  } catch (_) { return treasureReply({error:'暱稱資料格式不正確'},400); }
  if (!selection) return treasureReply({error:'暱稱需為 2～16 個中文字、英文字或數字，不可包含空白或符號'},400);
  try {
    await db.prepare(
      'UPDATE treasure_players SET nickname=?,nickname_key=? WHERE id=? AND nickname_key IS NULL'
    ).bind(selection.nickname,selection.nicknameKey,player.id).run();
    const saved=await db.prepare(
      'SELECT nickname,nickname_key FROM treasure_players WHERE id=?'
    ).bind(player.id).first();
    if (!saved || saved.nickname_key !== selection.nicknameKey)
      return treasureReply({error:'此帳號已設定暱稱'},409);
    return treasureReply({nickname:saved.nickname, player:{
      ...treasurePublicPlayer(player),nickname:saved.nickname
    }});
  } catch (error) {
    // The UNIQUE index is authoritative even for concurrent signups.
    if (/UNIQUE constraint failed.*treasure_players\.nickname_key/i.test(String(error?.message || error)) ||
        /idx_treasure_players_nickname_key/i.test(String(error?.message || error)))
      return treasureReply({error:'此暱稱已被使用，請換一個'},409);
    return treasureReply({error:'暱稱設定暫時失敗，請稍後重試'},503);
  }
}
async function treasureLoggedInPlayer(request, db) {
  const token = treasureGetCookie(request, TREASURE_COOKIE);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const hash = await treasureHash(token);
  return db.prepare(
    'SELECT p.id, p.display_name AS displayName, p.nickname FROM treasure_sessions s ' +
    'JOIN treasure_players p ON p.id = s.player_id WHERE s.token_hash=? AND s.expires_at>?'
  ).bind(hash, Math.floor(Date.now()/1000)).first();
}
async function treasureHandleAuth(request, env) {
  const url = new URL(request.url);
  const route = url.pathname;
  const db = env.TREASURE_DB;
  const clientId = env.GOOGLE_CLIENT_ID;
  if (route === '/api/treasure/auth/config' && request.method === 'GET') {
    let ready = false;
    if (db && clientId) {
      try { await db.prepare('SELECT 1 FROM treasure_players LIMIT 1').first();
        await db.prepare('SELECT 1 FROM treasure_sessions LIMIT 1').first();
        await db.prepare('SELECT 1 FROM treasure_player_scores LIMIT 1').first();
        await db.prepare('SELECT nickname,nickname_key FROM treasure_players LIMIT 1').first(); ready = true;
      } catch (_) { ready = false; }
    }
    return treasureReply({enabled:ready, clientId:ready ? clientId : null, officialDrawsEnabled:false});
  }
  if (!db || !clientId) return treasureReply({error:'登入服務尚未設定完成'},503);
  if (route === '/api/treasure/auth/me' && request.method === 'GET') {
    try { const player = await treasureLoggedInPlayer(request,db);
      return treasureReply({loggedIn:!!player, player:player ? treasurePublicPlayer(player) : null});
    } catch (_) { return treasureReply({error:'目前無法讀取登入狀態'},503); }
  }
  if (route === '/api/treasure/auth/nonce' && request.method === 'GET') {
    const nonce = treasureRandom();
    return treasureReply({nonce},200,treasureCookie(TREASURE_NONCE_COOKIE,nonce,TREASURE_NONCE_SECONDS));
  }
  if (request.method !== 'POST' ||
      (route !== '/api/treasure/auth/google' && route !== '/api/treasure/auth/logout' &&
       route !== '/api/treasure/auth/nickname'))
    return treasureReply({error:'找不到登入功能'},404);
  if (request.headers.get('Origin') !== url.origin ||
      !request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))
    return treasureReply({error:'請求來源不正確'},403);
  if (route === '/api/treasure/auth/nickname') {
    try { return await treasureSetNickname(request, db); }
    catch (_) { return treasureReply({error:'無法設定暱稱，請稍後再試'},503); }
  }
  if (route === '/api/treasure/auth/logout') {
    try {
      const token=treasureGetCookie(request,TREASURE_COOKIE);
      if (/^[A-Za-z0-9_-]{43}$/.test(token))
        await db.prepare('DELETE FROM treasure_sessions WHERE token_hash=?').bind(await treasureHash(token)).run();
      return treasureReply({loggedIn:false},200,treasureCookie(TREASURE_COOKIE,'',0));
    } catch (_) { return treasureReply({error:'登出失敗，請稍後重試'},503); }
  }
  const nonce=treasureGetCookie(request,TREASURE_NONCE_COOKIE);
  if (!/^[A-Za-z0-9_-]{43}$/.test(nonce)) return treasureReply({error:'登入驗證已過期，請重新點擊登入'},403);
  let credential;
  try {
    if (Number(request.headers.get('Content-Length') || 0) > 16000) throw new Error('too large');
    const data=await request.json();
    credential=data?.credential;
    if (typeof credential !== 'string' || credential.length > 12000) throw new Error('invalid');
  } catch (_) { return treasureReply({error:'登入資料不正確'},400); }
  let identity;
  try { identity=await treasureVerifyIdToken(credential,clientId,nonce); }
  catch (_) { return treasureReply({error:'Google 登入驗證失敗，請重試'},401); }
  try {
    const now=Math.floor(Date.now()/1000);
    await db.prepare(
      'INSERT INTO treasure_players (google_sub,display_name,created_at) VALUES (?,?,?) ' +
      'ON CONFLICT(google_sub) DO NOTHING'
    ).bind(identity.sub,identity.name,now).run();
    const player=await db.prepare('SELECT id,display_name AS displayName,nickname FROM treasure_players WHERE google_sub=?')
      .bind(identity.sub).first();
    if (!player) throw new Error('user insert error');
    await db.prepare('INSERT OR IGNORE INTO treasure_player_scores (player_id) VALUES (?)').bind(player.id).run();
    const token=treasureRandom();
    await db.prepare(
      'INSERT INTO treasure_sessions (token_hash,player_id,created_at,expires_at) VALUES (?,?,?,?)'
    ).bind(await treasureHash(token),player.id,now,now+TREASURE_SESSION_SECONDS).run();
    return treasureReply({loggedIn:true, player:treasurePublicPlayer(player)},
      200,[treasureCookie(TREASURE_COOKIE,token,TREASURE_SESSION_SECONDS),
           treasureCookie(TREASURE_NONCE_COOKIE,'',0)]);
  } catch (_) { return treasureReply({error:'儲存玩家登入資料失敗，請稍後重試'},503); }
}
export async function handleTreasureRequest(request, env) {
  if (new URL(request.url).pathname.startsWith('/api/treasure/auth/'))
    return treasureHandleAuth(request, env);
  // Keep unfinished official scoring routes inaccessible until server-side draws exist.
  return treasureReply({error:'正式抽獎及排行榜尚未啟用'},501);
}
