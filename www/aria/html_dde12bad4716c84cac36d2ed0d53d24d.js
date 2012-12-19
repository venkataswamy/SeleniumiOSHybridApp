/*
 * Copyright Amadeus
 */
//***MULTI-PART
//MCylagYg2Y
//LOGICAL-PATH:aria/html/beans/AutoCompleteCfg.js
//MCylagYg2Y
Aria.beanDefinitions({$package:"aria.html.beans.AutoCompleteCfg",$description:"Configuration for AutoComplete widget.",$namespaces:{json:"aria.core.JsonTypes",input:"aria.html.beans.TextInputCfg"},$beans:{Properties:{$type:"input:Properties",$description:"Properties of an AutoComplete widget.",$properties:{bind:{$type:"input:Properties.bind",$properties:{suggestions:{$type:"json:Array",$description:"List of suggestions taken from the Resources Handler",$contentType:{$type:"json:Object",$description:"Suggestion"},
$default:[]}}}}}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/html/beans/ElementCfg.js
//MCylagYg2Y
Aria.beanDefinitions({$package:"aria.html.beans.ElementCfg",$description:"Base configuration for Element widget.",$namespaces:{json:"aria.core.JsonTypes",html:"aria.templates.CfgBeans"},$beans:{Properties:{$type:"json:Object",$description:"All properties that can be used in Element widget.",$properties:{tagName:{$type:"json:String",$description:"Qualified name of the Element node",$sample:"div",$mandatory:true},attributes:{$type:"html:HtmlAttribute",$default:{}},bind:{$type:"json:Object",$description:"List of properties that can be bound to this widget. Values should match bean aria.widgetLibs.CommonBeans.BindRef",
$default:{},$restricted:false},on:{$type:"json:Object",$description:"List of registered events and their callbacks. Values should match bean aria.widgetLibs.CommonBeans.Callback",$default:{},$restricted:false}},$restricted:false}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/html/beans/TemplateCfg.js
//MCylagYg2Y
Aria.beanDefinitions({$package:"aria.html.beans.TemplateCfg",$description:"Definition of the JSON beans used by the aria html lib",$namespaces:{json:"aria.core.JsonTypes",html:"aria.templates.CfgBeans"},$beans:{Properties:{$type:"json:Object",$description:"The configuration for HTML Template include simple widget",$properties:{attributes:{$type:"html:HtmlAttribute",$description:"Parameters to apply to the DOM element of the section."},id:{$type:"json:String",$description:"unique id (within the template) to associate to the widget - if not provided, a unique id will automatically be generated by the framework",
$mandatory:false},classpath:{$type:"json:PackageName",$description:"Classpath of the template to be displayed when no customization has been done.",$mandatory:true},type:{$type:"json:String",$description:"DOM type for this section.",$default:"div"},data:{$type:"json:ObjectRef",$description:"JSON object to be made accessible in the sub-template as this.data. By default, use the parent template data, unless moduleCtrl is specified, in which case the data model of that module controller is used.",$mandatory:false},
moduleCtrl:{$type:"html:ModuleCtrl",$description:"Module controller to be used with the sub-template. By default, use the parent template module controller, unless data is specified and is the data model of one of the sub-modules of the parent template module controller, in which case that sub-module is used.",$mandatory:false},args:{$type:"json:Array",$description:"Parameters to pass to the main macro in the sub-template.",$contentType:{$type:"json:MultiTypes",$description:"Any parameter to be passed to the main macro in the sub-template."},
$default:[]},baseTabIndex:{$type:"json:Integer",$description:"The base tab index that will be added to all tab indexes in the template",$default:0}}}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/html/beans/TextInputCfg.js
//MCylagYg2Y
Aria.beanDefinitions({$package:"aria.html.beans.TextInputCfg",$description:"Configuration for Text Input widget.",$namespaces:{base:"aria.html.beans.ElementCfg",common:"aria.widgetLibs.CommonBeans"},$beans:{Properties:{$type:"base:Properties",$description:"Properties of a Text Input widget.",$properties:{bind:{$type:"base:Properties.$properties.bind",$properties:{value:{$type:"common:BindingRef",$description:"Bi-directional binding. The text input's value is set in the bound object on blur."}}},on:{$type:"base:Properties.$properties.on",
$properties:{type:{$type:"common:Callback",$description:"Callback called when the user types inside the input. It corresponds to a keydown."}}}}}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/html/controllers/Suggestions.js
//MCylagYg2Y
(function(){function d(){this.getSuggestions=function(a,b){this.pendingSuggestion={entry:a,callback:b}};this.getAllSuggestions=function(a){this.pendingSuggestion={callback:a}};this.$dispose=Aria.empty}function e(a){var b=a.scope;b._autoDisposeHandler=false;b.$logError(b.INVALID_RESOURCES_HANDLER,a.classpath)}function f(a){var b=a.scope;a=Aria.getClassInstance(a.classpath);var c=b._resourcesHandler.pendingSuggestion;b._resourcesHandler=a;b._autoDisposeHandler=true;if(c)c.entry?a.getSuggestions(c.entry,
c.callback):a.getAllSuggestions(c.callback)}function g(a){aria.core.Timer.addCallback({fn:f,args:a,scope:{},delay:12})}Aria.classDefinition({$classpath:"aria.html.controllers.Suggestions",$dependencies:["aria.utils.Json","aria.utils.Type"],$constructor:function(){this._init()},$destructor:function(){this.dispose()},$statics:{INVALID_RESOURCES_HANDLER:"Invalid resources handler '%1'"},$prototype:{_init:function(){this.data={suggestions:[],value:null};this._resourcesHandler=null;this._autoDisposeHandler=
false},dispose:function(){this._autoDisposeHandler&&this._resourcesHandler&&this._resourcesHandler.$dispose()},setResourcesHandler:function(a){if(aria.utils.Type.isString(a)){var b=Aria.getClassRef(a);if(b)a=new b;else{b={scope:this,classpath:a};Aria.load({classes:[a],oncomplete:{fn:g,args:b},onerror:{fn:e,args:b}});a=new d}this._autoDisposeHandler=true}this._resourcesHandler=a},suggestValue:function(a){this._resourcesHandler.getSuggestions(a,{fn:this._callback,scope:this})},_callback:function(a){aria.utils.Json.setValue(this.data,
"suggestions",a||[])},setSelected:function(a){aria.utils.Json.setValue(this.data,"value",a);this.empty()},empty:function(){aria.utils.Json.setValue(this.data,"suggestions",[])}}})})();
//MCylagYg2Y
//LOGICAL-PATH:aria/html/Element.js
//MCylagYg2Y
(function(){Aria.classDefinition({$classpath:"aria.html.Element",$extends:"aria.widgetLibs.BindableWidget",$dependencies:["aria.html.beans.ElementCfg","aria.core.JsonValidator","aria.utils.Html","aria.utils.Json","aria.utils.Delegate","aria.templates.DomEventWrapper","aria.utils.Dom"],$statics:{INVALID_BEAN:"Invalid propety '%1' in widget's '%2' configuration."},$constructor:function(a){this.$cfgBean=this.$cfgBean||"aria.html.beans.ElementCfg.Properties";var b=aria.core.JsonValidator.normalize({json:a,
beanName:this.$cfgBean});this.$BindableWidget.constructor.apply(this,arguments);if(b){this._id=this._createDynamicId();this.__delegateId=this._domElt=null;this._registerBindings();this._normalizeCallbacks()}else this.initWidget=this.writeMarkupEnd=this.writeMarkupBegin=this.writeMarkup=Aria.empty},$destructor:function(){if(this.__delegateId){aria.utils.Delegate.remove(this.__delegateId);this.__delegateId=null}this.$BindableWidget.$destructor.call(this);this._domElt=null},$prototype:{_normalizeCallbacks:function(){var a=
this._cfg.on,b=false,c;for(c in a)if(a.hasOwnProperty(c)){b=true;a[c]=this.$normCallback.call(this._context,a[c])}if(b)this.__delegateId=aria.utils.Delegate.add({fn:this._delegate,scope:this})},_delegate:function(a){var b=this._cfg.on[a.type];if(b){a=new aria.templates.DomEventWrapper(a);b=b.fn.call(b.scope,a,b.args);a.$dispose();return b}},writeMarkup:function(a){this._openTag(a);a.write("/>")},writeMarkupBegin:function(a){this._openTag(a);a.write(">")},writeMarkupEnd:function(a){a.write("</"+this._cfg.tagName+
">")},onbind:Aria.empty,initWidget:function(){this._domElt=aria.utils.Dom.getElementById(this._id)},_openTag:function(a){var b=this._cfg,c=aria.utils.Html.buildAttributeList(b.attributes);b=["<",b.tagName," id='",this._id,"' "];c&&b.push(c," ");this.__delegateId&&b.push(aria.utils.Delegate.getMarkup(this.__delegateId)," ");a.write(b.join(""))},_notifyDataChange:function(a,b){this.onbind(b,this._transform(this._cfg.bind[b].transform,a.newValue,"toWidget"),a.oldValue)}}})})();
//MCylagYg2Y
//LOGICAL-PATH:aria/html/HtmlLibrary.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.html.HtmlLibrary",$extends:"aria.widgetLibs.WidgetLib",$singleton:true,$prototype:{widgets:{TextInput:"aria.html.TextInput",Template:"aria.html.Template"}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/html/Template.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.html.Template",$extends:"aria.widgetLibs.BaseWidget",$dependencies:["aria.html.beans.TemplateCfg","aria.templates.TemplateTrait","aria.utils.Html","aria.templates.TemplateCtxt","aria.utils.Dom","aria.templates.ModuleCtrlFactory","aria.core.environment.Customizations"],$events:{ElementReady:{description:"Raised when the template content is fully displayed."}},$statics:{INVALID_CONFIGURATION:"%1Configuration for widget is not valid.",ERROR_SUBTEMPLATE:"#ERROR IN SUBTEMPLATE#"},
$constructor:function(a){this.$BaseWidget.constructor.apply(this,arguments);this._domId=a.id?this._context.$getId(a.id):this._createDynamicId();this.subTplCtxt=this._subTplDiv=null;this._needCreatingModuleCtrl=a.moduleCtrl&&a.moduleCtrl.getData==null;this._tplcfg={classpath:aria.core.environment.Customizations.getTemplateCP(a.classpath),args:a.args,id:this._domId,moduleCtrl:a.moduleCtrl};this._checkCfgConsistency(a);this.subTplCtxt=new aria.templates.TemplateCtxt;this.isDiffered=this._initCtxDone=
false},$destructor:function(){this._subTplDiv=null;if(this.subTplCtxt){this.subTplCtxt.$dispose();this.subTplCtxt=null}this.$BaseWidget.$destructor.apply(this,arguments)},$prototype:{$init:function(a){var c=aria.templates.TemplateTrait.prototype,b;for(b in c)if(c.hasOwnProperty(b)&&!a.hasOwnProperty(b))a[b]=c[b]},_checkCfgConsistency:function(a){try{this._cfgOk=aria.core.JsonValidator.normalize({json:a,beanName:"aria.html.beans.TemplateCfg.Properties"},true);if(this._needCreatingModuleCtrl)this._cfgOk=
this._cfgOk&&aria.core.JsonValidator.normalize({json:a.moduleCtrl,beanName:"aria.templates.CfgBeans.InitModuleCtrl"})}catch(c){if(a=aria.core.Log){for(var b,d=0,e=c.errors.length;d<e;d++){b=c.errors[d];b.message=a.prepareLoggedMessage(b.msgId,b.msgArgs)}this.$logError(this.INVALID_CONFIGURATION,null,c)}}},_onTplLoad:function(a,c){var b=this._tplcfg;if(b){var d=this._subTplDiv;b.tplDiv=d;b.data=this._cfg.data;if(a.moduleCtrl)b.moduleCtrl=a.moduleCtrl;else b.context=this._context;if(c.autoDispose)if(b.toDispose==
null)b.toDispose=[a.moduleCtrlPrivate];else b.toDispose.push(a.moduleCtrlPrivate);var e=this.subTplCtxt;e.parent=this._context;a=e.initTemplate(b);this._initCtxDone=true;if(a){e.dataReady();if(d&&e._cfg){d.className=d.className+" "+e.getCSSClassNames(true);e.$onOnce({Ready:this.__innerTplReadyCb,scope:this});e.$refresh()}this.tplcfg=null}else{e.$dispose();this.subTplCtxt=null}}else c.autoDispose&&a.moduleCtrlPrivate.$dispose()},initWidget:function(){aria.html.Template.superclass.initWidget.call(this);
var a=aria.utils.Dom.getElementById(this._domId);this._subTplDiv=a;if(this._initCtxDone){var c=this.subTplCtxt;a.className=a.className+" "+c.getCSSClassNames(true);c.linkToPreviousMarkup(a);c.viewReady()}},writeMarkup:function(a){if(this._cfgOk){Aria.load({templates:[this._tplcfg.classpath],classes:this._needCreatingModuleCtrl?[this._cfg.moduleCtrl.classpath]:null,oncomplete:{scope:this,fn:this._onModuleCtrlLoad}});if(this._tplcfg){var c=this._cfg.type,b=["<",c,' id="',this._domId,'"'];this._cfg.attributes&&
b.push(" "+aria.utils.Html.buildAttributeList(this._cfg.attributes));b.push(">");if(this._initCtxDone){var d=this.subTplCtxt.getMarkup();d!=null?b.push(d):b.push(this.ERROR_SUBTEMPLATE)}else this.isDiffered=true;b.push("</"+c+">");a.write(b.join(""))}else a.write("<div>"+this.ERROR_SUBTEMPLATE+"</div>")}},getId:function(){return this._cfg.id}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/html/TextInput.js
//MCylagYg2Y
(function(){function e(a){this._typeCallback=null;a.fn.call(a.scope,this._domElt.value,a.args)}function f(a,b){this._typeCallback=aria.core.Timer.addCallback({fn:e,scope:this,delay:12,args:b.type});if(b.keydown){var c=b.keydown;c.fn.call(c.scope,a,c.args)}}function g(a,b){var c=this._bindingListeners.value,d=this._transform(c.transform,a.target.getValue(),"fromWidget");aria.utils.Json.setValue(c.inside,c.to,d,c.cb);b&&b.fn.call(b.scope,a,b.args)}Aria.classDefinition({$classpath:"aria.html.TextInput",
$extends:"aria.html.Element",$dependencies:["aria.html.beans.TextInputCfg"],$statics:{INVALID_USAGE:"Widget %1 can only be used as a %2."},$constructor:function(a,b,c){this.$cfgBean="aria.html.beans.TextInputCfg.Properties";a.tagName="input";a.attributes=a.attributes||{};a.attributes.type="text";a.on=a.on||{};this._reactOnType=this._registerType(a.on,b);this._registerBlur(a.on,b);this.$Element.constructor.call(this,a,b,c)},$destructor:function(){this._typeCallback&&aria.core.Timer.cancelCallback(this._typeCallback);
this.$Element.$destructor.call(this)},$prototype:{writeMarkupBegin:function(){this.$logError(this.INVALID_USAGE,[this.$class,"container"])},writeMarkupEnd:Aria.empty,initWidget:function(){this.$Element.initWidget.call(this);var a=this._cfg.bind;if(a.value){a=this._transform(a.value.transform,a.value.inside[a.value.to],"toWidget");if(a!=null)this._domElt.value=a}},onbind:function(a,b){if(a==="value")this._domElt.value=b},_registerType:function(a,b){if(a.type){if(a.keydown)var c=this.$normCallback.call(b._tpl,
a.keydown);var d=this.$normCallback.call(b._tpl,a.type);a.keydown={fn:f,scope:this,args:{type:d,keydown:c}};delete a.type;return true}return false},_registerBlur:function(a,b){var c;if(a.blur)c=this.$normCallback.call(b._tpl,a.blur);a.blur={fn:g,scope:this,args:c}}}})})();