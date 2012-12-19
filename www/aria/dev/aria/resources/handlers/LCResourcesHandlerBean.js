/*
 * Copyright Amadeus
 */
/**
 * Definition of the suggestions used in the LC resource handler
 * @class aria.resources.handlers.LCResourcesHandlerBean
 */
Aria.beanDefinitions({
    $package : "aria.resources.handlers.LCResourcesHandlerBean",
    $description : "Definition of the suggestions used in the LC resource handler",
    $namespaces : {
        "base" : "aria.widgets.form.AutoCompleteBean",
        "json" : "aria.core.JsonTypes"
    },
    $beans : {
        "Suggestion" : {
            $type : "base:Suggestion",
            $description : "A Label-Code suggestion",
            $restricted : false,
            $properties : {
                "label" : {
                    $type : "json:String",
                    $description : "label for this suggestion",
                    $sample : "Paris",
                    $mandatory : true
                },
                "code" : {
                    $type : "json:String",
                    $description : "A code matching this suggestion",
                    $sample : "PAR"
                }
            }
        },
        "Configuration" : {
            $type : "json:Object",
            $description : "Configuration Object for Suggestions",
            $restricted : false,
            $properties : {
                "labelKey" : {
                    $type : "json:String",
                    $description : "Any label key for suggestions",
                    $sample : "myLabel",
                    $default : "label"
                },
                "codeKey" : {
                    $type : "json:String",
                    $description : "Any code key for suggestions",
                    $sample : "myCode",
                    $default : "code"
                },
                "sortingMethod" : {
                    $type : "json:FunctionRef",
                    $description : "An anonymous function for sorting the suggestions list"
                },
                "codeExactMatch" : {
                    $type : "json:Boolean",
                    $description : "If code has to be matched exactly to return the suggestion",
                    $default : false
                },
                "labelMatchAtWordBoundaries" : {
                    $type : "json:Boolean",
                    $description : "Whether to try starting the search for the match on all word boundaries in the multi-word label, or only from the beginning of the label",
                    $default : false
                },
                "threshold" : {
                    $type : "json:Integer",
                    $description : "Minimum number of letters typed to return suggestions",
                    $default : 1
                }
            }
        }
    }
});