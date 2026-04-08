class CsvReporter {
  async generate(results, options = {}) {
    if (!results.pages) {
      throw new Error('CSV export requires page-level data');
    }

    const summaryMode = Boolean(options.summary);
    const maxPages = Number.isInteger(options.maxPages) && options.maxPages > 0
      ? options.maxPages
      : null;

    const headers = [
      'URL',
      'Status',
      'Error Type',
      'Title',
      'Title Length',
      'Meta Description',
      'Description Length',
      'OG Title',
      'OG Description',
      'Twitter Card',
      'Canonical',
      'Has Structured Data',
      'Errors',
      'Warnings',
      'Last Modified'
    ];

    const rows = [headers];

    let pages = results.pages;
    if (summaryMode) {
      pages = pages.filter(page => {
        if (!page || !page.meta || page.meta.error) {
          return true;
        }
        const checks = page.checks || { errors: [], warnings: [] };
        return checks.errors.length > 0 || checks.warnings.length > 0;
      });
    }

    if (maxPages) {
      pages = pages.slice(0, maxPages);
    }

    for (const page of pages) {
      const { url, meta, checks, structuredData, lastmod } = page;

      if (meta.error) {
        const errorType = meta.statusCode ? `HTTP ${meta.statusCode}` : 'Connection Error';
        rows.push([
          url,
          'FAILED',
          errorType,
          'ERROR',
          '',
          meta.message || '',
          '',
          '',
          '',
          '',
          '',
          '',
          '1',
          '0',
          lastmod || ''
        ]);
        continue;
      }

      rows.push([
        url,
        'OK',
        '',
        this.escape(meta.title || ''),
        meta.title ? meta.title.length : 0,
        this.escape(meta.description || ''),
        meta.description ? meta.description.length : 0,
        this.escape(meta.ogTitle || ''),
        this.escape(meta.ogDescription || ''),
        meta.twitterCard || '',
        meta.canonical || '',
        (structuredData && structuredData.length > 0) ? 'Yes' : 'No',
        checks.errors.length,
        checks.warnings.length,
        lastmod || ''
      ]);
    }

    return rows.map(row => row.map(cell => this.escapeCsvCell(cell)).join(',')).join('\n');
  }

  escape(str) {
    if (!str) return '';
    return str.replace(/"/g, '""');
  }

  escapeCsvCell(cell) {
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${this.escape(str)}"`;
    }
    return str;
  }
}

module.exports = CsvReporter;
