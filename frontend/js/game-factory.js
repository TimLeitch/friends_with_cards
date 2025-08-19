// Game Factory - Manages different game types and their configurations
class GameFactory {
    constructor() {
        this.gameTypes = new Map();
        this.gameConfigs = new Map();
        this.initializeDefaultGames();
    }

    // Register a new game type
    registerGameType(gameType, gameClass, config = {}) {
        this.gameTypes.set(gameType, gameClass);
        this.gameConfigs.set(gameType, config);
        console.log(`Registered game type: ${gameType}`);
    }

    // Get available game types
    getAvailableGameTypes() {
        return Array.from(this.gameTypes.keys());
    }

    // Get game configuration
    getGameConfig(gameType) {
        return this.gameConfigs.get(gameType) || {};
    }

    // Get game class
    getGameClass(gameType) {
        return this.gameTypes.get(gameType);
    }

    // Create a new game instance
    createGame(gameType, gameId, options = {}) {
        const GameClass = this.gameTypes.get(gameType);
        if (!GameClass) {
            throw new Error(`Unknown game type: ${gameType}`);
        }

        // Merge default config with options
        const defaultConfig = this.gameConfigs.get(gameType) || {};
        const finalOptions = this.mergeConfigs(defaultConfig, options);

        return new GameClass(gameId, finalOptions);
    }

    // Merge configurations
    mergeConfigs(defaultConfig, userOptions) {
        const merged = { ...defaultConfig };
        
        for (const [key, value] of Object.entries(userOptions)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                merged[key] = this.mergeConfigs(merged[key] || {}, value);
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    // Get game rules and information
    getGameInfo(gameType) {
        const config = this.gameConfigs.get(gameType);
        if (!config) return null;

        return {
            name: config.name || gameType,
            description: config.description || '',
            minPlayers: config.minPlayers || 2,
            maxPlayers: config.maxPlayers || 4,
            variants: config.variants || [],
            settings: config.settings || {},
            rules: config.rules || {},
            category: config.category || 'card-game',
            difficulty: config.difficulty || 'medium',
            estimatedDuration: config.estimatedDuration || '10-30 minutes'
        };
    }

    // Get all game information
    getAllGameInfo() {
        const games = [];
        for (const gameType of this.gameTypes.keys()) {
            const info = this.getGameInfo(gameType);
            if (info) {
                games.push({ type: gameType, ...info });
            }
        }
        return games;
    }

    // Validate game options
    validateGameOptions(gameType, options) {
        const config = this.gameConfigs.get(gameType);
        if (!config) return { valid: false, message: 'Unknown game type' };

        const errors = [];

        // Validate player count
        if (options.maxPlayers && options.maxPlayers > config.maxPlayers) {
            errors.push(`Maximum players cannot exceed ${config.maxPlayers}`);
        }
        if (options.minPlayers && options.minPlayers < config.minPlayers) {
            errors.push(`Minimum players cannot be less than ${config.minPlayers}`);
        }

        // Validate variants
        if (options.variants) {
            for (const variant of options.variants) {
                if (!config.variants.includes(variant)) {
                    errors.push(`Unknown variant: ${variant}`);
                }
            }
        }

        // Validate settings
        if (options.settings) {
            for (const [key, value] of Object.entries(options.settings)) {
                if (config.settings[key] !== undefined) {
                    const expectedType = typeof config.settings[key];
                    if (typeof value !== expectedType) {
                        errors.push(`Setting ${key} must be of type ${expectedType}`);
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            message: errors.length === 0 ? 'Options valid' : errors.join('; '),
            errors
        };
    }

    // Initialize default games
    initializeDefaultGames() {
        // Blackjack
        this.registerGameType('blackjack', null, {
            name: 'Blackjack',
            description: 'Beat the dealer by getting closer to 21 without going over',
            minPlayers: 1,
            maxPlayers: 7,
            category: 'casino',
            difficulty: 'easy',
            estimatedDuration: '5-15 minutes',
            variants: ['standard', 'double-deck', 'european', 'spanish21'],
            settings: {
                dealerHitsSoft17: true,
                doubleAfterSplit: true,
                surrender: false,
                insurance: true,
                blackjackPays: 1.5,
                deckCount: 1
            },
            rules: {
                objective: 'Get closer to 21 than the dealer without going over',
                cardValues: '2-10 = face value, J/Q/K = 10, A = 1 or 11',
                blackjack: 'Ace + 10-value card pays 3:2',
                dealerRules: 'Dealer must hit on soft 17',
                doubleAfterSplit: 'Can double after splitting pairs',
                surrender: 'Can surrender and lose half bet',
                insurance: 'Can buy insurance when dealer shows Ace'
            }
        });

        // War
        this.registerGameType('war', null, {
            name: 'War',
            description: 'Simple card game where highest card wins',
            minPlayers: 2,
            maxPlayers: 4,
            category: 'simple',
            difficulty: 'very-easy',
            estimatedDuration: '5-20 minutes',
            variants: ['standard', 'speed-war', 'capture-war'],
            settings: {
                autoPlay: false,
                speedMode: false,
                captureMode: false
            },
            rules: {
                objective: 'Win all the cards by having the highest card',
                cardValues: '2-10 = face value, J=11, Q=12, K=13, A=14',
                war: 'Tie results in war - each player deals 3 cards face down, then 1 face up',
                winner: 'Highest card wins all cards in play'
            }
        });

        // Go Fish
        this.registerGameType('go-fish', null, {
            name: 'Go Fish',
            description: 'Collect sets of matching cards by asking other players',
            minPlayers: 2,
            maxPlayers: 6,
            category: 'matching',
            difficulty: 'easy',
            estimatedDuration: '10-25 minutes',
            variants: ['standard', 'speed-go-fish', 'team-go-fish'],
            settings: {
                initialCards: 5,
                askForSpecificCard: true,
                stealFromAll: false
            },
            rules: {
                objective: 'Collect the most sets of 4 matching cards',
                cardValues: '2-10, J, Q, K, A (all equal)',
                asking: 'Ask another player for a specific card value',
                goFish: 'If they don\'t have it, draw from deck',
                sets: 'Collect 4 of the same value to score a point'
            }
        });

        // Poker
        this.registerGameType('poker', null, {
            name: 'Poker',
            description: 'Strategic card game with betting and hand rankings',
            minPlayers: 2,
            maxPlayers: 10,
            category: 'casino',
            difficulty: 'hard',
            estimatedDuration: '15-60 minutes',
            variants: ['texas-holdem', 'omaha', 'seven-card-stud', 'five-card-draw'],
            settings: {
                startingChips: 1000,
                smallBlind: 10,
                bigBlind: 20,
                ante: 0,
                timeLimit: 0
            },
            rules: {
                objective: 'Make the best 5-card hand or bluff opponents to fold',
                handRankings: 'High Card, Pair, Two Pair, Three of a Kind, Straight, Flush, Full House, Four of a Kind, Straight Flush, Royal Flush',
                betting: 'Bet, raise, call, or fold based on hand strength',
                community: 'Some variants use community cards shared by all players'
            }
        });

        // Rummy
        this.registerGameType('rummy', null, {
            name: 'Rummy',
            description: 'Form sets and runs to be the first to discard all cards',
            minPlayers: 2,
            maxPlayers: 6,
            category: 'matching',
            difficulty: 'medium',
            estimatedDuration: '15-45 minutes',
            variants: ['gin-rummy', 'contract-rummy', 'canasta', 'oklahoma-rummy'],
            settings: {
                initialCards: 10,
                jokers: 2,
                wildCards: false,
                meldPoints: 30
            },
            rules: {
                objective: 'Be the first to discard all cards by forming valid sets and runs',
                sets: '3 or 4 cards of the same rank',
                runs: '3 or more consecutive cards of the same suit',
                melding: 'Must meld cards before discarding',
                scoring: 'Points based on remaining cards in hand'
            }
        });

        // Hearts
        this.registerGameType('hearts', null, {
            name: 'Hearts',
            description: 'Avoid taking tricks with hearts and the Queen of Spades',
            minPlayers: 4,
            maxPlayers: 4,
            category: 'trick-taking',
            difficulty: 'medium',
            estimatedDuration: '20-40 minutes',
            variants: ['standard', 'black-lady', 'omnibus-hearts'],
            settings: {
                passCards: true,
                shootTheMoon: true,
                queenPenalty: 13
            },
            rules: {
                objective: 'Score the fewest points by avoiding hearts and Queen of Spades',
                scoring: 'Each heart = 1 point, Queen of Spades = 13 points',
                passing: 'Pass 3 cards to another player each round',
                shooting: 'Take all hearts and Queen to score 0 (shoot the moon)',
                winner: 'Lowest score wins'
            }
        });

        // Spades
        this.registerGameType('spades', null, {
            name: 'Spades',
            description: 'Bid on tricks and try to meet your bid exactly',
            minPlayers: 4,
            maxPlayers: 4,
            category: 'trick-taking',
            difficulty: 'medium',
            estimatedDuration: '20-50 minutes',
            variants: ['standard', 'cutthroat', 'partnership'],
            settings: {
                partnership: true,
                nilBid: true,
                blindNil: false,
                bagPenalty: 100
            },
            rules: {
                objective: 'Meet your bid exactly to score points',
                bidding: 'Each player bids on number of tricks they will take',
                spades: 'Spades trump all other suits',
                nil: 'Bid 0 tricks for bonus points',
                scoring: 'Points for meeting bid, penalties for missing'
            }
        });
    }

    // Get game recommendations based on criteria
    getGameRecommendations(criteria = {}) {
        const games = this.getAllGameInfo();
        let recommendations = games;

        // Filter by player count
        if (criteria.playerCount) {
            recommendations = recommendations.filter(game => 
                game.minPlayers <= criteria.playerCount && 
                game.maxPlayers >= criteria.playerCount
            );
        }

        // Filter by difficulty
        if (criteria.difficulty) {
            recommendations = recommendations.filter(game => 
                game.difficulty === criteria.difficulty
            );
        }

        // Filter by category
        if (criteria.category) {
            recommendations = recommendations.filter(game => 
                game.category === criteria.category
            );
        }

        // Filter by duration
        if (criteria.maxDuration) {
            recommendations = recommendations.filter(game => {
                const duration = game.estimatedDuration;
                const maxMinutes = parseInt(duration.split('-')[1]);
                return maxMinutes <= criteria.maxDuration;
            });
        }

        // Sort by relevance
        recommendations.sort((a, b) => {
            // Prioritize games that match more criteria
            let scoreA = 0, scoreB = 0;
            
            if (criteria.playerCount && a.minPlayers <= criteria.playerCount && a.maxPlayers >= criteria.playerCount) scoreA++;
            if (criteria.playerCount && b.minPlayers <= criteria.playerCount && b.maxPlayers >= criteria.playerCount) scoreB++;
            
            if (criteria.difficulty && a.difficulty === criteria.difficulty) scoreA++;
            if (criteria.difficulty && b.difficulty === criteria.difficulty) scoreB++;
            
            if (criteria.category && a.category === criteria.category) scoreA++;
            if (criteria.category && b.category === criteria.category) scoreB++;

            return scoreB - scoreA;
        });

        return recommendations;
    }

    // Create a quick start game with recommended settings
    createQuickStartGame(gameType, playerCount) {
        const config = this.gameConfigs.get(gameType);
        if (!config) throw new Error(`Unknown game type: ${gameType}`);

        // Adjust settings based on player count
        const adjustedSettings = { ...config.settings };
        
        if (gameType === 'blackjack' && playerCount > 4) {
            adjustedSettings.deckCount = Math.ceil(playerCount / 4);
        }
        
        if (gameType === 'poker' && playerCount > 6) {
            adjustedSettings.startingChips = 1500;
            adjustedSettings.smallBlind = 15;
            adjustedSettings.bigBlind = 30;
        }

        return {
            gameType,
            options: {
                maxPlayers: Math.min(playerCount, config.maxPlayers),
                minPlayers: Math.max(playerCount, config.minPlayers),
                settings: adjustedSettings
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameFactory;
}
