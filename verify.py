from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Use first locator found instead of relying on unique ones for spans
    page.locator('text=MUSIC').first.click(force=True)
    page.wait_for_timeout(1000)

    page.locator('input[type="range"]').click(force=True)
    page.wait_for_timeout(1000)

    # "VS Code - neural_core.ts" might have "VS CODE" or just "CODE" in the nav depending on capitalization
    page.locator('text=CODE').first.click(force=True)
    page.wait_for_timeout(1000)

    page.wait_for_timeout(3000)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
