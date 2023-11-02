const axios = require('axios');
const cheerio = require('cheerio');

class StructuredDataAnalyzer {
  async analyze(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Scout/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      const structuredData = [];

      // Extract JSON-LD scripts
      $('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const json = JSON.parse($(elem).html());
          structuredData.push({
            type: 'json-ld',
            schema: json['@type'] || (Array.isArray(json) ? json.map(item => item['@type']).join(', ') : 'Unknown'),
            data: json
          });
        } catch (error) {
          // Invalid JSON, skip
        }
      });

      // Extract microdata (simplified)
      const microdataItems = [];
      $('[itemscope]').each((_, elem) => {
        const itemtype = $(elem).attr('itemtype');
        if (itemtype) {
          microdataItems.push({
            type: 'microdata',
            schema: itemtype.split('/').pop(),
            itemtype
          });
        }
      });

      if (microdataItems.length > 0) {
        structuredData.push(...microdataItems);
      }

      return structuredData;
    } catch (error) {
      return [];
    }
  }

  validate(structuredData) {
    // Basic validation - could be extended with schema.org validation
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    for (const item of structuredData) {
      if (item.type === 'json-ld') {
        if (!item.data['@context']) {
          results.warnings.push(`Missing @context in ${item.schema}`);
        }
        if (!item.data['@type']) {
          results.errors.push(`Missing @type in structured data`);
          results.valid = false;
        }
      }
    }

    return results;
  }
}

module.exports = StructuredDataAnalyzer;
