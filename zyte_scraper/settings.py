# Scrapy settings for zyte_scraper project
BOT_NAME = 'zyte_scraper'

SPIDER_MODULES = ['zyte_scraper.spiders']
NEWSPIDER_MODULE = 'zyte_scraper.spiders'

# Respect robots.txt rules
ROBOTSTXT_OBEY = False

# Set User-Agent
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Configure maximum concurrent requests performed by Scrapy
CONCURRENT_REQUESTS = 4

# Configure a delay for requests for the same website
DOWNLOAD_DELAY = 2.0

# Disable cookies (enabled by default)
COOKIES_ENABLED = True

# Zyte API Configuration for Scrapy Cloud integration
# This middleware allows bypassing Cloudflare Turnstile using Zyte API
# Note: scrapy-zyte-api will automatically be used if installed in requirements.txt
DOWNLOADER_MIDDLEWARES = {
    'scrapy_zyte_api.ScrapyZyteAPIDownloaderMiddleware': 1000,
}
SPIDER_MIDDLEWARES = {
    'scrapy_zyte_api.ScrapyZyteAPISpiderMiddleware': 100,
}

# Use Zyte API for JS rendering and Turnstile bypass
ZYTE_API_ENABLED = True
ZYTE_API_DEFAULT_PARAMS = {
    "browserHtml": True,
    "actions": [
        {"action": "waitForSelector", "selector": "article, .qu-userSelect--text", "timeout": 15}
    ]
}

# Request header configurations
DEFAULT_REQUEST_HEADERS = {
   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
   'Accept-Language': 'id,en-US;q=0.7,en;q=0.3',
}
