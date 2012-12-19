/*
 * Copyright Amadeus
 */
/**
 * ClassLoader for text templates.
 */
Aria.classDefinition({
    $classpath : 'aria.core.TxtClassLoader',
    $extends : 'aria.core.ClassLoader',
    $constructor : function () {
        this.$ClassLoader.constructor.apply(this, arguments);
        this._refLogicalPath += ".tpl.txt";
        this._classGeneratorClassName = "TxtClassGenerator";
    },
    $statics : {
        // ERROR MESSAGES:
        TEMPLATE_EVAL_ERROR : "Error while evaluating the class generated from text template '%1'",
        TEMPLATE_DEBUG_EVAL_ERROR : "Error while evaluating the class generated from text template '%1'"
    },
    $prototype : {
        /**
         * Called when the .tpl.txt file is received.
         * @param {String} classDef Content of the .tpl.txt file
         * @param {String} logicalPath Logical path of the .tpl.txt file
         * @protected
         */
        _loadClass : function (classDef, logicalPath) {
            this._loadClassAndGenerate(classDef, logicalPath);
        }
    }
});
