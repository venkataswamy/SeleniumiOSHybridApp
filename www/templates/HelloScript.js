Aria.tplScriptDefinition( {
  $classpath : 'templates.HelloScript',

	$prototype : {
			onContinue : function(){
                         
                         
			Aria.loadTemplate({
				classpath:"templates.Thanks",
				div:"myContainer",
				data:{
                    fname:document.getElementById("fname").value,
                    lname:document.getElementById("lname").value
  
				}
	});			
	},
		
	  }
});



