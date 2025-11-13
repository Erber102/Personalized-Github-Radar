/**
 * Radar Formatter Module
 *
 * Formats analyzed repositories into a personalized Markdown report
 * with relevance scores, matched keywords, and AI summaries.
 */

const {log} = require('../logger');

class RadarFormatter {
  constructor(config) {
    this.config = config;
    this.minRelevanceScore = config.min_relevance_score || 1;
  }

  /**
   * Format analyzed repositories into Markdown report
   * @param {Array} analyzedRepos - Analyzed repository objects
   * @returns {string} Markdown formatted report
   */
  format(analyzedRepos) {
    // Filter and sort repositories
    const relevantRepos = analyzedRepos
      .filter(repo => repo.relevanceScore >= this.minRelevanceScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    if (relevantRepos.length === 0) {
      return this.formatNoResults();
    }

    return this.formatResults(relevantRepos);
  }

  /**
   * Format report when no relevant repositories found
   * @returns {string} No results message
   */
  formatNoResults() {
    const date = new Date().toLocaleDateString();
    return `
## 🎯 Personalized GitHub Radar - ${date}

**No relevant repositories found today.**

Your radar is configured to monitor:
- **Languages:** ${this.config.target_languages.length > 0 ? this.config.target_languages.join(', ') : 'All languages'}
- **Topics:** ${this.config.topic_keywords.join(', ') || 'None specified'}

Try adjusting your topic keywords or check back tomorrow for new trending repositories!
    `.trim();
  }

  /**
   * Format results with relevant repositories
   * @param {Array} relevantRepos - Relevant repository objects
   * @returns {string} Formatted Markdown report
   */
  formatResults(relevantRepos) {
    const date = new Date().toLocaleDateString();
    const header = this.formatHeader(date, relevantRepos.length);
    const summary = this.formatSummary(relevantRepos);
    const repositorySections = relevantRepos.map(repo => this.formatRepository(repo)).join('\n\n---\n\n');

    return `${header}\n\n${summary}\n\n${repositorySections}`;
  }

  /**
   * Format report header
   * @param {string} date - Report date
   * @param {number} count - Number of relevant repositories
   * @returns {string} Header section
   */
  formatHeader(date, count) {
    return `## 🎯 Personalized GitHub Radar - ${date}

**${count} relevant repositories** matching your interests today!

### 📊 Radar Configuration
- **Target Languages:** ${this.config.target_languages.length > 0 ? this.config.target_languages.join(', ') : 'All languages'}
- **Topic Keywords:** ${this.config.topic_keywords.join(', ') || 'None specified'}
- **Minimum Relevance Score:** ${this.minRelevanceScore}`;
  }

  /**
   * Format summary statistics
   * @param {Array} repos - Relevant repository objects
   * @returns {string} Summary section
   */
  formatSummary(repos) {
    const aiSummarized = repos.filter(repo => repo.aiSummary).length;
    const topKeywords = this.getTopKeywords(repos);
    const languageStats = this.getLanguageStats(repos);

    return `### 📈 Summary

- **Total Relevant:** ${repos.length} repositories
- **AI Summarized:** ${aiSummarized} repositories
- **Top Keywords:** ${topKeywords.slice(0, 5).join(', ')}
- **Language Distribution:** ${Object.entries(languageStats).map(([lang, count]) => `${lang} (${count})`).join(', ')}`;
  }

  /**
   * Format individual repository
   * @param {Object} repo - Repository object
   * @returns {string} Formatted repository section
   */
  formatRepository(repo) {
    const relevanceEmoji = this.getRelevanceEmoji(repo.relevanceScore);
    const starsAdded = repo.starsAdded ? ` **+${repo.starsAdded}** stars today` : '';
    const language = repo.language ? ` • ${repo.language}` : '';

    let content = `
### ${relevanceEmoji} [${repo.name.replace('/', ' / ')}](${repo.url})${starsAdded}${language}

**Relevance Score:** ${repo.relevanceScore}
**Matched Keywords:** ${repo.matchedKeywords.join(', ') || 'None'}

${repo.description || 'No description available.'}
`;

    // Add AI summary if available
    if (repo.aiSummary) {
      content += `\n🤖 **AI Insight:** ${repo.aiSummary}\n`;
    }

    // Add additional metadata
    if (repo.topics && repo.topics.length > 0) {
      content += `\n🏷️ **Topics:** ${repo.topics.map(topic => `\`${topic}\``).join(' ')}`;
    }

    // Add stars and forks
    content += `\n⭐ **Stars:** ${repo.starsCount || repo.stars} • 🍴 **Forks:** ${repo.forksCount || repo.forks}`;

    return content.trim();
  }

  /**
   * Get emoji based on relevance score
   * @param {number} score - Relevance score
   * @returns {string} Emoji
   */
  getRelevanceEmoji(score) {
    if (score >= 10) return '🔥';
    if (score >= 5) return '⭐';
    if (score >= 3) return '📈';
    return '📊';
  }

  /**
   * Get top keywords from all repositories
   * @param {Array} repos - Repository objects
   * @returns {Array} Top keywords
   */
  getTopKeywords(repos) {
    const keywordCounts = {};

    repos.forEach(repo => {
      repo.matchedKeywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });

    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([keyword]) => keyword);
  }

  /**
   * Get language distribution
   * @param {Array} repos - Repository objects
   * @returns {Object} Language counts
   */
  getLanguageStats(repos) {
    const stats = {};
    repos.forEach(repo => {
      const lang = repo.language || 'Unknown';
      stats[lang] = (stats[lang] || 0) + 1;
    });
    return stats;
  }

  /**
   * Get report metadata
   * @param {Array} repos - Repository objects
   * @returns {Object} Metadata
   */
  getReportMetadata(repos) {
    return {
      totalRepos: repos.length,
      averageRelevanceScore: repos.reduce((sum, repo) => sum + repo.relevanceScore, 0) / repos.length,
      maxRelevanceScore: Math.max(...repos.map(repo => repo.relevanceScore)),
      aiSummarized: repos.filter(repo => repo.aiSummary).length
    };
  }
}

module.exports = RadarFormatter;