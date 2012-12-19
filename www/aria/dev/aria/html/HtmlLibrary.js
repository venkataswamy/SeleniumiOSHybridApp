/*
 * Copyright Amadeus
 */
Aria.classDefinition({
    $classpath : "aria.html.HtmlLibrary",
    $extends : "aria.widgetLibs.WidgetLib",
    $singleton : true,
    $prototype : {
        widgets : {
            "TextInput" : "aria.html.TextInput",
            "Template" : "aria.html.Template"
        }
    }
});