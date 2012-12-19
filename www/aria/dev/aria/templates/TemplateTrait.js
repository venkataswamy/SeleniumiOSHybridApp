/*
 * Copyright Amadeus
 */
/**
 * Class with common methods used in aria.widget.Templates and aria.html.Template
 */
Aria.classDefinition({
    $classpath : "aria.templates.TemplateTrait",
    $prototype : {

        /**
         * Callback for the module controller load. It is called when the module controller (if any) has been loaded.
         * @protected
         */
        _onModuleCtrlLoad : function () {
            var tplcfg = this._tplcfg;
            if (!tplcfg) {
                // the module controller may arrive after the widget has been disposed
                // do nothing in this case
                return;
            }
            if (this._needCreatingModuleCtrl) {
                // initialize the module controller
                var moduleCtrl = this._cfg.moduleCtrl;
                aria.templates.ModuleCtrlFactory.createModuleCtrl(moduleCtrl, {
                    fn : this._onTplLoad,
                    scope : this,
                    args : {
                        autoDispose : moduleCtrl.autoDispose
                    }
                });
            } else {
                this._onTplLoad({
                    moduleCtrl : tplcfg.moduleCtrl
                }, {
                    autoDispose : false
                });
            }
        },

        /**
         * Called when inner template raises its first "Ready Event" event to raise an event to the the parent widget
         * @private
         */
        __innerTplReadyCb : function () {
            // moved viewReady here so it's called before the $displayReady of the parent template
            this.subTplCtxt.viewReady(); // view successfully rendered: signal to template through TemplateContext
            this.$raiseEvent("ElementReady");
            this.isDiffered = false;
        },

         /**
         * @param {Array} id contains the widget and template ids forming the focused widget path.
         * @return {Boolean}
         */
         _focusHelper : function (id) {
            if (!id || !id.length) {
                return this.subTplCtxt.$focusFromParent();
            } else {
                this.subTplCtxt.$focus(id);
                return true;
            }
        },

        /**
         * It calls the $focusFromParentMethod of the template context associated to the subtemplate. If the subTplCtxt
         * of the widget has not been set yet, set a listener to the 'ElementReady' event, when the subTplCtxt will have
         * certainly been defined. In the listener, the callback received as argument is called. The callback is passed
         * as argument by the focusFirst and _doFocus methods of aria.utils.NavigationManager
         * @param {Object} cb {aria.core.JsObject.Callback}
         * @param {Object} id contains an array of ids of the path to a focused widget
         * @return {Boolean} success/failure of the method
         */
        focus : function (id, cb) {
            if (this.subTplCtxt) {
                return this._focusHelper(id);
            } else {
                this.$onOnce({
                    'ElementReady' : function () {
                        var focusSuccess = this._focusHelper(id);
                        if (focusSuccess === false) {
                            this.$callback(cb);
                        }
                    },
                    scope : this
                });
                return true;
            }
        }
    }
});