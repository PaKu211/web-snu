import scrapy
from zyte_scraper.items import QuoraPostItem

class QuoraSpider(scrapy.Spider):
    name = "quora"
    
    # Start URL is the Quora Space homepage
    start_urls = ["https://sekalaniskalauniverse.quora.com/"]

    # We want Zyte API browser rendering on the start page as well
    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(
                url, 
                meta={
                    "zyte_api": {
                        "browserHtml": True,
                        "actions": [
                            {"action": "waitForSelector", "selector": "a", "timeout": 20}
                        ]
                    }
                }
            )

    def parse(self, response):
        # Extract links
        links = response.css('a::attr(href)').getall()
        base_space_url = 'sekalaniskalauniverse.quora.com/'
        
        post_urls = []
        for link in links:
            if not link:
                continue
            # Remove query params & hashes
            clean_url = link.split('?')[0].split('#')[0]
            # Ensure it belongs to the space but is an actual post, not an about or followers page
            if (base_space_url in clean_url) and \
               ('/about' not in clean_url) and \
               ('/followers' not in clean_url) and \
               ('/submissions' not in clean_url) and \
               ('/log' not in clean_url) and \
               ('/comment/' not in clean_url) and \
               (clean_url != 'https://sekalaniskalauniverse.quora.com/') and \
               (clean_url != 'http://sekalaniskalauniverse.quora.com/'):
                post_urls.append(clean_url)
                
        # Deduplicate
        unique_urls = list(set(post_urls))
        self.log(f"Found {len(unique_urls)} unique Quora posts to crawl.")
        
        # Follow each post URL to get the full HTML content
        for url in unique_urls:
            yield scrapy.Request(
                url, 
                callback=self.parse_post,
                meta={
                    "zyte_api": {
                        "browserHtml": True,
                        "actions": [
                            {"action": "waitForSelector", "selector": ".qu-userSelect--text, article", "timeout": 20}
                        ]
                    }
                }
            )

    def parse_post(self, response):
        # Extract and clean title
        title_raw = response.css('title::text').get() or ''
        title = title_raw.replace(' - Sekala Niskala Universe (SNU) - Quora', '')\
                         .replace(' - Sekala Niskala Universe - Quora', '')\
                         .replace(' - Sekala Niskala Universe (SNU)', '')\
                         .replace(' - Sekala Niskala Universe', '')\
                         .replace(' - Quora', '').strip()
                         
        # Extract content HTML (contains text, spans, images, paragraphs, etc.)
        content_el = response.css('.qu-userSelect--text').get() or \
                     response.css('article').get() or \
                     response.css('.q-text.qu-userSelect--text').get()
                     
        if not content_el:
            self.log(f"Skipping post {response.url} - content element not found.")
            return

        # Extract cover image
        cover_image = response.css('.qu-userSelect--text img::attr(src)').get()
        
        # Extract date text (Quora usually shows 'Updated...' or 'Posted...')
        date_str = response.css('.q-text.qu-color--gray_light::text').get() or ''
        
        item = QuoraPostItem()
        item['title'] = title
        item['description'] = '' # Will be generated locally from content
        item['content_markdown'] = content_el # Raw HTML containing the post structure
        item['publish_date'] = date_str
        item['author'] = 'lovelie-light'
        item['tags'] = ['quora-sync']
        item['source_url'] = response.url
        item['cover_image_url'] = cover_image
        
        yield item
