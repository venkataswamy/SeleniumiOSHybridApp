/*
 * Copyright Amadeus
 */
/**
 * ClassLoader for template macro lib files.
 */
Aria.classDefinition({
    $classpath : 'aria.core.TmlClassLoader',
    $extends : 'aria.core.ClassLoader',
    $constructor : function () {
        this.$ClassLoader.constructor.apply(this, arguments);
        this._refLogicalPath += ".tml";
        this._classGeneratorClassName = 'TmlClassGenerator';
    },
    $statics : {
        // ERROR MESSAGES:
        TEMPLATE_EVAL_ERROR : "Error while evaluating the class generated from template macro library '%1'",
        TEMPLATE_DEBUG_EVAL_ERROR : "Error while evaluating the class generated from template macro library '%1'"
    },
    $prototype : {
        /**
         * Called when the .tml file is received.
         * @param {String} classDef Content of the .tml file
         * @param {String} logicalpath Logical path of the .tml file
         * @protected
         */
        _loadClass : function (classDef, logicalPath) {
            this._loadClassAndGenerate(classDef, logicalPath);
        }
    }
});
