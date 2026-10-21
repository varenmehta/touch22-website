// Drives the Order Desk demo inside the branded stage and records it with the CDP screencast.
// Usage: node run.js [dry]   (dry = no recording, screenshots at checkpoints)
const fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const DRY=process.argv[2]==='dry';
const OUT=path.join(__dirname,'frames');
const SHOTS=path.join(__dirname,'shots');

// Deterministic Math.random, and hold the demo's "factory reply" timers until we release them,
// so each reply lands while the camera is looking at it.
const INIT=`(()=>{let a=987654;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 if(!location.pathname.includes('/orders/'))return;
 const st=window.setTimeout.bind(window);window.__held=[];
 window.setTimeout=function(fn,ms,...r){if(ms>=1100&&ms!==4000&&typeof fn==='function'){window.__held.push({fn,ms});return -1;}
   if(ms===4000)ms=6500; return st(fn,ms,...r);};
 window.__release=function(n){const h=window.__held.splice(0,n==null?window.__held.length:n);h.forEach(x=>{try{x.fn();}catch(e){console.error(e);}});return h.length;};
})();`;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let page,frame,shotN=0;

async function shot(name){if(!DRY)return;await page.screenshot({path:path.join(SHOTS,String(++shotN).padStart(2,'0')+'-'+name+'.png')});}
const S=(fn,...a)=>page.evaluate(([fn,a])=>window.stage[fn](...a),[fn,a]);
async function box(sel,which='first'){
  return frame.evaluate(([sel,which])=>{const els=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent||e.getClientRects().length);
    const e=which==='last'?els[els.length-1]:els[0];if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};},[sel,which]);
}
async function ensureVisible(sel,which='first'){
  const b=await box(sel,which);if(!b)throw new Error('missing '+sel);
  if(b.y<90||b.y+b.h>880){
    await frame.evaluate(([sel,which])=>{const els=[...document.querySelectorAll(sel)];const e=which==='last'?els[els.length-1]:els[0];
      const r=e.getBoundingClientRect();window.scrollTo({top:window.scrollY+r.top-360,behavior:'smooth'});},[sel,which]);
    await sleep(1100);
  }
  return box(sel,which);
}
async function move(sel,{ms=1100,which='first',dx=0.5,dy=0.5}={}){
  const b=await ensureVisible(sel,which);
  const x=b.x+b.w*dx,y=b.y+b.h*dy;await S('cursor',x,y,ms);await sleep(ms+120);return {x,y,b};
}
async function click(sel,opts={}){
  const {x,y}=await move(sel,opts);
  await sleep(opts.pause??260);
  await S('click',x,y);
  await sleep(140);
  await frame.evaluate(([sel,which])=>{const els=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent||e.getClientRects().length);const e=which==='last'?els[els.length-1]:els[0];e.click();},[sel,opts.which||'first']);
  await sleep(opts.after??700);
}
async function type(sel,text,delay=58){
  await click(sel,{after:300});
  await frame.locator(sel).pressSequentially(text,{delay});
  await sleep(700);
}
async function spot(sel,label,opts={}){
  if(!sel)return S('spot',null);
  const b=await box(sel,opts.which||'first');if(!b)throw new Error('spot missing '+sel);
  await S('spot',b,label||'',opts);
  if(opts.nudge!==false){let x=b.x+b.w+36;if(x>1300)x=b.x-40;if(x<20)x=b.x+b.w/2;await S('cursor',x,b.y+b.h*0.6,800);}
}
const release=n=>frame.evaluate(n=>window.__release(n),n);
const go=async tab=>{await click(`#tabs a[href="#${tab}"]`,{after:900});};
const step=(i,t,b)=>S('step',i,t,b);
const cam=(s,x,y,ms)=>S('cam',s,x,y,ms);
async function camOn(sel,scale,which='first',ms=1600){const b=await box(sel,which);await cam(scale,b.x+b.w/2,b.y+b.h/2+40,ms);await sleep(ms);}

async function startRec(){
  if(DRY)return null;
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT);
  const cdp=await page.context().newCDPSession(page);
  const list=[];let n=0;
  cdp.on('Page.screencastFrame',async f=>{
    const i=n++;const file=path.join(OUT,String(i).padStart(6,'0')+'.jpg');
    list.push({file,t:f.metadata.timestamp});
    fs.writeFile(file,Buffer.from(f.data,'base64'),()=>{});
    try{await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId});}catch(e){}
  });
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:94,maxWidth:1920,maxHeight:1080,everyNthFrame:1});
  return {cdp,list};
}

(async()=>{
  fs.mkdirSync(SHOTS,{recursive:true});
  const browser=await chromium.launch({args:['--font-render-hinting=none','--force-color-profile=srgb','--disable-gpu-vsync']});
  const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await ctx.addInitScript(INIT);
  page=await ctx.newPage();
  page.on('pageerror',e=>console.log('PAGEERR',e.message));
  page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
  await page.goto('http://localhost:8090/');
  await page.evaluate(()=>localStorage.clear());
  await page.evaluate(()=>{document.getElementById('app').src='/orders/index.html#overview';});
  await sleep(1500);
  await page.evaluate(()=>{const k='t22-order-desk-v1';const s=JSON.parse(localStorage.getItem(k));s.seenHow=true;s.set.autoRoute=false;localStorage.setItem(k,JSON.stringify(s));});
  await page.evaluate(()=>{document.getElementById('app').src='/orders/index.html?v=1#overview';});
  await sleep(1800);
  frame=page.frames().find(f=>f.url().includes('/orders/'));
  await frame.evaluate(()=>document.fonts.ready);
  await S('cursor',1000,560,10);
  await step(0,'Your morning, in one list','Everything the team has to do today sits in one list, with <b>one button</b> for each task.');
  await sleep(800);

  const rec=await startRec();
  const t0=Date.now();
  const mark=l=>console.log(((Date.now()-t0)/1000).toFixed(1)+'s',l);

  /* ---------- intro ---------- */
  await sleep(600);
  await S('cardIn','introT');
  await sleep(6500);
  await shot('intro');
  await S('card','why',true);
  await sleep(500);
  await S('cardIn','whyT');
  await S('card','intro',false);
  await sleep(10500);
  await shot('why');
  await S('card','why',false);
  await sleep(1600);
  mark('stage');

  /* ---------- 1 overview ---------- */
  await sleep(2500);
  await move('.stat.hl',{ms:1400});
  await spot('.stats','<b>At a glance</b> · today, in progress, late, on-time rate',{pad:10});
  await sleep(4200);
  await spot('.strip','Every order sits in one of <b>six stages</b>',{pad:8});
  await move('.strip button:nth-child(4)',{ms:1200});
  await sleep(3800);
  await spot('#todo','<b>To do</b> · one button per task',{pad:6});
  await move('#todo .r-item:first-child .btn',{ms:1300});
  await sleep(4000);
  await spot(null);
  await shot('overview');
  await sleep(600);

  /* ---------- 2 retailer orders ---------- */
  mark('s2');
  await step(1,'A retailer orders on WhatsApp','The retailer chats with the Touch22 bot in their own words. The bot asks only for what is missing, then shows a summary to confirm.');
  await sleep(2200);
  await go('chats');
  await click('[data-chat="png"]',{after:1000});
  await camOn('.c-main',1.28);
  await sleep(1200);
  await type('#botIn','Bhai ek 18KT bracelet chahiye 7.5 inch, 16 gram, green stone wala. Naya design hai',62);
  await frame.locator('#botIn').press('Enter');
  await sleep(2600);
  await spot('.msgs .m .sum','Bot reads <b>product, carat, weight, size, design</b>',{which:'last',pad:6});
  await sleep(5000);
  await spot(null);
  await click('button[data-a="confirm"]:not([disabled])',{which:'last',after:1500});
  await spot('.msgs .m:not(.out)','Order number given <b>automatically</b>',{which:'last',pad:4});
  await sleep(5200);
  await spot(null);
  await shot('placed');

  /* ---------- 3 Hindi ---------- */
  mark('s3');
  await cam(1,0,0,1300);await sleep(1300);
  await step(2,'English, Hindi or Hinglish','Every retailer can write the way they normally do. The bot answers in the same language, in Devanagari too.');
  await sleep(1800);
  await click('[data-chat="mayura"]',{after:1000});
  await camOn('.c-main',1.28);
  await type('#botIn','मुझे 22 कैरेट का मंगलसूत्र चाहिए, 18 इंच, लगभग 10 ग्राम',75);
  await frame.locator('#botIn').press('Enter');
  await sleep(3200);
  await spot('.msgs .m:not(.out)','Asks the <b>one missing detail</b>, in Hindi',{which:'last',pad:4});
  await sleep(3800);
  await spot(null);
  await type('#botIn','कैटलॉग',110);
  await frame.locator('#botIn').press('Enter');
  await sleep(3000);
  await click('button[data-a="confirm"]:not([disabled])',{which:'last',after:1600});
  await spot('.msgs .m:not(.out)','',{which:'last',pad:4});
  await sleep(4200);
  await spot(null);
  await shot('hindi');
  await cam(1,0,0,1300);await sleep(1300);

  /* ---------- 4 number + routing ---------- */
  mark('s4');
  await step(3,'One number, the right factory','Each order keeps its <b>T-number</b> from the first message to delivery. Order Desk suggests the best factory from its on-time record, workload and CAD skills.');
  await sleep(2000);
  await go('overview');
  await sleep(600);
  await spot('.r-item:has([data-send="T434"])','New orders wait here for a factory',{pad:4});
  await move('.r-item:has([data-send="T434"]) .ref',{ms:1200});
  await sleep(3200);
  await spot(null);
  await click('[data-open="T434"]',{after:1100});
  await camOn('#drawer',1.3,'first');
  await spot('#drawer .next','Why this factory, <b>in plain words</b>',{pad:4,below:true});
  await sleep(6000);
  await spot(null);
  await click('#drawer [data-send="T434"]',{after:1400});
  await sleep(2400);
  await shot('routed');
  const fac=await frame.evaluate(()=>JSON.parse(localStorage.getItem('t22-order-desk-v1')).orders.find(o=>o.ref==='T434').factory);
  console.log('T434 factory',fac);
  await cam(1,0,0,1200);await sleep(1200);
  await click('#dClose',{after:900});

  /* ---------- 5 factory confirms ---------- */
  mark('s5');
  await step(4,'The factory confirms','The factory gets <b>one clear message</b> in a fixed format, with the order number on top. Its reply in its usual words updates the order by itself.');
  await sleep(2000);
  await go('chats');
  await click('[data-cmode="f"]',{after:900});
  await click(`[data-chat="${fac}"]`,{after:1100});
  await camOn('.msgs .m.out',1.12,'last');
  await spot('.msgs .m.out','Same format for <b>every factory</b>',{which:'last',pad:4,below:false});
  await sleep(6500);
  await spot(null);
  await release(1); // factory accepts
  await sleep(1400);
  await camOn('.msgs .m:not(.out)',1.3,'last',1200);
  await spot('.msgs .m:not(.out)','Factory reply · <b>order confirmed</b>',{which:'last',pad:4});
  await sleep(5200);
  await spot(null);
  await shot('confirmed');

  /* ---------- 6 CAD ---------- */
  mark('s6');
  await step(5,'CAD for new designs','New designs need a CAD first. The factory sends it, and it goes <b>straight to the retailer</b> for a one-tap approval.');
  await sleep(2600);
  await release(1); // CAD arrives
  await sleep(1500);
  await camOn('.msgs .m:not(.out)',1.25,'last',1200);
  await spot('.msgs .m:not(.out)','CAD received from the factory',{which:'last',pad:4});
  await sleep(4800);
  await spot(null);
  await cam(1,0,0,1200);await sleep(1200);
  await click('[data-cmode="r"]',{after:900});
  await click('[data-chat="png"]',{after:1100});
  await camOn('.msgs .m:not(.out)',1.25,'last');
  await spot('.msgs .m:not(.out)','The retailer sees the CAD on WhatsApp',{which:'last',pad:4});
  await sleep(4000);
  await spot(null);
  await click('button[data-a="cadApprove"]:not([disabled])',{which:'last',after:1800});
  await spot('.msgs .m:not(.out)','Approved · <b>production starts</b>',{which:'last',pad:4});
  await sleep(5000);
  await spot(null);
  await shot('cad');
  await cam(1,0,0,1200);await sleep(1200);

  /* ---------- 7 follow-ups ---------- */
  mark('s7');
  await step(6,'Follow-ups, without chasing','During the 10 to 15 day deadline, reminders go out on <b>day 6, 8 and 10</b>, then daily (urgent orders daily). Each factory gets one numbered list.');
  await sleep(2000);
  await go('orders');
  await sleep(800);
  await spot('.board .col:nth-child(4) [data-open="T434"]','#T434 is now <b>being made</b>',{pad:4});
  await move('.board .col:nth-child(4) [data-open="T434"]',{ms:1200});
  await sleep(3800);
  await spot(null);
  await go('overview');
  await spot('.r-item:has(#sendAll)','Today\'s follow-ups, ready to send',{pad:4});
  await sleep(3000);
  await spot(null);
  await click('#sendAll',{after:1500});
  await go('chats');
  await click('[data-cmode="f"]',{after:800});
  await click('[data-chat="Mars"]',{after:1100});
  await camOn('.msgs .m.out',1.15,'last');
  await spot('.msgs .m.out','<b>One</b> message per factory, every order numbered',{which:'last',pad:4,below:false});
  await sleep(6200);
  await spot(null);
  await release(); // factories reply
  await sleep(1500);
  await cam(1.18,670,560,1200);await sleep(1200);
  await sleep(1500);
  await sleep(3500);
  await shot('followups');
  await cam(1,0,0,1200);await sleep(1200);
  await step(6,'Delays, caught early','When a factory says a piece will be late, the order moves to <b>Running late</b> and the retailer gets the new date on WhatsApp.');
  await sleep(1600);
  await go('overview');
  await spot('.cols .grid .card:first-child','Late orders, with the factory\'s new date',{pad:4});
  await sleep(5500);
  await spot(null);
  await move('#nextDay',{ms:1200});
  await spot('#nextDay','Demo clock: <b>jump a day</b>',{pad:6,below:true});
  await sleep(2200);
  await spot(null);
  await click('#nextDay',{after:1800});
  await sleep(3600);
  await release();
  await shot('nextday');
  await sleep(1200);

  /* ---------- 8 QC ---------- */
  mark('s8');
  await step(7,'Received and checked','When a piece is ready, the team collects it and checks it at the office. If it passes, it ships and the <b>retailer is told</b>.');
  await sleep(2000);
  const ready=await frame.evaluate(()=>{const b=document.querySelector('#todo [data-act="receive"]');return b&&b.dataset.ref;});
  console.log('ready',ready);
  if(ready){
    await spot(`.r-item:has([data-act="receive"][data-ref="${ready}"])`,'Piece ready at the factory',{pad:4});
    await sleep(3200);await spot(null);
    await click(`[data-act="receive"][data-ref="${ready}"]`,{after:1400});
  }
  const qc=await frame.evaluate(()=>[...document.querySelectorAll('#todo [data-act="qcpass"]')].map(b=>b.dataset.ref));
  console.log('qc',qc);
  const passRef=qc[0];
  await spot(`.r-item:has([data-act="qcpass"][data-ref="${passRef}"])`,'Quality check · <b>pass or problem</b>',{pad:4});
  await sleep(3600);
  await spot(null);
  await click(`[data-act="qcpass"][data-ref="${passRef}"]`,{after:1600});
  await sleep(2600);
  await shot('qc');

  /* ---------- 9 repair ---------- */
  mark('s9');
  await step(8,'Repair or wrong order','If something is off, pick the reason. The piece goes <b>back to the same factory</b> with a clear return note and a new date.');
  await sleep(2400);
  const probRef=qc[1];
  await click(`[data-problem="${probRef}"]`,{after:1200});
  await camOn('#drawer',1.3);
  await sleep(1500);
  await click('#drawer [data-issue="Repair"]',{after:1300});
  await spot('#drawer .next','What needs fixing?',{pad:4,below:true});
  await sleep(3000);
  await spot(null);
  await click('#drawer [data-ireason="Stone loose"]',{after:1500});
  await sleep(2000);
  await shot('repair');
  const probFac=await frame.evaluate(r=>JSON.parse(localStorage.getItem('t22-order-desk-v1')).orders.find(o=>o.ref===r).factory,probRef);
  await cam(1,0,0,1200);await sleep(1200);
  await click('#dClose',{after:900});
  await go('chats');
  await click('[data-cmode="f"]',{after:800});
  await click(`[data-chat="${probFac}"]`,{after:1100});
  await camOn('.msgs .m.out',1.12,'last');
  await spot('.msgs .m.out','Return note in the <b>same fixed format</b>',{which:'last',pad:4});
  await sleep(5500);
  await spot(null);
  await release();
  await sleep(1400);
  await camOn('.msgs .m:not(.out)',1.3,'last',1100);
  await spot('.msgs .m:not(.out)','Factory accepts the return',{which:'last',pad:4});
  await sleep(4200);
  await spot(null);
  await cam(1,0,0,1200);await sleep(1200);

  /* ---------- 10 reports ---------- */
  mark('s10');
  await step(9,'Reports that answer real questions','Which factories deliver on time? Which designs go custom? Every number comes from the orders themselves.');
  await sleep(2200);
  await go('reports');
  await sleep(800);
  await spot('.insight:first-child','Mars gets most orders, but is often late',{pad:6});
  await sleep(5500);
  await spot(null);
  await frame.evaluate(()=>{const e=document.querySelector('.fgrid');window.scrollTo({top:window.scrollY+e.getBoundingClientRect().top-150,behavior:'smooth'});});
  await sleep(1800);
  await spot('.fgrid .fc:nth-child(1)','On-time rate per factory',{pad:6});
  await move('.fgrid .fc:nth-child(1) .meter',{ms:1200});
  await sleep(5000);
  await spot(null);
  await frame.evaluate(()=>{const e=document.querySelector('.two:last-child');window.scrollTo({top:window.scrollY+e.getBoundingClientRect().top-150,behavior:'smooth'});});
  await sleep(1800);
  await spot('.two:last-of-type .card:first-child','Which categories <b>go custom</b>',{pad:6});
  await sleep(5000);
  await spot('.two:last-of-type .card:last-child','What retailers ask to customise',{pad:6});
  await sleep(4800);
  await spot(null);
  await shot('reports');
  await S('hideCursor',true);
  await sleep(1200);

  /* ---------- outro ---------- */
  mark('outro');
  await S('card','outro',true);
  await sleep(400);
  await S('cardIn','outroT');
  await sleep(8500);
  await shot('outro');
  await S('black',true);
  await sleep(1800);
  mark('end');

  if(rec){
    await rec.cdp.send('Page.stopScreencast');
    await sleep(800);
    const L=rec.list;
    let txt='';
    for(let i=0;i<L.length;i++){const d=i<L.length-1?L[i+1].t-L[i].t:0.5;txt+=`file '${L[i].file}'\nduration ${Math.max(d,0.001).toFixed(4)}\n`;}
    txt+=`file '${L[L.length-1].file}'\n`;
    fs.writeFileSync(path.join(__dirname,'frames.txt'),txt);
    const span=L[L.length-1].t-L[0].t;
    console.log('frames',L.length,'span',span.toFixed(1),'avg fps',(L.length/span).toFixed(1));
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
