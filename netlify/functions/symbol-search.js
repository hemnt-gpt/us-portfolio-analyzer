let cache=null, cacheAt=0; const CACHE_MS=6*60*60*1000;
const cleanName=n=>n.replace(/ - (Common Stock|Class [A-Z] Common Stock|Ordinary Shares?|Common Shares?|American Depositary Shares?.*)$/i,'').replace(/\s+/g,' ').trim();
const companyLike=(n,etf)=>etf!=='Y'&&!/(warrant|rights?|units?|preferred|notes due|bond|etf|fund|income shares)/i.test(n);
async function loadUniverse(){
  if(cache&&Date.now()-cacheAt<CACHE_MS)return cache;
  const urls=[['NASDAQ','https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt'],['OTHER','https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt']]; const all=[];
  for(const [kind,url] of urls){const r=await fetch(url,{headers:{'user-agent':'PortfolioAnalyzer/2.0'}}); if(!r.ok)throw new Error('listing'); const lines=(await r.text()).trim().split(/\r?\n/);
    for(let i=1;i<lines.length;i++){const p=lines[i].split('|'); if(!p[0]||/File Creation Time/i.test(p[0]))continue;
      if(kind==='NASDAQ'){const [symbol,name,market,test,status,lot,etf]=p; if(test==='Y'||!companyLike(name,etf))continue; all.push({symbol,name:cleanName(name),exchange:'NASDAQ'});}
      else{const [sym,name,ex,cqs,etf,lot,test]=p;if(test==='Y'||!companyLike(name,etf))continue; const exch=({N:'NYSE',A:'NYSE American',P:'NYSE Arca',Z:'Cboe BZX',V:'IEX'})[ex]||ex||'US';all.push({symbol:sym,name:cleanName(name),exchange:exch});}
    }
  }
  const seen=new Set(); cache=all.filter(x=>x.symbol&&x.name&&!seen.has(x.symbol)&&seen.add(x.symbol)); cacheAt=Date.now(); return cache;
}
export default async(req)=>{try{const q=new URL(req.url).searchParams.get('q')?.trim().toLowerCase()||''; if(!q)return Response.json([]);const u=await loadUniverse();const a=[],b=[];for(const x of u){const s=x.symbol.toLowerCase(),n=x.name.toLowerCase();if(s===q||s.startsWith(q)||n.startsWith(q))a.push(x);else if(s.includes(q)||n.includes(q))b.push(x);if(a.length+b.length>80)break;}return Response.json([...a,...b].slice(0,20),{headers:{'cache-control':'public,max-age=300'}});}catch{return Response.json({error:'Search temporarily unavailable'},{status:500});}};
