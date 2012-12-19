/*
 * Copyright Amadeus
 */
/**
 * Beans definition for the objects used by classes inside aria.storage
 */
Aria.beanDefinitions({
    $package : "aria.storage.Beans",
    $namespaces : {
        "json" : "aria.core.JsonTypes"
    },
    $description : "Structure of the objects used by the aria.storage package",
    $beans : {
        "ConstructorArgs" : {
            $type : "json:Object",
            $description : "Argument object for the constructor of storage classes.",
            $properties : {
                "namespace" : {
                    $type : "json:String",
                    $description : "Optional prefix used for any key in order to avoid collisions."
                },
                "serializer" : {
                    $type : "json:ObjectRef",
                    $description : "Seriliazer class used to convert values into strings."
                }
            }
        }
    }
});