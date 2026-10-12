const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/api/guide-views')return env.ASSETS.fetch(request);
  if(request.method!=='POST')return reply({views:null},405);
  // Preview deployments never increment the production counter.
  if(url.hostname!=='dfch.pages.dev')return reply({views:null},200);
  if(request.headers.get('Origin')!==url.origin)return reply({views:null},403);
  if(!env.GUIDE_STATS)return reply({views:null},503);
  try{
   const results=await env.GUIDE_STATS.batch([
    env.GUIDE_STATS.prepare('CREATE TABLE IF NOT EXISTS guide_stats (id INTEGER PRIMARY KEY CHECK (id = 1), views INTEGER NOT NULL DEFAULT 0)'),
    env.GUIDE_STATS.prepare('INSERT INTO guide_stats (id, views) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET views = views + 1 RETURNING views')
   ]);
   const views=results[1].results[0].views;
   return reply({views});
  }catch{return reply({views:null},503);}
 }
};
