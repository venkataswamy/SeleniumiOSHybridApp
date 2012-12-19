/*
 * Copyright Amadeus
 */
var vm=require("vm"),fs=require("fs"),path=require("path");aria={};Aria={rootFolderPath:__dirname+"/../"};global.load=function(a){a=path.normalize(a);a=fs.readFileSync(a,"utf-8");vm.runInThisContext(a)};
try{global.load(__dirname+"/bootstrap.js");Aria.classDefinition({$classpath:"aria.node.Transport",$implements:["aria.core.transport.ITransports"],$singleton:true,$prototype:{isReady:true,init:Aria.empty,request:function(a,b){fs.readFile(a.url,"utf-8",function(c,d){c?b.fn.call(b.scope,c,b.args):b.fn.call(b.scope,false,b.args,{status:200,responseText:d})})}}});aria.core.IO.updateTransports({sameDomain:"aria.node.Transport"})}catch(ex){console.error("\n[Error] Aria Templates framework not loaded.",ex);
process.exit(0)};