/*
 * Copyright Amadeus
 */
/**
 * Public API of the page Engine available in templates and modules
 */
Aria.interfaceDefinition({
    $classpath : "aria.pageEngine.PageEngineInterface",
    $events : {
        "pageReady" : {
            description : "Raised when the page has been displayed",
            properties : {
                "pageId" : "Identifier of the page."
            }
        }
    },
    $interface : {

        /**
         * Navigate to a specific page
         * @param {aria.pageEngine.CfgBeans.PageNavigationInformation} pageRequest id and url of the page
         * @param {aria.core.CfgBeans.Callback} cb To be called when the navigation is complete
         */
        navigate : {
            $type : "Function",
            $callbackParam : 1
        }
    }
});
