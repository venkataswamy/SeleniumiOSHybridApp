/*
 * Copyright Amadeus
 */
Aria.beanDefinitions({
    $package : "aria.html.beans.TextInputCfg",
    $description : "Configuration for Text Input widget.",
    $namespaces : {
        "base" : "aria.html.beans.ElementCfg",
        "common" : "aria.widgetLibs.CommonBeans"
    },
    $beans : {
        "Properties" : {
            $type : "base:Properties",
            $description : "Properties of a Text Input widget.",
            $properties : {
                "bind" : {
                    $type : "base:Properties.$properties.bind",
                    $properties : {
                        "value" : {
                            $type : "common:BindingRef",
                            $description : "Bi-directional binding. The text input's value is set in the bound object on blur."
                        }
                    }
                },
                "on" : {
                    $type : "base:Properties.$properties.on",
                    $properties : {
                        "type" : {
                            $type : "common:Callback",
                            $description : "Callback called when the user types inside the input. It corresponds to a keydown."
                        }
                    }
                }
            }
        }
    }
});