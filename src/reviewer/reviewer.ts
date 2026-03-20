// ============================================================================
// DevReview — Main Reviewer (orchestrates scoring + formatting)
// ============================================================================

import { Scorer } from './scorer.js';
import { ReviewFormatter } from './formatter.js';
import { GitHubClient } from '../github/client.js';
import type { PRContext, ReviewResult, ReviewConfig } from '../types.js';
import { DEFAULT_CONFIG } from '../types.js';

export class Reviewer {
  private scorer: Scorer;
  private formatter: ReviewFormatter;
  private github: GitHubClient;
  private config: ReviewConfig;

  constructor(githubToken: string, config: ReviewConfig = DEFAULT_CONFIG) {
    this.scorer = new Scorer(config);
    this.formatter = new ReviewFormatter();
    this.github = new GitHubClient(githubToken);
    this.config = config;
  }

  /**
   * Review a PR end-to-end
   */
  async reviewPR(owner: string, repo: string, prNumber: number): Promise<ReviewResult> {
    // 1. Fetch PR context
    const context = await this.github.getPRContext(owner, repo, prNumber);

    // 2. Filter ignored files
    context.files = context.files.filter(f =>
      !this.config.ignore.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(f.filename);
      })
    );

    // 3. Try to load .ai/ context for smarter reviews
    const aiContext = await this.github.getAIContext(owner, repo);

    // 4. Score
    const score = this.scorer.scorePR(context);

    // 5. Generate insights
    const result = this.generateInsights(context, score, aiContext);

    return result;
  }

  /**
   * Review and post comment on GitHub
   */
  async reviewAndComment(owner: string, repo: string, prNumber: number): Promise<ReviewResult> {
    const context = await this.github.getPRContext(owner, repo, prNumber);

    context.files = context.files.filter(f =>
      !this.config.ignore.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(f.filename);
      })
    );

    const aiContext = await this.github.getAIContext(owner, repo);
    const score = this.scorer.scorePR(context);
    const result = this.generateInsights(context, score, aiContext);

    // Post review on GitHub
    const markdown = this.formatter.formatReview(context, result);
    const event = score.overall >= this.config.rules.minScore ? 'APPROVE' : 'REQUEST_CHANGES';
    await this.github.postReview(owner, repo, prNumber, markdown, event);

    return result;
  }

  /**
   * Review and return terminal output (for CLI)
   */
  async reviewForTerminal(owner: string, repo: string, prNumber: number): Promise<string> {
    const context = await this.github.getPRContext(owner, repo, prNumber);

    context.files = context.files.filter(f =>
      !this.config.ignore.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(f.filename);
      })
    );

    const aiContext = await this.github.getAIContext(owner, repo);
    const score = this.scorer.scorePR(context);
    const result = this.generateInsights(context, score, aiContext);

    return this.formatter.formatTerminal(context, result);
  }

  private generateInsights(
    context: PRContext,
    score: ReturnType<Scorer['scorePR']>,
    aiContext: Record<string, string | undefined>,
  ): ReviewResult {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const recommendations: string[] = [];

    // Code Quality insights
    if (score.codeQuality >= 9) strengths.push('Excellent code quality');
    if (score.codeQuality < 7) improvements.push('Code quality needs attention');

    // Architecture insights
    if (score.architecture >= 9) strengths.push('Well-structured architecture');
    if (score.architecture < 7) improvements.push('Consider better separation of concerns');

    // Testing insights
    if (score.testing >= 9) strengths.push('Good test coverage');
    if (score.testing < 5) improvements.push('Add tests for new functionality');
    if (score.testing < 3) improvements.push('⚠️ No tests detected — this is critical');

    // Documentation insights
    if (score.documentation >= 9) strengths.push('Well documented');
    if (score.documentation < 6) improvements.push('Add documentation for new features');

    // Best practices
    if (score.bestPractices >= 9) strengths.push('Follows best practices');
    if (score.bestPractices < 7) improvements.push('Review best practices guidelines');

    // Context-aware insights
    if (aiContext.architecture) {
      recommendations.push('✅ `.ai/ARCHITECTURE.md` found — review is context-aware');
    } else {
      recommendations.push('💡 Add `.ai/ARCHITECTURE.md` for smarter future reviews');
    }

    // Size-based recommendations
    if (context.additions > 500) {
      recommendations.push('Consider splitting this PR into smaller, focused changes');
    }

    if (context.files.length > 20) {
      recommendations.push('Large PR — consider breaking into feature-focused PRs');
    }

    // Generate details
    const details = [
      { category: 'Code Quality', score: score.codeQuality, notes: this.getCodeQualityNotes(context) },
      { category: 'Architecture', score: score.architecture, notes: this.getArchitectureNotes(context) },
      { category: 'Testing', score: score.testing, notes: this.getTestingNotes(context) },
      { category: 'Documentation', score: score.documentation, notes: this.getDocumentationNotes(context) },
      { category: 'Best Practices', score: score.bestPractices, notes: this.getBestPracticesNotes(context) },
    ];

    return { score, strengths, improvements, recommendations, details };
  }

  private getCodeQualityNotes(context: PRContext): string[] {
    const notes: string[] = [];
    const largeFiles = context.files.filter(f => f.additions > 300);
    if (largeFiles.length > 0) notes.push(`${largeFiles.length} large files (>300 lines added)`);
    if (context.files.some(f => f.filename.endsWith('.ts'))) notes.push('TypeScript used ✅');
    return notes;
  }

  private getArchitectureNotes(context: PRContext): string[] {
    const notes: string[] = [];
    if (context.files.some(f => f.filename.includes('components/'))) notes.push('Component-based structure');
    if (context.files.some(f => f.filename.includes('lib/'))) notes.push('Shared library pattern');
    return notes;
  }

  private getTestingNotes(context: PRContext): string[] {
    const testFiles = context.files.filter(f => f.filename.includes('test') || f.filename.includes('spec'));
    return [`${testFiles.length} test file(s) in PR`];
  }

  private getDocumentationNotes(context: PRContext): string[] {
    const notes: string[] = [];
    if (context.files.some(f => f.filename.toLowerCase().includes('readme'))) notes.push('README updated');
    if (context.description.length > 50) notes.push('PR has good description');
    return notes;
  }

  private getBestPracticesNotes(context: PRContext): string[] {
    const patches = context.files.map(f => f.patch || '').join('\n');
    const notes: string[] = [];
    if (patches.includes('any')) notes.push('⚠️ TypeScript `any` detected');
    if (patches.includes('eval(')) notes.push('🚨 eval() usage detected');
    return notes;
  }
}
