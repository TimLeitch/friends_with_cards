class Canvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCard(x, y, card, isFaceUp = true) {
    const cardWidth = 100;
    const cardHeight = 140;
    this.ctx.fillStyle = isFaceUp ? "white" : "blue";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(x, y, cardWidth, cardHeight);
    this.ctx.strokeRect(x, y, cardWidth, cardHeight);

    if (isFaceUp) {
      this.ctx.fillStyle = "black";
      this.ctx.font = "20px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(card.value, x + cardWidth / 2, y + cardHeight / 2);
    }
  }

  drawText(text, x, y, options = {}) {
    this.ctx.fillStyle = options.color || "white";
    this.ctx.font = options.font || "24px Arial";
    this.ctx.textAlign = options.align || "center";
    this.ctx.fillText(text, x, y);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Canvas;
}
