/*
 * Copyright Amadeus
 */
/**
 * @class aria.utils.Beans
 */
Aria.beanDefinitions({
    $package : "aria.utils.Beans",
    $description : "",
    $namespaces : {
        "json" : "aria.core.JsonTypes",
        "environmentBase" : "aria.core.environment.EnvironmentBaseCfgBeans"
    },
    $beans : {
        "options" : {
            $type : "json:Object",
            $description : "Configuration bean used by the interpreter of Date.js",
            $properties : {
                "referenceDate" : {
                    $type : "json:Date",
                    $description : "Reference date from which value can be calculated."
                },
                "inputPattern" : {
                    $type : "environmentBase:inputFormatTypes",
                    $description : "Date pattern used to match user input to convert it in a Javascript valid date."
                }
            }
        }
    }
});