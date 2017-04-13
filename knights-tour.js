class KnightsTour {
  constructor(cols = 8, rows = 8) {
    if (cols > 8 || cols < 5 || rows > 8 || rows < 5) {
      throw new Error('Not a valid board size');
    }
    // components
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sqSize = null;
    // defaults
    this.cols = cols;
    this.rows = rows;
    this.grid = [];
    this.tour = [];
    this.files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    this.ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    this.moves = [
      [1, 2],
      [2, 1],
      [1, -2],
      [2, -1],
      [-1, 2],
      [-2, 1],
      [-1, -2],
      [-2, -1],
    ];
    this.total = this.cols * this.rows;
    // animation settings
    this.time = Date.now();
    this.increment = 0; // < increments values between points
    this.run = false;
    this.animTour = [];
    this.animPoints = [];
    this.animCount = 0;
    // bindings
    this.transformLabel = this.transformLabel.bind(this);
    this.goOnTour = this.goOnTour.bind(this);
    this.filterSquare = this.filterSquare.bind(this);
    this.render = this.render.bind(this);
    this.draw = this.draw.bind(this);
    this.drawRect = this.drawRect.bind(this);
    this.drawText = this.drawText.bind(this);
    this.drawPoints = this.drawPoints.bind(this);
    this.moveKnight = this.moveKnight.bind(this);
    this.stop = this.stop.bind(this);
    this.toggleTour = this.toggleTour.bind(this);
    // creates the chessboard with stored data
    this.populateGrid();
    // events
    this.canvas.addEventListener('click', this.toggleTour);
  }
  populateGrid() {
    const { cols, rows, grid } = this;
    const files = this.files.slice(0, cols);
    const ranks = this.ranks.slice(this.ranks.length - rows);
    let count = 0;
    for (let row = 0; row < rows; row += 1) {
      grid.push([]);
      for (let col = 0; col < cols; col += 1) {
        // store an object so we can easily reference them later.
        grid[row][col] = {
          id: count += 1,
          pos: [col, row],
          moves: [],
          label: `${files[col]}${ranks[row]}`,
          color: col % 2 === row % 2 ? '#ffce9e' : '#d18b47',
        };
        // filters legal moves per square
        this.filterMoves(grid[row][col]);
      }
    }
  }
  filterMoves(tile) {
    const { moves, cols, rows } = this;
    const [x, y] = tile.pos;
    return moves.filter(move => {
      const [mx, my] = move;
      const cx = x + mx;
      const cy = y + my;
      // adds valid moves if the points exist within the grid space
      if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
        tile.moves.push([cx, cy]);
      }
      return this;
    });
  }
  toggleTour(event) {
    const { sqSize, cols, rows, grid, tour, total } = this;
    // checkered board offset minus the gutter
    const offsetX = event.target.offsetLeft + sqSize;
    const offsetY = event.target.offsetTop + sqSize;
    const x = event.clientX - offsetX;
    const y = event.clientY - offsetY;
    const width = cols * sqSize;
    const height = rows * sqSize;
    // active board
    if (x >= 0 && x < width && y >= 0 && y < height) {
      let label;
      grid.map(row => row.filter(col => {
        const [px, py] = col.pos;
        const cx = px * sqSize;
        const cy = py * sqSize;
        if (x >= cx && x < cx + sqSize && y >= cy && y < cy + sqSize) {
          label = col.label;
        }
        return false;
      }));
      if (tour.length === total) {
        this.reset();
      } else {
        this.startSquare(label);
        this.start();
      }
    }
  }
  startSquare(label) {
    // transforms the given label to usable points
    const knightPos = this.transformLabel(label);
    this.goOnTour(knightPos);
    return this;
  }
  start() {
    this.run = true;
    this.draw();
  }
  stop() {
    this.run = false;
    cancelAnimationFrame(this.draw);
  }
  reset() {
    this.stop();
    this.grid = [];
    this.tour = [];
    this.animTour = [];
    this.animPoints = [];
    this.time = Date.now();
    this.increment = 0;
    this.animCount = 0;
    this.populateGrid();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBoard();
  }
  transformLabel(label) {
    const file = label.substr(0, 1);
    const rank = label.substring(1);
    const square = [file, rank];
    // remove unused files and ranks
    const files = this.files.slice(0, this.cols);
    const ranks = this.ranks.slice(this.ranks.length - this.rows);
    // set points
    const x = files.indexOf(file);
    const y = ranks.indexOf(parseInt(rank, 10));
    // check if valid
    if (x < 0 || y < 0 || square.length !== 2) {
      throw new Error(`${label} is not a valid square`);
    }
    return [x, y];
  }
  goOnTour(startPos) {
    // This is where the the main stuff happens
    const { grid, tour, total, filterSquare, goOnTour } = this;
    const startSquare = grid[startPos[1]][startPos[0]];
    const nextSquares = [];
    const nextMoves = [];
    let nextSquare;
    // store all the next squares and their moves
    startSquare.moves.map(move => {
      nextSquare = grid[move[1]][move[0]];
      nextSquares.push(nextSquare);
      nextMoves.push(nextSquare.moves.length);
      return false;
    });
    // filters the next square with the lowest amount of moves
    nextSquares.filter(next => {
      if (next.moves.length === Math.min(...nextMoves)) {
        nextSquare = next;
      }
      return false;
    });
    // filters out the current square from all the available moves
    filterSquare(startPos);
    // store the square
    tour.push(startSquare.pos);
    // end when all the squares are filled.
    if (tour.length === total) {
      return;
    }
    // repeat
    goOnTour(nextSquare.pos);
  }
  filterSquare(square) {
    this.grid.map(row => row.map(col =>
      col.moves.filter((move, i) => {
        if (move[0] === square[0] && move[1] === square[1]) {
          col.moves.splice(i, 1);
        }
        return false;
      })));
  }
  render({ sqSize, container }) {
    this.sqSize = sqSize;
    // style
    const gutterX = (this.cols + 2) * sqSize;
    const gutterY = (this.rows + 2) * sqSize;
    Object.assign(this.canvas, {
      width: gutterX,
      height: gutterY,
    });
    container.appendChild(this.canvas);
    this.drawBoard();
  }
  draw() {
    const { draw, run, total, canvas, ctx, tour, animTour, animPoints } = this;
    // standard timed redraw;
    requestAnimationFrame(draw);
    if (!run) return;
    // timings
    const now = Date.now();
    const delta = now - this.time;
    const interval = 1000 / 60;
    // redraw
    if (delta > interval) {
      this.time = now - (delta % interval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawBoard();
      if (this.animCount < tour.length) {
        const [startX, startY] = tour[this.animCount];
        const [endX, endY] = tour[this.animCount + 1] ?
          tour[this.animCount + 1] :
          tour[this.animCount];
        if (this.increment === 0 && this.animCount === 0) {
          animPoints.push(tour[this.animCount]);
        }
        this.increment += 0.05;
        animTour.push([
          startX + ((endX - startX) * this.increment),
          startY + ((endY - startY) * this.increment),
        ]);
        this.drawPoints(animPoints);
        this.drawPath(animTour);
        this.moveKnight([
          startX + ((endX - startX) * this.increment),
          startY + ((endY - startY) * this.increment),
        ]);
        if (this.increment > 1) {
          this.increment = 0;
          this.animCount += 1;
          if (this.animCount !== total) {
            animPoints.push(tour[this.animCount]);
          }
        }
      } else {
        this.drawPoints(animPoints);
        this.drawPath(animTour);
        this.moveKnight(tour[this.animCount - 1]);
        this.stop();
      }
    }
  }
  drawBoard() {
    const { sqSize, grid, drawRect, cols, rows } = this;
    const gutterX = cols + 2;
    const gutterY = rows + 2;
    // gutter
    this.drawRect(0, 0, gutterX * sqSize, gutterY * sqSize, '#ebebeb');
    // file labels
    for (let i = 0; i <= cols + 1; i += 1) {
      const offsetCols = i * sqSize;
      if (i > 1 && i < gutterX) {
        this.drawLabel('file', sqSize / 2, offsetCols, i);
      }
    }
    // rank labels
    for (let j = 0; j <= rows + 1; j += 1) {
      const offsetRows = j * sqSize;
      if (j > 1 && j < gutterY) {
        this.drawLabel('rank', sqSize / 2, offsetRows, j);
      }
    }
    grid.map(row => row.map(col => {
      const offsetX = sqSize + (col.pos[0] * sqSize);
      const offsetY = sqSize + (col.pos[1] * sqSize);
      drawRect(offsetX, offsetY, sqSize, sqSize, col.color);
      return false;
    }));
  }
  drawPath(path) {
    const { ctx, sqSize, animTour } = this;
    const [x, y] = animTour[0];
    const origin = sqSize / 2;
    const oX = sqSize + (x * origin);
    const oY = sqSize + (y * origin);
    // draw path
    ctx.moveTo(oX, oY);
    ctx.beginPath();
    ctx.strokeStyle = '#5a72be';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    path.map(point => {
      const [px, py] = point;
      const start = sqSize + (px * sqSize);
      const end = sqSize + (py * sqSize);
      return ctx.lineTo(start + origin, end + origin);
    });
    ctx.stroke();
  }
  drawPoints(points) {
    const { sqSize, drawRect } = this;
    const [startX, startY] = points;
    const color = 'rgba(120, 120, 244, 0.4)';
    if (points.length) {
      drawRect(
        sqSize + (startX * sqSize),
        sqSize + (startY * sqSize),
        sqSize,
        sqSize,
        color);
      points.map(point => {
        const [x, y] = point;
        return drawRect(
          sqSize + (x * sqSize),
          sqSize + (y * sqSize),
          sqSize,
          sqSize,
          color);
      });
    }
  }
  drawRect(x, y, width, height, color) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
  moveKnight(pos) {
    const { sqSize, drawText } = this;
    const [x, y] = pos;
    drawText(
      '♞',
      sqSize + ((x + 0.5) * sqSize),
      sqSize + ((y + 0.5) * sqSize),
      '36px sans-serif');
  }
  drawText(value, x, y, font = '16px sans-serif') {
    const { ctx } = this;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(value, x, y);
  }
  drawLabel(type, center, offset, count) {
    const { sqSize, cols, rows } = this;
    const size = sqSize;
    const width = cols * size;
    const height = rows * size;
    const files = this.files.slice(0, cols);
    const ranks = this.ranks.slice(this.ranks.length - rows);

    // label offsets
    const double = size * 2;
    const right = double + (width - center);
    const bottom = double + (height - center);
    const align = offset - center;

    // labels
    const font = '16px sans-serif';
    const file = files[count - 2];
    const rank = ranks[count - 2];

    // draw label
    if (type === 'file') {
      this.drawText(file, align, center, font);
      this.drawText(file, align, bottom, font);
    } else if (type === 'rank') {
      this.drawText(rank, center, align, font);
      this.drawText(rank, right, align, font);
    }
  }
}
