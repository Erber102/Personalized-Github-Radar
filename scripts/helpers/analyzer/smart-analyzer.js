/**
 * Smart Analyzer Module
 *
 * Analyzes repositories for relevance based on topic keywords
 * and optionally generates AI summaries using OpenAI API.
 */

const {log, logError} = require('../logger');

class SmartAnalyzer {
  constructor(config) {
    this.config = config;
    this.topicKeywords = config.topic_keywords || [];
    this.enableAISummaries = config.enable_ai_summaries !== false;
    this.maxAISummaries = config.max_ai_summaries || 10;
    this.openaiApiKey = process.env.OPENAI_API_KEY;

    // Initialize OpenAI client if API key is available
    if (this.openaiApiKey && this.enableAISummaries) {
      // Note: OpenAI package would need to be installed
      // this.openai = new OpenAI({ apiKey: this.openaiApiKey });
      log('OpenAI API key detected, AI summaries enabled');
    } else if (this.enableAISummaries) {
      log('OpenAI API key not found, AI summaries disabled');
      this.enableAISummaries = false;
    }
  }

  /**
   * Analyze a batch of repositories
   * @param {Array} repos - Array of enriched repository objects
   * @returns {Promise<Array>} Analyzed repositories with relevance scores
   */
  async analyzeBatch(repos) {
    const analyzedRepos = [];
    let aiSummaryCount = 0;

    for (const repo of repos) {
      try {
        const analyzedRepo = await this.analyzeSingleRepo(repo, aiSummaryCount);
        analyzedRepos.push(analyzedRepo);

        if (analyzedRepo.aiSummary) {
          aiSummaryCount++;
        }

      } catch (error) {
        logError(`Failed to analyze repo ${repo.name}:`, error.message);
        // Continue with basic analysis if detailed analysis fails
        analyzedRepos.push(this.basicAnalysis(repo));
      }
    }

    return analyzedRepos;
  }

  /**
   * Analyze a single repository
   * @param {Object} repo - Enriched repository object
   * @param {number} aiSummaryCount - Current count of AI summaries
   * @returns {Promise<Object>} Analyzed repository
   */
  async analyzeSingleRepo(repo, aiSummaryCount) {
    // Step 1: Basic keyword analysis
    const analysisResult = this.basicAnalysis(repo);

    // Step 2: AI analysis if enabled and within limits
    if (this.enableAISummaries &&
        analysisResult.relevanceScore > 0 &&
        aiSummaryCount < this.maxAISummaries) {
      try {
        const aiSummary = await this.generateAISummary(repo, analysisResult.matchedKeywords);
        analysisResult.aiSummary = aiSummary;
      } catch (error) {
        logError(`Failed to generate AI summary for ${repo.name}:`, error.message);
        analysisResult.aiSummary = null;
      }
    }

    return analysisResult;
  }

  /**
   * Perform basic keyword analysis
   * @param {Object} repo - Repository object
   * @returns {Object} Analysis result
   */
  basicAnalysis(repo) {
    let relevanceScore = 0;
    const matchedKeywords = [];

    // Search in description
    if (repo.description) {
      const descMatches = this.findKeywordMatches(repo.description);
      relevanceScore += descMatches.score * 5; // Higher weight for description
      matchedKeywords.push(...descMatches.keywords);
    }

    // Search in README content
    if (repo.readmeContent) {
      const readmeMatches = this.findKeywordMatches(repo.readmeContent);
      relevanceScore += readmeMatches.score;
      matchedKeywords.push(...readmeMatches.keywords);
    }

    // Search in topics
    if (repo.topics && Array.isArray(repo.topics)) {
      const topicMatches = this.findKeywordMatches(repo.topics.join(' '));
      relevanceScore += topicMatches.score * 3; // Higher weight for topics
      matchedKeywords.push(...topicMatches.keywords);
    }

    // Remove duplicate keywords
    const uniqueKeywords = [...new Set(matchedKeywords)];

    return {
      ...repo,
      relevanceScore,
      matchedKeywords: uniqueKeywords,
      aiSummary: null
    };
  }

  /**
   * Find keyword matches in text
   * @param {string} text - Text to search
   * @returns {Object} Matches and score
   */
  findKeywordMatches(text) {
    if (!text || this.topicKeywords.length === 0) {
      return { score: 0, keywords: [] };
    }

    const lowerText = text.toLowerCase();
    const matchedKeywords = [];
    let score = 0;

    for (const keyword of this.topicKeywords) {
      const lowerKeyword = keyword.toLowerCase();

      // Use word boundary regex for exact matches
      const exactRegex = new RegExp(`\\b${lowerKeyword}\\b`, 'gi');
      const exactMatches = (lowerText.match(exactRegex) || []).length;

      // Also check for partial matches (for compound terms like "LLM Agent")
      const partialRegex = new RegExp(lowerKeyword, 'gi');
      const partialMatches = (lowerText.match(partialRegex) || []).length;

      // Use the higher count, but prefer exact matches
      const matches = Math.max(exactMatches, partialMatches);

      if (matches > 0) {
        matchedKeywords.push(keyword);
        score += matches;
      }
    }

    return { score, keywords: matchedKeywords };
  }

  /**
   * Generate AI summary using OpenAI API
   * @param {Object} repo - Repository object
   * @param {Array} matchedKeywords - Keywords that matched
   * @returns {Promise<string>} AI-generated summary
   */
  async generateAISummary(repo, matchedKeywords) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not available');
    }

    // For now, return a placeholder since we don't have OpenAI package installed
    // In a real implementation, this would call the OpenAI API

    const prompt = this.buildAIPrompt(repo, matchedKeywords);
    log(`Would generate AI summary for ${repo.name} with prompt: ${prompt.substring(0, 100)}...`);

    // Placeholder implementation
    return `🤖 AI Summary: This repository appears relevant to your interests in ${matchedKeywords.join(', ')} based on its description and README content.`;

    /*
    // Real implementation would look like this:
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a technical analyst that helps developers understand GitHub repositories."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150
    });

    return response.choices[0].message.content.trim();
    */
  }

  /**
   * Build AI prompt for repository analysis
   * @param {Object} repo - Repository object
   * @param {Array} matchedKeywords - Keywords that matched
   * @returns {string} AI prompt
   */
  buildAIPrompt(repo, matchedKeywords) {
    return `
Analyze this GitHub repository and provide a one-sentence summary explaining why it's relevant to these interests: ${matchedKeywords.join(', ')}.

Repository: ${repo.name}
Description: ${repo.description || 'No description'}
README Excerpt: ${(repo.readmeContent || '').substring(0, 500)}

Focus on explaining the connection to the specified interests in a concise, informative way.
    `.trim();
  }

  /**
   * Get analysis statistics
   * @param {Array} analyzedRepos - Analyzed repositories
   * @returns {Object} Statistics
   */
  getAnalysisStats(analyzedRepos) {
    const relevantRepos = analyzedRepos.filter(repo => repo.relevanceScore > 0);
    const aiSummarized = analyzedRepos.filter(repo => repo.aiSummary).length;

    return {
      totalAnalyzed: analyzedRepos.length,
      relevantRepos: relevantRepos.length,
      aiSummarized,
      averageRelevanceScore: analyzedRepos.reduce((sum, repo) => sum + repo.relevanceScore, 0) / analyzedRepos.length
    };
  }
}

module.exports = SmartAnalyzer;