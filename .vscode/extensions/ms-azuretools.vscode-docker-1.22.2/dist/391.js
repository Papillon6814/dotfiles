"use strict";exports.id=391,exports.ids=[391],exports.modules={63391:(e,n,t)=>{t.r(n),t.d(n,{BE_PROFILE:()=>p,NRT_PROFILE:()=>_,PostChannel:()=>V,RT_PROFILE:()=>v});var a=t(27421),r=t(29141),i=t(81782),o=t(47954),s=t(87624),u=t(65705),l=t(24869),c=t(49251),d=t(28452),f=t(29339),h=t(87951),v="REAL_TIME",_="NEAR_REAL_TIME",p="BEST_EFFORT",y="POST",m="drop",g="send",T="requeue",S="rspFail",E="application/x-json-stream",b="cache-control",P="content-type",C="kill-duration",R="time-delta-millis",B="client-version",x="client-id",M="time-delta-to-apply-millis",w="upload-time",A="apikey",k="AuthMsaDeviceTicket",O="AuthXToken";function _getEventMsfpc(e){var n=(e.ext||{}).intweb;return n&&(0,u.Sn)(n.msfpc)?n.msfpc:null}function _getMsfpc(e){for(var n=null,t=0;null===n&&t<e.length;t++)n=_getEventMsfpc(e[t]);return n}var K=function(){function EventBatch(e,n){var t=n?[].concat(n):[],a=this,r=_getMsfpc(t);a.iKey=function(){return e},a.Msfpc=function(){return r||""},a.count=function(){return t.length},a.events=function(){return t},a.addEvent=function(e){return!!e&&(t.push(e),r||(r=_getEventMsfpc(e)),!0)},a.split=function(n,a){var i;if(n<t.length){var o=t.length-n;(0,l.le)(a)||(o=a<o?a:o),i=t.splice(n,o),r=_getMsfpc(t)}return new EventBatch(e,i)}}return EventBatch.create=function(e,n){return new EventBatch(e,n)},EventBatch}(),H=t(1550),L=2e6,F=Math.min(L,65e3),q=/\./,I=function Serializer(e,n,t,a){var o="data",s="baseData",c=!!a,d=n,f={};(0,r.Z)(Serializer,this,(function(n){function _processPathKeys(e,n,a,r,i,o,s){(0,l.rW)(e,(function(e,h){var v=null;if(h||(0,u.Sn)(h)){var _=a,p=e,y=i,m=n;if(c&&!r&&q.test(e)){var g=e.split("."),T=g.length;if(T>1){y&&(y=y.slice());for(var S=0;S<T-1;S++){var E=g[S];m=m[E]=m[E]||{},_+="."+E,y&&y.push(E)}p=g[T-1]}}var b=r&&function _isReservedField(e,n){var t=f[e];return void 0===t&&(e.length>=7&&(t=(0,l.xe)(e,"ext.metadata")||(0,l.xe)(e,"ext.web")),f[e]=t),t}(_);if(v=!b&&d&&d.handleField(_,p)?d.value(_,p,h,t):(0,u.yj)(p,h,t)){var P=v.value;if(m[p]=P,o&&o(y,p,v),s&&"object"==typeof P&&!(0,l.kJ)(P)){var C=y;C&&(C=C.slice()).push(p),_processPathKeys(h,P,_+"."+p,r,C,o,s)}}}}))}n.createPayload=function(e,n,t,a,r,i){return{apiKeys:[],payloadBlob:"",overflow:null,sizeExceed:[],failedEvts:[],batches:[],numEvents:0,retryCnt:e,isTeardown:n,isSync:t,isBeacon:a,sendType:i,sendReason:r}},n.appendPayload=function(t,a,r){var o=t&&a&&!t.overflow;return o&&(0,i.Lm)(e,(function(){return"Serializer:appendPayload"}),(function(){for(var e=a.events(),i=t.payloadBlob,o=t.numEvents,s=!1,u=[],c=[],d=t.isBeacon,f=d?65e3:3984588,h=d?F:L,v=0,_=0;v<e.length;){var p=e[v];if(p){if(o>=r){t.overflow=a.split(v);break}var y=n.getEventBlob(p);if(y&&y.length<=h){var m=y.length;if(i.length+m>f){t.overflow=a.split(v);break}i&&(i+="\n"),i+=y,++_>20&&(i.substr(0,1),_=0),s=!0,o++}else y?u.push(p):c.push(p),e.splice(v,1),v--}v++}if(u&&u.length>0&&t.sizeExceed.push(K.create(a.iKey(),u)),c&&c.length>0&&t.failedEvts.push(K.create(a.iKey(),c)),s){t.batches.push(a),t.payloadBlob=i,t.numEvents=o;var g=a.iKey();-1===(0,l.UA)(t.apiKeys,g)&&t.apiKeys.push(g)}}),(function(){return{payload:t,theBatch:{iKey:a.iKey(),evts:a.events()},max:r}})),o},n.getEventBlob=function(n){try{return(0,i.Lm)(e,(function(){return"Serializer.getEventBlob"}),(function(){var e={};e.name=n.name,e.time=n.time,e.ver=n.ver,e.iKey="o:"+(0,u.jM)(n.iKey);var t={},a=n.ext;a&&(e.ext=t,(0,l.rW)(a,(function(e,n){_processPathKeys(n,t[e]={},"ext."+e,!0,null,null,!0)})));var r=e.data={};r.baseType=n.baseType;var i=r.baseData={};return _processPathKeys(n.baseData,i,s,!1,[s],(function(e,n,a){_addJSONPropertyMetaData(t,e,n,a)}),!0),_processPathKeys(n.data,r,o,!1,[],(function(e,n,a){_addJSONPropertyMetaData(t,e,n,a)}),!0),JSON.stringify(e)}),(function(){return{item:n}}))}catch(e){return null}}}))};function _addJSONPropertyMetaData(e,n,t,a){if(a&&e){var r=(0,u.Vv)(a.value,a.kind,a.propertyType);if(r>-1){var i=e.metadata;i||(i=e.metadata={f:{}});var o=i.f;if(o||(o=i.f={}),n)for(var s=0;s<n.length;s++){var c=n[s];o[c]||(o[c]={f:{}});var d=o[c].f;d||(d=o[c].f={}),o=d}o=o[t]={},(0,l.kJ)(a.value)?o.a={t:r}:o.t=r}}}function retryPolicyGetMillisToBackoffForRetry(e){var n,t=Math.floor(1200*Math.random())+2400;return n=Math.pow(2,e)*t,Math.min(n,6e5)}const Q=function KillSwitch(){var e={};(0,r.Z)(KillSwitch,this,(function(n){n.setKillSwitchTenants=function(n,t){if(n&&t)try{var a=function _normalizeTenants(e){var n=[];return e&&(0,l.tO)(e,(function(e){n.push((0,l.nd)(e))})),n}(n.split(","));if("this-request-only"===t)return a;for(var r=1e3*parseInt(t,10),i=0;i<a.length;++i)e[a[i]]=(0,l.m6)()+r}catch(e){return[]}return[]},n.isTenantKilled=function(n){var t=e,a=(0,l.nd)(n);return void 0!==t[a]&&t[a]>(0,l.m6)()||(delete t[a],!1)}}))};const N=function ClockSkewManager(){var e=!0,n=!0,t=!0,a="use-collector-delta",i=!1;(0,r.Z)(ClockSkewManager,this,(function(r){r.allowRequestSending=function(){return e},r.firstRequestSent=function(){t&&(t=!1,i||(e=!1))},r.shouldAddClockSkewHeaders=function(){return n},r.getClockSkewHeaderValue=function(){return a},r.setClockSkew=function(t){i||(t?(a=t,n=!0,i=!0):n=!1,e=!0)}}))};var D,U="&NoResponseBody=true",z=((D={})[1]=T,D[100]=T,D[200]="sent",D[8004]=m,D[8003]=m,D),j={},W={};function _addCollectorHeaderQsMapping(e,n,t){j[e]=n,!1!==t&&(W[n]=e)}function _getResponseText(e){try{return e.responseText}catch(e){}return""}function _hasHeader(e,n){var t=!1;if(e&&n){var a=(0,l.FY)(e);if(a&&a.length>0)for(var r=n.toLowerCase(),i=0;i<a.length;i++){var o=a[i];if(o&&(0,l.nr)(n,o)&&o.toLowerCase()===r){t=!0;break}}}return t}function _addRequestDetails(e,n,t,a){n&&t&&t.length>0&&(a&&j[n]?(e.hdrs[j[n]]=t,e.useHdrs=!0):e.url+="&"+n+"="+t)}_addCollectorHeaderQsMapping(k,k,!1),_addCollectorHeaderQsMapping(B,B),_addCollectorHeaderQsMapping(x,"Client-Id"),_addCollectorHeaderQsMapping(A,A),_addCollectorHeaderQsMapping(M,M),_addCollectorHeaderQsMapping(w,w),_addCollectorHeaderQsMapping(O,O);var J=function HttpManager(e,n,t,a,o){this._responseHandlers=[];var s,d,h,v,_,p,T="?cors=true&"+P.toLowerCase()+"="+E,k=new Q,O=!1,K=new N,L=!1,F=0,q=!0,D=[],j={},J=[],X=null,V=!1,Z=!1,Y=!1;(0,r.Z)(HttpManager,this,(function(r){var Q=!0;function _getSenderInterface(e,n){for(var t=0,a=null,r=0;null==a&&r<e.length;)1===(t=e[r])?(0,c.cp)()?a=_xdrSendPost:(0,c.Z3)()&&(a=_xhrSendPost):2===t&&(0,c.JO)(n)?a=_fetchSendPost:L&&3===t&&(0,c.MF)()&&(a=_beaconSendPost),r++;return a?{_transport:t,_isSync:n,sendPOST:a}:null}function _xdrSendPost(e,n,t){var a=new XDomainRequest;a.open(y,e.urlString),e.timeout&&(a.timeout=e.timeout),a.onload=function(){var e=_getResponseText(a);_doOnComplete(n,200,{},e),_handleCollectorResponse(e)},a.onerror=function(){_doOnComplete(n,400,{})},a.ontimeout=function(){_doOnComplete(n,500,{})},a.onprogress=function(){},t?a.send(e.data):o.set((function(){a.send(e.data)}),0)}function _fetchSendPost(e,n,t){var a,r=e.urlString,i=!1,s=!1,u=((a={body:e.data,method:y}).Microsoft_ApplicationInsights_BypassAjaxInstrumentation=!0,a);t&&(u.keepalive=!0,2===e._sendReason&&(i=!0,r+=U)),Q&&(u.credentials="include"),e.headers&&(0,l.FY)(e.headers).length>0&&(u.headers=e.headers),fetch(r,u).then((function(e){var t={},a="";e.headers&&e.headers.forEach((function(e,n){t[n]=e})),e.body&&e.text().then((function(e){a=e})),s||(s=!0,_doOnComplete(n,e.status,t,a),_handleCollectorResponse(a))})).catch((function(e){s||(s=!0,_doOnComplete(n,0,{}))})),i&&!s&&(s=!0,_doOnComplete(n,200,{})),!s&&e.timeout>0&&o.set((function(){s||(s=!0,_doOnComplete(n,500,{}))}),e.timeout)}function _xhrSendPost(e,n,t){var a=e.urlString;function _appendHeader(e,n,t){if(!e[t]&&n&&n.getResponseHeader){var a=n.getResponseHeader(t);a&&(e[t]=(0,l.nd)(a))}return e}function _getAllResponseHeaders(e){var n={};return e.getAllResponseHeaders?n=function _convertAllHeadersToMap(e){var n={};if((0,l.HD)(e)){var t=(0,l.nd)(e).split(/[\r\n]+/);(0,l.tO)(t,(function(e){if(e){var t=e.indexOf(": ");if(-1!==t){var a=(0,l.nd)(e.substring(0,t)).toLowerCase(),r=(0,l.nd)(e.substring(t+1));n[a]=r}else n[(0,l.nd)(e)]=1}}))}return n}(e.getAllResponseHeaders()):(n=_appendHeader(n,e,R),n=_appendHeader(n,e,C),n=_appendHeader(n,e,"kill-duration-seconds")),n}function xhrComplete(e,t){_doOnComplete(n,e.status,_getAllResponseHeaders(e),t)}t&&e.disableXhrSync&&(t=!1);var r=(0,u.ot)(y,a,Q,!0,t,e.timeout);(0,l.rW)(e.headers,(function(e,n){r.setRequestHeader(e,n)})),r.onload=function(){var e=_getResponseText(r);xhrComplete(r,e),_handleCollectorResponse(e)},r.onerror=function(){xhrComplete(r)},r.ontimeout=function(){xhrComplete(r)},r.send(e.data)}function _doOnComplete(e,n,t,a){try{e(n,t,a)}catch(e){(0,f.kP)(s.diagLog(),2,518,(0,c.eU)(e))}}function _beaconSendPost(e,n,t){var a=200,r=e._thePayload,i=e.urlString+U;try{var o=(0,c.jW)();if(!o.sendBeacon(i,e.data))if(r){var u=[];(0,l.tO)(r.batches,(function(e){if(u&&e&&e.count()>0){for(var n=e.events(),t=0;t<n.length;t++)if(!o.sendBeacon(i,X.getEventBlob(n[t]))){u.push(e.split(t));break}}else u.push(e.split(0))})),_sendBatchesNotification(u,8003,r.sendType,!0)}else a=0}catch(e){s.diagLog().warnToConsole("Failed to send telemetry using sendBeacon API. Ex:"+(0,c.eU)(e)),a=0}finally{_doOnComplete(n,a,{},"")}}function _isBeaconPayload(e){return 2===e||3===e}function _adjustSendType(e){return Z&&_isBeaconPayload(e)&&(e=2),e}function _hasIdleConnection(){return!O&&F<n}function _clearQueue(){var e=J;return J=[],e}function _canSendPayload(e,n,t){var a=!1;return e&&e.length>0&&!O&&d[n]&&X&&(a=0!==n||_hasIdleConnection()&&(t>0||K.allowRequestSending())),a}function _createDebugBatches(e){var n={};return e&&(0,l.tO)(e,(function(e,t){n[t]={iKey:e.iKey(),evts:e.events()}})),n}function _sendBatches(n,t,a,r,o){if(n&&0!==n.length)if(O)_sendBatchesNotification(n,1,r);else{r=_adjustSendType(r);try{var l=n,v=0!==r;(0,i.Lm)(h,(function(){return"HttpManager:_sendBatches"}),(function(i){i&&(n=n.slice(0));for(var s=[],l=null,f=(0,u.hK)(),h=d[r]||(v?d[1]:d[0]),_=(Z||_isBeaconPayload(r)||h&&3===h._transport)&&function _canUseSendBeaconApi(){return!q&&L&&(0,c.MF)()}();_canSendPayload(n,r,t);){var p=n.shift();p&&p.count()>0&&(k.isTenantKilled(p.iKey())?s.push(p):(l=l||X.createPayload(t,a,v,_,o,r),X.appendPayload(l,p,e)?null!==l.overflow&&(n=[l.overflow].concat(n),l.overflow=null,_doPayloadSend(l,f,(0,u.hK)(),o),f=(0,u.hK)(),l=null):(_doPayloadSend(l,f,(0,u.hK)(),o),f=(0,u.hK)(),n=[p].concat(n),l=null)))}l&&_doPayloadSend(l,f,(0,u.hK)(),o),n.length>0&&(J=n.concat(J)),_sendBatchesNotification(s,8004,r)}),(function(){return{batches:_createDebugBatches(l),retryCount:t,isTeardown:a,isSynchronous:v,sendReason:o,useSendBeacon:_isBeaconPayload(r),sendType:r}}),!v)}catch(e){(0,f.kP)(s.diagLog(),2,48,"Unexpected Exception sending batch: "+(0,c.eU)(e))}}}function _buildRequestDetails(e,n){var t={url:T,hdrs:{},useHdrs:!1};n?(t.hdrs=(0,u.l7)(t.hdrs,j),t.useHdrs=(0,l.FY)(t.hdrs).length>0):(0,l.rW)(j,(function(e,n){W[e]?_addRequestDetails(t,W[e],n,!1):(t.hdrs[e]=n,t.useHdrs=!0)})),_addRequestDetails(t,x,"NO_AUTH",n),_addRequestDetails(t,B,u.vs,n);var a="";(0,l.tO)(e.apiKeys,(function(e){a.length>0&&(a+=","),a+=e})),_addRequestDetails(t,A,a,n),_addRequestDetails(t,w,(0,l.m6)().toString(),n);var r=function _getMsfpc(e){for(var n=0;n<e.batches.length;n++){var t=e.batches[n].Msfpc();if(t)return encodeURIComponent(t)}return""}(e);if((0,u.Sn)(r)&&(t.url+="&ext.intweb.msfpc="+r),K.shouldAddClockSkewHeaders()&&_addRequestDetails(t,M,K.getClockSkewHeaderValue(),n),h.getWParam){var i=h.getWParam();i>=0&&(t.url+="&w="+i)}for(var o=0;o<D.length;o++)t.url+="&"+D[o].name+"="+D[o].value;return t}function _setTimingValue(e,n,t){e[n]=e[n]||{},e[n][s.identifier]=t}function _doPayloadSend(e,n,a,o){if(e&&e.payloadBlob&&e.payloadBlob.length>0){var f=!!r.sendHook,v=d[e.sendType];!_isBeaconPayload(e.sendType)&&e.isBeacon&&2===e.sendReason&&(v=d[2]||d[3]||v);var y=Y;(e.isBeacon||3===v._transport)&&(y=!1);var m=_buildRequestDetails(e,y);y=y||m.useHdrs;var g=(0,u.hK)();(0,i.Lm)(h,(function(){return"HttpManager:_doPayloadSend"}),(function(){for(var d=0;d<e.batches.length;d++)for(var T=e.batches[d].events(),S=0;S<T.length;S++){var C=T[S];if(V){var B=C.timings=C.timings||{};_setTimingValue(B,"sendEventStart",g),_setTimingValue(B,"serializationStart",n),_setTimingValue(B,"serializationCompleted",a)}C.sendAttempt>0?C.sendAttempt++:C.sendAttempt=1}_sendBatchesNotification(e.batches,1e3+(o||0),e.sendType,!0);var x={data:e.payloadBlob,urlString:m.url,headers:m.hdrs,_thePayload:e,_sendReason:o,timeout:_};(0,l.o8)(p)||(x.disableXhrSync=!!p),y&&(_hasHeader(x.headers,b)||(x.headers[b]="no-cache, no-store"),_hasHeader(x.headers,P)||(x.headers["content-type"]=E));var M=null;v&&(M=function(n){K.firstRequestSent();var onComplete=function(n,a){!function _retryRequestIfNeeded(e,n,a,i){var o=9e3,c=null,d=!1,f=!1;try{var h=!0;if(typeof e!==H.jA){if(n){K.setClockSkew(n[R]);var v=n["kill-duration"]||n["kill-duration-seconds"];(0,l.tO)(k.setKillSwitchTenants(n["kill-tokens"],v),(function(e){(0,l.tO)(a.batches,(function(n){if(n.iKey()===e){c=c||[];var t=n.split(0);a.numEvents-=t.count(),c.push(t)}}))}))}if(200==e||204==e)return void(o=200);(!function retryPolicyShouldRetryForStatus(e){return!(e>=300&&e<500&&408!=e&&429!=e||501==e||505==e)}(e)||a.numEvents<=0)&&(h=!1),o=9e3+e%1e3}if(h){o=100;var _=a.retryCnt;0===a.sendType&&(_<t?(d=!0,_doAction((function(){0===a.sendType&&F--,_sendBatches(a.batches,_+1,a.isTeardown,Z?2:a.sendType,5)}),Z,retryPolicyGetMillisToBackoffForRetry(_))):(f=!0,Z&&(o=8001)))}}finally{d||(K.setClockSkew(),function _handleRequestFinished(e,n,t,a){try{a&&s._backOffTransmission(),200===n&&(a||e.isSync||s._clearBackOff(),function _addCompleteTimings(e){if(V){var n=(0,u.hK)();(0,l.tO)(e,(function(e){e&&e.count()>0&&function _addEventCompletedTimings(e,n){V&&(0,l.tO)(e,(function(e){_setTimingValue(e.timings=e.timings||{},"sendEventCompleted",n)}))}(e.events(),n)}))}}(e.batches)),_sendBatchesNotification(e.batches,n,e.sendType,!0)}finally{0===e.sendType&&(F--,5!==t&&r.sendQueuedRequests(e.sendType,t))}}(a,o,i,f)),_sendBatchesNotification(c,8004,a.sendType)}}(n,a,e,o)},a=e.isTeardown||e.isSync;try{v.sendPOST(n,onComplete,a),r.sendListener&&r.sendListener(x,n,a,e.isBeacon)}catch(e){s.diagLog().warnToConsole("Unexpected exception sending payload. Ex:"+(0,c.eU)(e)),_doOnComplete(onComplete,0,{})}}),(0,i.Lm)(h,(function(){return"HttpManager:_doPayloadSend.sender"}),(function(){if(M)if(0===e.sendType&&F++,f&&!e.isBeacon&&3!==v._transport){var n={data:x.data,urlString:x.urlString,headers:(0,u.l7)({},x.headers),timeout:x.timeout,disableXhrSync:x.disableXhrSync},t=!1;(0,i.Lm)(h,(function(){return"HttpManager:_doPayloadSend.sendHook"}),(function(){try{r.sendHook(n,(function(e){t=!0,q||e._thePayload||(e._thePayload=e._thePayload||x._thePayload,e._sendReason=e._sendReason||x._sendReason),M(e)}),e.isSync||e.isTeardown)}catch(e){t||M(x)}}))}else M(x)}))}),(function(){return{thePayload:e,serializationStart:n,serializationCompleted:a,sendReason:o}}),e.isSync)}e.sizeExceed&&e.sizeExceed.length>0&&_sendBatchesNotification(e.sizeExceed,8003,e.sendType),e.failedEvts&&e.failedEvts.length>0&&_sendBatchesNotification(e.failedEvts,8002,e.sendType)}function _doAction(e,n,t){n?e():o.set(e,t)}function _handleCollectorResponse(e){var n=r._responseHandlers;try{for(var t=0;t<n.length;t++)try{n[t](e)}catch(e){(0,f.kP)(s.diagLog(),1,519,"Response handler failed: "+e)}if(e){var a=JSON.parse(e);(0,u.Sn)(a.webResult)&&(0,u.Sn)(a.webResult.msfpc)&&v.set("MSFPC",a.webResult.msfpc,31536e3)}}catch(e){}}function _sendBatchesNotification(e,n,t,r){if(e&&e.length>0&&a){var o=a[function _getNotificationAction(e){var n=z[e];return(0,u.Sn)(n)||(n="oth",e>=9e3&&e<=9999?n=S:e>=8e3&&e<=8999?n=m:e>=1e3&&e<=1999&&(n=g)),n}(n)];if(o){var l=0!==t;(0,i.Lm)(h,(function(){return"HttpManager:_sendBatchesNotification"}),(function(){_doAction((function(){try{o.call(a,e,n,l,t)}catch(e){(0,f.kP)(s.diagLog(),1,74,"send request notification failed: "+e)}}),r||l,0)}),(function(){return{batches:_createDebugBatches(e),reason:n,isSync:l,sendSync:r,sendType:t}}),!l)}}}r.initialize=function(e,n,t,a,r){var i;r||(r={}),T=e+T,Y=!!(0,l.o8)(r.avoidOptions)||!r.avoidOptions,h=n,v=n.getCookieMgr(),V=!h.config.disableEventTimings;var o=!!h.config.enableCompoundKey;s=t;var u=r.valueSanitizer,f=r.stringifyObjects;(0,l.o8)(r.enableCompoundKey)||(o=!!r.enableCompoundKey),_=r.xhrTimeout,p=r.disableXhrSync,L=!(0,c.b$)(),X=new I(h,u,f,o);var y=a,m=r.alwaysUseXhrOverride?a:null,g=r.alwaysUseXhrOverride?a:null;if(!a){q=!1;var S=(0,c.k$)();S&&S.protocol&&"file:"===S.protocol.toLowerCase()&&(Q=!1);var E=[];E=(0,c.b$)()?[2,1]:[1,2,3];var b=r.transports;b&&((0,l.hj)(b)?E=[b].concat(E):(0,l.kJ)(b)&&(E=b.concat(E))),a=_getSenderInterface(E,!1),y=_getSenderInterface(E,!0),a||s.diagLog().warnToConsole("No available transport to send events")}(i={})[0]=a,i[1]=y||_getSenderInterface([1,2,3],!0),i[2]=m||_getSenderInterface([3,2],!0)||y||_getSenderInterface([1],!0),i[3]=g||_getSenderInterface([2,3],!0)||y||_getSenderInterface([1],!0),d=i},r._getDbgPlgTargets=function(){return[d[0],k,X,d]},r.addQueryStringParameter=function(e,n){for(var t=0;t<D.length;t++)if(D[t].name===e)return void(D[t].value=n);D.push({name:e,value:n})},r.addHeader=function(e,n){j[e]=n},r.canSendRequest=function(){return _hasIdleConnection()&&K.allowRequestSending()},r.sendQueuedRequests=function(e,n){(0,l.o8)(e)&&(e=0),Z&&(e=_adjustSendType(e),n=2),_canSendPayload(J,e,0)&&_sendBatches(_clearQueue(),0,!1,e,n||0)},r.isCompletelyIdle=function(){return!O&&0===F&&0===J.length},r.setUnloading=function(e){Z=e},r.addBatch=function(e){if(e&&e.count()>0){if(k.isTenantKilled(e.iKey()))return!1;J.push(e)}return!0},r.teardown=function(){J.length>0&&_sendBatches(_clearQueue(),0,!0,2,2)},r.pause=function(){O=!0},r.resume=function(){O=!1,r.sendQueuedRequests(0,4)},r.sendSynchronousBatch=function(e,n,t){e&&e.count()>0&&((0,l.le)(n)&&(n=1),Z&&(n=_adjustSendType(n),t=2),_sendBatches([e],0,!1,n,t||0))}}))};function defaultSetTimeout(e,n){for(var t=[],a=2;a<arguments.length;a++)t[a-2]=arguments[a];return setTimeout(e,n,t)}function defaultClearTimeout(e){clearTimeout(e)}function createTimeoutWrapper(e,n){return{set:e||defaultSetTimeout,clear:n||defaultClearTimeout}}var X="eventsDiscarded";const V=function(e){function PostChannel(){var n,t=e.call(this)||this;t.identifier="PostChannel",t.priority=1011,t.version="3.2.3";var a,h,y,m,g,T,S,E=!1,b=[],P=null,C=!1,R=0,B=500,x=0,M=1e4,w={},A=v,O=null,H=null,L=0,F=0,q={},I=-1,Q=!0,N=!1,D=6,U=2;return(0,r.Z)(PostChannel,t,(function(e,t){function _handleUnloadEvents(e){"beforeunload"!==(e||(0,c.Jj)().event).type&&(N=!0,h.setUnloading(N)),_releaseAllQueues(2,2)}function _handleShowEvents(e){N=!1,h.setUnloading(N)}function _addEventToQueues(e,n){if(e.sendAttempt||(e.sendAttempt=0),e.latency||(e.latency=1),e.ext&&e.ext.trace&&delete e.ext.trace,e.ext&&e.ext.user&&e.ext.user.id&&delete e.ext.user.id,Q&&(e.ext=(0,l.Ax)(e.ext),e.baseData&&(e.baseData=(0,l.Ax)(e.baseData)),e.data&&(e.data=(0,l.Ax)(e.data))),e.sync)if(L||C)e.latency=3,e.sync=!1;else if(h)return Q&&(e=(0,l.Ax)(e)),void h.sendSynchronousBatch(K.create(e.iKey,[e]),!0===e.sync?1:e.sync,3);var t=e.latency,a=x,r=M;4===t&&(a=R,r=B);var i=!1;if(a<r)i=!_addEventToProperQueue(e,n);else{var o=1,s=20;4===t&&(o=4,s=1),i=!0,function _dropEventWithLatencyOrLess(e,n,t,a){for(;t<=n;){var r=_getEventBatch(e,n,!0);if(r&&r.count()>0){var i=r.split(0,a),o=i.count();if(o>0)return 4===t?R-=o:x-=o,_notifyBatchEvents(X,[i],d.h.QueueFull),!0}t++}return _resetQueueCounts(),!1}(e.iKey,e.latency,o,s)&&(i=!_addEventToProperQueue(e,n))}i&&_notifyEvents(X,[e],d.h.QueueFull)}function _sendEventsForLatencyAndAbove(e,n,t){var a=_queueBatches(e,n,t);return h.sendQueuedRequests(n,t),a}function _hasEvents(){return x>0}function _scheduleTimer(){if(I>=0&&_queueBatches(I,0,g)&&h.sendQueuedRequests(0,g),R>0&&!H&&!C){var e=w[A][2];e>=0&&(H=_createTimer((function(){H=null,_sendEventsForLatencyAndAbove(4,0,1),_scheduleTimer()}),e))}var n=w[A][1];!O&&!P&&n>=0&&!C&&(_hasEvents()?O=_createTimer((function(){O=null,_sendEventsForLatencyAndAbove(0===F?3:1,0,1),F++,F%=2,_scheduleTimer()}),n):F=0)}function _initDefaults(){n=null,E=!1,b=[],P=null,C=!1,R=0,B=500,x=0,M=1e4,w={},A=v,O=null,H=null,L=0,F=0,a=null,q={},y=void 0,m=0,I=-1,g=null,Q=!0,N=!1,D=6,U=2,T=null,S=createTimeoutWrapper(),h=new J(500,2,1,{requeue:_requeueEvents,send:_sendingEvent,sent:_eventsSentEvent,drop:_eventsDropped,rspFail:_eventsResponseFail,oth:_otherEvent},S),_initializeProfiles(),function _clearQueues(){q[4]={batches:[],iKeyMap:{}},q[3]={batches:[],iKeyMap:{}},q[2]={batches:[],iKeyMap:{}},q[1]={batches:[],iKeyMap:{}}}(),_setAutoLimits()}function _createTimer(e,n){0===n&&L&&(n=1);var t=1e3;return L&&(t=retryPolicyGetMillisToBackoffForRetry(L-1)),S.set(e,n*t)}function _clearScheduledTimer(){return null!==O&&(S.clear(O),O=null,F=0,!0)}function _releaseAllQueues(e,n){_clearScheduledTimer(),P&&(S.clear(P),P=null),C||_sendEventsForLatencyAndAbove(1,e,n)}function _getEventBatch(e,n,t){var a=q[n];a||(a=q[n=1]);var r=a.iKeyMap[e];return!r&&t&&(r=K.create(e),a.batches.push(r),a.iKeyMap[e]=r),r}function _performAutoFlush(n,t){h.canSendRequest()&&!L&&(y>0&&x>y&&(t=!0),t&&null==P&&e.flush(n,null,20))}function _addEventToProperQueue(e,n){Q&&(e=(0,l.Ax)(e));var t=e.latency,a=_getEventBatch(e.iKey,t,!0);return!!a.addEvent(e)&&(4!==t?(x++,n&&0===e.sendAttempt&&_performAutoFlush(!e.sync,m>0&&a.count()>=m)):R++,!0)}function _resetQueueCounts(){for(var e=0,n=0,_loop_1=function(t){var a=q[t];a&&a.batches&&(0,l.tO)(a.batches,(function(a){4===t?e+=a.count():n+=a.count()}))},t=1;t<=4;t++)_loop_1(t);x=n,R=e}function _queueBatches(n,t,a){var r=!1,o=0===t;return!o||h.canSendRequest()?(0,i.Lm)(e.core,(function(){return"PostChannel._queueBatches"}),(function(){for(var e=[],t=4;t>=n;){var a=q[t];a&&a.batches&&a.batches.length>0&&((0,l.tO)(a.batches,(function(n){h.addBatch(n)?r=r||n&&n.count()>0:e=e.concat(n.events()),4===t?R-=n.count():x-=n.count()})),a.batches=[],a.iKeyMap={}),t--}e.length>0&&_notifyEvents(X,e,d.h.KillSwitch),r&&I>=n&&(I=-1,g=0)}),(function(){return{latency:n,sendType:t,sendReason:a}}),!o):(I=I>=0?Math.min(I,n):n,g=Math.max(g,a)),r}function _flushImpl(e,n){_sendEventsForLatencyAndAbove(1,0,n),_resetQueueCounts(),_waitForIdleManager((function(){e&&e(),b.length>0?P=_createTimer((function(){P=null,_flushImpl(b.shift(),n)}),0):(P=null,_scheduleTimer())}))}function _waitForIdleManager(e){h.isCompletelyIdle()?e():P=_createTimer((function(){P=null,_waitForIdleManager(e)}),.25)}function _initializeProfiles(){(w={})[v]=[2,1,0],w[_]=[6,3,0],w[p]=[18,9,0]}function _requeueEvents(n,t){var a=[],r=D;N&&(r=U),(0,l.tO)(n,(function(n){n&&n.count()>0&&(0,l.tO)(n.events(),(function(n){n&&(n.sync&&(n.latency=4,n.sync=!1),n.sendAttempt<r?((0,u.if)(n,e.identifier),_addEventToQueues(n,!1)):a.push(n))}))})),a.length>0&&_notifyEvents(X,a,d.h.NonRetryableStatus),N&&_releaseAllQueues(2,2)}function _callNotification(n,t){var a=e._notificationManager||{},r=a[n];if(r)try{r.apply(a,t)}catch(t){(0,f.kP)(e.diagLog(),1,74,n+" notification failed: "+t)}}function _notifyEvents(e,n){for(var t=[],a=2;a<arguments.length;a++)t[a-2]=arguments[a];n&&n.length>0&&_callNotification(e,[n].concat(t))}function _notifyBatchEvents(e,n){for(var t=[],a=2;a<arguments.length;a++)t[a-2]=arguments[a];n&&n.length>0&&(0,l.tO)(n,(function(n){n&&n.count()>0&&_callNotification(e,[n.events()].concat(t))}))}function _sendingEvent(e,n,t){e&&e.length>0&&_callNotification("eventsSendRequest",[n>=1e3&&n<=1999?n-1e3:0,!0!==t])}function _eventsSentEvent(e,n){_notifyBatchEvents("eventsSent",e,n),_scheduleTimer()}function _eventsDropped(e,n){_notifyBatchEvents(X,e,n>=8e3&&n<=8999?n-8e3:d.h.Unknown)}function _eventsResponseFail(e){_notifyBatchEvents(X,e,d.h.NonRetryableStatus),_scheduleTimer()}function _otherEvent(e,n){_notifyBatchEvents(X,e,d.h.Unknown),_scheduleTimer()}function _setAutoLimits(){m=n&&n.disableAutoBatchFlushLimit?0:Math.max(1500,M/6)}_initDefaults(),e._getDbgPlgTargets=function(){return[h]},e.initialize=function(r,c,d){(0,i.Lm)(c,(function(){return"PostChannel:initialize"}),(function(){var i=c;t.initialize(r,c,d);try{c.addUnloadCb;T=(0,o.jU)((0,s.J)(e.identifier),c.evtNamespace&&c.evtNamespace());var f=e._getTelCtx();r.extensionConfig[e.identifier]=r.extensionConfig[e.identifier]||{},n=f.getExtCfg(e.identifier),S=createTimeoutWrapper(n.setTimeoutOverride,n.clearTimeoutOverride),Q=!n.disableOptimizeObj&&(0,u.mJ)(),function _hookWParam(e){var t=e.getWParam;e.getWParam=function(){var e=0;return n.ignoreMc1Ms0CookieProcessing&&(e|=2),e|t()}}(i),n.eventsLimitInMem>0&&(M=n.eventsLimitInMem),n.immediateEventLimit>0&&(B=n.immediateEventLimit),n.autoFlushEventsLimit>0&&(y=n.autoFlushEventsLimit),(0,l.hj)(n.maxEventRetryAttempts)&&(D=n.maxEventRetryAttempts),(0,l.hj)(n.maxUnloadEventRetryAttempts)&&(U=n.maxUnloadEventRetryAttempts),_setAutoLimits(),n.httpXHROverride&&n.httpXHROverride.sendPOST&&(a=n.httpXHROverride),(0,u.Sn)(r.anonCookieName)&&h.addQueryStringParameter("anoncknm",r.anonCookieName),h.sendHook=n.payloadPreprocessor,h.sendListener=n.payloadListener;var v=n.overrideEndpointUrl?n.overrideEndpointUrl:r.endpointUrl;e._notificationManager=r.extensionConfig.NotificationManager,h.initialize(v,e.core,e,a,n);var _=r.disablePageUnloadEvents||[];(0,o.c9)(_handleUnloadEvents,_,T),(0,o.TJ)(_handleUnloadEvents,_,T),(0,o.nD)(_handleShowEvents,r.disablePageShowEvents,T)}catch(n){throw e.setInitialized(!1),n}}),(function(){return{coreConfig:r,core:c,extensions:d}}))},e.processTelemetry=function(t,a){(0,u.if)(t,e.identifier);var r=(a=e._getTelCtx(a)).getExtCfg(e.identifier),i=!!n.disableTelemetry;r&&(i=i||!!r.disableTelemetry);var o=t;i||E||(n.overrideInstrumentationKey&&(o.iKey=n.overrideInstrumentationKey),r&&r.overrideInstrumentationKey&&(o.iKey=r.overrideInstrumentationKey),_addEventToQueues(o,!0),N?_releaseAllQueues(2,2):_scheduleTimer()),e.processNext(o,a)},e._doTeardown=function(e,n){_releaseAllQueues(2,2),E=!0,h.teardown(),(0,o.JA)(null,T),(0,o.C9)(null,T),(0,o.Yl)(null,T),_initDefaults()},e.setEventQueueLimits=function(e,n){M=e>0?e:1e4,y=n>0?n:0,_setAutoLimits();var t=x>e;if(!t&&m>0)for(var a=1;!t&&a<=3;a++){var r=q[a];r&&r.batches&&(0,l.tO)(r.batches,(function(e){e&&e.count()>=m&&(t=!0)}))}_performAutoFlush(!0,t)},e.pause=function(){_clearScheduledTimer(),C=!0,h.pause()},e.resume=function(){C=!1,h.resume(),_scheduleTimer()},e.addResponseHandler=function(e){h._responseHandlers.push(e)},e._loadTransmitProfiles=function(e){!function _resetTransmitProfiles(){_clearScheduledTimer(),_initializeProfiles(),A=v,_scheduleTimer()}(),(0,l.rW)(e,(function(e,n){var t=n.length;if(t>=2){var a=t>2?n[2]:0;if(n.splice(0,t-2),n[1]<0&&(n[0]=-1),n[1]>0&&n[0]>0){var r=n[0]/n[1];n[0]=Math.ceil(r)*n[1]}a>=0&&n[1]>=0&&a>n[1]&&(a=n[1]),n.push(a),w[e]=n}}))},e.flush=function(e,n,t){if(void 0===e&&(e=!0),!C)if(t=t||1,e)null==P?(_clearScheduledTimer(),_queueBatches(1,0,t),P=_createTimer((function(){P=null,_flushImpl(n,t)}),0)):b.push(n);else{var a=_clearScheduledTimer();_sendEventsForLatencyAndAbove(1,1,t),null!=n&&n(),a&&_scheduleTimer()}},e.setMsaAuthTicket=function(e){h.addHeader(k,e)},e.hasEvents=_hasEvents,e._setTransmitProfile=function(e){A!==e&&void 0!==w[e]&&(_clearScheduledTimer(),A=e,_scheduleTimer())},e._backOffTransmission=function(){L<4&&(L++,_clearScheduledTimer(),_scheduleTimer())},e._clearBackOff=function(){L&&(L=0,_clearScheduledTimer(),_scheduleTimer())},(0,l.l_)(e,"_setTimeoutOverride",(function(){return S.set}),(function(e){S=createTimeoutWrapper(e,S.clear)})),(0,l.l_)(e,"_clearTimeoutOverride",(function(){return S.clear}),(function(e){S=createTimeoutWrapper(S.set,e)}))})),t}return(0,a.ne)(PostChannel,e),PostChannel}(h.i)}};