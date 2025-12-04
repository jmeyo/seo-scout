const axios = require('axios');
const xml2js = require('xml2js');

class SitemapAnalyzer {
  constructor() {
    this.parser = new xml2js.Parser();
  }

  async parse(sitemapUrl) {
    try {
      const response = await axios.get(sitemapUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SEO-Scout/1.0'
        }
      });

      const result = await this.parser.parseStringPromise(response.data);

      // Check if it's a sitemap index or a regular sitemap
      if (result.sitemapindex) {
        return this.parseSitemapIndex(result.sitemapindex, sitemapUrl);
      } else if (result.urlset) {
        return this.parseUrlset(result.urlset);
      } else {
        throw new Error('Invalid sitemap format');
      }
    } catch (error) {
      throw new Error(`Failed to parse sitemap: ${error.message}`);
    }
  }

  async parseSitemapIndex(sitemapindex, baseUrl) {
    const sitemaps = sitemapindex.sitemap || [];
    const allUrls = [];

    // Parse base URL to extract scheme, host, and port
    const baseUrlObj = new URL(baseUrl);
    const baseOrigin = baseUrlObj.origin; // includes scheme, host, and port

    for (const sitemap of sitemaps) {
      const sitemapLoc = sitemap.loc[0];
      try {
        // Rewrite subsitemap URL to use same origin (host:port) as base URL
        const subsitemapUrl = new URL(sitemapLoc, baseOrigin);
        subsitemapUrl.protocol = baseUrlObj.protocol;
        subsitemapUrl.host = baseUrlObj.host; // includes hostname and port

        const normalizedUrl = subsitemapUrl.toString();
        const urls = await this.parse(normalizedUrl);
        allUrls.push(...urls);
      } catch (error) {
        console.error(`Warning: Failed to parse subsitemap ${sitemapLoc}: ${error.message}`);
      }
    }

    return allUrls;
  }

  parseUrlset(urlset) {
    const urls = urlset.url || [];
    return urls.map(url => ({
      loc: url.loc[0],
      lastmod: url.lastmod ? url.lastmod[0] : null,
      changefreq: url.changefreq ? url.changefreq[0] : null,
      priority: url.priority ? parseFloat(url.priority[0]) : null
    }));
  }
}

module.exports = SitemapAnalyzer;
