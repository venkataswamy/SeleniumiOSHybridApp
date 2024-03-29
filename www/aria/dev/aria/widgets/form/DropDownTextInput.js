/*
 * Copyright Amadeus
 */
/**
 * Base class for all text input widgets that use a drop-down popup
 */
Aria.classDefinition({
    $classpath : "aria.widgets.form.DropDownTextInput",
    $extends : "aria.widgets.form.TextInput",
    $dependencies : ["aria.widgets.form.DropDownTrait"],
    /**
     * DropDownInput constructor
     * @param {aria.widgets.CfgBeans.DropDownInputCfg} cfg the widget configuration
     * @param {aria.templates.TemplateCtxt} ctxt template context
     * @param {Number} lineNumber Line number corresponding in the .tpl file where the widget is created
     * @param {aria.widgets.form.Textcontroller} controller the data controller object
     */
    $constructor : function (cfg, ctxt, lineNumber, controller) {
        if (!this._skinnableClass) {
            this._skinnableClass = "DropDownInput";
        }
        this.$TextInput.constructor.call(this, cfg, ctxt, lineNumber, controller);
    },
    $destructor : function () {
        this._closeDropdown();
        this.$TextInput.$destructor.call(this);
    },
    $prototype : {
        /**
         * Prototype init method called at prototype creation time Allows to store class-level objects that are shared
         * by all instances
         * @param {Object} p the prototype object being built
         */
        $init : function (p) {
            var src = aria.widgets.form.DropDownTrait.prototype;
            for (var key in src) {
                if (src.hasOwnProperty(key) && !p.hasOwnProperty(key)) {
                    // import methods from DropDownTrait which are not already on this object (this avoids copying
                    // $classpath and $destructor)
                    p[key] = src[key];
                }
            }
        },

        /**
         * Internal method called when the popup should be either closed or opened depending on the state of the
         * controller and whether it is currently opened or closed. In any case, keep the focus on the field. Called by
         * the widget button for example.
         * @protected
         */
        _toggleDropdown : function () {
            if (!this._hasFocus) {
                this.focus();
            }

            var report = this.controller.toggleDropdown(this.getTextInputField().value, this._dropdownPopup != null);
            this._reactToControllerReport(report, {
                hasFocus : true
            });

            this.focus();
        },

        /**
         * Handle key event on keydown or keypress. This function is asynchronous for special keys
         * @protected
         * @param {Object|aria.DomEvent} event object containing keyboard event information (at least charCode and
         * keyCode properties). This object may be or may not be an instance of aria.DomEvent.
         */
        _handleKey : function (event) {
            // PROFILING // var profilingId = this.$startMeasure("handle key " + String.fromCharCode(event.charCode)
            // PROFILING // + " (" + event.charCode + ")");
            if (this.controller) {
                if (!event.ctrlKey && !event.altKey) {
                    // we ignore CTRL+ / ALT+ key presses
                    this._checkKeyStroke(event);
                } else {
                    // alt or ctrl keys are pressed
                    // we check that copy/paste content is correct
                    aria.core.Timer.addCallback({
                        fn : this._checkKeyStroke,
                        scope : this,
                        args : event,
                        delay : 4
                    });
                }
            }
            // PROFILING // this.$stopMeasure(profilingId);
        },

        /**
         * Handle key event on keydown or keypress. Synchronous function
         * @see _handleKey
         * @protected
         * @param {Object|aria.DomEvent} event object containing keyboard event information (at least charCode and
         * keyCode properties). This object may be or may not be an instance of aria.DomEvent.
         */
        _checkKeyStroke : function (event) {
            var controller = this.controller;
            var cp = this.getCaretPosition();
            if (cp) {
                var report = controller.checkKeyStroke(event.charCode, event.keyCode, this.getTextInputField().value, cp.start, cp.end);
                // event may not always be a DomEvent object, that's why we check for the existence of
                // preventDefault on it
                if (report && report.cancelKeyStroke && event.preventDefault) {
                    event.preventDefault(true);
                }
                this._reactToControllerReport(report, {
                    hasFocus : true
                });
            }
        },

        /**
         * Internal method to handle the keydown event on the Text Input
         * @protected
         * @param {aria.DomEvent} event KeyDown event
         */
        _dom_onkeydown : function (event) {
            this.$DropDownTrait._dom_onkeydown.call(this, event);
            if (!event.hasStopPropagation) {
                // PTR 05348117: for the DatePicker (and also the AutoComplete and any text-based widget), it is
                // important to call checkValue to put the data in the data model when pressing ENTER. (That's what is
                // done in $TextInput._dom_onkeydown). Otherwise, the old value of the field may be submitted.
                this.$TextInput._dom_onkeydown.call(this, event);
            }
        },

        /**
         * Override $TextInput._reactToControllerReport
         * @protected
         * @param {aria.widgets.controllers.reports.DropDownControllerReport} report
         * @param {Object} arg Optional parameters
         */
        _reactToControllerReport : function (report, arg) {
            // a null report means callback was asynchronous
            // PROFILING // var profilingId = this.$startMeasure("react to controller report (DropDownTextInput)");
            if (report) {
                var openDropdown = report.displayDropDown;
                var repositionDropDown = report.repositionDropDown;
                this.$TextInput._reactToControllerReport.call(this, report, arg);
                // check that widget has not been disposed
                if (this._cfg) {
                    if (openDropdown === true && !this._dropdownPopup) {
                        this._openDropdown();
                    } else if (openDropdown === false && this._dropdownPopup) {
                        this._closeDropdown();
                    } else if (repositionDropDown && this._dropdownPopup) {
                        this._closeDropdown();
                        this._openDropdown();
                    }
                }
            }
            // PROFILING // this.$stopMeasure(profilingId);
        }
    }
});