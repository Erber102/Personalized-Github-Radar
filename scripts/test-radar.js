#!/usr/bin/env node

/**
 * Test script for Personalized GitHub Radar
 * Tests the analyzer modules without requiring GitHub API access
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Import analyzer modules
const LanguageFilter = require('./helpers/analyzer/language-filter');
const SmartAnalyzer = require('./helpers/analyzer/smart-analyzer');
const RadarFormatter = require('./helpers/analyzer/radar-formatter');

// Mock data for testing
const mockRepos = [
  {
    name: 'microsoft/Neuro-AI-Toolkit',
    url: 'https://github.com/microsoft/Neuro-AI-Toolkit',
    description: 'A comprehensive toolkit for Neuro-AI research and development with BCI integration',
    language: 'Python',
    starsAdded: 42,
    stars: 1500,
    forks: 230
  },
  {
    name: 'openai/agentic-framework',
    url: 'https://github.com/openai/agentic-framework',
    description: 'Framework for building LLM agents with autonomous capabilities and machine learning',
    language: 'Python',
    starsAdded: 35,
    stars: 890,
    forks: 120
  },
  {
    name: 'rust-lang/neuro-bci',
    url: 'https://github.com/rust-lang/neuro-bci',
    description: 'Brain-Computer Interface library written in Rust for deep learning applications',
    language: 'Rust',
    starsAdded: 28,
    stars: 450,
    forks: 67
  },
  {
    name: 'jupyter/llm-agent-notebooks',
    url: 'https://github.com/jupyter/llm-agent-notebooks',
    description: 'Jupyter notebooks for LLM agent development and testing with AI integration',
    language: 'Jupyter Notebook',
    starsAdded: 25,
    stars: 320,
    forks: 45
  },
  {
    name: 'nodejs/web-framework',
    url: 'https://github.com/nodejs/web-framework',
    description: 'Yet another web framework for Node.js',
    language: 'JavaScript',
    starsAdded: 15,
    stars: 180,
    forks: 30
  }
];

async function testRadar() {
  console.log('🧪 Testing Personalized GitHub Radar...\n');

  try {
    // 1. Load configuration
    const configPath = path.join(process.cwd(), 'radar.config.yml');
    if (!fs.existsSync(configPath)) {
      console.error('❌ Radar configuration file not found');
      return;
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);
    console.log('✅ Configuration loaded');

    // 2. Test Language Filter
    console.log('\n📋 Testing Language Filter...');
    const languageFilter = new LanguageFilter(config.target_languages);
    const filteredRepos = languageFilter.filter(mockRepos);
    console.log(`   Filtered: ${filteredRepos.length} of ${mockRepos.length} repositories`);

    // 3. Test Smart Analyzer
    console.log('\n🧠 Testing Smart Analyzer...');
    const smartAnalyzer = new SmartAnalyzer(config);
    const analyzedRepos = await smartAnalyzer.analyzeBatch(filteredRepos);
    console.log(`   Analyzed: ${analyzedRepos.length} repositories`);

    // Show analysis results
    analyzedRepos.forEach(repo => {
      console.log(`\n   📊 ${repo.name}`);
      console.log(`      Relevance Score: ${repo.relevanceScore}`);
      console.log(`      Matched Keywords: ${repo.matchedKeywords.join(', ') || 'None'}`);
      if (repo.aiSummary) {
        console.log(`      AI Summary: ${repo.aiSummary}`);
      }
    });

    // 4. Test Formatter
    console.log('\n📝 Testing Radar Formatter...');
    const formatter = new RadarFormatter(config);
    const report = formatter.format(analyzedRepos);
    console.log('\n' + '='.repeat(50));
    console.log('📋 FINAL REPORT');
    console.log('='.repeat(50));
    console.log(report);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testRadar();