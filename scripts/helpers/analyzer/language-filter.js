/**
 * Language Filter Module
 *
 * Filters repositories based on target programming languages.
 * If no target languages are specified, returns all repositories.
 */

const {log} = require('../logger');

class LanguageFilter {
  constructor(targetLanguages = []) {
    this.targetLanguages = targetLanguages.map(lang => lang.toLowerCase());
  }

  /**
   * Filter repositories by programming language
   * @param {Array} repos - Array of repository objects
   * @returns {Array} Filtered repositories
   */
  filter(repos) {
    if (this.targetLanguages.length === 0) {
      log('No target languages specified, returning all repositories');
      return repos;
    }

    const filtered = repos.filter(repo => {
      const repoLanguage = (repo.language || '').toLowerCase();
      return this.targetLanguages.includes(repoLanguage);
    });

    log(`Language filter: ${filtered.length} of ${repos.length} repositories match target languages`);
    return filtered;
  }

  /**
   * Get language statistics for debugging
   * @param {Array} repos - Array of repository objects
   * @returns {Object} Language distribution
   */
  getLanguageStats(repos) {
    const stats = {};
    repos.forEach(repo => {
      const lang = repo.language || 'Unknown';
      stats[lang] = (stats[lang] || 0) + 1;
    });
    return stats;
  }
}

module.exports = LanguageFilter;