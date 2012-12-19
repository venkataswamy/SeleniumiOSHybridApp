/*
 * Copyright Amadeus
 */
/**
 * Interface exposed from the Request Manager to the application. It is used by the request manager to create a cutom
 * URL
 * @class aria.modules.urlService.IUrlService
 */
Aria.interfaceDefinition({
    $classpath : 'aria.modules.urlService.IUrlService',
    $interface : {
        /**
         * Generate an action URL.
         * @param {String} moduleName Name of the module that is making the request
         * @param {String} actionName Action to be called on the server
         * @param {Number} sessionId Value of the session id
         * @return {aria.modules.RequestBeans.RequestDetails|String} URL details
         */
        createActionUrl : function (moduleName, actionName, sessionId) {},

        /**
         * Generate a service URL.
         * @param {String} moduleName Name of the module that is making the request
         * @param {Object} serviceSpec Specification for target service
         * @param {Number} sessionId Value of the session id
         * @return {aria.modules.RequestBeans.RequestDetails|String} URL details
         */
        createServiceUrl : function (moduleName, serviceSpec, sessionId) {},

        /**
         * Generate an i18n URL.
         * @param {String} moduleName Name of the module that is making the request
         * @param {String} actionName Action to be called on the server
         * @param {String} locale Locale for i18n, if not present defaults to currentLocale
         * @return {String} Full URL
         */
        createI18nUrl : function (moduleName, sessionId, locale) {}
    }
});