/*
 * Copyright Amadeus
 */
/**
 * Validator for the object type.
 */
Aria.classDefinition({
    $classpath : "aria.utils.validators.Object",
    $dependencies : ['aria.utils.Type'],
    $extends : "aria.utils.validators.Validator",
    $prototype : {

        /**
         * validate will always fail by default.
         * @param {String} value
         * @return {Object}
         */
        validate : function (value) {
            if (value === null || aria.utils.Type.isObject(value)) {
                return this._validationSucceeded();
            }
            return this._validationFailed();
        }
    }
});