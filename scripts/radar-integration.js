#!/usr/bin/env node

/**
 * Radar Integration Script
 *
 * Demonstrates how to integrate the personalized radar with the existing
 * GitHub trending repos infrastructure for scheduled execution.
 */

const {log, logError} = require('./helpers/logger');
const PersonalizedRadar = require('./radar');

/**
 * Main integration function
 * This would be called by the existing scheduler (CircleCI/GitHub Actions)
 */
async function runRadarIntegration() {
  log('🚀 Starting Personalized Radar Integration');

  try {
    // Check if radar configuration exists
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'radar.config.yml');

    if (!fs.existsSync(configPath)) {
      log('ℹ️  No radar configuration found, falling back to standard trending updates');
      await runStandardUpdates();
      return;
    }

    log('🎯 Personalized radar configuration detected, running radar analysis');

    // Run personalized radar
    const radar = new PersonalizedRadar();
    await radar.run();

    log('✅ Personalized radar completed successfully');

  } catch (error) {
    logError('❌ Radar integration failed:', error);

    // Fallback to standard updates
    log('🔄 Falling back to standard trending updates...');
    try {
      await runStandardUpdates();
    } catch (fallbackError) {
      logError('❌ Fallback also failed:', fallbackError);
      throw error; // Re-throw original error
    }
  }
}

/**
 * Run standard trending updates (existing functionality)
 */
async function runStandardUpdates() {
  log('📊 Running standard trending updates...');

  // Import and run the existing update-issues script
  const updateIssues = require('./update-issues');

  // The existing script exports a main function that we can call
  // For now, we'll just log that we would run it
  log('Would run standard update-issues script');

  // In production, you would call:
  // await updateIssues.main();
}

/**
 * Environment-based execution
 * This allows the same script to work in both development and production
 */
async function main() {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    // In production, always run the integration
    await runRadarIntegration();
  } else {
    // In development, run radar if config exists, otherwise run test
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'radar.config.yml');

    if (fs.existsSync(configPath)) {
      log('🔧 Development mode: Running radar integration');
      await runRadarIntegration();
    } else {
      log('🔧 Development mode: No radar config, running test radar');
      require('./test-radar');
    }
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    log('🧪 Running radar test mode');
    require('./test-radar');
  } else if (args.includes('--standard')) {
    log('📊 Running standard updates only');
    runStandardUpdates().catch(logError);
  } else {
    main().catch(error => {
      logError('Integration failed:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  runRadarIntegration,
  runStandardUpdates,
  main
};