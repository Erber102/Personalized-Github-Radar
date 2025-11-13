/**
 * Content Enricher Module
 *
 * Enriches repository data with additional content from GitHub API,
 * specifically README.md files for better analysis.
 */

const {log, logError} = require('../logger');
const RadarGitHubAPI = require('./radar-github-api');

class ContentEnricher {
  constructor() {
    this.githubApi = new RadarGitHubAPI();
  }

  /**
   * Enrich a batch of repositories with README content
   * @param {Array} repos - Array of repository objects
   * @returns {Promise<Array>} Enriched repositories
   */
  async enrichBatch(repos) {
    const enrichedRepos = [];

    for (const repo of repos) {
      try {
        const enrichedRepo = await this.enrichSingleRepo(repo);
        enrichedRepos.push(enrichedRepo);
      } catch (error) {
        logError(`Failed to enrich repo ${repo.name}:`, error.message);
        // Continue with original repo data if enrichment fails
        enrichedRepos.push(repo);
      }
    }

    return enrichedRepos;
  }

  /**
   * Enrich a single repository with README content
   * @param {Object} repo - Repository object
   * @returns {Promise<Object>} Enriched repository
   */
  async enrichSingleRepo(repo) {
    const [owner, repoName] = repo.name.split('/');

    if (!owner || !repoName) {
      log(`Invalid repo name format: ${repo.name}`);
      return repo;
    }

    try {
      // Get README content
      const readmeContent = await this.getReadmeContent(owner, repoName);

      // Get additional repo metadata
      const repoMetadata = await this.getRepoMetadata(owner, repoName);

      return {
        ...repo,
        readmeContent,
        topics: repoMetadata?.topics || [],
        createdAt: repoMetadata?.created_at,
        updatedAt: repoMetadata?.updated_at,
        forksCount: repoMetadata?.forks_count || repo.forks,
        starsCount: repoMetadata?.stargazers_count || repo.stars,
        watchersCount: repoMetadata?.watchers_count,
        openIssuesCount: repoMetadata?.open_issues_count
      };

    } catch (error) {
      if (error.response?.status === 404) {
        log(`README not found for ${repo.name}`);
      } else if (error.response?.status === 403) {
        log(`Rate limit hit while fetching README for ${repo.name}`);
      } else {
        logError(`Error enriching ${repo.name}:`, error.message);
      }
      return repo;
    }
  }

  /**
   * Get README content from GitHub API
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<string>} README content
   */
  async getReadmeContent(owner, repo) {
    try {
      const response = await this.githubApi.fetchJson('get', `/repos/${owner}/${repo}/readme`);

      if (response.result && response.result.content) {
        // GitHub API returns README content as base64
        const content = Buffer.from(response.result.content, 'base64').toString('utf8');
        return content.substring(0, 5000); // Limit content size for analysis
      }

      return '';
    } catch (error) {
      if (error.response?.status === 404) {
        log(`README not found for ${owner}/${repo}`);
      }
      throw error;
    }
  }

  /**
   * Get additional repository metadata
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Repository metadata
   */
  async getRepoMetadata(owner, repo) {
    const response = await this.githubApi.fetchJson('get', `/repos/${owner}/${repo}`);
    return response.result;
  }

  /**
   * Check if we have sufficient rate limit remaining
   * @returns {Promise<boolean>}
   */
  async checkRateLimit() {
    return await this.githubApi.checkRateLimit();
  }
}

module.exports = ContentEnricher;