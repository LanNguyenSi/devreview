# DevReview

**Automated GitHub PR Code Review Agent**

DevReview is an intelligent code review agent that analyzes pull requests and provides structured, actionable feedback with scoring.

## Features

- 🤖 **Automated PR Analysis** - Analyzes code quality, architecture, best practices
- 📊 **Scoring System** - Provides 1-10 ratings with detailed breakdown
- 💬 **GitHub Integration** - Posts review comments directly on PRs
- 🧠 **Context-Aware** - Reads `.ai/ARCHITECTURE.md` for project-specific context
- 🔍 **Multi-Language** - Supports TypeScript, JavaScript, Python, and more

## Quick Start

### Installation

```bash
npm install -g devreview
```

### GitHub App Setup

1. Create a GitHub App with webhook permissions
2. Set webhook URL to `https://your-server.com/webhook`
3. Configure environment variables:

```bash
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY=path/to/private-key.pem
WEBHOOK_SECRET=your-webhook-secret
```

### Running the Server

```bash
devreview server --port 3000
```

### CLI Usage

Review a PR manually:

```bash
devreview review --repo owner/repo --pr 123
```

## Review Output Example

```markdown
## 🔍 DevReview Analysis

**Overall Score: 8.5/10**

### ✅ Strengths
- Clean TypeScript implementation with proper types
- Good error handling with try-catch blocks
- Well-structured modular architecture

### ⚠️ Areas for Improvement
- Missing unit tests for new features
- Some functions could use JSDoc comments
- Consider extracting magic numbers to constants

### 📊 Detailed Scores
- Code Quality: 9/10
- Architecture: 8/10
- Testing: 6/10
- Documentation: 8/10
- Best Practices: 9/10

### 💡 Recommendations
1. Add unit tests for `UserService.createUser()`
2. Document the webhook signature validation logic
3. Consider using a config file for environment variables

---
*Reviewed by DevReview 🤖 | [Learn More](https://github.com/LanNguyenSi/devreview)*
```

## Architecture

```
devreview/
├── src/
│   ├── server/          # Webhook server
│   │   ├── webhook.ts   # GitHub webhook handler
│   │   └── server.ts    # Express server
│   ├── reviewer/        # Core review logic
│   │   ├── analyzer.ts  # Code analysis
│   │   ├── scorer.ts    # Scoring system
│   │   └── formatter.ts # Review formatting
│   ├── github/          # GitHub API integration
│   │   ├── client.ts    # GitHub API client
│   │   └── comments.ts  # PR comment management
│   ├── ai/              # AI-powered analysis
│   │   ├── context.ts   # .ai/ folder reader
│   │   └── llm.ts       # LLM integration (optional)
│   └── cli/             # CLI commands
│       ├── review.ts    # Manual review command
│       └── server.ts    # Server start command
├── .ai/                 # Project context
│   ├── ARCHITECTURE.md
│   └── AGENTS.md
└── package.json
```

## Configuration

Create a `.devreview.json` in your project:

```json
{
  "rules": {
    "requireTests": true,
    "requireDocs": true,
    "minScore": 7
  },
  "ignore": [
    "dist/**",
    "node_modules/**"
  ],
  "scoring": {
    "codeQuality": 30,
    "architecture": 25,
    "testing": 20,
    "documentation": 15,
    "bestPractices": 10
  }
}
```

## Scoring System

DevReview uses a weighted scoring system (Ice's 9.5/10 style):

| Category | Weight | Criteria |
|----------|--------|----------|
| Code Quality | 30% | Clean code, type safety, error handling |
| Architecture | 25% | Modularity, separation of concerns, scalability |
| Testing | 20% | Test coverage, test quality, edge cases |
| Documentation | 15% | README, comments, API docs |
| Best Practices | 10% | Security, performance, conventions |

**Final Score = Σ(Category Score × Weight)**

## AI Context Integration

DevReview can read `.ai/` folder for project-specific context:

```
your-project/
├── .ai/
│   ├── ARCHITECTURE.md  # System overview
│   ├── AGENTS.md        # Team context
│   └── DECISIONS.md     # Technical decisions
```

This helps DevReview provide **context-aware reviews** that understand your project's specific architecture and constraints.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Test
npm test
```

## Roadmap

- [x] Basic GitHub webhook integration
- [x] Code quality analysis
- [x] Scoring system
- [x] PR comment posting
- [ ] .ai/ folder context reading
- [ ] LLM-powered analysis (optional)
- [ ] Multi-language support expansion
- [ ] Learning from past reviews
- [ ] CI/CD integration
- [ ] Slack/Discord notifications

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [Lan Nguyen Si](https://github.com/LanNguyenSi)

---

**Built by Lava 🌋 as part of Ice-Lava DX Tools collaboration**
