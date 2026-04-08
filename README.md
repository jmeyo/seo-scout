# SEO Scout

Node.js CLI to crawl a site (via sitemap or single URL), extract meta/OG/Twitter/schema data, run SEO checks, and export JSON/CSV/HTML. Includes Symfony env integration, URL filtering, throttling, and environment comparison.

## Install
```bash
cd seo-scout
npm install
```

## Quick start
```bash
# Random sampling - quick health check (20 random pages)
./bin/seo-scout.js analyze --env staging --random 20 --delay 100

# Analyze staging (auto URL from .env.staging), limit pages, throttle
./bin/seo-scout.js analyze --env staging --limit 15 --delay 300

# Full sitemap
./bin/seo-scout.js analyze --env staging

# Compare staging vs prod
./bin/seo-scout.js compare --env staging --compare-env prod --format json --output comparison.json

# Git compare (before/after)
./bin/seo-scout.js git-compare HEAD~1 HEAD --env staging --format json --output git-diff.json

# HTML report (easy to read in a browser)
./bin/seo-scout.js analyze https://example.com --format html --output reports/seo-report.html

# Direct PDF report (clean print layout)
./bin/seo-scout.js analyze https://example.com --format pdf --output reports/seo-report.pdf

# Short HTML summary (no per-page detail cards)
./bin/seo-scout.js analyze https://example.com --format html --summary --output reports/seo-summary.html

# Client-friendly summary report (auto: HTML + summary + max-pages 20)
./bin/seo-scout.js analyze https://example.com --client-report --output reports/seo-client-summary.html

# Keep details but cap report size
./bin/seo-scout.js analyze https://example.com --format html --max-pages 40 --output reports/seo-report-short.html

# Convert an existing JSON report to HTML (no re-crawl)
./bin/seo-scout.js render reports/seo-example-2026-02-24T14-13-38.json --format html --output reports/seo-report.html

# Convert existing JSON to compact summary
./bin/seo-scout.js render reports/seo-example-2026-02-24T14-13-38.json --format html --summary --output reports/seo-summary.html

# Convert existing JSON to client-friendly summary
./bin/seo-scout.js render reports/seo-example-2026-02-24T14-13-38.json --client-report --output reports/seo-client-summary.html

# Convert existing JSON directly to PDF (no recrawl)
./bin/seo-scout.js render reports/seo-example-2026-02-24T14-13-38.json --format pdf --output reports/seo-report.pdf
```

Key flags:
- `--env <env>`: use Symfony env (`dev|staging|prod`) to auto-detect base URL
- `--random <n>`: randomly sample N pages from sitemap (unbiased selection)
- `--match <substr...>`: only URLs containing these substrings (case-insensitive)
- `--limit <n>`: limit number of pages (first N after filtering)
- `--delay <ms>`: throttle between page requests
- `--fail-on-errors`: exit non-zero if any page errors (4xx/5xx)
- `--format <console|json|csv|html|pdf>` + `--output <file>`: choose reporter/output
- `--summary`: shorter report view (HTML: hide detailed cards, CSV: keep only pages with issues)
- `--max-pages <n>`: cap number of rows/cards included in CSV/HTML details
- `--client-report`: client-facing mode (plain-language summary, compact HTML; implies `--summary`, default `--max-pages 20`)

HTML output notes:
- HTML output is a single, self-contained file (inline CSS).
- Open it in a browser (or share it as an attachment).
- The same layout includes print CSS for cleaner browser “Save as PDF”.

## What it checks
- Meta: title, description, keywords (length/uniqueness), canonical, robots, viewport
- Social: Open Graph, Twitter Card (title/description/image)
- Structured data: Schema.org JSON-LD
- Tech: status codes, redirects, hreflang, charset
- Optional: Lighthouse audits (`--lighthouse`)

## JSON shape (excerpt)
```json
{
  "url": "https://example.com",
  "timestamp": "...",
  "options": { "limit": 15, "match": ["contact"] },
  "pages": [
    {
      "url": "https://example.com/en/contact",
      "meta": { "title": "...", "description": "...", "keywords": "...", "canonical": "..." },
      "structuredData": [ { "schema": "Organization", "data": { ... } } ],
      "checks": { "passed": [...], "warnings": [...], "errors": [...] }
    }
  ],
  "errors": [
    { "url": "https://example.com/bad", "status": 404, "message": "HTTP 404: Not Found" }
  ],
  "summary": { ... }
}
```

## Development
```bash
npm test      # add tests in tests/
npm run lint  # if lint config present
```

## License
MIT
