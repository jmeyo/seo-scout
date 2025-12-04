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
```

Key flags:
- `--env <env>`: use Symfony env (`dev|staging|prod`) to auto-detect base URL
- `--random <n>`: randomly sample N pages from sitemap (unbiased selection)
- `--match <substr...>`: only URLs containing these substrings (case-insensitive)
- `--limit <n>`: limit number of pages (first N after filtering)
- `--delay <ms>`: throttle between page requests
- `--fail-on-errors`: exit non-zero if any page errors (4xx/5xx)
- `--format <console|json|csv|html>` + `--output <file>`: choose reporter/output

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
