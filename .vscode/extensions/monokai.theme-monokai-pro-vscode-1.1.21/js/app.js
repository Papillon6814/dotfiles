!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.app=t():e.app=t()}(global,function(){return function(e){var t={};function o(r){if(t[r])return t[r].exports;var i=t[r]={i:r,l:!1,exports:{}};return e[r].call(i.exports,i,i.exports,o),i.l=!0,i.exports}return o.m=e,o.c=t,o.d=function(e,t,r){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(o.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)o.d(r,i,function(t){return e[t]}.bind(null,i));return r},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=10)}([function(e,t){e.exports=require("fs")},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;
/**
 * [js-md5]{@link https://github.com/emn178/js-md5}
 *
 * @namespace md5
 * @version 0.7.3
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */!function(){"use strict";var ERROR="input is invalid type",WINDOW="object"==typeof window,root=WINDOW?window:{};root.JS_MD5_NO_WINDOW&&(WINDOW=!1);var WEB_WORKER=!WINDOW&&"object"==typeof self,NODE_JS=!root.JS_MD5_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node;NODE_JS?root=global:WEB_WORKER&&(root=self);var COMMON_JS=!root.JS_MD5_NO_COMMON_JS&&"object"==typeof module&&module.exports,AMD=__webpack_require__(2),ARRAY_BUFFER=!root.JS_MD5_NO_ARRAY_BUFFER&&"undefined"!=typeof ArrayBuffer,HEX_CHARS="0123456789abcdef".split(""),EXTRA=[128,32768,8388608,-2147483648],SHIFT=[0,8,16,24],OUTPUT_TYPES=["hex","array","digest","buffer","arrayBuffer","base64"],BASE64_ENCODE_CHAR="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""),blocks=[],buffer8;if(ARRAY_BUFFER){var buffer=new ArrayBuffer(68);buffer8=new Uint8Array(buffer),blocks=new Uint32Array(buffer)}!root.JS_MD5_NO_NODE_JS&&Array.isArray||(Array.isArray=function(e){return"[object Array]"===Object.prototype.toString.call(e)}),!ARRAY_BUFFER||!root.JS_MD5_NO_ARRAY_BUFFER_IS_VIEW&&ArrayBuffer.isView||(ArrayBuffer.isView=function(e){return"object"==typeof e&&e.buffer&&e.buffer.constructor===ArrayBuffer});var createOutputMethod=function(e){return function(t){return new Md5(!0).update(t)[e]()}},createMethod=function(){var e=createOutputMethod("hex");NODE_JS&&(e=nodeWrap(e)),e.create=function(){return new Md5},e.update=function(t){return e.create().update(t)};for(var t=0;t<OUTPUT_TYPES.length;++t){var o=OUTPUT_TYPES[t];e[o]=createOutputMethod(o)}return e},nodeWrap=function(method){var crypto=eval("require('crypto')"),Buffer=eval("require('buffer').Buffer"),nodeMethod=function(e){if("string"==typeof e)return crypto.createHash("md5").update(e,"utf8").digest("hex");if(null==e)throw ERROR;return e.constructor===ArrayBuffer&&(e=new Uint8Array(e)),Array.isArray(e)||ArrayBuffer.isView(e)||e.constructor===Buffer?crypto.createHash("md5").update(new Buffer(e)).digest("hex"):method(e)};return nodeMethod};function Md5(e){if(e)blocks[0]=blocks[16]=blocks[1]=blocks[2]=blocks[3]=blocks[4]=blocks[5]=blocks[6]=blocks[7]=blocks[8]=blocks[9]=blocks[10]=blocks[11]=blocks[12]=blocks[13]=blocks[14]=blocks[15]=0,this.blocks=blocks,this.buffer8=buffer8;else if(ARRAY_BUFFER){var t=new ArrayBuffer(68);this.buffer8=new Uint8Array(t),this.blocks=new Uint32Array(t)}else this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];this.h0=this.h1=this.h2=this.h3=this.start=this.bytes=this.hBytes=0,this.finalized=this.hashed=!1,this.first=!0}Md5.prototype.update=function(e){if(!this.finalized){var t,o=typeof e;if("string"!==o){if("object"!==o)throw ERROR;if(null===e)throw ERROR;if(ARRAY_BUFFER&&e.constructor===ArrayBuffer)e=new Uint8Array(e);else if(!(Array.isArray(e)||ARRAY_BUFFER&&ArrayBuffer.isView(e)))throw ERROR;t=!0}for(var r,i,n=0,s=e.length,a=this.blocks,c=this.buffer8;n<s;){if(this.hashed&&(this.hashed=!1,a[0]=a[16],a[16]=a[1]=a[2]=a[3]=a[4]=a[5]=a[6]=a[7]=a[8]=a[9]=a[10]=a[11]=a[12]=a[13]=a[14]=a[15]=0),t)if(ARRAY_BUFFER)for(i=this.start;n<s&&i<64;++n)c[i++]=e[n];else for(i=this.start;n<s&&i<64;++n)a[i>>2]|=e[n]<<SHIFT[3&i++];else if(ARRAY_BUFFER)for(i=this.start;n<s&&i<64;++n)(r=e.charCodeAt(n))<128?c[i++]=r:r<2048?(c[i++]=192|r>>6,c[i++]=128|63&r):r<55296||r>=57344?(c[i++]=224|r>>12,c[i++]=128|r>>6&63,c[i++]=128|63&r):(r=65536+((1023&r)<<10|1023&e.charCodeAt(++n)),c[i++]=240|r>>18,c[i++]=128|r>>12&63,c[i++]=128|r>>6&63,c[i++]=128|63&r);else for(i=this.start;n<s&&i<64;++n)(r=e.charCodeAt(n))<128?a[i>>2]|=r<<SHIFT[3&i++]:r<2048?(a[i>>2]|=(192|r>>6)<<SHIFT[3&i++],a[i>>2]|=(128|63&r)<<SHIFT[3&i++]):r<55296||r>=57344?(a[i>>2]|=(224|r>>12)<<SHIFT[3&i++],a[i>>2]|=(128|r>>6&63)<<SHIFT[3&i++],a[i>>2]|=(128|63&r)<<SHIFT[3&i++]):(r=65536+((1023&r)<<10|1023&e.charCodeAt(++n)),a[i>>2]|=(240|r>>18)<<SHIFT[3&i++],a[i>>2]|=(128|r>>12&63)<<SHIFT[3&i++],a[i>>2]|=(128|r>>6&63)<<SHIFT[3&i++],a[i>>2]|=(128|63&r)<<SHIFT[3&i++]);this.lastByteIndex=i,this.bytes+=i-this.start,i>=64?(this.start=i-64,this.hash(),this.hashed=!0):this.start=i}return this.bytes>4294967295&&(this.hBytes+=this.bytes/4294967296<<0,this.bytes=this.bytes%4294967296),this}},Md5.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var e=this.blocks,t=this.lastByteIndex;e[t>>2]|=EXTRA[3&t],t>=56&&(this.hashed||this.hash(),e[0]=e[16],e[16]=e[1]=e[2]=e[3]=e[4]=e[5]=e[6]=e[7]=e[8]=e[9]=e[10]=e[11]=e[12]=e[13]=e[14]=e[15]=0),e[14]=this.bytes<<3,e[15]=this.hBytes<<3|this.bytes>>>29,this.hash()}},Md5.prototype.hash=function(){var e,t,o,r,i,n,s=this.blocks;this.first?t=((t=((e=((e=s[0]-680876937)<<7|e>>>25)-271733879<<0)^(o=((o=(-271733879^(r=((r=(-1732584194^2004318071&e)+s[1]-117830708)<<12|r>>>20)+e<<0)&(-271733879^e))+s[2]-1126478375)<<17|o>>>15)+r<<0)&(r^e))+s[3]-1316259209)<<22|t>>>10)+o<<0:(e=this.h0,t=this.h1,o=this.h2,t=((t+=((e=((e+=((r=this.h3)^t&(o^r))+s[0]-680876936)<<7|e>>>25)+t<<0)^(o=((o+=(t^(r=((r+=(o^e&(t^o))+s[1]-389564586)<<12|r>>>20)+e<<0)&(e^t))+s[2]+606105819)<<17|o>>>15)+r<<0)&(r^e))+s[3]-1044525330)<<22|t>>>10)+o<<0),t=((t+=((e=((e+=(r^t&(o^r))+s[4]-176418897)<<7|e>>>25)+t<<0)^(o=((o+=(t^(r=((r+=(o^e&(t^o))+s[5]+1200080426)<<12|r>>>20)+e<<0)&(e^t))+s[6]-1473231341)<<17|o>>>15)+r<<0)&(r^e))+s[7]-45705983)<<22|t>>>10)+o<<0,t=((t+=((e=((e+=(r^t&(o^r))+s[8]+1770035416)<<7|e>>>25)+t<<0)^(o=((o+=(t^(r=((r+=(o^e&(t^o))+s[9]-1958414417)<<12|r>>>20)+e<<0)&(e^t))+s[10]-42063)<<17|o>>>15)+r<<0)&(r^e))+s[11]-1990404162)<<22|t>>>10)+o<<0,t=((t+=((e=((e+=(r^t&(o^r))+s[12]+1804603682)<<7|e>>>25)+t<<0)^(o=((o+=(t^(r=((r+=(o^e&(t^o))+s[13]-40341101)<<12|r>>>20)+e<<0)&(e^t))+s[14]-1502002290)<<17|o>>>15)+r<<0)&(r^e))+s[15]+1236535329)<<22|t>>>10)+o<<0,t=((t+=((r=((r+=(t^o&((e=((e+=(o^r&(t^o))+s[1]-165796510)<<5|e>>>27)+t<<0)^t))+s[6]-1069501632)<<9|r>>>23)+e<<0)^e&((o=((o+=(e^t&(r^e))+s[11]+643717713)<<14|o>>>18)+r<<0)^r))+s[0]-373897302)<<20|t>>>12)+o<<0,t=((t+=((r=((r+=(t^o&((e=((e+=(o^r&(t^o))+s[5]-701558691)<<5|e>>>27)+t<<0)^t))+s[10]+38016083)<<9|r>>>23)+e<<0)^e&((o=((o+=(e^t&(r^e))+s[15]-660478335)<<14|o>>>18)+r<<0)^r))+s[4]-405537848)<<20|t>>>12)+o<<0,t=((t+=((r=((r+=(t^o&((e=((e+=(o^r&(t^o))+s[9]+568446438)<<5|e>>>27)+t<<0)^t))+s[14]-1019803690)<<9|r>>>23)+e<<0)^e&((o=((o+=(e^t&(r^e))+s[3]-187363961)<<14|o>>>18)+r<<0)^r))+s[8]+1163531501)<<20|t>>>12)+o<<0,t=((t+=((r=((r+=(t^o&((e=((e+=(o^r&(t^o))+s[13]-1444681467)<<5|e>>>27)+t<<0)^t))+s[2]-51403784)<<9|r>>>23)+e<<0)^e&((o=((o+=(e^t&(r^e))+s[7]+1735328473)<<14|o>>>18)+r<<0)^r))+s[12]-1926607734)<<20|t>>>12)+o<<0,t=((t+=((n=(r=((r+=((i=t^o)^(e=((e+=(i^r)+s[5]-378558)<<4|e>>>28)+t<<0))+s[8]-2022574463)<<11|r>>>21)+e<<0)^e)^(o=((o+=(n^t)+s[11]+1839030562)<<16|o>>>16)+r<<0))+s[14]-35309556)<<23|t>>>9)+o<<0,t=((t+=((n=(r=((r+=((i=t^o)^(e=((e+=(i^r)+s[1]-1530992060)<<4|e>>>28)+t<<0))+s[4]+1272893353)<<11|r>>>21)+e<<0)^e)^(o=((o+=(n^t)+s[7]-155497632)<<16|o>>>16)+r<<0))+s[10]-1094730640)<<23|t>>>9)+o<<0,t=((t+=((n=(r=((r+=((i=t^o)^(e=((e+=(i^r)+s[13]+681279174)<<4|e>>>28)+t<<0))+s[0]-358537222)<<11|r>>>21)+e<<0)^e)^(o=((o+=(n^t)+s[3]-722521979)<<16|o>>>16)+r<<0))+s[6]+76029189)<<23|t>>>9)+o<<0,t=((t+=((n=(r=((r+=((i=t^o)^(e=((e+=(i^r)+s[9]-640364487)<<4|e>>>28)+t<<0))+s[12]-421815835)<<11|r>>>21)+e<<0)^e)^(o=((o+=(n^t)+s[15]+530742520)<<16|o>>>16)+r<<0))+s[2]-995338651)<<23|t>>>9)+o<<0,t=((t+=((r=((r+=(t^((e=((e+=(o^(t|~r))+s[0]-198630844)<<6|e>>>26)+t<<0)|~o))+s[7]+1126891415)<<10|r>>>22)+e<<0)^((o=((o+=(e^(r|~t))+s[14]-1416354905)<<15|o>>>17)+r<<0)|~e))+s[5]-57434055)<<21|t>>>11)+o<<0,t=((t+=((r=((r+=(t^((e=((e+=(o^(t|~r))+s[12]+1700485571)<<6|e>>>26)+t<<0)|~o))+s[3]-1894986606)<<10|r>>>22)+e<<0)^((o=((o+=(e^(r|~t))+s[10]-1051523)<<15|o>>>17)+r<<0)|~e))+s[1]-2054922799)<<21|t>>>11)+o<<0,t=((t+=((r=((r+=(t^((e=((e+=(o^(t|~r))+s[8]+1873313359)<<6|e>>>26)+t<<0)|~o))+s[15]-30611744)<<10|r>>>22)+e<<0)^((o=((o+=(e^(r|~t))+s[6]-1560198380)<<15|o>>>17)+r<<0)|~e))+s[13]+1309151649)<<21|t>>>11)+o<<0,t=((t+=((r=((r+=(t^((e=((e+=(o^(t|~r))+s[4]-145523070)<<6|e>>>26)+t<<0)|~o))+s[11]-1120210379)<<10|r>>>22)+e<<0)^((o=((o+=(e^(r|~t))+s[2]+718787259)<<15|o>>>17)+r<<0)|~e))+s[9]-343485551)<<21|t>>>11)+o<<0,this.first?(this.h0=e+1732584193<<0,this.h1=t-271733879<<0,this.h2=o-1732584194<<0,this.h3=r+271733878<<0,this.first=!1):(this.h0=this.h0+e<<0,this.h1=this.h1+t<<0,this.h2=this.h2+o<<0,this.h3=this.h3+r<<0)},Md5.prototype.hex=function(){this.finalize();var e=this.h0,t=this.h1,o=this.h2,r=this.h3;return HEX_CHARS[e>>4&15]+HEX_CHARS[15&e]+HEX_CHARS[e>>12&15]+HEX_CHARS[e>>8&15]+HEX_CHARS[e>>20&15]+HEX_CHARS[e>>16&15]+HEX_CHARS[e>>28&15]+HEX_CHARS[e>>24&15]+HEX_CHARS[t>>4&15]+HEX_CHARS[15&t]+HEX_CHARS[t>>12&15]+HEX_CHARS[t>>8&15]+HEX_CHARS[t>>20&15]+HEX_CHARS[t>>16&15]+HEX_CHARS[t>>28&15]+HEX_CHARS[t>>24&15]+HEX_CHARS[o>>4&15]+HEX_CHARS[15&o]+HEX_CHARS[o>>12&15]+HEX_CHARS[o>>8&15]+HEX_CHARS[o>>20&15]+HEX_CHARS[o>>16&15]+HEX_CHARS[o>>28&15]+HEX_CHARS[o>>24&15]+HEX_CHARS[r>>4&15]+HEX_CHARS[15&r]+HEX_CHARS[r>>12&15]+HEX_CHARS[r>>8&15]+HEX_CHARS[r>>20&15]+HEX_CHARS[r>>16&15]+HEX_CHARS[r>>28&15]+HEX_CHARS[r>>24&15]},Md5.prototype.toString=Md5.prototype.hex,Md5.prototype.digest=function(){this.finalize();var e=this.h0,t=this.h1,o=this.h2,r=this.h3;return[255&e,e>>8&255,e>>16&255,e>>24&255,255&t,t>>8&255,t>>16&255,t>>24&255,255&o,o>>8&255,o>>16&255,o>>24&255,255&r,r>>8&255,r>>16&255,r>>24&255]},Md5.prototype.array=Md5.prototype.digest,Md5.prototype.arrayBuffer=function(){this.finalize();var e=new ArrayBuffer(16),t=new Uint32Array(e);return t[0]=this.h0,t[1]=this.h1,t[2]=this.h2,t[3]=this.h3,e},Md5.prototype.buffer=Md5.prototype.arrayBuffer,Md5.prototype.base64=function(){for(var e,t,o,r="",i=this.array(),n=0;n<15;)e=i[n++],t=i[n++],o=i[n++],r+=BASE64_ENCODE_CHAR[e>>>2]+BASE64_ENCODE_CHAR[63&(e<<4|t>>>4)]+BASE64_ENCODE_CHAR[63&(t<<2|o>>>6)]+BASE64_ENCODE_CHAR[63&o];return e=i[n],r+=BASE64_ENCODE_CHAR[e>>>2]+BASE64_ENCODE_CHAR[e<<4&63]+"=="};var exports=createMethod();COMMON_JS?module.exports=exports:(root.md5=exports,AMD&&(__WEBPACK_AMD_DEFINE_RESULT__=function(){return exports}.call(exports,__webpack_require__,exports,module),void 0===__WEBPACK_AMD_DEFINE_RESULT__||(module.exports=__WEBPACK_AMD_DEFINE_RESULT__)))}()},function(e,t){(function(t){e.exports=t}).call(this,{})},function(e,t,o){(function(t){const r=o(4),i=o(5),{promises:n,constants:s}=o(0),a=o(6),c=o(8),h=o(9),u=r.join(t,"xdg-open"),{platform:l,arch:f}=process,p=(()=>{let e;return async function(){if(e)return e;let t=!1;try{await n.access("/etc/wsl.conf",s.F_OK),t=!0}catch{}if(!t)return"/mnt/";const o=await n.readFile("/etc/wsl.conf",{encoding:"utf8"}),r=/(?<!#.*)root\s*=\s*(?<mountPoint>.*)/g.exec(o);return r?e=(e=r.groups.mountPoint.trim()).endsWith("/")?e:`${e}/`:"/mnt/"}})(),d=async(e,t)=>{let o;for(const r of e)try{return await t(r)}catch(e){o=e}throw o},m=async e=>{if(e={wait:!1,background:!1,newInstance:!1,allowNonzeroExitCode:!1,...e},Array.isArray(e.app))return d(e.app,t=>m({...e,app:t}));let o,{name:r,arguments:h=[]}=e.app||{};if(h=[...h],Array.isArray(r))return d(r,t=>m({...e,app:{name:t,arguments:h}}));const f=[],y={};if("darwin"===l)o="open",e.wait&&f.push("--wait-apps"),e.background&&f.push("--background"),e.newInstance&&f.push("--new"),r&&f.push("-a",r);else if("win32"===l||a&&!c()){const t=await p();o=a?`${t}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`:`${Object({NODE_ENV:"production"}).SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`,f.push("-NoProfile","-NonInteractive","–ExecutionPolicy","Bypass","-EncodedCommand"),a||(y.windowsVerbatimArguments=!0);const i=["Start"];e.wait&&i.push("-Wait"),r?(i.push(`"\`"${r}\`""`,"-ArgumentList"),e.target&&h.unshift(e.target)):e.target&&i.push(`"${e.target}"`),h.length>0&&(h=h.map(e=>`"\`"${e}\`""`),i.push(h.join(","))),e.target=Buffer.from(i.join(" "),"utf16le").toString("base64")}else{if(r)o=r;else{const e="/"===t;let r=!1;try{await n.access(u,s.X_OK),r=!0}catch{}o=process.versions.electron||"android"===l||e||!r?"xdg-open":u}h.length>0&&f.push(...h),e.wait||(y.stdio="ignore",y.detached=!0)}e.target&&f.push(e.target),"darwin"===l&&h.length>0&&f.push("--args",...h);const _=i.spawn(o,f,y);return e.wait?new Promise((t,o)=>{_.once("error",o),_.once("close",r=>{e.allowNonzeroExitCode&&r>0?o(new Error(`Exited with code ${r}`)):t(_)})}):(_.unref(),_)},y=(e,t)=>{if("string"!=typeof e)throw new TypeError("Expected a `target`");return m({...t,target:e})};function _(e){if("string"==typeof e||Array.isArray(e))return e;const{[f]:t}=e;if(!t)throw new Error(`${f} is not supported`);return t}function E({[l]:e},{wsl:t}){if(t&&a)return _(t);if(!e)throw new Error(`${l} is not supported`);return _(e)}const S={};h(S,"chrome",()=>E({darwin:"google chrome",win32:"chrome",linux:["google-chrome","google-chrome-stable","chromium"]},{wsl:{ia32:"/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",x64:["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe","/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]}})),h(S,"firefox",()=>E({darwin:"firefox",win32:"C:\\Program Files\\Mozilla Firefox\\firefox.exe",linux:"firefox"},{wsl:"/mnt/c/Program Files/Mozilla Firefox/firefox.exe"})),h(S,"edge",()=>E({darwin:"microsoft edge",win32:"msedge",linux:["microsoft-edge","microsoft-edge-dev"]},{wsl:"/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"})),y.apps=S,y.openApp=(e,t)=>{if("string"!=typeof e)throw new TypeError("Expected a `name`");const{arguments:o=[]}=t||{};if(null!=o&&!Array.isArray(o))throw new TypeError("Expected `appArguments` as Array type");return m({...t,app:{name:e,arguments:o}})},e.exports=y}).call(this,"/")},function(e,t){e.exports=require("path")},function(e,t){e.exports=require("child_process")},function(e,t,o){"use strict";const r=o(7),i=o(0),n=()=>{if("linux"!==process.platform)return!1;if(r.release().includes("Microsoft"))return!0;try{return i.readFileSync("/proc/version","utf8").includes("Microsoft")}catch(e){return!1}};Object({NODE_ENV:"production"}).__IS_WSL_TEST__?e.exports=n:e.exports=n()},function(e,t){e.exports=require("os")},function(e,t,o){"use strict";const r=o(0);let i;e.exports=()=>(void 0===i&&(i=function(){try{return r.statSync("/.dockerenv"),!0}catch(e){return!1}}()||function(){try{return r.readFileSync("/proc/self/cgroup","utf8").includes("docker")}catch(e){return!1}}()),i)},function(e,t,o){"use strict";e.exports=(e,t,o)=>{const r=o=>Object.defineProperty(e,t,{value:o,enumerable:!0,writable:!0});return Object.defineProperty(e,t,{configurable:!0,enumerable:!0,get(){const e=o();return r(e),e},set(e){r(e)}}),e}},function(e,t,o){"use strict";o.r(t);var r={APP:{NAME:"MonokaiPro-VSCode",THEMES:["Monokai Pro","Monokai Pro (Filter Octagon)","Monokai Pro (Filter Ristretto)","Monokai Pro (Filter Spectrum)","Monokai Pro (Filter Machine)","Monokai Classic"],DESCRIPTION:"Monokai Pro theme and color scheme for Visual Studio Code",VERSION:"1.1.21",AUTHOR:"Monokai",CREATION_DATE:2022,BUILD_DATE:"27-8-2022",DEBUG:!1,UUID:"fd330f6f-3f41-421d-9fe5-de742d0c54c0",SECONDS_TO_EXPIRE:172800,SECONDS_TO_EXPIRE_FAST:86400,SLOW_PERIOD:604800}},i=o(1),n=o.n(i);function s(e,t){for(var o=0;o<t.length;o++){var r=t[o];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}var a=function(){function e(t,o){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.extensionContext=t,this.vscode=o,this.isFirstTime=!1,this.globalState=this.extensionContext.globalState,this.load()}var t,o,i;return t=e,(o=[{key:"loadCurrentUserSettings",value:function(){var e=this.vscode.workspace.getConfiguration("workbench");this.version=r.VERSION,this.colorTheme=e.colorTheme,this.iconTheme=e.iconTheme;var t=this.vscode.workspace.getConfiguration("monokaiPro");this.fileIconsMonochrome=t.get("fileIconsMonochrome",!1)}},{key:"get",value:function(){return{fileIconsMonochrome:this.fileIconsMonochrome,iconTheme:this.iconTheme,colorTheme:this.colorTheme}}},{key:"load",value:function(){return this.loadCurrentUserSettings(),this.firstTimeStamp=this.globalState.get("firstTimeStamp",0),this.lastTimeStamp=this.globalState.get("lastTimeStamp",0),this.firstTimeStamp||(this.isFirstTime=!0,this.firstTimeStamp=this.getCurrentTimeStamp(),this.update("firstTimeStamp",this.firstTimeStamp)),this.lastTimeStamp||(this.lastTimeStamp=this.getCurrentTimeStamp(),this.update("lastTimeStamp",this.lastTimeStamp)),this.thankYouMessageShown=this.globalState.get("thankYouMessageShown",!1),this.email=this.globalState.get("email",""),this.licenseKey=this.globalState.get("licenseKey",""),this.get()}},{key:"updateTheme",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},o="".concat(e).concat(this.fileIconsMonochrome?" Monochrome ":" ","Icons"),r=this.vscode.workspace.getConfiguration("workbench"),i=r.iconTheme;e!==t.colorTheme&&r.update("colorTheme",e,!0),(this.isValidIconTheme(i)||this.isFirstTime)&&o!==t.iconTheme&&r.update("iconTheme",o,!0),this.load()}},{key:"update",value:function(e,t){this.globalState.update(e,t)}},{key:"getCurrentTimeStamp",value:function(){return Math.floor(Date.now()/1e3)}},{key:"isValidLicense",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";if(!e||!t)return!1;var o=n()("".concat(r.APP.UUID).concat(e)),i=o.match(/.{1,5}/g),s=i.slice(0,5).join("-");return t===s}},{key:"isValidIconTheme",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return r.APP.THEMES.includes(e.replace(/ (Monochrome )?Icons$/,""))}},{key:"hasValidLicense",get:function(){return this.isValidLicense(this.email,this.licenseKey)}},{key:"isExpired",get:function(){return this.isUsingForAWhile?this.getCurrentTimeStamp()-this.lastTimeStamp>r.APP.SECONDS_TO_EXPIRE_FAST:this.getCurrentTimeStamp()-this.lastTimeStamp>r.APP.SECONDS_TO_EXPIRE}},{key:"isUsingForAWhile",get:function(){return this.lastTimeStamp-this.firstTimeStamp>r.APP.SLOW_PERIOD}},{key:"hasActiveMonokaiProColorTheme",get:function(){return r.APP.THEMES.includes(this.colorTheme)}},{key:"hasActiveMonokaiProIconTheme",get:function(){return this.isValidIconTheme(this.iconTheme)}}])&&s(t.prototype,o),i&&s(t,i),Object.defineProperty(t,"prototype",{writable:!1}),e}();function c(e,t){for(var o=0;o<t.length;o++){var r=t[o];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}o.d(t,"default",function(){return u});var h=o(3),u=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.vscode=t,this.state=null}var t,o,i;return t=e,(o=[{key:"activate",value:function(e){var t=this;this.state=new a(e,this.vscode);var o={"monokai_pro.enter_license":function(){return t.enterLicense()},"monokai_pro.select_theme":function(){return t.selectTheme()},"monokai_pro.activate_icons":function(){return t.activateIcons()}};Object.keys(o).forEach(function(r){var i=t.vscode.commands.registerCommand(r,o[r]);e.subscriptions.push(i)}),this.vscode.workspace.onDidChangeConfiguration(function(){var e=t.state.get(),o=t.state.load();t.state.hasActiveMonokaiProColorTheme&&t.state.updateTheme(o.colorTheme,e)}),(this.state.hasActiveMonokaiProColorTheme||this.state.hasActiveMonokaiProIconTheme)&&this.checkLicense()}},{key:"enterLicense",value:function(){var e=this;this.vscode.window.showInputBox({ignoreFocusOut:!0,placeHolder:"your email address",prompt:"Please enter the email address you've used to purchase your license (or type 'reset' to reset your license).",validateInput:function(e){return"reset"===e||/.+@.+\..+/i.test(e)?null:"Please enter a valid email address."}}).then(function(t){var o=t.replace(/^\s+|\s+$/g,"");"reset"===o?(e.state.update("email",void 0),e.state.update("licenseKey",void 0),e.showMessageLicenseReset()):o&&e.vscode.window.showInputBox({ignoreFocusOut:!0,placeHolder:"your license key",prompt:"Please enter your Monokai Pro license key."}).then(function(t){t&&(e.state.update("email",o),e.state.update("licenseKey",t),e.state.isValidLicense(o,t)||e.state.isValidLicense(o.toLowerCase(),t)?e.showMessageValidLicense():e.showMessageInvalidLicense())})})}},{key:"selectTheme",value:function(){var e=this,t=[];r.APP.THEMES.forEach(function(e){t.push({label:e})}),this.vscode.window.showQuickPick(t,{placeHolder:"Monokai Pro theme"}).then(function(t){t&&e.state.updateTheme(t.label)})}},{key:"activateIcons",value:function(){this.vscode.workspace.getConfiguration("workbench").update("iconTheme","Monokai Pro Icons",!0)}},{key:"checkLicense",value:function(){var e=this;this.state.hasValidLicense?this.state.thankYouMessageShown||this.showMessageValidLicense():this.state.isExpired&&(this.state.isUsingForAWhile&&Math.random()<.5?setTimeout(function(){e.showMessageEvaluation()},1e3*Math.floor(60*(120*Math.random()+5))):this.showMessageEvaluation(),this.state.update("lastTimeStamp",this.state.getCurrentTimeStamp()))}},{key:"deactivate",value:function(){}},{key:"showMessageLicenseReset",value:function(){this.vscode.window.showInformationMessage("Monokai Pro license information is reset")}},{key:"showMessageValidLicense",value:function(){this.vscode.window.showInformationMessage("Thanks for your purchase of Monokai Pro.",{modal:!0}),this.state.update("thankYouMessageShown",!0)}},{key:"showMessageInvalidLicense",value:function(){this.vscode.window.showErrorMessage("Invalid license. Please enter your email and license key exactly as in the email.")}},{key:"showMessageEvaluation",value:function(){var e={theme:this.state.colorTheme,version:r.APP.VERSION,name:r.APP.NAME},t=Object.keys(e).map(function(t){return"".concat(t,"=").concat(encodeURIComponent(e[t]))}).join("&");this.vscode.window.showInformationMessage("Thank you for evaluating Monokai Pro. Please purchase a license for extended use.",{modal:!0},"OK").then(function(e){if(e)switch(e.toUpperCase()){case"OK":h("https://monokai.pro?".concat(t))}})}},{key:"unspace",value:function(e){return e.replace(/ /g,"_")}}])&&c(t.prototype,o),i&&c(t,i),Object.defineProperty(t,"prototype",{writable:!1}),e}()}])});