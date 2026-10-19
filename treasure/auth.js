/* Google Identity Services sign-in; the existing server token and D1 flow are unchanged. */
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
  const accountToggle=$('treasureAccountToggle');
  const accountMenu=$('treasureAccountMenu');
  const logout=$('treasureLogout');
  const nicknameDialog=$('treasureNicknameDialog');
  const nicknameForm=$('treasureNicknameForm');
  const nicknameInput=$('treasureNicknameInput');
  const nicknameSave=$('treasureNicknameSave');
  const nicknameExit=$('treasureNicknameLogout');
  const nicknameStatus=$('treasureNicknameStatus');
  let activePlayer=null;
  let clientId=null;

  function message(text,visible=false) {
    status.textContent=text;
    status.hidden=!visible;
  }
  function closeAccountMenu() {
    accountMenu.hidden=true;
    accountToggle.setAttribute('aria-expanded','false');
  }
  function openNicknameDialog() {
    closeAccountMenu();
    if (!nicknameDialog.open) nicknameDialog.showModal();
    nicknameInput.focus();
  }
  function signedIn(player) {
    activePlayer=player;
    signIn.hidden=true;
    profile.hidden=false;
    name.textContent=player.nickname || '設定暱稱';
    closeAccountMenu();
    message('');
    document.dispatchEvent(new CustomEvent('treasure:auth-changed',{detail:{loggedIn:true,player}}));
    if (!player.nickname) openNicknameDialog();
    else if (nicknameDialog.open) {
      nicknameDialog.close();
      accountToggle.focus();
    }
  }
  async function api(path,body) {
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
  async function startSignIn() {
    closeAccountMenu();
    profile.hidden=true;
    const {nonce}=await api('nonce');
    await loadGoogleScript();
    signIn.replaceChildren();
    window.google.accounts.id.initialize({
      client_id:clientId,nonce,auto_select:false,
      callback:async ({credential})=>{
        if (!credential) return;
        message('正在驗證 Google 帳號…',true);
        try {
          const result=await api('google',{credential});
          signedIn(result.player);
        } catch(error) {
          message(error.message+'，請重新登入。',true);
          await startSignIn().catch(e=>message(e.message,true));
        }
      }
    });
    window.google.accounts.id.renderButton(signIn,{
      theme:'outline',size:'large',type:'standard',text:'signin_with',shape:'pill',width:185
    });
    signIn.hidden=false;
  }
  accountToggle.addEventListener('click',()=>{
    if (!activePlayer?.nickname) {openNicknameDialog();return;}
    accountMenu.hidden=!accountMenu.hidden;
    accountToggle.setAttribute('aria-expanded',String(!accountMenu.hidden));
  });
  document.addEventListener('click',event=>{
    if (!panel.contains(event.target)) closeAccountMenu();
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape' && !accountMenu.hidden) {
      closeAccountMenu();
      accountToggle.focus();
    }
  });
  // First login requires a unique nickname. Logout remains available as the escape path.
  nicknameDialog.addEventListener('cancel',event=>event.preventDefault());
  nicknameForm.addEventListener('submit',async event=>{
    event.preventDefault();
    nicknameSave.disabled=true;
    nicknameStatus.textContent='正在檢查並儲存暱稱…';
    try {
      const result=await api('nickname',{nickname:nicknameInput.value});
      if (result.player) {
        signedIn(result.player);
        nicknameStatus.textContent='';
        nicknameInput.value='';
      }
    } catch(error) {
      nicknameStatus.textContent=error.message;
    } finally {nicknameSave.disabled=false;}
  });
  async function signOut() {
    logout.disabled=true;
    nicknameExit.disabled=true;
    try {
      await api('logout',{});
      activePlayer=null;
      document.dispatchEvent(new CustomEvent('treasure:auth-changed',{detail:{loggedIn:false,player:null}}));
      profile.hidden=true;
      nicknameInput.value='';
      nicknameStatus.textContent='';
      if (nicknameDialog.open) nicknameDialog.close();
      closeAccountMenu();
      message('');
      await startSignIn();
    } catch(error) {
      message(error.message,true);
      if (nicknameDialog.open) nicknameStatus.textContent=error.message;
    } finally {
      logout.disabled=false;
      nicknameExit.disabled=false;
    }
  }
  logout.addEventListener('click',signOut);
  nicknameExit.addEventListener('click',signOut);
  (async()=>{
    try {
      const config=await api('config');
      if (!config.enabled || !config.clientId) {
        message('Google 登入尚未啟用；練習抽獎不受影響。',true);
        return;
      }
      clientId=config.clientId;
      const existing=await api('me');
      if (existing.loggedIn && existing.player) signedIn(existing.player);
      else await startSignIn();
    } catch(error) {
      message('Google 登入尚未開放：'+error.message,true);
    }
  })();
})();
