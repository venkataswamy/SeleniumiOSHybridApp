/*
 * Copyright Amadeus
 */
Aria.tplScriptDefinition({
    $classpath : 'aria.widgets.WidgetStyleScript',
    $prototype : {
        macro_writeStateOfFrame : function (info) {
            var macro = this["macro_writeStateOf" + info.skinClass.frame.frameType + "Frame"];
            if (macro) {
                macro.call(this, info);
            }
        },

        cssPrefix : function (info) {
            return "x" + this.skinnableClassName + "_" + info.skinClassName + "_" + info.stateName + "_";
        }
    }
});