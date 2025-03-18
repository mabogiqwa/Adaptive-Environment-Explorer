class GameEnvironment {
    constructor(boardElement) {
        this.board = boardElement;
        this.width = 500;
        this.height = 500;
        this.cellSize = 20;
        this.obstacles = [];
        this.rewards = [];
        this.bonusRewards = [];
        this.explorationBonuses = [];
        this.visitedCells = {};
        this.heatmapCanvas = document.getElementById('heatmap');
        this.heatmapContext = this.heatmapCanvas.getContext('2d');
        
        this.generateEnvironment();
        this.updateHeatmap();
    }

    generateEnvironment() {
        // Generate obstacles
        for (let i = 0; i < 10; i++) {
            this.createObstacle();
        }

        // Generate rewards - increased from 5 to 15
        for (let i = 0; i < 15; i++) {
            this.createReward();
        }
        
        // Add bonus rewards
        for (let i = 0; i < 3; i++) {
            this.createBonusReward();
        }
        
        // Initialize exploration bonuses
        this.scheduleExplorationBonus();
    }

    createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        
        const x = Math.floor(Math.random() * (this.width / this.cellSize)) * this.cellSize;
        const y = Math.floor(Math.random() * (this.height / this.cellSize)) * this.cellSize;
        const width = this.cellSize * (Math.floor(Math.random() * 3) + 1);
        const height = this.cellSize * (Math.floor(Math.random() * 3) + 1);

        obstacle.style.left = `${x}px`;
        obstacle.style.top = `${y}px`;
        obstacle.style.width = `${width}px`;
        obstacle.style.height = `${height}px`;

        this.board.appendChild(obstacle);
        this.obstacles.push({
            x, y, width, height,
            element: obstacle
        });
    }

    createReward() {
        const reward = document.createElement('div');
        reward.classList.add('reward');
        
        const x = Math.floor(Math.random() * (this.width / this.cellSize)) * this.cellSize;
        const y = Math.floor(Math.random() * (this.height / this.cellSize)) * this.cellSize;

        reward.style.left = `${x}px`;
        reward.style.top = `${y}px`;

        this.board.appendChild(reward);
        this.rewards.push({
            x, y,
            element: reward,
            collected: false
        });
    }
    
    createBonusReward() {
        const reward = document.createElement('div');
        reward.classList.add('bonus-reward');
        
        const x = Math.floor(Math.random() * (this.width / this.cellSize)) * this.cellSize;
        const y = Math.floor(Math.random() * (this.height / this.cellSize)) * this.cellSize;

        reward.style.left = `${x}px`;
        reward.style.top = `${y}px`;

        this.board.appendChild(reward);
        this.bonusRewards.push({
            x, y,
            element: reward,
            collected: false,
            value: 50 // Bonus rewards are worth more
        });
    }
    
    createExplorationBonus() {
        // Find a cell that hasn't been visited much
        const leastVisitedCells = this.findLeastVisitedCells();
        if (leastVisitedCells.length === 0) return;
        
        // Choose a random cell from the least visited ones
        const randomIndex = Math.floor(Math.random() * leastVisitedCells.length);
        const [x, y] = leastVisitedCells[randomIndex];
        
        const bonus = document.createElement('div');
        bonus.classList.add('exploration-bonus');
        
        bonus.style.left = `${x}px`;
        bonus.style.top = `${y}px`;
        
        this.board.appendChild(bonus);
        this.explorationBonuses.push({
            x, y,
            element: bonus,
            collected: false,
            value: 100 // Exploration bonuses are worth even more
        });
    }
    
    findLeastVisitedCells() {
        // Create a grid of all cells
        const allCells = [];
        for (let x = 0; x < this.width; x += this.cellSize) {
            for (let y = 0; y < this.height; y += this.cellSize) {
                // Skip cells with obstacles
                const hasObstacle = this.obstacles.some(obstacle => 
                    x < obstacle.x + obstacle.width &&
                    x + this.cellSize > obstacle.x &&
                    y < obstacle.y + obstacle.height &&
                    y + this.cellSize > obstacle.y
                );
                
                if (!hasObstacle) {
                    const cellKey = `${x},${y}`;
                    const visitCount = this.visitedCells[cellKey] || 0;
                    allCells.push({ x, y, visitCount });
                }
            }
        }
        
        // Sort by visit count
        allCells.sort((a, b) => a.visitCount - b.visitCount);
        
        // Return the coordinates of the 10 least visited cells
        return allCells.slice(0, 10).map(cell => [cell.x, cell.y]);
    }
    
    scheduleExplorationBonus() {
        // Create a new exploration bonus every 10 seconds
        this.createExplorationBonus();
        setTimeout(() => this.scheduleExplorationBonus(), 10000);
    }

    checkCollisions(agent) {
        // Check obstacle collisions
        const collision = this.obstacles.some(obstacle => 
            agent.x < obstacle.x + obstacle.width &&
            agent.x + agent.size > obstacle.x &&
            agent.y < obstacle.y + obstacle.height &&
            agent.y + agent.size > obstacle.y
        );

        // Check reward collection
        const collectedReward = this.rewards.find(reward => 
            !reward.collected &&
            agent.x < reward.x + 15 &&
            agent.x + agent.size > reward.x &&
            agent.y < reward.y + 15 &&
            agent.y + agent.size > reward.y
        );
        
        // Check bonus reward collection
        const collectedBonusReward = this.bonusRewards.find(reward => 
            !reward.collected &&
            agent.x < reward.x + 15 &&
            agent.x + agent.size > reward.x &&
            agent.y < reward.y + 15 &&
            agent.y + agent.size > reward.y
        );
        
        // Check exploration bonus collection
        const collectedExplorationBonus = this.explorationBonuses.find(bonus => 
            !bonus.collected &&
            agent.x < bonus.x + 20 &&
            agent.x + agent.size > bonus.x &&
            agent.y < bonus.y + 20 &&
            agent.y + agent.size > bonus.y
        );

        return { 
            obstacleCollision: collision, 
            rewardCollision: collectedReward,
            bonusRewardCollision: collectedBonusReward,
            explorationBonusCollision: collectedExplorationBonus
        };
    }

    removeReward(reward) {
        reward.element.remove();
        reward.collected = true;
        
        // Replace the collected reward after 2 seconds
        setTimeout(() => {
            this.createReward();
        }, 2000);
    }
    
    removeBonusReward(bonusReward) {
        bonusReward.element.remove();
        bonusReward.collected = true;
        
        // Replace the collected bonus reward after a delay
        setTimeout(() => {
            this.createBonusReward();
        }, 5000);
    }
    
    removeExplorationBonus(bonus) {
        bonus.element.remove();
        bonus.collected = true;
        
        // Exploration bonuses don't get replaced immediately
        // They're scheduled every 10 seconds
    }
    
    updateVisitedCell(x, y) {
        // Track visited cells for the heatmap
        const cellX = Math.floor(x / this.cellSize) * this.cellSize;
        const cellY = Math.floor(y / this.cellSize) * this.cellSize;
        const cellKey = `${cellX},${cellY}`;
        
        if (!this.visitedCells[cellKey]) {
            this.visitedCells[cellKey] = 0;
        }
        this.visitedCells[cellKey]++;
        
        // Update the heatmap visualization
        this.updateHeatmap();
    }
    
    updateHeatmap() {
        // Clear the canvas
        this.heatmapContext.clearRect(0, 0, this.width, this.height);
        
        // Find the max visit count
        let maxVisits = 1;
        for (const key in this.visitedCells) {
            maxVisits = Math.max(maxVisits, this.visitedCells[key]);
        }
        
        // Draw the heatmap
        for (const key in this.visitedCells) {
            const [x, y] = key.split(',').map(Number);
            const visitCount = this.visitedCells[key];
            const intensity = Math.min(visitCount / maxVisits, 1);
            
            // Red color for frequently visited cells
            this.heatmapContext.fillStyle = `rgba(255, 0, 0, ${intensity})`;
            this.heatmapContext.fillRect(x, y, this.cellSize, this.cellSize);
        }
    }
}

class LearningAgent {
    constructor(gameBoard, environment) {
        this.gameBoard = gameBoard;
        this.environment = environment;
        this.x = 0;
        this.y = 0;
        this.size = 20;
        this.score = 0;
        this.rewardsCollected = 0;
        this.learningRate = 0.01;
        this.qTable = {};
        this.element = this.createAgentElement();
        this.explorationTimer = 0;
        
        // Q-Learning parameters
        this.baseEpsilon = 0.2; // base exploration rate
        this.epsilon = this.baseEpsilon; // current exploration rate
        this.gamma = 0.9; // discount factor
        this.lastPositions = []; // Track recent positions
        this.stalledTime = 0; // Time agent has been in the same area
        
        // Epsilon decay
        this.minEpsilon = 0.05;
        this.epsilonDecay = 0.9995;

        this.positionHistory = [];
        this.lastCentroidCheck = 0;

        // UI Elements
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.rewardsDisplay = document.getElementById('rewardsDisplay');
        this.explorationDisplay = document.getElementById('explorationDisplay');
    }

    createAgentElement() {
        const agent = document.createElement('div');
        agent.classList.add('agent');
        this.gameBoard.appendChild(agent);
        return agent;
    }

    // Add this method to LearningAgent
    checkPositionBias() {
        // Only check every 1000 steps
        if (this.explorationTimer - this.lastCentroidCheck < 1000) return;
        
        this.lastCentroidCheck = this.explorationTimer;
        this.positionHistory.push({x: this.x, y: this.y});
        
        // Keep history manageable
        if (this.positionHistory.length > 1000) {
            this.positionHistory.shift();
        }
        
        // Calculate centroid of recent positions
        const centroidX = this.positionHistory.reduce((sum, pos) => sum + pos.x, 0) / 
            this.positionHistory.length;
        
        // If centroid is biased to the right, increase probability of going left
        const centerX = this.environment.width / 2;
        const bias = (centroidX - centerX) / centerX; // Positive means right bias
        
        if (bias > 0.2) {
            console.log("Correcting right-side bias: " + bias.toFixed(2));
            // Apply correction in the next move decision
            this.rightBiasCorrection = 0.3;
        } else {
            this.rightBiasCorrection = 0;
        }
    }

    move() {
        this.explorationTimer++;
        
        // Update exploration rate every 100 moves
        if (this.explorationTimer % 100 === 0) {
            this.updateExplorationRate();
        }
        
        const possibleActions = [
            { name: 'up', dx: 0, dy: -20 },
            { name: 'down', dx: 0, dy: 20 },
            { name: 'left', dx: -20, dy: 0 },
            { name: 'right', dx: 20, dy: 0 }
        ];

        this.checkPositionBias();

        // Calculate novelty bonus for each cell
        const actionWithNovelty = possibleActions.map(action => {
            const newX = this.x + action.dx;
            const newY = this.y + action.dy;
            const cellX = Math.floor(newX / this.environment.cellSize) * this.environment.cellSize;
            const cellY = Math.floor(newY / this.environment.cellSize) * this.environment.cellSize;
            const cellKey = `${cellX},${cellY}`;
            
            // Calculate novelty bonus (inverse of visit count)
            const visitCount = this.environment.visitedCells[cellKey] || 0;
            
            // Enhanced novelty bonus for areas with fewer visits
            const noveltyBonus = 1 / (visitCount + 1);
            
            // Add position correction to counteract any bias
            const centerX = this.environment.width / 2;
            const positionFactor = this.x > centerX ? 
                1.2 + (this.x / this.environment.width) : // Extra bonus for going left when on right side
                1.0;
            
            return { 
                ...action, 
                noveltyBonus: noveltyBonus * positionFactor
            };
        });

        // Epsilon-greedy action selection with novelty bonus
        let action;
        if (Math.random() < this.epsilon) {
            // Explore: weighted random action based on novelty
            const totalNovelty = actionWithNovelty.reduce((sum, a) => sum + a.noveltyBonus, 0);
            const randomValue = Math.random() * totalNovelty;
            
            let accumulatedNovelty = 0;
            for (const a of actionWithNovelty) {
                accumulatedNovelty += a.noveltyBonus;
                if (randomValue <= accumulatedNovelty) {
                    action = a;
                    break;
                }
            }
            
            // Fallback to random if novelty selection fails
            if (!action) {
                action = possibleActions[Math.floor(Math.random() * possibleActions.length)];
            }
        } else {
            // Exploit: best known action
            action = this.getBestAction(possibleActions);
        }

        // Propose new position
        const newX = this.x + action.dx;
        const newY = this.y + action.dy;

        // Boundary check
        if (newX >= 0 && newX < this.environment.width - this.size &&
            newY >= 0 && newY < this.environment.height - this.size) {
            
            this.x = newX;
            this.y = newY;

            // Update visual position
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            // Track position for stall detection
            this.lastPositions.push({x: this.x, y: this.y});
            if (this.lastPositions.length > 50) {
                this.lastPositions.shift();
            }
            
            // Update visited cells
            this.environment.updateVisitedCell(this.x, this.y);

            // Check collisions and calculate reward
            const { 
                obstacleCollision, 
                rewardCollision, 
                bonusRewardCollision,
                explorationBonusCollision
            } = this.environment.checkCollisions(this);

            if (obstacleCollision) {
                this.score -= 10;
                this.updateScore();
            }

            if (rewardCollision) {
                this.score += 20;
                this.rewardsCollected++;
                this.environment.removeReward(rewardCollision);
                this.updateScore();
            }
            
            if (bonusRewardCollision) {
                this.score += bonusRewardCollision.value;
                this.rewardsCollected++;
                this.environment.removeBonusReward(bonusRewardCollision);
                this.updateScore();
            }
            
            if (explorationBonusCollision) {
                this.score += explorationBonusCollision.value;
                this.rewardsCollected++;
                this.environment.removeExplorationBonus(explorationBonusCollision);
                this.updateScore();
                
                // Exploration bonus gives a temporary boost to exploration rate
                this.epsilon = Math.min(this.epsilon * 1.5, 0.9);
                this.updateExplorationDisplay();
            }
        }
    }

    getBestAction(possibleActions) {
        // Add bias correction based on position
        const centerX = this.environment.width / 2;
        const biasCorrection = this.x > centerX ? -0.1 : 0.1; // Subtle correction
        
        return possibleActions.reduce((bestAction, currentAction) => {
            const proposedX = this.x + currentAction.dx;
            const proposedY = this.y + currentAction.dy;
    
            // Create a temporary agent to check collisions
            const tempAgent = {
                x: proposedX,
                y: proposedY,
                size: this.size
            };
    
            const { obstacleCollision } = this.environment.checkCollisions(tempAgent);
            
            // Calculate positional value
            let actionValue = obstacleCollision ? -1 : 0;
            
            // Add position correction (slightly favor left when on right side and vice versa)
            if (currentAction.name === 'left' && this.x > centerX) {
                actionValue += biasCorrection;
            } else if (currentAction.name === 'right' && this.x < centerX) {
                actionValue -= biasCorrection;
            }
            
            // Return the better action
            return actionValue > bestAction.value ? 
                {...currentAction, value: actionValue} : 
                bestAction;
        }, {...possibleActions[0], value: -2});
    }
    
    updateExplorationRate() {
        // Check if the agent is stalled in the same area
        if (this.isStalled()) {
            this.stalledTime++;
            // Increase exploration rate if stalled
            this.epsilon = Math.min(this.epsilon * 1.2, 0.9);
        } else {
            this.stalledTime = 0;
            // Gradually decrease exploration rate over time
            this.epsilon = Math.max(this.epsilon * this.epsilonDecay, this.minEpsilon);
        }
        
        // Add position-based exploration adjustment
        const centerX = this.environment.width / 2;
        if (this.x > centerX * 1.5) {
            // If agent is far right, increase exploration
            this.epsilon = Math.min(this.epsilon * 1.05, 0.9);
        }
        
        this.updateExplorationDisplay();
    }
    
    isStalled() {
        if (this.lastPositions.length < 30) return false;
        
        // Calculate the bounding box of recent positions
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const pos of this.lastPositions) {
            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
            maxX = Math.max(maxX, pos.x);
            maxY = Math.max(maxY, pos.y);
        }
        
        // If the agent has been in a small area for a while, it's stalled
        const boundingBoxSize = (maxX - minX) * (maxY - minY);
        return boundingBoxSize < 5000;
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
        this.rewardsDisplay.textContent = this.rewardsCollected;
    }
    
    updateExplorationDisplay() {
        this.explorationDisplay.textContent = this.epsilon.toFixed(2);
    }
}

// Game Setup
const gameBoard = document.getElementById('gameBoard');
const environment = new GameEnvironment(gameBoard);
const agent = new LearningAgent(gameBoard, environment);

// Game Loop
function gameLoop() {
    agent.move();
    requestAnimationFrame(gameLoop);
}

gameLoop();
