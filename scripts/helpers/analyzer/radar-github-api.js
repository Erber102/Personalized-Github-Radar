/**
 * Radar-specific GitHub API client
 *
 * This avoids dependency on the existing config system and supports
 * multiple GitHub token environment variable names.
 */

const axios = require('axios');
const axiosRetry = require('axios-retry');
const parseLinkHeader = require('parse-link-header');
const {log, logError} = require('../logger');

class RadarGitHubAPI {
  constructor() {
    this.githubToken = this.getGitHubToken();
    this.apiUrl = 'https://api.github.com';

    if (!this.githubToken) {
      throw new Error(
        'GitHub token not found. Please set one of these environment variables: ' +
        'GITHUB_TOKEN, GITHUB_TOKEN_BOT, GITHUB_TOKEN_VITALETS'
      );
    }

    this.request = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${this.githubToken}`,
        'User-Agent': 'GitHub-Trending-Radar'
      }
    });

    // Configure retry logic
    axiosRetry(this.request, {
      retries: 3,
      retryDelay: retryNumber => {
        log(`GitHub API retry attempt: ${retryNumber}`);
        return axiosRetry.exponentialDelay(retryNumber);
      }
    });

    log(`✅ Radar GitHub API client initialized with token: ${this.githubToken.substring(0, 10)}...`);
  }

  getGitHubToken() {
    const possibleTokenNames = [
      'GITHUB_TOKEN',
      'GITHUB_TOKEN_BOT',
      'GITHUB_TOKEN_VITALETS'
    ];

    for (const tokenName of possibleTokenNames) {
      if (process.env[tokenName]) {
        return process.env[tokenName];
      }
    }

    return null;
  }

  /**
   * Performs request to GitHub API
   * @param {String} method - HTTP method
   * @param {String} url - API endpoint
   * @param {Object} [data] - Request data
   * @returns {Promise<{pages: Array, result: JSON}>}
   */
  async fetchJson(method, url, data) {
    method = method.toUpperCase();
    log(`GitHub API: ${method} ${url}`);

    try {
      const response = await this.request({method, url, data});
      const pages = parseLinkHeader(response.headers.link);
      return {result: response.data, pages};
    } catch (error) {
      logError(`GitHub API error: ${method} ${url}`, error.message);
      throw error;
    }
  }

  /**
   * Get rate limit information
   * @returns {Promise<Object>} Rate limit data
   */
  async getRateLimit() {
    try {
      const response = await this.request.get('/rate_limit');
      return response.data;
    } catch (error) {
      logError('Failed to get rate limit:', error.message);
      return null;
    }
  }

  /**
   * Check if we have sufficient rate limit remaining
   * @returns {Promise<boolean>}
   */
  async checkRateLimit() {
    try {
      const rateLimit = await this.getRateLimit();
      if (rateLimit) {
        const remaining = rateLimit.rate.remaining;
        const resetTime = new Date(rateLimit.rate.reset * 1000);

        log(`GitHub API rate limit: ${remaining} requests remaining, resets at ${resetTime}`);

        return remaining > 10; // Leave some buffer
      }
      return true; // Assume we can continue if we can't check
    } catch (error) {
      logError('Failed to check rate limit:', error.message);
      return true; // Assume we can continue
    }
  }
}

module.exports = RadarGitHubAPI;