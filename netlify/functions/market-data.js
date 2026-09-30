function textFromHtml(html){return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ');}
async function fetchOne(ticker){
  const t=String(ticker||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,''); if(!t)return null;
  let price=null,target=null,consensus=null,analysts=null,asOf=null,source='StockAnalysis / S&P Global';
  const paths=[`https://stockanalysis.com/stocks/${t.toLowerCase()}/forecast/`,`https://stockanalysis.com/etf/${t.toLowerCase()}/`];
  for(const url of paths){
    try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 PortfolioAnalyzer/2.0','accept':'text/html'}});if(!r.ok)continue;const tx=textFromHtml(await r.text());
      const pm=tx.match(/(?:NASDAQ|NYSE|NYSEARCA|AMEX|OTC)[^\n]{0,100}?Real-Time Price[^\n]{0,40}?USD\s*([0-9,.]+)/i)||tx.match(/(?:NASDAQ|NYSE|NYSEARCA|AMEX|OTC):?\s*[A-Z0-9.\-]+[^0-9]{0,80}([0-9]{1,6}(?:\.[0-9]+)?)/i);
      if(pm)price=Number(pm[1].replace(/,/g,''));
      const tm=tx.match(/average price target of \$([0-9,.]+)/i)||tx.match(/Price Target:\s*\$([0-9,.]+)/i); if(tm)target=Number(tm[1].replace(/,/g,''));
      const cm=tx.match(/consensus rating of ["“]?([^"”]+?)["”]? and an average price target/i)||tx.match(/Analyst Consensus:\s*([A-Za-z ]+)/i); if(cm)consensus=cm[1].trim();
      const am=tx.match(/According to\s+(\d+)\s+analysts/i); if(am)analysts=Number(am[1]);
      const dm=tx.match(/Last updated:\s*([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i)||tx.match(/At close:\s*([^·]+?EDT|[^·]+?EST)/i); if(dm)asOf=dm[1].trim();
      if(price||target)break;
    }catch{}
  }
  if(!price){
    try{const u=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?range=5d&interval=1d`;const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0'}});if(r.ok){const j=await r.json();const m=j?.chart?.result?.[0]?.meta;price=Number(m?.regularMarketPrice)||null;source=target?'StockAnalysis + Yahoo Finance':'Yahoo Finance';}}catch{}
  }
  return {ticker:t,currentPrice:price,targetPrice:target,consensus,analysts,dataAsOf:asOf||new Date().toISOString(),source};
}
export default async(req)=>{const sp=new URL(req.url).searchParams;const ts=(sp.get('tickers')||sp.get('ticker')||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,10);if(!ts.length)return Response.json({error:'ticker required'},{status:400});const data=await Promise.all(ts.map(fetchOne));return Response.json(data,{headers:{'cache-control':'public,max-age=900'}});};
