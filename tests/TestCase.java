import static org.junit.Assert.*;

import org.junit.Test;
import java.net.MalformedURLException;
import java.net.URL;

import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.By;
import org.testng.Assert;

import javax.swing.JOptionPane;

public class TestCase {

	@Test
	public void sampleTest() throws MalformedURLException, InterruptedException
	{
		// Use your own device or system IP shown in iPhone application log to create driver.
		RemoteWebDriver driver = new RemoteWebDriver(new URL("http://10.0.2.92:3001/wd/hub/"),DesiredCapabilities.iphone());
		WebElement firstName= driver.findElement(By.name("fname"));
		firstName.sendKeys("kamal");
		WebElement lastName= driver.findElement(By.name("lname"));
		lastName.sendKeys("Behera");
		WebElement continueButton= driver.findElement(By.name("continue"));
		continueButton.click();

	}

}
