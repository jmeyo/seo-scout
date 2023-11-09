const fs = require('fs').promises;
const path = require('path');

class SymfonyIntegration {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  async getBaseUrl(environment = 'dev') {
    const envVars = await this.loadDotenv(environment);

    // Try SITE_BASE_URL first
    if (envVars.SITE_BASE_URL) {
      return envVars.SITE_BASE_URL;
    }

    // Construct from APP_BASE_SCHEME + SITE_BASE_HOST
    if (envVars.APP_BASE_SCHEME && envVars.SITE_BASE_HOST) {
      return `${envVars.APP_BASE_SCHEME}://${envVars.SITE_BASE_HOST}`;
    }

    throw new Error(`Could not determine base URL for environment: ${environment}`);
  }

  async loadDotenv(environment) {
    const envVars = {};

    // Files in precedence order (Symfony convention)
    const envFiles = [
      '.env',
      '.env.local',
      `.env.${environment}`,
      `.env.${environment}.local`
    ];

    for (const file of envFiles) {
      const filePath = path.join(this.projectRoot, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = this.parseDotenv(content, envVars);
        Object.assign(envVars, parsed);
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    return envVars;
  }

  parseDotenv(content, existingVars = {}) {
    const vars = { ...existingVars };
    const lines = content.split('\n');

    for (let line of lines) {
      // Skip comments and empty lines
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      // Remove 'export ' prefix if present
      line = line.replace(/^export\s+/, '');

      // Match KEY=VALUE pattern
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      let [, key, value] = match;

      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');

      // Perform variable substitution
      value = value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, varName) => {
        return vars[varName] || process.env[varName] || '';
      });

      value = value.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, varName) => {
        return vars[varName] || process.env[varName] || '';
      });

      vars[key] = value;
    }

    return vars;
  }

  async getBlogUrl(environment = 'dev') {
    const envVars = await this.loadDotenv(environment);

    if (envVars.BLOG_BASE_URL) {
      return envVars.BLOG_BASE_URL;
    }

    if (envVars.APP_BASE_SCHEME && envVars.BLOG_BASE_HOST) {
      return `${envVars.APP_BASE_SCHEME}://${envVars.BLOG_BASE_HOST}`;
    }

    return null;
  }

  async getAllUrls(environment = 'dev') {
    const urls = {};

    urls.base = await this.getBaseUrl(environment);

    try {
      urls.blog = await this.getBlogUrl(environment);
    } catch (error) {
      // Blog URL optional
    }

    return urls;
  }
}

module.exports = SymfonyIntegration;
