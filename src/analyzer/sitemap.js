const axios = require('axios');
const xml2js = require('xml2js');

class SitemapAnalyzer {
  constructor() {
    this.parser = new xml2js.Parser();
  }

  async parse(sitemapUrl, baseOrigin = null) {
    try {
      const response = await axios.get(sitemapUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SEO-Scout/1.0'
        }
      });

      const result = await this.parser.parseStringPromise(response.data);

      // Extract origin from the current sitemap URL if not provided
      if (!baseOrigin) {
        const urlObj = new URL(sitemapUrl);
        baseOrigin = urlObj.origin;
      }

      // Check if it's a sitemap index or a regular sitemap
      if (result.sitemapindex) {
        return this.parseSitemapIndex(result.sitemapindex, sitemapUrl, baseOrigin);
      } else if (result.urlset) {
        return this.parseUrlset(result.urlset, baseOrigin);
      } else {
        throw new Error('Invalid sitemap format');
      }
    } catch (error) {
      throw new Error(`Failed to parse sitemap: ${error.message}`);
    }
  }

  async parseSitemapIndex(sitemapindex, baseUrl, baseOrigin) {
    const sitemaps = sitemapindex.sitemap || [];
    const allUrls = [];

    // Parse base URL to extract scheme, host, and port
    const baseUrlObj = new URL(baseUrl);

    for (const sitemap of sitemaps) {
      const sitemapLoc = sitemap.loc[0];
      try {
        // Rewrite subsitemap URL to use same origin (host:port) as base URL
        const subsitemapUrl = new URL(sitemapLoc, baseOrigin);
        subsitemapUrl.protocol = baseUrlObj.protocol;
        subsitemapUrl.host = baseUrlObj.host; // includes hostname and port

        const normalizedUrl = subsitemapUrl.toString();
        const urls = await this.parse(normalizedUrl, baseOrigin);
        allUrls.push(...urls);
      } catch (error) {
        console.error(`Warning: Failed to parse subsitemap ${sitemapLoc}: ${error.message}`);
      }
    }

    return allUrls;
  }

  parseUrlset(urlset, baseOrigin) {
    const urls = urlset.url || [];
    return urls.map(url => {
      let loc = url.loc[0];

      // Rewrite URL to use the same origin (host:port) as the base URL
      if (baseOrigin) {
        try {
          const urlObj = new URL(loc);
          const baseUrlObj = new URL(baseOrigin);
          urlObj.protocol = baseUrlObj.protocol;
          urlObj.host = baseUrlObj.host; // includes hostname and port
          loc = urlObj.toString();
        } catch (e) {
          // If URL parsing fails, keep original
        }
      }

      return {
        loc,
        lastmod: url.lastmod ? url.lastmod[0] : null,
        changefreq: url.changefreq ? url.changefreq[0] : null,
        priority: url.priority ? parseFloat(url.priority[0]) : null
      };
    });
  }
}

module.exports = SitemapAnalyzer;
