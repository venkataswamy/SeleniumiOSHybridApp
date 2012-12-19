{Template {
    $classpath:'templates.Hello',
	 $hasScript:true
}}
  {macro main()}
      <h1>Welcome to Hybrid iOS Demo</h1>
      <form action="demo_form.asp">
  First name: <input type="text" name="fname" id="fname"><br>
  Last name: <input type="text" name="lname" id="lname"><br>
</form>
	  <input name = "continue" type="button" value="Continue" {on click "onContinue"/}>
  {/macro}
{/Template}