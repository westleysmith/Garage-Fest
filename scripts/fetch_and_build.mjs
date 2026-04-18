// Fetches the live Modesto GarageFest map data, cleans it, and embeds it into index.html.
// Only works on event day when visitmodesto.com has the map active.
//
// Usage:  node scripts/fetch_and_build.mjs <nonce>
// The nonce comes from window.ASL_REMOTE.nonce on https://visitmodesto.com/modesto-garage-fest/
// Open that page in a browser, open DevTools console, type:  ASL_REMOTE.nonce
// Copy the value and pass it to this script.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const nonce = process.argv[2];
if (!nonce) {
  console.error('Usage: node scripts/fetch_and_build.mjs <nonce>');
  console.error('Get nonce from window.ASL_REMOTE.nonce on visitmodesto.com/modesto-garage-fest/');
  process.exit(1);
}

const CATS = {
  "353":"Accessories/Jewelry","354":"Arts & Crafts","355":"Baby/Kid Items","356":"Household",
  "357":"Outdoors","358":"Clothing","359":"Toys & Games","360":"Kitchen","361":"Books & Records",
  "362":"Collectibles","363":"Electronics","364":"Memorabilia","365":"420(IYKYK)","366":"Antiques",
  "367":"Tools","368":"Sports Equipment","369":"Auto Parts","370":"Appliances","371":"Garden",
  "372":"Music","590":"Baby & Kid Items","591":"Accessories & Jewelry","592":"Baby/Child Items"
};
const NORM = {
  "Accessories/Jewelry":"Accessories & Jewelry",
  "Baby/Kid Items":"Baby & Kid Items",
  "Baby/Child Items":"Baby & Kid Items"
};
const norm = n => NORM[n] || n;
const dh = s => (s||'').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\?/g,"'");

const body = new URLSearchParams({action:'asl_load_stores', nonce, load_all:'1', lang:''});
const res = await fetch('https://visitmodesto.com/wp-admin/admin-ajax.php', {method:'POST', body});
if (!res.ok) { console.error('HTTP', res.status); process.exit(1); }
const raw = await res.json();

const known = new Set(Object.keys(CATS));
const sales = raw
  .filter(s => (s.categories||'').split(',').some(c => known.has(c)))
  .map(s => ({
    id: s.id,
    title: dh(s.title),
    description: dh(s.description),
    description2: dh(s.description_2),
    street: dh(s.street),
    city: s.city, zip: s.postal_code,
    phone: s.phone || '',
    email: s.email || '',
    website: s.website || '',
    lat: parseFloat(s.lat), lng: parseFloat(s.lng),
    cats: [...new Set((s.categories||'').split(',').filter(c=>known.has(c)).map(c=>norm(CATS[c])))]
  }));
const seen = new Set();
const final = sales.filter(r => {
  const k = r.lat+','+r.lng+','+r.title.toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k); return true;
});

console.log('Total sales found:', final.length);
console.log('With description:', final.filter(s => s.description || s.description2).length);

// Write JSON data
fs.writeFileSync(path.join(root, 'data/modesto_garagefest_2026.json'), JSON.stringify(final));

// Write CSV
const esc = v => { v=String(v==null?'':v); return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; };
const header = ['id','title','street','city','zip','lat','lng','categories','description'];
const rows = final.map(s => [
  s.id, s.title, s.street, s.city, s.zip, s.lat, s.lng,
  s.cats.join('; '),
  [s.description, s.description2].filter(Boolean).join(' | ')
]);
const csv = [header.join(',')].concat(rows.map(r => r.map(esc).join(','))).join('\n');
fs.writeFileSync(path.join(root, 'data/modesto_garagefest_2026.csv'), csv);

// Embed into index.html
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const safe = JSON.stringify(final).replace(/<\//g, '<\\/');
const updated = html.replace(
  /(<script id="data" type="application\/json">)([\s\S]*?)(<\/script>)/,
  `$1${safe}$3`
);
fs.writeFileSync(htmlPath, updated);

console.log('Rebuilt: data/modesto_garagefest_2026.json, .csv, index.html');
