/*
 * Copyright Amadeus
 */
Aria.classDefinition({
    $classpath : "aria.templates.TemplateManager",
    $singleton : true,
    $events : {
        "unloadTemplate" : {
            description : "raised when unloadTemplate is finished",
            properties : {
                classpath : "classpath of the template that has been unloaded"
            }
        }
    },
    $prototype : {
        /**
         * Unload a template (cache/files/urls/scripts/CSS/resources associated) and its ancestors
         * @param {String} classpath the classpath of the class to be removed
         * @param {Boolean} timestampNextTime if true, the next time the class is loaded, browser and server cache will
         * be bypassed by adding a timestamp to the url.
         * @param {String} stopAtClasspath if specified all ancestors up to it (included) will be unloaded. If undefined
         * only the template, defined by classpath, is unloaded.
         */
        unloadTemplate : function (classpath, timestampNextTime, stopAtClasspath) {
            var classMgr = aria.core.ClassMgr;
            var scriptClasspath = classpath + "Script";
            // do some cleaning in cache
            if (Aria.nspace(scriptClasspath, false) || aria.core.Cache.getItem("classes", scriptClasspath)) {
                classMgr.unloadClass(scriptClasspath, timestampNextTime);
            }
            var itm = Aria.$classDefinitions[classpath];
            if (itm) {
                if (!Aria.nspace(classpath, false) && itm.$css) {
                    // when there is an error in the script, the class reference for the template is not created, so the
                    // css would not be unregistered in the unloadClass method
                    aria.templates.CSSMgr.unregisterDependencies(classpath, itm.$css, true, timestampNextTime);
                }
                if (itm.$resources != null) {
                    var resources = itm.$resources;
                    for (var res in resources)
                        if (resources.hasOwnProperty(res)) {
                            classMgr.unloadClass(resources[res], timestampNextTime);
                        }
                }
                var ext = itm.$extends;
                if ((ext != null) && (ext != "aria.templates.Template")) {
                    if ((stopAtClasspath !== undefined) && (stopAtClasspath != classpath)) {
                        this.unloadTemplate(ext, timestampNextTime, stopAtClasspath);
                    }
                }
            }
            classMgr.unloadClass(classpath, timestampNextTime);
            // every thing is done : CSS are unhandled at classMgr level directly
            this.$raiseEvent({
                name : "unloadTemplate",
                classpath : classpath
            });
        }
    }
});