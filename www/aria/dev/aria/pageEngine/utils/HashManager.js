/*
 * Copyright Amadeus
 */
/**
 * Utility class that manages the change of url by only changing the hash
 */
Aria.classDefinition({
    $classpath : "aria.pageEngine.utils.HashManager",
    $dependencies : ["aria.utils.HashManager"],
    /**
     * @param {aria.core.CfgBeans.Callback} cb Callback called on hash change. It corresponds to a navigate method
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
         * Shortcut to the hash manager
         * @type aria.utils.HashManager
         * @private
         */
        this._hashManager = aria.utils.HashManager;

        /**
         * Listener of the hashchange
         * @type aria.core.CfgBeans.Callback
         * @private
         */
        this._onHashChangeCallback = {
            fn : this._onHashChange,
            scope : this
        };

        this._hashManager.addCallback(this._onHashChangeCallback);

    },
    $destructor : function () {
        this._hashManager.removeCallback(this._onHashChangeCallback);
        this._onHashChangeCallback = null;
        this._hashManager = null;
        this._navigate = null;
        this._cache = null;
    },
    $prototype : {

        /**
         * Retrieves the pageId from the cache and navigates to it
         * @private
         */
        _onHashChange : function () {
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
         * @param {aria.pageEngine.CfgBeans.PageRequest} pageRequest
         */
        update : function (pageRequest) {
            var url = pageRequest.url;
            if (url) {
                this._cache[url] = pageRequest.pageId;
                if (this.getUrl() != url) {
                    this._hashManager.setHash(url);
                }
            }
        },

        /**
         * @return {String} pathname or hash, according to the browser
         */
        getUrl : function () {
            return this._hashManager.getHashString();
        },
        /**
         * @return {String} Id of current page. If yet unknown, null will be returned
         */
        getPageId : function () {
            return this._cache[this.getUrl()] || null;
        }
    }
});