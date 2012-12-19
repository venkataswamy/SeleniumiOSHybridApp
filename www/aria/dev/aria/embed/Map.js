/*
 * Copyright Amadeus
 */
/**
 * Map widget for the Embed Lib
 */
Aria.classDefinition({
    $classpath : "aria.embed.Map",
    $extends : "aria.embed.Element",
    $dependencies : ["aria.embed.controllers.MapController"],
    $constructor : function (cfg, context, lineNumber) {

        this.$Element.constructor.apply(this, arguments);
        this._cfg.controller = aria.embed.controllers.MapController;
        this._cfg.args = {
            id : cfg.id,
            provider : cfg.provider,
            initArgs : cfg.initArgs,
            loadingIndicator : cfg.loadingIndicator
        };

    },
    $prototype : {

        _cfgBeanName : "aria.embed.CfgBeans.MapCfg"

    }
});