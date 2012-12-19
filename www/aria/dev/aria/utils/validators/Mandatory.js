/*
 * Copyright Amadeus
 */
/**
 * Validator for a mandatory value
 */
Aria.classDefinition({
    $classpath : "aria.utils.validators.Mandatory",
    $extends : "aria.utils.validators.Validator",
    $statics : {
        DEFAULT_LOCALIZED_MESSAGE : "This field is a mandatory field."
    },
    $prototype : {
        validate : function (value) {
            if (value) {
                return this._validationSucceeded();
            }
            return this._validationFailed();
        }
    }
});