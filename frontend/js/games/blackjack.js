// Blackjack Game Implementation
class BlackjackGame extends BaseGame {
    constructor(gameId, options = {}) {
        // Set Blackjack-specific defaults
        const blackjackOptions = {
            maxPlayers: 7, // Standard Blackjack table size
            minPlayers: 1, // Can play against dealer
            variants: ['standard', 'double-deck', 'european', 'spanish21'],
            settings: {
                dealerHitsSoft17: true,
                doubleAfterSplit: true,
                surrender: false,
                insurance: true,
                blackjackPays: 1.5, // 3:2 payout
                ...options.settings
            },
            ...options
        };

        super(gameId, blackjackOptions);
        
        // Blackjack-specific properties
        this.dealer = {
            id: 'dealer',
            username: 'Dealer',
            hand: [],
            handValue: 0,
            isDealer: true
        };
        
        this.gameData = {
            pot: 0,
            bets: new Map(),
            round: 0,
            deckCount: options.deckCount || 1,
            shoe: null, // Multiple deck shoe
            ...this.gameData
        };
    }

    initializeGame() {
        // Create shoe with specified number of decks
        this.gameData.shoe = new Deck({
            jokers: 0,
            suits: ['hearts', 'diamonds', 'clubs', 'spades'],
            values: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        });

        // If using multiple decks, create them
        if (this.gameData.deckCount > 1) {
            for (let i = 1; i < this.gameData.deckCount; i++) {
                const additionalDeck = new Deck();
                this.gameData.shoe.cards.push(...additionalDeck.cards);
            }
        }

        this.gameData.shoe.shuffle().cut();
        this.deck = this.gameData.shoe; // Reference to shoe
    }

    onGameStart() {
        // Reset game state
        this.gameData.round = 1;
        this.gameData.pot = 0;
        this.gameData.bets.clear();
        
        // Reset all player hands
        this.players.forEach(player => {
            player.hand = [];
            player.handValue = 0;
            player.bet = 0;
            player.insurance = 0;
            player.doubled = false;
            player.surrendered = false;
            player.blackjack = false;
            player.bust = false;
        });

        // Reset dealer
        this.dealer.hand = [];
        this.dealer.handValue = 0;

        // Deal initial cards
        this.dealInitialCards();
    }

    dealInitialCards() {
        // Deal 2 cards to each player and dealer
        for (let i = 0; i < 2; i++) {
            // Deal to players first
            this.players.forEach(player => {
                const card = this.deck.dealCard();
                player.hand.push(card);
                this.updatePlayerHandValue(player);
            });

            // Deal to dealer
            const card = this.deck.dealCard();
            this.dealer.hand.push(card);
            
            // Hide dealer's second card initially
            if (i === 1) {
                card.setVisibility(false);
            }
        }

        this.updateDealerHandValue();

        // Check for natural blackjacks
        this.checkNaturalBlackjacks();
    }

    updatePlayerHandValue(player) {
        player.handValue = this.calculateHandValue(player.hand);
        player.blackjack = this.isBlackjack(player.hand);
        player.bust = this.isBust(player.hand);
    }

    updateDealerHandValue() {
        // Only count visible cards for dealer
        const visibleCards = this.dealer.hand.filter(card => card.visible);
        this.dealer.handValue = this.calculateHandValue(visibleCards);
    }

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

    isBlackjack(hand) {
        return hand.length === 2 && this.calculateHandValue(hand) === 21;
    }

    isBust(hand) {
        return this.calculateHandValue(hand) > 21;
    }

    isSoftHand(hand) {
        return hand.some(card => card.value === 'A') && 
               this.calculateHandValue(hand) <= 21;
    }

    checkNaturalBlackjacks() {
        this.players.forEach(player => {
            if (player.blackjack) {
                this.logAction('natural_blackjack', { 
                    playerId: player.id, 
                    playerName: player.username 
                });
            }
        });

        if (this.isBlackjack(this.dealer.hand)) {
            this.logAction('dealer_blackjack', {});
            this.endRound();
        }
    }

    // Player actions
    hit(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.isActive()) return false;

        const card = this.deck.dealCard();
        player.hand.push(card);
        this.updatePlayerHandValue(player);

        this.logAction('hit', { 
            playerId: player.id, 
            playerName: player.username,
            card: card.id 
        });

        if (player.bust) {
            this.logAction('bust', { 
                playerId: player.id, 
                playerName: player.username 
            });
        }

        return true;
    }

    stand(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.isActive()) return false;

        this.logAction('stand', { 
            playerId: player.id, 
            playerName: player.username 
        });

        // Check if all players have finished
        if (this.allPlayersFinished()) {
            this.playDealerHand();
        }

        return true;
    }

    double(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.isActive()) return false;

        // Can only double on first two cards
        if (player.hand.length !== 2) return false;

        // Double the bet
        player.bet *= 2;
        player.doubled = true;

        // Deal one more card
        this.hit(playerId);

        // Automatically stand after double
        this.stand(playerId);

        this.logAction('double', { 
            playerId: player.id, 
            playerName: player.username,
            newBet: player.bet 
        });

        return true;
    }

    split(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.isActive()) return false;

        // Can only split on first two cards of same value
        if (player.hand.length !== 2) return false;
        if (player.hand[0].value !== player.hand[1].value) return false;

        // Create split hands
        const originalHand = player.hand;
        player.hands = [
            [originalHand[0]],
            [originalHand[1]]
        ];

        // Deal one card to each split hand
        player.hands[0].push(this.deck.dealCard());
        player.hands[1].push(this.deck.dealCard());

        // Update hand values
        player.handValues = [
            this.calculateHandValue(player.hands[0]),
            this.calculateHandValue(player.hands[1])
        ];

        this.logAction('split', { 
            playerId: player.id, 
            playerName: player.username 
        });

        return true;
    }

    surrender(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.isActive()) return false;

        // Can only surrender on first two cards
        if (player.hand.length !== 2) return false;

        player.surrendered = true;
        player.bet = Math.floor(player.bet / 2); // Lose half the bet

        this.logAction('surrender', { 
            playerId: player.id, 
            playerName: player.username 
        });

        // Check if all players have finished
        if (this.allPlayersFinished()) {
            this.playDealerHand();
        }

        return true;
    }

    insurance(playerId, amount) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.isActive()) return false;

        // Can only buy insurance when dealer shows Ace
        if (this.dealer.hand[0].value !== 'A') return false;

        player.insurance = amount;

        this.logAction('insurance', { 
            playerId: player.id, 
            playerName: player.username,
            amount: amount 
        });

        return true;
    }

    allPlayersFinished() {
        return this.players.every(player => 
            player.bust || player.stand || player.surrendered || player.blackjack
        );
    }

    playDealerHand() {
        // Reveal dealer's hidden card
        this.dealer.hand.forEach(card => card.setVisibility(true));
        this.updateDealerHandValue();

        // Dealer plays according to rules
        while (this.dealer.handValue < 17 || 
               (this.dealer.handValue === 17 && this.isSoftHand(this.dealer.hand) && this.options.settings.dealerHitsSoft17)) {
            
            const card = this.deck.dealCard();
            this.dealer.hand.push(card);
            this.updateDealerHandValue();

            this.logAction('dealer_hit', { card: card.id });
        }

        this.logAction('dealer_stand', { finalValue: this.dealer.handValue });
        this.endRound();
    }

    endRound() {
        // Determine winners and payouts
        this.determineWinners();
        
        // End the game
        this.endGame();
    }

    determineWinners() {
        this.players.forEach(player => {
            if (player.surrendered) {
                // Already handled in surrender
                return;
            }

            let payout = 0;
            let result = '';

            if (player.blackjack) {
                payout = Math.floor(player.bet * this.options.settings.blackjackPays);
                result = 'blackjack';
            } else if (player.bust) {
                payout = 0; // Lose entire bet
                result = 'bust';
            } else if (this.dealer.bust) {
                payout = player.bet * 2; // Win
                result = 'dealer_bust';
            } else if (player.handValue > this.dealer.handValue) {
                payout = player.bet * 2; // Win
                result = 'win';
            } else if (player.handValue < this.dealer.handValue) {
                payout = 0; // Lose
                result = 'lose';
            } else {
                payout = player.bet; // Push (tie)
                result = 'push';
            }

            // Handle insurance
            if (player.insurance > 0 && this.dealer.blackjack) {
                payout += player.insurance * 2;
            }

            player.payout = payout;
            player.result = result;

            this.logAction('round_result', {
                playerId: player.id,
                playerName: player.username,
                result: result,
                payout: payout,
                bet: player.bet
            });
        });
    }

    // Override base methods
    getAvailableActions(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.isActive()) return [];

        const actions = [];

        if (player.hand.length === 2) {
            actions.push('hit', 'stand');
            
            if (player.hand[0].value === player.hand[1].value) {
                actions.push('split');
            }
            
            if (this.options.settings.surrender) {
                actions.push('surrender');
            }
            
            if (this.dealer.hand[0].value === 'A' && this.options.settings.insurance) {
                actions.push('insurance');
            }
        } else if (player.hand.length > 2) {
            actions.push('hit', 'stand');
        }

        return actions;
    }

    validateAction(playerId, action, data) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { valid: false, message: 'Player not found' };
        }

        if (!this.isActive()) {
            return { valid: false, message: 'Game not active' };
        }

        const availableActions = this.getAvailableActions(playerId);
        if (!availableActions.includes(action)) {
            return { valid: false, message: `Action ${action} not available` };
        }

        // Specific validation for each action
        switch (action) {
            case 'double':
                if (player.hand.length !== 2) {
                    return { valid: false, message: 'Can only double on first two cards' };
                }
                break;
            case 'split':
                if (player.hand.length !== 2 || player.hand[0].value !== player.hand[1].value) {
                    return { valid: false, message: 'Can only split pairs' };
                }
                break;
            case 'surrender':
                if (player.hand.length !== 2) {
                    return { valid: false, message: 'Can only surrender on first two cards' };
                }
                break;
        }

        return { valid: true, message: 'Action valid' };
    }

    getGameRules() {
        return {
            name: 'Blackjack',
            description: 'Beat the dealer by getting closer to 21 without going over',
            minPlayers: this.options.minPlayers,
            maxPlayers: this.options.maxPlayers,
            variants: this.options.variants,
            settings: this.options.settings,
            rules: {
                objective: 'Get closer to 21 than the dealer without going over',
                cardValues: '2-10 = face value, J/Q/K = 10, A = 1 or 11',
                blackjack: 'Ace + 10-value card pays 3:2',
                dealerRules: `Dealer must hit on soft 17: ${this.options.settings.dealerHitsSoft17}`,
                doubleAfterSplit: this.options.settings.doubleAfterSplit,
                surrender: this.options.settings.surrender,
                insurance: this.options.settings.insurance
            }
        };
    }

    // Get current game state with Blackjack-specific data
    getGameState() {
        const baseState = super.getGameState();
        return {
            ...baseState,
            dealer: {
                handSize: this.dealer.hand.length,
                handValue: this.dealer.handValue,
                visibleCards: this.dealer.hand.filter(card => card.visible).map(card => card.id)
            },
            gameData: {
                ...baseState.gameData,
                round: this.gameData.round,
                pot: this.gameData.pot,
                deckCount: this.gameData.deckCount
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlackjackGame;
}
