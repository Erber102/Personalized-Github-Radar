#!/usr/bin/env node

/**
 * Standalone Personalized GitHub Radar
 *
 * This version doesn't depend on the existing config system
 * and uses its own GitHub API client to avoid environment variable conflicts.
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Import standalone analyzer modules
const LanguageFilter = require('./helpers/analyzer/language-filter');
const ContentEnricher = require('./helpers/analyzer/content-enricher');
const SmartAnalyzer = require('./helpers/analyzer/smart-analyzer');
const RadarFormatter = require('./helpers/analyzer/radar-formatter');

// Import existing trends module (this doesn't require GitHub API)
const Trends = require('./helpers/trends');

// Simple logger for standalone version
const logger = {
  log: (...args) => console.log('📝', ...args),
  logError: (...args) => console.error('❌', ...args)
};

class StandaloneRadar {
  constructor() {
    this.config = null;
    this.allRepos = [];
    this.filteredRepos = [];
    this.analysisResults = [];
    this.finalReport = '';
  }

  async run() {
    try {
      logger.log('🚀 Starting Standalone Personalized GitHub Radar');

      // 1. Load Configuration
      await this.loadConfiguration();

      // 2. Extract - Fetch all trending repositories
      await this.extractTrendingRepos();

      // 3. Analyze - Process with language filter and smart analysis
      await this.analyzeRepos();

      // 4. Format - Generate personalized report
      await this.formatReport();

      // 5. Display Report
      await this.displayReport();

      logger.log('✅ Standalone Radar completed successfully');

    } catch (error) {
      logger.logError('❌ Standalone Radar failed:', error);
      throw error;
    }
  }

  async loadConfiguration() {
    logger.log('📋 Loading radar configuration...');

    const configPath = path.join(process.cwd(), 'radar.config.yml');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Radar configuration file not found: ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    this.config = yaml.load(configContent);

    // Validate required configuration
    if (!this.config.target_languages) {
      this.config.target_languages = [];
    }
    if (!this.config.topic_keywords) {
      this.config.topic_keywords = [];
    }

    logger.log(`Configuration loaded: ${this.config.target_languages.length} languages, ${this.config.topic_keywords.length} keywords`);
  }

  async extractTrendingRepos() {
    logger.log('📥 Extracting trending repositories...');

    // Use existing trends module to fetch "All Languages"
    const trendingUrl = 'https://github.com/trending';
    const trends = new Trends(trendingUrl, {
      retries: 5,
      minTimeout: 5000,
    });
    this.allRepos = await trends.getAll();

    logger.log(`Extracted ${this.allRepos.length} trending repositories`);
  }

  async analyzeRepos() {
    logger.log('🧠 Analyzing repositories...');

    // 3a. Language Filter
    const languageFilter = new LanguageFilter(this.config.target_languages);
    this.filteredRepos = languageFilter.filter(this.allRepos);
    logger.log(`Language filter: ${this.filteredRepos.length} repositories after filtering`);

    // 3b & 3c. Content Enrichment & Smart Analysis
    const contentEnricher = new ContentEnricher();
    const smartAnalyzer = new SmartAnalyzer(this.config);

    // Process repositories in batches to avoid rate limits
    const batchSize = 3; // Smaller batch size for standalone version
    const batches = [];
    for (let i = 0; i < this.filteredRepos.length; i += batchSize) {
      batches.push(this.filteredRepos.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      logger.log(`Processing batch ${i + 1}/${batches.length}...`);
      const batch = batches[i];

      try {
        // Enrich with README content
        const enrichedBatch = await contentEnricher.enrichBatch(batch);

        // Analyze with smart analyzer
        const analyzedBatch = await smartAnalyzer.analyzeBatch(enrichedBatch);

        this.analysisResults.push(...analyzedBatch);

        // Small delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        logger.logError(`Batch ${i + 1} failed:`, error.message);
        // Continue with next batch
      }
    }

    logger.log(`Analysis complete: ${this.analysisResults.length} repositories analyzed`);
  }

  async formatReport() {
    logger.log('📝 Formatting personalized report...');

    const formatter = new RadarFormatter(this.config);
    this.finalReport = formatter.format(this.analysisResults);

    logger.log(`Report generated: ${this.finalReport.length} characters`);
  }

  async displayReport() {
    logger.log('\n' + '='.repeat(60));
    logger.log('🎯 PERSONALIZED GITHUB RADAR REPORT');
    logger.log('='.repeat(60));
    console.log(this.finalReport);
    logger.log('='.repeat(60));

    // Save report to file for reference
    const reportPath = path.join(process.cwd(), 'radar-report.md');
    fs.writeFileSync(reportPath, this.finalReport);
    logger.log(`📄 Report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const radar = new StandaloneRadar();
  await radar.run();
}

// Handle errors
main().catch(error => {
  logger.logError('Standalone Radar failed:', error);
  process.exit(1);
});

module.exports = StandaloneRadar;