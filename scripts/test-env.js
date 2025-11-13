#!/usr/bin/env node

/**
 * Test script to verify environment variables are loaded correctly
 */

require('dotenv').config();

console.log('🔍 Testing environment variables...\n');

// Check all possible GitHub token names
const possibleTokenNames = [
  'GITHUB_TOKEN',
  'GITHUB_TOKEN_BOT',
  'GITHUB_TOKEN_VITALETS'
];

console.log('📋 Available environment variables:');
let tokenFound = false;

for (const tokenName of possibleTokenNames) {
  const value = process.env[tokenName];
  if (value) {
    console.log(`✅ ${tokenName}: ${value.substring(0, 10)}... (length: ${value.length})`);
    tokenFound = true;
  } else {
    console.log(`❌ ${tokenName}: Not found`);
  }
}

console.log('\n🔍 Other relevant environment variables:');
const otherVars = ['OPENAI_API_KEY', 'TRENDING_LABEL', 'TRENDING_LANG'];
for (const varName of otherVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: Not found`);
  }
}

console.log('\n📊 Summary:');
if (tokenFound) {
  console.log('✅ GitHub token found! Radar should work correctly.');
} else {
  console.log('❌ No GitHub token found. Please check your .env file.');
  console.log('\n💡 Make sure your .env file contains:');
  console.log('GITHUB_TOKEN="your_github_token_here"');
}