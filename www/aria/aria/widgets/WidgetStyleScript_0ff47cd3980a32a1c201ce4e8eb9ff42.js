/*
 * Copyright Amadeus
 */
Aria.tplScriptDefinition({$classpath:"aria.widgets.WidgetStyleScript",$prototype:{macro_writeStateOfFrame:function(a){var b=this["macro_writeStateOf"+a.skinClass.frame.frameType+"Frame"];b&&b.call(this,a)},cssPrefix:function(a){return"x"+this.skinnableClassName+"_"+a.skinClassName+"_"+a.stateName+"_"}}});