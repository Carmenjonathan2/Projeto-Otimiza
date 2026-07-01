import os
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import formatdate
import config

class RSSManager:
    def __init__(self):
        self.website_path = config.WEBSITE_ROOT_PATH
        self.feed_path = os.path.join(self.website_path, config.RSS_FEED_FILE)
        self.dicas_dir = os.path.join(self.website_path, config.DICAS_DIR)
        self.images_dir = os.path.join(self.website_path, config.IMAGES_DIR)
        
        # Ensure directories exist
        os.makedirs(self.dicas_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)

    def _get_or_create_feed(self):
        """Reads existing feed or creates a new root element."""
        if os.path.exists(self.feed_path):
            try:
                tree = ET.parse(self.feed_path)
                return tree.getroot()
            except ET.ParseError:
                pass # Corrupt or empty, create new
        
        # Create new RSS structure
        rss = ET.Element('rss', {'version': '2.0'})
        channel = ET.SubElement(rss, 'channel')
        ET.SubElement(channel, 'title').text = "Otimiza Farmavet - Dicas"
        ET.SubElement(channel, 'link').text = f"{config.WEBSITE_URL}/{config.DICAS_DIR}"
        ET.SubElement(channel, 'description').text = "Dicas e cuidados veterinários para seu pet."
        ET.SubElement(channel, 'language').text = config.LOCALE
        return rss

    def create_html_page(self, title, description, image_filename, slug):
        """Creates a simple static HTML page for the tip."""
        image_url = f"../{config.IMAGES_DIR}/{image_filename}" # Relative to dicas/ folder
        
        html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Otimiza Farmavet</title>
    <link rel="stylesheet" href="../styles.css"> <!-- Assuming main styles are one level up -->
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:image" content="{config.WEBSITE_URL}/{config.IMAGES_DIR}/{image_filename}" />
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f9f9f9; color: #333; }}
        .container {{ max-width: 800px; margin: 0 auto; padding: 20px; background: white; min-height: 100vh; }}
        img {{ max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        h1 {{ color: {config.BRAND_COLORS['primary']}; }}
        .back-link {{ display: inline-block; margin-bottom: 20px; color: #666; text-decoration: none; }}
        .content {{ line-height: 1.6; font-size: 1.1em; margin-top: 20px; }}
        footer {{ margin-top: 50px; font-size: 0.9em; color: #888; border-top: 1px solid #eee; padding-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <a href="../index.html" class="back-link">← Voltar para Início</a>
        
        <img src="{image_url}" alt="{title}">
        
        <h1>{title}</h1>
        
        <div class="content">
            <p>{description.replace(chr(10), '<br>')}</p>
        </div>
        
        <footer>
            <p>© {datetime.now().year} Otimiza Farmavet. Todos os direitos reservados.</p>
        </footer>
    </div>
</body>
</html>
"""
        file_path = os.path.join(self.dicas_dir, f"{slug}.html")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        
        return f"{config.WEBSITE_URL}/{config.DICAS_DIR}/{slug}.html"

    def add_item(self, title, description, image_filename, hashtags):
        """Adds a new item to the RSS feed and generates the HTML page."""
        
        # 1. Create Slug and HTML Page
        slug = "".join([c if c.isalnum() else "-" for c in title.lower()]).strip("-")
        page_url = self.create_html_page(title, description, image_filename, slug)
        
        image_url = f"{config.WEBSITE_URL}/{config.IMAGES_DIR}/{image_filename}"

        # 2. Update RSS Feed
        rss = self._get_or_create_feed()
        channel = rss.find('channel')
        
        item = ET.SubElement(channel, 'item')
        ET.SubElement(item, 'title').text = title
        ET.SubElement(item, 'link').text = page_url
        ET.SubElement(item, 'description').text = f"<![CDATA[<img src='{image_url}' /><br/>{description}]]>"
        ET.SubElement(item, 'pubDate').text = formatdate(localtime=True)
        ET.SubElement(item, 'guid').text = page_url
        
        # Enclosure is critical for Pinterest to find the image
        enclosure = ET.SubElement(item, 'enclosure')
        enclosure.set('url', image_url)
        enclosure.set('type', 'image/png') # Assuming PNG from image_creator
        
        # Write back to file
        tree = ET.ElementTree(rss)
        ET.indent(tree, space="  ", level=0)
        tree.write(self.feed_path, encoding='utf-8', xml_declaration=True)
        
        return page_url
