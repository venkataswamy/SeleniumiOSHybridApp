/*
 * Copyright Amadeus
 */
/**
 * Beans to describe the parameters used by DWMPlug
 */
Aria.beanDefinitions({
    $package : "aria.pageEngine.dwm.CfgBeans",
    $description : "Definition of the beans used by DWMPlug.",
    $namespaces : {
        "json" : "aria.core.JsonTypes",
        "core" : "aria.core.CfgBeans"
    },
    $beans : {
        "Init" : {
            $type : "json:Object",
            $description : "Configuration to provide to the DWMPlug constructor.",
            $properties : {
                "baseUrl" : {
                    $type : "json:String",
                    $description : "Base url of the DWM services.",
                    $mandatory : true
                },
                "queryParameters" : {
                    $type : "json:Object",
                    $restricted : false,
                    $description : "Query parameters to add to requests.",
                    $properties : {
                        "SITE" : {
                            $type : "json:String",
                            $description : "Site code to target.",
                            $mandatory : true,
                            $sample : "_DWM_DWM"
                        },
                        "LANGUAGE" : {
                            $type : "json:String",
                            $description : "Language.",
                            $mandatory : true,
                            $sample : "GB"
                        }
                    }
                },
                "siteConfigPath" : {
                    $type : "json:String",
                    $description : "Path of the site configuration file.",
                    $mandatory : true
                },
                "timeout" : {
                    $type : "json:Integer",
                    $description : "Timeout in milliseconds that is used for requests.",
                    $default : 10000
                }
            }
        }
    }
});
