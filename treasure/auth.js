/* Google Identity Services sign-in. Live only on the production Cloudflare site. */
(() => {
  'use strict';
  const panel=document.getElementById('treasureLogin');
  if (!panel || window.location.hostname !== 'dfch.pages.dev') return;
  panel.hidden=false;
  const $=id=>document.getElementById(id);
  const status=$('treasureLoginStatus');
  const signIn=$('treasureSignIn');
  const profile=$('treasureSignedIn');
  const name=$('treasurePlayerName');
  const logout=$('treasureLogout');
  function message(text) {status.textContent=text;}
  async function api(path, body) {
    const response=await fetch('/api/treasure/auth/'+path,{
      method:body===undefined?'GET':'POST',
      credentials:'same-origin',cache:'no-store',
      headers:body===undefined?{}:{'Content-Type':'application/json'},
      body:body===undefined?undefined:JSON.stringify(body)
    });
    const data=await response.json();
    if (!response.ok) throw new Error(data.error||'登入服務暫時無法使用');
    return data;
  }
  function signedIn(player) {
    signIn.hidden=true;
    profile.hidden=false;
    logout.hidden=false;
    name.textContent=player.displayName||'玩家';
    message('已登入 · 正式抽獎每日五次功能尚未啟用，目前可使用原本練習抽獎。');
  }
  function loadGoogleScript() {
    return new Promise((resolve,reject)=>{
      if (window.google?.accounts?.id) return resolve();
      const script=document.createElement('script');
      script.src='https://accounts.google.com/gsi/client';
      script.async=true;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error('無法載入 Google 登入元件'));
      document.head.append(script);
    });
  }
  async function startSignIn(clientId) {
    const {nonce}=await api('nonce');
    await loadGoogleScript();
    signIn.replaceChildren();
    window.google.accounts.id.initialize({
      client_id:clientId,nonce,auto_select:false,
      callback:async ({credential})=>{
        if (!credential) return;
        message('正在驗證 Google 帳號…');
        try {const result=await api('google',{credential});signedIn(result.player);}
        catch (error) {
          message(error.message+'，請重新登入。');
          await startSignIn(clientId).catch(e=>message(e.message));
        }
      }
    });
    window.google.accounts.id.renderButton(signIn,{
      theme:'outline',size:'large',type:'standard',text:'signin_with',shape:'pill'
    });
    signIn.hidden=false;
  }
  logout.addEventListener('click',async ()=>{
    logout.disabled=true;
    try {
      await api('logout',{});
      profile.hidden=true;
      logout.hidden=true;
      message('已登出，可以重新使用 Google 帳號登入。');
      await startSignIn(window.treasureGoogleClientId);
    } catch(error) {message(error.message);}
    finally {logout.disabled=false;}
  });
  (async()=>{
    try {
      const config=await api('config');
      if (!config.enabled || !config.clientId) {
        message('Google 登入尚未啟用；練習抽獎不受影響。');
        return;
      }
      window.treasureGoogleClientId=config.clientId;
      const existing=await api('me');
      if (existing.loggedIn && existing.player) signedIn(existing.player);
      else {
        message('登入後可以跨裝置保留玩家身分。正式積分與世界排行榜將於下一階段開放。');
        await startSignIn(config.clientId);
      }
    } catch(error){message('Google 登入尚未開放：'+error.message);}
  })();
})();
