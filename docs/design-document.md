# Design Document - Friends with Cards (FWC)

## System Overview

Friends with Cards (FWC) is a real-time multiplayer platform that allows multiple players to join game sessions and play card games through their web browsers. The system is designed for local network multiplayer, focusing on simplicity and real-time responsiveness.

## Core Architecture

### High-Level System Design

```text
┌─────────────┐    WebSocket    ┌─────────────┐    HTTP API    ┌─────────────┐
│   Browser   │ ←────────────→ │   Express   │ ←──────────→ │ PostgreSQL  │
│   Client    │   Real-time    │    Server   │   REST API   │  Database   │
└─────────────┘                └─────────────┘               └─────────────┘
       │                              │
       │                              │
       │                              └─────────────┐
       │                                            │
       │                              ┌─────────────┐│
       └─────────────────────────────→│    Redis   ││
                                      │   Cache    ││
                                      └─────────────┘│
                                                     │
                                      ┌─────────────┐│
                                      │   Shared   ││
                                      │  Utilities ││
                                      └─────────────┘
```

## Component Breakdown

### 1. Frontend (Browser Client)

**Technology**: HTML5 Canvas + Vanilla JavaScript
**Purpose**: Game rendering and user interaction

**Key Components**:

- **Game Canvas**: Main rendering surface for cards and game elements
- **Card Renderer**: Handles individual card display and animations
- **Input Handler**: Processes mouse/touch interactions
- **Game UI**: Score display, turn indicators, game controls
- **WebSocket Client**: Manages real-time communication with server

**Responsibilities**:

- Render game state visually
- Handle user input (card selection, drag & drop)
- Maintain smooth animations
- Display game information
- Manage WebSocket connection

### 2. Backend Server

**Technology**: Node.js + Express + Socket.io
**Purpose**: Game logic, state management, and real-time communication

**Key Components**:

- **HTTP API Server**: REST endpoints for game management
- **WebSocket Server**: Real-time game updates and player communication
- **Game Engine**: Core game logic and rules
- **Session Manager**: Handles active game sessions
- **Player Manager**: Tracks connected players and their states

**Responsibilities**:

- Host game sessions
- Validate player actions
- Broadcast game state changes
- Manage player connections
- Enforce game rules

### 3. Database Layer

**Technology**: PostgreSQL
**Purpose**: Persistent data storage

**Stores**:

- User accounts and profiles
- Game history and statistics
- Game configurations and rules
- Session metadata

### 4. Cache Layer

**Technology**: Redis
**Purpose**: High-speed temporary data storage

**Stores**:

- Active game sessions
- Current game states
- Player connection status
- Temporary game data

## Data Flow

### Game Session Lifecycle

1. **Session Creation**
   - Player creates new game session
   - Server generates unique session ID
   - Session data stored in Redis
   - Session metadata stored in PostgreSQL

2. **Player Joining**
   - Player connects via WebSocket
   - Server validates connection
   - Player added to session
   - Current game state sent to new player

3. **Gameplay**
   - Player performs action (plays card, etc.)
   - Action sent to server via WebSocket
   - Server validates action against game rules
   - If valid, game state updated
   - Updated state broadcast to all players
   - Frontend renders new state

4. **Session End**
   - Game completes or session abandoned
   - Final game state saved to PostgreSQL
   - Session data cleared from Redis
   - Players disconnected

### Real-time Communication

**WebSocket Events**:

- `player_joined`: New player enters game
- `player_left`: Player disconnects
- `card_played`: Card action performed
- `game_state_update`: Complete game state refresh
- `turn_change`: Player turn switches
- `game_end`: Game completion

## Game State Management

### State Structure

```javascript
{
  sessionId: "uuid",
  gameType: "blackjack",
  players: [
    {
      id: "player1",
      name: "Alice",
      hand: ["AS", "KH"],
      score: 21,
      isCurrentTurn: true
    }
  ],
  deck: ["2C", "3C", "4C", ...],
  gamePhase: "playing",
  lastAction: {
    player: "player1",
    action: "hit",
    timestamp: "2024-01-01T12:00:00Z"
  }
}
```

### State Synchronization

- **Full Sync**: Complete state sent on player join
- **Delta Updates**: Only changed portions sent during gameplay
- **Conflict Resolution**: Server is authoritative, client updates are validated
- **Recovery**: Disconnected players receive full state on reconnection

## Performance Considerations

### Frontend Optimization

- Canvas rendering optimization
- Efficient card sprite management
- Smooth animation frames
- Minimal DOM manipulation

### Backend Optimization

- Redis for fast game state access
- Efficient WebSocket broadcasting
- Connection pooling
- Minimal database queries during gameplay

### Network Optimization

- Compressed WebSocket messages
- Efficient state delta calculations
- Connection keep-alive management
- Graceful degradation for poor connections

## Security Considerations

### Input Validation

- All player actions validated server-side
- Game rule enforcement
- Anti-cheat measures

### Session Security

- Unique session IDs
- Player authentication
- Session timeout management

### Network Security

- WebSocket connection validation
- Rate limiting
- Input sanitization

## Scalability Considerations

### Current Scope (Local Multiplayer)

- Single server instance
- Local network deployment
- 2-8 players per session
- 10-50 concurrent sessions

### Future Expansion Possibilities

- Multiple server instances
- Load balancing
- Global multiplayer support
- Cloud deployment

## Testing Strategy

### Unit Testing

- Game logic functions
- State management
- Input validation

### Integration Testing

- WebSocket communication
- Database operations
- API endpoints

### End-to-End Testing

- Complete game sessions
- Multiplayer scenarios
- Cross-browser compatibility

## Deployment Strategy

### Development Environment

- Local Node.js server
- Local PostgreSQL and Redis
- Hot reloading for development

### Production Environment

- Single server deployment
- Process management (PM2)
- Environment configuration
- Logging and monitoring
