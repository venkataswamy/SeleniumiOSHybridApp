/*
 * Copyright Amadeus
 */
/**
 * Event utility to handle touch device detection.
 */
Aria.classDefinition({
    $singleton : true,
    $classpath : "aria.touch.Event",
    $constructor : function () {
        this.touchEventMap = {
            "touchstart" : "touchstart",
            "touchend" : "touchend",
            "touchmove" : "touchmove"
        };
        this.touch = true;
        this.__touchDetection();
    },
    $prototype : {
        /**
         * Utility method to determine if the device is touch capable, if not the touch event properties are updated
         * with (legacy) mouse events.
         * @private
         */
        __touchDetection : function () {
            this.touch = (('ontouchstart' in Aria.$frameworkWindow) || Aria.$frameworkWindow.DocumentTouch
                    && Aria.$frameworkWindow.document instanceof Aria.$frameworkWindow.DocumentTouch);
            if (!this.touch) {
                this.touchEventMap = {
                    "touchstart" : "mousedown",
                    "touchend" : "mouseup",
                    "touchmove" : "mousemove"
                };
            }
        }
    }
});