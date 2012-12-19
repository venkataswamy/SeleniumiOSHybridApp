/*
 * Copyright Amadeus
 */
//***MULTI-PART
//MCylagYg2Y
//LOGICAL-PATH:aria/embed/CfgBeans.js
//MCylagYg2Y
Aria.beanDefinitions({$package:"aria.embed.CfgBeans",$description:"Definition of the JSON beans used by the aria embed lib",$namespaces:{json:"aria.core.JsonTypes",html:"aria.templates.CfgBeans"},$beans:{ElementCfg:{$type:"json:Object",$description:"Embed element widget",$properties:{controller:{$type:"json:ObjectRef",$description:"Controller used to manage the embedded dom"},type:{$type:"json:String",$description:"DOM type for this section.",$default:"div"},attributes:{$type:"html:HtmlAttribute",
$description:"Parameters to apply to the DOM element of the section."},args:{$type:"json:MultiTypes",$description:"Argument given to the onEmbededElementCreate and onEmbededElementDispose functions of the provided embed controller"}}},PlaceholderCfg:{$type:"json:Object",$description:"Placeholder",$properties:{name:{$type:"json:String",$description:"Placeholder name",$mandatory:true},type:{$type:"json:String",$description:"DOM type for this section.",$default:"div"},attributes:{$type:"html:HtmlAttribute",
$description:"Parameters to apply to the DOM element of the section."}}},MapCfg:{$type:"json:Object",$description:"Map widget configuration",$properties:{id:{$type:"json:String",$description:"Id of the map",$mandatory:true},provider:{$type:"json:String",$description:"Map provider",$mandatory:true},initArgs:{$type:"json:MultiTypes",$description:"Map initialization arguments"},loadingIndicator:{$type:"json:Boolean",$description:"Add a loading overlay over the map while loading",$default:false},type:{$type:"json:String",
$description:"DOM type for this section.",$default:"div"},attributes:{$type:"html:HtmlAttribute",$description:"Parameters to apply to the DOM element of the section."}}}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/embed/Element.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.embed.Element",$extends:"aria.widgetLibs.BaseWidget",$dependencies:["aria.embed.CfgBeans","aria.utils.Html","aria.core.JsonValidator","aria.core.Log","aria.utils.Dom"],$statics:{INVALID_CONFIGURATION:"%1Configuration for widget is not valid."},$constructor:function(d){this.$BaseWidget.constructor.apply(this,arguments);try{this._cfgOk=aria.core.JsonValidator.normalize({json:d,beanName:this._cfgBeanName},true)}catch(a){var b=aria.core.Log;if(b){for(var c,e=0,f=
a.errors.length;e<f;e++){c=a.errors[e];c.message=b.prepareLoggedMessage(c.msgId,c.msgArgs)}this.$logError(this.INVALID_CONFIGURATION,null,a)}}},$destructor:function(){if(this._domId)this._cfg.controller.onEmbededElementDispose(aria.utils.Dom.getElementById(this._domId),this._cfg.args);this.$BaseWidget.$destructor.apply(this,arguments)},$prototype:{_cfgBeanName:"aria.embed.CfgBeans.ElementCfg",writeMarkup:function(d){if(this._cfgOk){this._domId=this._createDynamicId();var a=this._cfg.type,b=["<",a,
' id="',this._domId,'"'];this._cfg.attributes&&b.push(" "+aria.utils.Html.buildAttributeList(this._cfg.attributes));b.push("></"+a+">");d.write(b.join(""))}},initWidget:function(){if(this._cfgOk)this._cfg.controller.onEmbededElementCreate(aria.utils.Dom.getElementById(this._domId),this._cfg.args)}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/embed/EmbedLib.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.embed.EmbedLib",$extends:"aria.widgetLibs.WidgetLib",$singleton:true,$prototype:{widgets:{Element:"aria.embed.Element",Map:"aria.embed.Map",Placeholder:"aria.embed.Placeholder"}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/embed/IContentProvider.js
//MCylagYg2Y
Aria.interfaceDefinition({$classpath:"aria.embed.IContentProvider",$events:{contentChange:{description:"Raised when the content associated to one or more placeholder paths changes.",properties:{contentPaths:"{Array} contains the paths whose corresponding content has changed."}}},$interface:{getContent:function(){}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/embed/IEmbedController.js
//MCylagYg2Y
Aria.interfaceDefinition({$classpath:"aria.embed.IEmbedController",$extends:"aria.templates.IModuleCtrl",$interface:{onEmbededElementCreate:function(){},onEmbededElementDispose:function(){}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/embed/Placeholder.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.embed.Placeholder",$extends:"aria.widgetLibs.BaseWidget",$dependencies:["aria.embed.CfgBeans","aria.core.JsonValidator","aria.html.Template","aria.embed.PlaceholderManager","aria.utils.Array"],$statics:{INVALID_CONFIGURATION:"%1 Configuration for widget is not valid."},$constructor:function(a,b){this.$BaseWidget.constructor.apply(this,arguments);this._validateCfg(a);this._placeholderPath=this._getPlaceholderPath(b);this._sectionId="p_"+this._createDynamicId();
this._onContentChangeListener={fn:this._onContentChange,scope:this};this._placeholderManager=aria.embed.PlaceholderManager;this._placeholderManager.$addListeners({contentChange:this._onContentChangeListener})},$destructor:function(){this._placeholderManager.$removeListeners({contentChange:this._onContentChangeListener});this._onContentChangeListener=null;this.$BaseWidget.$destructor.apply(this,arguments)},$prototype:{_cfgBeanName:"aria.embed.CfgBeans.PlaceholderCfg",writeMarkup:function(a){if(this._cfgOk){var b=
this._cfg;a.beginSection({id:this._sectionId,type:b.type,attributes:b.attributes});this._writePlaceholderContent(a);a.endSection()}},_writePlaceholderContent:function(a){for(var b=aria.utils.Type,c=this._placeholderPath,e=aria.embed.PlaceholderManager.getContent(c),f=0,g=e.length;f<g;f++){var d=e[f];if(b.isString(d))a.write(d);else{d=new aria.html.Template(d,this._context,this._lineNumber);d.subTplCtxt.placeholderPath=c;a.registerBehavior(d);d.writeMarkup(a)}}},_onContentChange:function(a){aria.utils.Array.contains(a.placeholderPaths,
this._placeholderPath)&&this._context.insertSection(this._context.getRefreshedSection({outputSection:this._sectionId,writerCallback:{fn:this._writePlaceholderContent,scope:this}}))},_validateCfg:function(a){try{this._cfgOk=aria.core.JsonValidator.normalize({json:a,beanName:this._cfgBeanName},true)}catch(b){if(a=aria.core.Log){for(var c,e=0,f=b.errors.length;e<f;e++){c=b.errors[e];c.message=a.prepareLoggedMessage(c.msgId,c.msgArgs)}this.$logError(this.INVALID_CONFIGURATION,null,b)}}},_getPlaceholderPath:function(){for(var a=
"",b=this._context;b;){if(b.placeholderPath){a=b.placeholderPath+".";break}b=b.parent}return a+this._cfg.name}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/embed/PlaceholderManager.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.embed.PlaceholderManager",$dependencies:["aria.utils.Type","aria.utils.Array"],$singleton:true,$constructor:function(){this._contentChangeListener={fn:this._onContentChange,scope:this};this._providers=[]},$destructor:function(){this.unregisterAll();this._contentChangeListener=null},$events:{contentChange:{description:"Raised when a content provider notifies a change of content.",properties:{placeholderPaths:"{Array} contains the placeholderPaths whose corresponding content has changed."}}},
$statics:{PLACEHOLDER_PATH_NOT_FOUND:"No content has been found for the placeholder path '%1'"},$prototype:{getContent:function(a){for(var b=[],g=aria.utils.Type,f=this._providers,d=0,h=f.length;d<h;d++){var c=f[d].getContent(a);if(c)if(g.isArray(c))for(var e=0,i=c.length;e<i;e++)b.push(c[e]);else b.push(c)}b.length===0&&this.$logWarn(this.PLACEHOLDER_PATH_NOT_FOUND,[a]);return b},register:function(a){var b=this._providers;if(!aria.utils.Array.contains(b,a)){a.$addListeners({contentChange:this._contentChangeListener});
b.push(a)}},unregister:function(a){aria.utils.Array.remove(this._providers,a)&&a.$removeListeners({contentChange:this._contentChangeListener})},unregisterAll:function(){for(var a=this._providers;a.length>0;)this.unregister(a[0])},_onContentChange:function(a){this.$raiseEvent({name:"contentChange",placeholderPaths:a.contentPaths})}}});