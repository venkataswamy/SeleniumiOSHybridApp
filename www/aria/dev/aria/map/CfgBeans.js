/*
 * Copyright Amadeus
 */
/**
 * @class aria.templates.CfgBeans
 */
Aria.beanDefinitions({
    $package : "aria.map.CfgBeans",
    $description : "Definition of beans used for Maps",
    $namespaces : {
        "json" : "aria.core.JsonTypes",
        "core" : "aria.core.CfgBeans"
    },
    $beans : {
        "MapCfg" : {
            $type : "json:Object",
            $description : "Configuration object passed to a Map Provider to create a map",
            $properties : {
                "id" : {
                    $type : "json:String",
                    $description : "unique id of the map",
                    $mandatory : true
                },
                "domElement" : {
                    $type : "json:ObjectRef",
                    $description : "HTML Element in which the map will be created",
                    $mandatory : true
                },
                "initArgs" : {
                    $type : "json:MultiTypes",
                    $description : "Arguments that will be used to create the actual map instance",
                    $default : {}
                }
            }
        },

        "CreateMapCfg" : {
            $type : "MapCfg",
            $description : "Configuration object passed to the Map Manager to create a map",
            $properties : {
                "provider" : {
                    $type : "json:String",
                    $description : "Map provider. It can be an alias for a classpath that was already added to the MapManager, or a classpath",
                    $mandatory : true
                },
                "afterCreate" : {
                    $type : "core:Callback",
                    $description : "Callback called after the map is created, It receives the map instance as first argument"
                }
            }
        }
    }
});