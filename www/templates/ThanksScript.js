Aria.tplScriptDefinition( {
  $classpath : 'templates.ThanksScript',

	$prototype : {
			onBack : function(){
			Aria.loadTemplate({
				classpath:"templates.Hello",
				div:"myContainer",
				data:{
				msg:"Hello World, this is AriaTemplates!"
				}
	});			
	},
    
		
    }
});