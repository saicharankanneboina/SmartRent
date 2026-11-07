import os
import time
import unittest
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

# Configure Base URL (Can be set via environment variable SMARTRENT_BASE_URL)
# Defaults to local web server: http://localhost:3000
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
DEFAULT_URL = os.environ.get("SMARTRENT_BASE_URL", "http://localhost:3000")

# Configurable sleep/pause delay (in seconds) between test actions to visually inspect execution
STEP_DELAY = float(os.environ.get("SELENIUM_STEP_DELAY", "2.5"))


class SmartRentSeleniumTests(unittest.TestCase):
    """
    Automated UI tests for the SmartRent application using Selenium WebDriver.
    Includes visual pause delays (time.sleep) so test steps can be easily observed.
    """

    @classmethod
    def setUpClass(cls):
        """Initialize Chrome WebDriver once before running tests."""
        options = webdriver.ChromeOptions()
        # Uncomment the line below if you want tests to run headlessly (without opening browser window):
        # options.add_argument("--headless=new")
        options.add_argument("--start-maximized")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")

        # In Selenium 4.6+, Selenium automatically manages ChromeDriver binaries
        cls.driver = webdriver.Chrome(options=options)
        cls.driver.implicitly_wait(5)
        cls.wait = WebDriverWait(cls.driver, 10)
        cls.base_url = DEFAULT_URL.rstrip("/")

    @classmethod
    def tearDownClass(cls):
        """Close browser after all tests complete."""
        time.sleep(STEP_DELAY)
        if hasattr(cls, "driver") and cls.driver:
            cls.driver.quit()

    def get_page_url(self, page_name: str) -> str:
        """Helper to resolve page URL (supports both HTTP server and file:// paths)."""
        if self.base_url.startswith("http"):
            return f"{self.base_url}/{page_name}"
        file_path = FRONTEND_DIR / page_name
        return file_path.as_uri()

    def test_case_1_homepage_and_navigation(self):
        """
        TEST CASE 1: Homepage Title and Navigation Verification
        1. Open the SmartRent Home page (index.html).
        2. Verify the page title contains 'SmartRent'.
        3. Verify the brand navbar header is displayed.
        4. Click the 'About' link in the navigation bar.
        5. Verify that the URL updates to about.html and the 'About SmartRent' header is visible.
        """
        print("\n[Running Test Case 1: Homepage & Navigation]")
        home_url = self.get_page_url("index.html")
        self.driver.get(home_url)
        time.sleep(STEP_DELAY)  # Visual pause: Observe Home page

        # 1. Verify Page Title
        self.assertIn("SmartRent", self.driver.title, "Home page title does not contain 'SmartRent'")

        # 2. Verify Brand Logo / Title in Navbar
        brand_elem = self.wait.until(
            EC.visibility_of_element_located((By.CLASS_NAME, "nav-brand"))
        )
        self.assertIn("SmartRent", brand_elem.text, "Navbar brand text missing")

        # 3. Locate and Click the 'About' Link
        about_link = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//nav//a[contains(text(), 'About')]"))
        )
        time.sleep(STEP_DELAY)  # Visual pause: Before clicking About
        try:
            about_link.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", about_link)

        # 4. Verify redirected to About page (supports both 'about' and 'about.html')
        self.wait.until(EC.url_contains("about"))
        about_heading = self.wait.until(
            EC.visibility_of_element_located((By.TAG_NAME, "h1"))
        )
        self.assertIn("About", about_heading.text, "About page header text mismatch")
        time.sleep(STEP_DELAY)  # Visual pause: Observe About page
        print("✓ Test Case 1 Passed: Navigation to About page verified successfully.")

    def test_case_2_register_form_validation(self):
        """
        TEST CASE 2: User Registration Form Elements & Input Interaction
        1. Open the Registration page (register.html).
        2. Locate Full Name, Email, Password, and Role selection fields.
        3. Fill valid sample user data into each field.
        4. Select 'List Equipment (Owner)' from the dropdown.
        5. Verify that all fields retain the input data properly.
        """
        print("\n[Running Test Case 2: Registration Form Interaction]")
        register_url = self.get_page_url("register.html")
        self.driver.get(register_url)
        time.sleep(STEP_DELAY)  # Visual pause: Observe blank Register page

        # 1. Locate Form Inputs
        name_input = self.wait.until(EC.visibility_of_element_located((By.ID, "name")))
        email_input = self.driver.find_element(By.ID, "email")
        password_input = self.driver.find_element(By.ID, "password")
        role_select_elem = self.driver.find_element(By.ID, "role")

        # 2. Enter Test Data with visual pauses
        test_name = "Alex Johnson"
        test_email = "alex.johnson@example.com"
        test_pass = "SecurePass2026!"

        name_input.clear()
        name_input.send_keys(test_name)
        time.sleep(1.0)  # Pause after entering name

        email_input.clear()
        email_input.send_keys(test_email)
        time.sleep(1.0)  # Pause after entering email

        password_input.clear()
        password_input.send_keys(test_pass)
        time.sleep(1.0)  # Pause after entering password

        # 3. Choose Role using Selenium's Select helper
        role_select = Select(role_select_elem)
        role_select.select_by_value("Equipment Owner")
        time.sleep(STEP_DELAY)  # Visual pause: Observe filled form and selected role

        # 4. Assertions on field values
        self.assertEqual(name_input.get_attribute("value"), test_name)
        self.assertEqual(email_input.get_attribute("value"), test_email)
        self.assertEqual(password_input.get_attribute("value"), test_pass)
        self.assertEqual(role_select.first_selected_option.get_attribute("value"), "Equipment Owner")
        print("✓ Test Case 2 Passed: Registration form fields and dropdown interacted with successfully.")

    def test_case_3_login_validation_and_error_handling(self):
        """
        TEST CASE 3: Login Validation & Error Feedback
        1. Open the Login page (login.html).
        2. Input an invalid or non-existent email and password.
        3. Click the 'Login' submit button.
        4. Verify that the form initiates the authentication request.
        5. Verify that either an error banner (#authError) is displayed or the submit button displays feedback.
        """
        print("\n[Running Test Case 3: Login Authentication Feedback]")
        login_url = self.get_page_url("login.html")
        self.driver.get(login_url)
        time.sleep(STEP_DELAY)  # Visual pause: Observe blank Login page

        # 1. Locate Email, Password, and Submit Button
        email_input = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
        password_input = self.driver.find_element(By.ID, "password")
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "form#loginForm button[type='submit']")

        # 2. Enter Non-Existent Credentials with pause
        email_input.clear()
        email_input.send_keys("unregistered_user@example.com")
        time.sleep(1.0)

        password_input.clear()
        password_input.send_keys("WrongPassword123")
        time.sleep(STEP_DELAY)  # Visual pause: Observe entered credentials before clicking

        # 3. Submit Form
        try:
            submit_button.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", submit_button)

        # 4. Verify system response (waiting for #authError display or button text transition)
        def error_or_button_state(driver):
            err = driver.find_element(By.ID, "authError")
            btn = driver.find_element(By.CSS_SELECTOR, "form#loginForm button[type='submit']")
            if err.is_displayed() and len(err.text.strip()) > 0:
                return True
            if "Logging in" in btn.text or btn.get_attribute("disabled"):
                return True
            return False

        feedback_received = self.wait.until(error_or_button_state)
        self.assertTrue(feedback_received, "Expected feedback (error banner or submitting state) not received upon login submission")
        time.sleep(STEP_DELAY)  # Visual pause: Observe error banner feedback
        print("✓ Test Case 3 Passed: Login validation triggered feedback correctly.")


    
    def test_case_4_admin_dashboard_statistics(self):
        admin_token = os.environ.get("SMARTRENT_ADMIN_TOKEN")
        self.assertTrue(admin_token, "Admin token is required")

        self.driver.get(self.get_page_url("index.html"))

        self.driver.execute_script("""
            localStorage.setItem('token', arguments[0]);
            localStorage.setItem('user', JSON.stringify({
                id: 'admin-test',
                name: 'Test Admin',
                role: 'Admin'
            }));
        """, admin_token)

        self.driver.get(self.get_page_url("admin-dashboard.html"))

        self.wait.until(
            EC.visibility_of_element_located((By.ID, "adminContent"))
        )

        for element_id in [
            "statUsers",
            "statEquipment",
            "statActiveBookings",
            "statRenters",
            "statOwners"
        ]:
            value = self.driver.find_element(By.ID, element_id).text
            self.assertTrue(value.isdigit())

        revenue = self.driver.find_element(By.ID, "statRevenue").text
        self.assertIn("₹", revenue)

        print("Test Case 4 Passed: Admin statistics verified.")

    def test_case_5_admin_api_access_restriction(self):
        renter_token = os.environ.get("SMARTRENT_RENTER_TOKEN")
        self.assertTrue(renter_token, "Renter token is required")

        self.driver.get(self.get_page_url("index.html"))

        status_code = self.driver.execute_async_script("""
            const token = arguments[0];
            const callback = arguments[1];

            fetch('http://localhost:5000/api/admin/dashboard', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => callback(response.status))
            .catch(() => callback(0));
        """, renter_token)

        self.assertEqual(status_code, 403)

        print("Test Case 5 Passed: Admin access restriction verified.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
