/*
 * Copyright Amadeus
 */
/**
 * Utility class that manages the history of the application
 */
Aria.classDefinition({
    $classpath : 'aria.pageEngine.utils.HistoryManager',
    $dependencies : ['aria.utils.History'],
    /**
     * @param {aria.core.CfgBeans.Callback} cb Callback called on pop state. It corresponds to a navigate method
     */
    $constructor : function (cb) {

        /**
         * Callback called on url change. It corresponds to a navigate method
         * @type aria.core.CfgBeans.Callback
         * @private
         */
        this._navigate = cb || null;

        /**
         * Contains the association between hashes and pageIds for already visited pages
         * @type Object
         * @private
         */
        this._cache = {};

        /**
         * Shortcut to the History utility
         * @type aria.utils.History
         * @private
         */
        this._history = aria.utils.History;

        /**
         * Listener of the onpopstate event raised by the History
         * @type aria.core.CfgBeans.Callback
         * @private
         */
        this._onPopStateCallback = {
            fn : this._onPopState,
            scope : this
        };

        this._history.$addListeners({
            "onpopstate" : this._onPopStateCallback
        });

    },
    $destructor : function () {
        this._history.$removeListeners({
            "onpopstate" : this._onPopStateCallback
        });
        this._onPopStateCallback = null;
        this._history = null;
        this._navigate = null;
        this._cache = null;
    },
    $prototype : {

        /**
         * Retrieves the pageId from the cache and navigates to it
         * @private
         */
        _onPopState : function () {
            var url = this.getUrl();
            var pageId = this._cache[url];
            if (pageId && this._navigate) {
                this.$callback(this._navigate, {
                    pageId : pageId,
                    url : url
                });
            }
        },

        /**
         * Updates the history according to the specified page parameters
         * @param {aria.pageEngine.CfgBeans.PageNavigationInformation} pageRequest
         */
        update : function (pageRequest) {
            var url = pageRequest.url;
            if (url) {
                this._cache[url] = pageRequest.pageId;
                if (this.getUrl() != url) {
                    if (pageRequest.replace) {
                        this._history.replaceState(pageRequest.data, pageRequest.title, url);
                    } else {
                        this._history.pushState(pageRequest.data, pageRequest.title, url);
                    }
                }
            }
        },

        /**
         * @return {String} pathname or hash, according to the browser
         */
        getUrl : function () {
            return this._history.getState().hash.split("?")[0];
        },

        /**
         * @return {String} Id of current page. If yet unknown, null will be returned
         */
        getPageId : function () {
            return this._cache[this.getUrl()] || null;
        }

    }
});