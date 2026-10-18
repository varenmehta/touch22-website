/* Touch22 shared site data: contact settings, sample ready-stock catalogue and pricing.
   Stock, weights and making charges are SAMPLE data matching the AI Studio demo. Replace with the daily stock export. */
(function(){
"use strict";

const CONTACT = {
  /* Touch22's WhatsApp Business number: country code + number, digits only (e.g. "919800000000").
     Left empty, WhatsApp opens and lets the sender choose the chat. */
  whatsapp: "",
  email: "",
  instagram: "https://www.instagram.com/touch22.in/",
  facebook: "https://www.facebook.com/touch22gold/",
  portal: "https://touch22.in",
  address: ["Unitouch Creations LLP", "Ruby Chambers, Dhanji Street", "Zaveri Bazaar, Mumbai 400003"]
};

/* Example 22KT rate in ₹ per gram. Buyers can change it on the catalogue page. */
const DEFAULT_RATE22 = 11800;
const FINENESS = {22: .916, 18: .75, 9: .375};
const GST = 0.03;

const img = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${w}&q=78`;

/* code, name, collection, category, KT, gross g, net g, stone, making %, stone ₹, stock, new?, unsplash id, description */
const ROWS = [
 ["T22-BG-104","Machine-cut kada pair","Core","Bangles",22,28.4,28.4,"Plain",8,0,14,true,"1758995116383-f51775896add","A pair of machine-cut kadas with a crisp diamond-cut finish that catches counter light. A dependable everyday seller in 22KT."],
 ["T22-BG-118","Rose gold slim bangles (set of 4)","Core","Bangles",18,22.1,22.1,"Plain",10,0,6,false,"1679156271456-d6068c543ee7","Four slim 18KT rose gold bangles designed to stack. Light on the wrist, easy on the buyer's budget."],
 ["T22-BG-131","ELIRA CZ eternity bangle","ELIRA","Bangles",18,18.6,17.2,"CZ",14,3200,3,true,"1638617501607-5dfb8b079ebf","A full-circle CZ eternity bangle from ELIRA. Bridal sparkle at a fashion-gold weight."],
 ["T22-BG-140","NAAZ Turkish broad kada","NAAZ","Bangles",22,41.8,40.9,"Colour stones",13,4500,2,false,"1787769499046-8a94b2de1f62","A bold broad kada with Turkish-inspired texture and colour stones. A statement piece for festive counters."],
 ["T22-BG-150","Lightweight daily bangles (pair)","Core","Bangles",22,16.2,16.2,"Plain",9,0,25,true,"1741071520904-37ef3c0fea09","Our fastest mover: a light 22KT pair made for daily wear, with plenty of ready stock."],
 ["T22-RG-207","ELIRA solitaire-look CZ ring","ELIRA","Rings",18,4.2,3.9,"CZ",15,1200,22,true,"1611955167811-4711904bb9f8","A solitaire-look CZ ring with a slim 18KT band. Engagement styling at an accessible price."],
 ["T22-RG-212","NAVYA moissanite halo ring","NAVYA","Rings",18,5.1,4.6,"Moissanite",16,9800,7,true,"1631982686092-e6561a853187","A moissanite centre stone ringed by a halo, set in heritage-inspired 18KT gold."],
 ["T22-RG-219","Men's signet ring, matte","Men","Rings",22,9.8,9.8,"Plain",9,0,11,false,"1598560917807-1bae44bd2be8","A weighty matte-finish signet ring in 22KT. Ready for engraving at the retailer's end."],
 ["T22-RG-225","Couple bands, 9KT gifting pair","Gifting","Rings",9,6.4,6.4,"Plain",12,0,30,true,"1622398925373-3f91b1e275f5","A matching pair of 9KT bands for anniversaries and corporate gifting."],
 ["T22-RG-231","Mangalsutra ring, black bead","Core","Rings",18,3.6,3.4,"Black beads",12,300,0,false,"1655707063513-a08dad26440e","The mangalsutra reimagined as a ring, with black beads on a fine 18KT band. Made to order."],
 ["T22-ER-305","ELIRA CZ drop earrings","ELIRA","Earrings",18,6.8,6.1,"CZ",15,1800,16,true,"1705326453273-1c35d7dad309","Pear-shaped CZ drops from ELIRA that move beautifully. A strong bridal and party seller."],
 ["T22-ER-311","NAVYA moissanite studs","NAVYA","Earrings",18,3.2,2.9,"Moissanite",16,7600,9,false,"1705326453282-e4e1b78f5fea","Floral moissanite studs with diamond-like fire, from the NAVYA heritage line."],
 ["T22-ER-318","Casting jhumka, temple motif","Core","Earrings",22,14.6,14.6,"Plain",11,0,5,true,"1705326454933-9685fc6888e1","A cast 22KT jhumka with a temple motif and bead fringe. Traditional, crisp detailing."],
 ["T22-ER-322","Rose gold ear cuff","Core","Earrings",18,2.4,2.4,"Plain",13,0,18,true,"1782400027260-3694aae56d1c","A no-piercing rose gold ear cuff, trending this month with younger buyers."],
 ["T22-ER-329","NAAZ Turkish chandbali","NAAZ","Earrings",22,19.2,18.4,"Colour stones",14,3800,2,false,"1701777892770-df3bf8006fd8","A dramatic chandbali with Turkish-inspired colour stones, from NAAZ."],
 ["T22-MS-402","Short mangalsutra, CZ pendant","Core","Mangalsutras",22,12.4,11.9,"CZ",11,900,10,true,"1651160670627-2896ddf7822f","A short black-bead mangalsutra with a CZ pendant. Modern and light for daily wear."],
 ["T22-MS-409","NAVYA moissanite mangalsutra","NAVYA","Mangalsutras",18,10.8,9.9,"Moissanite",16,14500,4,false,"1758995115857-2de1eb6283d0","A heritage mangalsutra with a moissanite pendant, from NAVYA."],
 ["T22-MS-415","Long mangalsutra, plain vati","Core","Mangalsutras",22,21.5,21.5,"Plain",9,0,6,false,"1600862754152-80a263dd564f","The classic long mangalsutra with twin vati in plain 22KT."],
 ["T22-CH-503","Men's curb chain 22\"","Men","Chains",22,24.6,24.6,"Plain",7,0,12,true,"1611107683227-e9060eccd846","A solid 22-inch curb chain for men, with a secure lobster clasp."],
 ["T22-CH-508","Rope chain 18\"","Core","Chains",22,11.2,11.2,"Plain",7,0,20,false,"1601121141461-920cb1993441","An 18-inch rope chain that works alone or with a pendant."],
 ["T22-PD-604","ELIRA CZ floral pendant","ELIRA","Pendants",18,3.9,3.5,"CZ",15,1100,14,false,"1685970731571-72ede0cb26ea","A five-petal CZ floral pendant from ELIRA, sold without chain."],
 ["T22-BR-702","Men's link bracelet","Men","Bracelets",22,18.3,18.3,"Plain",8,0,8,true,"1633810542706-90e5ff7557be","A bold 22KT link bracelet for men with a box clasp."],
 ["T22-BR-709","Rose gold CZ bracelet","ELIRA","Bracelets",18,8.7,8.0,"CZ",14,2100,1,false,"1611598935678-c88dca238fce","A rose gold tennis-style bracelet with CZ stones. Only one piece left."],
 ["T22-BR-714","Men's brooch, lapel","Men","Bracelets",22,7.4,7.1,"CZ",12,800,3,false,"1685970731194-e27b477e87ba","A lapel brooch for sherwanis and suits, with a CZ centre."]
];

const products = ROWS.map(r => ({
  code:r[0], name:r[1], col:r[2], cat:r[3], kt:r[4], gw:r[5], nw:r[6], stone:r[7], mk:r[8], stoneCh:r[9],
  stock:r[10], isNew:r[11], photo:r[12], desc:r[13],
  image:(w)=>img(r[12], w)
}));

const rateFor = (rate22, kt) => rate22 / FINENESS[22] * FINENESS[kt];
const priceOf = (p, rate22) => p.nw * rateFor(rate22, p.kt) * (1 + p.mk / 100) + p.stoneCh;
const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
const stockLabel = p => p.stock === 0 ? ["out","Made to order"] : p.stock <= 3 ? ["low",`Only ${p.stock} left`] : ["ok",`${p.stock} in stock`];
const waLink = text => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

window.T22 = { CONTACT, DEFAULT_RATE22, FINENESS, GST, products, byCode:c=>products.find(p=>p.code===c), rateFor, priceOf, inr, stockLabel, waLink, img };
})();
