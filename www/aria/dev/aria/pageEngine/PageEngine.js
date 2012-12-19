/*
 * Copyright Amadeus
 */
/**
 * Page engine bootstrap singleton to be used to start the site given a configuration file
 */
Aria.classDefinition({
    $classpath : "aria.pageEngine.PageEngine",
    $implements : ["aria.embed.IContentProvider", "aria.pageEngine.PageEngineInterface"],
    $dependencies : ["aria.pageEngine.CfgBeans", "aria.pageEngine.SiteRootModule", "aria.templates.ModuleCtrlFactory",
            "aria.core.JsonValidator", "aria.pageEngine.utils.SiteConfigHelper",
            "aria.pageEngine.utils.PageConfigHelper", "aria.embed.PlaceholderManager", "aria.utils.Type",
            "aria.pageEngine.utils.PageEngineUtils"],
    $constructor : function () {
        /**
         * Start configuration
         * @type aria.pageEngine.CfgBeans.Start
         * @private
         */
        this._config = null;

        /**
         * Instance of class that implements aria.pageEngine.pageProviders.PageProviderInterface
         * @type aria.pageEngine.CfgBeans.Start.$properties.pageProvider
         * @private
         */
        this._pageProvider = null;

        /**
         * Navigator instance, manages navigation
         * @type aria.pageEngine.utils.Navigator
         * @private
         */
        this._navigationManager = null;

        /**
         * Wrapper around the site configuration for easier manipulation
         * @type aria.pageEngine.utils.SiteConfigHelper
         * @private
         */
        this._siteConfigHelper = null;

        /**
         * Private instance of the root module controller.
         * @type aria.pageEngine.SiteRootModule
         * @private
         */
        this._rootModule = null;

        /**
         * Map of page configurations. The key is the pageId and the value is the configuration object given by the page
         * configuration helper
         * @type Object
         * @private
         */
        this._pageConfigs = {};

        /**
         * Map of the content processors
         * @type Object
         */
        this.contentProcessors = {};

        /**
         * Helper class to load page dependencies specified in the site config
         * @type aria.pageEngine.utils.SiteDependencies
         * @private
         */
        this._dependenciesLoader = null;

        /**
         * Identifier of the current page
         * @type String
         */
        this.currentPageId = null;

        /**
         * Generic utilities of the page engine
         * @type aria.pageEngine.utils.PageEngineUtils
         * @private
         */
        this._utils = aria.pageEngine.utils.PageEngineUtils;

        /**
         * Public interface that is available to templates
         * @type aria.pageEngine.PageEngineInterface
         * @private
         */
        this._wrapper = this.$interface("aria.pageEngine.PageEngineInterface");

        /**
         * Whether a template is loaded inside the container div
         * @type Boolean
         * @private
         */
        this._isTemplateLoaded = false;

    },
    $destructor : function () {
        aria.embed.PlaceholderManager.unregister(this);
        if (this._navigationManager) {
            this._navigationManager.$dispose();
        }
        if (this._isTemplateLoaded) {
            Aria.disposeTemplate(this._siteConfigHelper.getRootDiv());
            this._siteConfigHelper.$dispose();
        }
        if (this._rootModule) {
            this._rootModule.$dispose();
        }
    },
    $statics : {
        SITE_CONFIG_NOT_AVAILABLE : "Unable to retrieve the site configuration",
        INVALID_SITE_CONFIGURATION : "The configuration object of the application is not valid",
        PAGE_NOT_AVAILABLE : "Unable to retrieve page %1",
        INVALID_PAGE_DEFINITION : "The page definition does not match the bean aria.pageEngine.CfgBeans.PageDefinition",
        MISSING_DEPENDENCIES : "Unable to download Page Engine dependencies"
    },
    $prototype : {

        /**
         * Start the page engine by loading the site configuration
         * @param {aria.pageEngine.CfgBeans.Start} config json configuration
         */
        start : function (config) {

            this._config = config;
            this._pageProvider = config.pageProvider;
            aria.embed.PlaceholderManager.register(this);

            this._pageProvider.loadSiteConfig({
                onsuccess : {
                    fn : this._loadRootModule,
                    scope : this
                },
                onfailure : {
                    fn : this._errorCallback,
                    scope : this,
                    args : [this.SITE_CONFIG_NOT_AVAILABLE],
                    resIndex : -1
                }
            });

        },

        /**
         * Callback for the site configuration module controller. Initialize whatever is needed by the root module
         * controller, like the data model and the router
         * @param {aria.pageEngine.CfgBeans.Site} siteConfig Site configuration
         */
        _loadRootModule : function (siteConfig) {
            var valid = this.isConfigValid(siteConfig, "aria.pageEngine.CfgBeans.Site", this.INVALID_SITE_CONFIGURATION);
            if (!valid) {
                return;
            }
            var helper = new aria.pageEngine.utils.SiteConfigHelper(siteConfig);
            this._siteConfigHelper = helper;

            // Initialization
            var appData = helper.getAppData();

            appData.menus = appData.menus || {};

            aria.templates.ModuleCtrlFactory.createModuleCtrl({
                classpath : "aria.pageEngine.SiteRootModule",
                initArgs : {
                    appData : helper.getAppData(),
                    pageEngine : this._wrapper
                }
            }, {
                fn : this._loadSiteDependencies,
                scope : this
            });
        },

        /**
         * Load any dependency global for the site, like common modules. This is a callback of a createModuleCtrl
         * @param {Object} loadModule Module controller description
         */
        _loadSiteDependencies : function (loadModule) {
            this._rootModule = loadModule.moduleCtrlPrivate;

            var classesToLoad = this._siteConfigHelper.getListOfContentProcessors();
            var navigationManagerClass = this._siteConfigHelper.getNavigationManagerClass();
            if (navigationManagerClass) {
                classesToLoad.push(navigationManagerClass);
            }
            var commonModulesToLoad = this._siteConfigHelper.getCommonModulesDescription({
                priority : 1
            });

            this._utils.wiseConcat(classesToLoad, this._utils.extractPropertyFromArrayElements(commonModulesToLoad, "classpath"));

            Aria.load({
                classes : classesToLoad,
                oncomplete : {
                    fn : this._loadGlobalModules,
                    scope : this,
                    args : commonModulesToLoad
                },
                onerror : {
                    fn : this._errorCallback,
                    scope : this,
                    args : [this.MISSING_DEPENDENCIES],
                    resIndex : -1
                }
            });

        },

        /**
         * Load the global modules with priority 1
         * @param {Array} commonModulesToLoad Array containing objects of type
         * aria.templates.ModuleCtrl.SubModuleDefinition
         * @private
         */
        _loadGlobalModules : function (commonModulesToLoad) {
            this._rootModule.loadModules(null, {
                page : [],
                common : commonModulesToLoad
            }, {
                fn : this._onSiteReady,
                scope : this
            });
        },

        /**
         * Trigger the navigation to the first page
         * @private
         */
        _onSiteReady : function () {
            var helper = this._siteConfigHelper;
            this.contentProcessors = this._siteConfigHelper.getContentProcessorInstances();
            this._navigationManager = this._siteConfigHelper.getNavigationManager({
                fn : "navigate",
                scope : this
            });
            this.navigate({
                url : this._navigationManager ? this._navigationManager.getUrl() : null,
                pageId : this._navigationManager ? this._navigationManager.getPageId() : null,
                replace : true
            }, this._config.oncomplete);
        },

        /**
         * Navigate to a specific page
         * @param {aria.pageEngine.CfgBeans.PageNavigationInformation} pageRequest
         * @param {aria.core.CfgBeans.Callback} cb To be called when the navigation is complete
         */
        navigate : function (pageRequest, cb) {
            var pageId = pageRequest.pageId;
            if (pageId && pageId == this.currentPageId) {
                this.$callback(cb);
                if (this._navigationManager) {
                    this._navigationManager.update(pageRequest);
                }
            } else {
                this._pageProvider.loadPageDefinition(pageRequest, {
                    onsuccess : {
                        fn : this._getPageDependencies,
                        scope : this,
                        args : {
                            pageRequest : pageRequest,
                            cb : cb
                        }
                    },
                    onfailure : {
                        fn : this._errorCallback,
                        scope : this,
                        args : [this.PAGE_NOT_AVAILABLE, pageId],
                        resIndex : -1
                    }
                });
            }
        },

        /**
         * Callback for loading the page dependencies after loading the page description while doing navigation.
         * @param {aria.pageEngine.CfgBeans.PageDefinition} cfg Page configuration
         * @param {Object} args Contains the pageId and the callback
         */
        _getPageDependencies : function (cfg, args) {
            var valid = this.isConfigValid(cfg, "aria.pageEngine.CfgBeans.PageDefinition", this.INVALID_PAGE_DEFINITION);
            if (!valid) {
                this.$callback(args.cb);
                return;
            }

            var pageConfigHelper = new aria.pageEngine.utils.PageConfigHelper(cfg);
            aria.utils.Json.inject(pageConfigHelper.getMenus(), this._siteConfigHelper.getAppData().menus);
            this._pageConfigHelper = pageConfigHelper;
            this._lazyContent = true;
            this._loadPageDependencies({
                lazy : false,
                pageId : cfg.pageId,
                cb : {
                    fn : this._displayPage,
                    scope : this,
                    args : {
                        cb : args.cb,
                        pageConfig : cfg,
                        pageRequest : args.pageRequest
                    }
                }
            });

        },

        /**
         * Loads page dependencies, namely classes and templates
         * @param {Object} args
         * 
         * <pre>
         * {
         *      lazy : {Boolean} true if lazy page dependencies have to be loaded,
         *      pageId : {String} id of the page,
         *      cb : {aria.core.CfgBeans.Callback} to be called after dependencies are loaded
         * }
         * </pre>
         * 
         * @private
         */
        _loadPageDependencies : function (args) {
            var dependencies = this._pageConfigHelper.getPageDependencies(args.lazy);
            var pageCommonModules = this._siteConfigHelper.getCommonModulesDescription({
                priority : 2,
                refpaths : dependencies.modules.common
            });
            this._utils.wiseConcat(dependencies.classes, this._utils.extractPropertyFromArrayElements(pageCommonModules, "classpath"));
            var pageSpecificModules = this._pageConfigHelper.getPageModulesDescriptions(dependencies.modules.page);

            dependencies.oncomplete = {
                scope : this,
                fn : this._loadPageModules,
                args : {
                    pageId : args.pageId,
                    cb : args.cb,
                    subModules : {
                        common : pageCommonModules,
                        page : pageSpecificModules
                    }
                }
            };
            dependencies.onerror = {
                fn : this._errorCallback,
                scope : this,
                args : [this.MISSING_DEPENDENCIES],
                resIndex : -1
            };
            Aria.load(dependencies);
        },

        /**
         * Load any module that is needed by the page
         * @param {Object} args Contains the pageId and the callback
         * @private
         */
        _loadPageModules : function (args) {
            var subModules = args.subModules;
            this._rootModule.loadModules(args.pageId, subModules, args.cb);
        },

        /**
         * Normalize a configuration. It logs an error in case of validation failure
         * @param {Object} cfg Configuration to validate
         * @param {String} beanName name of the bean
         * @param {String} error Error message to log along with the validation errors
         * @return {Boolean}
         */
        isConfigValid : function (cfg, beanName, error) {
            try {
                aria.core.JsonValidator.normalize({
                    json : cfg,
                    beanName : beanName
                }, true);
            } catch (ex) {
                this._utils.logMultipleErrors(error, ex.errors, this);
                if (this._config.onerror) {
                    this.$callback(this._config.onerror, error);
                }
                return false;
            }
            return true;
        },

        /**
         * Load the page page template in the DOM
         * @param {Object} args Contains the pageId and the callback
         * @private
         */
        _displayPage : function (args) {
            var cfg = args.pageConfig.pageComposition, pageId = args.pageConfig.pageId;
            this.currentPageId = pageId;
            this._pageConfigs[pageId] = args.pageConfig;
            var pageRequest = args.pageRequest;
            pageRequest.url = args.pageConfig.url;
            pageRequest.pageId = args.pageConfig.pageId;
            pageRequest.title = args.pageConfig.title;
            if (this._navigationManager) {
                this._navigationManager.update(pageRequest);
            }
            var div = this._siteConfigHelper.getRootDiv();
            if (cfg.pageData) {
                this._rootModule.setPageData(cfg.pageData, pageId);
            }
            var cfgTemplate = {
                classpath : cfg.template,
                div : div,
                moduleCtrl : this._rootModule,
                args : [{
                            pageCfg : cfg
                        }]
            };
            if (this._isTemplateLoaded) {
                Aria.disposeTemplate(div);
                this._isTemplateLoaded = false;
            }
            Aria.loadTemplate(cfgTemplate);
            this._isTemplateLoaded = true;

            this.$raiseEvent({
                name : "pageReady",
                pageId : pageId
            });
            if (args.cb) {
                this.$callback(args.cb);
            }
            this._loadPageDependencies({
                lazy : true,
                pageId : pageId,
                cb : {
                    fn : this._afterLazyDependenciesLoad,
                    scope : this
                }
            });

        },

        /**
         * Trigger a content change in order to notify placeholder widgets
         * @private
         */
        _afterLazyDependenciesLoad : function () {
            var lazyPlaceholders = this._pageConfigHelper.getLazyPlaceholdersIds();
            this._lazyContent = false;
            this.$raiseEvent({
                name : "contentChange",
                contentPaths : lazyPlaceholders
            });

            this._pageConfigHelper.$dispose();
        },

        /**
         * Main content provider method
         * @param {String} placeholderPath path of the placeholder
         * @return {Array} List of content descriptions accepted by placeholders
         */
        getContent : function (placeholderPath) {
            var typeUtil = aria.utils.Type;
            var pageConfig = this._pageConfigs[this.currentPageId];
            var placeholders = pageConfig.pageComposition.placeholders;
            var content = placeholders[placeholderPath] || [];
            var outputContent = [];
            var plainContent;
            if (!typeUtil.isArray(content)) {
                content = [content];
            }

            for (var i = 0, ii = content.length; i < ii; i++) {
                var item = content[i];
                if (typeUtil.isObject(item)) {
                    if (this._lazyContent && item.lazy) {
                        outputContent.push({
                            loading : true,
                            width : item.lazy.width || null,
                            height : item.lazy.height || null,
                            color : item.lazy.color || null,
                            innerHTML : item.lazy.innerHTML || null
                        });
                    } else {
                        if (item.template) {
                            outputContent.push(this._getTemplateCfg(item, pageConfig));
                        } else if (item.contentId) {
                            plainContent = this._getPlaceholderContents(pageConfig, item.contentId);
                            outputContent = outputContent.concat(plainContent);
                        }
                    }
                } else {
                    outputContent.push(item);
                }
            }
            return outputContent;
        },

        /**
         * Extract the template configuration to be given to the Placeholder widget
         * @param {aria.pageEngine.CfgBeans.Placeholder} item
         * @param {aria.pageEngine.CfgBeans.PageDefinition} pageConfig
         * @return {aria.html.beans.TemplateCfg.Properties}
         * @private
         */
        _getTemplateCfg : function (item, pageConfig) {
            var templateCfg = {
                classpath : item.template
            };
            var args = item.args || [];
            var extraArg = {};
            if (item.contentId) {
                extraArg.contents = this._getPlaceholderContents(pageConfig, item.contentId);
            }
            args.push(extraArg);

            templateCfg.args = args;
            if (item.module) {
                templateCfg.moduleCtrl = this._rootModule.getPageModule(this.currentPageId, item.module);
            }
            return templateCfg;
        },

        /**
         * Retrieve the contents corresponding to a certain contentId from the page definition
         * @param {aria.pageEngine.CfgBeans.PageDefinition} pageConfig
         * @param {String} contentId
         * @return {Array} Array of strings corresponding to processed content
         * @private
         */
        _getPlaceholderContents : function (pageConfig, contentId) {
            var outputContent = [];
            var content = pageConfig.contents.placeholderContents[contentId];
            if (!content) {
                return outputContent;
            }
            if (!aria.utils.Type.isArray(content)) {
                content = [content];
            }
            for (var i = 0, length = content.length; i < length; i++) {
                outputContent = outputContent.concat(this.processContent(content[i]));
            }
            return outputContent;
        },

        /**
         * Process according to the content type
         * @param {aria.pageEngine.CfgBeans.Content} content
         * @return {String} processed content
         */
        processContent : function (content) {
            var contentType = content.contentType;

            if (contentType && contentType in this.contentProcessors) {
                return this.processContent(this.contentProcessors[contentType].processContent(content));
            }
            return content.value || "";
        },

        /**
         * Logs an error and calls the onerror callback if specified in the configuration
         */
        _errorCallback : function (msg) {
            var config = this._config;
            this.$logError.apply(this, msg);
            if (config.onerror) {
                this.$callback(config.onerror, msg[0]);
            }
        }
    }
});