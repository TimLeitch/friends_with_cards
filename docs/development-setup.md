# Development Environment Setup Guide

## Overview

This guide will help you set up the Friends with Cards development environment on your local machine. The project uses Docker for database services and Node.js for the application server.

## Prerequisites

- **Docker & Docker Compose**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd friends_with_cards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env if you need to customize database settings
   ```

4. **Start development services**
   ```bash
   npm run dev:setup
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/health

## Development Services

### Database Services (Docker)

The project uses Docker Compose to manage PostgreSQL and Redis services:

- **PostgreSQL**: Database for game data and user management
  - Port: 5432
  - Database: `friends_with_cards`
  - User: `fwc_user`
  - Password: `fwc_password`

- **Redis**: Caching and session management
  - Port: 6379
  - No password required for development

### Application Server

- **Backend**: Express.js server with Socket.io
  - Port: 3000 (configurable via .env)
  - Auto-reload with nodemon in development

- **Frontend**: Static HTML/CSS/JS served by Express
  - Canvas-based card game interface
  - Real-time updates via WebSocket

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:setup        # Start Docker services
npm run dev:down         # Stop Docker services
npm run dev:logs         # View Docker service logs

# Database
npm run db:reset         # Reset database (removes all data)

# Testing & Quality
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues

# Production
npm run start            # Start production server
npm run build            # Build process (no compilation needed)
```

## Project Structure

```
friends_with_cards/
├── backend/                 # Backend server code
│   ├── db/                 # Database configuration and scripts
│   │   ├── config.js       # Database connection setup
│   │   └── init/           # Database initialization scripts
│   ├── utils/              # Utility functions
│   │   └── logger.js       # Logging configuration
│   └── server.js           # Main server file
├── frontend/               # Frontend application
│   ├── js/                 # JavaScript files
│   │   ├── games/          # Game implementations
│   │   │   └── blackjack.js # Blackjack game logic
│   │   ├── game-engine.js  # Core game engine
│   │   ├── game-factory.js # Game factory and configuration
│   │   ├── ui.js           # UI management
│   │   └── main.js         # Main application logic
│   ├── styles/             # CSS stylesheets
│   │   └── main.css        # Main stylesheet
│   └── index.html          # Main HTML file
├── docs/                   # Documentation
├── scripts/                # Development scripts
│   └── dev-setup.sh        # Development setup script
├── docker-compose.yml      # Docker services configuration
├── env.example             # Environment variables template
└── package.json            # Project dependencies and scripts
```

## Game Engine Architecture

### Modular Design

The project uses a modular game engine architecture that allows easy addition of new card games:

- **BaseGame**: Abstract base class for all games
- **GameFactory**: Manages game types and configurations
- **Card/Deck**: Core card management classes
- **Game Implementations**: Specific game logic (Blackjack, War, etc.)

### Adding New Games

1. **Create game class** extending `BaseGame`
2. **Register game type** in `GameFactory`
3. **Implement game-specific logic** (rules, scoring, etc.)
4. **Add UI components** for the new game

Example:
```javascript
class MyNewGame extends BaseGame {
    constructor(gameId, options = {}) {
        super(gameId, options);
        // Game-specific initialization
    }
    
    onGameStart() {
        // Custom game start logic
    }
    
    // ... other game methods
}

// Register in GameFactory
gameFactory.registerGameType('my-new-game', MyNewGame, {
    name: 'My New Game',
    minPlayers: 2,
    maxPlayers: 4,
    // ... configuration
});
```

## Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=friends_with_cards
DB_USER=fwc_user
DB_PASSWORD=fwc_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=debug
```

### Game Settings

Games can be configured with different variants and settings:

```javascript
// Blackjack with custom settings
const blackjackOptions = {
    variants: ['standard', 'double-deck'],
    settings: {
        dealerHitsSoft17: true,
        surrender: true,
        deckCount: 2
    }
};
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   # Kill the process or change PORT in .env
   ```

2. **Database connection failed**
   ```bash
   # Check if Docker services are running
   docker-compose ps
   # Restart services
   npm run dev:setup
   ```

3. **Permission denied on scripts**
   ```bash
   chmod +x scripts/*.sh
   ```

4. **Docker services won't start**
   ```bash
   # Check Docker is running
   docker info
   # View service logs
   npm run dev:logs
   ```

### Reset Everything

If you need to start fresh:

```bash
# Stop and remove all containers and volumes
npm run db:reset

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart development environment
npm run dev:setup
npm run dev
```

## Development Workflow

1. **Start development environment**
   ```bash
   npm run dev:setup
   npm run dev
   ```

2. **Make code changes** - Server auto-reloads with nodemon

3. **Test changes** in browser at http://localhost:3000

4. **Run tests** to ensure nothing is broken
   ```bash
   npm run test
   ```

5. **Check code style**
   ```bash
   npm run lint
   ```

6. **Commit changes** with descriptive messages

## Next Steps

After setting up the development environment:

1. **Explore the codebase** - Start with `backend/server.js` and `frontend/js/main.js`
2. **Try the existing games** - Blackjack is fully implemented
3. **Add new features** - The modular architecture makes it easy to extend
4. **Write tests** - Add tests for new functionality
5. **Contribute** - Submit pull requests for improvements

## Support

If you encounter issues:

1. Check this documentation
2. Review the troubleshooting section
3. Check GitHub issues for similar problems
4. Create a new issue with detailed information

Happy coding! 🎮♠️♥️♦️♣️
