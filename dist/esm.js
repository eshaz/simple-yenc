const t=(t,n=4294967295,e=79764919)=>{const r=new Int32Array(256);let o,s,i,c=n;for(o=0;o<256;o++){for(i=o<<24,s=8;s>0;--s)i=2147483648&i?i<<1^e:i<<1;r[o]=i}for(o=0;o<t.length;o++)c=c<<8^r[255&(c>>24^t[o])];return c},n=t=>{const n=[];for(const e of t){let t=(e+42)%256;0===t||10===t||13===t||61===t?n.push("="+String.fromCharCode((t+64)%256)):n.push(String.fromCharCode(t))}return n.join("")},e=(n,e=t)=>{const r=t=>new Uint8Array(t.length/2).map(((n,e)=>parseInt(t.substring(2*e,2*(e+1)),16))),o=t=>r(t)[0],s=new Map;[,8364,,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,,381,,,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,,382,376].forEach(((t,n)=>s.set(t,n)));const i=new Uint8Array(n.length);let c,a,l,f=!1,g=0,h=42,p=n.length>13&&"dynEncode"===n.substring(0,9),u=0;p&&(u=11,a=o(n.substring(9,u)),a<=1&&(u+=2,h=o(n.substring(11,u))),1===a&&(u+=8,l=(t=>new DataView(r(t).buffer).getInt32(0,!0))(n.substring(13,u))));const d=256-h;for(let t=u;t<n.length;t++)if(c=n.charCodeAt(t),61!==c||f){if(92===c&&t<n.length-5&&p){const e=n.charCodeAt(t+1);117!==e&&85!==e||(c=parseInt(n.substring(t+2,t+6),16),t+=5)}if(c>255){const t=s.get(c);t&&(c=t+127)}f&&(f=!1,c-=64),i[g++]=c<h&&c>0?c+d:c-h}else f=!0;const m=i.subarray(0,g);if(p&&1===a){const t=e(m);if(t!==l){const n="Decode failed crc32 validation";throw console.error("`simple-yenc`\n",n+"\n","Expected: "+l+"; Got: "+t+"\n","Visit https://github.com/eshaz/simple-yenc for more information"),Error(n)}}return m},r=(n,e='"',r=t,o)=>{const s=(t,n)=>(t%n+n)%n,i=(t,n)=>n.push(String.fromCharCode(61,(t+64)%256)),c=t=>t.map((t=>t.toString(16).padStart(2,"0")));let a,l,f=[],g=1/0,h=Array(256).fill(0);if('"'===e?(l=[0,8,9,10,11,12,13,34,92,61],a=t=>0===t||8===t||9===t||10===t||11===t||12===t||13===t||34===t||92===t||61===t):"'"===e?(l=[0,8,9,10,11,12,13,39,92,61],a=t=>0===t||8===t||9===t||10===t||11===t||12===t||13===t||39===t||92===t||61===t):"`"===e&&(l=[13,61,96],f=[7,205,231],a=(t,n)=>13===t||36===t&&123===n||61===t||92===t&&(85===n||117===n)||96===t),void 0===o){o=0;for(let t=0;t<n.length;t++){const e=0|n[t];h[e]++;for(let r=0;r<f.length;r++){const o=f[r];s(e-n[t+1]|0,256)===o&&h[e]++}}for(let t=0;t<256;t++){let n=0;for(let e=0;e<l.length;e++)n+=h[s(l[e]-t,256)];n<g&&(g=n,o=t)}}const p=["dynEncode","01",c([o]),...c((t=>{const n=new Uint8Array(4);return new DataView(n.buffer).setInt32(0,t,!0),[...n]})(r(n)))];for(let t=0;t<n.length;t++){const e=(n[t]+o)%256;a(e,(n[t+1]+o)%256)?i(e,p):p.push(String.fromCharCode(e))}return"\\"===p[p.length-1]&&a(92)&&(p.pop(),i("\\",p)),p.join("")},o=t=>t.replace(/[\\]/g,"\\\\").replace(/[`]/g,"\\`").replace(/\${/g,"\\${");export{t as crc32,e as decode,r as dynamicEncode,n as encode,o as stringify};
