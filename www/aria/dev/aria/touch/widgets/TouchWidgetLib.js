/*
 * Copyright Amadeus
 */
/**
 * Touch widget library.
 */
Aria.classDefinition({
    $classpath : 'aria.touch.widgets.TouchWidgetLib',
    $extends : 'aria.widgetLibs.WidgetLib',
    $singleton : true,
    $prototype : {
        /**
         * Map of all the widgets in the library. Keys in the map are widget names as they can be used in templates.
         * Values are the corresponding classpaths.
         * @type {Object}
         */
        widgets : {
            "Slider" : "aria.touch.widgets.Slider"
        }
    }
});