const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const puppeteer = require('puppeteer');
const HtmlReporter = require('./html');

class PdfReporter {
  constructor() {
    this.htmlReporter = new HtmlReporter();
  }

  async generate(results, options = {}) {
    const html = await this.htmlReporter.generate(results, options);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let tempFilePath;
    try {
      const page = await browser.newPage();

      tempFilePath = path.join(os.tmpdir(), `seo-scout-${Date.now()}.html`);
      await fs.writeFile(tempFilePath, html);
      await page.goto(`file://${tempFilePath}`, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '12mm',
          right: '10mm',
          bottom: '12mm',
          left: '10mm'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (error) {
          // Ignore cleanup failures
        }
      }
    }
  }
}

module.exports = PdfReporter;

