/*
 * Copyright Amadeus
 */
/**
 * ClassLoader for css macro lib files.
 */
Aria.classDefinition({
    $classpath : 'aria.core.CmlClassLoader',
    $extends : 'aria.core.ClassLoader',
    $constructor : function () {
        this.$ClassLoader.constructor.apply(this, arguments);
        this._refLogicalPath += ".cml";
        this._classGeneratorClassName = 'CmlClassGenerator';
    },
    $statics : {
        // ERROR MESSAGES:
        TEMPLATE_EVAL_ERROR : "Error while evaluating the class generated from CSS macro library '%1'",
        TEMPLATE_DEBUG_EVAL_ERROR : "Error while evaluating the class generated from CSS macro library '%1'"
    },
    $prototype : {
        /**
         * Called when the .cml file is received.
         * @param {String} classDef Content of the .cml file
         * @param {String} logicalPath Logical path of the .cml file
         * @protected
         */
        _loadClass : function (classDef, logicalPath) {
            this._loadClassAndGenerate(classDef, logicalPath);
        }
    }
});
