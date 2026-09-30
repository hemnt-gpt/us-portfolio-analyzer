function textFromHtml(html){
  return html.replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&#39;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/\s+/g,' ');
}

async function yahooPrice(t){
  try{
    const u=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?range=5d&interval=1d&includePrePost=false&events=div%2Csplits`;
    const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0 PortfolioAnalyzer/2.1'}});
    if(!r.ok)return null;
    const j=await r.json();
    const result=j?.chart?.result?.[0];
    const meta=result?.meta||{};
    let p=Number(meta.regularMarketPrice);
    if(!Number.isFinite(p)||p<=0){
      const closes=result?.indicators?.quote?.[0]?.close||[];
      for(let i=closes.length-1;i>=0;i--){
        const v=Number(closes[i]);
        if(Number.isFinite(v)&&v>0){p=v;break;}
      }
    }
    return Number.isFinite(p)&&p>0?p:null;
  }catch{return null;}
}

async function stooqPrice(t){
  try{
    const sym=t.toLowerCase().replace('.','-')+'.us';
    const r=await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`,{headers:{'user-agent':'Mozilla/5.0 PortfolioAnalyzer/2.1'}});
    if(!r.ok)return null;
    const lines=(await r.text()).trim().split(/\r?\n/);
    if(lines.length<2)return null;
    const h=lines[0].split(','),v=lines[1].split(',');
    const idx=h.findIndex(x=>x.toLowerCase()==='close');
    const p=Number(v[idx]);
    return Number.isFinite(p)&&p>0?p:null;
  }catch{return null;}
}

async function fetchAnalystData(t){
  let target=null,consensus=null,analysts=null,asOf=null;
  const paths=[
    `https://stockanalysis.com/stocks/${t.toLowerCase()}/forecast/`,
    `https://stockanalysis.com/etf/${t.toLowerCase()}/`
  ];
  for(const url of paths){
    try{
      const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 PortfolioAnalyzer/2.1','accept':'text/html'}});
      if(!r.ok)continue;
      const tx=textFromHtml(await r.text());
      const tm=tx.match(/average price target of \$([0-9,.]+)/i)||tx.match(/Price Target:\s*\$([0-9,.]+)/i);
      if(tm){const v=Number(tm[1].replace(/,/g,'')); if(Number.isFinite(v)&&v>0)target=v;}
      const cm=tx.match(/consensus rating of ["“]?([^"”]+?)["”]? and an average price target/i)||tx.match(/Analyst Consensus:\s*([A-Za-z ]+)/i);
      if(cm)consensus=cm[1].trim();
      const am=tx.match(/According to\s+(\d+)\s+analysts/i);
      if(am)analysts=Number(am[1]);
      const dm=tx.match(/Last updated:\s*([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i);
      if(dm)asOf=dm[1].trim();
      if(target||consensus||analysts)break;
    }catch{}
  }
  return {target,consensus,analysts,asOf};
}

async function fetchOne(ticker){
  const t=String(ticker||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'');
  if(!t)return null;

  // Current price must come from a market-price endpoint, never from page-text parsing.
  let price=await yahooPrice(t);
  let priceSource='Yahoo Finance';
  if(!price){
    price=await stooqPrice(t);
    priceSource=price?'Stooq':'Unavailable';
  }

  const a=await fetchAnalystData(t);
  return {
    ticker:t,
    currentPrice:price,
    targetPrice:a.target,
    consensus:a.consensus,
    analysts:a.analysts,
    dataAsOf:a.asOf||new Date().toISOString(),
    source:a.target?`${priceSource} + StockAnalysis / S&P Global`:priceSource
  };
}

export default async(req)=>{
  const sp=new URL(req.url).searchParams;
  const ts=(sp.get('tickers')||sp.get('ticker')||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,10);
  if(!ts.length)return Response.json({error:'ticker required'},{status:400});
  const data=await Promise.all(ts.map(fetchOne));
  return Response.json(data,{headers:{'cache-control':'public,max-age=300'}});
};
