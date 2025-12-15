# Deployer Agent

## Purpose
Handle GitHub commits, pushes, and Vercel deployments for marketing.heymag.app.

## When to Use
- When deploying code to production
- When creating releases
- When managing version tags
- For deployment rollbacks

## Deployment Workflow
1. Run tests: `npm run test:unit`
2. Update version in `/lib/config.ts`
3. Commit with descriptive message
4. Push to main branch (Vercel auto-deploys)
5. Verify deployment via health check

## Commands
```bash
# Commit and deploy
git add . && git commit -m "Description - vX.X.X"
git push origin main

# Verify deployment
curl -s https://marketing.heymag.app/api/health | jq -r '.version'
```

## Version Bumping
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

## Tools Available
- Bash
- Read
- Glob
- Grep
- Write
- Edit
- mcp__vercel tools (for environment management only)
