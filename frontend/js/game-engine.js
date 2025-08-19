// Core Game Engine - Handles basic card operations and game framework
class GameEngine {
    constructor() {
        this.games = new Map();
        this.gameTypes = new Map();
        this.registerDefaultGames();
    }

    // Register a new game type
    registerGameType(gameType, gameClass) {
        this.gameTypes.set(gameType, gameClass);
        console.log(`Registered game type: ${gameType}`);
    }

    // Create a new game instance
    createGame(gameType, gameId, options = {}) {
        const GameClass = this.gameTypes.get(gameType);
        if (!GameClass) {
            throw new Error(`Unknown game type: ${gameType}`);
        }

        const game = new GameClass(gameId, options);
        this.games.set(gameId, game);
        return game;
    }

    // Get a game instance
    getGame(gameId) {
        return this.games.get(gameId);
    }

    // Remove a game instance
    removeGame(gameId) {
        this.games.delete(gameId);
    }

    // Get all active games
    getActiveGames() {
        return Array.from(this.games.values());
    }

    // Register default game types
    registerDefaultGames() {
        this.registerGameType('blackjack', BlackjackGame);
        this.registerGameType('war', WarGame);
        this.registerGameType('go-fish', GoFishGame);
        this.registerGameType('poker', PokerGame);
        this.registerGameType('rummy', RummyGame);
    }
}

// Base Card class
class Card {
    constructor(suit, value, options = {}) {
        this.suit = suit;
        this.value = value;
        this.id = `${value}_${suit}`;
        this.displayValue = value;
        this.numericValue = this.calculateNumericValue(value);
        this.visible = options.visible !== false; // Default to visible
        this.selected = false;
        this.highlighted = false;
        this.metadata = options.metadata || {};
    }

    calculateNumericValue(value) {
        if (value === 'A') return 11; // Ace can be 1 or 11
        if (['K', 'Q', 'J'].includes(value)) return 10;
        return parseInt(value);
    }

    // Clone the card
    clone() {
        return new Card(this.suit, this.value, {
            visible: this.visible,
            metadata: { ...this.metadata }
        });
    }

    // Toggle visibility
    toggleVisibility() {
        this.visible = !this.visible;
    }

    // Set visibility
    setVisibility(visible) {
        this.visible = visible;
    }

    // Toggle selection
    toggleSelection() {
        this.selected = !this.selected;
    }

    // Set selection
    setSelection(selected) {
        this.selected = selected;
    }

    // Toggle highlight
    toggleHighlight() {
        this.highlighted = !this.highlighted;
    }

    // Set highlight
    setHighlight(highlighted) {
        this.highlighted = highlighted;
    }
}

// Base Deck class
class Deck {
    constructor(options = {}) {
        this.cards = [];
        this.options = {
            jokers: options.jokers || 0,
            suits: options.suits || ['hearts', 'diamonds', 'clubs', 'spades'],
            values: options.values || ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
            ...options
        };
        this.initialize();
    }

    initialize() {
        this.cards = [];
        
        // Add standard cards
        for (const suit of this.options.suits) {
            for (const value of this.options.values) {
                this.cards.push(new Card(suit, value));
            }
        }

        // Add jokers if specified
        for (let i = 0; i < this.options.jokers; i++) {
            this.cards.push(new Card('joker', 'JOKER', { 
                visible: true,
                metadata: { isJoker: true }
            }));
        }
    }

    // Shuffle using Fisher-Yates algorithm
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this;
    }

    // Deal cards to multiple players
    dealCards(numCards, numPlayers) {
        if (this.cards.length < numCards * numPlayers) {
            throw new Error(`Not enough cards: need ${numCards * numPlayers}, have ${this.cards.length}`);
        }

        const hands = Array.from({ length: numPlayers }, () => []);
        
        for (let i = 0; i < numCards; i++) {
            for (let j = 0; j < numPlayers; j++) {
                if (this.cards.length > 0) {
                    hands[j].push(this.cards.pop());
                }
            }
        }

        return hands;
    }

    // Deal a single card
    dealCard() {
        if (this.cards.length === 0) {
            throw new Error('No cards left in deck');
        }
        return this.cards.pop();
    }

    // Deal multiple cards to one player
    dealMultipleCards(numCards) {
        if (this.cards.length < numCards) {
            throw new Error(`Not enough cards: need ${numCards}, have ${this.cards.length}`);
        }

        const hand = [];
        for (let i = 0; i < numCards; i++) {
            hand.push(this.cards.pop());
        }
        return hand;
    }

    // Cut the deck
    cut() {
        const cutPoint = Math.floor(Math.random() * this.cards.length);
        const topHalf = this.cards.slice(0, cutPoint);
        const bottomHalf = this.cards.slice(cutPoint);
        this.cards = [...bottomHalf, ...topHalf];
        return this;
    }

    // Get deck size
    size() {
        return this.cards.length;
    }

    // Check if deck is empty
    isEmpty() {
        return this.cards.length === 0;
    }

    // Get remaining cards (for debugging)
    getRemainingCards() {
        return [...this.cards];
    }

    // Reset deck to original state
    reset() {
        this.initialize();
        return this;
    }
}

// Base Game class that all games extend
class BaseGame {
    constructor(gameId, options = {}) {
        this.gameId = gameId;
        this.options = {
            maxPlayers: options.maxPlayers || 4,
            minPlayers: options.minPlayers || 2,
            variants: options.variants || [],
            settings: options.settings || {},
            ...options
        };
        
        this.players = [];
        this.deck = null;
        this.gameState = 'waiting';
        this.currentTurn = 0;
        this.gameData = {};
        this.history = [];
        this.createdAt = new Date();
        this.startedAt = null;
        this.endedAt = null;
        
        this.initializeGame();
    }

    // Initialize the game (override in subclasses)
    initializeGame() {
        // Override in subclasses
    }

    // Add a player to the game
    addPlayer(player) {
        if (this.players.length >= this.options.maxPlayers) {
            throw new Error('Game is full');
        }
        
        if (this.players.find(p => p.id === player.id)) {
            throw new Error('Player already in game');
        }

        this.players.push(player);
        
        if (this.players.length >= this.options.minPlayers && this.gameState === 'waiting') {
            this.gameState = 'ready';
        }

        this.logAction('player_joined', { playerId: player.id, playerName: player.username });
    }

    // Remove a player from the game
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            const player = this.players[index];
            this.players.splice(index, 1);
            
            if (this.players.length < this.options.minPlayers) {
                this.gameState = 'waiting';
            }

            this.logAction('player_left', { playerId: player.id, playerName: player.username });
        }
    }

    // Start the game
    startGame() {
        if (this.players.length < this.options.minPlayers) {
            throw new Error(`Need at least ${this.options.minPlayers} players to start`);
        }

        this.gameState = 'playing';
        this.startedAt = new Date();
        this.currentTurn = 0;
        
        this.onGameStart();
        this.logAction('game_started', {});
    }

    // End the game
    endGame() {
        this.gameState = 'finished';
        this.endedAt = new Date();
        this.onGameEnd();
        this.logAction('game_ended', {});
    }

    // Log game actions
    logAction(action, data) {
        this.history.push({
            timestamp: new Date(),
            action,
            data,
            playerId: data.playerId || null
        });
    }

    // Get current game state
    getGameState() {
        return {
            gameId: this.gameId,
            gameState: this.gameState,
            players: this.players.map(p => ({
                id: p.id,
                username: p.username,
                handSize: p.hand ? p.hand.length : 0,
                handValue: p.handValue || 0,
                isCurrentTurn: this.players.indexOf(p) === this.currentTurn
            })),
            currentTurn: this.currentTurn,
            gameData: this.gameData,
            deckSize: this.deck ? this.deck.size() : 0,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            endedAt: this.endedAt
        };
    }

    // Get game history
    getGameHistory() {
        return [...this.history];
    }

    // Check if game can start
    canStart() {
        return this.players.length >= this.options.minPlayers && this.gameState === 'ready';
    }

    // Check if game is active
    isActive() {
        return this.gameState === 'playing';
    }

    // Check if game is finished
    isFinished() {
        return this.gameState === 'finished';
    }

    // Get current player
    getCurrentPlayer() {
        return this.players[this.currentTurn];
    }

    // Advance to next turn
    nextTurn() {
        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.logAction('turn_changed', { 
            newTurn: this.currentTurn,
            playerId: this.getCurrentPlayer().id 
        });
    }

    // Override methods for subclasses
    onGameStart() {
        // Override in subclasses
    }

    onGameEnd() {
        // Override in subclasses
    }

    onPlayerAction(playerId, action, data) {
        // Override in subclasses
    }

    // Validate game action
    validateAction(playerId, action, data) {
        // Override in subclasses
        return { valid: true, message: 'Action valid' };
    }

    // Get available actions for a player
    getAvailableActions(playerId) {
        // Override in subclasses
        return [];
    }

    // Get game rules
    getGameRules() {
        // Override in subclasses
        return {
            name: 'Base Game',
            description: 'Base game class - override in subclasses',
            minPlayers: this.options.minPlayers,
            maxPlayers: this.options.maxPlayers,
            variants: this.options.variants,
            settings: this.options.settings
        };
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        GameEngine, 
        Card, 
        Deck, 
        BaseGame 
    };
}
