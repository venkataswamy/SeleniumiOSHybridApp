/*
 * Copyright Amadeus
 */
/**
 * Bean definitions for resources-related environment variables
 */
Aria.beanDefinitions({
    $package : "aria.resources.environment.ResourcesSettingsCfgBeans",
    $description : "A definition of the JSON beans used to set the environment settings.",
    $namespaces : {
        "json" : "aria.core.JsonTypes"
    },
    $beans : {
        "AppCfg" : {
            $type : "json:Object",
            $description : "Application environment variables",
            $restricted : false,
            $properties : {
                "webappPath" : {
                    $type : "json:String",
                    $description : "Application path for the application",
                    $default : ""
                }

            }
        }
    }
});