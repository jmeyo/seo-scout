# SEO Scout

> Comprehensive SEO analysis tool with Symfony integration, git comparison, and Lighthouse audits

## Features

### Core Analysis
- **Sitemap Parsing** - Automatically discover all pages from sitemap.xml
- **Meta Tag Extraction** - Title, description, Open Graph, Twitter Cards, canonical, hreflang
- **Structured Data** - Parse and validate Schema.org JSON-LD
- **Lighthouse Integration** - Performance, SEO, accessibility, best practices scores

### Advanced Features
- **Git Comparison** - Compare SEO changes between commits
- **Symfony Integration** - Read URLs from .env files (dev/staging/prod)
- **Multi-Format Output** - Console (colored), JSON, CSV, HTML reports
- **Batch Analysis** - Analyze entire site or specific pages
- **Custom Checks** - Extensible plugin system

## Installation

```bash
cd seo-scout
npm install
```

## Usage

### Basic Analysis

```bash
# Analyze site from sitemap
./bin/seo-scout.js analyze https://gaylovespirit.org

# Analyze specific page
./bin/seo-scout.js analyze https://gaylovespirit.org/calendar/en --single

# With Lighthouse audit
./bin/seo-scout.js analyze https://gaylovespirit.org --lighthouse
```

### Symfony Integration

```bash
# Auto-detect URL from .env files
./bin/seo-scout.js analyze --env staging

# Compare with production
./bin/seo-scout.js compare --env staging --compare-env prod
```

### Git Comparison

```bash
# Compare current vs previous commit
./bin/seo-scout.js git-compare HEAD HEAD~1

# Compare specific commits
./bin/seo-scout.js git-compare abc123 def456
```

### Output Formats

```bash
# JSON export
./bin/seo-scout.js analyze https://example.com --format json --output report.json

# CSV export
./bin/seo-scout.js analyze https://example.com --format csv --output report.csv

# HTML report
./bin/seo-scout.js analyze https://example.com --format html --output report.html
```

## Examples

### Quick SEO Check

```bash
# Check all main pages
./bin/seo-scout.js analyze https://gaylovespirit.org
```

**Output:**
```
╔════════════════════════════════════════════════════════════════╗
║                    SEO Scout Analysis                          ║
╚════════════════════════════════════════════════════════════════╝

Site: https://gaylovespirit.org
Pages analyzed: 47
Generated: 2025-11-28

┌─────────────────────────────────────────────────────────────────┐
│ Homepage (/)                                                     │
├─────────────────────────────────────────────────────────────────┤
│ Title: Gay Tantra Workshops & Retreats for Men | Gay Love...   │
│ Meta Description: Discover tantra workshops, retreats, and...  │
│ Open Graph: ✓ Present                                          │
│ Twitter Card: ✓ summary_large_image                            │
│ Canonical: ✓ https://gaylovespirit.org/                        │
│ Schema.org: ✓ Organization                                     │
└─────────────────────────────────────────────────────────────────┘

✓ 45 pages have unique meta descriptions
⚠ 2 pages have duplicate descriptions
✓ All pages have valid titles
✓ Twitter Cards present on all pages
```

### Git Comparison Workflow

```bash
# Before deploying SEO changes
./bin/seo-scout.js git-compare HEAD~1 HEAD --env staging
```

**Output:**
```
Comparing SEO changes: abc123 → def456

╔════════════════════════════════════════════════════════════════╗
║ Changed Pages: 8                                               ║
╚════════════════════════════════════════════════════════════════╝

Homepage (/)
  Title:
    - Before: Gay Love Spirit - Gay Love Spirit (DE)
    + After:  Gay Tantra Workshops & Retreats for Men | Gay Love Spirit

  Meta Description:
    - Before: An international network of trainers and healers
    + After:  Discover tantra workshops, retreats, and events for gay...

  Twitter Card:
    - Before: NOT PRESENT
    + After:  ✓ summary_large_image

Summary:
  ✓ 8 pages improved
  ✓ 0 pages degraded
  → Ready for deployment
```

## Configuration

Create `.seo-scout.json` in your project root:

```json
{
  "sitemapUrl": "https://gaylovespirit.org/sitemap.xml",
  "symfony": {
    "envPath": "../",
    "environments": ["dev", "staging", "prod"]
  },
  "lighthouse": {
    "enabled": false,
    "categories": ["seo", "performance", "accessibility"]
  },
  "checks": {
    "metaDescriptionLength": [150, 160],
    "titleLength": [50, 60],
    "requireTwitterCards": true,
    "requireOpenGraph": true
  },
  "ignore": {
    "paths": ["/admin/*", "/backend/*"],
    "patterns": ["/_profiler/*"]
  }
}
```

## Architecture

### Analyzers
- `sitemap.js` - Parse sitemap.xml, extract URLs
- `meta-tags.js` - Extract all SEO-related meta tags
- `lighthouse.js` - Run Lighthouse audits (optional)
- `structured-data.js` - Parse Schema.org JSON-LD

### Integrations
- `symfony.js` - Read Symfony .env files with proper precedence
- `git.js` - Compare SEO data across git commits

### Reporters
- `console.js` - Colored terminal output with tables
- `json.js` - Structured JSON export
- `csv.js` - CSV export for spreadsheet analysis
- `html.js` - Interactive HTML report

## Development

### Project Structure

```
seo-scout/
├── bin/
│   └── seo-scout.js          # CLI entry point
├── src/
│   ├── analyzer/             # Analysis modules
│   ├── integrations/         # Symfony, Git integration
│   ├── reporters/            # Output formatters
│   └── index.js              # Main orchestrator
├── tests/                    # Test suite
└── package.json
```

### Adding Custom Checks

Create a plugin in `src/plugins/`:

```javascript
// src/plugins/custom-check.js
module.exports = {
  name: 'custom-check',
  async analyze(page, html) {
    // Your custom logic
    return {
      passed: true,
      message: 'Check passed'
    };
  }
};
```

## Comparison with Other Tools

| Feature | SEO Scout | site-audit-seo | Lighthouse | SEOnaut |
|---------|-----------|----------------|------------|---------|
| Sitemap parsing | ✓ | ✓ | ✗ | ✓ |
| Meta tag extraction | ✓ | ✓ | Partial | ✓ |
| Lighthouse integration | ✓ | ✓ | ✓ | ✗ |
| Git comparison | ✓ | ✗ | ✗ | ✗ |
| Symfony .env integration | ✓ | ✗ | ✗ | ✗ |
| Multiple output formats | ✓ | ✓ | ✓ | ✓ |
| Zero config | ✓ | Partial | ✗ | ✗ |

## License

MIT

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Roadmap

- [ ] v1.0 - Core features (meta tags, sitemap, git comparison)
- [ ] v1.1 - Lighthouse integration
- [ ] v1.2 - HTML report generator
- [ ] v1.3 - Plugin system
- [ ] v2.0 - Web UI dashboard
