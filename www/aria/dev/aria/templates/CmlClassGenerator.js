/*
 * Copyright Amadeus
 */
/**
 * Generate the class definition for a CSS Template library
 * @class aria.templates.CmlClassGenerator
 */
Aria.classDefinition({
    $classpath : 'aria.templates.CmlClassGenerator',
    $extends : 'aria.templates.ClassGenerator',
    $singleton : true,
    $dependencies : ['aria.templates.CSSParser', 'aria.templates.CSSClassGenerator'],
    $constructor : function () {
        this.$ClassGenerator.constructor.call(this);

        // Load the Template specific statements
        this._loadStatements(["CSSLibrary"]);

        // Redefine the protected parser
        this._parser = aria.templates.CSSParser;

        // Redefine the class used as the parent for templates which do not inherit from any other template
        this._superClass = "aria.templates.CSSTemplate";

        this._classType = "CML";
        this._rootStatement = "CSSLibrary";
        this._templateParamBean = "aria.templates.CfgBeans.CSSLibraryCfg";
    },
    $prototype : {
        /**
         * Write to the current block of the class writer the $init method which is used both to import the script
         * prototype (if any) and to handle csslibs inheritance.
         * @param {aria.templates.ClassWriter} out
         * @protected
         */
        _writeClassInit : function (out) {
            aria.templates.CSSClassGenerator._writeClassInit.call(this, out);
        }
    }
});
