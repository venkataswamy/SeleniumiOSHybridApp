/*
 * Copyright Amadeus
 */
/**
 * Contains getters for the Date environment.
 * @class aria.utils.environment.Date
 * @extends aria.core.environment.EnvironmentBase
 * @singleton
 */
Aria.classDefinition({
    $classpath : "aria.utils.environment.Date",
    $dependencies : ["aria.utils.environment.DateCfgBeans"],
    $extends : "aria.core.environment.EnvironmentBase",
    $singleton : true,
    $prototype : {
        /**
         * Classpath of the bean which allows to validate the part of the environment managed by this class.
         * @type String
         */
        _cfgPackage : "aria.utils.environment.DateCfgBeans.AppCfg",

        /**
         * Get Date configuration
         * @return {aria.utils.environmentDateCfgBeans.DateFormatsCfg}
         */
        getDateFormats : function () {
            return this.checkApplicationSettings("dateFormats");
        },

        /**
         * Get Time configuration
         * @return {aria.utils.environment.DateCfgBeans.TimeFormatsCfg}
         */
        getTimeFormats : function () {
            return this.checkApplicationSettings("timeFormats");
        },

        /**
         * Get First day of week configuration
         * @return {Integer}
         */
        getFirstDayOfWeek : function () {
            var firstDayOfWeek = this.checkApplicationSettings("firstDayOfWeek");
            // Backward compatibility code to be removed, PTR#05579605 - start.
            if (aria.utils.Date) {
                firstDayOfWeek = aria.utils.Date.firstDayOfWeek;
            }
            // Backward compatibility code to be removed, PTR#05579605 - end.
            return firstDayOfWeek;
        },
        /**
         * Backward compatibility code to be removed, PTR#05579605 - start. Apply the current environment.
         * @param {aria.core.JsObject.Callback} callback Will be called after the environment is applied.
         * @override
         */
        _applyEnvironment : function (callback) {
            if (aria.utils.Date) {
                aria.utils.Date.firstDayOfWeek = this.checkApplicationSettings("firstDayOfWeek");
            }
            this.$callback(callback);
        }
    }
});