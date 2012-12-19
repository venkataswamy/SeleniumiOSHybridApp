/*
 * Copyright Amadeus
 */
/**
 * Abstract widget which enables an easy implementation of any template-based widget.
 */
Aria.classDefinition({
    $classpath : "aria.widgets.TemplateBasedWidget",
    $extends : "aria.widgets.container.Container",
    $dependencies : ["aria.widgets.Template"],
    $events : {
        "widgetContentReady" : {
            description : "Raised when the template content is displayed."
        }
    },
    $destructor : function () {
        if (this._subTplModuleCtrl) {
            this._subTplModuleCtrl.$unregisterListeners(this);
            this._subTplModuleCtrl = null;
        }
        this._subTplCtxt = null;
        this._subTplData = null;
        if (this._tplWidget) {
            this._tplWidget.$dispose();
            this._tplWidget = null;
        }
        aria.widgets.TemplateBasedWidget.superclass.$destructor.call(this);
    },
    $prototype : {
        /**
         * List of configuration options that are inherited from the Widget's configuration to the sub-template
         * @type Array
         */
        __inherithCfg : ["tooltip", "tooltipId", "tabIndex", "margins", "block", "printOptions"],

        /**
         * Initialize the template associated to this template based widget. It will create a new instance of the
         * Template.
         * @param {aria.templates.CfgBeans.LoadTemplateCfg} tplCfg Template configuration object
         * @protected
         */
        _initTemplate : function (tplCfg) {
            if (this._cfgOk) {
                var cfg = this._cfg;

                for (var i = 0, len = this.__inherithCfg.length; i < len; i += 1) {
                    var property = this.__inherithCfg[i];
                    if (!tplCfg.hasOwnProperty(property)) {
                        tplCfg[property] = cfg[property];
                    }
                }

                if (cfg.defaultTemplate) {
                    // allow the customization of the template:
                    tplCfg.defaultTemplate = cfg.defaultTemplate;
                }
                if (cfg.id) {
                    tplCfg.id = cfg.id + "_t_";
                }
                this._tplWidget = new aria.widgets.Template(tplCfg, this._context, this._lineNumber);
                this._tplWidget.tplLoadCallback = {
                    fn : this._tplLoadCallback,
                    scope : this
                };
            }
        },

        /**
         * Abstract. This function is called any time the sub-template's module controller raises an event.<br />
         * This function must be overridden.
         * @param {Event} evt
         */
        _onModuleEvent : function (evt) {
            // Override me!
        },

        /**
         * Callback executed after the template is loaded and initialized. As this widget has _directInit it gets
         * initialized soon after writing it to the DOM, however the callback can be executed after the first refresh if
         * the template context is not available
         * @param {Object} args Contains information about the load and instance of the template context
         * @protected
         */
        _tplLoadCallback : function (args) {
            if (args.success) {
                this._subTplCtxt = args.templateCtxt;
                this._subTplModuleCtrl = args.templateCtxt.moduleCtrl;
                this._subTplData = this._subTplCtxt.data;
                if (this._subTplModuleCtrl) {
                    this._subTplModuleCtrl.$on({
                        '*' : this._onModuleEvent,
                        scope : this
                    });
                }
                // only register the bindings here, when the widget template is totally loaded
                this._registerBindings();

                // binding registering may refresh the page
                if (this._tplWidget) {
                    this.initWidgetDom(this._tplWidget.getDom());
                    this.$raiseEvent("widgetContentReady");
                }
            }
            // TODO: if not args.success, need to log something ?
        },

        /**
         * Write the widget markup into the Markup Writer
         * @param {aria.templates.MarkupWriter} out Markup Writer
         */
        writeMarkup : function (out) {

            if (!this._cfgOk) {
                return aria.widgets.TemplateBasedWidget.superclass.writeMarkup.call(this, out);
            }

            // Prepare delegation id before to have it linked with this widget
            this._tplWidget._delegateId = aria.utils.Delegate.add({
                fn : this.delegate,
                scope : this
            });
            this._tplWidget.writeMarkup(out);

            this._domReady = true;
        },

        /**
         * Widget initialization.
         */
        initWidget : function () {
            if (!this._cfgOk) {
                return;
            }
            this._tplWidget.initWidget();
            // initWidgetDom is done in the template callback
        }

    }
});
