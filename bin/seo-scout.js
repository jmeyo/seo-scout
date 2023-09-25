#!/usr/bin/env node
const { program } = require('commander');
program.name('seo-scout').version('0.1.0');
program.command('analyze').argument('<url>').action((url) => console.log(`Analyzing: ${url}`));
program.parse();
