#!/usr/bin/env node
// ============================================================================
// DevReview — CLI
// ============================================================================

import { Command } from 'commander';
import { Reviewer } from './reviewer/reviewer.js';
import { DEFAULT_CONFIG } from './types.js';

const program = new Command();

program
  .name('devreview')
  .description('Automated GitHub PR code review with intelligent scoring')
  .version('0.1.0');

program
  .command('review')
  .description('Review a GitHub PR')
  .argument('<pr-url>', 'GitHub PR URL (e.g., https://github.com/owner/repo/pull/1)')
  .option('--comment', 'Post review as GitHub comment')
  .option('--min-score <score>', 'Minimum acceptable score (default: 7)', '7')
  .option('--token <token>', 'GitHub token (or set GITHUB_TOKEN env)')
  .action(async (prUrl: string, options: { comment?: boolean; minScore: string; token?: string }) => {
    const token = options.token || process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('Error: GitHub token required. Set GITHUB_TOKEN env or use --token');
      process.exit(1);
    }

    // Parse PR URL
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) {
      console.error('Error: Invalid PR URL. Expected: https://github.com/owner/repo/pull/123');
      process.exit(1);
    }

    const [, owner, repo, prNumber] = match;

    const config = {
      ...DEFAULT_CONFIG,
      rules: { ...DEFAULT_CONFIG.rules, minScore: parseInt(options.minScore) },
    };

    const reviewer = new Reviewer(token, config);

    try {
      if (options.comment) {
        console.log(`Reviewing and commenting on ${owner}/${repo}#${prNumber}...`);
        const result = await reviewer.reviewAndComment(owner, repo, parseInt(prNumber));
        console.log(`\n  ✅ Review posted! Score: ${result.score.overall}/10\n`);
      } else {
        const output = await reviewer.reviewForTerminal(owner, repo, parseInt(prNumber));
        console.log(output);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('score')
  .description('Quick score without posting (dry run)')
  .argument('<pr-url>', 'GitHub PR URL')
  .option('--token <token>', 'GitHub token (or set GITHUB_TOKEN env)')
  .action(async (prUrl: string, options: { token?: string }) => {
    const token = options.token || process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('Error: GitHub token required. Set GITHUB_TOKEN env or use --token');
      process.exit(1);
    }

    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) {
      console.error('Error: Invalid PR URL');
      process.exit(1);
    }

    const [, owner, repo, prNumber] = match;
    const reviewer = new Reviewer(token);

    try {
      const result = await reviewer.reviewPR(owner, repo, parseInt(prNumber));
      console.log(JSON.stringify(result.score, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
