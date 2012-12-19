/*
 * Copyright Amadeus
 */
/**
 * Layer between the page engine and DWM. It loads the site configuration and the pages.
 */
Aria.classDefinition({
    $classpath : "aria.pageEngine.dwm.DWMPlugin",
    $implements : ["aria.pageEngine.pageProviders.PageProviderInterface"],
    $dependencies : ["aria.pageEngine.dwm.CfgBeans", "aria.pageEngine.dwm.DWMPagePreprocessor"],
    /**
     * @param {aria.pageEngine.dwm.CfgBeans.Init} config
     */
    $constructor : function (config) {

        try {
            aria.core.JsonValidator.normalize({
                json : config,
                beanName : "aria.pageEngine.dwm.CfgBeans.Init"
            }, true);
        } catch (ex) {
            this.logMultipleErrors(this.INVALID_INIT_CONFIG, ex.errors);
            return;
        }

        /**
         * @type aria.pageEngine.dwm.CfgBeans.Init
         * @private
         */
        this._config = config;

        // Add slash at the end if not existing
        this._config.baseUrl = this._config.baseUrl.replace(/\/$/, "") + "/";

        /**
         * Base query string to add to the url
         * @type String
         * @private
         */
        this._queryString = this.buildQueryString(config.queryParameters);

        /**
         * @type aria.pageEngine.dwm.DWMPagePreprocessor
         * @private
         */
        this._pagePreprocessor = aria.pageEngine.dwm.DWMPagePreprocessor;

    },
    $destructor : function () {},
    $statics : {
        INVALID_INIT_CONFIG : "Invalid initialization configuration"
    },
    $prototype : {

        /**
         * @param {aria.pageEngine.CfgBeans.ExtendedCallback} callback
         */
        loadSiteConfig : function (callback) {
            var url = [this._config.baseUrl, "DWMSample/ATConfig.action", this._queryString, '&data={"path":"',
                    this._config.siteConfigPath, '"}"'].join("");
            this._sendRequest(url, callback);
        },

        /**
         * @param {String} pageId Id of the page
         * @param {aria.pageEngine.CfgBeans.ExtendedCallback} callback
         */
        loadPageDefinition : function (pageId, callback) {
            var url = [this._config.baseUrl, "DWMSample/ATDispatcher.action", this._queryString, '&data={"pageCode":"',
                    pageId, '"}"'].join("");
            this._sendRequest(url, {
                onfailure : callback.onfailure,
                onsuccess : {
                    fn : this._afterPageDefinitionLoad,
                    scope : this,
                    args : callback.onsuccess
                }
            });
        },

        /**
         * Called after a successful server request
         * @param {Object} res
         * @param {aria.pageEngine.CfgBeans.ExtendedCallback} args
         * @private
         */
        _onSuccess : function (res, args) {
            this.$callback(args.onsuccess, res.responseJSON);
        },

        /**
         * Called after a failure
         * @param {Object} res
         * @param {aria.pageEngine.CfgBeans.ExtendedCallback} args
         * @private
         */
        _onFailure : function (res, args) {
            this.$callback(args.onfailure, res);
        },

        /**
         * Sends a jsonp request to the specified url
         * @param {String} url
         * @param {aria.pageEngine.CfgBeans.ExtendedCallback} callback
         * @private
         */
        _sendRequest : function (url, callback) {
            aria.core.IO.jsonp({
                url : url,
                jsonp : "JSONP_CALLBACK",
                callback : {
                    fn : this._onSuccess,
                    scope : this,
                    args : callback,
                    onerror : this._onFailure
                },
                timeout : this._config.timeout
            });
        },

        /**
         * Preprocess the page definition received from DWM
         * @param {Object} res Response from DWM containing the page definition
         * @param {aria.core.CfgBeans.Callback} cb
         * @private
         */
        _afterPageDefinitionLoad : function (dwmPageDef, cb) {
            var pageDefinition = this._pagePreprocessor.convertPageDefinition(dwmPageDef);
            this.$callback(cb, pageDefinition);
        },

        /**
         * Converts a JSON object into a query string. The '?' is included
         * @param {Object} params List of parameters
         * @return {String}
         */
        buildQueryString : function (params) {
            var outputStringArray = [];
            for (var param in params) {
                if (params.hasOwnProperty(param)) {
                    outputStringArray.push(param + "=" + params[param]);
                }
            }
            return "?" + outputStringArray.join("&");
        },

        /**
         * Log multiple errors to the default logger
         * @param {String} msg The global error message
         * @param {Array} errors List of all errors in this batch
         */
        logMultipleErrors : function (msg, errors) {
            this.$logError(msg + ":");
            for (var i = 0, len = errors.length; i < len; i++) {
                this.$logError((i + 1) + " - " + errors[i].msgId, errors[i].msgArgs);
            }
        }

    }
});