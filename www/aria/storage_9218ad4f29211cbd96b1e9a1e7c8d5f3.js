/*
 * Copyright Amadeus
 */
//***MULTI-PART
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/AbstractStorage.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.storage.AbstractStorage",$dependencies:["aria.storage.EventBus","aria.utils.json.JsonSerializer","aria.utils.Type"],$implements:["aria.storage.IStorage"],$statics:{INVALID_SERIALIZER:"Invalid serializer configuration. Make sure it implements aria.utils.json.ISerializer",INVALID_NAMESPACE:"Inavlid namespace configuration. Must be a string.",EVENT_KEYS:["name","key","oldValue","newValue","url"]},$constructor:function(a){this._disposeSerializer=false;this._eventCallback=
{fn:this._onStorageEvent,scope:this};aria.storage.EventBus.$on({change:this._eventCallback});var b=a?a.serializer:null,c=true;if(b)if("serialize"in b&&"parse"in b)c=false;else this.$logError(this.INVALID_SERIALIZER);if(c){b=new aria.utils.json.JsonSerializer(true);this._disposeSerializer=true}this.serializer=b;b="";if(a&&a.namespace)if(aria.utils.Type.isString(a.namespace))b=a.namespace+"$";else this.$logError(this.INVALID_NAMESPACE);this.namespace=b},$destructor:function(){aria.storage.EventBus.$removeListeners({change:this._eventCallback});
this._disposeSerializer&&this.serializer&&this.serializer.$dispose();this._eventCallback=this.serializer=null},$prototype:{getItem:function(a){return this.serializer.parse(this._get(this.namespace+a))},setItem:function(a,b){var c=this.getItem(a),d=this.serializer.serialize(b,{reversible:true,keepMetadata:false});aria.storage.EventBus.stop=true;this._set(this.namespace+a,d);aria.storage.EventBus.stop=false;b=this.serializer.parse(d);aria.storage.EventBus.notifyChange(this.type,a,b,c,this.namespace)},
removeItem:function(a){var b=this.getItem(a);if(b!==null){aria.storage.EventBus.stop=true;this._remove(this.namespace+a);aria.storage.EventBus.stop=false;aria.storage.EventBus.notifyChange(this.type,a,null,b,this.namespace)}},clear:function(){aria.storage.EventBus.stop=true;this._clear();aria.storage.EventBus.stop=false;aria.storage.EventBus.notifyChange(this.type,null,null,null)},_onStorageEvent:function(a){if(a.key===null||a.namespace===this.namespace)this.$raiseEvent(aria.utils.Json.copy(a,false,
this.EVENT_KEYS))}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/Beans.js
//MCylagYg2Y
Aria.beanDefinitions({$package:"aria.storage.Beans",$namespaces:{json:"aria.core.JsonTypes"},$description:"Structure of the objects used by the aria.storage package",$beans:{ConstructorArgs:{$type:"json:Object",$description:"Argument object for the constructor of storage classes.",$properties:{namespace:{$type:"json:String",$description:"Optional prefix used for any key in order to avoid collisions."},serializer:{$type:"json:ObjectRef",$description:"Seriliazer class used to convert values into strings."}}}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/EventBus.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.storage.EventBus",$singleton:true,$events:{change:"Raised when a change happens in any of the linked instances"},$prototype:{stop:false,notifyChange:function(a,b,c,d,e){this.$raiseEvent({name:"change",location:a,namespace:e,key:b,newValue:c,oldValue:d,url:Aria.$window.location})}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/HTML5Storage.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.storage.HTML5Storage",$dependencies:["aria.utils.Event"],$extends:"aria.storage.AbstractStorage",$statics:{UNAVAILABLE:"%1 not supported by the browser."},$constructor:function(a,b,c){this.$AbstractStorage.constructor.call(this,a);this.type=b;this.storage=Aria.$window[b];this._browserEventCb={fn:this._browserEvent,scope:this};if(this.storage)aria.utils.Event.addListener(Aria.$window,"storage",this._browserEventCb);else if(c!==false){this._disposeSerializer&&
this.serializer&&this.serializer.$dispose();this.$logError(this.UNAVAILABLE,[this.type]);throw Error(this.type);}},$destructor:function(){aria.utils.Event.removeListener(Aria.$window,"storage",this._browserEventCb);this.__target=this._browserEventCb=null;this.$AbstractStorage.$destructor.call(this)},$prototype:{_get:function(a){return this.storage.getItem(a)},_set:function(a,b){this.storage.setItem(a,b)},_remove:function(a){this.storage.removeItem(a)},_clear:function(){this.storage.clear()},_browserEvent:function(a){if(!aria.storage.EventBus.stop)if(this.namespace?
a.key.substring(0,this.namespace.length)===this.namespace:1){var b=a.oldValue,c=a.newValue;if(b)b=this.serializer.parse(b);if(c)c=this.serializer.parse(c);this._onStorageEvent({name:"change",key:a.key,oldValue:b,newValue:c,url:a.url,namespace:this.namespace})}},$on:function(a){aria.core.Browser.isIE8&&this.$logWarn(this.UNAVAILABLE,"change event");this.$AbstractStorage.$on.call(this,a)}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/IStorage.js
//MCylagYg2Y
Aria.interfaceDefinition({$classpath:"aria.storage.IStorage",$events:{change:{description:"Raised when the storage area changes because an item is set or removed, or the storage is cleared.",properties:{key:"Name of the key that changed",oldValue:"Old value of the key in question, null if the key is newly added",newValue:"New value being set",url:"Address of the document whose storage object was affected"}}},$interface:{getItem:function(){},setItem:function(){},removeItem:function(){},clear:function(){}}});
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/LocalStorage.js
//MCylagYg2Y
(function(){Aria.classDefinition({$classpath:"aria.storage.LocalStorage",$extends:"aria.storage.HTML5Storage",$dependencies:["aria.core.Browser","aria.storage.UserData"],$constructor:function(a){var b=aria.core.Browser.isIE7;this.$HTML5Storage.constructor.call(this,a,"localStorage",!b);if(!this.storage&&b){a=new aria.storage.UserData(a);this._get=a._get;this._set=a._set;this._remove=a._remove;this._clear=a._clear;this.storage=aria.storage.UserData._STORAGE;this.__keys=aria.storage.UserData._ALL_KEYS;
this._fallback=a}},$destructor:function(){if(this._fallback){this._fallback.$dispose();this._fallback=null}this.$HTML5Storage.$destructor.call(this)}})})();
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/SessionStorage.js
//MCylagYg2Y
Aria.classDefinition({$classpath:"aria.storage.SessionStorage",$extends:"aria.storage.HTML5Storage",$constructor:function(a){this.$HTML5Storage.constructor.call(this,a,"sessionStorage")}});
//MCylagYg2Y
//LOGICAL-PATH:aria/storage/UserData.js
//MCylagYg2Y
(function(){function g(){d||(d=new aria.utils.json.JsonSerializer(true));var a=b.getAttribute("kMap");return a?d.parse(a):{}}function i(a,c){if(a)e[c]=a;else delete e[c];b.setAttribute("kMap",d.serialize(e));b.save("JSONPersist")}function h(a,c){e=g();if(c&&!(a in e)){var f="uD"+j++;i(f,a);return f}else return e[a]}var b,d,e={},j=4;Aria.classDefinition({$classpath:"aria.storage.UserData",$dependencies:["aria.utils.Object","aria.utils.Dom","aria.utils.json.JsonSerializer","aria.core.Browser"],$implements:["aria.storage.IStorage"],
$extends:"aria.storage.AbstractStorage",$onload:function(){if(aria.core.Browser.isIE)try{var a=Aria.$frameworkWindow.document.createElement("form");a.innerHTML="<input type='hidden' id='__aria_storage_UserData__' style='behavior:url(#default#userData)'>";Aria.$frameworkWindow.document.body.appendChild(a);b=a.firstChild;b.load("JSONPersist");g()}catch(c){}},$onunload:function(){if(aria.core.Browser.isIE){b&&b.parentNode.removeChild(b);b=null}d&&d.$dispose();d=null},$prototype:{_get:function(a){return(a=
h(a))?b.getAttribute(a):null},_set:function(a,c){var f=h(a,true);b.setAttribute(f,c);b.save("JSONPersist")},_remove:function(a){b.removeAttribute(h(a));i(null,a);b.save("JSONPersist")},_clear:function(){var a=g();e={};b.removeAttribute("kMap");for(var c in a)a.hasOwnProperty(c)&&b.removeAttribute(a[c]);b.save("JSONPersist")}}})})();