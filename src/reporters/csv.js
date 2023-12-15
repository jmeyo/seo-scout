class CsvReporter {
  async generate(results, options = {}) {
    if (!results.pages) {
      throw new Error('CSV export requires page-level data');
    }

    const headers = [
      'URL',
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

    for (const page of results.pages) {
      const { url, meta, checks, structuredData, lastmod } = page;

      if (meta.error) {
        rows.push([
          url,
          'ERROR',
          '',
          meta.message,
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
