const { execSync } = require('child_process');
const path = require('path');

class GitIntegration {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  exec(command) {
    try {
      return execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
    } catch (error) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  async getChangedFiles(commit1, commit2 = 'HEAD') {
    const output = this.exec(`git diff --name-only ${commit1} ${commit2}`);
    return output.split('\n').filter(Boolean);
  }

  async getFileDiff(commit1, commit2, file) {
    try {
      const diff = this.exec(`git diff ${commit1} ${commit2} -- "${file}"`);
      return diff;
    } catch (error) {
      return null;
    }
  }

  async getCommitInfo(commit) {
    const hash = this.exec(`git rev-parse --short ${commit}`);
    const message = this.exec(`git log -1 --pretty=%B ${commit}`);
    const author = this.exec(`git log -1 --pretty=%an ${commit}`);
    const date = this.exec(`git log -1 --pretty=%ai ${commit}`);

    return {
      hash,
      message: message.split('\n')[0],
      author,
      date
    };
  }

  async getCurrentBranch() {
    return this.exec('git rev-parse --abbrev-ref HEAD');
  }

  async isGitRepo() {
    try {
      this.exec('git rev-parse --git-dir');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getFileContent(commit, file) {
    try {
      return this.exec(`git show ${commit}:${file}`);
    } catch (error) {
      return null;
    }
  }

  async getSEORelevantChanges(commit1, commit2) {
    const changedFiles = await this.getChangedFiles(commit1, commit2);

    const seoFiles = changedFiles.filter(file => {
      return (
        file.includes('templates/') ||
        file.includes('translations/') ||
        file.includes('public/robots.txt') ||
        file.includes('public/sitemap') ||
        file.endsWith('.twig') ||
        file.includes('messages.') && file.endsWith('.yml')
      );
    });

    const changes = [];

    for (const file of seoFiles) {
      const diff = await this.getFileDiff(commit1, commit2, file);
      if (diff) {
        changes.push({
          file,
          type: this.detectChangeType(file),
          diff: this.parseDiff(diff),
          rawDiff: diff
        });
      }
    }

    return changes;
  }

  detectChangeType(file) {
    if (file.includes('translations/')) return 'translation';
    if (file.includes('templates/')) return 'template';
    if (file.includes('robots.txt')) return 'robots';
    if (file.includes('sitemap')) return 'sitemap';
    return 'other';
  }

  parseDiff(diff) {
    const lines = diff.split('\n');
    const changes = {
      additions: [],
      deletions: [],
      context: []
    };

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        changes.additions.push(line.substring(1));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        changes.deletions.push(line.substring(1));
      } else if (!line.startsWith('@@') && !line.startsWith('diff')) {
        changes.context.push(line);
      }
    }

    return changes;
  }

  async analyzeTranslationChanges(commit1, commit2) {
    const changes = await this.getSEORelevantChanges(commit1, commit2);
    const translationChanges = changes.filter(c => c.type === 'translation');

    const results = {
      files: translationChanges.length,
      newKeys: [],
      modifiedKeys: [],
      deletedKeys: []
    };

    for (const change of translationChanges) {
      // Extract SEO-related keys from additions
      for (const line of change.diff.additions) {
        const match = line.match(/^\s*([a-zA-Z.]+):\s*["'](.*)["']/);
        if (match && this.isSEOKey(match[1])) {
          results.newKeys.push({
            key: match[1],
            value: match[2],
            file: change.file
          });
        }
      }

      // Extract modified/deleted keys
      for (const line of change.diff.deletions) {
        const match = line.match(/^\s*([a-zA-Z.]+):\s*["'](.*)["']/);
        if (match && this.isSEOKey(match[1])) {
          // Check if it's modified (same key in additions) or deleted
          const modified = results.newKeys.some(k => k.key === match[1]);
          if (modified) {
            results.modifiedKeys.push({
              key: match[1],
              oldValue: match[2],
              file: change.file
            });
          } else {
            results.deletedKeys.push({
              key: match[1],
              value: match[2],
              file: change.file
            });
          }
        }
      }
    }

    return results;
  }

  isSEOKey(key) {
    const seoKeywords = ['seo', 'meta', 'title', 'description', 'og', 'twitter'];
    const lowerKey = key.toLowerCase();
    return seoKeywords.some(keyword => lowerKey.includes(keyword));
  }
}

module.exports = GitIntegration;
