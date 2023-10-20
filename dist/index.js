"use strict";const t=(t,e=4294967295,r=79764919)=>{const n=new Int32Array(256);let o,s,c,i=e;for(o=0;o<256;o++){for(c=o<<24,s=8;s>0;--s)c=2147483648&c?c<<1^r:c<<1;n[o]=c}for(o=0;o<t.length;o++)i=i<<8^n[255&(i>>24^t[o])];return i};exports.crc32=t,exports.decode=(e,r=t)=>{const n=t=>new Uint8Array(t.length/2).map(((e,r)=>parseInt(t.substring(2*r,2*(r+1)),16))),o=t=>n(t)[0],s=new Map;[,8364,,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,,381,,,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,,382,376].forEach(((t,e)=>s.set(t,e)));const c=new Uint8Array(e.length);let i,a,l,f=!1,g=0,h=42,p=e.length>13&&"dynEncode"===e.substring(0,9),d=0;p&&(d=11,a=o(e.substring(9,d)),a<=1&&(d+=2,h=o(e.substring(11,d))),1===a&&(d+=8,l=(t=>new DataView(n(t).buffer).getInt32(0,!0))(e.substring(13,d))));const u=256-h;for(let t=d;t<e.length;t++)if(i=e.charCodeAt(t),61!==i||f){if(92===i&&t<e.length-5&&p){const r=e.charCodeAt(t+1);117!==r&&85!==r||(i=parseInt(e.substring(t+2,t+6),16),t+=5)}if(i>255){const t=s.get(i);t&&(i=t+127)}f&&(f=!1,i-=64),c[g++]=i<h&&i>0?i+u:i-h}else f=!0;const m=c.subarray(0,g);if(p&&1===a){const t=r(m);if(t!==l){const e="Decode failed crc32 validation";throw console.error("`simple-yenc`\n",e+"\n","Expected: "+l+"; Got: "+t+"\n","Visit https://github.com/eshaz/simple-yenc for more information"),Error(e)}}return m},exports.dynamicEncode=(e,r='"',n=t)=>{const o=(t,e)=>(t%e+e)%e,s=(t,e)=>e.push(String.fromCharCode(61,(t+64)%256)),c=t=>t.map((t=>t.toString(16).padStart(2,"0")));let i,a,l=[],f=1/0,g=Array(256).fill(0),h=0;'"'===r?(a=[0,8,9,10,11,12,13,34,92,61],i=t=>0===t||8===t||9===t||10===t||11===t||12===t||13===t||34===t||92===t||61===t):"'"===r?(a=[0,8,9,10,11,12,13,39,92,61],i=t=>0===t||8===t||9===t||10===t||11===t||12===t||13===t||39===t||92===t||61===t):"`"===r&&(a=[13,61,96],l=[7,205,231],i=(t,e)=>13===t||36===t&&123===e||61===t||92===t&&(85===e||117===e)||96===t);for(let t=0;t<e.length;t++){const r=0|e[t];g[r]++;for(let n=0;n<l.length;n++){const s=l[n];o(r-e[t+1]|0,256)===s&&g[r]++}}for(let t=0;t<256;t++){let e=0;for(let r=0;r<a.length;r++)e+=g[o(a[r]-t,256)];e<f&&(f=e,h=t)}const p=["dynEncode","01",c([h]),...c((t=>{const e=new Uint8Array(4);return new DataView(e.buffer).setInt32(0,t,!0),[...e]})(n(e)))];for(let t=0;t<e.length;t++){const r=(e[t]+h)%256;i(r,(e[t+1]+h)%256)?s(r,p):p.push(String.fromCharCode(r))}return"\\"===p[p.length-1]&&(p.pop(),s("\\",p)),p.join("")},exports.encode=t=>{const e=[];for(const r of t){let t=(r+42)%256;0===t||10===t||13===t||61===t?e.push("="+String.fromCharCode((t+64)%256)):e.push(String.fromCharCode(t))}return e.join("")},exports.stringify=t=>t.replace(/[\\]/g,"\\\\").replace(/[`]/g,"\\`").replace(/\${/g,"\\${");
