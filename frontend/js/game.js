// Game logic and card management
class CardGame {
    constructor() {
        this.deck = [];
        this.players = [];
        this.currentPlayer = 0;
        this.gameType = null;
        this.gameState = 'waiting';
        this.initializeDeck();
    }

    // Initialize a standard 52-card deck
    initializeDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        this.deck = [];
        for (const suit of suits) {
            for (const value of values) {
                this.deck.push({
                    suit,
                    value,
                    id: `${value}_${suit}`,
                    displayValue: value,
                    numericValue: this.getNumericValue(value)
                });
            }
        }
    }

    // Get numeric value for card (for games like Blackjack)
    getNumericValue(value) {
        if (value === 'A') return 11; // Ace can be 1 or 11
        if (['K', 'Q', 'J'].includes(value)) return 10;
        return parseInt(value);
    }

    // Shuffle the deck using Fisher-Yates algorithm
    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    // Deal cards to players
    dealCards(numCards, numPlayers) {
        if (this.deck.length < numCards * numPlayers) {
            throw new Error('Not enough cards in deck');
        }

        const hands = [];
        for (let i = 0; i < numPlayers; i++) {
            hands.push([]);
        }

        for (let i = 0; i < numCards; i++) {
            for (let j = 0; j < numPlayers; j++) {
                if (this.deck.length > 0) {
                    hands[j].push(this.deck.pop());
                }
            }
        }

        return hands;
    }

    // Deal a single card
    dealCard() {
        if (this.deck.length === 0) {
            throw new Error('No cards left in deck');
        }
        return this.deck.pop();
    }

    // Calculate hand value (for Blackjack)
    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value === 'A') {
                aces += 1;
            } else {
                value += card.numericValue;
            }
        }

        // Add aces
        for (let i = 0; i < aces; i++) {
            if (value + 11 <= 21) {
                value += 11;
            } else {
                value += 1;
            }
        }

        return value;
    }

    // Check if hand is bust (over 21)
    isBust(hand) {
        return this.calculateHandValue(hand) > 21;
    }

    // Check if hand is blackjack (exactly 21 with 2 cards)
    isBlackjack(hand) {
        return hand.length === 2 && this.calculateHandValue(hand) === 21;
    }

    // Reset the game
    reset() {
        this.initializeDeck();
        this.shuffle();
        this.players = [];
        this.currentPlayer = 0;
        this.gameState = 'waiting';
    }

    // Get deck size
    getDeckSize() {
        return this.deck.length;
    }

    // Get remaining cards (for debugging)
    getRemainingCards() {
        return [...this.deck];
    }
}

// Game session management
class GameSession {
    constructor(id, name, gameType, maxPlayers) {
        this.id = id;
        this.name = name;
        this.gameType = gameType;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.game = new CardGame();
        this.status = 'waiting';
        this.createdAt = new Date();
        this.currentTurn = 0;
        this.gameData = {};
    }

    // Add player to session
    addPlayer(player) {
        if (this.players.length >= this.maxPlayers) {
            throw new Error('Game is full');
        }
        
        if (this.players.find(p => p.id === player.id)) {
            throw new Error('Player already in game');
        }

        this.players.push(player);
        
        if (this.players.length >= 2 && this.status === 'waiting') {
            this.status = 'ready';
        }
    }

    // Remove player from session
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            
            if (this.players.length < 2) {
                this.status = 'waiting';
            }
        }
    }

    // Start the game
    startGame() {
        if (this.players.length < 2) {
            throw new Error('Need at least 2 players to start');
        }

        this.status = 'playing';
        this.game.reset();
        this.currentTurn = 0;
        this.dealInitialCards();
    }

    // Deal initial cards based on game type
    dealInitialCards() {
        switch (this.gameType) {
            case 'blackjack':
                this.dealBlackjackInitial();
                break;
            case 'war':
                this.dealWarInitial();
                break;
            case 'go-fish':
                this.dealGoFishInitial();
                break;
            default:
                throw new Error(`Unknown game type: ${this.gameType}`);
        }
    }

    // Deal initial cards for Blackjack
    dealBlackjackInitial() {
        const hands = this.game.dealCards(2, this.players.length);
        this.players.forEach((player, index) => {
            player.hand = hands[index];
            player.handValue = this.game.calculateHandValue(player.hand);
        });
    }

    // Deal initial cards for War
    dealWarInitial() {
        const hands = this.game.dealCards(Math.floor(52 / this.players.length), this.players.length);
        this.players.forEach((player, index) => {
            player.hand = hands[index];
        });
    }

    // Deal initial cards for Go Fish
    dealGoFishInitial() {
        const hands = this.game.dealCards(5, this.players.length);
        this.players.forEach((player, index) => {
            player.hand = hands[index];
        });
    }

    // Get current game state
    getGameState() {
        return {
            id: this.id,
            name: this.name,
            gameType: this.gameType,
            status: this.status,
            players: this.players.map(p => ({
                id: p.id,
                username: p.username,
                handSize: p.hand ? p.hand.length : 0,
                handValue: p.handValue || 0
            })),
            currentTurn: this.currentTurn,
            gameData: this.gameData
        };
    }

    // End the game
    endGame() {
        this.status = 'finished';
        this.gameData.endTime = new Date();
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardGame, GameSession };
}
