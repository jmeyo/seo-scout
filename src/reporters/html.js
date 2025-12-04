class HtmlReporter {
  async generate(results, options = {}) {
    const { url, timestamp, pages, summary } = results;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Scout Report - ${url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
    }
    .header h1 { font-size: 2em; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stat-card h3 {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }
    .stat-card .label {
      font-size: 0.9em;
      color: #999;
      margin-top: 5px;
    }
    .stat-good { color: #28a745 !important; }
    .stat-warning { color: #ffc107 !important; }
    .stat-error { color: #dc3545 !important; }
    .pages {
      padding: 40px;
    }
    .pages h2 {
      margin-bottom: 30px;
      color: #333;
    }
    .page-card {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .page-card.error { border-left-color: #dc3545; }
    .page-card.warning { border-left-color: #ffc107; }
    .page-url {
      font-weight: bold;
      color: #667eea;
      margin-bottom: 15px;
      word-break: break-all;
    }
    .meta-field {
      margin-bottom: 10px;
    }
    .meta-field label {
      display: inline-block;
      width: 150px;
      color: #666;
      font-size: 0.9em;
    }
    .meta-field value {
      color: #333;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.85em;
      font-weight: 500;
    }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-error { background: #f8d7da; color: #721c24; }
    .checks {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #dee2e6;
    }
    .check-item {
      font-size: 0.9em;
      padding: 3px 0;
    }
    .check-item.error { color: #dc3545; }
    .check-item.warning { color: #ffc107; }
    .check-item.passed { color: #28a745; }
    .footer {
      background: #f8f9fa;
      padding: 20px 40px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #495057;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SEO Scout Report</h1>
      <p><strong>Site:</strong> ${url}</p>
      <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
      <p><strong>Pages Analyzed:</strong> ${pages.length}</p>
    </div>

    <div class="summary">
      <div class="stat-card">
        <h3>Pages with Title</h3>
        <div class="value ${this.getStatusClass(summary.withTitle, summary.totalPages)}">${summary.withTitle}/${summary.totalPages}</div>
        <div class="label">${this.getPercentage(summary.withTitle, summary.totalPages)}%</div>
      </div>
      <div class="stat-card">
        <h3>Pages with Description</h3>
        <div class="value ${this.getStatusClass(summary.withDescription, summary.totalPages)}">${summary.withDescription}/${summary.totalPages}</div>
        <div class="label">${this.getPercentage(summary.withDescription, summary.totalPages)}%</div>
      </div>
      <div class="stat-card">
        <h3>Open Graph Tags</h3>
        <div class="value ${this.getStatusClass(summary.withOpenGraph, summary.totalPages, 0.8)}">${summary.withOpenGraph}/${summary.totalPages}</div>
        <div class="label">${this.getPercentage(summary.withOpenGraph, summary.totalPages)}%</div>
      </div>
      <div class="stat-card">
        <h3>Twitter Cards</h3>
        <div class="value ${this.getStatusClass(summary.withTwitterCard, summary.totalPages, 0.8)}">${summary.withTwitterCard}/${summary.totalPages}</div>
        <div class="label">${this.getPercentage(summary.withTwitterCard, summary.totalPages)}%</div>
      </div>
      <div class="stat-card">
        <h3>Avg Title Length</h3>
        <div class="value">${summary.avgTitleLength}</div>
        <div class="label">chars (target: 50-60)</div>
      </div>
      <div class="stat-card">
        <h3>Avg Description Length</h3>
        <div class="value">${summary.avgDescriptionLength}</div>
        <div class="label">chars (target: 150-160)</div>
      </div>
      <div class="stat-card">
        <h3>Duplicate Descriptions</h3>
        <div class="value ${summary.duplicateDescriptions.length === 0 ? 'stat-good' : 'stat-warning'}">${summary.duplicateDescriptions.length}</div>
        <div class="label">${summary.duplicateDescriptions.length === 0 ? 'None found' : 'Need attention'}</div>
      </div>
      <div class="stat-card">
        <h3>Structured Data</h3>
        <div class="value ${this.getStatusClass(summary.withStructuredData, summary.totalPages, 0.3)}">${summary.withStructuredData}/${summary.totalPages}</div>
        <div class="label">${this.getPercentage(summary.withStructuredData, summary.totalPages)}%</div>
      </div>
    </div>

    ${results.errors && results.errors.length > 0 ? this.renderErrorSection(results.errors) : ''}

    ${summary.duplicateDescriptions.length > 0 ? `
    <div class="pages">
      <h2>Duplicate Descriptions</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${summary.duplicateDescriptions.map(dup => `
          <tr>
            <td>${this.escape(dup.description)}</td>
            <td><span class="badge badge-warning">${dup.count} pages</span></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="pages">
      <h2>Page Details</h2>
      ${pages.map(page => this.renderPage(page)).join('')}
    </div>

    <div class="footer">
      <p>Generated by <strong>SEO Scout</strong> &mdash; Comprehensive SEO Analysis Tool</p>
      <p>For more information, visit <a href="https://github.com/seo-scout">github.com/seo-scout</a></p>
    </div>
  </div>
</body>
</html>
    `;

    return html.trim();
  }

  renderErrorSection(errors) {
    // Group errors by status code
    const errorsByType = {};
    errors.forEach(error => {
      const key = error.status ? `HTTP ${error.status}` : 'Connection Error';
      if (!errorsByType[key]) {
        errorsByType[key] = [];
      }
      errorsByType[key].push(error);
    });

    return `
    <div class="pages" style="background: #fff3cd; padding: 30px; border-left: 4px solid #dc3545;">
      <h2 style="color: #dc3545; margin-bottom: 20px;">⚠ Errors Found: ${errors.length} pages failed</h2>
      ${Object.keys(errorsByType).sort().map(errorType => {
        const errorList = errorsByType[errorType];
        const badgeClass = errorType.includes('404') ? 'badge-warning' :
                          errorType.includes('500') || errorType.includes('503') ? 'badge-error' : 'badge-error';

        return `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #721c24; margin-bottom: 10px;">
            <span class="badge ${badgeClass}" style="font-size: 1em; padding: 5px 12px;">${errorType}</span>
            <span style="font-size: 0.9em; font-weight: normal; margin-left: 10px;">${errorList.length} page(s)</span>
          </h3>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>URL</th>
                <th style="width: 200px;">Details</th>
              </tr>
            </thead>
            <tbody>
              ${errorList.map((error, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td style="word-break: break-all;">${this.escape(error.url)}</td>
                <td><span class="badge ${badgeClass}">${error.status || 'Error'}</span></td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        `;
      }).join('')}
    </div>
    `;
  }

  renderPage(page) {
    const { url, meta, checks, structuredData } = page;

    if (meta.error) {
      return `
      <div class="page-card error">
        <div class="page-url">${this.escape(url)}</div>
        <div class="meta-field">
          <span class="badge badge-error">Error: ${this.escape(meta.message)}</span>
        </div>
      </div>
      `;
    }

    const hasErrors = checks.errors.length > 0;
    const hasWarnings = checks.warnings.length > 0;
    const cardClass = hasErrors ? 'error' : (hasWarnings ? 'warning' : '');

    return `
    <div class="page-card ${cardClass}">
      <div class="page-url">${this.escape(url)}</div>

      <div class="meta-field">
        <label>Title:</label>
        <value>${this.escape(meta.title || 'NOT SET')} ${meta.title ? `(${meta.title.length} chars)` : ''}</value>
      </div>

      <div class="meta-field">
        <label>Description:</label>
        <value>${this.escape(meta.description || 'NOT SET')} ${meta.description ? `(${meta.description.length} chars)` : ''}</value>
      </div>

      <div class="meta-field">
        <label>Open Graph:</label>
        ${meta.ogTitle && meta.ogDescription ? '<span class="badge badge-success">Present</span>' : '<span class="badge badge-warning">Missing</span>'}
      </div>

      <div class="meta-field">
        <label>Twitter Card:</label>
        ${meta.twitterCard ? `<span class="badge badge-success">${meta.twitterCard}</span>` : '<span class="badge badge-warning">Missing</span>'}
      </div>

      ${meta.canonical ? `
      <div class="meta-field">
        <label>Canonical:</label>
        <value>${this.escape(meta.canonical)}</value>
      </div>
      ` : ''}

      ${structuredData && structuredData.length > 0 ? `
      <div class="meta-field">
        <label>Structured Data:</label>
        ${structuredData.map(sd => `<span class="badge badge-success">${sd.schema}</span>`).join(' ')}
      </div>
      ` : ''}

      ${(checks.errors.length > 0 || checks.warnings.length > 0 || checks.passed.length > 0) ? `
      <div class="checks">
        ${checks.errors.map(error => `<div class="check-item error">✗ ${this.escape(error)}</div>`).join('')}
        ${checks.warnings.map(warning => `<div class="check-item warning">⚠ ${this.escape(warning)}</div>`).join('')}
        ${checks.passed.length > 0 ? `<div class="check-item passed">✓ ${checks.passed.length} checks passed</div>` : ''}
      </div>
      ` : ''}
    </div>
    `;
  }

  getStatusClass(value, total, threshold = 0.95) {
    const ratio = value / total;
    if (ratio >= threshold) return 'stat-good';
    if (ratio >= threshold * 0.8) return 'stat-warning';
    return 'stat-error';
  }

  getPercentage(value, total) {
    return Math.round((value / total) * 100);
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = HtmlReporter;
