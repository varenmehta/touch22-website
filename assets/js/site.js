(() => {
"use strict";
const $ = s => document.querySelector(s);

/* Contact settings. Put Touch22's WhatsApp Business number here (country code, digits only, e.g. "919800000000").
   Left empty, the enquiry form opens WhatsApp and lets the sender pick the chat. */
const CONTACT = { whatsapp: "" };

/* Toast */
let tT;
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tT);tT=setTimeout(()=>t.classList.remove("show"),2800);}

/* Nav: solid on scroll, mobile menu */
const nav=$("#nav");
const onScroll=()=>nav.classList.toggle("solid",window.scrollY>40);
onScroll();window.addEventListener("scroll",onScroll,{passive:true});
$("#burger").addEventListener("click",()=>{const open=document.body.classList.toggle("menu-open");$("#burger").setAttribute("aria-expanded",open);if(open)nav.classList.add("solid");else onScroll();});
document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>{document.body.classList.remove("menu-open");$("#burger").setAttribute("aria-expanded","false");}));

/* Ticker: duplicate content for a seamless loop */
const tk=$("#ticker"); if(tk) tk.innerHTML+=tk.innerHTML;

/* Reveal on scroll */
const io="IntersectionObserver" in window ? new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{rootMargin:"0px 0px -8% 0px",threshold:.08}) : null;
document.querySelectorAll(".rv").forEach(el=>io?io.observe(el):el.classList.add("in"));

/* Year */
$("#yr").textContent=new Date().getFullYear();

/* Before/after compare */
const rng=$("#cmpRange");
if(rng){const set=v=>{$("#compare .after").style.clipPath=`inset(0 0 0 ${v}%)`;$("#cmpBar").style.left=v+"%";$("#cmpKnob").style.left=v+"%";};rng.addEventListener("input",e=>set(e.target.value));set(rng.value);}

/* WhatsApp follow-up replay */
const SCRIPT=[
 {step:0,typing:false,html:null},
 {step:1,out:false,typing:true,html:`<img src="https://images.unsplash.com/photo-1758995116383-f51775896add?auto=format&fit=crop&w=500&q=70" alt="">Namaste Mahesh bhai! 🙏 We've received your cart on touch22.in.\n\n<b>6 designs · 128.4 g net</b>\n5 in ready stock, 1 made to order (7 days)\nEstimate at today's rate: <b>₹16,42,300</b> + GST`,chips:["Confirm order","Change items","Call me"]},
 {step:2,out:false,typing:true,html:`Just checking in on your cart 😊 The Machine-cut kada pair has only 3 pieces left before Dhanteras. Shall we hold them for you?`,chips:["Yes, hold them","Talk to sales"]},
 {step:3,out:true,typing:false,html:`Yes hold them. Also send 2 more ELIRA drop earrings`},
 {step:3,out:false,typing:true,html:`Done ✓ Held 3 kadas and added 2 ELIRA CZ drops (T22-ER-305).\n\nRohan from our sales team will confirm the final weights and call you within the hour.`},
];
const log=$("#waLog"), steps=[...document.querySelectorAll("#flowSteps li")];
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function now(){const d=new Date();return d.toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"});}
function bubble(m){const b=document.createElement("div");b.className="bub"+(m.out?" out":"");b.innerHTML=m.html.replace(/\n/g,"<br>")+(m.chips?`<div class="chips">${m.chips.map(c=>`<i>${c}</i>`).join("")}</div>`:"")+`<span class="tm">${now()}${m.out?"":" ✓✓"}</span>`;return b;}
const wait=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));
let playing=false;
async function play(){
  if(playing||!log)return;playing=true;
  while(true){
    log.innerHTML="";steps.forEach(s=>s.classList.remove("on"));
    for(const m of SCRIPT){
      steps.forEach((s,i)=>s.classList.toggle("on",i<=m.step));
      if(!m.html){await wait(1400);continue;}
      if(m.typing){const t=document.createElement("div");t.className="typing";t.innerHTML="<i></i><i></i><i></i>";log.append(t);await wait(1300);t.remove();}
      log.append(bubble(m));
      while(log.scrollHeight>log.clientHeight+4&&log.children.length>1)log.firstElementChild.remove();
      await wait(m.out?1600:2600);
    }
    if(reduce)break;
    await wait(3500);
  }
}
if(log){
  if("IntersectionObserver" in window){const o=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){play();o.disconnect();}},{threshold:.3});o.observe(log);}
  else play();
}

/* Enquiry form -> WhatsApp */
$("#enqForm").addEventListener("submit",e=>{
  e.preventDefault();
  const v=id=>$(id).value.trim();
  if(!v("#eName")||!v("#eStore")){toast("Please add your name and store");(v("#eName")?$("#eStore"):$("#eName")).focus();return;}
  const text=`Hello Touch22, I'm ${v("#eName")} from ${v("#eStore")}${v("#eCity")?", "+v("#eCity"):""}. I'm interested in: ${v("#eInt")}.${v("#eMsg")?"\n"+v("#eMsg"):""}\nPlease send today's catalogue.`;
  const url=`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  window.open(url,"_blank","noopener");
  toast("Opening WhatsApp with your enquiry");
});
})();
