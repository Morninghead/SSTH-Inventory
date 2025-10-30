from playwright.sync_api import sync_playwright, Page, expect

def test_login(page: Page):
    page.goto("http://localhost:5173/login")
    page.get_by_placeholder("you@example.com").fill("nopanat.aplus@gmail.com")
    page.get_by_placeholder("••••••••").fill("123456")
    page.get_by_role("button", name="Sign In").click()
    expect(page).to_have_url("http://localhost:5173/dashboard")

def test_screenshot_dashboard(page: Page):
    test_login(page)
    page.screenshot(path="jules-scratch/verification/dashboard.png")

def test_screenshot_inventory(page: Page):
    test_login(page)
    page.goto("http://localhost:5173/inventory")
    page.screenshot(path="jules-scratch/verification/inventory.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    test_screenshot_dashboard(page)
    test_screenshot_inventory(page)
    browser.close()
