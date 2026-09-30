import { DEFAULT_PORTFOLIO, getSession, json, portfolios } from './_auth.js';
function cleanHolding(h){
  return {
    ticker:String(h.ticker||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'').slice(0,12),
    name:String(h.name||'').slice(0,120),
    allocationLakh:Math.max(0,Math.min(100000,Number(h.allocationLakh)||0)),
    currentPrice:Number.isFinite(Number(h.currentPrice)) ? Number(h.currentPrice) : null,
    targetPrice:Number.isFinite(Number(h.targetPrice)) ? Number(h.targetPrice) : null,
    dataAsOf:String(h.dataAsOf||'').slice(0,40), source:String(h.source||'').slice(0,120)
  };
}
export default async (req) => {
  const s = await getSession(req); if (!s) return json({error:'Unauthorized'},401);
  const store = portfolios();
  if (req.method === 'GET') {
    let p = await store.get(s.username,{type:'json',consistency:'strong'});
    if (!p) { p={totalCapitalLakh:100,holdings:DEFAULT_PORTFOLIO,updatedAt:new Date().toISOString()}; await store.setJSON(s.username,p); }
    return json(p);
  }
  if (req.method === 'PUT') {
    try {
      const body=await req.json();
      const holdings=Array.isArray(body.holdings)?body.holdings.slice(0,150).map(cleanHolding).filter(x=>x.ticker&&x.name):[];
      const p={totalCapitalLakh:Math.max(1,Math.min(1000000,Number(body.totalCapitalLakh)||100)),holdings,updatedAt:new Date().toISOString()};
      await store.setJSON(s.username,p); return json({ok:true,updatedAt:p.updatedAt});
    } catch { return json({error:'Could not save portfolio'},400); }
  }
  return json({error:'Method not allowed'},405);
};
