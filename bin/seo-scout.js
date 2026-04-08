#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const SeoScout = require('../src/index');

function resolveReportOptions(options) {
  const normalized = {
    format: options.format,
    output: options.output,
    summary: options.summary,
    maxPages: options.maxPages,
    clientReport: options.clientReport
  };

  if (options.clientReport) {
    normalized.summary = true;
    normalized.maxPages = options.maxPages || 20;
    if (options.format === 'console') {
      normalized.format = 'html';
    }
  }

  return normalized;
}

program
  .name('seo-scout')
  .description('Comprehensive SEO analysis tool with Symfony integration')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze a website from sitemap or single page')
  .argument('[url]', 'Website URL or sitemap URL')
  .option('-e, --env <environment>', 'Symfony environment (dev/staging/prod)')
  .option('-s, --single', 'Analyze single page instead of full sitemap')
  .option('-l, --lighthouse', 'Include Lighthouse audits (slower)')
  .option('-f, --format <format>', 'Output format (console/json/csv/html/pdf)', 'console')
  .option('-o, --output <file>', 'Output file path')
  .option('--limit <number>', 'Limit number of pages to analyze', parseInt)
  .option('--random <number>', 'Randomly sample N pages from sitemap', parseInt)
  .option('--match <patterns...>', 'Only analyze sitemap URLs containing these substrings (case-insensitive)')
  .option('--delay <ms>', 'Delay between page requests in ms', parseInt)
  .option('--summary', 'Generate a shorter summary report (for HTML/CSV)')
  .option('--max-pages <number>', 'Maximum number of page details to include in report', parseInt)
  .option('--client-report', 'Generate client-friendly summary (short HTML, plain language)')
  .option('--fail-on-errors', 'Exit with non-zero status if any pages fail', false)
  .action(async (url, options) => {
    try {
      const scout = new SeoScout({ projectRoot: process.cwd() });

      // Determine URL from options or argument
      let targetUrl = url;
      if (options.env && !url) {
        targetUrl = await scout.getUrlFromEnv(options.env);
        console.log(chalk.blue(`Using URL from .env.${options.env}: ${targetUrl}`));
      }

      if (!targetUrl) {
        console.error(chalk.red('Error: Please provide a URL or --env option'));
        process.exit(1);
      }

      console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║                    SEO Scout Analysis                          ║'));
      console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════╝\n'));

      if (!options.single && !targetUrl.endsWith('.xml')) {
        try {
          const urlObj = new URL(targetUrl);
          if (urlObj.pathname && urlObj.pathname !== '/' && urlObj.pathname !== '') {
            const sitemapUrl = scout.resolveSitemapUrl(targetUrl);
            console.log(chalk.yellow('Tip: You provided a page URL.'));
            console.log(chalk.yellow(`     Using sitemap: ${sitemapUrl}`));
            console.log(chalk.yellow('     Use --single to analyze only this page.\n'));
          }
        } catch (error) {
          // Ignore URL parsing errors (will be handled later)
        }
      }

      const results = await scout.analyze(targetUrl, {
        single: options.single,
        lighthouse: options.lighthouse,
        limit: options.limit,
        random: options.random,
        delay: options.delay,
        match: options.match
      });

      if (options.failOnErrors && results.errors && results.errors.length > 0) {
        throw new Error(`Encountered ${results.errors.length} page errors (example: ${results.errors[0].url})`);
      }

      const reportOptions = resolveReportOptions(options);
      await scout.report(results, reportOptions);

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Compare command
program
  .command('compare')
  .description('Compare SEO between two environments')
  .option('-e, --env <environment>', 'Primary environment', 'staging')
  .option('-c, --compare-env <environment>', 'Environment to compare with', 'prod')
  .option('-f, --format <format>', 'Output format (console/json/csv/html/pdf)', 'console')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    try {
      const scout = new SeoScout({ projectRoot: process.cwd() });

      console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║                  SEO Environment Comparison                     ║'));
      console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════╝\n'));

      const url1 = await scout.getUrlFromEnv(options.env);
      const url2 = await scout.getUrlFromEnv(options.compareEnv);

      console.log(chalk.blue(`Comparing:`));
      console.log(chalk.yellow(`  ${options.env}: ${url1}`));
      console.log(chalk.yellow(`  ${options.compareEnv}: ${url2}\n`));

      const [results1, results2] = await Promise.all([
        scout.analyze(url1, { single: false }),
        scout.analyze(url2, { single: false })
      ]);

      const comparison = scout.compare(results1, results2);

      await scout.report(comparison, {
        format: options.format,
        output: options.output,
        type: 'comparison'
      });

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Git compare command
program
  .command('git-compare')
  .description('Compare SEO changes between git commits')
  .argument('<commit1>', 'First commit (e.g., HEAD~1)')
  .argument('[commit2]', 'Second commit (default: HEAD)', 'HEAD')
  .option('-e, --env <environment>', 'Environment to test against', 'staging')
  .option('-f, --format <format>', 'Output format (console/json/csv/html/pdf)', 'console')
  .option('-o, --output <file>', 'Output file path')
  .action(async (commit1, commit2, options) => {
    try {
      const scout = new SeoScout({ projectRoot: process.cwd() });

      console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║                    Git SEO Comparison                          ║'));
      console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════╝\n'));

      console.log(chalk.blue(`Comparing commits: ${commit1} → ${commit2}`));
      console.log(chalk.blue(`Environment: ${options.env}\n`));

      const comparison = await scout.gitCompare(commit1, commit2, options.env);

      await scout.report(comparison, {
        format: options.format,
        output: options.output,
        type: 'git-comparison'
      });

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// List command - show available pages from sitemap
program
  .command('list')
  .description('List all pages from sitemap')
  .argument('[url]', 'Sitemap URL')
  .option('-e, --env <environment>', 'Symfony environment')
  .action(async (url, options) => {
    try {
      const scout = new SeoScout({ projectRoot: process.cwd() });

      let targetUrl = url;
      if (options.env && !url) {
        targetUrl = await scout.getUrlFromEnv(options.env);
      }

      if (!targetUrl) {
        console.error(chalk.red('Error: Please provide a URL or --env option'));
        process.exit(1);
      }

      const pages = await scout.listPages(targetUrl);

      console.log(chalk.bold.green(`\nFound ${pages.length} pages in sitemap:\n`));
      pages.forEach((page, i) => {
        console.log(chalk.cyan(`${(i + 1).toString().padStart(3)}. `) + page.loc);
      });
      console.log();

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Render command - convert a saved JSON report to another format
program
  .command('render')
  .description('Render a saved JSON report to another format (no re-crawl)')
  .argument('<file>', 'Path to JSON report generated by seo-scout')
  .option('-f, --format <format>', 'Output format (console/json/csv/html/pdf)', 'html')
  .option('-o, --output <file>', 'Output file path (default: next to input file)')
  .option('--summary', 'Generate a shorter summary report (for HTML/CSV)')
  .option('--max-pages <number>', 'Maximum number of page details to include in report', parseInt)
  .option('--client-report', 'Generate client-friendly summary (short HTML, plain language)')
  .action(async (file, options) => {
    try {
      const scout = new SeoScout({ projectRoot: process.cwd() });
      const fs = require('fs').promises;
      const path = require('path');

      const raw = await fs.readFile(file, 'utf-8');
      const results = JSON.parse(raw);

      // Ensure summary is consistent when rendering from JSON
      if (results.pages && Array.isArray(results.pages)) {
        results.summary = scout.generateSummary(results.pages);
      }

      const reportOptions = resolveReportOptions(options);

      let outputPath = reportOptions.output;
      if (!outputPath && reportOptions.format !== 'console') {
        const parsed = path.parse(file);
        const ext = reportOptions.format === 'html' ? '.html'
          : reportOptions.format === 'csv' ? '.csv'
            : reportOptions.format === 'pdf' ? '.pdf'
            : reportOptions.format === 'json' ? '-rendered.json'
              : `.${reportOptions.format}`;
        outputPath = path.join(parsed.dir, `${parsed.name}${ext}`);
      }

      await scout.report(results, {
        format: reportOptions.format,
        output: outputPath,
        autoSaveJson: false,
        summary: reportOptions.summary,
        maxPages: reportOptions.maxPages,
        clientReport: reportOptions.clientReport
      });
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
