/*
 * Copyright Amadeus
 */
/**
 * Interface exposed from the Request Manager to the application. It is used by the request manager handler the response
 * of the request
 * @class aria.modules.requestHandler.IRequestHandler
 */
Aria.interfaceDefinition({
    $classpath : 'aria.modules.requestHandler.IRequestHandler',
    $interface : {
        /**
         * Handles the response from the server, and call the associated callback
         * @param {aria.modules.RequestBeans.SuccessResponse} successResponse
         * @param {aria.modules.RequestBeans.Request} request
         * @param {aria.core.JsObject.Callback} callback to call with the response
         */
        processSuccess : function (successResponse, request, callback) {},

        /**
         * Handles the response from the server, and call the associated callback
         * @param {aria.modules.RequestBeans.FailureResponse} failureResponse
         * @param {aria.modules.RequestBeans.Request} request
         * @param {aria.core.JsObject.Callback} callback to call when the failure is processed
         */
        processFailure : function (failureResponse, request, callback) {},

        /**
         * Prepares the request body before the request is sent out
         * @param {Object} jsonData The json data that will be sent with this request
         * @param {aria.modules.RequestBeans.RequestObject} requestObject The request object being used for this request
         * @return {String} The string which should be used as the body of the POST request
         */
        prepareRequestBody : function (jsonData, requestObject) {},

        /**
         * Serializes the data by using the serializer specified in the request or the one specified in the application
         * environment
         * @param {Object} jsonData
         * @param {aria.modules.RequestBeans.RequestObject} requestObject
         * @return {String} Stringified representation of the input data
         */
        serializeRequestData : function (jsonData, requestObject) {}
    }
});