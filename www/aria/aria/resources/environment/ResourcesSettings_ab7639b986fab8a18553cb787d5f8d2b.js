/*
 * Copyright Amadeus
 */
Aria.classDefinition({$classpath:"aria.resources.environment.ResourcesSettings",$dependencies:["aria.resources.environment.ResourcesSettingsCfgBeans"],$singleton:true,$extends:"aria.core.environment.EnvironmentBase",$prototype:{_cfgPackage:"aria.resources.environment.ResourcesSettingsCfgBeans.AppCfg",getWebappPath:function(){return this.checkApplicationSettings("webappPath")}}});