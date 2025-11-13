# 🎯 Personalized GitHub Radar

**Transform GitHub trending into your personal discovery engine**

## Overview

The Personalized GitHub Radar extends the original GitHub trending repos project with intelligent filtering and analysis capabilities. Instead of getting generic trending repositories, you receive **curated recommendations** based on your specific interests and preferred programming languages.

## Core Architecture: Five Modules

### 1. Control Panel (Config) - `radar.config.yml`
Defines your personalized radar parameters in the repository root.

### 2. Extractor - Modified Trends Fetcher
Fetches "All Languages" trending repositories to get comprehensive data for analysis.

### 3. Analyzer - Intelligent Processing Brain
- **Language Filter**: Filters repositories by your target programming languages
- **Content Enricher**: Fetches README content and metadata from GitHub API
- **Smart Analyzer**: Scores relevance based on topic keywords and generates AI summaries

### 4. Formatter - Personalized Report Generator
Creates beautiful Markdown reports with relevance scores, matched keywords, and AI insights.

### 5. Scheduler & Reporter - Existing Infrastructure
Reuses the proven GitHub issue-based notification system.

## Quick Start

### 1. Create Your Radar Configuration

Create `radar.config.yml` in the repository root:

```yaml
# Personalized GitHub Radar Configuration
target_languages:
  - python
  - rust
  - jupyter-notebook
  - typescript

topic_keywords:
  - Neuro-AI
  - BCI
  - LLM Agent
  - Agentic
  - AI
  - Machine Learning
  - Deep Learning

# Optional: Enable AI summaries
enable_ai_summaries: true
min_relevance_score: 1
```

### 2. Test Your Radar

```bash
# Test with mock data
npm run radar-test

# Run in development mode
npm run radar-dev

# Run full radar (requires GitHub tokens)
npm run radar
```

### 3. Configure Environment Variables

For production use, set these environment variables:

```bash
# Required
GITHUB_TOKEN=your_github_token

# Optional: For AI summaries
OPENAI_API_KEY=your_openai_api_key
```

## Configuration Options

### Target Languages
- Specify programming languages you're interested in
- Empty array = monitor all languages
- Example: `['python', 'rust', 'typescript']`

### Topic Keywords
- Keywords that match your interests
- Searched in repository descriptions and README content
- Example: `['AI', 'Machine Learning', 'LLM']`

### Analysis Settings
- `min_relevance_score`: Minimum score to include in report (default: 1)
- `enable_ai_summaries`: Generate AI insights (requires OpenAI API key)
- `max_ai_summaries`: Limit AI summaries per run (default: 10)

## How It Works

### 1. Data Collection
- Fetches trending repositories from "All Languages" page
- Gets comprehensive dataset for analysis

### 2. Language Filtering
- Filters repositories by your target languages
- Skips irrelevant programming languages

### 3. Content Enrichment
- Fetches README content via GitHub API
- Gathers additional metadata (topics, stars, forks)

### 4. Smart Analysis
- **Keyword Matching**: Scores repositories based on topic keyword matches
- **Relevance Scoring**: Description matches = +5, README matches = +1, Topic matches = +3
- **AI Summaries**: Optional GPT-powered insights for high-scoring repositories

### 5. Report Generation
- Filters repositories by minimum relevance score
- Sorts by relevance score (highest first)
- Generates personalized Markdown report
- Posts to GitHub issue for notifications

## Example Output

```markdown
## 🎯 Personalized GitHub Radar - 2025/11/13

**3 relevant repositories** matching your interests today!

### 📊 Radar Configuration
- **Target Languages:** python, rust, jupyter-notebook
- **Topic Keywords:** Neuro-AI, BCI, LLM Agent, AI
- **Minimum Relevance Score:** 1

### 🔥 [microsoft/Neuro-AI-Toolkit](https://github.com/...) **+42** stars today • Python

**Relevance Score:** 15
**Matched Keywords:** Neuro-AI, BCI, AI

A comprehensive toolkit for Neuro-AI research and development

🤖 **AI Insight:** This repository provides essential tools for Neuro-AI research...

⭐ **Stars:** 1500 • 🍴 **Forks:** 230
```

## Integration with Existing System

The personalized radar seamlessly integrates with the existing infrastructure:

- **Same Notification System**: Uses GitHub issues and native notifications
- **Fallback Mechanism**: Falls back to standard updates if radar config is missing
- **Scheduled Execution**: Works with existing CircleCI/GitHub Actions workflows
- **Dry Run Support**: Respects existing dry-run configuration

## Advanced Usage

### Custom Scoring
Modify the scoring algorithm in `smart-analyzer.js`:
- Adjust weights for description vs README matches
- Add custom scoring rules
- Implement domain-specific relevance algorithms

### AI Integration
Enable OpenAI integration for intelligent summaries:
1. Set `OPENAI_API_KEY` environment variable
2. Set `enable_ai_summaries: true` in config
3. Customize AI prompts in `smart-analyzer.js`

### Batch Processing
The system processes repositories in batches to respect GitHub API rate limits:
- Default batch size: 5 repositories
- Configurable delays between batches
- Automatic rate limit checking

## Troubleshooting

### Common Issues

**No repositories found**
- Check your topic keywords are specific enough
- Verify target languages are correctly spelled
- Try lowering the `min_relevance_score`

**GitHub API rate limits**
- Ensure `GITHUB_TOKEN` is set with sufficient permissions
- The system automatically handles rate limiting
- Consider using a GitHub App token for higher limits

**AI summaries not working**
- Verify `OPENAI_API_KEY` is set correctly
- Check that `enable_ai_summaries` is true
- Ensure you have OpenAI API credits

## Performance Considerations

- **API Calls**: Each repository requires 2-3 GitHub API calls
- **Rate Limits**: Batch processing respects GitHub's 5000 requests/hour limit
- **Processing Time**: Analysis takes ~1-2 seconds per repository
- **Memory Usage**: README content is limited to 5000 characters

## Extending the Radar

The modular architecture makes it easy to extend:

- Add new analysis modules
- Implement custom scoring algorithms
- Integrate additional data sources
- Create specialized formatters

## Contributing

Contributions are welcome! Key areas for improvement:

- Additional analysis algorithms
- More sophisticated keyword matching
- Integration with other AI services
- Enhanced reporting formats
- Performance optimizations