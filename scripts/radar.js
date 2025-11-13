#!/usr/bin/env node

/**
 * Personalized GitHub Radar
 *
 * Core Architecture: Five Modules
 * 1. Control Panel (Config) - radar.config.yml
 * 2. Extractor - Modified to fetch all languages
 * 3. Analyzer - Language filter, content enricher, smart analyzer
 * 4. Formatter - New template with relevance scores and AI summaries
 * 5. Scheduler & Reporter - Reuse existing infrastructure
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Import existing helpers
const config = require('./config');
const {log, logError} = require('./helpers/logger');
const Trends = require('./helpers/trends');
const Comments = require('./helpers/comments');
const githubApi = require('./helpers/github-api');

// Import new analyzer modules
const LanguageFilter = require('./helpers/analyzer/language-filter');
const ContentEnricher = require('./helpers/analyzer/content-enricher');
const SmartAnalyzer = require('./helpers/analyzer/smart-analyzer');
const RadarFormatter = require('./helpers/analyzer/radar-formatter');

class PersonalizedRadar {
  constructor() {
    this.config = null;
    this.allRepos = [];
    this.filteredRepos = [];
    this.analysisResults = [];
    this.finalReport = '';
  }

  async run() {
    try {
      log('🚀 Starting Personalized GitHub Radar');

      // 1. Load Configuration
      await this.loadConfiguration();

      // 2. Extract - Fetch all trending repositories
      await this.extractTrendingRepos();

      // 3. Analyze - Process with language filter and smart analysis
      await this.analyzeRepos();

      // 4. Format - Generate personalized report
      await this.formatReport();

      // 5. Report - Post to GitHub issue
      await this.postReport();

      log('✅ Personalized Radar completed successfully');

    } catch (error) {
      logError('❌ Personalized Radar failed:', error);
      throw error;
    }
  }

  async loadConfiguration() {
    log('📋 Loading radar configuration...');

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

    // Ensure GitHub token is available
    this.ensureGitHubToken();

    log(`Configuration loaded: ${this.config.target_languages.length} languages, ${this.config.topic_keywords.length} keywords`);
  }

  ensureGitHubToken() {
    // Try multiple environment variable names for GitHub token
    const possibleTokenNames = [
      'GITHUB_TOKEN',
      'GITHUB_TOKEN_BOT',
      'GITHUB_TOKEN_VITALETS'
    ];

    for (const tokenName of possibleTokenNames) {
      if (process.env[tokenName]) {
        process.env.GITHUB_TOKEN = process.env[tokenName];
        log(`✅ Using GitHub token from ${tokenName}`);
        return;
      }
    }

    throw new Error(
      'GitHub token not found. Please set one of these environment variables: ' +
      possibleTokenNames.join(', ')
    );
  }

  async extractTrendingRepos() {
    log('📥 Extracting trending repositories...');

    // Modified extractor: Only fetch "All Languages" trending page
    const trendingUrl = 'https://github.com/trending';
    const trends = new Trends(trendingUrl, config.trendingRetryOptions);
    this.allRepos = await trends.getAll();

    log(`Extracted ${this.allRepos.length} trending repositories`);
  }

  async analyzeRepos() {
    log('🧠 Analyzing repositories...');

    // 3a. Language Filter
    const languageFilter = new LanguageFilter(this.config.target_languages);
    this.filteredRepos = languageFilter.filter(this.allRepos);
    log(`Language filter: ${this.filteredRepos.length} repositories after filtering`);

    // 3b & 3c. Content Enrichment & Smart Analysis
    const contentEnricher = new ContentEnricher();
    const smartAnalyzer = new SmartAnalyzer(this.config);

    // Process repositories in batches to avoid rate limits
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < this.filteredRepos.length; i += batchSize) {
      batches.push(this.filteredRepos.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      log(`Processing batch ${i + 1}/${batches.length}...`);
      const batch = batches[i];

      // Enrich with README content
      const enrichedBatch = await contentEnricher.enrichBatch(batch);

      // Analyze with smart analyzer
      const analyzedBatch = await smartAnalyzer.analyzeBatch(enrichedBatch);

      this.analysisResults.push(...analyzedBatch);

      // Small delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    log(`Analysis complete: ${this.analysisResults.length} repositories analyzed`);
  }

  async formatReport() {
    log('📝 Formatting personalized report...');

    const formatter = new RadarFormatter(this.config);
    this.finalReport = formatter.format(this.analysisResults);

    log(`Report generated: ${this.finalReport.length} characters`);
  }

  async postReport() {
    log('📤 Posting report to GitHub issue...');

    // Reuse existing infrastructure
    const issues = await this.getTargetIssue();
    if (issues.length === 0) {
      throw new Error('No target issue found for radar report');
    }

    const targetIssue = issues[0];
    const commentsHelper = new Comments(targetIssue);

    if (config.dryRun) {
      log(`DRY RUN - Would post report to issue #${targetIssue.number}`);
      log(`Report content:\n${this.finalReport}`);
    } else {
      const result = await commentsHelper.post(this.finalReport);
      log(`Report posted to issue #${targetIssue.number}: ${result.html_url}`);
    }
  }

  async getTargetIssue() {
    // Use existing Issues helper to find the radar issue
    const Issues = require('./helpers/issues');
    const issuesHelper = new Issues(this.config.issue_label || 'trending-daily', '');
    return await issuesHelper.getAll();
  }
}

// Main execution
async function main() {
  const radar = new PersonalizedRadar();
  await radar.run();
}

// Handle errors
main().catch(error => {
  logError('Personalized Radar failed:', error);
  process.exit(1);
});

module.exports = PersonalizedRadar;