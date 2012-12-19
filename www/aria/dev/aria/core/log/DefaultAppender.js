/*
 * Copyright Amadeus
 */
(function () {
    var console = Aria.$global.console;
    /**
     * @class aria.core.log.DefaultAppender Default appender used by the logger to output log lines. The default
     * appender is using Firebug/Firebug lite to log (or in fact, any console that defines the window.console object).
     * Other appenders can be written by extending this default class in order to output elsewhere.
     */
    Aria.classDefinition({
        $classpath : 'aria.core.log.DefaultAppender',
        $prototype : console ? {
            /**
             * Output the first part of the string corresponding to the classname in the log
             * @param {String} className
             * @return {String} The formatted classname
             * @private
             */
            _formatClassName : function (className) {
                return "[" + className + "] ";
            },

            /**
             * Inspect an object in a log
             * @param {Object} o the object to inspect
             * @private
             */
            _inspectObject : function (o) {
                if (o && typeof o == "object" && console.dir) {
                    console.dir(o);
                }
            },

            /**
             * Debug
             * @param {String} className
             * @param {String} msg The message text (including arguments)
             * @param {String} msgText The message text (before arguments were replaced)
             * @param {Object} o An optional object to be inspected
             */
            debug : function (className, msg, msgText, o) {
                if (console.debug) {
                    console.debug(this._formatClassName(className) + msg);
                } else if (console.log) {
                    console.log(this._formatClassName(className) + msg);
                }
                this._inspectObject(o);
            },

            /**
             * Info
             * @param {String} className
             * @param {String} msg The message text (including arguments)
             * @param {String} msgText The message text (before arguments were replaced)
             * @param {Object} o An optional object to be inspected
             */
            info : function (className, msg, msgText, o) {
                if (console.info) {
                    console.info(this._formatClassName(className) + msg);
                } else if (console.log) {
                    console.log(this._formatClassName(className) + msg);
                }
                this._inspectObject(o);
            },

            /**
             * Warn
             * @param {String} className
             * @param {String} msg The message text (including arguments)
             * @param {String} msgText The message text (before arguments were replaced)
             * @param {Object} o An optional object to be inspected
             */
            warn : function (className, msg, msgText, o) {
                if (console.warn) {
                    console.warn(this._formatClassName(className) + msg);
                } else if (console.log) {
                    console.log(this._formatClassName(className) + msg);
                }
                this._inspectObject(o);
            },

            /**
             * Error
             * @param {String} className
             * @param {String} msg The message text (including arguments)
             * @param {String} msgText The message text (before arguments were replaced)
             * @param {Object} e The exception to format
             */
            error : function (className, msg, msgText, e) {
                var message = this._formatClassName(className) + msg;
                if (e) {
                    console.error(message + "\n", e);
                } else {
                    console.error(message);
                }
            }
        } : {
            debug : function () {},
            info : function () {},
            warn : function () {},
            error : function () {}
        }
    });
})();