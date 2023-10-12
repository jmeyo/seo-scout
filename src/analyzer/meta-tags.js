const axios = require('axios');
const cheerio = require('cheerio');

class MetaTagsAnalyzer {
  async analyze(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Scout/1.0; +https://github.com/seo-scout)'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      const meta = {
        // Basic meta tags
        title: $('title').text().trim() || null,
        description: $('meta[name="description"]').attr('content') || null,
        keywords: $('meta[name="keywords"]').attr('content') || null,

        // Open Graph
        ogTitle: $('meta[property="og:title"]').attr('content') || null,
        ogDescription: $('meta[property="og:description"]').attr('content') || null,
        ogImage: $('meta[property="og:image"]').attr('content') || null,
        ogUrl: $('meta[property="og:url"]').attr('content') || null,
        ogType: $('meta[property="og:type"]').attr('content') || null,
        ogSiteName: $('meta[property="og:site_name"]').attr('content') || null,
        ogLocale: $('meta[property="og:locale"]').attr('content') || null,

        // Twitter Cards
        twitterCard: $('meta[name="twitter:card"]').attr('content') || null,
        twitterTitle: $('meta[name="twitter:title"]').attr('content') || null,
        twitterDescription: $('meta[name="twitter:description"]').attr('content') || null,
        twitterImage: $('meta[name="twitter:image"]').attr('content') || null,
        twitterSite: $('meta[name="twitter:site"]').attr('content') || null,
        twitterCreator: $('meta[name="twitter:creator"]').attr('content') || null,

        // Technical SEO
        canonical: $('link[rel="canonical"]').attr('href') || null,
        robots: $('meta[name="robots"]').attr('content') || null,
        viewport: $('meta[name="viewport"]').attr('content') || null,

        // Language/Locale
        hreflang: [],
        lang: $('html').attr('lang') || null,

        // Additional headers
        charset: $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || null,

        // Response info
        statusCode: response.status,
        finalUrl: response.request.res.responseUrl || url,
        redirected: response.request.res.responseUrl !== url
      };

      // Extract all hreflang links
      $('link[rel="alternate"][hreflang]').each((_, elem) => {
        meta.hreflang.push({
          hreflang: $(elem).attr('hreflang'),
          href: $(elem).attr('href')
        });
      });

      return meta;
    } catch (error) {
      if (error.response) {
        return {
          error: true,
          statusCode: error.response.status,
          message: `HTTP ${error.response.status}: ${error.response.statusText}`
        };
      }
      return {
        error: true,
        message: error.message
      };
    }
  }
}

module.exports = MetaTagsAnalyzer;
