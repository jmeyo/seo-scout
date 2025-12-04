const SitemapAnalyzer = require('./analyzer/sitemap');
const MetaTagsAnalyzer = require('./analyzer/meta-tags');
const LighthouseAnalyzer = require('./analyzer/lighthouse');
const StructuredDataAnalyzer = require('./analyzer/structured-data');
const SymfonyIntegration = require('./integrations/symfony');
const GitIntegration = require('./integrations/git');
const ConsoleReporter = require('./reporters/console');
const JsonReporter = require('./reporters/json');
const CsvReporter = require('./reporters/csv');
const HtmlReporter = require('./reporters/html');
const path = require('path');

class SeoScout {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.config = this.loadConfig();

    // Initialize analyzers
    this.sitemapAnalyzer = new SitemapAnalyzer();
    this.metaTagsAnalyzer = new MetaTagsAnalyzer();
    this.lighthouseAnalyzer = new LighthouseAnalyzer();
    this.structuredDataAnalyzer = new StructuredDataAnalyzer();

    // Initialize integrations
    this.symfonyIntegration = new SymfonyIntegration(this.projectRoot);
    this.gitIntegration = new GitIntegration(this.projectRoot);

    // Initialize reporters
    this.reporters = {
      console: new ConsoleReporter(),
      json: new JsonReporter(),
      csv: new CsvReporter(),
      html: new HtmlReporter()
    };
  }

  loadConfig() {
    try {
      const configPath = path.join(this.projectRoot, '.seo-scout.json');
      return require(configPath);
    } catch (error) {
      // Use defaults if no config file
      return {
        lighthouse: { enabled: false },
        checks: {
          metaDescriptionLength: [150, 160],
          titleLength: [50, 60]
        }
      };
    }
  }

  async getUrlFromEnv(environment) {
    return this.symfonyIntegration.getBaseUrl(environment);
  }

  async analyze(url, options = {}) {
    const startTime = Date.now();
    const delayMs = options.delay || 0;
    const errors = [];
    const results = {
      url,
      timestamp: new Date().toISOString(),
      options,
      pages: [],
      summary: {},
      errors
    };

    try {
      // Get pages to analyze
      let pages = [];
      if (options.single) {
        pages = [{ url, loc: url }];
      } else {
        // Parse sitemap
        const sitemapUrl = url.endsWith('.xml') ? url : `${url}/sitemap.xml`;
        pages = await this.sitemapAnalyzer.parse(sitemapUrl);
      }

      // Filter by match patterns (substring in URL)
      if (options.match && options.match.length > 0) {
        const patterns = Array.isArray(options.match) ? options.match : [options.match];
        const lowered = patterns.map(p => (p || '').toLowerCase()).filter(Boolean);
        if (lowered.length > 0) {
          pages = pages.filter(p => {
            const loc = (p.loc || '').toLowerCase();
            return lowered.some(pattern => loc.includes(pattern));
          });
        }
      }

      // Apply random sampling if specified
      if (options.random && pages.length > 0) {
        const sampleSize = Math.min(options.random, pages.length);
        // Fisher-Yates shuffle and take first N items
        const shuffled = [...pages];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        pages = shuffled.slice(0, sampleSize);
      }

      // Apply limit if specified (after random sampling)
      if (options.limit && !options.random) {
        pages = pages.slice(0, options.limit);
      }

      // Analyze each page
      const total = pages.length;
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        console.log(`\r  Analyzing ${i + 1}/${total}: ${page.loc.substring(0, 60)}...`);

        const pageResult = {
          url: page.loc,
          lastmod: page.lastmod,
          priority: page.priority
        };

        // Extract meta tags
        pageResult.meta = await this.metaTagsAnalyzer.analyze(page.loc);

        if (pageResult.meta && pageResult.meta.error) {
          errors.push({
            url: page.loc,
            status: pageResult.meta.statusCode || null,
            message: pageResult.meta.message || 'Unknown error'
          });
          results.pages.push(pageResult);
          continue;
        }

        // Extract structured data
        pageResult.structuredData = await this.structuredDataAnalyzer.analyze(page.loc);

        // Run Lighthouse if requested
        if (options.lighthouse) {
          pageResult.lighthouse = await this.lighthouseAnalyzer.analyze(page.loc);
        }

        // Run checks
        pageResult.checks = this.runChecks(pageResult);

        results.pages.push(pageResult);

        if (delayMs > 0 && i < pages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      console.log('\r' + ' '.repeat(80)); // Clear progress line

      // Generate summary
      results.summary = this.generateSummary(results.pages);
      results.duration = Date.now() - startTime;

      return results;

    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  async listPages(url) {
    const sitemapUrl = url.endsWith('.xml') ? url : `${url}/sitemap.xml`;
    return this.sitemapAnalyzer.parse(sitemapUrl);
  }

  compare(results1, results2) {
    const comparison = {
      timestamp: new Date().toISOString(),
      env1: results1.url,
      env2: results2.url,
      changes: [],
      summary: {
        total: 0,
        improved: 0,
        degraded: 0,
        unchanged: 0
      }
    };

    // Create maps for easy lookup
    const pages1 = new Map(results1.pages.map(p => [p.url, p]));
    const pages2 = new Map(results2.pages.map(p => [p.url, p]));

    // Find all unique URLs
    const allUrls = new Set([...pages1.keys(), ...pages2.keys()]);

    for (const url of allUrls) {
      const page1 = pages1.get(url);
      const page2 = pages2.get(url);

      if (!page1) {
        comparison.changes.push({
          url,
          type: 'added',
          message: 'Page added in second environment'
        });
        continue;
      }

      if (!page2) {
        comparison.changes.push({
          url,
          type: 'removed',
          message: 'Page removed in second environment'
        });
        continue;
      }

      // Compare meta tags
      const metaChanges = this.compareMetaTags(page1.meta, page2.meta);
      if (metaChanges.length > 0) {
        comparison.changes.push({
          url,
          type: 'changed',
          changes: metaChanges
        });

        // Determine if improved or degraded
        const improvement = this.assessImprovement(metaChanges);
        if (improvement > 0) comparison.summary.improved++;
        else if (improvement < 0) comparison.summary.degraded++;
        else comparison.summary.unchanged++;
      } else {
        comparison.summary.unchanged++;
      }

      comparison.summary.total++;
    }

    return comparison;
  }

  async gitCompare(commit1, commit2, environment) {
    // Get current SEO state
    const url = await this.getUrlFromEnv(environment);
    const currentResults = await this.analyze(url, { single: false });

    // Get changed files from git
    const changedFiles = await this.gitIntegration.getChangedFiles(commit1, commit2);

    // Filter for SEO-relevant files (templates, translations)
    const seoFiles = changedFiles.filter(file =>
      file.includes('templates/') ||
      file.includes('translations/') ||
      file.includes('public/robots.txt')
    );

    const comparison = {
      timestamp: new Date().toISOString(),
      commit1,
      commit2,
      environment,
      url,
      changedFiles: seoFiles,
      changes: [],
      summary: {
        filesChanged: seoFiles.length,
        pagesAffected: 0,
        improvements: 0,
        potential_issues: 0
      }
    };

    // Analyze which pages might be affected
    for (const file of seoFiles) {
      const fileChanges = await this.gitIntegration.getFileDiff(commit1, commit2, file);
      comparison.changes.push({
        file,
        diff: fileChanges
      });
    }

    // Add current SEO state for reference
    comparison.currentState = currentResults;

    return comparison;
  }

  compareMetaTags(meta1, meta2) {
    const changes = [];
    const fields = ['title', 'description', 'ogTitle', 'ogDescription', 'twitterCard', 'twitterTitle', 'twitterDescription', 'canonical'];

    for (const field of fields) {
      if (meta1[field] !== meta2[field]) {
        changes.push({
          field,
          before: meta1[field] || 'NOT SET',
          after: meta2[field] || 'NOT SET'
        });
      }
    }

    return changes;
  }

  assessImprovement(changes) {
    let score = 0;

    for (const change of changes) {
      // Improvements
      if (change.before === 'NOT SET' && change.after !== 'NOT SET') {
        score += 1; // Adding missing meta tag is good
      }
      if (change.field === 'description' && change.after.length >= 150 && change.after.length <= 160) {
        score += 0.5; // Good description length
      }
      if (change.field === 'title' && change.after.length >= 50 && change.after.length <= 60) {
        score += 0.5; // Good title length
      }

      // Degradations
      if (change.after === 'NOT SET' && change.before !== 'NOT SET') {
        score -= 1; // Removing meta tag is bad
      }
      if (change.field === 'description' && (change.after.length < 50 || change.after.length > 200)) {
        score -= 0.5; // Poor description length
      }
    }

    return score;
  }

  runChecks(pageResult) {
    const checks = {
      passed: [],
      warnings: [],
      errors: []
    };

    const { meta } = pageResult;

    // Title checks
    if (!meta.title) {
      checks.errors.push('Missing page title');
    } else {
      if (meta.title.length < 30) {
        checks.warnings.push(`Title too short (${meta.title.length} chars, recommended 50-60)`);
      } else if (meta.title.length > 70) {
        checks.warnings.push(`Title too long (${meta.title.length} chars, recommended 50-60)`);
      } else {
        checks.passed.push('Title length is good');
      }
    }

    // Description checks
    if (!meta.description) {
      checks.errors.push('Missing meta description');
    } else {
      if (meta.description.length < 120) {
        checks.warnings.push(`Description too short (${meta.description.length} chars, recommended 150-160)`);
      } else if (meta.description.length > 200) {
        checks.warnings.push(`Description too long (${meta.description.length} chars, recommended 150-160)`);
      } else {
        checks.passed.push('Description length is good');
      }
    }

    // Open Graph checks
    if (meta.ogTitle && meta.ogDescription) {
      checks.passed.push('Open Graph tags present');
    } else {
      checks.warnings.push('Missing Open Graph tags');
    }

    // Twitter Card checks
    if (meta.twitterCard) {
      checks.passed.push('Twitter Card present');
    } else {
      checks.warnings.push('Missing Twitter Card');
    }

    // Canonical check
    if (meta.canonical) {
      checks.passed.push('Canonical URL present');
    } else {
      checks.warnings.push('Missing canonical URL');
    }

    return checks;
  }

  generateSummary(pages) {
    const summary = {
      totalPages: pages.length,
      withTitle: 0,
      withDescription: 0,
      withKeywords: 0,
      withOpenGraph: 0,
      withTwitterCard: 0,
      withCanonical: 0,
      withStructuredData: 0,
      uniqueDescriptions: new Set(),
      duplicateDescriptions: [],
      avgTitleLength: 0,
      avgDescriptionLength: 0,
      totalChecks: { passed: 0, warnings: 0, errors: 0 }
    };

    let totalTitleLength = 0;
    let totalDescLength = 0;

    for (const page of pages) {
      const meta = page.meta || {};
      const checks = page.checks || { passed: [], warnings: [], errors: [] };
      const structuredData = page.structuredData || [];

      if (meta.title) {
        summary.withTitle++;
        totalTitleLength += meta.title.length;
      }
      if (meta.description) {
        summary.withDescription++;
        totalDescLength += meta.description.length;
        summary.uniqueDescriptions.add(meta.description);
      }
      if (meta.keywords) summary.withKeywords++;
      if (meta.ogTitle && meta.ogDescription) summary.withOpenGraph++;
      if (meta.twitterCard) summary.withTwitterCard++;
      if (meta.canonical) summary.withCanonical++;
      if (structuredData.length > 0) summary.withStructuredData++;

      summary.totalChecks.passed += checks.passed.length;
      summary.totalChecks.warnings += checks.warnings.length;
      summary.totalChecks.errors += checks.errors.length;
    }

    summary.avgTitleLength = summary.withTitle > 0 ? Math.round(totalTitleLength / summary.withTitle) : 0;
    summary.avgDescriptionLength = summary.withDescription > 0 ? Math.round(totalDescLength / summary.withDescription) : 0;

    // Find duplicates
    const descCounts = {};
    for (const page of pages) {
      if (page.meta.description) {
        descCounts[page.meta.description] = (descCounts[page.meta.description] || 0) + 1;
      }
    }
    summary.duplicateDescriptions = Object.entries(descCounts)
      .filter(([_, count]) => count > 1)
      .map(([desc, count]) => ({ description: desc.substring(0, 100) + '...', count }));

    return summary;
  }

  async report(results, options = {}) {
    const format = options.format || 'console';
    const reporter = this.reporters[format];
    const fs = require('fs').promises;
    const path = require('path');

    if (!reporter) {
      throw new Error(`Unknown report format: ${format}`);
    }

    const output = await reporter.generate(results, options);

    // Always save JSON backup unless explicitly disabled
    if (options.autoSaveJson !== false && format !== 'json') {
      const jsonReporter = this.reporters['json'];
      const jsonOutput = await jsonReporter.generate(results, options);

      // Determine JSON filename
      let jsonPath;
      if (options.output) {
        const parsed = path.parse(options.output);
        jsonPath = path.join(parsed.dir, `${parsed.name}.json`);
      } else {
        // Default: reports/seo-{env}-{timestamp}.json
        const reportsDir = path.join(this.projectRoot, 'reports');
        try {
          await fs.mkdir(reportsDir, { recursive: true });
        } catch (e) {
          // Directory might exist
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const envHint = results.url ? new URL(results.url).hostname.split('.')[0] : 'scan';
        jsonPath = path.join(reportsDir, `seo-${envHint}-${timestamp}.json`);
      }

      await fs.writeFile(jsonPath, jsonOutput);
      console.log(`\nJSON backup saved to: ${jsonPath}`);
    }

    // Save primary output
    if (options.output) {
      await fs.writeFile(options.output, output);
      console.log(`\nReport saved to: ${options.output}`);
    } else if (format === 'console') {
      // Console reporter outputs directly
    } else {
      console.log(output);
    }

    return output;
  }
}

module.exports = SeoScout;
