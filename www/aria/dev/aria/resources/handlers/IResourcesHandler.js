/*
 * Copyright Amadeus
 */
/**
 * Generic interface for Resources Handlers. Resources Handlers are normally used by AutoComplete controllers.
 */
Aria.interfaceDefinition({
    $classpath : "aria.resources.handlers.IResourcesHandler",
    $interface : {

        /**
         * Call the callback with an array of suggestions in its arguments.
         * @param {String} textEntry Search string
         * @param {aria.core.CfgBeans.Callback} callback Called when suggestions are ready
         */
        getSuggestions : {
            $type : "Function"
        },

        /**
         * Returns the classpath of the default template for this resourceHandler. This method is used only by
         * aria.widgets.controllers.AutoCompleteController
         * @return {String}
         */
        getDefaultTemplate : {
            $type : "Function"
        },

        /**
         * Provide a label for given suggestion
         * @param {Object} suggestion
         * @return {String}
         */
        suggestionToLabel : {
            $type : "Function"
        },

        /**
         * Call the callback with all possible suggestions.
         * @param {aria.core.CfgBeans.Callback} callback
         */
        getAllSuggestions : {
            $type : "Function"
        }
    }
});