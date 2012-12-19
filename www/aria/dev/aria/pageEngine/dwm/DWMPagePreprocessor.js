/*
 * Copyright Amadeus
 */
/**
 * Preprocess a page definition
 */
Aria.classDefinition({
    $classpath : "aria.pageEngine.dwm.DWMPagePreprocessor",
    $singleton : true,
    $prototype : {

        /**
         * Convert the page definition received from DWM to a page definition that is compatible with the page engine.
         * @param {Object} dwmPageDef page Definition as returned by DWM
         * @return {aria.pageEngine.CfgBeans.PageDefinition} page definition that is compatible with the page Engine
         */
        convertPageDefinition : function (dwmPageDef) {
            var pageDef = {
                pageComposition : dwmPageDef.pageComposition,
                contents : {
                    menus : this._getMenus(dwmPageDef.MSResponse.MENU),
                    placeholderContents : this._getPlaceholderContents(dwmPageDef.MSResponse.PLACEHOLDER)
                }
            };
            return pageDef;
        },

        /**
         * Converts contents received from DWM into a format that can be processed by the page engine
         * @param {Object} dwmContents
         * @return {aria.pageEngine.CfgBeans.PageContents.$properties.placeholderContents}
         */
        _getPlaceholderContents : function (dwmContents) {
            var placeholderConts = {}, content, contentArray;
            for (var i = 0, contLength = dwmContents.length; i < contLength; i++) {
                content = [];
                contentArray = dwmContents[i].contents;
                for (var j = 0, contentArrayLength = contentArray.length; j < contentArrayLength; j++) {
                    content.push(contentArray[j].value);
                }
                placeholderConts[dwmContents[i].name] = {
                    value : content.join("")
                };
            }
            return placeholderConts;
        },

        /**
         * Converts the menu description received from DWM into a format that can be processed by the page engine
         * @param {Objct} dwmMenus
         * @return {aria.pageEngine.CfgBeans.PageContents.$properties.menus}
         */
        _getMenus : function (dwmMenus) {
            var menus = {};
            for (var i = 0, menusLength = dwmMenus.length; i < menusLength; i++) {
                menus[dwmMenus[i].referenceName] = dwmMenus[i].children;
            }

            return menus;
        }

    }
});