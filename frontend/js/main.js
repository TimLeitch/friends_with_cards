// Main application entry point
class FriendsWithCards {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.currentGame = null;
    this.isConnected = false;
    this.canvas = new Canvas("game-canvas");

    this.initialize();
    this.checkLoginStatus();
  }

  // Initialize the application
  initialize() {
    this.initializeSocket();
    this.setupSocketEventHandlers();
    this.loadGamesList();
    this.canvas.drawText(
      "Welcome to Friends with Cards!",
      this.canvas.canvas.width / 2,
      50
    );
  }

  // Initialize WebSocket connection
  initializeSocket() {
    try {
      this.socket = io();
      window.gameSocket = this.socket; // Make globally accessible

      this.socket.on("connect", () => {
        this.handleConnect();
      });

      this.socket.on("disconnect", () => {
        this.handleDisconnect();
      });

      this.socket.on("connect_error", (error) => {
        this.handleConnectionError(error);
      });
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      gameUI.showNotification("Failed to connect to game server", "error");
    }
  }

  // Setup WebSocket event handlers
  setupSocketEventHandlers() {
    if (!this.socket) return;

    // Game events
    this.socket.on("game_created", (data) => {
      this.handleGameCreated(data);
    });

    this.socket.on("game_joined", (data) => {
      this.handleGameJoined(data);
    });

    this.socket.on("game_updated", (data) => {
      this.handleGameUpdated(data);
    });

    this.socket.on("game_started", (data) => {
      this.handleGameStarted(data);
    });

    this.socket.on("game_ended", (data) => {
      this.handleGameEnded(data);
    });

    this.socket.on("player_joined", (data) => {
      this.handlePlayerJoined(data);
    });

    this.socket.on("player_left", (data) => {
      this.handlePlayerLeft(data);
    });

    this.socket.on("card_dealt", (data) => {
      this.handleCardDealt(data);
    });

    this.socket.on("game_action", (data) => {
      this.handleGameAction(data);
    });

    // Error events
    this.socket.on("error", (data) => {
      this.handleError(data);
    });

    // System events
    this.socket.on("games_list_updated", (data) => {
      this.handleGamesListUpdated(data);
    });

    // Settings form submission
    document
      .getElementById("settings-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settings = Object.fromEntries(formData.entries());

        try {
          const response = await fetch("/api/user/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
          });

          if (response.ok) {
            gameUI.showNotification("Settings updated successfully", "success");
            gameUI.hideModal("settings-modal");
            this.user.settings = await response.json();
          } else {
            gameUI.showNotification("Failed to update settings", "error");
          }
        } catch (error) {
          console.error("Failed to update settings:", error);
          gameUI.showNotification("Failed to update settings", "error");
        }
      });
  }

  // Check login status
  async checkLoginStatus() {
    try {
      const response = await fetch("/api/user/me");
      if (response.ok) {
        const data = await response.json();
        this.user = data;

        // Apply theme from user settings
        if (this.user.settings && this.user.settings.theme) {
          localStorage.setItem("theme", this.user.settings.theme);
          gameUI.loadTheme();
        }

        gameUI.updateUserIcon(data.user.username);
        document.getElementById("user-menu").style.display = "block";
        document.getElementById("auth-buttons").style.display = "none";
      } else {
        // Not logged in, show login/register buttons
        document.getElementById("user-menu").style.display = "none";
        document.getElementById("auth-buttons").style.display = "flex";
      }
    } catch (error) {
      console.error("Failed to check login status:", error);
    }
  }

  // Login user
  async login(username, password) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        gameUI.showNotification("Login failed", "error");
      }
    } catch (error) {
      console.error("Login failed:", error);
      gameUI.showNotification("Login failed", "error");
    }
  }

  // Register user
  async register(username, password) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        gameUI.showNotification("Registration failed", "error");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      gameUI.showNotification("Registration failed", "error");
    }
  }

  // Logout user
  async logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        window.location.reload();
      } else {
        gameUI.showNotification("Logout failed", "error");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      gameUI.showNotification("Logout failed", "error");
    }
  }

  // Handle successful connection
  handleConnect() {
    this.isConnected = true;
    this.playerId = this.socket.id;

    gameUI.updateConnectionStatus("connected");
    gameUI.showNotification("Connected to game server", "success");

    console.log("Connected to game server with ID:", this.playerId);

    // Request updated games list
    this.loadGamesList();
  }

  // Handle disconnection
  handleDisconnect() {
    this.isConnected = false;
    gameUI.updateConnectionStatus("disconnected");
    gameUI.showNotification("Disconnected from game server", "warning");

    console.log("Disconnected from game server");
  }

  // Handle connection error
  handleConnectionError(error) {
    this.isConnected = false;
    gameUI.updateConnectionStatus("disconnected");
    gameUI.showNotification("Connection error: " + error.message, "error");

    console.error("Connection error:", error);
  }

  // Handle game created event
  handleGameCreated(data) {
    console.log("Game created:", data);
    gameUI.showNotification(
      `Game "${data.name}" created successfully!`,
      "success"
    );

    // Switch to game view
    this.currentGame = data;
    gameUI.showGameView(data);

    // Update games list
    this.loadGamesList();
  }

  // Handle game joined event
  handleGameJoined(data) {
    console.log("Joined game:", data);
    gameUI.showNotification(`Joined game "${data.name}"`, "success");

    // Switch to game view
    this.currentGame = data;
    gameUI.showGameView(data);
  }

  // Handle game updated event
  handleGameUpdated(data) {
    console.log("Game updated:", data);

    if (this.currentGame && this.currentGame.id === data.id) {
      this.currentGame = data;
      gameUI.updatePlayerAreas(data.players);
      gameUI.updateGameStatus(`Status: ${data.status}`);
    }
  }

  // Handle game started event
  handleGameStarted(data) {
    console.log("Game started:", data);
    gameUI.showNotification("Game started!", "success");

    if (this.currentGame && this.currentGame.id === data.id) {
      this.currentGame = data;
      gameUI.updateGameStatus("Game in progress");
      gameUI.updatePlayerAreas(data.players);
    }
  }

  // Handle game ended event
  handleGameEnded(data) {
    console.log("Game ended:", data);
    gameUI.showNotification("Game ended", "info");

    // Return to lobby
    this.currentGame = null;
    gameUI.showLobbyView();

    // Update games list
    this.loadGamesList();
  }

  // Handle player joined event
  handlePlayerJoined(data) {
    console.log("Player joined:", data);
    gameUI.showNotification(`${data.playerName} joined the game`, "info");

    if (this.currentGame && this.currentGame.id === data.gameId) {
      // Update player areas
      this.loadGameState(data.gameId);
    }
  }

  // Handle player left event
  handlePlayerLeft(data) {
    console.log("Player left:", data);
    gameUI.showNotification(`${data.playerName} left the game`, "warning");

    if (this.currentGame && this.currentGame.id === data.gameId) {
      // Update player areas
      this.loadGameState(data.gameId);
    }
  }

  // Handle card dealt event
  handleCardDealt(data) {
    console.log("Card dealt:", data);

    if (this.currentGame && this.currentGame.id === data.gameId) {
      // Update player areas
      this.loadGameState(data.gameId);
    }
  }

  // Handle game action event
  handleGameAction(data) {
    console.log("Game action:", data);

    if (this.currentGame && this.currentGame.id === data.gameId) {
      // Handle specific game actions
      switch (data.action) {
        case "hit":
          gameUI.showNotification(`${data.playerName} hit`, "info");
          break;
        case "stand":
          gameUI.showNotification(`${data.playerName} stood`, "info");
          break;
        case "fold":
          gameUI.showNotification(`${data.playerName} folded`, "info");
          break;
        default:
          console.log("Unknown game action:", data.action);
      }

      // Update game state
      this.loadGameState(data.gameId);
    }
  }

  // Handle error event
  handleError(data) {
    console.error("Server error:", data);
    gameUI.showNotification(`Error: ${data.message}`, "error");
  }

  // Handle games list updated event
  handleGamesListUpdated(data) {
    console.log("Games list updated:", data);
    gameUI.updateGamesList(data.games || []);
  }

  // Load games list from server
  loadGamesList() {
    if (this.socket && this.isConnected) {
      this.socket.emit("get_games_list");
    }
  }

  // Load specific game state
  loadGameState(gameId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("get_game_state", { gameId });
    }
  }

  // Create a new game
  createGame(gameData) {
    if (this.socket && this.isConnected) {
      this.socket.emit("create_game", gameData);
    } else {
      gameUI.showNotification("Not connected to server", "error");
    }
  }

  // Join an existing game
  joinGame(gameId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("join_game", { gameId });
    } else {
      gameUI.showNotification("Not connected to server", "error");
    }
  }

  // Leave current game
  leaveGame() {
    if (this.socket && this.isConnected && this.currentGame) {
      this.socket.emit("leave_game", { gameId: this.currentGame.id });
    }

    this.currentGame = null;
    gameUI.showLobbyView();
  }

  // Send game action
  sendGameAction(action, data = {}) {
    if (this.socket && this.isConnected && this.currentGame) {
      this.socket.emit("game_action", {
        gameId: this.currentGame.id,
        action,
        ...data,
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      playerId: this.playerId,
      currentGame: this.currentGame,
    };
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Friends with Cards...");

  // Create global app instance
  window.app = new FriendsWithCards();

  // Add some basic error handling
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    if (window.gameUI) {
      window.gameUI.showNotification("An error occurred", "error");
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    if (window.gameUI) {
      window.gameUI.showNotification("An error occurred", "error");
    }
  });

  const createGameBtn = document.getElementById("create-game-btn");
  const createGameModal = document.getElementById("create-game-modal");
  const cancelCreateBtn = document.getElementById("cancel-create");
  const gameList = document.getElementById("game-list");
  const createGameForm = document.getElementById("create-game-form");

  createGameBtn.addEventListener("click", () => {
    createGameModal.style.display = "block";
  });

  cancelCreateBtn.addEventListener("click", () => {
    createGameModal.style.display = "none";
  });

  // Fetch and display active games
  const fetchActiveGames = async () => {
    try {
      const response = await fetch("/api/games");
      const games = await response.json();
      gameList.innerHTML = "";
      games.forEach((game) => {
        const li = document.createElement("li");
        li.textContent = `${game.name} (${game.game_type}) - Created by ${game.creator} - ${game.current_players}/${game.max_players} players`;
        if (game.has_password) {
          const lockIcon = document.createElement("span");
          lockIcon.textContent = " 🔒";
          li.appendChild(lockIcon);
        }
        gameList.appendChild(li);
      });
    } catch (err) {
      console.error("Error fetching active games:", err);
    }
  };

  // Handle create game form submission
  createGameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const gameName = document.getElementById("game-name").value;
    const gameType = document.getElementById("game-type").value;
    const gamePassword = document.getElementById("game-password").value;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: gameName,
          game_type: gameType,
          password: gamePassword,
        }),
      });
      if (response.ok) {
        fetchActiveGames();
        createGameForm.reset();
        createGameModal.style.display = "none";
      } else {
        const err = await response.json();
        console.error("Error creating game:", err.error);
      }
    } catch (err) {
      console.error("Error creating game:", err);
    }
  });

  // Initial fetch of active games
  fetchActiveGames();

  console.log("Friends with Cards initialized successfully!");
});

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = FriendsWithCards;
}
