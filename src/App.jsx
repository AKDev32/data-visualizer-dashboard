import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trash2, MapPin, Flag } from 'lucide-react';

// ==================== ALGORITHM UTILITIES ====================
const getNeighbors = (node, grid) => {
  const neighbors = [];
  const { row, col } = node;
  const rows = grid.length;
  const cols = grid[0].length;

  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < rows - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < cols - 1) neighbors.push(grid[row][col + 1]);

  return neighbors.filter(n => !n.isWall);
};

const getAllNodes = (grid) => {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
};

// ==================== DIJKSTRA'S ALGORITHM ====================
const dijkstra = (grid, startNode, endNode) => {
  const visitedInOrder = [];
  startNode.distance = 0;
  const unvisited = getAllNodes(grid);

  while (unvisited.length) {
    unvisited.sort((a, b) => a.distance - b.distance);
    const closest = unvisited.shift();

    if (closest.isWall) continue;
    if (closest.distance === Infinity) return { visitedInOrder, path: [] };

    closest.isVisited = true;
    visitedInOrder.push(closest);

    if (closest === endNode) {
      const path = [];
      let current = endNode;
      while (current !== null) {
        path.unshift(current);
        current = current.previous;
      }
      return { visitedInOrder, path };
    }

    const neighbors = getNeighbors(closest, grid);
    for (const neighbor of neighbors) {
      const newDistance = closest.distance + 1;
      if (newDistance < neighbor.distance) {
        neighbor.distance = newDistance;
        neighbor.previous = closest;
      }
    }
  }

  return { visitedInOrder, path: [] };
};

// ==================== A* ALGORITHM ====================
const heuristic = (nodeA, nodeB) => {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

const astar = (grid, startNode, endNode) => {
  const visitedInOrder = [];
  const openSet = [startNode];
  startNode.distance = 0;
  startNode.fScore = heuristic(startNode, endNode);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift();

    if (current.isWall) continue;
    if (current.isVisited) continue;

    current.isVisited = true;
    visitedInOrder.push(current);

    if (current === endNode) {
      const path = [];
      let curr = endNode;
      while (curr !== null) {
        path.unshift(curr);
        curr = curr.previous;
      }
      return { visitedInOrder, path };
    }

    const neighbors = getNeighbors(current, grid);
    for (const neighbor of neighbors) {
      if (neighbor.isVisited) continue;

      const tentativeG = current.distance + 1;

      if (tentativeG < neighbor.distance) {
        neighbor.previous = current;
        neighbor.distance = tentativeG;
        neighbor.fScore = tentativeG + heuristic(neighbor, endNode);

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return { visitedInOrder, path: [] };
};

// ==================== NODE COMPONENT ====================
const Node = ({ node, onMouseDown, onMouseEnter, onMouseUp }) => {
  const extraClassName = node.isStart
    ? 'bg-green-500'
    : node.isEnd
    ? 'bg-red-500'
    : node.isWall
    ? 'bg-gray-800'
    : node.isPath
    ? 'bg-yellow-400'
    : node.isVisited
    ? 'bg-blue-400'
    : 'bg-white';

  return (
    <div
      className={`w-6 h-6 border border-gray-300 transition-all duration-50 ${extraClassName} cursor-pointer hover:opacity-80`}
      onMouseDown={() => onMouseDown(node.row, node.col)}
      onMouseEnter={() => onMouseEnter(node.row, node.col)}
      onMouseUp={onMouseUp}
    />
  );
};

// ==================== MAIN VISUALIZER COMPONENT ====================
const PathfindingVisualizer = () => {
  const [grid, setGrid] = useState([]);
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [isMovingStart, setIsMovingStart] = useState(false);
  const [isMovingEnd, setIsMovingEnd] = useState(false);
  const [speed, setSpeed] = useState(10);

  const START_NODE_ROW = 10;
  const START_NODE_COL = 5;
  const END_NODE_ROW = 10;
  const END_NODE_COL = 45;
  const ROWS = 20;
  const COLS = 50;

  const startNodeRef = useRef({ row: START_NODE_ROW, col: START_NODE_COL });
  const endNodeRef = useRef({ row: END_NODE_ROW, col: END_NODE_COL });

  useEffect(() => {
    const initialGrid = createInitialGrid();
    setGrid(initialGrid);
  }, []);

  const createNode = (row, col) => {
    return {
      row,
      col,
      isStart: row === startNodeRef.current.row && col === startNodeRef.current.col,
      isEnd: row === endNodeRef.current.row && col === endNodeRef.current.col,
      distance: Infinity,
      fScore: Infinity,
      isVisited: false,
      isWall: false,
      previous: null,
      isPath: false,
    };
  };

  const createInitialGrid = () => {
    const grid = [];
    for (let row = 0; row < ROWS; row++) {
      const currentRow = [];
      for (let col = 0; col < COLS; col++) {
        currentRow.push(createNode(row, col));
      }
      grid.push(currentRow);
    }
    return grid;
  };

  const resetGrid = () => {
    if (isRunning) return;
    const newGrid = grid.map(row =>
      row.map(node => ({
        ...node,
        isVisited: false,
        isPath: false,
        distance: Infinity,
        fScore: Infinity,
        previous: null,
      }))
    );
    setGrid(newGrid);
  };

  const clearBoard = () => {
    if (isRunning) return;
    startNodeRef.current = { row: START_NODE_ROW, col: START_NODE_COL };
    endNodeRef.current = { row: END_NODE_ROW, col: END_NODE_COL };
    const initialGrid = createInitialGrid();
    setGrid(initialGrid);
  };

  const handleMouseDown = (row, col) => {
    if (isRunning) return;
    
    const node = grid[row][col];
    if (node.isStart) {
      setIsMovingStart(true);
    } else if (node.isEnd) {
      setIsMovingEnd(true);
    } else {
      const newGrid = toggleWall(grid, row, col);
      setGrid(newGrid);
      setIsMousePressed(true);
    }
  };

  const handleMouseEnter = (row, col) => {
    if (isRunning) return;
    
    if (isMovingStart) {
      const newGrid = moveStartNode(grid, row, col);
      setGrid(newGrid);
    } else if (isMovingEnd) {
      const newGrid = moveEndNode(grid, row, col);
      setGrid(newGrid);
    } else if (isMousePressed) {
      const newGrid = toggleWall(grid, row, col);
      setGrid(newGrid);
    }
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
    setIsMovingStart(false);
    setIsMovingEnd(false);
  };

  const toggleWall = (grid, row, col) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (!node.isStart && !node.isEnd) {
      const newNode = { ...node, isWall: !node.isWall };
      newGrid[row][col] = newNode;
    }
    return newGrid;
  };

  const moveStartNode = (grid, row, col) => {
    const newGrid = grid.map(r => r.map(n => ({ ...n, isStart: false })));
    if (!newGrid[row][col].isWall && !newGrid[row][col].isEnd) {
      newGrid[row][col].isStart = true;
      startNodeRef.current = { row, col };
    }
    return newGrid;
  };

  const moveEndNode = (grid, row, col) => {
    const newGrid = grid.map(r => r.map(n => ({ ...n, isEnd: false })));
    if (!newGrid[row][col].isWall && !newGrid[row][col].isStart) {
      newGrid[row][col].isEnd = true;
      endNodeRef.current = { row, col };
    }
    return newGrid;
  };

  const visualize = () => {
    if (isRunning) return;
    setIsRunning(true);
    
    // Create a deep copy of the grid for algorithm execution
    const gridCopy = grid.map(row =>
      row.map(node => ({
        row: node.row,
        col: node.col,
        isStart: node.isStart,
        isEnd: node.isEnd,
        isWall: node.isWall,
        distance: Infinity,
        fScore: Infinity,
        isVisited: false,
        previous: null,
        isPath: false,
      }))
    );

    const startNode = gridCopy[startNodeRef.current.row][startNodeRef.current.col];
    const endNode = gridCopy[endNodeRef.current.row][endNodeRef.current.col];

    // Run the algorithm on the copy
    const result = algorithm === 'dijkstra' 
      ? dijkstra(gridCopy, startNode, endNode)
      : astar(gridCopy, startNode, endNode);

    // Extract coordinates for animation
    const visitedCoords = result.visitedInOrder.map(node => ({ row: node.row, col: node.col }));
    const pathCoords = result.path.map(node => ({ row: node.row, col: node.col }));

    animateAlgorithm(visitedCoords, pathCoords);
  };

  const animateAlgorithm = (visitedCoords, pathCoords) => {
    // Animate visited nodes
    for (let i = 0; i < visitedCoords.length; i++) {
      setTimeout(() => {
        const { row, col } = visitedCoords[i];
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(r => [...r]);
          newGrid[row][col] = { ...newGrid[row][col], isVisited: true };
          return newGrid;
        });

        // After all visited nodes, animate the path
        if (i === visitedCoords.length - 1) {
          setTimeout(() => {
            animatePath(pathCoords);
          }, speed);
        }
      }, speed * i);
    }
  };

  const animatePath = (pathCoords) => {
    for (let i = 0; i < pathCoords.length; i++) {
      setTimeout(() => {
        const { row, col } = pathCoords[i];
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(r => [...r]);
          newGrid[row][col] = { ...newGrid[row][col], isPath: true };
          return newGrid;
        });

        if (i === pathCoords.length - 1) {
          setIsRunning(false);
        }
      }, 50 * i);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            Pathfinding Visualizer
          </h1>
          <p className="text-purple-300 text-lg">
            Visualize graph traversal algorithms in real-time
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-2xl border border-white/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={visualize}
                disabled={isRunning}
                className="flex items-center gap-2 bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Play size={20} />
                Visualize {algorithm === 'dijkstra' ? "Dijkstra's" : 'A*'}
              </button>

              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                disabled={isRunning}
                className="px-4 py-3 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 font-medium"
              >
                <option value="dijkstra" className="text-gray-900">Dijkstra's Algorithm</option>
                <option value="astar" className="text-gray-900">A* Algorithm</option>
              </select>

              <div className="flex items-center gap-2">
                <label className="text-white font-medium">Speed:</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-32 accent-purple-500"
                />
                <span className="text-white font-mono">{speed}ms</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetGrid}
                disabled={isRunning}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <RotateCcw size={18} />
                Reset
              </button>
              <button
                onClick={clearBoard}
                disabled={isRunning}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Trash2 size={18} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 shadow-xl border border-white/20">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-green-400" />
              <span className="text-white font-medium">Start Node (drag to move)</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag size={18} className="text-red-400" />
              <span className="text-white font-medium">End Node (drag to move)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-800 border border-white/30 rounded"></div>
              <span className="text-white font-medium">Wall (click/drag to draw)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-400 border border-white/30 rounded"></div>
              <span className="text-white font-medium">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-400 border border-white/30 rounded"></div>
              <span className="text-white font-medium">Shortest Path</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20 overflow-auto">
          <div className="inline-block">
            {grid.map((row, rowIdx) => (
              <div key={rowIdx} className="flex">
                {row.map((node, nodeIdx) => (
                  <Node
                    key={nodeIdx}
                    node={node}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onMouseUp={handleMouseUp}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-300">
          <p className="text-sm">
            Algorithms: Dijkstra's & A*
          </p>
        </div>
      </div>
    </div>
  );
};

export default PathfindingVisualizer;