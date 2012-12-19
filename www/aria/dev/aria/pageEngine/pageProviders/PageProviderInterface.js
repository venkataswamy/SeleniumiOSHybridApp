/*
 * Copyright Amadeus
 */
/**
 * Public API of a page provider
 */
Aria.interfaceDefinition({
    $classpath : 'aria.pageEngine.pageProviders.PageProviderInterface',
    $events : {
        "pageChange" : {
            description : "Raised when the definition of a page changes.",
            properties : {
                "pageCode" : "Identifier of the page that has changed",
                "pageDefinition" : "New definition of the page"
            }
        }
    },
    $interface : {

        /**
         * @param {aria.pageEngine.CfgBeans.ExtendedCallback} callback
         */
        loadSiteConfig : function (callback) {},

        /**
         * @param {aria.pageEngine.CfgBeans.PageNavigationInformation} pageRequest
         * @param {aria.pageEngine.CfgBeans.ExtendedCallback} callback
         */
        loadPageDefinition : function (pageRequest, callback) {}

    }
});
