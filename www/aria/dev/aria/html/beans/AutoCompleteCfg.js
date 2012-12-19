/*
 * Copyright Amadeus
 */
Aria.beanDefinitions({
    $package : "aria.html.beans.AutoCompleteCfg",
    $description : "Configuration for AutoComplete widget.",
    $namespaces : {
        "json" : "aria.core.JsonTypes",
        "input" : "aria.html.beans.TextInputCfg"
    },
    $beans : {
        "Properties" : {
            $type : "input:Properties",
            $description : "Properties of an AutoComplete widget.",
            $properties : {
                "bind" : {
                    $type : "input:Properties.bind",
                    $properties : {
                        "suggestions" : {
                            $type : "json:Array",
                            $description : "List of suggestions taken from the Resources Handler",
                            $contentType : {
                                $type : "json:Object",
                                $description : "Suggestion"
                            },
                            $default : []
                        }
                    }
                }
            }
        }
    }
});