/*
 * Copyright Amadeus
 */
Aria.classDefinition({$classpath:"aria.ext.BundleAnalyzer",$singleton:true,$constructor:function(){this._evalContext="var Aria={},p;Aria.resourcesDefinition=function(c){p={type:'res',path:c.$classpath}};";for(var a in Aria)if(Aria.hasOwnProperty(a)&&Aria[a]&&Aria[a].call)if(a!=="resourcesDefinition")this._evalContext+="Aria."+a+"=function(){};"},$prototype:{getReport:function(){var a=aria.core.Cache.content,c=[],b;for(b in a.urls)a.urls.hasOwnProperty(b)&&c.push(b);var f={},d=[],g=[];for(b in a.classes)if(a.classes.hasOwnProperty(b))f[aria.core.Cache.getFilename(b)]=
true;for(b in a.files)if(a.files.hasOwnProperty(b))if(a.files[b].status!==aria.core.Cache.STATUS_AVAILABLE)g.push(b);else{var e=this._getClassDescription(a.files[b].value);if(e)e.type==="res"&&!a.classes[e.path]&&d.push(b);else f[b]||d.push(b)}return{downloaded:c,useless:d,error:g}},_getClassDescription:function(a){try{return eval("(function(){"+this._evalContext+a+";return p})()")}catch(c){}}}});