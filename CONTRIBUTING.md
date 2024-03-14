# Contributing to SEO Scout

Thank you for your interest in contributing to SEO Scout!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/seo-scout.git
cd seo-scout

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint
```

## Project Structure

```
seo-scout/
├── bin/              # CLI entry point
├── src/
│   ├── analyzer/     # Analysis modules (sitemap, meta-tags, lighthouse, etc.)
│   ├── integrations/ # Framework integrations (Symfony, Git)
│   ├── reporters/    # Output formatters (console, JSON, CSV, HTML)
│   └── index.js      # Main orchestrator
└── tests/            # Test suite
```

## Adding a New Analyzer

1. Create a new file in `src/analyzer/`
2. Implement the analyzer class:

```javascript
class MyAnalyzer {
  async analyze(url) {
    // Your analysis logic
    return {
      // Results
    };
  }
}

module.exports = MyAnalyzer;
```

3. Register it in `src/index.js`
4. Add tests in `tests/analyzer/`

## Adding a New Reporter

1. Create a new file in `src/reporters/`
2. Implement the reporter class:

```javascript
class MyReporter {
  async generate(results, options = {}) {
    // Format results
    return output;
  }
}

module.exports = MyReporter;
```

3. Register it in `src/index.js`
4. Add tests in `tests/reporters/`

## Code Style

- Use 2 spaces for indentation
- Use `const` and `let`, avoid `var`
- Use async/await instead of callbacks
- Add JSDoc comments for public methods
- Follow existing patterns in the codebase

## Testing

- Write tests for all new features
- Ensure existing tests pass: `npm test`
- Aim for >80% code coverage

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests
5. Run tests and linter
6. Commit with descriptive messages
7. Push to your fork
8. Open a Pull Request

## Commit Messages

Follow conventional commits:

- `feat: add new feature`
- `fix: fix bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: refactor code`
- `chore: update dependencies`

## Reporting Issues

- Use GitHub Issues
- Provide clear description
- Include steps to reproduce
- Attach error messages and logs

## Questions?

Open a discussion on GitHub Discussions or reach out to the maintainers.
