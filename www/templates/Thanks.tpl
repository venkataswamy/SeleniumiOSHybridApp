{Template {
  $classpath:'templates.Thanks',
  $hasScript:true,
  $extends:'templates.Hello'
}}
  {macro main()}
    <div>
    
    <h2> Full Name : ${data.fname} ${data.lname} </h2>
    <h1>Thanks for launching Hybrid ios application</h1>
	  <input type="submit" value="Back" {on click onBack/}>
     
    </div>
  {/macro}

{/Template}