/*
 * Copyright Amadeus
 */
/**
 * ClassLoader for CSS files.
 */
Aria.classDefinition({
    $classpath : "aria.core.CSSClassLoader",
    $extends : "aria.core.ClassLoader",
    $constructor : function () {
        this.$ClassLoader.constructor.apply(this, arguments);
        this._refLogicalPath += ".tpl.css";
        this._classGeneratorClassName = "CSSClassGenerator";
    },
    $statics : {
        // ERROR MESSAGES:
        TEMPLATE_EVAL_ERROR : "Error while evaluating the class generated from CSS template '%1'",
        TEMPLATE_DEBUG_EVAL_ERROR : "Error while evaluating the class generated from CSS template '%1'"
    },
    $prototype : {
        /**
         * Called when the .css file is received.
         * @param {String} classDef Content of the .tpl.css file
         * @param {String} logicalPath Logical path of the .tpl.css file
         * @protected
         */
        _loadClass : function (classDef, logicalPath) {
            this._loadClassAndGenerate(classDef, logicalPath, "aria.templates.CSSMgr");
        }
    }
});
