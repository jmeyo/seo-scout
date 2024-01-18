const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

class LighthouseAnalyzer {
  async analyze(url, categories = ['seo', 'performance', 'accessibility', 'best-practices']) {
    let chrome;

    try {
      // Launch Chrome
      chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
      });

      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: categories,
        port: chrome.port
      };

      // Run Lighthouse
      const runnerResult = await lighthouse(url, options);

      // Extract relevant scores
      const result = {
        url,
        fetchTime: runnerResult.lhr.fetchTime,
        scores: {},
        audits: {}
      };

      // Extract category scores
      for (const [categoryId, category] of Object.entries(runnerResult.lhr.categories)) {
        result.scores[categoryId] = {
          score: category.score,
          title: category.title
        };
      }

      // Extract key SEO audits
      const seoAudits = [
        'document-title',
        'meta-description',
        'http-status-code',
        'link-text',
        'crawlable-anchors',
        'is-crawlable',
        'robots-txt',
        'canonical',
        'hreflang',
        'structured-data'
      ];

      for (const auditId of seoAudits) {
        const audit = runnerResult.lhr.audits[auditId];
        if (audit) {
          result.audits[auditId] = {
            score: audit.score,
            title: audit.title,
            description: audit.description,
            displayValue: audit.displayValue
          };
        }
      }

      return result;

    } catch (error) {
      return {
        error: true,
        message: error.message
      };
    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }
  }
}

module.exports = LighthouseAnalyzer;
