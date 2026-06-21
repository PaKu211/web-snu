import scrapy

class QuoraPostItem(scrapy.Item):
    title = scrapy.Field()
    description = scrapy.Field()
    content_markdown = scrapy.Field()
    publish_date = scrapy.Field()
    author = scrapy.Field()
    tags = scrapy.Field()
    source_url = scrapy.Field()
    cover_image_url = scrapy.Field()
