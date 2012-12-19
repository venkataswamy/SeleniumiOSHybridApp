/*
 * Copyright Amadeus
 */
/**
 * Public API for retrieving application variables related to resources.
 * @class aria.resources.environment.ResourcesSettings
 * @extends aria.core.environment.EnvironmentBase
 * @singleton
 */
Aria.classDefinition({
    $classpath : "aria.resources.environment.ResourcesSettings",
    $dependencies : ["aria.resources.environment.ResourcesSettingsCfgBeans"],
    $singleton : true,
    $extends : "aria.core.environment.EnvironmentBase",
    $prototype : {
        /**
         * Classpath of the bean which allows to validate the part of the environment managed by this class.
         * @type String
         */
        _cfgPackage : "aria.resources.environment.ResourcesSettingsCfgBeans.AppCfg",

        /**
         * Returns the web application path
         * @public
         * @return {String}
         */
        getWebappPath : function () {
            return this.checkApplicationSettings("webappPath");
        }
    }
});