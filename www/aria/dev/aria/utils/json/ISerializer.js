/*
 * Copyright Amadeus
 */
/**
 * Interface definition for JSON serializers. A Serializer is a class able to convert an object into a string and
 * vice-versa. Serializers are utility classes, this interface defines the method that might be required by their users.
 */
Aria.interfaceDefinition({
    $classpath : "aria.utils.json.ISerializer",
    $interface : {
        /**
         * Convert a value to its string representation.
         * @param {Object|Array|String|Number|Boolean|Date|RegExp|Function} item Item to serialize
         * @param {aria.utils.json.JsonSerializerBeans.JsonSerializeOptions} options Options for the serialization
         * @return {String} the serialized item. It is set to null if there is an error during the serialization
         * @throws SyntaxError
         */
        serialize : function (item, options) {},

        /**
         * Parse a string as JSON.
         * @param {String} string The string to parse as JSON
         * @return {Object} JSON object
         * @throws SyntaxError
         */
        parse : function (string) {}
    }
});