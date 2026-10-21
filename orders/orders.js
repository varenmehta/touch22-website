/* Touch22 Order Desk — demo app. Plain JS, no build step.
   Everything is simulated in the browser: retailer WhatsApp bot, factory chats and replies.
   Data model follows the T22 Order DB sheet (Ref, Order Date, Customer Name, Factory, Factory Deadline,
   Status, Product, Days Remain, Priority, Remarks, Size, Purity, Issue Type, Issue Date). */
(function(){
"use strict";

/* ---------- small helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const wa=s=>esc(s).replace(/\*([^*\n]+)\*/g,"<b>$1</b>");
const D=s=>new Date(s+"T00:00:00");
const iso=d=>{const z=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());};
const add=(s,n)=>{const d=D(s);d.setDate(d.getDate()+Math.round(n));return iso(d);};
const diff=(a,b)=>Math.round((D(a)-D(b))/864e5); // a - b in days
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONHI=["जन","फ़र","मार्च","अप्रै","मई","जून","जुला","अग","सित","अक्टू","नव","दिस"];
const fmt=s=>{if(!s)return"–";const d=D(s);return d.getDate()+" "+MON[d.getMonth()];};
const fmtL=s=>{const d=D(s);return d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"});};
const fmtHi=s=>{const d=D(s);return d.getDate()+" "+MONHI[d.getMonth()];};
const nowT=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");};
const pct=x=>Math.round(x*100)+"%";
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- reference data ---------- */
const T0="2026-10-21";
const FACTORIES=[
 {name:"Mars",cats:["Ring","MS","Bracelet","Kada","Pendant","Necklace"],pur:["22KT","18KT"],lead:12,rel:.55,reply:[4,30],cad:true,w:10},
 {name:"Anika",cats:["Earrings","Bangles","Bracelet","Kada","Ring"],pur:["22KT","18KT"],lead:10,rel:.5,reply:[6,40],cad:false,w:4},
 {name:"HD",cats:["Ring","Pendant"],pur:["22KT","18KT"],lead:10,rel:.86,reply:[1,5],cad:true,w:1.6},
 {name:"Jigar Bhai",cats:["Ring","Pendant","Earrings"],pur:["22KT","18KT"],lead:12,rel:.8,reply:[2,8],cad:false,w:1},
 {name:"AR Rafik",cats:["Ring"],pur:["22KT"],lead:14,rel:.74,reply:[2,10],cad:true,w:1},
 {name:"PK Gold",cats:["MS","Chain","Pendant"],pur:["22KT","18KT"],lead:11,rel:.72,reply:[2,12],cad:false,w:1.2},
 {name:"Kanak",cats:["Bracelet","Ring","Chain"],pur:["22KT"],lead:12,rel:.68,reply:[3,14],cad:false,w:.9},
 {name:"KK Arts",cats:["Pendant","Earrings","Ring"],pur:["18KT","14KT","9KT"],lead:10,rel:.64,reply:[3,16],cad:true,w:.8},
 {name:"New Ratan",cats:["Bangles","Kada"],pur:["22KT"],lead:15,rel:.66,reply:[4,18],cad:false,w:.9},
 {name:"SK",cats:["Ring","Necklace"],pur:["22KT"],lead:13,rel:.6,reply:[5,20],cad:false,w:.6}
];
const FAC=Object.fromEntries(FACTORIES.map(f=>[f.name,f]));
const PRODUCTS=["Ring","MS","Bracelet","Kada","Pendant","Earrings","Necklace","Bangles","Chain"];
const PRODUCT_LABEL={MS:"MS (mangalsutra)"};
const MIX={Ring:40,MS:15,Bracelet:10,Kada:8,Pendant:9,Earrings:7,Necklace:5,Bangles:4,Chain:3};
const CUSTOM_P={Ring:.5,MS:.35,Bracelet:.5,Kada:.3,Pendant:.72,Earrings:.15,Necklace:.45,Bangles:.1,Chain:.05};
const WT={Ring:[3,8],MS:[8,20],Bracelet:[8,25],Kada:[15,35],Pendant:[2,6],Earrings:[3,8],Necklace:[15,40],Bangles:[20,40],Chain:[8,20]};
const SIZED=["Ring","Bracelet","Kada","Bangles","Chain","MS","Necklace"];
const REM={
 Ring:{c:["Single stone with channel setting","Red stone upon king symbol","Green stone with jaguar and meena karna","Embossed with om symbol","Ghoda ring","Name 'S' in heart shape","Chappai wala kaam, flower design","3 lines, middle line stone","Couple band with names","Red stone ke upar OM design"],k:["Same as sample","Single stone","CZ with jaguar","Simple ring","Stone ring simple","Single line of full stone",""]},
 Pendant:{c:["'P' letter as a pendant","Chain pendant set in white gold","Name pendant 'Riya'","Evil eye pendant","OM pendant with red stone","'M' letter pendant with CZ"],k:["Same as per photo","Yellow finishing",""]},
 MS:{c:["MS with 'P' letter in heart shape","2-line press chain, heart CZ pendant","Box chain with 7 crystal BB","Name in pendant 'Aarav'"],k:["18\" + pendal","Single stone design","MS without hanging","Casting pipe nahi chahiye"]},
 Bracelet:{c:["Belt bracelet with name Indrani","Rabbit + evil eye design","Rubber bracelet moveable","Name bracelet 'Kavya'"],k:["Press chain","BB + baby leg + BB","Regular",""]},
 Kada:{c:["Bulgari inside jhali","Big stone with 'S' line","Rose gold kada with name"],k:["In white gold, same to same","Rose gold kada","Regular"]},
 Earrings:{c:["Evil eye studs"],k:["Only tops","Raglur","Rose gold",""]},
 Necklace:{c:["Charms chain, melting 9KT","2 line press chain, 'M' in first line"],k:["Regular",""]},
 Bangles:{c:["Openable with name"],k:["Openable","Regular"]},
 Chain:{c:["Name chain"],k:["Box chain","Regular"]}
};
const CUSTOMERS=["Parekh Nagpur","Gb","Mayura Panvel","Pravesh Gold Kalyan","PNG Sons Sangli","Sangram Bhai","Shivam Yavatmal","Dakshaya Colaba","Manubhai Bov","Navrathan Banglore","Ornate Kota","SNM Loni","DC Ratlam","Popat","Vispute Saraf","Abhusan Burgad","Swarnmudra Dadar","Divine Virar","Harit Zaveri Ahmedabad","Ps Bhandari A.nagar","Ekta Abhusan","Dilip Jalgaon","Mohini (Rikin)","National Panvel","Patil Vkl","Oms","Sons","Png Bro"];
const PERSONAS=[
 {id:"parekh",name:"Parekh Jewellers",cust:"Parekh Nagpur",city:"Nagpur",contact:"Rakesh",lang:"en"},
 {id:"png",name:"PNG Sons",cust:"PNG Sons Sangli",city:"Sangli",contact:"Amit",lang:"hn"},
 {id:"mayura",name:"Mayura Jewellers",cust:"Mayura Panvel",city:"Panvel",contact:"Suresh",lang:"hi"},
 {id:"shivam",name:"Shivam Jewellers",cust:"Shivam Yavatmal",city:"Yavatmal",contact:"Shivam",lang:"hn"}
];
const STAGES=["Enquiry","Awaiting Factory","CAD Making","CAD Approval","In Production","Ready at Factory","At Office · QC","Dispatched","Completed"];
const STAGE_LBL={"Enquiry":"New order","Awaiting Factory":"Waiting for factory","CAD Making":"CAD being made","CAD Approval":"CAD with retailer","In Production":"Being made","Repair":"Repair at factory","Wrong Order":"Remake at factory","Ready at Factory":"Ready to collect","At Office · QC":"Quality check","Dispatched":"Shipped","Completed":"Delivered","Cancelled":"Cancelled"};
const WITH_FACTORY=["Awaiting Factory","CAD Making","In Production","Repair","Wrong Order"];
const CLOSED=["Completed","Cancelled"];
const ISSUE_REASONS={Repair:["Stone loose","Polish / finishing","Solder joint weak","Weight short"],"Wrong Order":["Wrong size","Wrong purity","Wrong design","Wrong length"]};

/* ---------- state ---------- */
const KEY="t22-order-desk-v1";
let S;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const j=localStorage.getItem(KEY);if(j){const s=JSON.parse(j);if(s&&s.v===1)return s;}}catch(e){}return null;}

function seed(){
  const R=rng(2210);
  const pick=a=>a[Math.floor(R()*a.length)];
  const wpick=obj=>{const t=Object.values(obj).reduce((a,b)=>a+b,0);let r=R()*t;for(const k in obj){r-=obj[k];if(r<=0)return k;}return Object.keys(obj)[0];};
  const st={v:1,today:T0,nextRef:434,orders:[],fchat:{},bot:{cur:"parekh",convs:{}},log:[],
    set:{autoRoute:true,simFactory:true,autoFollow:true},seenHow:false};
  const N=140, start="2026-09-01";
  for(let i=0;i<N;i++){
    const ref="T"+(294+i);
    const date=add(start,Math.floor(i*50/N));
    const product=wpick(MIX);
    const custom=R()<CUSTOM_P[product];
    const cands=FACTORIES.filter(f=>f.cats.includes(product));
    const fac=wpick(Object.fromEntries(cands.map(f=>[f.name,f.w])));
    const f=FAC[fac];
    let purity=R()<.72?"22KT":"18KT"; if(!f.pur.includes(purity))purity=f.pur[0];
    const urgent=R()<.17;
    const lead=(urgent?7+Math.floor(R()*3):10+Math.floor(R()*6))+(custom?4:0);
    const deadline=add(date,lead);
    const late=R()>f.rel;
    const delay=late?1+Math.floor(R()*R()*12):-Math.floor(R()*3);
    const readyAt=add(deadline,delay);
    const [w0,w1]=WT[product];
    const weight=Math.round((w0+R()*(w1-w0))*10)/10;
    const size=product==="Ring"?String(8+Math.floor(R()*20)):product==="Bracelet"?pick(["6.5\"","7\"","7.5\"","Adjustable"]):product==="Kada"||product==="Bangles"?pick(["2.2/1.13","2.4 aani","2.6 aani","2.8"]):product==="MS"||product==="Chain"||product==="Necklace"?pick(["16\"","18\"","20\"","16\"/17\""]):"";
    const remarks=pick(custom?REM[product].c:REM[product].k);
    const replyHrs=Math.round(f.reply[0]+R()*(f.reply[1]-f.reply[0]));
    const o={ref,date,customer:pick(CUSTOMERS),product,purity,weight,size,qty:R()<.85?1:2,remarks,priority:urgent?"Urgent":"Default",
      design:custom?"Custom":"Catalogue",code:custom?"":(R()<.5?`T22-${product.slice(0,2).toUpperCase()}-${100+Math.floor(R()*500)}`:""),
      factory:fac,deadline,status:"Completed",hist:[],issues:[],replyHrs,lastFollow:null,fu:0,src:R()<.5?"Google Form":"WhatsApp"};
    if(i%9===0)o.customer="Parekh Nagpur"; if(i%13===4)o.customer="PNG Sons Sangli";
    if(i%17===6)o.customer="Mayura Panvel"; if(i%19===8)o.customer="Shivam Yavatmal";
    // build the full planned timeline, then keep what has happened by "today"
    const ev=[];const E=(d,s,t,k)=>ev.push({d,s,t,k});
    E(date,"Enquiry",`Order logged from ${o.src}`,"r");
    E(date,"Awaiting Factory",`Sent to ${fac} with order no. #${ref}`,"f");
    const conf=add(date,replyHrs>14?1:0);
    let prodStart=conf;
    if(custom){
      E(conf,"CAD Making",`${fac} confirmed, CAD in progress`,"f");
      const cadSent=add(conf,2+Math.floor(R()*2));
      E(cadSent,"CAD Approval","CAD shared with retailer for approval","f");
      prodStart=add(cadSent,1+Math.floor(R()*2));
      E(prodStart,"In Production","Retailer approved CAD, production started","r");
    } else E(conf,"In Production",`${fac} confirmed. Deadline ${fmt(deadline)}`,"f");
    if(delay>0)E(add(deadline,-1),null,`${fac}: running late, new date ${fmt(readyAt)}`,"x");
    E(readyAt,"Ready at Factory",delay>0?`${fac}: piece ready (${delay} day${delay>1?"s":""} late)`:`${fac}: piece ready`,"f");
    let office=add(readyAt,1);
    E(office,"At Office · QC","Received at office, QC pending","");
    const hadIssue=R()<.08;
    let fin=office;
    if(hadIssue){
      const type=R()<.6?"Repair":"Wrong Order";const reason=pick(ISSUE_REASONS[type]);
      E(office,type,`QC failed: ${type} (${reason}). Sent back to ${fac}`,"x");
      o._issue={type,reason,date:office};
      const re=add(office,4+Math.floor(R()*4));
      E(re,"Ready at Factory",`${fac}: corrected piece ready`,"f");
      fin=add(re,1);E(fin,"At Office · QC","Corrected piece received, QC pending","");
    }
    E(add(fin,1),"Dispatched","QC passed, dispatched to retailer","r");
    E(add(fin,3),"Completed","Delivered to retailer","r");
    o.readyAt=readyAt; o.eta=readyAt;
    const cancelled=R()<.045&&!hadIssue;
    let happened=ev.filter(e=>e.d<st.today || (e.d===st.today&&R()<.3));
    if(cancelled){const cd=add(date,2+Math.floor(R()*4));happened=happened.filter(e=>e.d<cd);if(cd<st.today)happened.push({d:cd,s:"Cancelled",t:"Cancelled by retailer","k":"x"});}
    o.hist=happened.map(e=>({d:e.d,t:e.t,k:e.k}));
    const last=[...happened].reverse().find(e=>e.s);
    o.status=last?last.s:"Enquiry";
    if(o._issue&&happened.some(e=>e.s===o._issue.type)){o.issues.push(o._issue);}
    if(o.status==="Repair"||o.status==="Wrong Order"){o.eta=ev.find(e=>e.t.includes("corrected piece ready")).d;o.revised=add(o._issue.date,5);}
    if(o.status==="In Production"&&delay>0&&st.today>=add(deadline,-1))o.revised=readyAt;
    if(o.status==="Completed"){o.doneAt=happened[happened.length-1].d;}
    if(o.status==="Cancelled"){o.issues.push({type:"Cancelled",reason:"Retailer cancelled",date:happened[happened.length-1].d});}
    delete o._issue;
    if(!CLOSED.includes(o.status)){
      const age=diff(st.today,date);
      o.fu=Math.max(0,Math.floor(age/3));
      o.lastFollow=add(st.today,R()<.5?-1:-2);
      if(o.status==="Awaiting Factory")o.lastFollow=null;
    }
    st.orders.push(o);
  }
  // make sure there is something to route and confirm right now
  const newest=st.orders.filter(o=>o.date>=add(T0,-1));
  if(newest[0]){const o=newest[0];o.status="Enquiry";o.hist=o.hist.slice(0,1);o.factory="";o.src="WhatsApp";}
  // build factory chats from history for recent orders
  for(const o of st.orders){
    if(!o.factory||o.date<"2026-10-02")continue;
    const ch=st.fchat[o.factory]||(st.fchat[o.factory]=[]);
    ch.push({d:o.date,tm:tm(R),from:"t22",ref:o.ref,text:factoryMsg(o)});
    for(const h of o.hist.slice(2)){
      if(h.k!=="f"&&h.k!=="x")continue;
      if(/confirmed/.test(h.t))ch.push({d:h.d,tm:tm(R),from:"fac",ref:o.ref,text:`${o.ref} ok ${fmt(o.deadline)} tak ho jayega`});
      else if(/CAD shared/.test(h.t))ch.push({d:h.d,tm:tm(R),from:"fac",ref:o.ref,text:`${o.ref} CAD bhej diya 👆`,art:{p:o.product,cad:true}});
      else if(/late/.test(h.t))ch.push({d:h.d,tm:tm(R),from:"fac",ref:o.ref,text:`${o.ref} thoda late hoga, ${fmt(o.revised||o.readyAt)} tak`});
      else if(/ready/.test(h.t))ch.push({d:h.d,tm:tm(R),from:"fac",ref:o.ref,text:`${o.ref} ready hai, utha lo`});
    }
  }
  for(const k in st.fchat)st.fchat[k].sort((a,b)=>(a.d+a.tm).localeCompare(b.d+b.tm));
  st.log=[{d:T0,tm:"09:00",t:"Morning summary prepared: orders, follow-ups and deadlines for today."}];
  st.nextRef=294+N;
  return st;
}
function tm(R){const h=9+Math.floor(R()*10),m=Math.floor(R()*60);return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");}

/* ---------- domain logic ---------- */
const byRef=r=>S.orders.find(o=>o.ref.toUpperCase()===String(r).toUpperCase().replace(/\s/g,""));
const active=()=>S.orders.filter(o=>!CLOSED.includes(o.status));
const dueDate=o=>o.revised||o.deadline;
const daysLeft=o=>o.deadline?diff(o.deadline,S.today):null;
const isIssue=o=>o.status==="Repair"||o.status==="Wrong Order";
const lateBy=o=>diff(S.today,isIssue(o)?(o.revised||o.deadline):o.deadline);
const isOver=o=>WITH_FACTORY.includes(o.status)&&!!o.deadline&&lateBy(o)>0;
const dispatchBy=o=>add(dueDate(o),2);
const persona=o=>PERSONAS.find(p=>p.cust===o.customer);

function log(t,ref){S.log.unshift({d:S.today,tm:nowT(),t,ref});S.log=S.log.slice(0,80);}
function hist(o,t,k){o.hist.push({d:S.today,t,k:k||""});}

function factoryMsg(o){
  const L=[`*TOUCH22 ORDER  #${o.ref}*${o.priority==="Urgent"?"   🔴 URGENT":""}`,
  `Product: ${o.product==="MS"?"Mangalsutra (MS)":o.product}`,
  `Design: ${o.design==="Custom"?"NEW design, CAD needed first (photo attached)":"Catalogue "+(o.code||"(photo attached)")}`,
  `Purity: ${o.purity}`,`Weight: approx ${o.weight} g`];
  if(o.size)L.push(`Size: ${o.size}`);
  L.push(`Qty: ${o.qty}`);
  if(o.remarks)L.push(`Remarks: ${o.remarks}`);
  L.push(`Deadline: *${fmtL(o.deadline)}*`,"",`Reply *${o.ref} OK* to accept, *${o.ref} <date>* for another date, or *${o.ref} NO* if not possible.`);
  return L.join("\n");
}
function returnMsg(o,type,reason){
  return [`*RETURN  #${o.ref}  ·  ${type.toUpperCase()}*`,`Issue: ${reason}`,`Piece: ${o.product} ${o.purity}${o.size?", size "+o.size:""}, approx ${o.weight} g`,
  o.remarks?`Original remarks: ${o.remarks}`:null,`Please correct and send back by *${fmtL(o.revised)}*.`,`Reply *${o.ref} OK* to confirm.`].filter(Boolean).join("\n");
}

function facStats(name){
  const os=S.orders.filter(o=>o.factory===name);
  const done=os.filter(o=>o.readyAt&&(o.status==="Completed"||o.status==="Dispatched"||o.status==="At Office · QC"||o.issues.some(i=>i.type!=="Cancelled")));
  const onTime=done.filter(o=>o.readyAt<=o.deadline).length;
  const lateDays=done.filter(o=>o.readyAt>o.deadline).map(o=>diff(o.readyAt,o.deadline));
  const issues=os.reduce((a,o)=>a+o.issues.filter(i=>i.type==="Repair"||i.type==="Wrong Order").length,0);
  const open=os.filter(o=>!CLOSED.includes(o.status)).length;
  const overdue=os.filter(isOver).length;
  const rh=os.map(o=>o.replyHrs).filter(x=>x!=null);
  return {name,total:os.length,done:done.length,onTime:done.length?onTime/done.length:FAC[name].rel,late:done.length-onTime,
    avgLate:lateDays.length?lateDays.reduce((a,b)=>a+b,0)/lateDays.length:0,issues,issueRate:done.length?issues/done.length:0,open,overdue,
    reply:rh.length?rh.reduce((a,b)=>a+b,0)/rh.length:null,cancel:os.filter(o=>o.status==="Cancelled").length,
    repair:os.reduce((a,o)=>a+o.issues.filter(i=>i.type==="Repair").length,0),wrong:os.reduce((a,o)=>a+o.issues.filter(i=>i.type==="Wrong Order").length,0)};
}
function route(o){
  let c=FACTORIES.filter(f=>f.cats.includes(o.product)&&f.pur.includes(o.purity));
  if(!c.length)c=FACTORIES.filter(f=>f.pur.includes(o.purity));
  if(!c.length)c=FACTORIES.filter(f=>f.cats.includes(o.product));
  const sc=c.map(f=>{
    const s=facStats(f.name);const why=[];
    let v=s.onTime*55-s.open*.9-s.overdue*1.5;
    if(f.cats[0]===o.product||f.cats.indexOf(o.product)<2){v+=10;why.push(`makes a lot of ${o.product==="MS"?"MS":o.product.toLowerCase()+"s"}`);}
    why.push(`${pct(s.onTime)} on time`);
    why.push(`${s.open} open order${s.open===1?"":"s"}`);
    if(o.priority==="Urgent"){v+=(14-f.lead)*2.2;why.push(`${f.lead}-day usual lead time`);}
    if(o.design==="Custom"&&f.cad){v+=7;why.push("makes CADs in-house");}
    if(s.reply!=null&&s.reply<8){v+=4;why.push(`replies in ~${Math.round(s.reply)} h`);}
    return {f:f.name,v,why,s};
  }).sort((a,b)=>b.v-a.v);
  const conf=sc.length===1||(sc[0].v-sc[1].v)>=5?"high":"check";
  return {best:sc[0],alts:sc.slice(1,3),conf,all:sc};
}
function leadFor(o,f){const fa=FAC[f]||{lead:12};return (o.priority==="Urgent"?Math.min(8,fa.lead-3):fa.lead)+(o.design==="Custom"?4:0);}

function followReason(o){
  if(!WITH_FACTORY.includes(o.status)||o.lastFollow===S.today)return null;
  if(o.status==="Awaiting Factory")return o.sentAt&&o.sentAt<S.today||(!o.sentAt&&o.date<S.today)?"No reply from factory yet":null;
  const day=diff(S.today,o.date);
  if(o.status==="Repair"||o.status==="Wrong Order")return o.lastFollow&&diff(S.today,o.lastFollow)<2?null:`${o.status}: check progress`;
  if(o.deadline<S.today)return `Overdue by ${diff(S.today,o.deadline)} day${diff(S.today,o.deadline)>1?"s":""}`;
  if(o.priority==="Urgent")return "Urgent: daily check";
  if(day===6||day===8||day===10)return `Day ${day} follow-up`;
  if(day>10)return "After day 10: daily";
  const mid=add(o.date,Math.floor(diff(o.deadline,o.date)/2));
  if(mid===S.today)return "Mid-way check";
  if(diff(o.deadline,S.today)===2)return "2 days to deadline";
  return null;
}
const followDue=()=>active().filter(o=>followReason(o)).sort((a,b)=>a.factory.localeCompare(b.factory)||a.deadline.localeCompare(b.deadline));

function fpush(fac,m){(S.fchat[fac]||(S.fchat[fac]=[])).push(Object.assign({d:S.today,tm:nowT()},m));}

/* Team actions */
function sendToFactory(o,fac,quiet){
  o.factory=fac;o.deadline=add(S.today,leadFor(o,fac));o.sentAt=S.today;o.status="Awaiting Factory";
  const f=FAC[fac];const late=Math.random()>f.rel;
  o.eta=add(o.deadline,late?1+Math.floor(Math.random()*6):-Math.floor(Math.random()*2));
  o.replyHrs=Math.round(f.reply[0]+Math.random()*(f.reply[1]-f.reply[0]));
  fpush(fac,{from:"t22",ref:o.ref,text:factoryMsg(o),art:o.photo?{p:o.product}:null});
  hist(o,`Sent to ${fac} in the standard format with order no. #${o.ref}`,"f");
  log(`#${o.ref} sent to ${fac}`,o.ref);
  if(!quiet)toast(`<b>#${o.ref}</b> sent to ${esc(fac)} in the standard format`);
  if(S.set.simFactory)later(()=>simReply(o.ref,"accept"),2600);
}
function setStatus(o,s,t,k){o.status=s;if(t)hist(o,t,k);}
function act(ref,a,x){
  const o=byRef(ref);if(!o)return;
  switch(a){
    case "receive":setStatus(o,"At Office · QC","Received at office, QC pending");log(`#${o.ref} received at office`,o.ref);break;
    case "qcpass":setStatus(o,"Dispatched","QC passed, dispatched to retailer","r");log(`#${o.ref} QC passed and dispatched`,o.ref);notify(o,"dispatched");break;
    case "delivered":setStatus(o,"Completed","Delivered to retailer","r");o.doneAt=S.today;log(`#${o.ref} completed`,o.ref);break;
    case "issue":{
      const {type,reason}=x;o.issues.push({type,reason,date:S.today});o.revised=add(S.today,5);
      o.eta=add(S.today,3+Math.floor(Math.random()*4));o.lastFollow=S.today;
      setStatus(o,type,`QC failed: ${type} (${reason}). Sent back to ${o.factory}`,"x");
      fpush(o.factory,{from:"t22",ref:o.ref,text:returnMsg(o,type,reason)});
      log(`#${o.ref} back to ${o.factory}: ${type}, ${reason}`,o.ref);
      if(S.set.simFactory)later(()=>simReply(o.ref,"ack"),2200);
      break;}
    case "cadApprove":setStatus(o,"In Production","Retailer approved CAD, production started","r");
      fpush(o.factory,{from:"t22",ref:o.ref,text:`*#${o.ref}* CAD approved by customer ✅ Please start production. Deadline *${fmtL(o.deadline)}*.`});
      log(`#${o.ref} CAD approved, production started`,o.ref);notify(o,"cadOk");break;
    case "cadChange":setStatus(o,"CAD Making","Retailer asked for CAD changes","r");
      fpush(o.factory,{from:"t22",ref:o.ref,text:`*#${o.ref}* customer wants a change in the CAD: ${x||"stone slightly bigger"}. Please send revised CAD.`});
      log(`#${o.ref} CAD change requested`,o.ref);if(S.set.simFactory)later(()=>simReply(o.ref,"cad"),3000);break;
    case "cancel":setStatus(o,"Cancelled","Cancelled","x");o.issues.push({type:"Cancelled",reason:"Cancelled",date:S.today});log(`#${o.ref} cancelled`,o.ref);break;
    case "reroute":o.status="Enquiry";hist(o,`Taken back from ${o.factory} to pick another factory`,"x");log(`#${o.ref} needs another factory`,o.ref);break;
    case "urgent":o.priority=o.priority==="Urgent"?"Default":"Urgent";hist(o,`Priority set to ${o.priority}`);break;
  }
  save();renderAll();
}
function sendFollowups(list,quiet){
  const by={};list.forEach(o=>(by[o.factory]=by[o.factory]||[]).push(o));
  let n=0;
  for(const fac in by){
    const os=by[fac];
    const lines=os.map((o,i)=>`${i+1}. *#${o.ref}* ${o.product} ${o.purity}${o.size?" · "+o.size:""} · ${o.status==="Awaiting Factory"?"please confirm":o.status==="CAD Making"?"CAD pending":o.status==="Repair"||o.status==="Wrong Order"?o.status.toLowerCase()+", due "+fmt(o.revised):"due "+fmt(o.deadline)+(o.deadline<S.today?` (${diff(S.today,o.deadline)}d late)`:"")}`);
    fpush(fac,{from:"t22",ref:os.length===1?os[0].ref:null,refs:os.map(o=>o.ref),text:[`*TOUCH22 FOLLOW-UP · ${fmt(S.today)}*`,`Status please, ${os.length} order${os.length>1?"s":""}:`,...lines,"",`Reply per order, e.g. *${os[0].ref} ready* / *${os[0].ref} 2 days*`].join("\n")});
    os.forEach(o=>{o.lastFollow=S.today;o.fu=(o.fu||0)+1;hist(o,`Follow-up sent to ${fac}`,"f");});
    n+=os.length;
    if(S.set.simFactory)os.forEach((o,i)=>later(()=>simReply(o.ref,"follow"),1200+i*450+Math.random()*900));
  }
  log(`${n} follow-up${n===1?"":"s"} sent to ${Object.keys(by).length} factor${Object.keys(by).length===1?"y":"ies"}, one numbered message each`);
  if(!quiet)toast(`<b>${n} follow-ups</b> sent to ${Object.keys(by).length} factories`);
  save();renderAll();
}

/* Factory replies (simulated or typed) */
function simReply(ref,kind){
  const o=byRef(ref);if(!o)return;
  const f=FAC[o.factory];if(!f)return;
  if(o.status==="Awaiting Factory"){
    if(Math.random()<.06&&kind!=="accept")return factoryEvent(o,"reject");
    const d=Math.random()>f.rel?add(o.deadline,2):o.deadline;
    return factoryEvent(o,"accept",{date:d});
  }
  if(o.status==="CAD Making")return factoryEvent(o,"cad");
  if(kind==="ack")return factoryEvent(o,"ack");
  if(["In Production","Repair","Wrong Order"].includes(o.status)){
    if(o.eta<=S.today)return factoryEvent(o,"ready");
    if(o.eta>o.deadline&&(!o.revised||o.revised<o.eta)&&o.status==="In Production")return factoryEvent(o,"delay",{date:o.eta});
    return factoryEvent(o,"ontrack");
  }
}
function factoryEvent(o,intent,x={},typed){
  const fac=o.factory, R=o.ref;
  const say=t=>{if(!typed)fpush(fac,{from:"fac",ref:R,text:t,art:x.art});};
  switch(intent){
    case "accept":{
      if(o.status!=="Awaiting Factory")return say(`${R} ok 👍`);
      const d=x.date||o.deadline;
      if(d!==o.deadline){o.revised=d;}
      o.confirmedAt=S.today;
      say(d===o.deadline?`${R} ok, ${fmt(d)} tak ho jayega`:`${R} ok but ${fmt(d)} tak milega`);
      if(o.design==="Custom"){setStatus(o,"CAD Making",`${fac} confirmed${d!==o.deadline?", needs till "+fmt(d):""}. CAD in progress`,"f");if(S.set.simFactory)later(()=>simReply(R,"cad"),3200);}
      else setStatus(o,"In Production",`${fac} confirmed. Deadline ${fmt(dueDate(o))}`,"f");
      log(`${fac} confirmed #${R}${d!==o.deadline?" for "+fmt(d):""}`,R);toast(`<b>${esc(fac)}</b> confirmed #${R}`);
      notify(o,"confirmed");break;}
    case "reject":
      say(`${R} nahi ho payega abhi, karigar busy hai 🙏`);
      o.status="Enquiry";hist(o,`${fac} declined. Pick another factory`,"x");log(`${fac} declined #${R}, needs another factory`,R);
      toast(`<b>${esc(fac)}</b> declined #${R}. Pick another factory in To do`);break;
    case "cad":
      say(`${R} CAD ready 👇`);if(!typed)S.fchat[fac][S.fchat[fac].length-1].art={p:o.product,cad:true};
      setStatus(o,"CAD Approval","CAD received from factory, sent to retailer for approval","f");
      log(`CAD for #${R} received and sent to ${o.customer}`,R);notify(o,"cadReady");toast(`CAD for <b>#${R}</b> sent to the retailer for approval`);break;
    case "ready":
      say(`${R} ready hai ✅ office bhej rahe hain`);
      o.readyAt=o.readyAt&&o.issues.length?o.readyAt:S.today;
      setStatus(o,"Ready at Factory",`${fac}: piece ready${S.today>o.deadline&&!o.issues.length?` (${diff(S.today,o.deadline)} days late)`:""}`,"f");
      log(`${fac}: #${R} ready`,R);toast(`<b>${esc(fac)}</b>: #${R} is ready`);break;
    case "delay":{
      const d=x.date||add(dueDate(o),x.days||2);o.revised=d;o.eta=d>o.eta?d:o.eta;
      say(`${R} ${diff(d,S.today)} din aur lagenge, ${fmt(d)} tak`);
      hist(o,`${fac}: delayed, new date ${fmt(d)}`,"x");log(`${fac}: #${R} delayed to ${fmt(d)}`,R);notify(o,"delay");break;}
    case "ontrack":say(`${R} chal raha hai, ${fmt(dueDate(o))} tak mil jayega`);hist(o,`${fac}: on track for ${fmt(dueDate(o))}`,"f");break;
    case "ack":say(`${R} ok, theek karke ${fmt(o.revised)} tak bhejte hain`);hist(o,`${fac} accepted the return, back by ${fmt(o.revised)}`,"f");break;
  }
  save();renderAll();
}
function parseFactoryText(t){
  const refs=[...t.matchAll(/T\s?-?(\d{3,4})/gi)].map(m=>"T"+m[1]);
  const s=t.toLowerCase();let intent=null,x={};
  const dm=s.match(/(\d{1,2})\s*(oct|nov|dec|october|november|december)/)||s.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if(dm){const mo=isNaN(dm[2])?{oct:9,nov:10,dec:11}[dm[2].slice(0,3)]:+dm[2]-1;x.date=iso(new Date(2026,mo,+dm[1]));}
  const nd=s.match(/(\d+)\s*(din|days?|दिन)/);
  if(/\bno\b|nahi|nahin|not possible|can'?t|cannot|नहीं/.test(s))intent="reject";
  else if(/\bcad\b/.test(s))intent="cad";
  else if(/ready|taiyar|tayyar|tayar|तैयार|ho gaya|done/.test(s))intent="ready";
  else if(nd){intent="delay";x.days=+nd[1];}
  else if(/late|der|delay/.test(s))intent="delay";
  else if(/ok|okay|haan|\bha\b|accept|confirm|ho jayega|chalega|theek|ठीक|हाँ/.test(s)||x.date)intent="accept";
  return {refs,intent,x};
}
function typedFactory(fac,text){
  fpush(fac,{from:"fac",text,ref:null});
  const p=parseFactoryText(text);
  const last=[...(S.fchat[fac]||[])].reverse().find(m=>m.from==="t22"&&m.ref);
  const refs=p.refs.length?p.refs:(last?[last.ref]:[]);
  S.fchat[fac][S.fchat[fac].length-1].ref=refs.length===1?refs[0]:null;
  if(!refs.length||!p.intent){fpush(fac,{from:"sys",text:"Couldn't match this reply to an order. The team will check it."});save();renderAll();return;}
  for(const r of refs){
    const o=byRef(r);
    if(!o||o.factory!==fac){fpush(fac,{from:"sys",text:`#${r} isn't an open ${fac} order.`});continue;}
    let it=p.intent;
    if(it==="accept"&&o.status!=="Awaiting Factory")it=p.x.date&&p.x.date!==dueDate(o)?"delay":"ontrack";
    if(it==="ready"&&o.status==="CAD Making")it="cad";
    factoryEvent(o,it,p.x,true);
    fpush(fac,{from:"sys",text:`Read as: #${r} → ${({accept:"accepted",reject:"can't make it",cad:"CAD shared",ready:"piece ready",delay:"delayed to "+fmt(dueDate(o)),ontrack:"on track"})[it]}. Dashboard updated.`});
  }
  save();renderAll();
}

/* ---------- retailer bot ---------- */
const TX={
 en:{hi:"Hello {name}! I'm the Touch22 order assistant 🙏 Tell me what you need, e.g. \"22KT ring, size 16, 5 g\". You can also ask the status of any order by its number.",
  product:"Which product is it? (ring, MS, bracelet, kada, pendant, earrings, chain, bangles, necklace)",purity:"Which purity: 22KT, 18KT or 9KT?",weight:"Approx weight in grams?",
  size:"What size? (ring number, inches for chain/MS/bracelet, aani for kada)",design:"Is this a catalogue design (send the code or a photo of our piece) or a new design? Reply \"catalogue\" or \"new\".",
  summary:"Here's your order. Shall I place it?",yes:"✅ Yes, place order",no:"✏️ Change something",
  placed:"✅ Order *#{ref}* placed. We're confirming with the workshop and will update you here. Please quote *#{ref}* for anything about this piece.",
  confirmed:"🏭 *#{ref}* is confirmed by the workshop. Expected dispatch: *{date}*.",
  cadReady:"✏️ The CAD for *#{ref}* is ready. Please approve it so production can start.",approve:"👍 Approve CAD",change:"✏️ Request a change",
  cadOk:"👍 Approved. *#{ref}* is now in production. Expected dispatch: *{date}*.",cadCh:"Noted, we've asked for a revised CAD for *#{ref}*.",
  dispatched:"📦 *#{ref}* passed our quality check and is dispatched today.",delay:"⏳ Update on *#{ref}*: new expected dispatch *{date}*. Sorry for the wait.",
  status:"*#{ref}* · {product}: {status}. {eta}",eta:"Expected dispatch {date}.",notFound:"I couldn't find order #{ref} on your account.",
  list:"Your open orders:",none:"You have no open orders right now.",
  didnt:"Sorry, I didn't get that. Tell me the product, purity and weight, e.g. \"18KT bracelet 16 g 7.5 inch\".",
  edit:"Sure, tell me what to change (e.g. \"size 17\" or \"weight 6 g\").",photo:"Got the photo 👍 We'll treat this as a new design: the workshop makes a CAD for your approval first.",
  F:{product:"Product",purity:"Purity",weight:"Weight",size:"Size",qty:"Qty",design:"Design",remarks:"Notes",priority:"Priority"},cat:"Catalogue",custom:"New design (CAD first)",urgent:"Urgent"},
 hn:{hi:"Namaste {name} ji! Main Touch22 order assistant hoon 🙏 Bataiye kya chahiye, jaise \"22KT ring, size 16, 5 gram\". Kisi bhi order ka status uske number se pooch sakte hain.",
  product:"Kaunsa product chahiye? (ring, MS, bracelet, kada, pendant, tops, chain, bangles, necklace)",purity:"Kitne carat mein? 22KT, 18KT ya 9KT?",weight:"Approx weight kitne gram?",
  size:"Size kya rahega? (ring number, chain/MS/bracelet ke liye inch, kada ke liye aani)",design:"Ye hamare catalogue ka design hai (code ya photo bhejiye) ya naya design? \"catalogue\" ya \"naya\" likhiye.",
  summary:"Aapka order ye raha. Place kar doon?",yes:"✅ Haan, order karo",no:"✏️ Kuch change karna hai",
  placed:"✅ Order *#{ref}* register ho gaya. Karigar se confirm kar rahe hain, update yahin milega. Is piece ke liye *#{ref}* zaroor mention karein.",
  confirmed:"🏭 *#{ref}* confirm ho gaya. Expected dispatch: *{date}*.",
  cadReady:"✏️ *#{ref}* ka CAD ready hai. Approve kar dijiye taaki production start ho.",approve:"👍 CAD approve",change:"✏️ Change chahiye",
  cadOk:"👍 Approved. *#{ref}* ab production mein hai. Expected dispatch: *{date}*.",cadCh:"Theek hai, *#{ref}* ka naya CAD mangwa rahe hain.",
  dispatched:"📦 *#{ref}* QC pass karke aaj dispatch ho gaya.",delay:"⏳ *#{ref}* update: naya expected dispatch *{date}*. Der ke liye sorry 🙏",
  status:"*#{ref}* · {product}: {status}. {eta}",eta:"Expected dispatch {date}.",notFound:"Aapke account mein order #{ref} nahi mila.",
  list:"Aapke open orders:",none:"Abhi koi open order nahi hai.",
  didnt:"Sorry, samajh nahi aaya. Product, carat aur weight bataiye, jaise \"18KT bracelet 16 gram 7.5 inch\".",
  edit:"Zaroor, bataiye kya change karna hai (jaise \"size 17\" ya \"weight 6 gram\").",photo:"Photo mil gayi 👍 Ise naya design maan ke pehle CAD bana ke approval ke liye bhejenge.",
  F:{product:"Product",purity:"Purity",weight:"Weight",size:"Size",qty:"Qty",design:"Design",remarks:"Notes",priority:"Priority"},cat:"Catalogue",custom:"Naya design (pehle CAD)",urgent:"Urgent"},
 hi:{hi:"नमस्ते {name} जी! मैं Touch22 ऑर्डर असिस्टेंट हूँ 🙏 बताइए क्या चाहिए, जैसे \"22 कैरेट अंगूठी, साइज़ 16, 5 ग्राम\"। किसी भी ऑर्डर का स्टेटस उसके नंबर से पूछ सकते हैं।",
  product:"कौन सा प्रोडक्ट चाहिए? (अंगूठी, मंगलसूत्र, ब्रेसलेट, कड़ा, पेंडेंट, टॉप्स, चेन, चूड़ी, हार)",purity:"कितने कैरेट में? 22, 18 या 9 कैरेट?",weight:"लगभग वज़न कितने ग्राम?",
  size:"साइज़ क्या होगा? (अंगूठी का नंबर, चेन/मंगलसूत्र/ब्रेसलेट के लिए इंच, कड़े के लिए आनी)",design:"क्या यह हमारे कैटलॉग का डिज़ाइन है (कोड या फ़ोटो भेजें) या नया डिज़ाइन? \"कैटलॉग\" या \"नया\" लिखें।",
  summary:"आपका ऑर्डर यह है। क्या मैं ऑर्डर कर दूँ?",yes:"✅ हाँ, ऑर्डर करें",no:"✏️ कुछ बदलना है",
  placed:"✅ ऑर्डर *#{ref}* दर्ज हो गया। हम कारीगर से पुष्टि कर रहे हैं, अपडेट यहीं मिलेगा। इस पीस के बारे में बात करते समय *#{ref}* ज़रूर लिखें।",
  confirmed:"🏭 *#{ref}* कन्फ़र्म हो गया। अनुमानित डिस्पैच: *{date}*।",
  cadReady:"✏️ *#{ref}* का CAD तैयार है। कृपया अप्रूव करें ताकि प्रोडक्शन शुरू हो सके।",approve:"👍 CAD अप्रूव",change:"✏️ बदलाव चाहिए",
  cadOk:"👍 अप्रूव हो गया। *#{ref}* अब प्रोडक्शन में है। अनुमानित डिस्पैच: *{date}*।",cadCh:"ठीक है, *#{ref}* का नया CAD मँगवा रहे हैं।",
  dispatched:"📦 *#{ref}* क्वालिटी चेक में पास होकर आज डिस्पैच हो गया।",delay:"⏳ *#{ref}* अपडेट: नया अनुमानित डिस्पैच *{date}*। देरी के लिए क्षमा करें 🙏",
  status:"*#{ref}* · {product}: {status}। {eta}",eta:"अनुमानित डिस्पैच {date}।",notFound:"आपके खाते में ऑर्डर #{ref} नहीं मिला।",
  list:"आपके चालू ऑर्डर:",none:"अभी कोई चालू ऑर्डर नहीं है।",
  didnt:"माफ़ कीजिए, समझ नहीं आया। प्रोडक्ट, कैरेट और वज़न बताइए, जैसे \"18 कैरेट ब्रेसलेट 16 ग्राम 7.5 इंच\"।",
  edit:"ज़रूर, बताइए क्या बदलना है (जैसे \"साइज़ 17\" या \"वज़न 6 ग्राम\")।",photo:"फ़ोटो मिल गई 👍 इसे नया डिज़ाइन मानकर पहले CAD बनाकर आपको अप्रूवल के लिए भेजेंगे।",
  F:{product:"प्रोडक्ट",purity:"कैरेट",weight:"वज़न",size:"साइज़",qty:"मात्रा",design:"डिज़ाइन",remarks:"नोट",priority:"प्राथमिकता"},cat:"कैटलॉग",custom:"नया डिज़ाइन (पहले CAD)",urgent:"अर्जेंट"}
};
const PROD_HI={Ring:"अंगूठी",MS:"मंगलसूत्र",Bracelet:"ब्रेसलेट",Kada:"कड़ा",Pendant:"पेंडेंट",Earrings:"टॉप्स/झुमके",Necklace:"हार",Bangles:"चूड़ी",Chain:"चेन"};
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(_,k)=>v[k]??"");
const LANG_NAME={en:"English",hn:"Hinglish",hi:"Hindi"};
function detectLang(t,prev){
  if(/[ऀ-ॿ]/.test(t))return "hi";
  const s=t.toLowerCase();
  const hn=(s.match(/\b(chahiye|chaiye|bhai|hai|hain|ka|ki|ke|wala|wali|karo|kar|bhejo|bhej|jaldi|naya|nayi|kitne|kab|kya|haan|nahi|ho|raha|rahe|hu|hoon|ji|dena|mein|tak|theek)\b/g)||[]).length;
  const en=(s.match(/\b(need|want|please|the|with|and|like|around|for|order|can|you|of|is|yes|new|size)\b/g)||[]).length;
  if(hn>=1&&hn>=en)return "hn";
  if(en>=1)return "en";
  return prev||"en";
}
const devToLat=s=>s.replace(/[०-९]/g,d=>"०१२३४५६७८९".indexOf(d));
const PROD_RX=[["MS",/\b(ms|mangal ?sutra|mangalsutra)\b|मंगलसूत्र/],["Kada",/\bkad(a|aa|e)\b|कड़ा|कडा|कड़े/],["Bangles",/bangle|chudi|choodi|kangan|चूड़ी|चूडी|कंगन/],
 ["Bracelet",/bracelet|\bbct\b|ब्रेसलेट/],["Earrings",/ear ?rings?|\btops\b|jhumk|\bbali\b|बाली|झुमक|टॉप्स/],["Necklace",/necklace|\bhaar\b|हार|नेकलेस/],
 ["Pendant",/pendant|pendal|locket|लॉकेट|पेंडेंट/],["Ring",/\brings?\b|anguthi|angoothi|अंगूठी|अँगूठी|रिंग/],["Chain",/\bchain\b|चेन/]];
function parseMsg(raw,awaiting){
  const t=devToLat(raw);let s=" "+t.toLowerCase()+" ";const p={};
  const take=(rx,fn)=>{const m=s.match(rx);if(m){fn(m);s=s.replace(m[0]," ");return true;}return false;};
  const code=t.match(/\bT22-[A-Z]{2}-\d{3}\b/i); if(code){p.code=code[0].toUpperCase();p.design="Catalogue";s=s.replace(code[0].toLowerCase()," ");}
  s=s.replace(/\bt\s?\d{3,4}\b/g," ");
  take(/(\d{1,2})\s*(?:kt|k|karat|carat|ct|कैरेट|कैरट|कैरत)(?![a-z])/,m=>{const n=+m[1];if([22,18,14,9].includes(n))p.purity=n+"KT";});
  take(/(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams|gr|ग्राम)(?![a-z])/,m=>p.weight=+m[1]);
  take(/(?:size|saiz|साइज़|साइज)\s*:?\s*(\d+(?:\.\d+)?)\s*(inch|"|aani|आनी|इंच|no\.?|number)?/,m=>p.size=m[1]+(/inch|"|इंच/.test(m[2]||"")?"\"":/aani|आनी/.test(m[2]||"")?" aani":""))
   ||take(/(\d+(?:\.\d+)?)\s*(?:inch|inches|"|इंच)/,m=>p.size=m[1]+"\"")
   ||take(/(\d(?:\.\d+)?)\s*(?:aani|आनी)/,m=>p.size=m[1]+" aani")
   ||take(/(\d{1,2})\s*(?:no\.?|number|नंबर)(?![a-z])/,m=>p.size=m[1]);
  take(/(\d+)\s*(?:pc|pcs|piece|pieces|nos|nag|पीस|नग)(?![a-z])/,m=>p.qty=+m[1]);
  for(const [k,rx] of PROD_RX){if(rx.test(s)){p.product=k;break;}}
  if(!p.design){
    if(/new design|naya|nayi|naye|custom|apna design|own design|नया|नई|नये/.test(s)||/\bnew\b/.test(s))p.design="Custom";
    else if(/catalog|catalogue|katalog|same as|ready design|stock design|कैटलॉग|कैटलोग/.test(s))p.design="Catalogue";
  }
  if(/photo|pic\b|फ़ोटो|फोटो/.test(s)&&!p.design)p.design="Custom";
  if(/urgent|jaldi|asap|\bfast\b|जल्दी|अर्जेंट/.test(s))p.priority="Urgent";
  const rem=[];
  const R1=s.match(/(single|green|red|white|blue|pink|black)\s+stones?/);if(R1)rem.push(R1[0]);
  if(/हरे पत्थर|हरा पत्थर/.test(s))rem.push("green stone"); if(/लाल पत्थर/.test(s))rem.push("red stone");
  const R2=s.match(/evil ?eye|nazar/);if(R2)rem.push("evil eye");
  const R3=s.match(/rose gold|white gold|yellow finish\w*/);if(R3)rem.push(R3[0]);
  const R4=raw.match(/(['"‘’“”][A-Z]['"‘’“”])\s*(letter)?/i)||raw.match(/letter\s+['"]?([A-Z])\b/i);if(R4)rem.push("letter "+R4[0].replace(/letter/i,"").trim());
  const R5=raw.match(/name\s+(?:of\s+)?['"]?([A-Z][a-z]+)/i);if(R5)rem.push(`name "${R5[1]}"`);
  if(/\bcz\b/.test(s))rem.push("CZ"); if(/meena/.test(s))rem.push("meena work"); if(/openable/.test(s))rem.push("openable");
  if(/\bom\b|ॐ/.test(s))rem.push("OM symbol");
  if(rem.length)p.remarks=rem.join(", ");
  // bare answers to the last question
  const bare=t.trim().match(/^(\d+(?:\.\d+)?)\s*$/);
  if(bare&&awaiting){const n=+bare[1];
    if(awaiting==="purity"&&[22,18,14,9].includes(n))p.purity=n+"KT";
    else if(awaiting==="weight")p.weight=n;
    else if(awaiting==="size")p.size=String(n);}
  return p;
}
function conv(id){id=id||S.bot.cur;const c=S.bot.convs[id]||(S.bot.convs[id]={msgs:[],draft:null,await:null,lang:PERSONAS.find(p=>p.id===id).lang});return c;}
function bpush(id,m){conv(id).msgs.push(Object.assign({d:S.today,tm:nowT()},m));}
function missing(d){
  if(!d.product)return "product"; if(!d.purity)return "purity"; if(!d.weight)return "weight";
  if(!d.size&&SIZED.includes(d.product))return "size"; if(!d.design)return "design"; return null;
}
function summaryCard(d,lang){
  const T=TX[lang],F=T.F;
  const prod=lang==="hi"?(PROD_HI[d.product]||d.product):(PRODUCT_LABEL[d.product]||d.product);
  const rows=[[F.product,prod],[F.purity,d.purity],[F.weight,d.weight+" g"],d.size?[F.size,d.size]:null,[F.qty,d.qty||1],
   [F.design,d.design==="Custom"?T.custom:T.cat+(d.code?" · "+d.code:"")],d.remarks?[F.remarks,d.remarks]:null,d.priority==="Urgent"?[F.priority,"🔴 "+T.urgent]:null].filter(Boolean);
  return rows;
}
let botBusy=false;
function botSay(id,m,delay){
  botBusy=true;renderBotMsgs(true);
  later(()=>{botBusy=false;bpush(id,Object.assign({from:"bot"},m));save();renderBot();},delay??750);
}
function retailerSend(text,photo){
  const id=S.bot.cur,c=conv(id),P=PERSONAS.find(p=>p.id===id);
  if(photo){bpush(id,{from:"me",text:text||"",art:{p:(c.draft&&c.draft.product)||"Ring"}});}
  else{if(!text.trim())return;bpush(id,{from:"me",text});}
  save();renderBot();
  const lang=photo?c.lang:detectLang(text,c.lang);c.lang=lang;const T=TX[lang];
  if(photo){
    c.draft=c.draft||{qty:1,priority:"Default"};if(!c.draft.code)c.draft.design="Custom";c.draft.photo=true;
    const miss=missing(c.draft);c.await=miss||"confirm";
    return botSay(id,miss?{text:T.photo+"\n\n"+T[miss]}:{text:T.photo+"\n\n"+T.summary,card:summaryCard(c.draft,lang),btns:[{l:T.yes,a:"confirm"},{l:T.no,a:"edit"}]});
  }
  const s=text.toLowerCase();
  if(c.await==="confirm"){
    if(/^\s*(yes|y|yeah|ok|okay|haan|ha|han|confirm|place|done|ji|हाँ|हां|जी|ठीक)\b/i.test(s)||/^\s*(हाँ|हां|जी)/.test(text))return placeOrder(id);
    if(/^\s*(no|nahi|change|edit|nope|नहीं|बदल)/i.test(s)){c.await="edit";return botSay(id,{text:T.edit});}
  }
  const refm=text.match(/\bT\s?(\d{3,4})\b/i);
  if(refm&&!(c.draft&&c.await&&c.await!=="confirm")){
    const o=byRef("T"+refm[1]);
    if(!o||o.customer!==P.cust)return botSay(id,{text:fill(T.notFound,{ref:"T"+refm[1]})});
    return botSay(id,{text:statusLine(o,lang),art:o.status==="CAD Approval"?{p:o.product,cad:true}:null,btns:o.status==="CAD Approval"?[{l:T.approve,a:"cadApprove",ref:o.ref},{l:T.change,a:"cadChange",ref:o.ref}]:null});
  }
  if(!c.draft&&/status|kab tak|kab milega|kaha tak|update|कब|स्टेटस|my orders|mere order/.test(s)){
    const os=active().filter(o=>o.customer===P.cust);
    return botSay(id,{text:os.length?T.list+"\n"+os.map(o=>"• "+statusLine(o,lang)).join("\n"):T.none});
  }
  const p=parseMsg(text,c.await);
  const got=Object.keys(p).length;
  if(!got){
    if(/^\s*(hi|hello|hey|namaste|namaskar|नमस्ते|नमस्कार|jai jinendra|ram ram)/i.test(text))return botSay(id,{text:fill(T.hi,{name:P.contact})});
    return botSay(id,{text:c.await&&c.await!=="confirm"&&c.await!=="edit"?T[c.await]:T.didnt});
  }
  c.draft=Object.assign(c.draft||{qty:1,priority:"Default"},p);
  const miss=missing(c.draft);
  c.await=miss||"confirm";
  save();
  if(miss)return botSay(id,{text:T[miss]});
  botSay(id,{text:T.summary,card:summaryCard(c.draft,lang),btns:[{l:T.yes,a:"confirm"},{l:T.no,a:"edit"}]},950);
}
function statusLine(o,lang){
  const T=TX[lang];const st=STAGE_LBL[o.status]||o.status;
  const eta=["Completed","Cancelled","Dispatched","Enquiry"].includes(o.status)?"":fill(T.eta,{date:lang==="hi"?fmtHi(dispatchBy(o)):fmt(dispatchBy(o))});
  return fill(T.status,{ref:o.ref,product:lang==="hi"?(PROD_HI[o.product]||o.product):o.product,status:st,eta});
}
function placeOrder(id){
  const c=conv(id),P=PERSONAS.find(p=>p.id===id),d=c.draft,T=TX[c.lang];
  const ref="T"+S.nextRef++;
  const o={ref,date:S.today,customer:P.cust,product:d.product,purity:d.purity,weight:d.weight,size:d.size||"",qty:d.qty||1,remarks:d.remarks||"",
    priority:d.priority||"Default",design:d.design,code:d.code||"",factory:"",deadline:"",status:"Enquiry",hist:[],issues:[],lastFollow:null,fu:0,src:"WhatsApp bot",lang:c.lang,photo:!!d.photo};
  hist(o,`Order taken by the WhatsApp bot (${LANG_NAME[c.lang]}) from ${P.name}, ${P.city}. Number #${ref} given automatically`,"r");
  S.orders.push(o);
  log(`New order #${ref} from ${P.name} via WhatsApp bot (${LANG_NAME[c.lang]})`,ref);
  c.draft=null;c.await=null;
  bpush(id,{from:"bot",text:fill(T.placed,{ref})});
  const r=route(o);o.route={f:r.best.f,conf:r.conf,why:r.best.why,alts:r.alts.map(a=>a.f)};
  if(S.set.autoRoute&&r.conf==="high"){sendToFactory(o,r.best.f,true);hist(o,`Auto-routed to ${r.best.f}: ${r.best.why.join(", ")}`,"");toast(`<b>#${ref}</b> created and sent to ${esc(r.best.f)} automatically`);}
  else{toast(`<b>#${ref}</b> created. Pick a factory in To do (${r.best.f} or ${r.alts.map(a=>a.f).join(" / ")} look close)`);}
  save();renderAll();
}
function notify(o,key){
  const P=persona(o);
  if(!P){hist(o,`WhatsApp update sent to ${o.customer}`,"r");return;}
  const c=conv(P.id),T=TX[c.lang];const date=c.lang==="hi"?fmtHi(dispatchBy(o)):fmt(dispatchBy(o));
  const m={from:"bot",text:fill(T[key],{ref:o.ref,date})};
  if(key==="cadReady"){m.art={p:o.product,cad:true};m.btns=[{l:T.approve,a:"cadApprove",ref:o.ref},{l:T.change,a:"cadChange",ref:o.ref}];}
  bpush(P.id,m);hist(o,`Retailer updated on WhatsApp`,"r");
}
function botButton(id,i,a,ref){
  const c=conv(id);const m=c.msgs[i];if(!m||m.used)return;m.used=true;
  const lbl=m.btns.find(b=>b.a===a).l;
  bpush(id,{from:"me",text:lbl.replace(/^\S+\s/,"")});
  if(a==="confirm")return placeOrder(id);
  if(a==="edit"){c.await="edit";save();return botSay(id,{text:TX[c.lang].edit});}
  if(a==="cadApprove"){const o=byRef(ref);if(o&&o.status==="CAD Approval"){act(ref,"cadApprove");}save();renderBot();return;}
  if(a==="cadChange"){const o=byRef(ref);if(o&&o.status==="CAD Approval"){act(ref,"cadChange","make the stone slightly bigger");bpush(id,{from:"bot",text:fill(TX[c.lang].cadCh,{ref})});}save();renderBot();return;}
}

/* ---------- jewellery line art (stand-in for photos and CADs) ---------- */
function art(p,cad){
  const g=cad?"#3d5a80":"url(#gg)",bg=cad?"#f4f7fb":"#fbf7ef";
  const defs=`<defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dca4"/><stop offset=".5" stop-color="#c99a4e"/><stop offset="1" stop-color="#8a6420"/></linearGradient><pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#dbe4ef" stroke-width=".6"/></pattern></defs>`;
  const sw=cad?2:6, stone=cad?`fill="none" stroke="${g}" stroke-width="1.6"`:`fill="#2f8059" stroke="#1d5a3c" stroke-width="1"`;
  let body="";
  switch(p){
    case "Ring":body=`<ellipse cx="120" cy="100" rx="52" ry="40" fill="none" stroke="${g}" stroke-width="${cad?2:9}"/><ellipse cx="120" cy="100" rx="40" ry="30" fill="none" stroke="${g}" stroke-width="${cad?1.2:0}"/><path d="M104 62 L120 40 L136 62 L120 74Z" ${stone}/>`;break;
    case "Pendant":body=`<path d="M60 20 Q120 70 180 20" fill="none" stroke="${g}" stroke-width="${cad?1.5:3}" stroke-dasharray="${cad?"":"2 3"}"/><circle cx="120" cy="58" r="6" fill="none" stroke="${g}" stroke-width="3"/><path d="M120 150 C70 112 84 70 120 92 C156 70 170 112 120 150Z" fill="${cad?"none":"#f3dca4"}" stroke="${g}" stroke-width="${sw}"/><text x="120" y="126" text-anchor="middle" font-family="Times New Roman" font-size="30" fill="${cad?g:"#7a5a1e"}">P</text>`;break;
    case "MS":body=`<path d="M40 20 Q120 150 200 20" fill="none" stroke="#211316" stroke-width="5" stroke-dasharray="4 5"/><path d="M40 20 Q120 150 200 20" fill="none" stroke="${g}" stroke-width="${cad?1.5:2}"/><path d="M106 96 h28 l-14 40z" fill="${cad?"none":"#f3dca4"}" stroke="${g}" stroke-width="${cad?2:4}"/><circle cx="120" cy="112" r="4" ${stone}/>`;break;
    case "Bracelet":case "Chain":body=`<path d="M30 110 Q120 30 210 110" fill="none" stroke="${g}" stroke-width="${sw+4}" stroke-dasharray="14 4"/><rect x="104" y="58" width="32" height="18" rx="5" ${stone}/>`;break;
    case "Kada":case "Bangles":body=`<circle cx="${p==="Bangles"?105:120}" cy="95" r="58" fill="none" stroke="${g}" stroke-width="${cad?2:12}"/>${p==="Bangles"?`<circle cx="140" cy="95" r="58" fill="none" stroke="${g}" stroke-width="${cad?2:12}"/>`:`<circle cx="120" cy="37" r="7" ${stone}/>`}`;break;
    case "Earrings":body=`<g><circle cx="85" cy="50" r="7" fill="none" stroke="${g}" stroke-width="3"/><path d="M85 60 C60 100 70 140 85 150 C100 140 110 100 85 60Z" fill="${cad?"none":"#f3dca4"}" stroke="${g}" stroke-width="${sw-2}"/></g><g><circle cx="155" cy="50" r="7" fill="none" stroke="${g}" stroke-width="3"/><path d="M155 60 C130 100 140 140 155 150 C170 140 180 100 155 60Z" fill="${cad?"none":"#f3dca4"}" stroke="${g}" stroke-width="${sw-2}"/></g>`;break;
    default:body=`<path d="M30 25 Q120 165 210 25" fill="none" stroke="${g}" stroke-width="${sw+2}"/><path d="M60 60 l10 18 M90 88 l6 20 M120 98 v22 M150 88 l-6 20 M180 60 l-10 18" stroke="${g}" stroke-width="4"/>`;
  }
  const cadx=cad?`<rect width="240" height="170" fill="url(#grid)"/><path d="M60 160 H180 M60 156 v8 M180 156 v8" stroke="#3d5a80" stroke-width="1"/><text x="120" y="154" font-size="9" text-anchor="middle" fill="#3d5a80" font-family="monospace">CAD v1 · top view</text>`:"";
  return `<svg class="art" viewBox="0 0 240 170" role="img" aria-label="${cad?"CAD drawing":"Design photo"} of ${esc(p)}"><rect width="240" height="170" fill="${bg}"/>${defs}${cadx}${body}</svg>`;
}


/* ---------- interface ---------- */
const GROUPS=[
 {k:"new",l:"New",s:["Enquiry"],h:"Choose a factory"},
 {k:"fac",l:"At factory",s:["Awaiting Factory"],h:"Waiting for a reply"},
 {k:"cad",l:"Design",s:["CAD Making","CAD Approval"],h:"CAD and approval"},
 {k:"make",l:"Making",s:["In Production","Repair","Wrong Order"],h:"In production"},
 {k:"qc",l:"Quality check",s:["Ready at Factory","At Office · QC"],h:"Collect and check"},
 {k:"ship",l:"Shipped",s:["Dispatched"],h:"On the way"}];
const grpOf=s=>GROUPS.find(g=>g.s.includes(s));
const stCls=s=>isIssueS(s)?"issue":CLOSED.includes(s)?"done":(grpOf(s)||{}).k||"";
const isIssueS=s=>s==="Repair"||s==="Wrong Order";
const status=s=>`<span class="st ${stCls(s)}"><i></i>${esc(STAGE_LBL[s]||s)}</span>`;
const item=o=>`${o.product==="MS"?"Mangalsutra":o.product} · ${o.purity} · ${o.weight} g`;
const refBtn=r=>`<button class="ref" data-open="${r}" type="button">#${r}</button>`;
const ICON={
 overview:'<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 orders:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16M15 4v16"/>',
 chats:'<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z"/>',
 reports:'<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>'
};
const VIEWS=[["overview","Overview"],["orders","Orders"],["chats","Chats"],["reports","Reports"]];
let view="overview";
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

function todos(){
  const A=active();
  return {enq:S.orders.filter(o=>o.status==="Enquiry"),ready:A.filter(o=>o.status==="Ready at Factory"),qc:A.filter(o=>o.status==="At Office · QC"),
    cad:A.filter(o=>o.status==="CAD Approval"),due:followDue()};
}
function todoCount(t){return t.enq.length+t.ready.length+t.qc.length+t.cad.length+(t.due.length?1:0);}

function renderTabs(){
  const t=todos();const n=todoCount(t);
  $("#tabs").innerHTML=VIEWS.map(([k,l])=>`<a href="#${k}" class="${view===k?"on":""}">${svg(k)}<span>${l}</span>${k==="overview"&&n?`<span class="n">${n}</span>`:""}</a>`).join("");
  $("#todayLbl").textContent=fmtL(S.today);
}
function renderAll(){
  renderTabs();
  ({overview:renderOverview,orders:renderOrders,chats:renderChats,reports:renderReports})[view]();
  if(drawerRef)renderDrawer();
}

/* Overview */
function renderOverview(){
  const A=active(),t=todos(),n=todoCount(t);
  const late=A.filter(isOver).sort((a,b)=>lateBy(b)-lateBy(a));
  const recent=S.orders.filter(o=>o.readyAt&&o.readyAt<=S.today&&diff(S.today,o.readyAt)<=30&&o.deadline);
  const ot=recent.length?recent.filter(o=>o.readyAt<=o.deadline).length/recent.length:0;
  const hr=new Date().getHours();const hello=hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const facBy={};t.due.forEach(o=>facBy[o.factory]=(facBy[o.factory]||0)+1);
  const rows=[];
  if(t.due.length)rows.push(`<div class="r-item"><div class="r-ic gold">🔔</div><div class="r-body"><b>Send today's follow-ups</b><div class="s">${t.due.length} order${t.due.length>1?"s":""} at ${Object.keys(facBy).length} factor${Object.keys(facBy).length>1?"ies":"y"} · one numbered message per factory</div></div><div class="r-act"><button class="btn primary sm" id="sendAll" type="button">Send all</button></div></div>`);
  t.enq.forEach(o=>{const r=route(o);rows.push(`<div class="r-item"><div class="r-ic">🆕</div><div class="r-body"><b>Choose a factory for ${refBtn(o.ref)}</b>${o.priority==="Urgent"?' <span class="tag urgent">Urgent</span>':""}<div class="s">${esc(o.customer)} · ${item(o)}${o.design==="Custom"?" · new design":""} · suggested ${r.best.f} (${r.best.why[0]==null?"":esc(r.best.why.find(w=>w.includes("on time"))||"")})</div></div><div class="r-act"><select class="sel" data-fsel="${o.ref}" aria-label="Factory">${r.all.map(a=>`<option ${a.f===r.best.f?"selected":""}>${a.f}</option>`).join("")}</select><button class="btn primary sm" data-send="${o.ref}" type="button">Send</button></div></div>`);});
  t.qc.forEach(o=>rows.push(`<div class="r-item"><div class="r-ic">🔍</div><div class="r-body"><b>Check ${refBtn(o.ref)}</b><div class="s">${esc(o.customer)} · ${item(o)}${o.size?" · size "+esc(o.size):""} · from ${o.factory}</div></div><div class="r-act"><button class="btn good sm" data-act="qcpass" data-ref="${o.ref}" type="button">Pass, ship it</button><button class="btn danger sm" data-problem="${o.ref}" type="button">Problem</button></div></div>`));
  t.ready.forEach(o=>rows.push(`<div class="r-item"><div class="r-ic ok">📦</div><div class="r-body"><b>Collect ${refBtn(o.ref)} from ${o.factory}</b><div class="s">${esc(o.customer)} · ${item(o)}</div></div><div class="r-act"><button class="btn sm" data-act="receive" data-ref="${o.ref}" type="button">Received</button></div></div>`));
  t.cad.forEach(o=>rows.push(`<div class="r-item"><div class="r-ic gold">✏️</div><div class="r-body"><b>CAD waiting for approval, ${refBtn(o.ref)}</b><div class="s">${esc(o.customer)} · sent on WhatsApp</div></div><div class="r-act"><button class="btn sm" data-act="cadApprove" data-ref="${o.ref}" type="button">Approved</button></div></div>`));
  $("#v-overview").innerHTML=`
  <div class="page-head"><div><h1>${hello}</h1><p>${fmtL(S.today)} · ${A.length} orders in progress</p></div></div>
  <div class="stats">
    <button class="stat hl" data-scroll="todo" type="button"><div class="l">Needs you today</div><div class="v">${n}</div><div class="h">Tasks in your to-do list</div></button>
    <button class="stat" data-go="orders" type="button"><div class="l">In progress</div><div class="v">${A.length}</div><div class="h">${A.filter(o=>o.priority==="Urgent").length} urgent</div></button>
    <button class="stat ${late.length?"bad":""}" data-go="orders:late" type="button"><div class="l">Running late</div><div class="v">${late.length}</div><div class="h">Past the factory's deadline</div></button>
    <button class="stat" data-go="reports" type="button"><div class="l">Ready on time</div><div class="v">${pct(ot)}</div><div class="h">Last 30 days, all factories</div></button>
  </div>
  <div class="strip">${GROUPS.map(g=>{const c=S.orders.filter(o=>g.s.includes(o.status)).length;return `<button data-go="orders" type="button"><div class="n">${c}</div><div class="l"><span class="st ${g.k}"><i></i></span>${g.l}</div><div class="s">${g.h}</div></button>`;}).join("")}</div>
  <div class="cols">
    <div class="card" id="todo"><div class="card-t"><h2>To do</h2><span class="tag soft">${n}</span></div>
      <div class="rows">${rows.join("")||'<div class="empty"><span class="ic">✨</span>All done for today. Press <b>Next day</b> to move on.</div>'}</div></div>
    <div class="grid">
      <div class="card"><div class="card-t"><h2>Running late</h2>${late.length?`<span class="tag late">${late.length}</span>`:""}</div>
        <div class="rows">${late.slice(0,6).map(o=>`<div class="r-item"><div class="r-body"><b>${refBtn(o.ref)} · ${o.factory}</b><div class="s">${esc(o.customer)} · ${o.product}${o.revised?" · factory says "+fmt(o.revised):""}</div></div><span class="tag late">${lateBy(o)}d late</span></div>`).join("")||'<div class="empty">Nothing late 🎉</div>'}</div>
        ${late.length>6?`<button class="btn link" data-go="orders:late" type="button">See all ${late.length} →</button>`:""}</div>
      <div class="card"><div class="card-t"><h2>Latest updates</h2></div>
        <div class="rows">${S.log.slice(0,5).map(l=>`<div class="r-item"><div class="r-body small">${l.ref&&l.t.includes("#"+l.ref)?esc(l.t).replace("#"+l.ref,refBtn(l.ref)):esc(l.t)}<div class="s">${l.d===S.today?"Today "+l.tm:fmt(l.d)}</div></div></div>`).join("")}</div></div>
    </div>
  </div>`;
}

/* Orders */
let oMode="board",oQ="",oFac="",oQuick="",oDone=false;
function ordersFiltered(includeDone){
  let os=S.orders.filter(o=>includeDone?true:!CLOSED.includes(o.status));
  if(oFac)os=os.filter(o=>o.factory===oFac);
  if(oQuick==="late")os=os.filter(isOver);
  if(oQuick==="urgent")os=os.filter(o=>o.priority==="Urgent");
  if(oQ){const q=oQ.toLowerCase();os=os.filter(o=>[o.ref,o.customer,o.factory,o.product,o.remarks,o.purity].join(" ").toLowerCase().includes(q));}
  return os;
}
function dueCell(o){
  if(CLOSED.includes(o.status)||!o.deadline||!WITH_FACTORY.includes(o.status))return `<span>${o.deadline?"due "+fmt(o.deadline):""}</span>`;
  const lb=lateBy(o);
  if(lb>0)return `<span class="late">${lb}d late</span>`;
  if(lb>=-2)return `<span class="soon">due ${lb===0?"today":fmt(dueDate(o))}</span>`;
  return `<span>due ${fmt(dueDate(o))}</span>`;
}
function renderOrders(){
  const keep=document.activeElement&&document.activeElement.id==="oq";
  const os=ordersFiltered(oMode==="list"&&oDone);
  const tb=`<div class="toolbar">
    <input class="search" id="oq" type="search" placeholder="Search order, customer, product…" value="${esc(oQ)}" aria-label="Search orders">
    <select class="sel" id="ofac" aria-label="Factory"><option value="">All factories</option>${FACTORIES.map(f=>`<option ${oFac===f.name?"selected":""}>${f.name}</option>`).join("")}</select>
    <button class="chip ${oQuick==="late"?"on":""}" data-quick="late" type="button">Running late</button>
    <button class="chip ${oQuick==="urgent"?"on":""}" data-quick="urgent" type="button">Urgent</button>
    ${oMode==="list"?`<button class="chip ${oDone?"on":""}" id="oDone" type="button">Include delivered</button>`:""}
    <span class="muted small" style="margin-left:auto">${os.length} order${os.length===1?"":"s"}</span>
  </div>`;
  let body;
  if(oMode==="board"){
    body=`<div class="board">${GROUPS.map(g=>{const cs=os.filter(o=>g.s.includes(o.status)).sort((a,b)=>(lateBy(b)||0)-(lateBy(a)||0)||(a.priority==="Urgent"?-1:1));
      return `<div class="col"><div class="col-h"><span class="st ${g.k}"><i></i>${g.l}</span><span class="c">${cs.length}</span></div><div class="col-b">${cs.map(o=>`<button class="oc" data-open="${o.ref}" type="button">
        <div class="t"><span class="ref">#${o.ref}</span>${o.priority==="Urgent"?'<span class="tag urgent">Urgent</span>':""}${isIssueS(o.status)?`<span class="tag late">${o.status==="Repair"?"Repair":"Remake"}</span>`:""}${o.design==="Custom"&&g.k==="new"?'<span class="tag new">New design</span>':""}</div>
        <div class="c">${esc(o.customer)}</div><div class="i">${item(o)}</div>
        <div class="f"><span>${esc(o.factory||"No factory yet")}</span>${dueCell(o)}</div></button>`).join("")||'<div class="empty">Nothing here</div>'}</div></div>`;}).join("")}</div>`;
  } else {
    const sorted=os.slice().sort((a,b)=>CLOSED.includes(a.status)-CLOSED.includes(b.status)||(lateBy(b)||-99)-(lateBy(a)||-99));
    body=`<div class="tbl"><table><thead><tr><th>Order</th><th>Customer</th><th>Item</th><th>Factory</th><th>Due</th><th>Status</th></tr></thead><tbody>
      ${sorted.map(o=>`<tr data-open="${o.ref}"><td><span class="ref">#${o.ref}</span> ${o.priority==="Urgent"?'<span class="tag urgent">Urgent</span>':""}</td><td>${esc(o.customer)}</td><td>${item(o)}</td><td>${esc(o.factory||"–")}</td><td>${dueCell(o)}</td><td>${status(o.status)}</td></tr>`).join("")}
      </tbody></table>${!sorted.length?'<div class="empty">No orders match.</div>':""}</div>`;
  }
  $("#v-orders").innerHTML=`<div class="page-head"><div><h1>Orders</h1><p>Every order keeps one number from the first message to delivery.</p></div>
    <div class="right"><div class="seg"><button class="${oMode==="board"?"on":""}" data-omode="board" type="button">Board</button><button class="${oMode==="list"?"on":""}" data-omode="list" type="button">List</button></div><button class="btn sm" id="csv" type="button">Export to Sheets</button></div></div>${tb}${body}`;
  if(keep){const i=$("#oq");i.focus();i.setSelectionRange(i.value.length,i.value.length);}
}

/* Chats */
let cMode="r",cId="parekh",cFac="Mars",cRef="",cOpen=false;
function renderBot(){if(view==="chats")renderChats();}
function msgHTML(m,i,kind){
  if(m.from==="sys")return `<div class="m sys">${esc(m.text)}</div>`;
  const out=kind==="r"?m.from==="me":m.from==="t22";
  const sum=m.card?`<div class="sum">${m.card.map(([k,v])=>`<span>${esc(k)}</span><b>${esc(v)}</b>`).join("")}</div>`:"";
  const btns=m.btns?`<div class="btns">${m.btns.map(b=>`<button type="button" data-bb="${i}" data-a="${b.a}" data-ref="${b.ref||""}" ${m.used?"disabled":""}>${esc(b.l)}</button>`).join("")}</div>`:"";
  const who=kind==="f"&&m.from==="fac"?`<span class="who">${esc(cFac)}</span>`:"";
  const rf=kind==="f"&&m.ref?`<button class="rf" data-open="${m.ref}" type="button">#${m.ref}</button><br>`:"";
  return `<div class="m ${out?"out":""}">${who}${rf}${m.art?art(m.art.p,m.art.cad):""}${wa(m.text)}${sum}<span class="tm">${m.tm}${out?" ✓✓":""}</span>${btns}</div>`;
}
function withDays(list,fn){let d="";return list.map((m,i)=>{let h="";if(m.d!==d){d=m.d;h=`<div class="m day">${fmtL(m.d)}</div>`;}return h+fn(m,i);}).join("");}
function renderBotMsgs(typing){
  if(view!=="chats"||cMode!=="r")return;const box=$("#msgs");if(!box)return;
  const c=conv(cId);
  box.innerHTML=withDays(c.msgs,(m,i)=>msgHTML(m,i,"r"))+((typing||botBusy)?'<div class="typing"><i></i><i></i><i></i></div>':"");
  box.scrollTop=box.scrollHeight;
}
function renderChats(){
  const P=PERSONAS.find(p=>p.id===cId);
  if(cMode==="r"){const c=conv(cId);if(!c.msgs.length){bpush(cId,{from:"bot",text:fill(TX[c.lang].hi,{name:P.contact})});save();}}
  const list=cMode==="r"?PERSONAS.map(p=>{const c=S.bot.convs[p.id];const lm=c&&c.msgs[c.msgs.length-1];
      return `<button class="c-item ${p.id===cId?"on":""}" data-chat="${p.id}" type="button"><span class="av">${p.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</span><span class="nm"><b>${p.name}</b><span>${lm?esc(lm.text.replace(/\*/g,"").split("\n")[0]):p.city+" · "+LANG_NAME[p.lang]}</span></span></button>`;}).join("")
    :FACTORIES.map(f=>{const n=active().filter(o=>o.factory===f.name).length;const ch=S.fchat[f.name]||[];const lm=ch[ch.length-1];
      return `<button class="c-item ${f.name===cFac?"on":""}" data-chat="${f.name}" type="button"><span class="av f">${f.name[0]}</span><span class="nm"><b>${f.name}</b><span>${lm?esc(lm.text.replace(/\*/g,"").split("\n")[0]):"No messages yet"}</span></span><span class="cnt">${n} open</span></button>`;}).join("");
  let head,msgs,foot;
  if(cMode==="r"){
    const myOpen=active().filter(o=>o.customer===P.cust);
    const sRef=(myOpen.find(o=>o.status==="In Production")||myOpen[0]||{}).ref;
    const SAMPLES=[["English order","Hi, need a 22KT ring, size 16, around 5 gm, single stone like T22-RG-207. Urgent please"],
      ["Hinglish order","Bhai ek 18KT bracelet chahiye 7.5 inch, 16 gram, green stone wala. Naya design hai, photo bhej raha hu"],
      ["हिंदी order","मुझे 22 कैरेट का मंगलसूत्र चाहिए, 18 इंच, लगभग 10 ग्राम, 2 पीस"]];
    if(sRef)SAMPLES.push(["Ask status",`${sRef} ka status kya hai?`]);
    head=`<span class="av"><img src="img/mono-light.png" alt=""></span><div><b>${P.name}</b><span>${P.city} · talking to the Touch22 order bot</span></div><div class="r"><button class="btn link" id="clearChat" type="button">Clear</button></div>`;
    msgs=withDays(conv(cId).msgs,(m,i)=>msgHTML(m,i,"r"));
    foot=`<div class="chips"><span class="lbl">Try:</span>${SAMPLES.map(([l,t])=>`<button class="chip" data-sample="${esc(t)}" type="button" title="${esc(t)}">${l}</button>`).join("")}</div>
      <form class="compose" id="botForm"><button class="att" type="button" id="botPhoto" title="Send a design photo" aria-label="Send a design photo"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.5 12.6 21a6 6 0 0 1-8.5-8.5l8.5-8.4a4 4 0 0 1 5.7 5.6l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8"/></svg></button><input id="botIn" autocomplete="off" placeholder="Type as ${esc(P.name)} (English, हिंदी or Hinglish)…" aria-label="Message"><button class="send" type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg></button></form>`;
  } else {
    const os=active().filter(o=>o.factory===cFac);
    const pend=os.filter(o=>WITH_FACTORY.includes(o.status));
    const ch=S.fchat[cFac]||[];
    const shown=cRef?ch.filter(m=>m.ref===cRef||(m.refs||[]).includes(cRef)):ch.slice(-50);
    const sel=pend.find(o=>o.ref===cRef)?cRef:(pend[pend.length-1]||{}).ref;
    const so=sel&&byRef(sel);
    const qb=so?(so.status==="Awaiting Factory"?[["accept","✅ Accept"],["acceptLate","📅 Accept, 3 days later"],["reject","❌ Can't make"]]:so.status==="CAD Making"?[["cad","✏️ Send CAD"]]:[["ready","✅ Ready"],["delay","⏳ 3 days late"],["ontrack","👍 On track"]]):[];
    head=`<span class="av f">${cFac[0]}</span><div><b>${cFac}</b><span>${FAC[cFac].cats.join(", ")} · ${os.length} open orders</span></div><div class="r"><select class="sel" id="cRef" aria-label="Show one order"><option value="">All orders</option>${os.map(o=>`<option value="${o.ref}" ${cRef===o.ref?"selected":""}>#${o.ref} only</option>`).join("")}</select></div>`;
    msgs=withDays(shown,(m,i)=>msgHTML(m,i,"f"))||'<div class="m sys">No messages yet.</div>';
    foot=(pend.length?`<div class="chips"><span class="lbl">Reply as ${cFac} for</span><select class="sel" id="simRef">${pend.map(o=>`<option value="${o.ref}" ${o.ref===sel?"selected":""}>#${o.ref}</option>`).join("")}</select>${qb.map(([k,l])=>`<button class="chip" data-sim="${k}" type="button">${l}</button>`).join("")}</div>`:"")+
      `<form class="compose" id="facForm"><input id="facIn" autocomplete="off" placeholder="Or type as ${cFac}, e.g. “${sel||"T430"} ready” or “${sel||"T430"} 3 din”" aria-label="Factory reply"><button class="send" type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg></button></form>`;
  }
  $("#v-chats").innerHTML=`<div class="page-head"><div><h1>Chats</h1><p>WhatsApp, simulated. Retailers order with the bot; each factory gets one clear, numbered message per order.</p></div></div>
  <div class="chat-wrap ${cOpen?"open":""}">
    <div class="c-list"><div class="seg"><button class="${cMode==="r"?"on":""}" data-cmode="r" type="button">Retailers</button><button class="${cMode==="f"?"on":""}" data-cmode="f" type="button">Factories</button></div><div class="c-items">${list}</div></div>
    <div class="c-main"><div class="c-head"><button class="icon-btn c-back" id="cBack" type="button" aria-label="Back">←</button>${head}</div><div class="msgs" id="msgs">${msgs}</div><div class="c-foot">${foot}</div></div>
  </div>`;
  if(cMode==="r")renderBotMsgs();else{const b=$("#msgs");b.scrollTop=b.scrollHeight;}
}

/* Reports */
function renderReports(){
  const st=FACTORIES.map(f=>facStats(f.name)).filter(s=>s.total).sort((a,b)=>b.total-a.total);
  const fromD=S.orders.reduce((m,o)=>o.date<m?o.date:m,S.today);
  const rate=s=>s.done<3?["soft","New"]:s.onTime>=.75&&s.issueRate<.1?["good","Reliable"]:s.onTime>=.55?["watch","Watch"]:["bad","Often late"];
  const col={good:"var(--ok)",watch:"var(--warn)",bad:"var(--bad)",soft:"var(--line-2)"};
  const cats=PRODUCTS.map(p=>{const os=S.orders.filter(o=>o.product===p);const c=os.filter(o=>o.design==="Custom").length;return {p,n:os.length,c,k:os.length-c,share:os.length?c/os.length:0};}).filter(x=>x.n).sort((a,b)=>b.share-a.share);
  const THEMES=[["Names & letters",/name|letter|'[A-Z]'|"[A-Z]"/i],["Coloured stones",/red stone|green stone|green|red/i],["Evil eye",/evil|nazar/i],["OM / religious",/\bom\b|OM/],["Rose / white gold",/rose gold|white gold/i],["Special settings",/channel|jaguar|meena|chappai|jhali|bulgari|press chain|heart/i]];
  const cust=S.orders.filter(o=>o.design==="Custom");
  const th=THEMES.map(([l,rx])=>({l,n:cust.filter(o=>rx.test(o.remarks)).length})).sort((a,b)=>b.n-a.n);
  const thMax=Math.max(...th.map(t=>t.n),1);
  const best=st.filter(s=>s.done>=5).sort((a,b)=>b.onTime-a.onTime)[0];
  const mars=st.find(s=>s.name==="Mars");
  const top=cats[0];
  $("#v-reports").innerHTML=`<div class="page-head"><div><h1>Reports</h1><p>Since ${fmt(fromD)} · ${S.orders.length} orders</p></div></div>
  <div class="two" style="margin-bottom:18px">
    <div class="insight"><span class="k">Factories</span><b>Mars</b> gets most orders (${mars?mars.total:0} of ${S.orders.length}) but has only <b>${mars?pct(mars.onTime):"–"}</b> ready on time. ${best?`<b>${best.name}</b> is at <b>${pct(best.onTime)}</b>; giving it more urgent orders would cut the late list.`:""}</div>
    <div class="insight"><span class="k">Custom designs</span><b>${top?(top.p==="MS"?"Mangalsutras":top.p+"s"):""}</b> go custom ${top?pct(top.share):""} of the time. The most asked-for change is <b>${th[0].l.toLowerCase()}</b> (${th[0].n} orders): a good candidate for ready-made CAD templates.</div>
  </div>
  <div class="card" style="margin-bottom:18px"><div class="card-t"><h2>Factory performance</h2><div class="sub">How often each factory has the piece ready by the date it agreed.</div></div>
    <div class="fgrid">${st.map(s=>{const [k,l]=rate(s);return `<div class="fc"><div class="h"><b>${s.name}</b><span class="tag ${k}">${l}</span></div>
      <div class="big">${s.done>=3?pct(s.onTime):"–"}<small>${s.done>=3?"on time":"too few finished orders"}</small></div><div class="meter"><i style="width:${s.done>=3?Math.round(s.onTime*100):0}%;background:${col[k]}"></i></div>
      <dl><dt>Orders</dt><dd>${s.total}</dd><dt>Open now</dt><dd>${s.open}${s.overdue?` <span style="color:var(--bad)">(${s.overdue} late)</span>`:""}</dd><dt>When late, by</dt><dd>${s.late?s.avgLate.toFixed(1)+" days":"–"}</dd><dt>Repairs / remakes</dt><dd>${s.repair} / ${s.wrong}</dd><dt>Replies in</dt><dd>${s.reply!=null?"~"+Math.round(s.reply)+" h":"–"}</dd></dl></div>`;}).join("")}</div>
  </div>
  <div class="two">
    <div class="card"><div class="card-t"><h2>Which categories go custom</h2><div class="sub">Share of orders that needed a new design (CAD).</div></div>
      <div class="bars">${cats.map(c=>`<div class="bar-row"><span class="nm">${c.p==="MS"?"Mangalsutra":c.p}</span><div class="track">${c.c?`<i style="width:${(c.share*100).toFixed(1)}%;background:var(--c-custom)" data-tip="${c.p}: ${c.c} new designs"></i>`:""}${c.k?`<i style="width:${((1-c.share)*100).toFixed(1)}%;background:var(--c-cat)" data-tip="${c.p}: ${c.k} catalogue"></i>`:""}</div><span class="v">${pct(c.share)} of ${c.n}</span></div>`).join("")}</div>
      <div class="legend"><span><i style="background:var(--c-custom)"></i>New design</span><span><i style="background:var(--c-cat)"></i>Catalogue</span></div></div>
    <div class="card"><div class="card-t"><h2>What retailers customise</h2><div class="sub">From the notes on ${cust.length} custom orders.</div></div>
      <div class="bars">${th.map(t=>`<div class="bar-row" style="grid-template-columns:130px 1fr 36px"><span class="nm">${t.l}</span><div class="track"><i style="width:${(t.n/thMax*100).toFixed(1)}%;background:var(--c-cat)" data-tip="${esc(t.l)}: ${t.n} orders"></i></div><span class="v">${t.n}</span></div>`).join("")}</div></div>
  </div>`;
}

/* Order panel */
let drawerRef=null,issueForm=null;
function openDrawer(ref){drawerRef=ref;issueForm=null;renderDrawer();$("#drawer").classList.add("on");$("#scrim").classList.add("on");}
function closeDrawer(){drawerRef=null;$("#drawer").classList.remove("on");$("#scrim").classList.remove("on");}
function renderDrawer(){
  const o=byRef(drawerRef);if(!o)return closeDrawer();
  const gs=GROUPS.filter(g=>g.k!=="cad"||o.design==="Custom");
  const gi=CLOSED.includes(o.status)?gs.length:gs.indexOf(grpOf(o.status));
  const issue=isIssueS(o.status);
  const lb=lateBy(o);
  const sim=l=>`<span class="small muted" style="align-self:center">Demo:</span>${l}`;
  let q="",h="",a="";
  switch(o.status){
    case "Enquiry":{const r=route(o);q="Which factory should make this?";h=`Suggested: <b>${r.best.f}</b>, ${esc(r.best.why.join(", "))}.`;
      a=`<select class="sel" data-fsel="${o.ref}" aria-label="Factory">${r.all.map(x=>`<option ${x.f===r.best.f?"selected":""}>${x.f}</option>`).join("")}</select><button class="btn primary" data-send="${o.ref}" type="button">Send to factory</button>`;break;}
    case "Awaiting Factory":q=`Waiting for ${o.factory} to confirm`;h="If there's no reply by tomorrow, a reminder goes out automatically.";a=sim(`<button class="btn sm" data-dsim="accept" type="button">Factory accepts</button><button class="btn sm danger" data-dsim="reject" type="button">Factory can't</button>`);break;
    case "CAD Making":q=`${o.factory} is making the CAD`;h="It goes to the retailer for approval as soon as it arrives.";a=sim(`<button class="btn sm" data-dsim="cad" type="button">Factory sends CAD</button>`);break;
    case "CAD Approval":q="Waiting for the retailer to approve the CAD";h="Sent on WhatsApp with Approve / Change buttons.";a=`<button class="btn good" data-act="cadApprove" data-ref="${o.ref}" type="button">Retailer approved</button><button class="btn" data-act="cadChange" data-ref="${o.ref}" type="button">Wants a change</button>`;break;
    case "In Production":case "Repair":case "Wrong Order":
      q=issue?`Back at ${o.factory}: ${o.status==="Repair"?"repair":"remake"}${o.issues.length?" ("+esc(o.issues[o.issues.length-1].reason.toLowerCase())+")":""}`:`Being made at ${o.factory}`;
      h=lb>0?`<b style="color:var(--bad)">${lb} day${lb>1?"s":""} late.</b>${o.revised?" Factory now says "+fmt(o.revised)+".":""}`:`Due ${fmtL(dueDate(o))}${lb<=0?` (${-lb===0?"today":-lb+" days left"})`:""}. Follow-ups go out automatically.`;
      a=`<button class="btn" data-fu1="${o.ref}" type="button">Send follow-up now</button>`+sim(`<button class="btn sm" data-dsim="ready" type="button">Ready</button><button class="btn sm" data-dsim="delay" type="button">3 days late</button>`);break;
    case "Ready at Factory":q=`Ready at ${o.factory}`;h="Collect the piece and bring it to the office for checking.";a=`<button class="btn primary" data-act="receive" data-ref="${o.ref}" type="button">Received at office</button>`;break;
    case "At Office · QC":q="Check the piece";h=`Does it match the order? ${item(o)}${o.size?", size "+esc(o.size):""}${o.remarks?", "+esc(o.remarks):""}.`;
      a=issueForm?`<span class="small" style="align-self:center"><b>${issueForm==="Repair"?"What needs fixing?":"What's wrong?"}</b></span>${ISSUE_REASONS[issueForm].map(x=>`<button class="btn sm danger" data-ireason="${esc(x)}" type="button">${x}</button>`).join("")}<button class="btn link" data-issue="" type="button">Back</button>`
        :`<button class="btn primary" data-act="qcpass" data-ref="${o.ref}" type="button">Pass, ship it</button><button class="btn danger" data-issue="Repair" type="button">Needs repair</button><button class="btn danger" data-issue="Wrong Order" type="button">Wrong order</button>`;break;
    case "Dispatched":q="On the way to the retailer";h="The retailer got a WhatsApp update.";a=`<button class="btn" data-act="delivered" data-ref="${o.ref}" type="button">Mark delivered</button>`;break;
    case "Completed":q=`Delivered${o.doneAt?" on "+fmtL(o.doneAt):""}`;h=o.readyAt&&o.deadline?(o.readyAt<=o.deadline?`${o.factory} had it ready on time.`:`${o.factory} was ${diff(o.readyAt,o.deadline)} days late.`):"";break;
    case "Cancelled":q="Cancelled";break;
  }
  const fmsgs=(S.fchat[o.factory]||[]).filter(m=>m.ref===o.ref||(m.refs||[]).includes(o.ref));
  $("#drawer").innerHTML=`<div class="d-head"><div><div class="small muted">Order</div><h2>#${o.ref}</h2><div class="sub">${status(o.status)}${o.priority==="Urgent"?'<span class="tag urgent">Urgent</span>':""}${isOver(o)?`<span class="tag late">${lb}d late</span>`:""}</div></div><button class="icon-btn x" id="dClose" type="button" aria-label="Close">×</button></div>
  <div class="d-body">
    ${o.status!=="Cancelled"?`<div><div class="prog">${gs.map((g,i)=>`<i class="${i<gi?"on":i===gi?(issue?"bad":"cur"):""}"></i>`).join("")}</div><div class="prog-l">${gs.map((g,i)=>`<span class="${i===gi?"on":""}">${g.l}</span>`).join("")}</div></div>`:""}
    <div class="next"><div class="q">${q}</div>${h?`<div class="h">${h}</div>`:""}${a?`<div class="a">${a}</div>`:""}</div>
    <div class="det">
      <div><span>Customer</span><b>${esc(o.customer)}</b></div><div><span>Factory</span><b>${esc(o.factory||"Not chosen yet")}</b></div>
      <div><span>Item</span><b>${o.product==="MS"?"Mangalsutra":o.product} · ${o.purity}</b></div><div><span>Weight</span><b>about ${o.weight} g</b></div>
      <div><span>Size</span><b>${esc(o.size||"–")}</b></div><div><span>Quantity</span><b>${o.qty}</b></div>
      <div><span>Design</span><b>${o.design==="Custom"?"New design (CAD)":"Catalogue"}${o.code?" · "+o.code:""}</b></div><div><span>Factory deadline</span><b>${o.deadline?fmt(o.deadline):"–"}${o.revised&&!CLOSED.includes(o.status)?` → ${fmt(o.revised)}`:""}</b></div>
      <div><span>Ordered</span><b>${fmt(o.date)} via ${esc(o.src)}</b></div>
      ${o.remarks?`<div class="w"><span>Notes</span><b>${esc(o.remarks)}</b></div>`:""}
    </div>
    ${o.factory?`<details><summary>Message sent to ${o.factory}</summary><div><pre class="wa">${wa(factoryMsg(o))}</pre></div></details>`:""}
    ${fmsgs.length?`<details><summary>Factory chat for this order <span class="tag soft">${fmsgs.length}</span></summary><div><div class="msgs" style="max-height:260px;border-radius:12px;padding:12px">${fmsgs.slice(-6).map(m=>`<div class="m ${m.from==="t22"?"out":""}">${m.art?art(m.art.p,m.art.cad):""}${wa(m.text.length>240?m.text.slice(0,240)+"…":m.text)}<span class="tm">${fmt(m.d)} ${m.tm}</span></div>`).join("")}</div></div></details>`:""}
    <details><summary>History <span class="tag soft">${o.hist.length}</span></summary><div><ul class="tl">${[...o.hist].reverse().map(x=>`<li><time>${fmt(x.d)}</time><span>${esc(x.t)}</span></li>`).join("")}</ul></div></details>
    ${!CLOSED.includes(o.status)?`<div style="display:flex;gap:4px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:12px"><button class="btn link" data-act="urgent" data-ref="${o.ref}" type="button">${o.priority==="Urgent"?"Remove urgent":"Mark urgent"}</button>${WITH_FACTORY.includes(o.status)?`<button class="btn link" data-act="reroute" data-ref="${o.ref}" type="button">Change factory</button>`:""}<button class="btn link" data-act="cancel" data-ref="${o.ref}" type="button" style="margin-left:auto">Cancel order</button></div>`:""}
  </div>`;
}

/* Help */
function openHelp(){
  $("#help").innerHTML=`<div class="box"><h2 id="helpT">How this demo works</h2>
    <p class="muted">Everything is simulated in your browser: no WhatsApp messages are sent. The sample orders follow the T22 Order DB.</p>
    <h3>Try it in two minutes</h3>
    <ol class="steps-l">
      <li><span>Open <b>Chats</b> and tap <b>Hinglish order</b>. Confirm it in the chat.</span></li>
      <li><span>The order gets a number, goes to a factory and is confirmed. Approve the CAD that arrives.</span></li>
      <li><span>Switch to <b>Factories</b> and reply as the factory, for example “T434 ready”.</span></li>
      <li><span>On <b>Overview</b>, mark it received and pass or fail the quality check.</span></li>
      <li><span>Press <b>Next day</b>: follow-ups go out and factories reply.</span></li>
    </ol>
    <h3>Automation</h3>
    <label class="sw"><input type="checkbox" data-set="autoRoute" ${S.set.autoRoute?"checked":""}>Send new orders to the suggested factory when it's a clear choice</label>
    <label class="sw"><input type="checkbox" data-set="autoFollow" ${S.set.autoFollow?"checked":""}>Send follow-ups automatically each morning (urgent daily; others day 6, 8, 10, then daily)</label>
    <label class="sw"><input type="checkbox" data-set="simFactory" ${S.set.simFactory?"checked":""}>Let factories reply on their own (demo)</label>
    <h3>To go live</h3>
    <p class="small muted">A WhatsApp Business number for Touch22, one WhatsApp contact per factory, and the T22 Order DB sheet as the data store. An AI model reads free-form messages and photos; this demo uses simple rules.</p>
    <div style="display:flex;gap:8px;margin-top:20px"><button class="btn" id="resetBtn" type="button">Reset demo</button><button class="btn primary" id="helpClose" type="button" style="margin-left:auto">Got it</button></div></div>`;
  $("#help").classList.add("on");S.seenHow=true;save();
}
/* ---------- next day ---------- */
function nextDay(){
  S.today=add(S.today,1);
  let ready=0,done=0;
  for(const o of active()){
    if(o.status==="Dispatched"&&o.hist.length&&diff(S.today,o.hist[o.hist.length-1].d)>=2){o.status="Completed";o.doneAt=S.today;hist(o,"Delivered to retailer","r");done++;}
    if(S.set.simFactory&&["In Production","Repair","Wrong Order"].includes(o.status)&&o.eta<=S.today&&Math.random()<.8){factoryEventQuiet(o);ready++;}
    if(S.set.simFactory&&o.status==="Awaiting Factory"&&Math.random()<.85){factoryEvent(o,"accept",{date:Math.random()>FAC[o.factory].rel?add(o.deadline,2):o.deadline});}
    if(S.set.simFactory&&o.status==="CAD Approval"&&persona(o)==null&&Math.random()<.7){act(o.ref,"cadApprove");}
  }
  const due=followDue();
  log(`New day. ${due.length} follow-up${due.length===1?"":"s"} due${ready?`, ${ready} piece${ready>1?"s":""} ready at factories`:""}${done?`, ${done} delivered`:""}`);
  if(S.set.autoFollow&&due.length){sendFollowups(due,true);toast(`<b>${fmtL(S.today)}</b>: ${due.length} follow-ups sent automatically${ready?` · ${ready} pieces ready`:""}. Replies are coming in`);}
  else toast(`<b>${fmtL(S.today)}</b>: ${due.length} follow-ups due${ready?` · ${ready} pieces ready`:""}`);
  save();renderAll();
}
function factoryEventQuiet(o){
  fpush(o.factory,{from:"fac",ref:o.ref,text:`${o.ref} ready hai ✅`});
  o.readyAt=o.issues.length&&o.readyAt?o.readyAt:S.today;
  setStatus(o,"Ready at Factory",`${o.factory}: piece ready${S.today>o.deadline&&!o.issues.length?` (${diff(S.today,o.deadline)} days late)`:""}`,"f");
}


/* ---------- misc ---------- */
const timers=[];
function later(fn,ms){timers.push(setTimeout(fn,ms));}
function toast(h){const t=document.createElement("div");t.className="toast";t.innerHTML=h;$("#toasts").appendChild(t);setTimeout(()=>t.remove(),4000);}
function go(h){
  const [v,a]=h.split(":");
  if(v==="orders"){oQuick=a==="late"?"late":"";oFac="";oQ="";}
  if(location.hash==="#"+v)renderAll();else location.hash=v;
}
function onRoute(){
  const h=(location.hash||"#overview").slice(1);
  view=VIEWS.some(v=>v[0]===h)?h:"overview";
  $$(".view").forEach(v=>v.classList.toggle("on",v.id==="v-"+view));
  renderAll();window.scrollTo(0,0);
}
function exportCSV(){
  const cols=["Ref","Order Date","Customer Name","Factory","Factory Deadline","Status","Product","Days Remain","Priority","Remarks","Size","Purity","Design","Issue Type","Issue Date"];
  const rows=ordersFiltered(true).map(o=>{const i=o.issues[o.issues.length-1];return [o.ref,o.date,o.customer,o.factory,o.deadline,o.status,o.product,CLOSED.includes(o.status)||!o.deadline?"":daysLeft(o),o.priority,o.remarks,o.size,o.purity,o.design,i?i.type:"",i?i.date:""];});
  const csv=[cols,...rows].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`T22-orders-${S.today}.csv`;a.click();
}

document.addEventListener("click",e=>{
  const t=e.target.closest("button,a,tr");if(!t)return;
  const d=t.dataset;
  if(d.open){e.preventDefault();return openDrawer(d.open);}
  if(d.go){e.preventDefault();return go(d.go);}
  if(d.scroll){const el=$("#"+d.scroll);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return;}
  if(d.send){const sel=$(`[data-fsel="${d.send}"]`,t.parentElement)||$(`[data-fsel="${d.send}"]`);sendToFactory(byRef(d.send),sel.value);save();return renderAll();}
  if(d.act)return act(d.ref,d.act);
  if(d.problem){openDrawer(d.problem);return;}
  if(d.omode){oMode=d.omode;return renderOrders();}
  if(d.quick!=null){oQuick=oQuick===d.quick?"":d.quick;return renderOrders();}
  if(d.cmode){cMode=d.cmode;cRef="";cOpen=false;return renderChats();}
  if(d.chat){if(cMode==="r"){cId=d.chat;S.bot.cur=cId;save();}else{cFac=d.chat;cRef="";}cOpen=true;return renderChats();}
  if(d.sample){cOpen=true;return retailerSend(d.sample);}
  if(d.bb!=null)return botButton(cId,+d.bb,d.a,d.ref);
  if(d.sim){const o=byRef($("#simRef").value);if(!o)return;
    if(d.sim==="acceptLate")return factoryEvent(o,"accept",{date:add(o.deadline,3)});
    if(d.sim==="delay")return factoryEvent(o,"delay",{days:3});
    return factoryEvent(o,d.sim);}
  if(d.dsim){const o=byRef(drawerRef);if(d.dsim==="delay")return factoryEvent(o,"delay",{days:3});return factoryEvent(o,d.dsim);}
  if(d.fu1)return sendFollowups([byRef(d.fu1)]);
  if(d.issue!=null){issueForm=d.issue||null;return renderDrawer();}
  if(d.ireason){const ty=issueForm;issueForm=null;return act(drawerRef,"issue",{type:ty,reason:d.ireason});}
  switch(t.id){
    case "dClose":return closeDrawer();
    case "sendAll":return sendFollowups(followDue());
    case "nextDay":return nextDay();
    case "helpBtn":return openHelp();
    case "helpClose":return $("#help").classList.remove("on");
    case "resetBtn":timers.forEach(clearTimeout);S=seed();S.seenHow=true;save();closeDrawer();$("#help").classList.remove("on");cId="parekh";cFac="Mars";cRef="";cOpen=false;toast("Demo reset to the sample data");return onRoute();
    case "clearChat":delete S.bot.convs[cId];save();return renderChats();
    case "botPhoto":return retailerSend("",true);
    case "csv":return exportCSV();
    case "oDone":oDone=!oDone;return renderOrders();
    case "cBack":cOpen=false;return renderChats();
  }
});
$("#scrim").addEventListener("click",closeDrawer);
$("#help").addEventListener("click",e=>{if(e.target.id==="help")$("#help").classList.remove("on");});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawer();$("#help").classList.remove("on");}});
document.addEventListener("submit",e=>{
  e.preventDefault();
  if(e.target.id==="botForm"){const v=$("#botIn").value;if(!v.trim())return;retailerSend(v);setTimeout(()=>{const i=$("#botIn");if(i)i.focus();},40);}
  if(e.target.id==="facForm"){const v=$("#facIn").value.trim();if(v)typedFactory(cFac,v);}
});
document.addEventListener("input",e=>{if(e.target.id==="oq"){oQ=e.target.value;renderOrders();}});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="ofac"){oFac=t.value;renderOrders();}
  if(t.id==="cRef"){cRef=t.value;renderChats();}
  if(t.id==="simRef"){cRef=t.value;renderChats();}
  if(t.dataset.set){S.set[t.dataset.set]=t.checked;save();}
});
const tip=$("#tip");
document.addEventListener("mouseover",e=>{const t=e.target.closest("[data-tip]");if(!t){tip.classList.remove("on");return;}tip.textContent=t.dataset.tip;tip.classList.add("on");});
document.addEventListener("mousemove",e=>{if(!tip.classList.contains("on"))return;tip.style.left=Math.min(e.clientX+12,innerWidth-270)+"px";tip.style.top=(e.clientY+14)+"px";});

S=load()||seed();
cId=S.bot.cur||"parekh";
save();
window.addEventListener("hashchange",onRoute);
onRoute();
if(!S.seenHow)openHelp();
})();
