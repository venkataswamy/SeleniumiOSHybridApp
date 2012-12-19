/*
 * Copyright Amadeus
 */
//***MULTI-PART
//MCylagYg2Y
//LOGICAL-PATH:aria/pageEngine/dwm/CfgBeans.js
//MCylagYg2Y
Aria.beanDefinitions({$package:"aria.pageEngine.dwm.CfgBeans",$description:"Definition of the beans used by DWMPlug.",$namespaces:{json:"aria.core.JsonTypes",core:"aria.core.CfgBeans"},$beans:{Init:{$type:"json:Object",$description:"Configuration to provide to the DWMPlug constructor.",$properties:{baseUrl:{$type:"json:String",$description:"Base url of the DWM services.",$mandatory:true},queryParameters:{$type:"json:Object",$restricted:false,$description:"Query parameters to add to requests.",$properties:{SITE:{$type:"json:String",
$description:"Site code to target.",$mandatory:true,$sample:"_DWM_DWM"},LANGUAGE:{$type:"json:String",$description:"Language.",$mandatory:true,$sample:"GB"}}},siteConfigPath:{$type:"json:String",$description:"Path of the site configuration file.",$mandatory:true},timeout:{$type:"json:Integer",$description:"Timeout in milliseconds that is used for requests.",$default:1E4}}}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/pageEngine/dwm/DWMPagePreprocessor.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.pageEngine.dwm.DWMPagePreprocessor",$singleton:true,$prototype:{convertPageDefinition:function(a){return{pageComposition:a.pageComposition,contents:{menus:this._getMenus(a.MSResponse.MENU),placeholderContents:this._getPlaceholderContents(a.MSResponse.PLACEHOLDER)}}},_getPlaceholderContents:function(a){for(var c={},b,d,e=0,g=a.length;e<g;e++){b=[];d=a[e].contents;for(var f=0,h=d.length;f<h;f++)b.push(d[f].value);c[a[e].name]={value:b.join("")}}return c},_getMenus:function(a){for(var c=
{},b=0,d=a.length;b<d;b++)c[a[b].referenceName]=a[b].children;return c}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/pageEngine/dwm/DWMPlugin.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.pageEngine.dwm.DWMPlugin",$implements:["aria.pageEngine.pageProviders.PageProviderInterface"],$dependencies:["aria.pageEngine.dwm.CfgBeans","aria.pageEngine.dwm.DWMPagePreprocessor"],$constructor:function(a){try{aria.core.JsonValidator.normalize({json:a,beanName:"aria.pageEngine.dwm.CfgBeans.Init"},true)}catch(b){this.logMultipleErrors(this.INVALID_INIT_CONFIG,b.errors);return}this._config=a;this._config.baseUrl=this._config.baseUrl.replace(/\/$/,"")+"/";this._queryString=
this.buildQueryString(a.queryParameters);this._pagePreprocessor=aria.pageEngine.dwm.DWMPagePreprocessor},$destructor:function(){},$statics:{INVALID_INIT_CONFIG:"Invalid initialization configuration"},$prototype:{loadSiteConfig:function(a){this._sendRequest([this._config.baseUrl,"DWMSample/ATConfig.action",this._queryString,'&data={"path":"',this._config.siteConfigPath,'"}"'].join(""),a)},loadPageDefinition:function(a,b){this._sendRequest([this._config.baseUrl,"DWMSample/ATDispatcher.action",this._queryString,
'&data={"pageCode":"',a,'"}"'].join(""),{onfailure:b.onfailure,onsuccess:{fn:this._afterPageDefinitionLoad,scope:this,args:b.onsuccess}})},_onSuccess:function(a,b){this.$callback(b.onsuccess,a.responseJSON)},_onFailure:function(a,b){this.$callback(b.onfailure,a)},_sendRequest:function(a,b){aria.core.IO.jsonp({url:a,jsonp:"JSONP_CALLBACK",callback:{fn:this._onSuccess,scope:this,args:b,onerror:this._onFailure},timeout:this._config.timeout})},_afterPageDefinitionLoad:function(a,b){var c=this._pagePreprocessor.convertPageDefinition(a);
this.$callback(b,c)},buildQueryString:function(a){var b=[],c;for(c in a)a.hasOwnProperty(c)&&b.push(c+"="+a[c]);return"?"+b.join("&")},logMultipleErrors:function(a,b){this.$logError(a+":");for(var c=0,d=b.length;c<d;c++)this.$logError(c+1+" - "+b[c].msgId,b[c].msgArgs)}}});