var J=Object.defineProperty;var Y=(t,e,s)=>e in t?J(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var p=(t,e,s)=>Y(t,typeof e!="symbol"?e+"":e,s);class k{static sendToBackground(e,s={}){return this.sendMessage({...s,type:e,to:"background"})}static sendToPopup(e,s={}){return this.sendMessage({...s,type:e,to:"popup"})}static sendMessage(e){return new Promise(s=>{try{e.from="content",e.to||(e.to="background"),chrome.runtime.sendMessage(e,a=>{chrome.runtime.lastError?s(null):s(a)})}catch{s(null)}})}static onMessage(e){chrome.runtime.onMessage.addListener((s,a,r)=>{try{e(s,a,r)}catch(n){console.error("[ExtensionBridge] Message handler error:",n),r(null)}return!0})}}class q{static postMessage(e){window.postMessage(e,"*")}static onMessage(e,s){window.addEventListener("message",a=>{if(a.source!==window)return;const r=a.data;r&&r.type===e&&s(r)})}}const f={API:{PATTERN:/['"`](?:\/|\.\.\/|\.\/)[^\/\>\< \)\(\}\,\'\"\\](?:[^\^\>\< \)\(\,\'\"\\])*?['"`]|['"`][a-zA_Z0-9]+(?<!text|application)\/(?:[^\^\>\< \)\(\{\}\,\'\"\\])*?["'`]/g,IMAGE_PATTERN:/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|mp3|mp4|m4a|wav|swf)(?:\?[^'"]*)?$/i,JS_PATTERN:/\.(js|jsx|ts|tsx|less)(?:\?[^'"]*)?$/i,DOC_PATTERN:/\.(pdf|doc|docx|xls|xlsx|ppt|exe|apk|zip|7z|dll|dmg|pptx|txt|rar|md|csv)(?:\?[^'"]*)?$/i,FONT_PATTERN:/\.(ttf|eot|woff|woff2|otf|css)(?:\?[^'"]*)?$/i,FILTERED_CONTENT_TYPES:["multipart/form-data","node_modules/","pause/break","partial/ajax","chrome/","firefox/","edge/","examples/element-ui","static/js/","static/css/","stylesheet/less","jpg/jpeg/png/pdf","yyyy/mm/dd","dd/mm/yyyy","mm/dd/yy","yy/mm/dd","m/d/Y","m/d/y","xx/xx","zrender/vml/vml"]},THIRD_PARTY_LIBS:[/^jquery(?:[\.-](?:cookie|fancybox|validate|artDialog|blockui|pack|base64|md5|dataTables|corner|enPlaceholder))?(?:[\.-]min)?(?:[.-]?\d*\.?\d*\.?\d*)?\.js$/i,/^(?:vue|vue-router|vuex|react|react-dom|angular|core-js)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,/^(?:bootstrap|layui|layer|element-ui|ant-design|liger|h-ui|uview|vant|iview|mui|flat-ui|pure-css|metisMenu)[.-]?\d*\.?\d*\.?\d*(?:[\.-]bundle)?(?:[\.-]all)?(?:[\.-]min)?\.js$/i,/^(?:datepicker|datetimepicker|wdatepicker|laydate|select2|swiper|slick|fancybox|magnific-popup)[.-]?\d*\.?\d*\.?\d*(?:[\.-]zh-CN)?(?:\.min)?\.js$/i,/^(?:handlebars|lodash|moment|axios|qs|md5|jsencrypt|crypto-js|base64|uuid|rxjs|immutable|underscore|backbone|require|seajs)[.-]?[v]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,/^(?:polyfill|modernizr|device|js-cookie|nprogress|pace|fingerprintjs|isotope|webuploader)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,/^(?:echarts|chart|highcharts|d3|v-charts|antv|viz|markmap|mermaid|plantuml-encoder|flowchart|abcjs-basic|smiles-drawer)[.-]?\d*\.?\d*\.?\d*(?:[\.-]all)?(?:\.min)?\.js$/i,/^(?:ueditor|kindeditor|tinymce|ckeditor|wangEditor|quill|monaco-editor|lute|highlight)[.-]?\d*\.?\d*\.?\d*(?:[\.-]config)?(?:[\.-]all)?(?:\.min)?\.js$/i,/^(?:plupload|pqgrid|lhgdialog|kendo|dataTables|editor|exporter|buttons|v5_float_4|full\.render|method)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i,/^(?:zh|en|zh-cn|zh-tw|ja|ko|i18n|third-languages)[.-]?\d*\.?\d*\.?\d*(?:\.min)?\.js$/i],DOMAIN:{BLACKLIST:["el.datepicker.today","obj.style.top","window.top","mydragdiv.style.top","container.style.top","location.host","page.info","res.info","item.info"]},IP:{SPECIAL_RANGES:[/^0\.0\.0\.0$/,/^255\.255\.255\.255$/]},SCHEDULER:{MAX_CONCURRENT:10},PATTERNS:{DOMAIN:/\b(?:(?!this)[a-z0-9%-]+\.)*?(?:(?!this)[a-z0-9%-]{2,}\.)(?:wang|club|xyz|vip|top|beer|work|ren|technology|fashion|luxe|yoga|red|love|online|ltd|chat|group|pub|run|city|live|kim|pet|space|site|tech|host|fun|store|pink|ski|design|ink|wiki|video|email|company|plus|center|cool|fund|gold|guru|life|team|today|world|zone|social|bio|black|blue|green|lotto|organic|poker|promo|vote|archi|voto|fit|cn|website|press|icu|art|law|shop|band|media|cab|cash|cafe|games|link|fan|net|cc|com|fans|cloud|info|pro|mobi|asia|studio|biz|vin|news|fyi|tax|tv|market|shopping|mba|sale|co|org)(?:\:\d{1,5})?(?![a-zA-Z0-9._=>\(\);!}-])\b/g,DOMAIN_RESOURCE:/["'](?:(?:[a-z0-9]+:)?\/\/)?(?:(?!this)[a-z0-9%-]+\.)*?(?:[a-z0-9%-]{2,}\.)(?:wang|club|xyz|vip|top|beer|work|ren|technology|fashion|luxe|yoga|red|love|online|ltd|chat|group|pub|run|city|live|kim|pet|space|site|tech|host|fun|store|pink|ski|design|ink|wiki|video|email|company|plus|center|cool|fund|gold|guru|life|team|today|world|zone|social|bio|black|blue|green|lotto|organic|poker|promo|vote|archi|voto|fit|cn|website|press|icu|art|law|shop|band|media|cab|cash|cafe|games|link|fan|net|cc|com|fans|cloud|info|pro|mobi|asia|studio|biz|vin|news|fyi|tax|tv|market|shopping|mba|sale|co|org)(?![a-zA-Z0-9.])(?:\:\d{1,5})?\S*?["']/g,DOMAIN_FILTER:/\b(?:[a-zA-Z0-9%-]+\.)+[a-z]{2,10}(?:\:\d{1,5})?\b/,IP:/(?<!\.|\d)(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?::\d{1,5})?(?!\.|[0-9])/g,IP_RESOURCE:/["'](?:(?:[a-zA-Z0-9%-]+\:)?\/\/)?(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?::\d{1,5}|\/)?\S*?["']/g,get API(){return f.API.PATTERN},PHONE:/(?<!\d|\.)(?:13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9]|198|199)\d{8}(?!\d)/g,EMAIL:/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+(?!\.png)\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?/g,IDCARD:/(?:\d{6}(?:19|20)(?:0\d|10|11|12)(?:[0-2]\d|30|31)\d{3}$)|(?:\d{6}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:[0-2]\d|30|31)\d{3}(?:\d|X|x))(?!\d)/g,URL:/(?:https?|wss?|ftp):\/\/(?:(?:[\w-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d{2,5})?(?:\/[^\s\>\)\}\<'"]*)?/gi,JWT:/["'](?:ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}|ey[A-Za-z0-9_\/+-]{10,}\.[A-Za-z0-9._\/+-]{10,})["']/g,COMPANY:/(?:[\u4e00-\u9fa5\（\）]{4,15}[^的](?:公司|中心)|[\u4e00-\u9fa5\（\）]{2,10}[^的](?:软件)|[\u4e00-\u9fa5]{2,15}(?:科技|集团))(?!法|点|与|查)/g,GITHUB:/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+/gi,WINDOWS_PATH:/(?:c|d|e|f|g):(?:\\\\[\w\u4e00-\u9fa5_@.-]+)+/gi,FINGER:{patterns:[{class:"Webpack",name:"Webpack页面特征",pattern:/(?:webpackJsonp|__webpack_require__|webpack-dev-server)/i,description:"构建工具，用于前端资源打包",type:"builder"},{class:"Webpack",name:"Webpack文件特征",pattern:/(?:chunk|main|app|vendor|common)s?(?:[-.][a-f0-9]{8,20})+.(?:css|js)/i,description:"构建工具，用于前端资源打包",type:"builder"},{class:"VisualStudio",name:"Visual Studio页面特征",pattern:/visual\sstudio/i,description:"开发工具，用于网页开发",type:"builder"},{class:"Cloudflare CDN",name:"页面特征",pattern:/cdnjs.cloudflare.com/i,description:"服务，用于网页加速",type:"cdn"},{class:"jsDelivr CDN",name:"页面特征",pattern:/cdn.jsdelivr.net/i,description:"服务，用于网页加速",type:"cdn"},{class:"Django",name:"页面特征",pattern:/csrfmiddlewaretoken/i,description:"框架",type:"framework",extType:"technology",extName:"Python"}]},CREDENTIALS:{patterns:[{name:"用户密码模式1",pattern:/['"]\w*(?:pwd|pass|user|member|account|password|passwd|admin|root|system)[_-]?(?:id|name)?[0-9]*["']\s*[:=]\s*(?:['"][^\,\s\"\(]*["'])/gi},{name:"用户密码模式2",pattern:/\w*(?:pwd|pass|user|member|account|password|passwd|admin|root|system)[_-]?(?:id|name)?[0-9]*\s*[:=]\s*(?:['"][^\,\s\"\(]*["'])/gi},{name:"用户密码模式3",pattern:/['"]\w*(?:pwd|pass|user|member|account|password|passwd|admin|root|system)[_-]?(?:id|name)?[0-9]*\s*[:=]\s*(?:[^\,\s\"\(]*)["']/gi}]},COOKIE:/\b\w*(?:token|PHPSESSID|JSESSIONID)\s*[:=]\s*["']?(?!localStorage)(?:[a-zA-Z0-9-._]{4,})["']?/ig,ID_KEY:{patterns:[{name:"微信开放平台密钥",pattern:/wx[a-z0-9]{15,18}/g},{name:"AWS密钥",pattern:/AKIA[0-9A-Z]{16}/g},{name:"阿里云密钥",pattern:/LTAI[A-Za-z\d]{12,30}/g},{name:"Google API密钥",pattern:/AIza[0-9A-Za-z_\-]{35}/g},{name:"腾讯云密钥",pattern:/AKID[A-Za-z\d]{13,40}/g},{name:"京东云密钥",pattern:/JDC_[0-9A-Z]{25,40}/g},{name:"其他AWS密钥",pattern:/(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g},{name:"支付宝开放平台密钥",pattern:/(?:AKLT|AKTP)[a-zA-Z0-9]{35,50}/g},{name:"GitLab Token1",pattern:/glpat-[a-zA-Z0-9\-=_]{20,22}/g},{name:"GitHub Token2",pattern:/(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255}/g},{name:"Apple开发者密钥",pattern:/APID[a-zA-Z0-9]{32,42}/g},{name:"企业微信密钥",pattern:/ww[a-z0-9]{15,18}/g},{name:"key1",pattern:/(?:['"]?(?:[\w-]*(?:secret|oss|bucket|key)[\w-]*)|ak["']?)\s*[:=]\s*(?:"(?!\+)[^\,\"\(\>\<]{6,}"|'(?!\+)[^\,\'\(\>\<]{6,}'|[0-9a-zA-Z_-]{16,})/ig},{name:"key2",pattern:/["'][a-zA-Z0-9]{32}["']/g}]}}},E={SHORT_VALUES:new Set(["up","in","by","of","is","on","to","no","age","all","app","ang","bar","bea","big","bug","can","com","con","cry","dom","dow","emp","ent","eta","eye","for","get","gen","has","hei","hid","ing","int","ken","key","lea","log","low","met","mod","new","nor","not","num","red","obj","old","out","pic","pre","pro","pop","pun","put","rad","ran","ref","red","reg","ren","rig","row","sea","set","seq","shi","str","sub","sup","sun","tab","tan","tip","top","uri","url","use","ver","via","rce","sum","bit","kit","uid"]),MEDIUM_VALUES:new Set(["null","node","when","face","read","load","body","left","mark","down","ctrl","play","ntal","head","item","init","hand","next","nect","json","long","slid","less","view","html","tion","rect","link","char","core","turn","atom","tech","type","main","size","time","full","card","more","wrap","this","tool","late","note","leng","area","bool","pick","parm","axis","high","true","date","tend","work","lang","func","able","dark","term","info","data","opts","self","void","pace","list","brac","cret","tive","sult","text","stor","back","port","case","pare","dent","blot","fine","reif","cord","else","fail","rend","leav","hint","coll","move","with","base","rate","name","hile","lete","post","pect","icon","auth","jump","wave","land","wood","lize","room","chat","user","vice","ress","line","send","mess","calc","http","rame","rest","last","guar","iate","ment","task","stat","fill","coun","faul","rece","arse","exam","good","gest","word","cast","lock","slot","fund","plus","thre","sign","pack","reak","code","tent","math","lect","draw","lend","glow","past","blue","dial","purp"]),LONG_VALUES:new Set(["about","alias","apply","array","basic","beare","begin","black","break","broad","catch","class","close","clear","click","clude","color","count","cover","croll","crypt","error","false","fault","fetch","final","found","gener","green","group","guard","index","inner","input","inter","light","login","opera","param","parse","panel","place","print","phony","radio","range","right","refer","serve","share","shift","style","tance","title","token","tract","trans","trave","valid","video","white","write","button","cancel","create","double","finger","global","insert","module","normal","object","popper","triple","search","select","simple","single","status","statis","switch","system","visual","verify","detail","screen","member","change","buffer","grade"]),CHINESE_BLACKLIST:new Set(["请","输入","前往","整个","常用","咨询","为中心","是否","以上","目前","任务","或者","推动","需要","直接","识别","获取","用于","清除","遍历","使用","是由","您","用户","一家","项目","等","造价","判断","通过","为了","可以","掌握","传统","杀毒","允许","分析","包括","很多","接","未经","方式","些","的","第三方","因此","形式","任何","提交","多数","其他","执行","操作","维护","或","其它","分享","导致","一概","所有","及其","以及","应当","条件","除非","否则","违反","将被","提供","无法","建立","打造","帮助","依法","鉴于","快速","构建","是","在","去","恶意","挖矿","流氓","勒索","依靠","基于","通常","这","个","没有","并","、","，","查看","确保","提高","减少","检查","更新","卸载","常见","依赖","进行","测试","作弊"," "]),KEY_BLACKLIST:new Set(["size","row","dict","up","highlight","cabin","cross","time"])},j={coordPattern:/^coord/,valuePattern:/^\/|true|false|register|signUp|basic|http/i,chinesePattern:/^[\u4e00-\u9fa5]+$/,camelCasePattern:/\b[_a-z]+(?:[A-Z][a-z]+)+\b/},z=new Map,C={cleanDomain(t){try{if(t=t.replace(/^['"]|['"]$/g,""),t=t.toLowerCase(),z.has(t))t=z.get(t);else try{const s=decodeURIComponent(t.replace(/\+/g," "));z.set(t,s),t=s}catch{z.set(t,t)}const e=t.match(f.PATTERNS.DOMAIN_FILTER);if(e&&/\b[a-z]+\.(?:top|bottom)-[a-z]+\.top\b/.test(e[0]))return!1;if(e&&e[0].split(".")[0]!=="el"&&e[0].split(".")[0]!=="e")t=e[0];else return!1;return t}catch{return!1}},isDomainInBlacklist(t){return f.DOMAIN.BLACKLIST.some(e=>t.includes(e))},isSpecialIp(t){return f.IP.SPECIAL_RANGES.some(e=>e.test(t))},isValueInBlacklist(t,e){const s=t.toLowerCase();return e<12?Array.from(E.SHORT_VALUES).some(a=>s.includes(a)):e<16?Array.from(E.MEDIUM_VALUES).some(a=>s.includes(a)):Array.from(E.LONG_VALUES).some(a=>s.includes(a))}},Q=()=>new Promise(t=>{k.sendToBackground("GET_TAB_ID").then(e=>{e?.tabId!==null&&e?.tabId!==void 0&&t(e.tabId)})}),X=()=>new Promise(t=>{k.sendToBackground("GET_IFRAME_ID").then(e=>{t(e.frameId)})}),Z=t=>{const e=document.querySelectorAll("iframe");for(const s of e)t.iframes.set(s.src?s.src:"about:blank",document.location.href)},H=()=>{const t=document.createElement("script"),e=chrome.runtime.getURL("snow_x25.js");t.src=e,t.async=!1,t.onload=()=>{t.remove()};const s=document.head||document.documentElement;s?s.appendChild(t):setTimeout(()=>H(),10)},ee=(t,e)=>e?.some(s=>t===s||t.endsWith(`.${s}`)),N=5e4;function*K(t){if(t.length<=N){yield t;return}const e=t.split(/\r?\n/);let s=[],a=0;for(const r of e){if(r.length>N){const o=r.split(/;/).map(d=>d.endsWith(";")?d:d+";");for(const d of o)if(d.length>N)for(let c=0;c<d.length;c+=N)yield d.slice(c,c+N);else{const c=d.length+1;a+c>N&&a>0&&(yield s.join(`
`)+`
`,s=[],a=0),s.push(d),a+=c}continue}const n=r.length+1;a+n>N&&a>0&&(yield s.join(`
`)+`
`,s=[],a=0),s.push(r),a+=n}s.length>0&&(yield s.join(`
`)+`
`)}const $=t=>{try{const s=new URL(t).pathname.split("/");return s.pop(),s.join("/")+"/"}catch{return"/"}},te=(t,e)=>{const s=e.split("/").filter(Boolean);let a=t;s.forEach(r=>{a[r]||(a[r]={}),a=a[r]})},G=(t,e,s="")=>{const a=e.split("/").filter(Boolean)[0];for(const r in t){const n=s+"/"+r;if(r===a)return n;const o=G(t[r],e,n);if(o)return o}return""},se=t=>{const e=t.split("/").pop()?.split("?")[0]?.toLowerCase()||"";return f.THIRD_PARTY_LIBS.some(s=>s.test(e))};class i{static triggerFingerprintScan(){const e=document.documentElement?.innerHTML||"",t=document.title||"";e.length>100&&chrome.runtime.sendMessage({type:"FINGER24_BODY_SCAN",content:e,title:t},function(){})}static async init(){setTimeout(()=>{this.triggerFingerprintScan()},3000);if(!this._initialized)return new Promise(e=>{chrome.storage.local.get(["dynamicScan","deepScan","customWhitelist"],async s=>{this._dynamicScanEnabled=s.dynamicScan===!0,this._deepScanEnabled=s.deepScan===!0,this._frameId=await X(),this._tabId=await Q(),this._isWhitelisted=ee(this._hostname,s.customWhitelist||[]),this._initialized=!0,e()})})}static get tabId(){return this._tabId}static get frameId(){return this._frameId}static get hostname(){return this._hostname}static get protocol(){return this._protocol}static get port(){return this._port}static get isInIframe(){return this._isInIframe}static get dynamicScanEnabled(){return this._dynamicScanEnabled}static get deepScanEnabled(){return this._deepScanEnabled}static get isWhitelisted(){return this._isWhitelisted}static get isUseWebpack(){return this._isUseWebpack}static set isUseWebpack(e){this._isUseWebpack=e}static get initialized(){return this._initialized}static setDynamicScan(e){this._dynamicScanEnabled=e}static setDeepScan(e){this._deepScanEnabled=e}static getFullUrl(e){return`${this._protocol}//${this._hostname}${this._port?":"+this._port:""}${e}`}static isScanned(e){return this._scannedUrls.has(e)}static markAsScanned(e){this._scannedUrls.add(e)}static clearHistory(){this._scannedUrls.clear()}static updateTree(e){te(this._tree,e)}static getFullPath(e){return G(this._tree,e)}}p(i,"_tabId",null),p(i,"_frameId",null),p(i,"_isInIframe",window.self!==window.top),p(i,"_protocol",window.location.protocol),p(i,"_hostname",window.location.hostname.toLowerCase()),p(i,"_port",window.location.port),p(i,"_dynamicScanEnabled",!1),p(i,"_deepScanEnabled",!1),p(i,"_isWhitelisted",!1),p(i,"_isUseWebpack",!1),p(i,"_initialized",!1),p(i,"_scannedUrls",new Set),p(i,"_tree",{});const ae=(t,e,s)=>{if(t=t.slice(1,-1),f.API.FONT_PATTERN.test(t))return!1;if(t.endsWith(".vue"))return s?.vueFiles?.set(t,e),!0;if(f.API.IMAGE_PATTERN.test(t))return s?.imageFiles?.set(t,e),!0;if(f.API.DOC_PATTERN.test(t))return s?.docFiles?.set(t,e),!0;const a=t.toLowerCase();if(f.API.FILTERED_CONTENT_TYPES.some(n=>a===n.toLowerCase()))return!1;if(t.startsWith("./")&&!s?.moduleFiles?.has(t+".js"))return s?.moduleFiles?.set(t,e),i.isUseWebpack&&(s.jsFiles.has(t+".js")&&s.jsFiles.delete(t+".js"),t.endsWith(".js")&&s.moduleFiles.has(t.slice(0,-3))&&s.moduleFiles.delete(t.slice(0,-3))),!0;if(f.API.JS_PATTERN.test(t))return!0;if(t.startsWith("/")){if(t.length<=4&&/[A-Z\.\/\#\+\?23]/.test(t.slice(1)))return!1;s?.absoluteApis?.set(t,e)}else{if(/^(audio|blots|core|ace|icon|css|formats|image|js|modules|text|themes|ui|video|static|attributors|application)/.test(t)||t.length<=4)return!1;s?.apis?.set(t,e)}return!0},re=(t,e,s)=>{const a=C.cleanDomain(t);return!a||C.isDomainInBlacklist(a)?!1:(s?.domains?.set(a,e),!0)},ne=(t,e,s)=>{t=t.replace(/^[`'"]|[`'"]$/g,"");const a=t.match(f.PATTERNS.IP);if(a){const r=a[0];if(C.isSpecialIp(r))return!1;s?.ips?.set(r,e)}return!0},ie=(t,e,s)=>{try{if(t.toLowerCase().includes("github.com/"))return s?.githubUrls?.set(t,e),!0;s?.urls?.set(t,e);const a=new URL(t),r=window.location.host;if(a.host===r){const n=a.pathname;if(f.API.FONT_PATTERN.test(n))return!1;if(f.API.IMAGE_PATTERN.test(n))return s?.imageFiles?.set(n,e),!0;if(f.API.DOC_PATTERN.test(n))return s?.docFiles?.set(n,e),!0;if(!n.match(/\.[a-zA-Z0-9]+$/))return n.startsWith("/")?s?.absoluteApis?.set(n,e):s?.apis?.set(n,e),!0}}catch(a){console.error("Error processing URL:",a)}return!0},oe=(t,e,s)=>(s?.phones?.set(t,e),!0),ce=(t,e,s)=>(s?.emails?.set(t,e),!0),le=(t,e,s)=>(s?.idcards?.set(t,e),!0),de=(t,e,s)=>(s?.jwts?.set(t,e),!0),ue=(t,e,s)=>/[（）]/.test(t)&&!t.match(/（\S*）/)||Array.from(E.CHINESE_BLACKLIST).some(a=>t.includes(a))?!1:(s?.companies?.set(t,e),!0),pe=(t,e,s)=>{const a=t.replace(/\s+/g,"").split(/[:=]/),r=a[0].replace(/['"]/g,"").toLowerCase(),n=a[1].replace(/['"\{\}\[\]\，\:\。\？\、\?\!\>\<]/g,"").toLowerCase();return!n.length||j.coordPattern.test(r)||j.valuePattern.test(n)||n.length<=1||j.chinesePattern.test(n)?!1:(s?.credentials?.set(t,e),!0)},fe=(t,e,s)=>{const a=t.replace(/\s+/g,"").split(/[:=]/);if(a[1].replace(/['"]/g,"").length<4)return!1;const r=a[0].replace(/['"<>]/g,"").toLowerCase(),n=a[1].replace(/['"<>]/g,"").toLowerCase();if(!n.length||r===n)return!1;if(n.length<12){if(Array.from(E.SHORT_VALUES).some(o=>n.includes(o)))return!1}else if(Array.from(E.MEDIUM_VALUES).some(o=>n.includes(o)))return!1;return s?.cookies?.set(t,e),!0},he=(t,e,s)=>{const a=t.match(/[:=]/);if(a||t.length>=32){if(a){const r=t.replace(/\s+/g,"").split(/[:=]/),n=r[0].replace(/['"<>]/g,""),o=r[1].replace(/['"><]/g,""),d=n.toLowerCase(),c=o.toLowerCase();if(!o.length||d===c||Array.from(E.KEY_BLACKLIST).some(w=>d.includes(w)))return!1;if(o.length<16){if(Array.from(E.SHORT_VALUES).some(w=>c.includes(w))||Array.from(E.MEDIUM_VALUES).some(w=>c.includes(w)))return!1}else if(Array.from(E.MEDIUM_VALUES).some(w=>c.includes(w))||Array.from(E.LONG_VALUES).some(w=>c.includes(w)))return!1;if(n==="key"&&(o.length<=8||j.camelCasePattern.test(o))||o.length<=3)return!1}else if(/^[a-zA-Z]+$/.test(t.slice(1,-1))||Array.from(E.MEDIUM_VALUES).some(r=>t.includes(r))||Array.from(E.LONG_VALUES).some(r=>t.includes(r)))return!1;return s?.idKeys?.set(t,e),!0}return!1},me=(t,e,s)=>(s?.windowsPaths?.set(t,e),!0),ge=(t,e,s,a,r,n,o,d)=>{const c={type:s,name:e,description:`通过${t}识别到${e}${a}`,version:e,extType:o,extName:d};return k.sendToBackground("UPDATE_BUILDER",{finger:c}),n?.fingers?.set(e,r),!0},g={api:ae,domain:re,ip:ne,url:ie,phone:oe,email:ce,idcard:le,jwt:de,company:ue,credentials:pe,cookie:fe,id_key:he,windows_path:me,finger:ge};class m{static get(){return this.tabResults||(this.tabResults=this.createEmptyResults()),this.tabResults}static has(){return this.tabResults!==null}static clear(){if(this.tabResults){const e=this.tabResults;Object.keys(e).forEach(s=>{const a=e[s];(a instanceof Map||a instanceof Set)&&a.clear()})}}static createEmptyResults(){return{domains:new Map,routes:new Map,absoluteApis:new Map,apis:new Map,moduleFiles:new Map,docFiles:new Map,ips:new Map,phones:new Map,emails:new Map,idcards:new Map,windowsPaths:new Map,jwts:new Map,iframes:new Map,imageFiles:new Map,jsFiles:new Map,thirdPartyLibs:new Map,vueFiles:new Map,urls:new Map,githubUrls:new Map,companies:new Map,credentials:new Map,cookies:new Map,idKeys:new Map,fingers:new Map,progress:new Map}}}p(m,"tabResults",null);class B{static extract(e,s,a){if(i.isInIframe)return{urls:new Set};const r=new Set;let n;try{n=new URL(s).origin}catch{n=window.location.origin}const o=/!\*\*\*\s(?:\/|\.\/|\.\.\/)*[\w_~./]*\s\*\*\*!/g,d=/{(?:"\.\/[\w._-]*.js":\d{0,3},?){1,}}/g,c=/['"](?:[^?'"]+\.js)['"]/g,w=/(?:(?<base>"[a-z-_/]*")\+)?(?<name_struct>(?:(?:\(\{(?<name>[^{};=]*?:"[^{},;=]*?")?\}\[[a-z]\]\|\|[a-z]\))||[\w])\+)?(?<add>"."\+)?(?<hash_struct>\{(?<hash>[^{}=]*?:"[\w]*")?\}\[[a-z]\]\+)?(?<end>"[\w._-]*.js")/i;for(const M of K(e)){Array.from(M.matchAll(o)).forEach(y=>{const u=y[0].slice(5,-5);if(i.tabId){const l=m.get();l.moduleFiles.set(u,s),l.jsFiles.has(u)&&l.jsFiles.delete(u)}}),Array.from(M.matchAll(d)).forEach(y=>{const u=JSON.parse(y[0]);for(const l in u)if(i.tabId){const h=m.get();h.moduleFiles.set(l,s),h.jsFiles.has(l)&&h.jsFiles.delete(l)}}),(i.deepScanEnabled||a)&&Array.from(M.matchAll(c)).map(u=>{let l=u[0].slice(1,-1);try{if(l=decodeURIComponent(l),l.includes(" "))return null;if(l.includes("/dist/")||l.includes("/node_modules/"))return m.get().moduleFiles.set(l,s),null}catch{if(l.includes(" "))return null}if(i.tabId&&m.get().moduleFiles.has(l))return null;if(l.startsWith("http")||l.startsWith("//")){const h=l.startsWith("//")?window.location.protocol+l:l;try{return new URL(h).hostname.toLowerCase()!==i.hostname?null:h}catch{return null}}try{const h=l.split("/").filter(Boolean),x=h.findIndex(D=>D!=="."&&D!=="..");if(x!==-1&&x<h.length-1){const D=h[x],v=i.getFullPath("/"+D+"/");if(v){const T=h.pop(),S=h.slice(x+1);let P=v.endsWith("/")?v:v+"/";return S.length>0&&(P+=S.join("/")+"/"),n+(P.startsWith("/")?P:"/"+P)+T}}return new URL(l,s).href}catch{return null}}).filter(u=>u!==null).forEach(u=>{i.tabId&&!m.get().moduleFiles.has(u)&&r.add(u)});let _=null;if(i.isUseWebpack||(_=M.match(w)),_&&!i.isUseWebpack)try{let y=$(s),u=_.groups.base,l=_.groups.end,h=_.groups.name_struct,x=_.groups.name,D=_.groups.hash_struct,v=_.groups.hash,T=_.groups.add||"",S=new Map,P=new Map;if(h===void 0&&D===void 0)continue;if(u===void 0&&(u=y),T!==void 0&&(T=T.replaceAll(/["+]/g,"")),u!==void 0&&(u=u.replaceAll('"',""),u.startsWith("/")||(u="/"+u),u.endsWith("/")||(u=u+"/"),y.includes(u)&&(u=y)),l!==void 0&&(l=l.replaceAll('"',"")),x!=null){let I=x.split(",");for(let b=0;b<I.length;b++)S.set(I[b].split(":")[0].replaceAll('"',""),I[b].split(":")[1].replaceAll('"',""))}else S=null;if(v!=null){let I=v.split(",");for(let b=0;b<I.length;b++)P.set(I[b].split(":")[0].replaceAll('"',""),I[b].split(":")[1].replaceAll('"',""));S!=null||h!=null?P.forEach((b,U)=>{const O=n+u+U+T+b+l;r.add(O)}):P.forEach((b,U)=>{const O=n+u+T+b+l;r.add(O)})}else S?.forEach((I,b)=>{const U=n+u+I+T+l;r.add(U)});i.isUseWebpack=!0}catch(y){console.error("Webpack chunk parse error",y)}}return{urls:r}}}class we{constructor(e,s){p(this,"jsQueue",[]);p(this,"queueSet",new Set);p(this,"inFlightSet",new Set);p(this,"isProcessing",!1);p(this,"dealContent");p(this,"onProgressUpdate");this.dealContent=e,this.onProgressUpdate=s}async scanDom(e,s){if(i.isWhitelisted)return;e&&await this.dealContent(e,s,!0);const{urls:a}=B.extract(e,s,!0);a.size>0&&a.forEach(r=>{r.startsWith("chrome-extension://")||this.enqueue(r,"page",s)})}enqueue(e,s="page",a){if(!i.isScanned(e)){if(se(e)){const r=m.get(),n=new URL(e).pathname;r.thirdPartyLibs.set(n,a);return}if(!this.queueSet.has(e)&&!i.isWhitelisted){try{if(new URL(a).hostname.toLowerCase()!==i.hostname)return}catch{return}const r=new URL(e).pathname;this.queueSet.add(e),this.jsQueue.push(e);const n=m.get();n.jsFiles.set(r,a),n.urls.set(e,a),this.processQueue(),this.onProgressUpdate()}}}async processQueue(){if(!this.isProcessing){this.isProcessing=!0;try{for(;this.jsQueue.length>0&&this.inFlightSet.size<f.SCHEDULER.MAX_CONCURRENT;){const e=this.jsQueue.shift();if(!e)break;this.inFlightSet.add(e),this.handleTask(e).finally(()=>{this.inFlightSet.delete(e),this.onProgressUpdate(),this.processQueue()}),await new Promise(s=>setTimeout(s,0))}}finally{this.isProcessing=!1}}}async handleTask(e){try{const s=await k.sendToBackground("FETCH_JS",{url:e,frameId:i.frameId});if(s?.content&&i.frameId==s.frameId){if(i.updateTree($(e)),await this.dealContent(s.content,e,!1),i.frameId!="0")return;const{urls:a}=B.extract(s.content,e,!1);a&&a.forEach(r=>this.enqueue(r,"page",e))}}catch(s){console.error("[Scheduler] Task error:",e,s)}}getStats(){return{total:this.queueSet.size,remaining:this.jsQueue.length,dealing:this.inFlightSet.size}}}class V{}class A extends V{constructor(e,s,a){super(),this.name=e,this.configKey=s,this.filterFn=a}async extract(e,s,a,r){let n=!1;const o=f.PATTERNS[this.configKey];if(!o)return!1;let d=[];this.configKey==="IP"?r?d=[{pattern:o.toString()}]:d=[{pattern:f.PATTERNS.IP_RESOURCE.toString()}]:this.configKey==="DOMAIN"?r?d=[{pattern:o.toString()}]:d=[{pattern:f.PATTERNS.DOMAIN_RESOURCE.toString()}]:this.configKey==="EMAIL"?d=[{pattern:o.toString()}]:this.configKey==="API"?d=[{pattern:f.API.PATTERN.toString()}]:o.patterns?d=o.patterns.map(c=>({pattern:c.pattern.toString()})):d=[{pattern:o.toString()}];try{const c=await k.sendToBackground("REGEX_MATCH",{chunk:e,patterns:d,patternType:this.configKey});c&&c.matches&&c.matches.length>0&&c.matches.forEach(({match:w})=>{this.filterFn(w,s,a)&&(n=!0)})}catch(c){console.error(`${this.name}匹配出错:`,c)}return n}}class be extends V{constructor(){super(...arguments);p(this,"name","FingerExtractor")}async extract(s,a,r,n){let o=!1;const d=f.PATTERNS.FINGER.patterns;try{for(const{pattern:c,name:w,class:M,type:_,description:y,extType:u,extName:l}of d){if(r.fingers.has(M))continue;s.match(c)&&g.finger(w,M,_,y,a,r,u,l)&&(o=!0)}}catch(c){console.error("指纹识别出错:",c)}return o}}class Ae{constructor(){p(this,"extractors",[]);this.extractors.push(new be),this.extractors.push(new A("API Extractor","API",g.api)),this.extractors.push(new A("Email Extractor","EMAIL",g.email)),this.extractors.push(new A("Phone Extractor","PHONE",g.phone)),this.extractors.push(new A("IdCard Extractor","IDCARD",g.idcard)),this.extractors.push(new A("IP Extractor","IP",g.ip)),this.extractors.push(new A("Domain Extractor","DOMAIN",g.domain)),this.extractors.push(new A("URL Extractor","URL",g.url)),this.extractors.push(new A("JWT Extractor","JWT",g.jwt)),this.extractors.push(new A("Company Extractor","COMPANY",g.company)),this.extractors.push(new A("Github Extractor","GITHUB",g.url)),this.extractors.push(new A("Credentials Extractor","CREDENTIALS",g.credentials)),this.extractors.push(new A("Cookie Extractor","COOKIE",g.cookie)),this.extractors.push(new A("IdKey Extractor","ID_KEY",g.id_key)),this.extractors.push(new A("WindowsPath Extractor","WINDOWS_PATH",g.windows_path))}async process(e,s,a,r){let n=!1;const o=this.extractors.map(async d=>{try{await d.extract(e,s,a,r)&&(n=!0)}catch(c){console.error(`Extractor ${d.name} failed:`,c)}});return await Promise.all(o),n}}class Ee{constructor(e){p(this,"observer");p(this,"scanTimeout",null);p(this,"initialized",!1);p(this,"DEBOUNCE_DELAY",1e3);this.onScanTrigger=e,this.observer=new MutationObserver(s=>this.handleMutations(s))}handleMutations(e){let s=!1;for(const r of e){if(r.addedNodes.length>0){for(const n of Array.from(r.addedNodes))if(n.nodeType===Node.ELEMENT_NODE){const o=n;if(o.tagName==="IFRAME"||o.querySelector("iframe")){s=!0;break}}}if(s)break}if(s&&this.debounceScan(),!i.dynamicScanEnabled)return;e.filter(r=>!(r.type==="attributes"&&(r.attributeName==="class"||r.attributeName==="style"))).length>0&&this.debounceScan()}debounceScan(){this.scanTimeout&&clearTimeout(this.scanTimeout),this.scanTimeout=setTimeout(()=>{console.info("DOM变化触发重新扫描...");const e=document.documentElement.innerHTML;e&&(i.triggerFingerprintScan(),this.onScanTrigger(e,document.location.href))},this.DEBOUNCE_DELAY)}start(){if(this.initialized)return;const e=document.body||document.documentElement;if(!e){console.error("无法启动 DOM Observer: 找不到根节点");return}try{this.observer.observe(e,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["src","href"],characterDataOldValue:!1}),this.initialized=!0,console.info("DOM Observer 已启动")}catch(s){console.error("启动 DOM Observer 失败:",s)}}stop(){this.scanTimeout&&(clearTimeout(this.scanTimeout),this.scanTimeout=null),this.observer.disconnect(),this.initialized=!1,console.info("DOM Observer 已停止")}isInitialized(){return this.initialized}}function ye(t,e){return new Ee((s,a)=>{if(t&&(t.scanDom(s,a),i.tabId)){const r=m.get();Z(r),e()}})}let L=null,W=null,F=null;H();async function _e(){if(i.isWhitelisted||!i.tabId)return;const t=await k.sendToBackground("REGISTER_CONTENT",{frameId:i.frameId});if(!t||t.frameId!==i.frameId)return;W=new Ae,L=new we(Ie,R),F=ye(L,R),new Set(t.tabJs).forEach(s=>{L?.enqueue(s,"background",window.location.href)})}const Ie=async(t,e,s)=>{if(!(!W||!i.tabId)){for(const a of K(t)){const r=m.get();await W.process(a,e,r,s)&&R(),await new Promise(o=>setTimeout(o,0))}s||i.markAsScanned(e)}};async function ke(){try{if(!i.tabId||i.isWhitelisted)return;L&&await L.scanDom(document.documentElement.innerHTML,document.location.href);const t=m.get();Z(t),F&&!F.isInitialized()&&F.start()}catch(t){t.message!=="Extension context invalidated."&&console.error("初始化扫描出错:",t)}}const R=()=>{try{if(!i.tabId)return;const t={};if(L){const a=L.getStats(),r=a.total===0?100:Math.floor((a.total-a.remaining-a.dealing)/a.total*100);m.get().progress.set("percent",r)}const e=m.get();for(const a in e)t[a]=Array.from(e[a]);const s={results:t,tabId:i.tabId,frameId:i.frameId,isInIframe:i.isInIframe,frameUrl:window.location.href};k.sendToPopup("SCAN_UPDATE",s).catch(()=>{}),k.sendToBackground("UPDATE_BADGE",s).catch(()=>{})}catch(t){t.message!=="Extension context invalidated."&&console.error("发送更新出错:",t)}};q.onMessage("VUE_HOOKED",t=>{if(t.source==="inject"){const{version:e,routes:s}=t.data;if(i.tabId&&m.has()){const a=m.get();g.finger("Vue特征","Vue"+e,"framework","已获取"+s.length+"个路由","",a),s&&Array.isArray(s)&&s.forEach(r=>{r&&a.routes.set(r,i.getFullUrl(r))}),R()}}});k.onMessage((t,e,s)=>{if(t.type==="LOGIN_SUBMIT"||t.type==="DETECT_LOGIN_FORM"||t.type==="DUMP_INPUTS"||t.type==="CAPTCHA_REFRESH")return!1;try{switch(t.type){case"GET_RESULTS":{if(!m.get()){s(null);break}window.postMessage({type:"TRIGGER_VUE_SCAN",source:"content"},"*"),R(),s(null);break}case"VUE_HOOKED":{const a=window.frameElement;a?.contentWindow&&(a.contentWindow.location.href=t.route);break}case"UPDATE_ROUTE":{const a=window.frameElement;a?.contentWindow&&(a.contentWindow.location.href=t.route);break}case"UPDATE_DYNAMIC_SCAN":{i.setDynamicScan(!!t.enabled),s({success:!0});break}case"UPDATE_DEEP_SCAN":{i.setDeepScan(!!t.enabled),s({success:!0});break}default:s(null)}}catch(a){a.message!=="Extension context invalidated."&&console.error("处理消息出错:",a),s(null)}return!0});async function Te(){if(await i.init(),i.isWhitelisted||!i.tabId)return;m.clear();const t=async()=>{await _e(),await ke()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t()}k.onMessage((t,e,s)=>{
  function collectInputs(r){allInputs=[];var walk=function(n){n.querySelectorAll("input").forEach(function(x){allInputs.push({tag:x.tagName,type:x.type||"",name:x.name||"",id:x.id||"",autocomplete:x.autocomplete||"",placeholder:x.placeholder||"",className:x.className||"",closestForm:!!x.closest("form")})});n.querySelectorAll("*").forEach(function(x){if(x.shadowRoot)walk(x.shadowRoot)})};walk(r)}
  function findPwds(r){var res=[];r.querySelectorAll('input[type="password"],input[autocomplete="current-password"],input[autocomplete="new-password"],input[name*="password" i],input[name*="passwd" i],input[id*="password" i],input[id*="passwd" i]').forEach(function(e){if(res.indexOf(e)===-1)res.push(e)});if(!res.length){r.querySelectorAll("input").forEach(function(e){var ph=(e.placeholder||"").toLowerCase(),n=(e.name||"").toLowerCase(),id=(e.id||"").toLowerCase();if(ph.includes("密码")||ph.includes("password")||n.includes("pass")||id.includes("pass")){if(res.indexOf(e)===-1)res.push(e)}})}r.querySelectorAll("*").forEach(function(e){if(e.shadowRoot)res=res.concat(findPwds(e.shadowRoot))});return res}
  if(t.type==="DETECT_LOGIN_FORM"){
    console.log("[xuetong:bf] 收到DETECT_LOGIN_FORM消息, location=",window.location.href,"body=",!!document.body,"readyState=",document.readyState);
    // 推断字段名：name > id > autocomplete > placeholder > fallback
    function inferFieldName(inp,fallback){
      var n=inp.name||"";
      if(n)return n;
      var id=inp.id||"";
      if(id)return id;
      var ac=inp.autocomplete||"";
      if(ac&&ac!=="off"&&ac!=="on")return ac;
      var ph=inp.placeholder||"";
      if(ph)return ph;
      return fallback;
    }
    // 检测是否为SPA JSON API提交（基于全局标志或fetch/XHR拦截）
    function detectApiSubmit(){
      // 检查是否有Vue/React框架标志
      if(document.querySelector('[data-v-]')||document.querySelector('[data-reactroot]')||window.__VUE_DEVTOOLS_GLOBAL_HOOK__||window.__REACT_DEVTOOLS_GLOBAL_HOOK__)return true;
      // 检查页面是否通过JS加载（SPA典型特征）
      var scripts=document.querySelectorAll('script[type="module"]');
      if(scripts.length>0)return true;
      return false;
    }
    function doDetect(pwds,s){
      try{
        var pwd=pwds[0],form=pwd.closest("form"),action=form?form.action||window.location.href:window.location.href,method=form?(form.method||"POST").toUpperCase():"POST";
        var usernameField="",userInput=null;
        if(form){
          var inputs=form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"])');
          for(var i=0;i<inputs.length;i++){
            var inp=inputs[i],t2=(inp.type||"").toLowerCase(),n=(inp.name||"").toLowerCase(),p2=(inp.placeholder||"").toLowerCase(),id2=(inp.id||"").toLowerCase(),ac2=(inp.autocomplete||"").toLowerCase();
            // 排除验证码字段
            if(/captcha|verify.?code|vcode|yzm|验证码/i.test(n+id2+p2))continue;
            if(t2==="text"||t2==="email"||t2==="tel"||t2==="number"
              ||n.includes("user")||n.includes("account")||n.includes("login")||n.includes("email")||n.includes("phone")||n.includes("mobile")
              ||ac2.includes("user")||ac2.includes("email")||ac2.includes("tel")
              ||p2.includes("用户")||p2.includes("账号")||p2.includes("user")||p2.includes("手机")||p2.includes("邮箱")
              ||id2.includes("user")||id2.includes("login")||id2.includes("account")){userInput=inp;break}
          }
          if(!userInput&&inputs.length)userInput=inputs[0];
        }else{
          // 无form：多策略查找用户名字段
          var allInputs=document.querySelectorAll('input:not([type="password"]):not([type="hidden"])');
          var pwdRect=pwd.getBoundingClientRect();
          // 策略1: 距离密码框最近的input（200px内）
          var closest=null,closestDist=9999;
          for(var j=0;j<allInputs.length;j++){
            var r=allInputs[j].getBoundingClientRect();
            var dist=Math.abs(r.top-pwdRect.top)+Math.abs(r.left-pwdRect.left)*0.1;
            if(dist<closestDist){closestDist=dist;closest=allInputs[j]}
          }
          if(closest&&closestDist<300)userInput=closest;
          // 策略2: placeholder含用户/账号关键词
          if(!userInput){
            for(var j2=0;j2<allInputs.length;j2++){
              var ph=(allInputs[j2].placeholder||"").toLowerCase();
              if(ph.includes("用户")||ph.includes("账号")||ph.includes("account")||ph.includes("user")||ph.includes("邮箱")||ph.includes("手机")){
                userInput=allInputs[j2];break;
              }
            }
          }
          // 策略3: 第一个非密码input
          if(!userInput&&allInputs.length)userInput=allInputs[0];
        }
        if(userInput)usernameField=inferFieldName(userInput,"username");
        var hiddenFields=[],csrfField="";
        if(form){
          form.querySelectorAll('input[type="hidden"]').forEach(function(inp){
            if(inp.name){hiddenFields.push({name:inp.name,value:inp.value});var nl=inp.name.toLowerCase();if(nl.includes("csrf")||nl.includes("token")||nl.includes("verify"))csrfField=inp.name;}
          });
        }
        var pwdField=inferFieldName(pwd,"password");
        var captchaField="",captchaSelector="";
        var captchaPat=/captcha|verify|code|vcode|checkcode|kaptcha|rand|validatecode|yzm/i;
        var allImgs=form?form.querySelectorAll("img"):document.querySelectorAll("form img");
        for(var k=0;k<allImgs.length;k++){
          var img=allImgs[k],src=img.src||"",alt=img.alt||"",iid=img.id||"",cls=img.className||"";
          if(captchaPat.test(src)||captchaPat.test(alt)||captchaPat.test(iid)||captchaPat.test(cls)){
            var rr=img.getBoundingClientRect(),prr=pwd.getBoundingClientRect();
            if(Math.abs(rr.top-prr.top)<200&&Math.abs(rr.left-prr.left)<400){captchaSelector=img.id?"#"+img.id:"img";break;}
          }
        }
        var captchaPat2=/captcha|verify.?code|vcode|yzm|验证码/;
        if(form){
          var cinputs=form.querySelectorAll("input[type='text'],input:not([type])");
          for(var ci=0;ci<cinputs.length;ci++){
            var cn=(cinputs[ci].name||"").toLowerCase(),cid=(cinputs[ci].id||"").toLowerCase(),cp=(cinputs[ci].placeholder||"").toLowerCase();
            if(captchaPat2.test(cn)||captchaPat2.test(cid)||captchaPat2.test(cp)){
              var crr=cinputs[ci].getBoundingClientRect(),cprr=pwd.getBoundingClientRect();
              if(Math.abs(crr.top-cprr.top)<200){captchaField=cinputs[ci].name||cinputs[ci].id;break;}
            }
          }
        }
        // SPA检测：无form或检测到SPA框架标志时用JSON提交
        var isApiSubmit=form?detectApiSubmit():true;
        s({found:!0,action:action,method:method,usernameField:usernameField,passwordField:pwdField,hiddenFields:hiddenFields,csrfField:csrfField,captchaField:captchaField,captchaSelector:captchaSelector,isApiSubmit:isApiSubmit,formId:form?form.id:"",formClass:form?form.className:""});
      }catch(ex){s({found:!1,error:ex.message})}
    }
    var pwds=findPwds(document);
    collectInputs(document);console.log("[xuetong:bf] 检测到",allInputs.length,"个input元素,",pwds.length,"个可能的密码字段",allInputs.slice(0,20));
    if(pwds.length){console.log("[xuetong:bf] 找到",pwds.length,"个密码字段,开始解析表单");doDetect(pwds,s);return!0}
    console.warn("[xuetong:bf] 初始未找到密码字段,启动MutationObserver等待SPA渲染 (8秒)");
    // SPA延迟渲染：MutationObserver等待最多8秒
    var timeout=setTimeout(function(){observer.disconnect();collectInputs(document);console.warn("[xuetong:bf] 超时! 页面上实际input类型:",allInputs.slice(0,30));s({found:!1,error:"未检测到登录表单(超时)",debugInputs:allInputs.slice(0,50)})},8000);
    var observer=new MutationObserver(function(){
      var pwds2=findPwds(document);
      if(pwds2.length){console.log("[xuetong:bf] MutationObserver触发,找到",pwds2.length,"个密码字段");clearTimeout(timeout);observer.disconnect();doDetect(pwds2,s);}
    });
    observer.observe(document.body||document.documentElement,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["type","autocomplete"]});
    return!0;
  }
  if(t.type==="DUMP_INPUTS"){
    collectInputs(document);s({count:allInputs.length,inputs:allInputs.slice(0,100),hasPasswordType:allInputs.some(function(x){return x.type==="password"})});return!0
  }
  // 前端模拟登录：填入表单 → 点击提交 → 拦截响应
  // LOGIN_SUBMIT 已移至独立监听器（见文件末尾）
  if(t.type==="CAPTCHA_REFRESH"){
    try{
      var sel=t.selector;
      if(!sel){s({found:!1,error:"no selector"});return!0}
      var imgEl=document.querySelector(sel);
      if(!imgEl){s({found:!1,error:"element not found"});return!0}
      var doExtract=function(){
        var canvas=document.createElement("canvas");
        var ctx=canvas.getContext("2d");
        canvas.width=imgEl.naturalWidth||imgEl.width;
        canvas.height=imgEl.naturalHeight||imgEl.height;
        ctx.drawImage(imgEl,0,0,canvas.width,canvas.height);
        try{s({found:!0,imageBase64:canvas.toDataURL("image/png")})}
        catch(ce){s({found:!1,error:"canvas tainted: "+ce.message})}
      };
      var src=imgEl.src||"";
      if(src){
        var url=new URL(src,window.location.href);
        url.searchParams.set("_t",Date.now());
        imgEl.onload=function(){setTimeout(doExtract,200)};
        imgEl.onerror=function(){s({found:!1,error:"image load failed"})};
        imgEl.src=url.href;
      }else{doExtract()}
    }catch(ex2){s({found:!1,error:ex2.message})}
    return!0;
  }
  return!1;
});
// LOGIN_SUBMIT独立监听器（不经过主监听器，避免被s(null)拦截）
var _bfProcessing=false;
chrome.runtime.onMessage.addListener(function(msg,sender,sendResponse){
  if(msg.type!=="LOGIN_SUBMIT")return!1;
  if(_bfProcessing){sendResponse({success:null,message:"上一次请求仍在处理中"});return!0}
  _bfProcessing=true;
  var _bfDone=function(result){
    if(_bfProcessing){_bfProcessing=false;sendResponse(result)}
  };
  var formInfo=msg.formInfo,cred=msg.credential;
  if(!formInfo||!cred){_bfDone({success:null,message:"参数不完整"});return!0}
  try{
    // 查找密码字段
    var pwds=document.querySelectorAll('input[type="password"],input[autocomplete="current-password"],input[autocomplete="new-password"]');
    if(!pwds.length){var tmp=[];document.querySelectorAll("input").forEach(function(e){var ph=(e.placeholder||"").toLowerCase();if(ph.includes("密码")||ph.includes("password"))tmp.push(e)});pwds=tmp}
    if(!pwds.length){_bfDone({success:null,message:"未找到密码字段"});return!0}
    var pwd=pwds[0],form=pwd.closest("form");
    // 查找用户名字段
    var userInput=null;
    if(form){
      var inputs=form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"])');
      for(var i=0;i<inputs.length;i++){
        var inp=inputs[i],t2=(inp.type||"").toLowerCase(),n=(inp.name||"").toLowerCase(),ac=(inp.autocomplete||"").toLowerCase();
        if(/captcha|verify.?code|vcode|yzm|验证码/i.test(n+(inp.id||"")+(inp.placeholder||"")))continue;
        if(t2==="text"||t2==="email"||t2==="tel"||n.includes("user")||n.includes("account")||ac.includes("user")){userInput=inp;break}
      }
      if(!userInput&&inputs.length)userInput=inputs[0];
    }else{
      // 无form：多策略查找
      var allInputs=document.querySelectorAll('input:not([type="password"]):not([type="hidden"])');
      var pwdRect=pwd.getBoundingClientRect();
      var closest=null,closestDist=9999;
      for(var j=0;j<allInputs.length;j++){
        var r=allInputs[j].getBoundingClientRect();
        var dist=Math.abs(r.top-pwdRect.top)+Math.abs(r.left-pwdRect.left)*0.1;
        if(dist<closestDist){closestDist=dist;closest=allInputs[j]}
      }
      if(closest&&closestDist<300)userInput=closest;
      if(!userInput){
        for(var j2=0;j2<allInputs.length;j2++){
          var ph=(allInputs[j2].placeholder||"").toLowerCase();
          if(ph.includes("用户")||ph.includes("账号")||ph.includes("account")||ph.includes("user")||ph.includes("邮箱")||ph.includes("手机")){userInput=allInputs[j2];break}
        }
      }
      if(!userInput&&allInputs.length)userInput=allInputs[0];
    }
    if(!userInput){_bfDone({success:null,message:"未找到用户名字段"});return!0}

    // 值设置（兼容React 16+）— 使用原生setter触发React的trackValueOnNode
    function setNativeValue(el,val){
      var nativeSetter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;
      nativeSetter.call(el,val);
      // React 16监听native input事件，通过event.target.value读取值
      var ev=new Event("input",{bubbles:!0});
      el.dispatchEvent(ev);
      el.dispatchEvent(new Event("change",{bubbles:!0}));
    }

    // 拦截fetch和XHR捕获登录响应
    var loginResult=null;
    var origFetch=window.fetch;
    var origXHROpen=XMLHttpRequest.prototype.open;
    var origXHRSend=XMLHttpRequest.prototype.send;
    var wrapped=true;
    // fetch拦截
    window.fetch=function(){
      var url=arguments[0];
      var urlStr=typeof url==="string"?url:(url&&url.url?url.url:"");
      console.log("[xuetong:bf] fetch intercepted:",urlStr.substring(0,80));
      var promise=origFetch.apply(this,arguments);
      if(/login|auth|v1/i.test(urlStr)){
        console.log("[xuetong:bf] 匹配到登录请求:",urlStr);
        promise.then(function(resp){
          var cloned=resp.clone();
          cloned.text().then(function(body){
            console.log("[xuetong:bf] 收到登录响应:",resp.status,body.substring(0,100));
            try{loginResult={status:resp.status,body:body,url:urlStr}}catch(e){}
          }).catch(function(){});
        }).catch(function(e){console.log("[xuetong:bf] fetch error:",e.message);loginResult={status:0,body:"",error:e.message}});
      }
      return promise;
    };
    // XHR拦截
    XMLHttpRequest.prototype.open=function(method,url){
      this._bfUrl=url;
      return origXHROpen.apply(this,arguments);
    };
    XMLHttpRequest.prototype.send=function(body){
      var xhr=this;
      console.log("[xuetong:bf] XHR send:",(this._bfUrl||"").substring(0,80));
      if(/login|auth|v1/i.test(this._bfUrl||"")){
        console.log("[xuetong:bf] 匹配到XHR登录请求:",this._bfUrl);
        xhr.addEventListener("load",function(){
          console.log("[xuetong:bf] XHR响应:",xhr.status,xhr.responseText.substring(0,100));
          try{loginResult={status:xhr.status,body:xhr.responseText,url:xhr._bfUrl}}catch(e){}
        });
        xhr.addEventListener("error",function(){loginResult={status:0,body:"",error:"xhr error"}});
      }
      return origXHRSend.apply(this,arguments);
    };
    function restoreAll(){
      if(!wrapped)return;
      window.fetch=origFetch;
      XMLHttpRequest.prototype.open=origXHROpen;
      XMLHttpRequest.prototype.send=origXHRSend;
      wrapped=false;
    }

    // 记录当前token和URL
    var prevToken=localStorage.getItem("token");
    var prevUrl=window.location.href;

    // 检测验证码输入框
    var captchaInput=null;
    var allInputs=document.querySelectorAll("input");
    console.log("[xuetong:bf] 页面共",allInputs.length,"个input");
    allInputs.forEach(function(inp,idx){
      var ph=inp.placeholder||"",n=inp.name||"",id=inp.id||"",cls=inp.className||"",tp=inp.type||"";
      console.log("[xuetong:bf] input["+idx+"] type="+tp+" placeholder='"+ph+"' name='"+n+"' id='"+id+"' class='"+cls.substring(0,40)+"'");
      // 匹配验证码：placeholder含验证码/captcha，或class含verify/captcha
      if(/验证码|captcha|vcode|yzm/i.test(ph+n+id+cls))captchaInput=inp;
    });
    console.log("[xuetong:bf] 验证码输入框:",captchaInput?"找到 (placeholder='"+captchaInput.placeholder+"')":"未找到");

    // 填入凭据
    setNativeValue(userInput,cred.username);
    setNativeValue(pwd,cred.password);
    console.log("[xuetong:bf] 凭据已填入, username=",userInput.value,"password=",pwd.value?"***":"空");

    // 验证码处理：尝试OCR，失败则等待用户手动输入
    function solveCaptcha(callback){
      if(!captchaInput){callback();return}
      // 尝试OCR识别
      var captchaImg=null;
      document.querySelectorAll("img").forEach(function(img){
        var src=img.src||"",cls=img.className||"";
        if(/captcha|verify|code|vcode|yzm|验证码/i.test(src+cls))captchaImg=img;
        if(!captchaImg){var p=img.closest("[class*='verify'],[class*='captcha']");if(p)captchaImg=img}
      });
      if(!captchaImg){
        var cr=captchaInput.getBoundingClientRect();
        document.querySelectorAll("img").forEach(function(img){
          var ir=img.getBoundingClientRect();
          var dist=Math.abs(ir.top-cr.top)+Math.abs(ir.left-cr.left);
          if(dist<300&&ir.width>30&&ir.height>15&&!captchaImg)captchaImg=img;
        });
      }
      if(!captchaImg||!captchaImg.src||captchaImg.src.length<100){callback();return}
      // 对比度拉伸预处理：把浅灰文字拉到纯黑
      var canvas=document.createElement("canvas");
      canvas.width=captchaImg.naturalWidth;canvas.height=captchaImg.naturalHeight;
      var ctx=canvas.getContext("2d");
      try{ctx.drawImage(captchaImg,0,0)}catch(e){callback();return}
      var imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
      var d=imageData.data;
      var minG=255,maxG=0;
      for(var i=0;i<d.length;i+=4){var g=d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114;if(g<250){if(g<minG)minG=g;if(g>maxG)maxG=g}}
      console.log("[xuetong:bf] 灰度范围:",minG.toFixed(0),"-",maxG.toFixed(0));
      var range=maxG-minG;
      if(range>5){
        for(var j=0;j<d.length;j+=4){
          var gv=d[j]*0.299+d[j+1]*0.587+d[j+2]*0.114;
          var stretched=(gv-minG)/range*255;
          var val=stretched>160?255:0;
          d[j]=d[j+1]=d[j+2]=val;
        }
        ctx.putImageData(imageData,0,0);
      }
      var big=document.createElement("canvas");
      big.width=canvas.width*3;big.height=canvas.height*3;
      var bctx=big.getContext("2d");bctx.imageSmoothingEnabled=false;
      bctx.drawImage(canvas,0,0,big.width,big.height);
      var b64;try{b64=big.toDataURL("image/png")}catch(e){callback();return}
      console.log("[xuetong:bf] 预处理完成, base64长度:",b64.length);
      // 发送到本地ddddocr服务
      fetch("http://127.0.0.1:19876/ocr",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({image:b64})
      }).then(function(r){return r.json()}).then(function(data){
        var text=(data&&data.text)||"";
        console.log("[xuetong:bf] ddddocr结果:",text);
        if(text&&text.length>=2){
          setNativeValue(captchaInput,text);
        }
        callback();
      }).catch(function(e){
        console.log("[xuetong:bf] ddddocr服务未运行:",e.message);
        // 提示用户启动服务
        var toast=document.createElement("div");
        toast.style.cssText="position:fixed;top:10px;right:10px;z-index:99999;background:#ff4757;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3)";
        toast.textContent="⚠️ 验证码识别服务未运行，请执行: python3.8 captcha_server.py";
        document.body.appendChild(toast);
        setTimeout(function(){toast.remove()},8000);
        callback();
      });
    }

    // 查找并点击提交按钮
    var submitBtn=null;
    var loginPat=/登录|登 录|login|sign.?in|submit|提交/i;
    // 策略1: form内的submit按钮
    if(form){
      submitBtn=form.querySelector('button[type="submit"],input[type="submit"]');
    }
    // 策略2: 按钮/div/a含登录文本（排除容器元素）
    if(!submitBtn){
      var candidates=document.querySelectorAll('button,[class*="btn"],[role="button"],a');
      for(var b=0;b<candidates.length;b++){
        var el=candidates[b];
        var txt=(el.textContent||"").trim();
        var cls=(el.className||"").toLowerCase();
        // 排除容器：文本过长（>20字符）或class含wrapper/container
        if(txt.length>20||/wrapper|container|content|form|panel/.test(cls))continue;
        if(loginPat.test(txt)){submitBtn=el;break}
      }
    }
    // 策略3: form内最后一个button
    if(!submitBtn&&form){
      var btns=form.querySelectorAll("button");
      if(btns.length)submitBtn=btns[btns.length-1];
    }
    if(!submitBtn){restoreAll();_bfDone({success:null,message:"未找到提交按钮"});return!0}

    // 识别验证码后点击提交
    solveCaptcha(function(){
      console.log("[xuetong:bf] solveCaptcha回调, submitBtn=",submitBtn?"找到":"null","captchaValue=",(captchaInput&&captchaInput.value)||"空");
      setTimeout(function(){
        console.log("[xuetong:bf] 点击登录按钮...",submitBtn.tagName,submitBtn.className);
        submitBtn.click();
        console.log("[xuetong:bf] 登录按钮已点击");
      },200);
    });

    // 等待响应，支持验证码错误自动重试
    var responded=false;
    var captchaRetries=0;
    var MAX_CAPTCHA_RETRIES=3;
    var checkInterval; // 前向声明
    function respondOnce(result){
      if(responded)return;
      responded=true;
      if(checkInterval)clearInterval(checkInterval);
      restoreAll();
      _bfDone(result);
    }
    // 处理登录响应，区分验证码错误和密码错误
    function handleLoginResponse(){
      if(!loginResult||responded)return;
      var status=loginResult.status,body=loginResult.body||"";
      loginResult=null; // 清空，允许重试后重新捕获
      try{
        var json=JSON.parse(body);
        var d=json.data||json;
        var rc=d.responseCode||d.response_code||json.responseCode||json.response_code||d.code||json.code||d.status||json.status;
        var msg=d.verboseMsg||d.verbose_msg||d.msg||d.message||json.msg||json.message||d.detail||json.detail||d.error||json.error||"";
        if(json.access_token||d.access_token||json.token||d.token||rc===0||rc===1039||json.success===true||d.success===true){
          respondOnce({success:true,message:"登录成功",status:status,response:json});
        }else if(rc===1009||rc===1008){
          // 验证码错误 → 自动重试
          captchaRetries++;
          if(captchaRetries<=MAX_CAPTCHA_RETRIES){
            console.log("[xuetong:bf] 验证码错误，自动重试 "+captchaRetries+"/"+MAX_CAPTCHA_RETRIES);
            lastActivity=Date.now(); // 重置超时计时
            // 刷新验证码 → 重新识别 → 重新提交
            solveCaptcha(function(){
              if(submitBtn){submitBtn.click()}
            });
          }else{
            respondOnce({success:false,message:"验证码错误，重试"+MAX_CAPTCHA_RETRIES+"次后放弃",status:status});
          }
        }else if(rc===1007||rc===1005||rc===1067){
          // 密码错误 → 不重试，返回失败
          respondOnce({success:false,message:"登录失败: "+msg,status:status});
        }else if(msg){
          respondOnce({success:false,message:"登录失败: "+msg,status:status});
        }else if(rc!==undefined&&rc!==null){
          respondOnce({success:false,message:"登录失败 (code:"+rc+")",status:status,response:json});
        }else{
          respondOnce({success:null,message:"无法判定",status:status,response:json});
        }
      }catch(e){
        var bl=body.toLowerCase();
        if(bl.includes("验证码")||bl.includes("captcha")){
          // 验证码错误关键词 → 重试
          captchaRetries++;
          if(captchaRetries<=MAX_CAPTCHA_RETRIES){
            console.log("[xuetong:bf] 验证码错误(关键词)，自动重试 "+captchaRetries+"/"+MAX_CAPTCHA_RETRIES);
            lastActivity=Date.now();
            solveCaptcha(function(){if(submitBtn){submitBtn.click()}});
          }else{
            respondOnce({success:false,message:"验证码错误，重试"+MAX_CAPTCHA_RETRIES+"次后放弃",status:status});
          }
        }else if(bl.includes("密码")||bl.includes("error")||bl.includes("fail")||bl.includes("invalid")){
          respondOnce({success:false,message:"登录失败",status:status});
        }else if(status>=200&&status<300){
          respondOnce({success:true,message:"登录成功",status:status});
        }else{
          respondOnce({success:null,message:"HTTP "+status,status:status});
        }
      }
    }
    var waitStart=Date.now();
    var lastActivity=Date.now(); // 每次验证码重试时更新
    checkInterval=setInterval(function(){
      var elapsed=Date.now()-waitStart;
      var idle=Date.now()-lastActivity;
      var curToken=localStorage.getItem("token");
      var curUrl=window.location.href;
      // token变化 = 登录成功
      if(curToken&&curToken!==prevToken&&!curUrl.includes("login")){
        clearInterval(checkInterval);
        respondOnce({success:true,message:"登录成功 (检测到token)",status:200});
        return;
      }
      // URL跳转 = 登录成功
      if(curUrl!==prevUrl&&!curUrl.includes("login")){
        clearInterval(checkInterval);
        respondOnce({success:true,message:"登录成功 (页面跳转)",status:200});
        return;
      }
      // 有响应 → 判定结果
      if(loginResult){handleLoginResponse()}
      // 超时：验证码重试期间不超时，只在无活动超过15秒时超时
      if(idle>15000&&!responded){
        clearInterval(checkInterval);
        var finalToken=localStorage.getItem("token");
        if(finalToken&&finalToken!==prevToken){
          respondOnce({success:true,message:"登录成功 (延迟检测到token)",status:200});
        }else{
          respondOnce({success:null,message:"请求超时，未检测到登录响应",status:0});
        }
      }
    },200);

    return!0;
  }catch(ex){
    _bfDone({success:null,message:"操作异常: "+ex.message});
    return!0;
  }
});
Te();
console.log("[xuetong:bf] content.js 已加载, URL=",window.location.href," password inputs=",document.querySelectorAll('input[type="password"]').length);
