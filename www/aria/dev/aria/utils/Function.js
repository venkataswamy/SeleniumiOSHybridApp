/*
 * Copyright Amadeus
 */
/**
 * Utils for javascript functions
 */
Aria.classDefinition({
    $classpath : 'aria.utils.Function',
    $singleton : true,
    $prototype : {

        /**
         * Bind a function to a particular context. As a consequence, in the function 'this' will correspond to the
         * context. Additional arguments will be prepend to the arguments of the binded function
         * @param {Function} fn
         * @param {Object} context
         * @return {Function}
         */
        bind : function (fn, context) {
            var args = [];
            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return function () {
                // need to make a copy each time
                var finalArgs = args.slice(0);
                // concat won't work, as arguments is a special array
                for (var i = 0; i < arguments.length; i++) {
                    finalArgs.push(arguments[i]);
                }
                return fn.apply(context, finalArgs);
            };
        },

        /**
         * Put on destination object functions from source object, keeping the source object as scope for these
         * functions
         * @param {Object} src source object
         * @param {Object} dest destination object
         * @param {Array} fnNames list of function names
         * @param {String} optional string prefix for functions on the target object
         */
        wrapObjectFn : function (src, dest, fnNames, prefix) {
            if (!prefix) {
                prefix = '';
            }
            for (var index = 0, l = fnNames.length; index < l; index++) {
                var key = fnNames[index];
                dest[prefix + key] = this.bind(src[key], src);
            }
        },

        /**
         * Create a function from a callback object. When the function is called, the callback is called. The first parameter in the callback is the argument array given to the function.
         * @param {aria.core.JsObject.Callback} cb
         * @return {Function}
         */
        bindCallback : function (cb) {
            cb = this.$normCallback(cb);
            return function () {
                cb.fn.call(cb.scope, arguments, cb.args);
            };
        }

    }
});