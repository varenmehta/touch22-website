(() => {
"use strict";
const T = window.T22, $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast = m => (window.T22toast ? window.T22toast(m) : null);
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};

/* ---------- State ---------- */
const CATS = ["All","Bangles","Rings","Earrings","Mangalsutras","Chains","Pendants","Bracelets"];
const params = new URLSearchParams(location.search);
const state = {
  q: params.get("q") || "",
  cat: CATS.includes(params.get("cat")) ? params.get("cat") : "All",
  col: params.get("col") || "",
  kt: params.get("kt") || "",
  sort: params.get("sort") || "feat",
  stock: params.get("stock") === "1"
};
let rate = Number(store.get("t22rate", T.DEFAULT_RATE22)) || T.DEFAULT_RATE22;
const cart = new Map(Object.entries(store.get("t22cart", {})).filter(([c]) => T.byCode(c)));
const price = p => T.priceOf(p, rate);

/* ---------- Controls ---------- */
$("#rate").value = rate;
$("#q").value = state.q;
$("#fCol").value = state.col;
$("#fKt").value = state.kt;
$("#fSort").value = state.sort;
$("#fStock").checked = state.stock;
$("#cats").innerHTML = CATS.map(c => `<button class="chip" type="button" data-cat="${c}" aria-pressed="${c === state.cat}">${c}</button>`).join("");

$("#cats").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; state.cat = b.dataset.cat; document.querySelectorAll("#cats .chip").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); });
let qT; $("#q").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 120); });
$("#fCol").onchange = e => { state.col = e.target.value; render(); };
$("#fKt").onchange = e => { state.kt = e.target.value; render(); };
$("#fSort").onchange = e => { state.sort = e.target.value; render(); };
$("#fStock").onchange = e => { state.stock = e.target.checked; render(); };
$("#rate").addEventListener("input", e => { const v = Number(e.target.value); if (v >= 1000) { rate = v; store.set("t22rate", rate); render(); renderCart(); } });
$("#reset").onclick = () => { Object.assign(state, {q:"",cat:"All",col:"",kt:"",sort:"feat",stock:false}); $("#q").value=""; $("#fCol").value=""; $("#fKt").value=""; $("#fSort").value="feat"; $("#fStock").checked=false; document.querySelectorAll("#cats .chip").forEach(x => x.setAttribute("aria-pressed", x.dataset.cat === "All")); render(); };

/* ---------- Grid ---------- */
function filtered(){
  const q = state.q.toLowerCase();
  let list = T.products.filter(p =>
    (state.cat === "All" || p.cat === state.cat) &&
    (!state.col || p.col === state.col) &&
    (!state.kt || String(p.kt) === state.kt) &&
    (!state.stock || p.stock > 0) &&
    (!q || (p.name + " " + p.code + " " + p.col + " " + p.cat + " " + p.stone).toLowerCase().includes(q)));
  const by = {
    "new": (a,b) => b.isNew - a.isNew,
    "wt-asc": (a,b) => a.nw - b.nw, "wt-desc": (a,b) => b.nw - a.nw,
    "pr-asc": (a,b) => price(a) - price(b), "pr-desc": (a,b) => price(b) - price(a)
  }[state.sort];
  return by ? list.slice().sort(by) : list;
}
function card(p, i){
  const [sk, sl] = T.stockLabel(p), inCart = cart.has(p.code);
  return `<article class="pc" style="animation-delay:${Math.min(i, 12) * 30}ms">
    <button class="ph" type="button" data-view="${p.code}" aria-label="View ${esc(p.name)}">
      <img src="${p.image(600)}" alt="${esc(p.name)}" loading="lazy" decoding="async">
      <span class="badges">${p.isNew ? '<span class="badge new">New</span>' : ""}<span class="badge">${p.col === "Men" ? "Men's" : esc(p.col)}</span></span>
    </button>
    <div class="bd">
      <span class="code">${p.code} · ${p.kt}KT</span>
      <h3>${esc(p.name)}</h3>
      <span class="meta">${p.nw} g net · ${esc(p.stone)}</span>
      <span class="pr">${T.inr(price(p))} <small>est. + GST</small></span>
      <div class="ft"><span class="stk ${sk}">${sl}</span><button class="add${inCart ? " in" : ""}" type="button" data-add="${p.code}">${inCart ? "In cart ✓" : "+ Add"}</button></div>
    </div></article>`;
}
function render(){
  const list = filtered();
  $("#grid").innerHTML = list.map(card).join("");
  $("#empty").hidden = list.length > 0;
  $("#count").textContent = `${list.length} design${list.length === 1 ? "" : "s"}`;
  const u = new URLSearchParams();
  if (state.q) u.set("q", state.q); if (state.cat !== "All") u.set("cat", state.cat); if (state.col) u.set("col", state.col);
  if (state.kt) u.set("kt", state.kt); if (state.sort !== "feat") u.set("sort", state.sort); if (state.stock) u.set("stock", "1");
  history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
}
$("#grid").addEventListener("click", e => {
  const a = e.target.closest("[data-add]"); if (a) { addToCart(a.dataset.add, 1); return; }
  const v = e.target.closest("[data-view]"); if (v) openView(v.dataset.view);
});

/* ---------- Quick view ---------- */
const dlg = $("#qv"); let qvP = null, qvQty = 1;
function openView(code){
  qvP = T.byCode(code); qvQty = 1; const p = qvP, [sk, sl] = T.stockLabel(p);
  $("#qvImg").src = p.image(1000); $("#qvImg").alt = p.name;
  $("#qvCol").textContent = `${p.col === "Men" ? "Men's" : p.col} · ${p.cat}`;
  $("#qvName").textContent = p.name;
  $("#qvDesc").textContent = p.desc;
  $("#qvSpecs").innerHTML = [["Code", p.code], ["Purity", `T-${p.kt} · ${p.kt}KT`], ["Gross weight", `${p.gw} g`], ["Net weight", `${p.nw} g`], ["Stone", p.stone], ["Making", `${p.mk}%`], ["Availability", `<span class="stk ${sk}">${sl}</span>`]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  $("#qvPrice").innerHTML = `${T.inr(price(p))} <small style="font-family:var(--f-body);font-size:.8rem;color:var(--ink-3)">estimate at ₹${rate.toLocaleString("en-IN")}/g 22KT, + GST</small>`;
  $("#qvQty").textContent = qvQty;
  $("#qvAsk").href = T.waLink(`Hello Touch22, I'd like details on ${p.code} (${p.name}, ${p.kt}KT, ${p.nw} g net). Is it available?`);
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
}
const closeView = () => dlg.close ? dlg.close() : dlg.removeAttribute("open");
$("#qvClose").onclick = closeView;
dlg.addEventListener("click", e => { if (e.target === dlg) closeView(); });
$("#qvMinus").onclick = () => { qvQty = Math.max(1, qvQty - 1); $("#qvQty").textContent = qvQty; };
$("#qvPlus").onclick = () => { qvQty = Math.min(99, qvQty + 1); $("#qvQty").textContent = qvQty; };
$("#qvAdd").onclick = () => { addToCart(qvP.code, qvQty); closeView(); };

/* ---------- Cart ---------- */
function saveCart(){ store.set("t22cart", Object.fromEntries(cart)); }
function addToCart(code, n){
  cart.set(code, Math.min(99, (cart.get(code) || 0) + n)); saveCart(); renderCart(); render();
  ["#openCart","#openCart2"].forEach(id => { const b = $(id); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); });
  toast(`${T.byCode(code).name} added to your trade cart`);
}
function renderCart(){
  const items = [...cart].map(([c, q]) => ({p: T.byCode(c), q}));
  const count = items.reduce((s, x) => s + x.q, 0);
  $("#cartCt").textContent = count; $("#cartCt2").textContent = count;
  if (!items.length) {
    $("#lines").innerHTML = `<div class="empty-state" style="padding:60px 0"><h3 style="font-size:1.6rem">Your cart is empty</h3><p>Add designs from the catalogue to build a trade enquiry.</p></div>`;
    $("#tot").innerHTML = ""; $("#send").disabled = true; $("#clear").hidden = true; return;
  }
  $("#send").disabled = false; $("#clear").hidden = false;
  $("#lines").innerHTML = items.map(({p, q}) => `<div class="line"><img src="${p.image(160)}" alt=""><div><b>${esc(p.name)}</b><small>${p.code} · ${p.kt}KT · ${p.nw} g</small><br><button class="rm" type="button" data-rm="${p.code}">Remove</button></div><div class="right"><div class="qty"><button type="button" data-dec="${p.code}" aria-label="Less">−</button><span>${q}</span><button type="button" data-inc="${p.code}" aria-label="More">+</button></div><small>${T.inr(price(p) * q)}</small></div></div>`).join("");
  const wt = items.reduce((s, x) => s + x.p.nw * x.q, 0), sub = items.reduce((s, x) => s + price(x.p) * x.q, 0), gst = sub * T.GST;
  $("#tot").innerHTML = `<span>${count} piece${count === 1 ? "" : "s"} · net weight</span><span>${wt.toFixed(1)} g</span><span>Estimate</span><span>${T.inr(sub)}</span><span>GST 3%</span><span>${T.inr(gst)}</span><span class="big">Total</span><span class="big">${T.inr(sub + gst)}</span>`;
}
$("#lines").addEventListener("click", e => {
  const t = e.target, c = t.dataset.inc || t.dataset.dec || t.dataset.rm; if (!c) return;
  if (t.dataset.inc) cart.set(c, Math.min(99, cart.get(c) + 1));
  else if (t.dataset.dec) { const n = cart.get(c) - 1; n > 0 ? cart.set(c, n) : cart.delete(c); }
  else cart.delete(c);
  saveCart(); renderCart(); render();
});
const drawer = $("#drawer"), scrim = $("#scrim");
let lastFocus = null;
function openCart(){ lastFocus = document.activeElement; drawer.classList.add("on"); scrim.classList.add("on"); drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; $("#closeCart").focus(); }
function closeCart(){ drawer.classList.remove("on"); scrim.classList.remove("on"); drawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
$("#openCart").onclick = openCart; $("#openCart2").onclick = openCart; $("#closeCart").onclick = closeCart; scrim.onclick = closeCart;
document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("on")) closeCart(); });
$("#clear").onclick = () => { cart.clear(); saveCart(); renderCart(); render(); };
const det = store.get("t22buyer", {}); $("#cStore").value = det.store || ""; $("#cCity").value = det.city || "";
$("#send").onclick = () => {
  const st = $("#cStore").value.trim(), city = $("#cCity").value.trim();
  if (!st) { toast("Please add your store name"); $("#cStore").focus(); return; }
  store.set("t22buyer", {store: st, city});
  const items = [...cart].map(([c, q]) => ({p: T.byCode(c), q}));
  const wt = items.reduce((s, x) => s + x.p.nw * x.q, 0);
  const lines = items.map(({p, q}) => `• ${p.code} ${p.name} (${p.kt}KT, ${p.nw} g) × ${q}`).join("\n");
  const msg = `Hello Touch22, trade enquiry from ${st}${city ? ", " + city : ""}.\n\n${lines}\n\nTotal net weight: ${wt.toFixed(1)} g\nPlease confirm availability and today's price.`;
  window.open(T.waLink(msg), "_blank", "noopener");
  toast("Opening WhatsApp with your cart");
};

render(); renderCart();
if (params.get("cart") === "open") openCart();
})();
