class JsonReporter {
  async generate(results, options = {}) {
    return JSON.stringify(results, null, 2);
  }
}

module.exports = JsonReporter;
