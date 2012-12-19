/*
 * Copyright Amadeus
 */
/**
 * Default interface for a content provider
 * @class aria.embed.IContentProvider
 */
Aria.interfaceDefinition({
    $classpath : 'aria.embed.IContentProvider',
    $events : {
        "contentChange" : {
            description : "Raised when the content associated to one or more placeholder paths changes.",
            properties : {
                contentPaths : "{Array} contains the paths whose corresponding content has changed."
            }
        }
    },
    $interface : {
        /**
         * Called by the placeholder manager to get the content configuration, which will be used by the placehoder to
         * build its content
         * @param {String} contentPath The content path which will be used to retrieve the configuration
         * @return {String|json|Array} the content configuration
         */
        getContent : function (contentPath) {}
    }
});
