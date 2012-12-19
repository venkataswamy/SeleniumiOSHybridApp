/*
 * Copyright Amadeus
 */
/**
 * Generate the class definition for a CSS Template
 * @class aria.templates.CSSClassGenerator
 * @extends aria.templates.ClassGenerator
 */
Aria.classDefinition({
    $classpath : 'aria.templates.CSSClassGenerator',
    $extends : 'aria.templates.ClassGenerator',
    $singleton : true,
    $dependencies : ['aria.templates.CSSParser'],
    $constructor : function () {
        this.$ClassGenerator.constructor.call(this);

        // Load the Template specific statements
        this._loadStatements(["CSSTemplate"]);

        // Redefine the protected parser
        this._parser = aria.templates.CSSParser;

        // Redefine the class used as the parent for templates which do not inherit from any other template
        this._superClass = "aria.templates.CSSTemplate";

        this._classType = "CSS";
        this._rootStatement = "CSSTemplate";
        this._templateParamBean = "aria.templates.CfgBeans.CSSTemplateCfg";
    },
    $prototype : {
        /**
         * Write to the current block of the class writer the $init method which is used both to import the script
         * prototype (if any) and to handle inheritance for csslibs.
         * @param {aria.templates.ClassWriter} out
         * @protected
         */
        _writeClassInit : function (out) {
            var tplParam = out.templateParam;
            out.enterBlock("classInit");
            this._writeMapInheritance(out, "__$csslibs", out.templateParam.$csslibs, "{}");
            this._writeValueInheritance(out, "__$prefix", out.templateParam.$prefix, "true");
            out.leaveBlock();
            this.$ClassGenerator._writeClassInit.call(this, out);
        }
    }
});