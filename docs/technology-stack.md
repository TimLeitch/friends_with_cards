# Technology Stack Document

## Overview

This document details the technology choices for the Friends with Cards (FWC) platform, explaining why each technology was selected and how it fits into the overall architecture.

## Frontend Technologies

### HTML5 Canvas
**Purpose**: Primary rendering surface for game graphics
**Why Chosen**: 
- Native browser support, no external dependencies
- Excellent performance for 2D graphics
- Full control over rendering pipeline
- Hardware acceleration support

**Use Cases**:
- Card rendering and animations
- Game board visualization
- UI elements and overlays
- Smooth transitions and effects

**Alternatives Considered**:
- WebGL: Overkill for 2D card games
- SVG: Poor performance with many elements
- DOM-based rendering: Limited animation capabilities

### Vanilla JavaScript (ES6+)
**Purpose**: Game logic and user interaction
**Why Chosen**:
- No framework overhead
- Direct canvas API access
- Modern language features (async/await, modules)
- Easy to learn and debug

**Key Features Used**:
- ES6 modules for code organization
- Async/await for WebSocket communication
- Event-driven architecture
- Canvas 2D context API

**Alternatives Considered**:
- React: Unnecessary complexity for canvas-based games
- Vue: Same as React
- TypeScript: Could be added later for type safety

## Backend Technologies

### Node.js
**Purpose**: JavaScript runtime for server-side code
**Why Chosen**:
- JavaScript everywhere (frontend + backend)
- Excellent async I/O performance
- Large ecosystem of packages
- Easy to learn and deploy

**Version**: Node.js 18+ (LTS)
**Key Benefits**:
- Non-blocking I/O for WebSocket connections
- Event-driven architecture
- Fast JSON processing
- Easy debugging and development

### Express.js
**Purpose**: Web application framework
**Why Chosen**:
- Minimal and flexible
- Excellent middleware support
- RESTful API design
- Large community and documentation

**Key Features Used**:
- REST API endpoints
- Middleware for authentication
- Static file serving
- Error handling

### Socket.io
**Purpose**: Real-time bidirectional communication
**Why Chosen**:
- Built on top of WebSockets
- Automatic fallback to other transports
- Room-based architecture
- Built-in reconnection handling

**Key Features Used**:
- WebSocket connections
- Room management for game sessions
- Event-based communication
- Connection state management

## Database Technologies

### PostgreSQL
**Purpose**: Primary persistent data storage
**Why Chosen**:
- ACID compliance for data integrity
- Excellent performance for concurrent users
- Rich data types and constraints
- Mature and reliable

**Schema Design**:
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type VARCHAR(50) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    final_state JSONB
);

-- Game history table
CREATE TABLE game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id),
    player_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    game_state JSONB
);
```

**Alternatives Considered**:
- SQLite: Poor concurrent user support
- MongoDB: Overkill for relational data
- MySQL: Good alternative, but PostgreSQL has better JSON support

### Redis
**Purpose**: High-speed temporary data storage
**Why Chosen**:
- In-memory storage for speed
- Excellent for session data
- Built-in data structures
- Fast pub/sub for real-time features

**Data Storage**:
- Active game sessions
- Player connection status
- Temporary game states
- Session timeouts

**Key Features Used**:
- Hash structures for game state
- Sets for player lists
- Expiration for session cleanup
- Pub/sub for notifications

## Development Tools

### Package Management
**npm**: Standard Node.js package manager
**package.json**: Project dependencies and scripts

### Build Tools
**No bundler initially**: Vanilla JavaScript with ES6 modules
**Future consideration**: Vite or Webpack for production builds

### Development Server
**nodemon**: Auto-restart server on file changes
**Express static**: Serve frontend files during development

### Testing
**Jest**: Unit testing framework
**Supertest**: API endpoint testing
**Socket.io testing**: WebSocket communication testing

### Version Control & CI/CD
**Git**: Version control system
**GitHub**: Repository hosting and collaboration
**GitHub Actions**: Continuous integration and deployment
**GitHub Pages**: Potential hosting for frontend (future consideration)

## Deployment Technologies

### Process Management
**PM2**: Production process manager for Node.js
**Environment**: Configuration management

### Containerization (Future)
**Docker**: Containerized deployment
**Docker Compose**: Multi-service orchestration

## Performance Considerations

### Frontend
- Canvas rendering optimization
- Efficient sprite management
- RequestAnimationFrame for smooth animations
- Minimal DOM manipulation

### Backend
- Redis for fast data access
- Efficient WebSocket broadcasting
- Connection pooling
- Minimal database queries during gameplay

### Database
- Proper indexing on frequently queried fields
- JSONB for flexible game state storage
- Connection pooling
- Query optimization

## Security Technologies

### Input Validation
- Server-side validation for all inputs
- Sanitization of user data
- Rate limiting for API endpoints

### Authentication (Future)
- JWT tokens for session management
- Password hashing with bcrypt
- HTTPS for production deployment

### WebSocket Security
- Connection validation
- Message rate limiting
- Input sanitization

## Monitoring and Logging

### Logging
- Winston for structured logging
- Different log levels (error, warn, info, debug)
- Log rotation and management

### Error Handling
- Global error handlers
- Structured error responses
- Error logging and monitoring

## Future Technology Considerations

### Type Safety
- TypeScript migration path
- Gradual typing adoption
- Better IDE support

### Performance
- WebAssembly for game logic
- Service workers for offline support
- Progressive Web App features

### Scalability
- Load balancing with nginx
- Multiple server instances
- Database sharding strategies
- Microservices architecture

## Technology Stack Summary

| Layer           | Technology                | Purpose                        | Alternatives           |
| --------------- | ------------------------- | ------------------------------ | ---------------------- |
| Frontend        | HTML5 Canvas + Vanilla JS | Game rendering and interaction | WebGL, SVG, React      |
| Backend Runtime | Node.js                   | JavaScript server runtime      | Python, Go, Java       |
| Web Framework   | Express.js                | HTTP API and middleware        | FastAPI, Gin, Spring   |
| Real-time       | Socket.io                 | WebSocket communication        | Raw WebSockets, SockJS |
| Database        | PostgreSQL                | Persistent data storage        | MySQL, MongoDB, SQLite |
| Cache           | Redis                     | Temporary data storage         | Memcached, In-memory   |
| Package Manager | npm                       | Dependency management          | yarn, pnpm             |
| Process Manager | PM2                       | Production deployment          | Docker, systemd        |
| Version Control | Git + GitHub              | Source code management         | GitLab, Bitbucket      |
| CI/CD           | GitHub Actions            | Automated workflows            | Jenkins, CircleCI      |

This technology stack provides a solid foundation for a real-time multiplayer card game while maintaining simplicity and performance. Each technology was chosen for its specific strengths in the given use case.
