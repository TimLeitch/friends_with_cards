// UI management and DOM manipulation
class GameUI {
  constructor() {
    this.currentView = "lobby";
    this.currentGame = null;
    this.initializeEventListeners();
  }

  // Initialize all event listeners
  initializeEventListeners() {
    // Lobby controls
    document.getElementById("create-game-btn").addEventListener("click", () => {
      this.showModal("create-game-modal");
    });

    document.getElementById("join-game-btn").addEventListener("click", () => {
      this.showModal("join-game-modal");
    });

    // Modal controls
    document.getElementById("cancel-create").addEventListener("click", () => {
      this.hideModal("create-game-modal");
    });

    document.getElementById("cancel-join").addEventListener("click", () => {
      this.hideModal("join-game-modal");
    });

    // Form submissions
    document
      .getElementById("create-game-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleCreateGame();
      });

    document
      .getElementById("join-game-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleJoinGame();
      });

    // Game controls
    document.getElementById("leave-game-btn").addEventListener("click", () => {
      this.leaveGame();
    });
  }

  // Show modal
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "flex";
    }
  }

  // Hide modal
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Handle create game form submission
  handleCreateGame() {
    const formData = new FormData(document.getElementById("create-game-form"));
    const gameData = {
      name: formData.get("game-name"),
      type: formData.get("game-type"),
      maxPlayers: parseInt(formData.get("max-players")),
    };

    // Emit create game event
    if (window.gameSocket) {
      window.gameSocket.emit("create_game", gameData);
    }

    this.hideModal("create-game-modal");
    document.getElementById("create-game-form").reset();
  }

  // Handle join game form submission
  handleJoinGame() {
    const formData = new FormData(document.getElementById("join-game-form"));
    const gameId = formData.get("game-id");

    // Emit join game event
    if (window.gameSocket) {
      window.gameSocket.emit("join_game", { gameId });
    }

    this.hideModal("join-game-modal");
    document.getElementById("join-game-form").reset();
  }

  // Switch to game view
  showGameView(gameData) {
    this.currentView = "game";
    this.currentGame = gameData;

    // Hide lobby, show game board
    document.getElementById("game-lobby").style.display = "none";
    document.getElementById("game-board").style.display = "block";
    this.showCanvas();

    // Update game info
    document.getElementById("game-title").textContent = gameData.name;
    document.getElementById(
      "game-status"
    ).textContent = `Game Type: ${gameData.type}`;

    // Update player areas
    this.updatePlayerAreas(gameData.players);
  }

  // Switch to lobby view
  showLobbyView() {
    this.currentView = "lobby";
    this.currentGame = null;

    // Show lobby, hide game board
    document.getElementById("game-lobby").style.display = "block";
    document.getElementById("game-board").style.display = "none";
    this.hideCanvas();

    // Clear game data
    this.clearGameData();
  }

  showCanvas() {
    document.getElementById("game-canvas-container").style.display = "flex";
  }

  hideCanvas() {
    document.getElementById("game-canvas-container").style.display = "none";
  }

  // Update player areas
  updatePlayerAreas(players) {
    const playerArea = document.getElementById("player-area");
    const opponentArea = document.getElementById("opponent-area");

    // Clear existing content
    playerArea.innerHTML = "";
    opponentArea.innerHTML = "";

    // Find current player (assuming first player for now)
    const currentPlayer = players[0];
    const opponents = players.slice(1);

    // Display current player's hand
    if (currentPlayer && currentPlayer.hand) {
      this.displayHand(playerArea, currentPlayer.hand, "Your Hand");
    } else {
      playerArea.innerHTML = "<p>Your hand will appear here</p>";
    }

    // Display opponents
    if (opponents.length > 0) {
      opponents.forEach((opponent, index) => {
        const opponentDiv = document.createElement("div");
        opponentDiv.className = "opponent";
        opponentDiv.innerHTML = `
                    <h4>Player ${index + 1}</h4>
                    <p>Cards: ${opponent.handSize || 0}</p>
                `;
        opponentArea.appendChild(opponentDiv);
      });
    } else {
      opponentArea.innerHTML = "<p>Waiting for other players...</p>";
    }
  }

  // Display a hand of cards
  displayHand(container, hand, title) {
    const handDiv = document.createElement("div");
    handDiv.className = "hand";

    const titleElement = document.createElement("h4");
    titleElement.textContent = title;
    handDiv.appendChild(titleElement);

    const cardsDiv = document.createElement("div");
    cardsDiv.className = "cards";

    hand.forEach((card) => {
      const cardElement = this.createCardElement(card);
      cardsDiv.appendChild(cardElement);
    });

    handDiv.appendChild(cardsDiv);
    container.appendChild(handDiv);
  }

  // Create a card element
  createCardElement(card) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.dataset.cardId = card.id;

    const suitSymbol = this.getSuitSymbol(card.suit);
    const suitClass = `suit-${card.suit}`;

    cardDiv.innerHTML = `
            <div class="card-value">${card.displayValue}</div>
            <div class="card-suit ${suitClass}">${suitSymbol}</div>
        `;

    // Add click event for card selection
    cardDiv.addEventListener("click", () => {
      this.selectCard(card, cardDiv);
    });

    return cardDiv;
  }

  // Get suit symbol
  getSuitSymbol(suit) {
    const symbols = {
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣",
      spades: "♠",
    };
    return symbols[suit] || suit;
  }

  // Handle card selection
  selectCard(card, cardElement) {
    // Remove previous selection
    document.querySelectorAll(".card.selected").forEach((c) => {
      c.classList.remove("selected");
    });

    // Add selection to current card
    cardElement.classList.add("selected");

    // Emit card selection event
    if (window.gameSocket && this.currentGame) {
      window.gameSocket.emit("select_card", {
        gameId: this.currentGame.id,
        cardId: card.id,
      });
    }
  }

  // Update connection status
  updateConnectionStatus(status) {
    const indicator = document.getElementById("status-indicator");
    if (indicator) {
      indicator.className = `status-indicator status-${status}`;
      indicator.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // Update games list
  updateGamesList(games) {
    const gamesList = document.getElementById("games-list");
    if (!gamesList) return;

    gamesList.innerHTML = "";

    if (games.length === 0) {
      gamesList.innerHTML = "<p>No active games</p>";
      return;
    }

    games.forEach((game) => {
      const gameElement = this.createGameElement(game);
      gamesList.appendChild(gameElement);
    });
  }

  // Create game list item
  createGameElement(game) {
    const gameDiv = document.createElement("div");
    gameDiv.className = "game-item";

    gameDiv.innerHTML = `
            <h4>${game.name}</h4>
            <div class="game-meta">
                <p>Type: ${game.type}</p>
                <p>Players: ${game.currentPlayers}/${game.maxPlayers}</p>
                <p>Status: ${game.status}</p>
            </div>
            <div class="game-actions">
                <button class="btn btn-primary btn-sm" onclick="gameUI.joinGame('${game.id}')">
                    Join Game
                </button>
            </div>
        `;

    return gameDiv;
  }

  // Join a specific game
  joinGame(gameId) {
    if (window.gameSocket) {
      window.gameSocket.emit("join_game", { gameId });
    }
  }

  // Leave current game
  leaveGame() {
    if (window.gameSocket && this.currentGame) {
      window.gameSocket.emit("leave_game", { gameId: this.currentGame.id });
    }

    this.showLobbyView();
  }

  // Clear game data
  clearGameData() {
    this.currentGame = null;
    document.getElementById("player-area").innerHTML = "";
    document.getElementById("opponent-area").innerHTML = "";
    document.getElementById("table-area").innerHTML = "";
  }

  // Show notification
  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Update game status
  updateGameStatus(status) {
    const statusElement = document.getElementById("game-status");
    if (statusElement) {
      statusElement.textContent = status;
    }
  }
}

// Create global instance
const gameUI = new GameUI();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GameUI;
}
