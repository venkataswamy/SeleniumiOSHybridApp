/*
 * Copyright Amadeus
 */
/**
 * Load the bing 7 dependencies and creates map instances
 */
Aria.classDefinition({
    $classpath : "aria.map.providers.Microsoft7MapProvider",
    $singleton : true,
    $dependencies : ["aria.utils.ScriptLoader"],
    $constructor : function () {

        /**
         * Credentials for bing7 maps
         * @type String
         */
        this.credentials = "";

        /**
         * @type aria.core.CfgBeans.Callback
         */
        this._loadCallback = null;

    },
    $destructor : function () {
        this._loadCallback = null;
    },
    $prototype : {

        /**
         * Load the Microsoft Bing 7 scripts
         * @param {aria.core.CgfBeans.Callback} cb
         */
        load : function (cb) {
            if (this.isLoaded()) {
                this.$callback(cb);
            } else {
                var that = this;
                this._loadCallback = cb;
                Aria.$window.__bing7MapLoadCallback = function () {
                    that._afterLoad.apply(that);
                    that = null;
                };
                aria.utils.ScriptLoader.load(["http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&mkt=en-US&onscriptload=__bing7MapLoadCallback"]);

            }
        },

        /**
         * Load the 'Microsoft.Maps.Overlays.Style' module and calls the original callback
         * @private
         */
        _afterLoad : function () {
            this.$assert(35, this.isLoaded());
            Aria.$window.__bing7MapLoadCallback = null;
            var that = this;
            Aria.$window.Microsoft.Maps.loadModule('Microsoft.Maps.Overlays.Style', {
                callback : function () {
                    that.$callback(that._loadCallback);
                    that = null;
                }
            });

        },

        /**
         * Check if the Microsoft Bing 7 API is available
         * @return {Boolean}
         */
        isLoaded : function () {
            return typeof(Aria.$window.Microsoft) != 'undefined' && typeof(Aria.$window.Microsoft.Maps) != 'undefined'
                    && typeof(Aria.$window.Microsoft.Maps.Map) != 'undefined';
        },

        /**
         * @param {aria.map.CfgBeans.MapCfg} cfg
         * @return {Object} Map instance. null if the dependencies are not loaded
         */
        getMap : function (cfg) {
            var initArgs = {
                credentials : this.credentials
            };

            aria.utils.Json.inject(cfg.initArgs, initArgs);
            return (this.isLoaded()) ? new Aria.$window.Microsoft.Maps.Map(cfg.domElement, initArgs) : null;
        },

        /**
         * @param {Object} map previously created throught the getMap method
         */
        disposeMap : function (map) {
            map.dispose();
        }
    }
});