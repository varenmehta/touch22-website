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
const STAGE_LBL={"Enquiry":"New enquiry","Awaiting Factory":"Awaiting factory reply","CAD Making":"CAD being made","CAD Approval":"CAD with retailer","In Production":"In production","Ready at Factory":"Ready at factory","At Office · QC":"At office · QC","Dispatched":"Dispatched","Completed":"Completed"};
const WITH_FACTORY=["Awaiting Factory","CAD Making","In Production","Repair","Wrong Order"];
const CLOSED=["Completed","Cancelled"];
const ISSUE_REASONS={Repair:["Stone loose","Polish / finishing","Solder joint weak","Weight short"],"Wrong Order":["Wrong size","Wrong purity","Wrong design","Wrong length"]};
const pillCls=s=>({"Enquiry":"st-enq","Awaiting Factory":"st-wait","CAD Making":"st-cad","CAD Approval":"st-cad","In Production":"st-prod","Ready at Factory":"st-ready","At Office · QC":"st-qc","Dispatched":"st-disp","Completed":"st-done","Repair":"st-issue","Wrong Order":"st-issue","Hold":"st-cancel","Cancelled":"st-cancel"}[s]||"");
const pill=s=>`<span class="pill ${pillCls(s)}">${esc(STAGE_LBL[s]||s)}</span>`;

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
      log(`${fac} confirmed #${R}${d!==o.deadline?" for "+fmt(d):""}`,R);toast(`<b>${esc(fac)}</b> confirmed #${R}. Dashboard updated`);
      notify(o,"confirmed");break;}
    case "reject":
      say(`${R} nahi ho payega abhi, karigar busy hai 🙏`);
      o.status="Enquiry";hist(o,`${fac} declined. Pick another factory`,"x");log(`${fac} declined #${R}, needs another factory`,R);
      toast(`<b>${esc(fac)}</b> declined #${R}. It is back in New enquiries`);break;
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
  else{toast(`<b>#${ref}</b> created. Pick a factory in New enquiries (${r.best.f} or ${r.alts.map(a=>a.f).join(" / ")} look close)`);}
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

/* ---------- rendering ---------- */
const ICON={
 dashboard:'<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>',
 orders:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
 bot:'<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
 factories:'<path d="M3 21V11l5 3v-3l5 3v-3l5 3V5h3v16zM7 17h2M12 17h2M17 17h1"/>',
 followups:'<path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9M10 20.5a2 2 0 0 0 4 0"/>',
 insights:'<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
 how:'<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'
};
const VIEWS=[["dashboard","Dashboard","Today's orders, what needs action and where things are stuck"],["orders","Orders","Every order with its number, factory, deadline and status"],
 ["bot","Retailer bot","How a retailer places an order on WhatsApp, in English, Hindi or Hinglish"],["factories","Factory chats","One chat per factory, every message tagged with the order number"],
 ["followups","Follow-ups","Who to chase today, sent as one numbered message per factory"],["insights","Insights","Factory performance and which designs go custom"],["how","How it works","The flow, the gaps it closes and what's needed to go live"]];
let view="dashboard";
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

function renderNav(){
  const due=followDue().length, enq=S.orders.filter(o=>o.status==="Enquiry").length;
  $("#nav").innerHTML=VIEWS.map(([k,l])=>`<a href="#${k}" class="${view===k?"on":""}">${svg(k)}<span>${l}</span>${k==="followups"&&due?`<span class="badge">${due}</span>`:""}${k==="dashboard"&&enq?`<span class="badge">${enq}</span>`:""}</a>`).join("");
  const v=VIEWS.find(x=>x[0]===view);$("#pageTitle").textContent=v[1];$("#pageSub").textContent=v[2];
  $("#todayLbl").textContent=fmtL(S.today);
}
function renderAll(){
  renderNav();
  ({dashboard:renderDash,orders:renderOrders,bot:renderBot,factories:renderFac,followups:renderFollow,insights:renderInsights,how:renderHow})[view]();
  if(drawerRef)renderDrawer();
}
const refBtn=r=>`<button class="ref" data-open="${r}" type="button">#${r}</button>`;

function renderDash(){
  const A=active();
  const urgent=A.filter(o=>o.priority==="Urgent").length;
  const over=A.filter(isOver);
  const due=followDue();
  const wait=A.filter(o=>o.status==="Awaiting Factory").length;
  const issues=A.filter(o=>o.status==="Repair"||o.status==="Wrong Order").length;
  const month=S.today.slice(0,7);
  const doneM=S.orders.filter(o=>o.status==="Completed"&&o.doneAt&&o.doneAt.slice(0,7)===month).length;
  const recent=S.orders.filter(o=>o.readyAt&&o.readyAt<=S.today&&diff(S.today,o.readyAt)<=30&&o.deadline);
  const ot=recent.length?recent.filter(o=>o.readyAt<=o.deadline).length/recent.length:0;
  const k=(lbl,v,d,go,cls,dot)=>`<button class="kpi ${cls||""}" data-go="${go}" type="button"><div class="k">${dot?`<span class="dot" style="background:${dot}"></span>`:""}${lbl}</div><div class="v">${v}</div><div class="d">${d}</div></button>`;
  const enq=S.orders.filter(o=>o.status==="Enquiry");
  const qc=A.filter(o=>o.status==="At Office · QC");
  const rdy=A.filter(o=>o.status==="Ready at Factory");
  const cadA=A.filter(o=>o.status==="CAD Approval");
  const disp=A.filter(o=>o.status==="Dispatched");
  const counts=STAGES.map(s=>[s,S.orders.filter(o=>o.status===s&&(s!=="Completed"||(o.doneAt||"").slice(0,7)===month)).length]);
  $("#v-dashboard").innerHTML=`
  <div class="kpis">
    ${k("Active orders",A.length,`${S.orders.filter(o=>o.date===S.today).length} new today`,"orders:active")}
    ${k("Urgent active",urgent,"Follow-up daily","orders:urgent","","var(--wine-2)")}
    ${k("Overdue at factory",over.length,"Past the factory deadline","orders:overdue",over.length?"alert":"","var(--bad)")}
    ${k("Follow-ups due today",due.length,S.set.autoFollow?"Sent automatically each morning":"Send from Follow-ups","followups","gold")}
    ${k("Awaiting factory reply",wait,"Order sent, no answer yet","orders:Awaiting Factory")}
    ${k("Repair / wrong order",issues,"Back at the factory","orders:issues",issues?"alert":"")}
    ${k("Completed this month",doneM,MON[+month.slice(5)-1]+" "+month.slice(0,4),"orders:done")}
    ${k("Ready on time",pct(ot),"Pieces ready by deadline, last 30 days","insights")}
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><div><h2>Order pipeline</h2><div class="hint">Every open order sits in exactly one step. Tap a step to see its orders.</div></div></div>
    <div class="pipe">${counts.map(([s,n])=>`<button data-go="orders:${s}" type="button"><div class="n">${n}</div><div class="l">${STAGE_LBL[s]}${s==="Completed"?" (this month)":""}</div></button>`).join("")}</div>
    <div class="legend"><span>Off the main path:</span>
      <button class="pill st-issue" data-go="orders:issues" style="cursor:pointer" type="button">Repair / wrong order: ${issues}</button>
      <button class="pill st-cancel" data-go="orders:Cancelled" style="cursor:pointer;text-decoration:none" type="button">Cancelled: ${S.orders.filter(o=>o.status==="Cancelled").length}</button></div>
  </div>
  <div class="grid g-3-2">
    <div class="grid" style="align-content:start">
      <div class="card"><div class="card-head"><div><h2>New enquiries</h2><div class="hint">Orders the bot has taken that need a factory. The suggestion uses product, purity, on-time record and current load.</div></div></div>
        <div class="list">${enq.length?enq.map(o=>{const r=route(o);return `<div class="row">${refBtn(o.ref)}<div class="main-t"><b>${esc(o.customer)}</b> · ${o.product} ${o.purity} · ${o.weight} g ${o.priority==="Urgent"?'<span class="pill urgent">Urgent</span>':""} ${o.design==="Custom"?'<span class="pill custom">New design</span>':""}<div class="s">Suggested <b>${r.best.f}</b>: ${esc(r.best.why.slice(0,3).join(", "))}${r.conf==="check"?` · close call with ${r.alts.map(a=>a.f).join(", ")}`:""}</div></div>
          <div class="acts"><select class="sel" data-fsel="${o.ref}">${r.all.map(a=>`<option ${a.f===r.best.f?"selected":""}>${a.f}</option>`).join("")}</select><button class="btn sm primary" data-send="${o.ref}" type="button">Send to factory</button></div></div>`;}).join(""):`<div class="empty">No new enquiries. Place one from the <a href="#bot">Retailer bot</a>.</div>`}</div></div>
      <div class="card"><div class="card-head"><div><h2>Needs action today</h2><div class="hint">Pieces to collect, check or chase.</div></div></div>
        <div class="list">
          ${qc.map(o=>`<div class="row">${refBtn(o.ref)}<div class="main-t"><b>QC pending</b> · ${o.product} ${o.purity} ${o.size?"· "+esc(o.size):""}<div class="s">${esc(o.customer)} · from ${o.factory}${o.remarks?" · "+esc(o.remarks):""}</div></div><div class="acts"><button class="btn sm ok" data-act="qcpass" data-ref="${o.ref}" type="button">QC pass</button><button class="btn sm bad" data-open="${o.ref}" type="button">Repair / wrong…</button></div></div>`).join("")}
          ${rdy.map(o=>`<div class="row">${refBtn(o.ref)}<div class="main-t"><b>Ready at ${o.factory}</b> · ${o.product} ${o.purity}<div class="s">${esc(o.customer)} · collect and bring to office</div></div><div class="acts"><button class="btn sm" data-act="receive" data-ref="${o.ref}" type="button">Received at office</button></div></div>`).join("")}
          ${cadA.map(o=>`<div class="row">${refBtn(o.ref)}<div class="main-t"><b>CAD with retailer</b> · ${o.product}<div class="s">${esc(o.customer)} · waiting for approval on WhatsApp</div></div><div class="acts"><button class="btn sm" data-act="cadApprove" data-ref="${o.ref}" type="button">Mark approved</button></div></div>`).join("")}
          ${disp.length?`<div class="row"><span class="pill st-disp">${disp.length}</span><div class="main-t">Dispatched and on the way<div class="s">Marked delivered automatically after 2 days unless the retailer reports a problem</div></div><div class="acts"><button class="btn sm" data-go="orders:Dispatched" type="button">View</button></div></div>`:""}
          ${!(qc.length+rdy.length+cadA.length+disp.length)?'<div class="empty">Nothing waiting on the office right now.</div>':""}
        </div></div>
    </div>
    <div class="grid" style="align-content:start">
      <div class="card"><div class="card-head"><div><h2>Most overdue</h2><div class="hint">Past the factory deadline and not ready yet.</div></div><div class="act"><button class="btn sm" data-go="followups" type="button">Follow up</button></div></div>
        <div class="list">${over.sort((a,b)=>lateBy(b)-lateBy(a)).slice(0,7).map(o=>`<div class="row">${refBtn(o.ref)}<div class="main-t"><b>${o.factory}</b> · ${o.product}${o.priority==="Urgent"?' <span class="pill urgent">Urgent</span>':""}<div class="s">${esc(o.customer)} · due ${fmt(o.deadline)}${o.revised?" · factory now says "+fmt(o.revised):""}</div></div><span class="pill st-issue">${lateBy(o)}d late</span></div>`).join("")||'<div class="empty">Nothing overdue 🎉</div>'}</div></div>
      <div class="card feed"><div class="card-head"><div><h2>Activity</h2><div class="hint">What the system did and what came back.</div></div></div>
        <div class="list">${S.log.slice(0,10).map(l=>`<div class="row"><time>${l.d===S.today?l.tm:fmt(l.d)}</time><div class="main-t">${l.ref&&l.t.includes("#"+l.ref)?esc(l.t).replace("#"+l.ref,refBtn(l.ref)):esc(l.t)}</div></div>`).join("")}</div></div>
    </div>
  </div>`;
}

let oTab="active",oFilter={q:"",factory:"",status:"",priority:""},oSort={k:"deadline",dir:1};
function filteredOrders(){
  let os=S.orders.slice();
  if(oTab==="active")os=os.filter(o=>!CLOSED.includes(o.status));
  if(oTab==="done")os=os.filter(o=>CLOSED.includes(o.status));
  const f=oFilter;
  if(f.factory)os=os.filter(o=>o.factory===f.factory);
  if(f.priority)os=os.filter(o=>o.priority===f.priority);
  if(f.status==="overdue")os=os.filter(isOver);
  else if(f.status==="issues")os=os.filter(o=>o.status==="Repair"||o.status==="Wrong Order"||o.issues.some(i=>i.type!=="Cancelled"));
  else if(f.status)os=os.filter(o=>o.status===f.status);
  if(f.q){const q=f.q.toLowerCase();os=os.filter(o=>[o.ref,o.customer,o.factory,o.product,o.remarks,o.size,o.purity,o.status].join(" ").toLowerCase().includes(q));}
  const k=oSort.k;
  os.sort((a,b)=>{let x=a[k]??"",y=b[k]??"";if(k==="days"){x=daysLeft(a)??999;y=daysLeft(b)??999;}if(k==="ref"){x=+a.ref.slice(1);y=+b.ref.slice(1);}return (x>y?1:x<y?-1:0)*oSort.dir;});
  return os;
}
function renderOrders(){
  const os=filteredOrders();
  const sts=["Enquiry","Awaiting Factory","CAD Making","CAD Approval","In Production","Ready at Factory","At Office · QC","Dispatched","Repair","Wrong Order","Completed","Cancelled"];
  const cols=[["ref","Ref"],["date","Order Date"],["customer","Customer Name"],["factory","Factory"],["deadline","Factory Deadline"],["status","Status"],["product","Product"],["days","Days Remain"],["priority","Priority"],["remarks","Remarks"],["size","Size"],["purity","Purity"],["design","Design"]];
  const el=$("#v-orders");
  const keep=document.activeElement&&document.activeElement.id==="oq";
  el.innerHTML=`<div class="toolbar">
    <div class="tabs">${[["active","Active"],["done","Completed"],["all","All"]].map(([k,l])=>`<button class="${oTab===k?"on":""}" data-otab="${k}" type="button">${l}</button>`).join("")}</div>
    <input id="oq" type="search" placeholder="Search ref, customer, remarks…" value="${esc(oFilter.q)}" aria-label="Search orders">
    <select id="of" aria-label="Factory"><option value="">All factories</option>${FACTORIES.map(f=>`<option ${oFilter.factory===f.name?"selected":""}>${f.name}</option>`).join("")}</select>
    <select id="os" aria-label="Status"><option value="">Any status</option><option value="overdue" ${oFilter.status==="overdue"?"selected":""}>Overdue</option><option value="issues" ${oFilter.status==="issues"?"selected":""}>Had repair / wrong order</option>${sts.map(s=>`<option value="${s}" ${oFilter.status===s?"selected":""}>${STAGE_LBL[s]||s}</option>`).join("")}</select>
    <select id="op" aria-label="Priority"><option value="">Any priority</option><option ${oFilter.priority==="Urgent"?"selected":""}>Urgent</option><option ${oFilter.priority==="Default"?"selected":""}>Default</option></select>
    <span class="muted small">${os.length} order${os.length===1?"":"s"}</span>
    <button class="btn sm" id="csv" type="button" style="margin-left:auto">Export CSV for Sheets</button>
  </div>
  <div class="tbl-wrap"><table><thead><tr>${cols.map(([k,l])=>`<th data-sort="${k}">${l}${oSort.k===k?(oSort.dir>0?" ▲":" ▼"):""}</th>`).join("")}</tr></thead><tbody>
  ${os.map(o=>{const dl=daysLeft(o);const over=isOver(o);const soon=!over&&dl!=null&&dl<=2&&!CLOSED.includes(o.status)&&WITH_FACTORY.includes(o.status);
    const dcls=over?"dl-over":soon?"dl-soon":(o.priority==="Urgent"&&!CLOSED.includes(o.status)?"dl-urgent":"");
    return `<tr data-open="${o.ref}"><td><span class="ref">${o.ref}</span></td><td>${fmt(o.date)}</td><td>${esc(o.customer)}</td><td>${esc(o.factory||"–")}</td><td class="${dcls}">${fmt(o.deadline)}${o.revised&&!CLOSED.includes(o.status)?` <span class="muted small">→ ${fmt(o.revised)}</span>`:""}</td><td>${pill(o.status)}</td><td>${o.product}</td><td class="num">${CLOSED.includes(o.status)||dl==null?"":dl}</td><td>${o.priority==="Urgent"?'<span class="pill urgent">Urgent</span>':"Default"}</td><td class="rem">${esc(o.remarks)}</td><td>${esc(o.size)}</td><td>${o.purity}</td><td>${o.design==="Custom"?'<span class="pill custom">Custom</span>':'<span class="pill cat">Catalogue</span>'}</td></tr>`;}).join("")}
  </tbody></table>${!os.length?'<div class="empty">No orders match.</div>':""}</div>
  <div class="legend"><span><i style="background:var(--bad-bg);border:1px solid var(--bad)"></i>Past factory deadline</span><span><i style="background:#fbf1cf;border:1px solid #d9b44a"></i>Due today or within 2 days</span><span><i style="background:var(--urgent-bg);border:1px solid var(--wine-3)"></i>Urgent, not overdue</span><span class="muted">Same colour rules as the Settings Keys tab. “→ date” is the factory's revised date.</span></div>`;
  if(keep){const i=$("#oq");i.focus();i.setSelectionRange(i.value.length,i.value.length);}
}

function renderBot(){
  const id=S.bot.cur,c=conv(id),P=PERSONAS.find(p=>p.id===id);
  if(!c.msgs.length){bpush(id,{from:"bot",text:fill(TX[c.lang].hi,{name:P.contact})});save();}
  const myOpen=active().filter(o=>o.customer===P.cust);
  const sRef=(myOpen.find(o=>o.status==="In Production")||myOpen[0]||{}).ref;
  const SAMPLES=[["EN","Hi, need a 22KT ring, size 16, around 5 gm, single stone like T22-RG-207. Urgent please"],
    ["HINGLISH","Bhai ek 18KT bracelet chahiye 7.5 inch, 16 gram, green stone wala. Naya design hai, photo bhej raha hu"],
    ["HINDI","मुझे 22 कैरेट का मंगलसूत्र चाहिए, 18 इंच, लगभग 10 ग्राम, 2 पीस"],
    ["HINGLISH","Pendant chahiye 'P' letter wala, jaldi"]];
  if(sRef)SAMPLES.push(["STATUS",`${sRef} ka status kya hai?`]);
  const d=c.draft||{};const fld=(k,l,v)=>`<div class="field ${v?"got":"miss"}"><span>${l}</span><b>${v?esc(v):"not given yet"}</b></div>`;
  const last=S.orders.filter(o=>o.src==="WhatsApp bot"&&o.customer===P.cust).slice(-1)[0];
  $("#v-bot").innerHTML=`<div class="chat-layout">
   <div>
    <div class="toolbar"><label class="small muted" for="persona">Chatting as</label><select id="persona" class="sel">${PERSONAS.map(p=>`<option value="${p.id}" ${p.id===id?"selected":""}>${p.name}, ${p.city}</option>`).join("")}</select><button class="btn sm ghost" id="clearChat" type="button">Clear chat</button></div>
    <div class="phone"><div class="scr">
      <div class="wa-head"><div class="av"><img src="img/mono-light.png" alt=""></div><div><b>Touch22 Orders ✓</b><span>Business account · replies instantly</span></div></div>
      <div class="msgs" id="botMsgs"></div>
      <form class="compose" id="botForm"><button class="att" type="button" id="botPhoto" title="Send a design photo" aria-label="Send a design photo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.5 12.6 21a6 6 0 0 1-8.5-8.5l8.5-8.4a4 4 0 0 1 5.7 5.6l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8"/></svg></button><input id="botIn" autocomplete="off" placeholder="Type as the retailer…" aria-label="Message"><button class="send" type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg></button></form>
    </div></div>
   </div>
   <div class="grid" style="align-content:start">
    <div class="card"><h2>Try a message</h2><div class="hint">Tap one to send it, or type your own in any of the three languages. The bot asks only for what's missing.</div>
      <div class="samples">${SAMPLES.map(([l,t])=>`<button data-sample="${esc(t)}" type="button"><em>${l}</em>${esc(t)}</button>`).join("")}</div></div>
    <div class="card"><div class="card-head"><div><h2>What the bot understood</h2><div class="hint">Filled live from the chat. These are the same fields as the Google Form.</div></div><div class="act"><span class="pill lang">${LANG_NAME[c.lang]}</span></div></div>
      <div class="fields">${fld("p","Product",d.product&&(PRODUCT_LABEL[d.product]||d.product))}${fld("u","Purity",d.purity)}${fld("w","Weight",d.weight&&d.weight+" g")}${fld("s","Size",d.size||(d.product&&!SIZED.includes(d.product)?"not needed":""))}${fld("q","Quantity",d.product?String(d.qty||1):"")}${fld("d","Design",d.design&&(d.design==="Custom"?"New design → CAD":"Catalogue"+(d.code?" "+d.code:"")))}${fld("r","Remarks",d.remarks)}${fld("y","Priority",d.product?(d.priority||"Default"):"")}</div>
      ${c.await&&c.await!=="confirm"&&c.await!=="edit"?`<p class="small muted" style="margin-top:10px">Waiting for: <b>${c.await}</b></p>`:""}
    </div>
    ${last?`<div class="card"><div class="card-head"><div><h2>Latest order from this chat</h2><div class="hint">Created automatically, numbered and routed.</div></div><div class="act">${refBtn(last.ref)}</div></div>
      <div class="facts" style="margin-bottom:12px"><div><span>Status</span><b>${STAGE_LBL[last.status]||last.status}</b></div><div><span>Factory</span><b>${last.factory||"to pick"}</b></div><div><span>Deadline</span><b>${fmt(dueDate(last))}</b></div></div>
      ${last.route?`<p class="small" style="margin-bottom:10px">Routing: <b>${last.route.f}</b>${last.route.conf==="high"?" (clear choice, sent automatically)":" (close call, team picks)"}: ${esc(last.route.why.join(", "))}.</p>`:""}
      ${last.factory?`<div class="small muted" style="margin-bottom:6px">Message sent to ${last.factory}:</div><pre class="wa">${wa(factoryMsg(last))}</pre>`:""}</div>`:""}
   </div></div>`;
  renderBotMsgs();
}
function renderBotMsgs(typing){
  const box=$("#botMsgs");if(!box)return;const id=S.bot.cur,c=conv(id);
  let lastD="";
  box.innerHTML=c.msgs.map((m,i)=>{
    let h="";if(m.d!==lastD){lastD=m.d;h+=`<div class="m day">${fmtL(m.d)}</div>`;}
    const card=m.card?`<div class="card-in"><table>${m.card.map(([k,v])=>`<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join("")}</table></div>`:"";
    const btns=m.btns?`<div class="btns">${m.btns.map(b=>`<button type="button" data-bb="${i}" data-a="${b.a}" data-ref="${b.ref||""}" ${m.used?"disabled":""}>${esc(b.l)}</button>`).join("")}</div>`:"";
    return h+`<div class="m ${m.from==="me"?"out":""}">${m.art?art(m.art.p,m.art.cad):""}${wa(m.text)}${card}<span class="t">${m.tm}${m.from==="me"?" ✓✓":""}</span>${btns}</div>`;
  }).join("")+((typing||botBusy)?'<div class="typing"><i></i><i></i><i></i></div>':"");
  box.scrollTop=box.scrollHeight;
}

let facCur="Mars",facRef="";
function renderFac(){
  const list=FACTORIES.map(f=>{const os=active().filter(o=>o.factory===f.name);const ch=S.fchat[f.name]||[];const lm=ch[ch.length-1];
    return {f,os,lm};});
  const cur=list.find(x=>x.f.name===facCur);
  const ch=(S.fchat[facCur]||[]);
  const refs=[...new Set(cur.os.map(o=>o.ref))];
  const shown=facRef?ch.filter(m=>m.ref===facRef||(m.refs||[]).includes(facRef)):ch.slice(-60);
  const pend=cur.os.filter(o=>WITH_FACTORY.includes(o.status));
  const sel=facRef&&pend.find(o=>o.ref===facRef)?facRef:(pend[pend.length-1]||{}).ref;
  const so=sel&&byRef(sel);
  const qb=so?(so.status==="Awaiting Factory"?[["accept","✅ OK, accept"],["acceptLate","📅 OK, +3 days"],["reject","❌ Can't make"]]:
    so.status==="CAD Making"?[["cad","✏️ Send CAD"]]:[["ready","✅ Ready"],["delay","⏳ 3 days delay"],["ontrack","👍 On track"]]):[];
  let lastD="";
  $("#v-factories").innerHTML=`<div class="fac-layout">
   <div class="fac-list">${list.map(({f,os,lm})=>`<button class="${f.name===facCur?"on":""}" data-fac="${f.name}" type="button"><span class="av">${f.name[0]}</span><span class="nm"><b>${f.name}</b><span>${os.length} open · ${lm?esc((lm.from==="fac"?"":"You: ")+lm.text.replace(/\*/g,"").split("\n")[0]).slice(0,34):"no messages"}</span></span></button>`).join("")}</div>
   <div class="fac-chat">
     <div class="wa-head"><div class="av" style="background:var(--wine-2);color:var(--gold);font-family:var(--f-head)">${facCur[0]}</div><div><b>${facCur} · Touch22 orders</b><span>${FAC[facCur].cats.join(", ")} · ${FAC[facCur].pur.join(", ")}</span></div></div>
     <div class="refbar"><span class="small muted">Filter by order:</span><button class="ref ${!facRef?"on":""}" data-fref="" type="button">All</button>${refs.map(r=>`<button class="ref ${facRef===r?"on":""}" data-fref="${r}" type="button">#${r}</button>`).join("")}</div>
     <div class="msgs" id="facMsgs">${shown.map(m=>{let h="";if(m.d!==lastD){lastD=m.d;h=`<div class="m day">${fmtL(m.d)}</div>`;}
        if(m.from==="sys")return h+`<div class="m sys">${esc(m.text)}</div>`;
        return h+`<div class="m ${m.from==="t22"?"out":""}">${m.from==="fac"?`<span class="who">${facCur}</span>`:""}${m.ref?`<span class="tag">${refBtn(m.ref)}</span><br>`:""}${m.art?art(m.art.p,m.art.cad):""}${wa(m.text)}<span class="t">${m.tm}${m.from==="t22"?" ✓✓":""}</span></div>`;}).join("")||'<div class="m sys">No messages yet.</div>'}</div>
     <div class="simbar">
       <div class="r1"><label>Play the factory:</label>${pend.length?`<select class="sel" id="simRef">${pend.map(o=>`<option value="${o.ref}" ${o.ref===sel?"selected":""}>#${o.ref} · ${STAGE_LBL[o.status]||o.status}</option>`).join("")}</select>${qb.map(([k,l])=>`<button class="btn sm" data-sim="${k}" type="button">${l}</button>`).join("")}`:'<span class="small muted">No open orders waiting on this factory.</span>'}</div>
       <form class="r1" id="facForm" style="flex-wrap:nowrap"><input id="facIn" class="sel" style="flex:1;min-width:0;border-radius:999px;padding:8px 14px" placeholder="Or type a reply as ${facCur}, e.g. “${sel||"T430"} ready” or “${sel||"T430"} 3 din”" autocomplete="off"><button class="btn sm primary" type="submit">Send</button></form>
     </div>
   </div></div>`;
  const b=$("#facMsgs");if(b)b.scrollTop=b.scrollHeight;
}

function renderFollow(){
  const due=followDue();
  const by={};due.forEach(o=>(by[o.factory]=by[o.factory]||[]).push(o));
  const sentToday=S.orders.filter(o=>o.lastFollow===S.today&&!CLOSED.includes(o.status));
  $("#v-followups").innerHTML=`<div class="grid g-3-2">
   <div class="grid" style="align-content:start">
    <div class="card"><div class="card-head"><div><h2>Due today · ${due.length}</h2><div class="hint">Grouped by factory. Each factory gets <b>one</b> message listing its orders by number, so replies never get mixed up.</div></div>
      <div class="act">${due.length?`<button class="btn primary" id="sendAll" type="button">Send all ${due.length} follow-ups</button>`:""}</div></div>
      ${Object.keys(by).length?Object.entries(by).map(([f,os])=>`<div style="margin-top:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><b>${f}</b><span class="muted small">${os.length} order${os.length>1?"s":""}</span><button class="btn sm" style="margin-left:auto" data-fu="${f}" type="button">Send to ${f}</button></div>
        <div class="list">${os.map(o=>`<div class="row">${refBtn(o.ref)}<div class="main-t">${o.product} ${o.purity} · ${esc(o.customer)}<div class="s">${esc(followReason(o))} · due ${fmt(dueDate(o))}${o.fu?` · ${o.fu} earlier follow-up${o.fu>1?"s":""}`:""}</div></div>${o.priority==="Urgent"?'<span class="pill urgent">Urgent</span>':""}${isOver(o)?`<span class="pill st-issue">${lateBy(o)}d late</span>`:""}</div>`).join("")}</div></div>`).join(""):`<div class="empty">All follow-ups for today are done${sentToday.length?` (${sentToday.length} sent today)`:""}. Press <b>Next day</b> at the top to move the clock.</div>`}
    </div>
   </div>
   <div class="grid" style="align-content:start">
    <div class="card"><h2>Follow-up rules</h2><div class="hint">Taken from the Settings Keys tab of the T22 Order DB.</div>
      <div class="list small">
        <div class="row"><span class="pill urgent">Urgent</span><div class="main-t">Every day until ready</div></div>
        <div class="row"><span class="pill cat">Default</span><div class="main-t">Day 6, 8 and 10 from order date, then daily after day 10</div></div>
        <div class="row"><span class="pill st-cad">Mid-way</span><div class="main-t">Halfway to the deadline, and 2 days before it</div></div>
        <div class="row"><span class="pill st-wait">No reply</span><div class="main-t">Factory hasn't confirmed by the next day</div></div>
        <div class="row"><span class="pill st-issue">Overdue</span><div class="main-t">Daily once past the factory deadline</div></div>
        <div class="row"><span class="pill st-issue">Repair</span><div class="main-t">Every 2 days while a piece is back at the factory</div></div>
      </div></div>
    <div class="card"><h2>Automation</h2><div class="hint">Switch these off to do the step by hand.</div>
      <label class="sw"><input type="checkbox" data-set="autoFollow" ${S.set.autoFollow?"checked":""}>Send due follow-ups automatically every morning</label>
      <label class="sw"><input type="checkbox" data-set="autoRoute" ${S.set.autoRoute?"checked":""}>Send new orders to the suggested factory when it's a clear choice</label>
      <label class="sw"><input type="checkbox" data-set="simFactory" ${S.set.simFactory?"checked":""}>Simulate factory replies (demo only)</label>
    </div>
    ${due.length?`<div class="card"><h2>Preview</h2><div class="hint">What ${Object.keys(by)[0]} receives.</div><pre class="wa">${wa(["*TOUCH22 FOLLOW-UP · "+fmt(S.today)+"*","Status please, "+by[Object.keys(by)[0]].length+" order(s):",...by[Object.keys(by)[0]].slice(0,6).map((o,i)=>`${i+1}. *#${o.ref}* ${o.product} ${o.purity} · due ${fmt(o.deadline)}`),by[Object.keys(by)[0]].length>6?"…":"","Reply per order, e.g. *"+by[Object.keys(by)[0]][0].ref+" ready*"].join("\n"))}</pre></div>`:""}
   </div></div>`;
}

function bar(segs,total,label){
  return `<div class="track ${total?"":"bg"}">${segs.filter(s=>s.v>0).map(s=>`<i style="width:${(s.v/total*100).toFixed(2)}%;background:${s.c}" data-tip="${esc(label?label+" · ":"")}${esc(s.l)}: ${s.v}${s.p!=null?" ("+s.p+")":""}"></i>`).join("")}</div>`;
}
function renderInsights(){
  const st=FACTORIES.map(f=>facStats(f.name)).filter(s=>s.total).sort((a,b)=>b.total-a.total);
  const fromD=S.orders.reduce((m,o)=>o.date<m?o.date:m,S.today);
  const rating=s=>s.done<3?['<span class="score muted">Too few orders</span>']:s.onTime>=.75&&s.issueRate<.1?[`<span class="score" style="color:var(--ok)">● Reliable</span>`]:s.onTime>=.55?[`<span class="score" style="color:var(--warn)">▲ Watch</span>`]:[`<span class="score" style="color:var(--bad)">■ Often late</span>`];
  // custom vs catalogue by category
  const cats=PRODUCTS.map(p=>{const os=S.orders.filter(o=>o.product===p);const c=os.filter(o=>o.design==="Custom").length;return {p,n:os.length,c,k:os.length-c,share:os.length?c/os.length:0};}).filter(x=>x.n).sort((a,b)=>b.share-a.share);
  const THEMES=[["Names & letters",/name|letter|'[A-Z]'|"[A-Z]"/i],["Coloured stones",/red stone|green stone|stone colour|green|red/i],["Evil eye",/evil|eveil|nazar/i],["Religious symbols (OM)",/\bom\b|om symbol|OM/],["Rose / white gold finish",/rose gold|white gold/i],["Special settings & work",/channel|jaguar|meena|chappai|jhali|bulgari|press chain|heart/i]];
  const cust=S.orders.filter(o=>o.design==="Custom");
  const th=THEMES.map(([l,rx])=>({l,n:cust.filter(o=>rx.test(o.remarks)).length})).sort((a,b)=>b.n-a.n);
  const thMax=Math.max(...th.map(t=>t.n),1);
  const top=cats[0];const topTheme=th[0];
  const cadDays=(()=>{const xs=S.orders.filter(o=>o.design==="Custom"&&o.hist.some(h=>/CAD shared/.test(h.t))&&o.hist.some(h=>/approved CAD/.test(h.t))).map(o=>diff(o.hist.find(h=>/approved CAD/.test(h.t)).d,o.date));return xs.length?(xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(1):"–";})();
  const best=st.filter(s=>s.done>=3).sort((a,b)=>b.onTime-a.onTime)[0];
  const mars=st.find(s=>s.name==="Mars");
  $("#v-insights").innerHTML=`
  <div class="grid g-2" style="margin-bottom:16px">
    <div class="callout">Most orders go to <b>Mars</b> (${mars?mars.total:0} of ${S.orders.length}), but only <b>${mars?pct(mars.onTime):"–"}</b> of its pieces are ready by the deadline, against <b>${best?pct(best.onTime):"–"}</b> at ${best?best.name:"the best factory"}. Moving urgent rings to ${best?best.name:"faster factories"} would cut the overdue list.</div>
    <div class="callout"><b>${top?top.p+"s":""}</b> go custom ${top?pct(top.share):""} of the time, and the top custom request is <b>${topTheme.l.toLowerCase()}</b> (${topTheme.n} orders). A ready set of CAD templates for these would save about <b>${cadDays} days</b> per order spent on CAD and approval.</div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-head"><div><h2>Factory performance</h2><div class="hint">All orders since ${fmt(fromD)}. “Ready on time” counts pieces the factory had ready by the deadline it agreed.</div></div></div>
    <div class="bars" style="margin-bottom:14px">${st.map(s=>`<div class="bar-row"><span class="nm">${s.name}</span>${bar([{v:s.done-s.late,c:"var(--ok)",l:"On time"},{v:s.late,c:"var(--warn)",l:"Late"}],s.done,s.name)}<span class="val">${s.done?pct(s.onTime):"–"}</span></div>`).join("")}</div>
    <div class="legend" style="margin:0 0 14px"><span><i style="background:var(--ok)"></i>Ready on time</span><span><i style="background:var(--warn)"></i>Late</span><span class="muted">Hover a bar for counts.</span></div>
    <div class="tbl-wrap" style="max-height:none"><table><thead><tr><th>Factory</th><th>Orders given</th><th>Open now</th><th>Overdue now</th><th>Ready on time</th><th>Avg days late</th><th>Repair</th><th>Wrong order</th><th>Cancelled</th><th>Avg reply time</th><th>Rating</th></tr></thead><tbody>
      ${st.map(s=>`<tr style="cursor:default" data-go="orders:f:${s.name}"><td><b>${s.name}</b></td><td class="num">${s.total}</td><td class="num">${s.open}</td><td class="num">${s.overdue}</td><td class="num">${s.done?pct(s.onTime):"–"}</td><td class="num">${s.late?s.avgLate.toFixed(1):"–"}</td><td class="num">${s.repair}</td><td class="num">${s.wrong}</td><td class="num">${s.cancel}</td><td class="num">${s.reply!=null?Math.round(s.reply)+" h":"–"}</td><td>${rating(s)}</td></tr>`).join("")}
    </tbody></table></div>
  </div>
  <div class="grid g-2">
    <div class="card"><h2>Which categories go custom</h2><div class="hint">Share of orders per category that needed a new design (CAD) vs a catalogue piece.</div>
      <div class="bars">${cats.map(c=>`<div class="bar-row"><span class="nm">${c.p==="MS"?"MS":c.p}</span>${bar([{v:c.c,c:"var(--c-custom)",l:"New design",p:pct(c.share)},{v:c.k,c:"var(--c-cat)",l:"Catalogue",p:pct(1-c.share)}],c.n,c.p)}<span class="val">${pct(c.share)} · ${c.n}</span></div>`).join("")}</div>
      <div class="legend"><span><i style="background:var(--c-custom)"></i>New design</span><span><i style="background:var(--c-cat)"></i>Catalogue</span><span class="muted">Right column: % custom · total orders</span></div></div>
    <div class="card"><h2>What retailers customise</h2><div class="hint">Themes found in the remarks of ${cust.length} custom orders. Candidates for new catalogue lines.</div>
      <div class="bars">${th.map(t=>`<div class="bar-row" style="grid-template-columns:170px 1fr 40px"><span class="nm">${t.l}</span><div class="track"><i style="width:${(t.n/thMax*100).toFixed(1)}%;background:var(--c-cat)" data-tip="${esc(t.l)}: ${t.n} orders"></i></div><span class="val">${t.n}</span></div>`).join("")}</div>
      <p class="small muted" style="margin-top:12px">In the live system these come from the order remarks and photos the bot collects, so the list keeps itself up to date.</p></div>
  </div>`;
}

function renderHow(){
  const steps=[["1","Retailer","Order on WhatsApp","Bot chats in English, Hindi or Hinglish and asks only for missing details.",1],
   ["2","System","Order number","#T-number given the moment the retailer confirms. Used in every message after.",1],
   ["3","System","Pick factory","Suggests the factory from product, purity, on-time record and load. Close calls go to the team.",1],
   ["4","Factory","Confirm","Standard order message. Factory replies “T434 OK”, a date, or “NO”.",0],
   ["5","Factory + retailer","CAD (new designs)","Factory sends CAD, bot sends it to the retailer to approve.",0],
   ["6","Factory","Production","Deadline set. Follow-ups on day 6/8/10, mid-way and daily when late.",1],
   ["7","Office","QC","Piece arrives. Pass → dispatch. Fail → repair or wrong order goes back with a return note.",0],
   ["8","System","Dispatch","Retailer gets the dispatch update. Order moves to Completed.",1]];
  const gaps=[["Many orders in the same factory WhatsApp chat","Every message to and from a factory carries the order number (#T434). The factory chat can be filtered to one order, and replies like “T434 ready” update the right order."],
   ["No number given to an order","The number is created automatically when the retailer confirms, continuing your T-series. The retailer, factory and team all use the same number."],
   ["Delays","Deadline set on confirmation, follow-ups sent on your day 6/8/10 rule, mid-way and daily when overdue. Late pieces show red on the dashboard and the retailer gets a new date automatically."],
   ["Errors (size, purity, design)","The bot collects every field the Google Form has and reads the full order back for the retailer to confirm. Factories get the same fixed format every time, so nothing is lost in a long chat."],
   ["No view of factory performance","On-time %, days late, repair and wrong-order counts and reply time per factory, built from the orders themselves."],
   ["Not knowing which designs go custom","Custom share by category and the most requested themes (names, letters, stones, finishes), so the catalogue can grow where retailers keep asking."]];
  $("#v-how").innerHTML=`
  <div class="card" style="margin-bottom:16px"><h2>The order flow</h2><div class="hint">Gold cards happen automatically. White cards need a person (the factory, the retailer or the office team).</div>
    <div class="flow">${steps.map(s=>`<div class="f ${s[4]?"auto":""}"><div class="no">${s[0]}</div><div class="who">${s[1]}</div><b>${s[2]}</b><p>${s[3]}</p></div>`).join("")}</div>
  </div>
  <div class="card" style="margin-bottom:16px"><h2>Gaps this closes</h2><div class="hint">From Rishita's notes on how orders run today.</div>
    <div class="tbl-wrap" style="max-height:none"><table class="gap-tbl"><thead><tr><th style="width:30%">Today</th><th>With the order system</th></tr></thead><tbody>${gaps.map(g=>`<tr><td><b>${g[0]}</b></td><td>${g[1]}</td></tr>`).join("")}</tbody></table></div>
  </div>
  <div class="grid g-2">
    <div class="card"><h2>Try the demo in 2 minutes</h2>
      <ol class="small" style="padding-left:18px;margin:8px 0 0;line-height:1.9">
        <li>Open <a href="#bot">Retailer bot</a> and tap the Hinglish sample. Confirm the order.</li>
        <li>Watch the order get a number, go to a factory and get confirmed. The CAD arrives in the retailer's chat: approve it.</li>
        <li>Open <a href="#factories">Factory chats</a> and type a reply as the factory, e.g. “T434 ready”.</li>
        <li>On the <a href="#dashboard">Dashboard</a>, mark it received, then QC pass or send it back for repair.</li>
        <li>Press <b>Next day</b> at the top: follow-ups go out and factories answer.</li>
        <li>See <a href="#insights">Insights</a> for factory performance and custom designs.</li>
      </ol></div>
    <div class="card"><h2>To go live</h2>
      <ul class="small" style="padding-left:18px;margin:8px 0 0;line-height:1.8">
        <li><b>WhatsApp Business API</b> number for Touch22 (through a provider such as Interakt, AiSensy or Meta's Cloud API). Retailers message it like a normal chat.</li>
        <li><b>Factory contacts</b>: one WhatsApp number per factory. Factories don't need an app; they reply in WhatsApp as they do now.</li>
        <li><b>Data</b>: can keep writing to the T22 Order DB Google Sheet (same columns as today), so the team's current view keeps working.</li>
        <li><b>Language understanding</b>: an AI model reads free-form Hindi, Hinglish and English messages and photos. The demo uses simple rules instead.</li>
        <li><b>Privacy</b>: factory messages carry the order number, not the retailer's name.</li>
      </ul></div>
  </div>`;
}

/* ---------- order drawer ---------- */
let drawerRef=null,issueForm=null;
function openDrawer(ref){drawerRef=ref;issueForm=null;renderDrawer();$("#drawer").classList.add("on");$("#scrim").classList.add("on");}
function closeDrawer(){drawerRef=null;$("#drawer").classList.remove("on");$("#scrim").classList.remove("on");}
function renderDrawer(){
  const o=byRef(drawerRef);if(!o)return closeDrawer();
  const path=o.design==="Custom"?STAGES:STAGES.filter(s=>!s.startsWith("CAD"));
  const issue=o.status==="Repair"||o.status==="Wrong Order";
  let ci=path.indexOf(o.status);if(issue)ci=path.indexOf("Ready at Factory");if(o.status==="Cancelled")ci=-1;
  const r=o.status==="Enquiry"?route(o):null;
  const A=[];
  switch(o.status){
    case "Enquiry":A.push(`<select class="sel" data-fsel="${o.ref}">${r.all.map(a=>`<option ${a.f===r.best.f?"selected":""}>${a.f}</option>`).join("")}</select><button class="btn primary" data-send="${o.ref}" type="button">Send to factory</button>`);break;
    case "Awaiting Factory":A.push(`<button class="btn" data-dsim="accept" type="button">Factory accepts</button><button class="btn bad" data-dsim="reject" type="button">Factory can't make it</button>`);break;
    case "CAD Making":A.push(`<button class="btn" data-dsim="cad" type="button">Factory sends CAD</button>`);break;
    case "CAD Approval":A.push(`<button class="btn ok" data-act="cadApprove" data-ref="${o.ref}" type="button">Retailer approved</button><button class="btn" data-act="cadChange" data-ref="${o.ref}" type="button">Retailer wants a change</button>`);break;
    case "In Production":case "Repair":case "Wrong Order":A.push(`<button class="btn" data-dsim="ready" type="button">Factory: ready</button><button class="btn warn" data-dsim="delay" type="button">Factory: 3 days delay</button><button class="btn" data-fu1="${o.ref}" type="button">Follow up now</button>`);break;
    case "Ready at Factory":A.push(`<button class="btn primary" data-act="receive" data-ref="${o.ref}" type="button">Received at office</button>`);break;
    case "At Office · QC":A.push(`<button class="btn ok" data-act="qcpass" data-ref="${o.ref}" type="button">QC pass → dispatch</button><button class="btn bad" data-issue="Repair" type="button">Repair</button><button class="btn bad" data-issue="Wrong Order" type="button">Wrong order</button>`);break;
    case "Dispatched":A.push(`<button class="btn" data-act="delivered" data-ref="${o.ref}" type="button">Delivered to retailer</button>`);break;
  }
  const iform=issueForm?`<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="small"><b>${issueForm}</b> reason:</span>${ISSUE_REASONS[issueForm].map(x=>`<button class="btn sm bad" data-ireason="${esc(x)}" type="button">${x}</button>`).join("")}<span class="small muted">The piece goes back to ${o.factory} with a return note.</span></div>`:"";
  const fmsgs=(S.fchat[o.factory]||[]).filter(m=>m.ref===o.ref||(m.refs||[]).includes(o.ref));
  const dl=daysLeft(o);
  $("#drawer").innerHTML=`<div class="dh"><div><div class="small" style="opacity:.75;letter-spacing:.12em;text-transform:uppercase">Order</div><h2>#${o.ref}</h2><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${pill(o.status)}${o.priority==="Urgent"?'<span class="pill urgent" style="background:var(--gold);color:var(--wine)">Urgent</span>':""}${o.design==="Custom"?'<span class="pill custom">New design</span>':'<span class="pill cat">Catalogue</span>'}</div></div><button class="x" id="dClose" type="button" aria-label="Close">×</button></div>
  <div class="db">
    ${o.status!=="Cancelled"?`<div class="steps">${path.map((s,i)=>`<div class="s ${i<ci?"done":i===ci?(issue?"cur issue":"cur"):""}">${STAGE_LBL[s].replace("Awaiting factory reply","Factory reply").replace("At office · QC","QC")}</div>`).join("")}</div>`:""}
    ${A.length?`<div class="next"><h3>${issue?o.status+" · back at "+o.factory:"Next step"}</h3><div class="acts">${A.join("")}</div>${iform}</div>`:""}
    <div class="facts">
      <div><span>Customer</span><b>${esc(o.customer)}</b></div><div><span>Order date</span><b>${fmt(o.date)}</b></div><div><span>Factory</span><b>${esc(o.factory||"Not picked")}</b></div>
      <div><span>Product</span><b>${o.product}</b></div><div><span>Purity</span><b>${o.purity}</b></div><div><span>Weight</span><b>${o.weight} g</b></div>
      <div><span>Size</span><b>${esc(o.size||"–")}</b></div><div><span>Qty</span><b>${o.qty}</b></div><div><span>Design</span><b>${o.design==="Custom"?"New (CAD)":"Catalogue"}${o.code?" "+o.code:""}</b></div>
      <div><span>Factory deadline</span><b>${fmt(o.deadline)}</b></div><div><span>Revised date</span><b>${o.revised?fmt(o.revised):"–"}</b></div><div><span>Days remain</span><b style="${isOver(o)?"color:var(--bad)":""}">${CLOSED.includes(o.status)||dl==null?"–":dl}</b></div>
      <div style="grid-column:1/-1"><span>Remarks</span><b>${esc(o.remarks||"–")}</b></div>
    </div>
    ${o.issues.length?`<div class="next"><h3>Issues</h3>${o.issues.map(i=>`<div class="small"><span class="pill st-issue">${i.type}</span> ${esc(i.reason)} · ${fmt(i.date)}</div>`).join("")}</div>`:""}
    ${o.factory?`<div><div class="small muted" style="margin-bottom:6px">Order message to ${o.factory}</div><pre class="wa">${wa(factoryMsg(o))}</pre></div>`:""}
    ${fmsgs.length>1?`<div><div class="small muted" style="margin-bottom:6px">Factory chat for #${o.ref} only (${fmsgs.length} messages) <a href="#factories" data-fopen="${o.factory}|${o.ref}">open chat</a></div>
      <div class="msgs" style="max-height:220px;border-radius:12px;border:1px solid var(--line)">${fmsgs.slice(-6).map(m=>`<div class="m ${m.from==="t22"?"out":""}">${m.art?art(m.art.p,m.art.cad):""}${wa(m.text.length>220?m.text.slice(0,220)+"…":m.text)}<span class="t">${fmt(m.d)} ${m.tm}</span></div>`).join("")}</div></div>`:""}
    <div><div class="small muted" style="margin-bottom:8px">Timeline</div><ul class="tl">${[...o.hist].reverse().map(h=>`<li class="${h.k}"><time>${fmtL(h.d)}</time>${esc(h.t)}</li>`).join("")}</ul></div>
    <div class="acts" style="display:flex;gap:8px;flex-wrap:wrap">${!CLOSED.includes(o.status)?`<button class="btn sm" data-act="urgent" data-ref="${o.ref}" type="button">${o.priority==="Urgent"?"Remove urgent":"Mark urgent"}</button>${WITH_FACTORY.includes(o.status)?`<button class="btn sm" data-act="reroute" data-ref="${o.ref}" type="button">Change factory</button>`:""}<button class="btn sm bad" data-act="cancel" data-ref="${o.ref}" type="button">Cancel order</button>`:""}</div>
  </div>`;
  const ms=$("#drawer .msgs");if(ms)ms.scrollTop=ms.scrollHeight;
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

/* ---------- misc UI ---------- */
const timers=[];
function later(fn,ms){timers.push(setTimeout(fn,ms));}
function toast(h){const t=document.createElement("div");t.className="toast";t.innerHTML=h;$("#toasts").appendChild(t);setTimeout(()=>t.remove(),4200);}
function go(h){
  const [v,a,b]=h.split(":");
  if(v==="orders"&&a){oFilter={q:"",factory:"",status:"",priority:""};oTab="active";
    if(a==="urgent")oFilter.priority="Urgent";else if(a==="overdue")oFilter.status="overdue";else if(a==="issues")oFilter.status="issues";
    else if(a==="done"){oTab="done";oFilter.status="Completed";}else if(a==="Completed"){oTab="done";oFilter.status="Completed";}else if(a==="Cancelled"){oTab="done";oFilter.status="Cancelled";}
    else if(a==="f"){oTab="all";oFilter.factory=b;}else if(a!=="active")oFilter.status=a;}
  location.hash=v;if(view===v)renderAll();
}
function route_(){const h=(location.hash||"#dashboard").slice(1);view=VIEWS.some(v=>v[0]===h)?h:"dashboard";$$(".view").forEach(v=>v.classList.toggle("on",v.id==="v-"+view));renderAll();window.scrollTo(0,0);}

document.addEventListener("click",e=>{
  const t=e.target.closest("button,a,tr");if(!t)return;
  const d=t.dataset;
  if(d.open){e.preventDefault();return openDrawer(d.open);}
  if(d.go){e.preventDefault();return go(d.go);}
  if(d.send){const sel=$(`[data-fsel="${d.send}"]`,t.parentElement)||$(`[data-fsel="${d.send}"]`);const o=byRef(d.send);sendToFactory(o,sel.value);save();return renderAll();}
  if(d.act){return act(d.ref,d.act);}
  if(d.otab){oTab=d.otab;if(oTab==="active"&&["Completed","Cancelled"].includes(oFilter.status))oFilter.status="";return renderOrders();}
  if(d.sort){oSort={k:d.sort,dir:oSort.k===d.sort?-oSort.dir:1};return renderOrders();}
  if(d.sample){$("#botIn").value="";return retailerSend(t.dataset.sample);}
  if(d.bb!=null){return botButton(S.bot.cur,+d.bb,d.a,d.ref);}
  if(d.fac){facCur=d.fac;facRef="";return renderFac();}
  if(d.fref!=null){facRef=d.fref;return renderFac();}
  if(d.sim){const o=byRef($("#simRef").value);if(!o)return;const k=d.sim;
    if(k==="acceptLate")return factoryEvent(o,"accept",{date:add(o.deadline,3)});
    if(k==="delay")return factoryEvent(o,"delay",{days:3});return factoryEvent(o,k);}
  if(d.dsim){const o=byRef(drawerRef);if(d.dsim==="delay")return factoryEvent(o,"delay",{days:3});return factoryEvent(o,d.dsim);}
  if(d.fu){return sendFollowups(followDue().filter(o=>o.factory===d.fu));}
  if(d.fu1){return sendFollowups([byRef(d.fu1)]);}
  if(d.issue){issueForm=d.issue;return renderDrawer();}
  if(d.ireason){const ty=issueForm;issueForm=null;return act(drawerRef,"issue",{type:ty,reason:d.ireason});}
  if(d.fopen){const [f,r]=d.fopen.split("|");facCur=f;facRef=r;closeDrawer();return;}
  if(t.id==="dClose")return closeDrawer();
  if(t.id==="sendAll")return sendFollowups(followDue());
  if(t.id==="nextDay")return nextDay();
  if(t.id==="resetBtn"){timers.forEach(clearTimeout);S=seed();save();closeDrawer();facCur="Mars";facRef="";toast("Demo reset to the sample data");return route_();}
  if(t.id==="clearChat"){S.bot.convs[S.bot.cur]=null;delete S.bot.convs[S.bot.cur];save();return renderBot();}
  if(t.id==="botPhoto")return retailerSend("",true);
  if(t.id==="csv")return exportCSV();
});
$("#scrim").addEventListener("click",closeDrawer);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer();});
document.addEventListener("submit",e=>{
  e.preventDefault();
  if(e.target.id==="botForm"){const v=$("#botIn").value;$("#botIn").value="";retailerSend(v);setTimeout(()=>$("#botIn")&&$("#botIn").focus(),30);}
  if(e.target.id==="facForm"){const v=$("#facIn").value.trim();if(v)typedFactory(facCur,v);}
});
document.addEventListener("input",e=>{if(e.target.id==="oq"){oFilter.q=e.target.value;renderOrders();}});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="of"){oFilter.factory=t.value;renderOrders();}
  if(t.id==="os"){oFilter.status=t.value;if(["Completed","Cancelled"].includes(t.value))oTab="done";else if(t.value&&t.value!=="issues")oTab="active";renderOrders();}
  if(t.id==="op"){oFilter.priority=t.value;renderOrders();}
  if(t.id==="persona"){S.bot.cur=t.value;save();renderBot();}
  if(t.id==="simRef"){facRef=t.value;renderFac();}
  if(t.dataset.set){S.set[t.dataset.set]=t.checked;save();}
});
// tooltip
const tip=$("#tip");
document.addEventListener("mouseover",e=>{const t=e.target.closest("[data-tip]");if(!t){tip.classList.remove("on");return;}tip.textContent=t.dataset.tip;tip.classList.add("on");});
document.addEventListener("mousemove",e=>{if(!tip.classList.contains("on"))return;tip.style.left=Math.min(e.clientX+12,innerWidth-270)+"px";tip.style.top=(e.clientY+14)+"px";});
function exportCSV(){
  const cols=["Ref","Order Date","Customer Name","Factory","Factory Deadline","Status","Product","Days Remain","Priority","Remarks","Size","Purity","Design","Issue Type","Issue Date"];
  const rows=filteredOrders().map(o=>{const i=o.issues[o.issues.length-1];return [o.ref,o.date,o.customer,o.factory,o.deadline,o.status,o.product,CLOSED.includes(o.status)?"":daysLeft(o),o.priority,o.remarks,o.size,o.purity,o.design,i?i.type:"",i?i.date:""];});
  const csv=[cols,...rows].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`T22-orders-${S.today}.csv`;a.click();
}

S=load()||seed();save();
window.addEventListener("hashchange",route_);
route_();
})();
