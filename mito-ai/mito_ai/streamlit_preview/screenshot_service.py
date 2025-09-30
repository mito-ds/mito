# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
from typing import Optional
import logging

try:
    from playwright.async_api import async_playwright, Browser, Page, Playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Playwright = None
    Browser = None
    Page = None

logger = logging.getLogger(__name__)


class ScreenshotService:
    """
    Singleton service for capturing Streamlit app screenshots.
    Maintains a persistent browser instance for performance.
    
    The service opens Streamlit at localhost:8501 directly - no proxy needed
    since Playwright runs server-side and has no CORS restrictions.
    """
    
    _instance: Optional['ScreenshotService'] = None
    _playwright: Optional[Playwright] = None
    _browser: Optional[Browser] = None
    _lock = asyncio.Lock()
    
    def __init__(self):
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError(
                "Playwright is not installed. Install it with: pip install playwright && playwright install chromium"
            )
        
        self.streamlit_url = "http://localhost:8501"
        self.browser_launch_args = {
            'headless': True,
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',  # Overcome limited resource problems
                '--disable-gpu'
            ]
        }
    
    @classmethod
    async def get_instance(cls) -> 'ScreenshotService':
        """Get singleton instance"""
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
                    await cls._instance.initialize()
        return cls._instance
    
    async def initialize(self):
        """Initialize Playwright and browser"""
        try:
            logger.info("Initializing Playwright browser...")
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                **self.browser_launch_args
            )
            logger.info("Playwright browser initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize browser: {e}")
            raise
    
    async def capture_screenshot(
        self,
        scroll_x: float,
        scroll_y: float,
        viewport_width: int,
        viewport_height: int,
        selection: dict
    ) -> bytes:
        """
        Capture a screenshot of a specific region of the Streamlit app.
        
        Opens the Streamlit app at localhost:8501, scrolls to match the user's
        view, and captures the selected region.
        
        Args:
            scroll_x: Horizontal scroll position from frontend
            scroll_y: Vertical scroll position from frontend
            viewport_width: Width of the viewport in frontend
            viewport_height: Height of the viewport in frontend
            selection: Dictionary with x, y, width, height of selection
            
        Returns:
            PNG screenshot as bytes
        """
        if not self._browser:
            raise RuntimeError("Browser not initialized")
        
        page = None
        try:
            # Create new page with matching viewport
            page = await self._browser.new_page(viewport={
                'width': viewport_width,
                'height': viewport_height
            })
            
            # Navigate to Streamlit app (same URL as frontend iframe)
            logger.info(f"Navigating to {self.streamlit_url}")
            await page.goto(self.streamlit_url, wait_until='networkidle', timeout=10000)
            
            # Wait for Streamlit to fully render
            await self._wait_for_streamlit_ready(page)
            
            # Scroll to match user's position
            # This ensures we capture the same region the user is looking at
            await page.evaluate(f"""
                window.scrollTo({scroll_x}, {scroll_y});
            """)
            
            # Wait for scroll to complete and content to render
            await asyncio.sleep(0.5)
            
            # Calculate absolute clip coordinates
            # Selection coordinates are relative to viewport (0,0 at top-left of visible area)
            # We need to add scroll offset to get absolute page coordinates
            clip = {
                'x': selection['x'],
                'y': selection['y'] + scroll_y,
                'width': selection['width'],
                'height': selection['height']
            }
            
            # Validate clip coordinates
            if clip['width'] <= 0 or clip['height'] <= 0:
                raise ValueError(f"Invalid clip dimensions: {clip}")
            
            logger.info(f"Capturing screenshot with clip: {clip}")
            
            # Capture screenshot of the specified region
            screenshot = await page.screenshot(
                clip=clip,
                type='png'
            )
            
            logger.info(f"Screenshot captured successfully ({len(screenshot)} bytes)")
            return screenshot
            
        except Exception as e:
            logger.error(f"Screenshot capture failed: {e}")
            raise
        finally:
            if page:
                await page.close()
    
    async def _wait_for_streamlit_ready(self, page: Page):
        """
        Wait for Streamlit app to be fully loaded and rendered.
        
        Streamlit apps can take a moment to load, especially with data fetching
        or complex visualizations. This method waits for key indicators.
        """
        try:
            # Wait for Streamlit's main container
            await page.wait_for_selector('[data-testid="stAppViewContainer"]', timeout=10000)
            
            # Wait for any loading spinners to disappear
            await page.wait_for_function("""
                () => {
                    const spinners = document.querySelectorAll('[data-testid="stStatusWidget"]');
                    return spinners.length === 0;
                }
            """, timeout=5000)
            
            # Additional small delay for dynamic content
            await asyncio.sleep(0.3)
            
        except Exception as e:
            logger.warning(f"Streamlit ready check failed: {e}")
            # Continue anyway - app might be ready enough
    
    async def health_check(self) -> bool:
        """Check if browser is healthy"""
        try:
            if not self._browser or not self._browser.is_connected():
                return False
            
            # Try to create and close a page
            page = await self._browser.new_page()
            await page.close()
            return True
        except Exception:
            return False
    
    async def restart_browser(self):
        """Restart the browser if it becomes unhealthy"""
        async with self._lock:
            logger.info("Restarting browser...")
            await self.cleanup()
            await self.initialize()
    
    async def cleanup(self):
        """Clean up resources"""
        try:
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
        finally:
            self._browser = None
            self._playwright = None
    
    @classmethod
    async def shutdown(cls):
        """Shutdown singleton instance"""
        if cls._instance:
            await cls._instance.cleanup()
            cls._instance = None
