const chalk = require('chalk');
const { table } = require('table');

class ConsoleReporter {
  async generate(results, options = {}) {
    const type = options.type || 'analysis';

    if (type === 'comparison') {
      return this.generateComparison(results);
    } else if (type === 'git-comparison') {
      return this.generateGitComparison(results);
    } else {
      return this.generateAnalysis(results);
    }
  }

  generateAnalysis(results) {
    console.log(chalk.bold.blue(`\nSite: ${results.url}`));
    console.log(chalk.blue(`Pages analyzed: ${results.pages.length}`));
    console.log(chalk.blue(`Duration: ${(results.duration / 1000).toFixed(2)}s`));
    console.log(chalk.blue(`Generated: ${new Date(results.timestamp).toLocaleString()}\n`));

    // Summary statistics
    this.printSummary(results.summary);

    // Show first few pages in detail
    const pagesToShow = Math.min(5, results.pages.length);
    console.log(chalk.bold.yellow(`\n${'═'.repeat(80)}`));
    console.log(chalk.bold.yellow(`Detailed Results (showing ${pagesToShow} of ${results.pages.length} pages)`));
    console.log(chalk.bold.yellow(`${'═'.repeat(80)}\n`));

    for (let i = 0; i < pagesToShow; i++) {
      this.printPageDetails(results.pages[i], i + 1);
    }

    // Overall assessment
    this.printAssessment(results.summary);
  }

  printSummary(summary) {
    const data = [
      [chalk.bold('Metric'), chalk.bold('Value'), chalk.bold('Status')],
      ['Pages with Title', `${summary.withTitle}/${summary.totalPages}`, this.getStatus(summary.withTitle, summary.totalPages)],
      ['Pages with Description', `${summary.withDescription}/${summary.totalPages}`, this.getStatus(summary.withDescription, summary.totalPages)],
      ['Pages with Open Graph', `${summary.withOpenGraph}/${summary.totalPages}`, this.getStatus(summary.withOpenGraph, summary.totalPages, 0.8)],
      ['Pages with Twitter Cards', `${summary.withTwitterCard}/${summary.totalPages}`, this.getStatus(summary.withTwitterCard, summary.totalPages, 0.8)],
      ['Pages with Canonical URL', `${summary.withCanonical}/${summary.totalPages}`, this.getStatus(summary.withCanonical, summary.totalPages, 0.8)],
      ['Pages with Structured Data', `${summary.withStructuredData}/${summary.totalPages}`, this.getStatus(summary.withStructuredData, summary.totalPages, 0.3)],
      ['Unique Descriptions', summary.uniqueDescriptions.size, summary.uniqueDescriptions.size >= summary.withDescription ? chalk.green('✓') : chalk.yellow('⚠')],
      ['Duplicate Descriptions', summary.duplicateDescriptions.length, summary.duplicateDescriptions.length === 0 ? chalk.green('✓') : chalk.yellow('⚠')],
      ['Avg Title Length', `${summary.avgTitleLength} chars`, this.getLengthStatus(summary.avgTitleLength, 50, 60)],
      ['Avg Description Length', `${summary.avgDescriptionLength} chars`, this.getLengthStatus(summary.avgDescriptionLength, 150, 160)]
    ];

    console.log(table(data, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼'
      }
    }));
  }

  printPageDetails(page, index) {
    console.log(chalk.bold.green(`┌${'─'.repeat(78)}┐`));
    console.log(chalk.bold.green(`│ ${index}. ${page.url.substring(0, 74).padEnd(74)} │`));
    console.log(chalk.bold.green(`└${'─'.repeat(78)}┘`));

    const { meta, checks } = page;

    if (meta.error) {
      console.log(chalk.red(`  ✗ Error: ${meta.message}\n`));
      return;
    }

    // Title
    if (meta.title) {
      console.log(chalk.cyan('  Title: ') + this.truncate(meta.title, 70));
      console.log(chalk.dim(`         (${meta.title.length} chars)`));
    } else {
      console.log(chalk.red('  Title: NOT SET'));
    }

    // Description
    if (meta.description) {
      console.log(chalk.cyan('  Meta Description: ') + this.truncate(meta.description, 70));
      console.log(chalk.dim(`                    (${meta.description.length} chars)`));
    } else {
      console.log(chalk.red('  Meta Description: NOT SET'));
    }

    // Open Graph
    if (meta.ogTitle && meta.ogDescription) {
      console.log(chalk.green('  ✓ Open Graph tags present'));
    } else {
      console.log(chalk.yellow('  ⚠ Open Graph tags missing or incomplete'));
    }

    // Twitter Cards
    if (meta.twitterCard) {
      console.log(chalk.green(`  ✓ Twitter Card: ${meta.twitterCard}`));
    } else {
      console.log(chalk.yellow('  ⚠ Twitter Card: NOT PRESENT'));
    }

    // Canonical
    if (meta.canonical) {
      console.log(chalk.green('  ✓ Canonical URL: ') + chalk.dim(this.truncate(meta.canonical, 50)));
    }

    // Structured Data
    if (page.structuredData && page.structuredData.length > 0) {
      const schemas = page.structuredData.map(sd => sd.schema).join(', ');
      console.log(chalk.green(`  ✓ Structured Data: ${schemas}`));
    }

    // Checks
    if (checks.errors.length > 0) {
      console.log(chalk.red('\n  Errors:'));
      checks.errors.forEach(error => console.log(chalk.red(`    ✗ ${error}`)));
    }

    if (checks.warnings.length > 0) {
      console.log(chalk.yellow('\n  Warnings:'));
      checks.warnings.forEach(warning => console.log(chalk.yellow(`    ⚠ ${warning}`)));
    }

    console.log();
  }

  printAssessment(summary) {
    console.log(chalk.bold.cyan(`\n${'═'.repeat(80)}`));
    console.log(chalk.bold.cyan('Overall Assessment'));
    console.log(chalk.bold.cyan(`${'═'.repeat(80)}\n`));

    const score = this.calculateScore(summary);

    if (score >= 90) {
      console.log(chalk.bold.green(`✓ Excellent SEO (${score}/100)`));
      console.log(chalk.green('  Your pages are well-optimized for search engines.\n'));
    } else if (score >= 70) {
      console.log(chalk.bold.yellow(`⚠ Good SEO (${score}/100)`));
      console.log(chalk.yellow('  Most pages are optimized, but there\'s room for improvement.\n'));
    } else {
      console.log(chalk.bold.red(`✗ Needs Improvement (${score}/100)`));
      console.log(chalk.red('  Several SEO issues need attention.\n'));
    }

    // Recommendations
    const recommendations = this.getRecommendations(summary);
    if (recommendations.length > 0) {
      console.log(chalk.bold.blue('Recommendations:\n'));
      recommendations.forEach((rec, i) => {
        console.log(chalk.blue(`  ${i + 1}. ${rec}`));
      });
      console.log();
    }
  }

  generateComparison(comparison) {
    console.log(chalk.bold.yellow(`\nComparing:`));
    console.log(chalk.yellow(`  Environment 1: ${comparison.env1}`));
    console.log(chalk.yellow(`  Environment 2: ${comparison.env2}\n`));

    console.log(chalk.bold.cyan('Summary:'));
    console.log(chalk.cyan(`  Total pages compared: ${comparison.summary.total}`));
    console.log(chalk.green(`  Improved: ${comparison.summary.improved}`));
    console.log(chalk.red(`  Degraded: ${comparison.summary.degraded}`));
    console.log(chalk.dim(`  Unchanged: ${comparison.summary.unchanged}\n`));

    if (comparison.changes.length > 0) {
      console.log(chalk.bold.yellow(`${'═'.repeat(80)}`));
      console.log(chalk.bold.yellow('Changes Detected'));
      console.log(chalk.bold.yellow(`${'═'.repeat(80)}\n`));

      for (const change of comparison.changes.slice(0, 10)) {
        this.printChange(change);
      }

      if (comparison.changes.length > 10) {
        console.log(chalk.dim(`\n... and ${comparison.changes.length - 10} more changes\n`));
      }
    }
  }

  printChange(change) {
    console.log(chalk.bold(change.url));

    if (change.type === 'added') {
      console.log(chalk.green(`  + ${change.message}\n`));
      return;
    }

    if (change.type === 'removed') {
      console.log(chalk.red(`  - ${change.message}\n`));
      return;
    }

    for (const fieldChange of change.changes) {
      console.log(chalk.cyan(`  ${fieldChange.field}:`));
      console.log(chalk.red(`    - ${this.truncate(fieldChange.before, 70)}`));
      console.log(chalk.green(`    + ${this.truncate(fieldChange.after, 70)}`));
    }
    console.log();
  }

  generateGitComparison(results) {
    console.log(chalk.blue(`Files changed: ${results.changedFiles.length}`));
    console.log(chalk.blue(`Environment: ${results.environment}`));
    console.log(chalk.blue(`URL: ${results.url}\n`));

    if (results.changedFiles.length === 0) {
      console.log(chalk.yellow('No SEO-relevant files changed.\n'));
      return;
    }

    console.log(chalk.bold.yellow(`${'═'.repeat(80)}`));
    console.log(chalk.bold.yellow('SEO-Relevant File Changes'));
    console.log(chalk.bold.yellow(`${'═'.repeat(80)}\n`));

    for (const file of results.changedFiles) {
      console.log(chalk.cyan(`  • ${file}`));
    }
    console.log();

    if (results.currentState) {
      console.log(chalk.bold.cyan('Current SEO State:\n'));
      this.printSummary(results.currentState.summary);
    }
  }

  getStatus(value, total, threshold = 0.95) {
    const ratio = value / total;
    if (ratio >= threshold) return chalk.green('✓ Good');
    if (ratio >= threshold * 0.8) return chalk.yellow('⚠ Fair');
    return chalk.red('✗ Poor');
  }

  getLengthStatus(length, min, max) {
    if (length >= min && length <= max) return chalk.green('✓ Good');
    if (length >= min * 0.8 && length <= max * 1.2) return chalk.yellow('⚠ Acceptable');
    return chalk.red('✗ Out of range');
  }

  calculateScore(summary) {
    let score = 0;

    // Basic meta tags (40 points)
    score += (summary.withTitle / summary.totalPages) * 20;
    score += (summary.withDescription / summary.totalPages) * 20;

    // Social tags (30 points)
    score += (summary.withOpenGraph / summary.totalPages) * 15;
    score += (summary.withTwitterCard / summary.totalPages) * 15;

    // Technical SEO (20 points)
    score += (summary.withCanonical / summary.totalPages) * 10;
    score += (summary.withStructuredData / summary.totalPages) * 10;

    // Quality (10 points)
    if (summary.duplicateDescriptions.length === 0) score += 5;
    if (summary.avgTitleLength >= 50 && summary.avgTitleLength <= 60) score += 3;
    if (summary.avgDescriptionLength >= 150 && summary.avgDescriptionLength <= 160) score += 2;

    return Math.round(score);
  }

  getRecommendations(summary) {
    const recommendations = [];

    if (summary.withDescription < summary.totalPages) {
      recommendations.push(`Add meta descriptions to ${summary.totalPages - summary.withDescription} pages`);
    }

    if (summary.duplicateDescriptions.length > 0) {
      recommendations.push(`Fix ${summary.duplicateDescriptions.length} duplicate meta descriptions`);
    }

    if (summary.withTwitterCard < summary.totalPages * 0.8) {
      recommendations.push('Add Twitter Card tags for better social sharing');
    }

    if (summary.withStructuredData < summary.totalPages * 0.3) {
      recommendations.push('Add Schema.org structured data for rich snippets');
    }

    if (summary.avgTitleLength < 50 || summary.avgTitleLength > 60) {
      recommendations.push(`Optimize title lengths (current avg: ${summary.avgTitleLength}, target: 50-60)`);
    }

    if (summary.avgDescriptionLength < 150 || summary.avgDescriptionLength > 160) {
      recommendations.push(`Optimize description lengths (current avg: ${summary.avgDescriptionLength}, target: 150-160)`);
    }

    return recommendations;
  }

  truncate(str, maxLength) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }
}

module.exports = ConsoleReporter;
