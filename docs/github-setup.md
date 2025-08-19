# GitHub Setup Guide

This document provides step-by-step instructions for setting up the GitHub repository and configuring GitHub Actions for the Friends with Cards (FWC) project.

## Repository Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `friends-with-cards`
   - **Description**: `A browser-based, real-time multiplayer card game platform for friends and family`
   - **Visibility**: Choose Public or Private based on your preference
   - **Initialize with**: Check "Add a README file"
   - **Add .gitignore**: Select "Node" from the dropdown
   - **Choose a license**: Select "MIT License"
5. Click "Create repository"

### 2. Clone Repository Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/friends-with-cards.git

# Navigate to the project directory
cd friends-with-cards

# Verify the remote origin
git remote -v
```

### 3. Update Repository Information

Edit the `package.json` file to update the repository URLs:

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/friends-with-cards.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/friends-with-cards/issues"
  },
  "homepage": "https://github.com/yourusername/friends-with-cards#readme"
}
```

Replace `yourusername` with your actual GitHub username.

## GitHub Actions Configuration

### 1. Workflow File

The project includes a basic GitHub Actions workflow at `.github/workflows/ci.yml`. This workflow:

- **Triggers**: Runs on pushes to `main` and `develop` branches, and on pull requests
- **Node.js Versions**: Tests against Node.js 18.x and 20.x
- **Jobs**:
  - **Test**: Installs dependencies, runs linting, tests, and build
  - **Security**: Runs security audits and vulnerability checks

### 2. Workflow Features

#### Matrix Testing
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

Tests the project against multiple Node.js versions to ensure compatibility.

#### Caching
```yaml
with:
  cache: 'npm'
```

Uses GitHub's built-in npm caching to speed up dependency installation.

#### Security Scanning
```yaml
- name: Run security audit
  run: npm audit --audit-level moderate
  continue-on-error: true
```

Runs npm security audits to identify potential vulnerabilities.

### 3. Enabling GitHub Actions

1. GitHub Actions are automatically enabled when you push the workflow file
2. Go to your repository on GitHub
3. Click the "Actions" tab
4. You should see the CI workflow listed
5. Click on it to view the workflow details

## Branch Strategy

### 1. Main Branch
- **Purpose**: Production-ready code
- **Protection**: Enable branch protection rules
- **Requirements**: Require status checks to pass before merging

### 2. Develop Branch
- **Purpose**: Integration branch for features
- **Protection**: Enable branch protection rules
- **Requirements**: Require status checks to pass before merging

### 3. Feature Branches
- **Naming**: `feature/feature-name` or `feature/issue-number-description`
- **Purpose**: Individual feature development
- **Workflow**: Create from develop, merge back to develop

### 4. Hotfix Branches
- **Naming**: `hotfix/issue-number-description`
- **Purpose**: Critical bug fixes for production
- **Workflow**: Create from main, merge to both main and develop

## Branch Protection Rules

### 1. Enable Branch Protection

1. Go to repository Settings
2. Click "Branches" in the left sidebar
3. Click "Add rule" or edit existing rules
4. Configure protection for `main` and `develop` branches

### 2. Recommended Settings

- **Require a pull request before merging**: Enabled
- **Require status checks to pass before merging**: Enabled
- **Require branches to be up to date before merging**: Enabled
- **Restrict pushes that create files**: Enabled
- **Require linear history**: Optional (depends on team preference)

## Pull Request Workflow

### 1. Creating Pull Requests

1. Create a feature branch from `develop`
2. Make your changes and commit them
3. Push the branch to GitHub
4. Create a pull request to merge into `develop`
5. Add description, labels, and assignees as needed

### 2. Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Local testing completed
- [ ] All tests pass
- [ ] No console errors

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated if needed
```

## Issues and Project Management

### 1. Issue Templates

Create `.github/ISSUE_TEMPLATE/` directory with templates:

#### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., 1.0.0]
```

#### Feature Request Template
```markdown
## Feature Description
Clear description of the requested feature

## Use Case
Why this feature is needed

## Proposed Solution
How you think it should work

## Alternatives Considered
Other approaches you've considered
```

### 2. Project Board

1. Go to repository "Projects" tab
2. Create a new project board
3. Add columns: Backlog, In Progress, Review, Done
4. Link issues to the project board
5. Use automation to move issues between columns

## GitHub Pages (Future Consideration)

### 1. Setup
1. Go to repository Settings
2. Click "Pages" in the left sidebar
3. Select source branch (usually `main` or `gh-pages`)
4. Configure custom domain if desired

### 2. Use Cases
- **Documentation**: Host project documentation
- **Demo**: Live demo of the card game
- **Landing Page**: Project showcase

## Security Features

### 1. Dependabot
1. Go to repository Settings
2. Click "Security & analysis" in the left sidebar
3. Enable "Dependabot alerts" and "Dependabot security updates"
4. Configure update schedule and reviewers

### 2. Code Scanning
1. Enable GitHub Advanced Security (if available)
2. Set up CodeQL analysis
3. Configure security policies

## Monitoring and Notifications

### 1. Repository Insights
- **Traffic**: View clone and visit statistics
- **Contributors**: Track contribution activity
- **Commits**: Monitor commit frequency and patterns

### 2. Notifications
- **Watch**: Choose notification preferences
- **Email**: Configure email notification settings
- **Mobile**: Enable mobile push notifications

## Troubleshooting

### 1. Common Issues

#### Workflow Not Running
- Check if the workflow file is in the correct location
- Verify the workflow syntax is valid
- Check branch protection rules

#### Dependencies Not Installing
- Verify `package-lock.json` is committed
- Check Node.js version compatibility
- Review npm cache settings

#### Security Checks Failing
- Run `npm audit fix` locally
- Update vulnerable dependencies
- Review security advisories

### 2. Getting Help
- **GitHub Docs**: [docs.github.com](https://docs.github.com)
- **GitHub Community**: [github.community](https://github.community)
- **Stack Overflow**: Tag questions with `github-actions`

## Next Steps

1. **Complete Repository Setup**: Follow the steps above
2. **Customize Workflows**: Modify GitHub Actions as needed
3. **Set Up Branch Protection**: Configure repository settings
4. **Create Issue Templates**: Set up project management
5. **Test Workflows**: Make a test commit to verify CI/CD

This setup provides a solid foundation for collaborative development and automated quality assurance using GitHub's built-in features.
