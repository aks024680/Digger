// 2D遊戲引擎核心類
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 遊戲狀態
        this.currentScene = null;
        this.scenes = new Map();
        this.gameObjects = [];
        this.isRunning = false;
        this.lastTime = 0;
        
        // 輸入系統
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // 事件系統
        this.eventSystem = new EventSystem();
        
        // 道具系統
        this.inventory = new Inventory();
        
        // CG動畫系統
        this.cgSystem = new CGSystem();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.eventSystem.emit('keydown', e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.eventSystem.emit('keyup', e);
        });
        
        // 滑鼠事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.mouse.clicked = true;
            this.eventSystem.emit('click', { x: this.mouse.x, y: this.mouse.y });
        });
    }
    
    addScene(name, scene) {
        this.scenes.set(name, scene);
        scene.engine = this;
    }
    
    setScene(name) {
        if (this.scenes.has(name)) {
            this.currentScene = this.scenes.get(name);
            this.currentScene.init();
        }
    }
    
    addGameObject(obj) {
        this.gameObjects.push(obj);
        obj.engine = this;
    }
    
    removeGameObject(obj) {
        const index = this.gameObjects.indexOf(obj);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }
    }
    
    update(deltaTime) {
        // 更新當前場景
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
        
        // 更新遊戲物件
        this.gameObjects.forEach(obj => {
            if (obj.update) {
                obj.update(deltaTime);
            }
        });
        
        // 重置滑鼠點擊狀態
        this.mouse.clicked = false;
    }
    
    render() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 渲染當前場景
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(this.ctx);
        }
        
        // 渲染遊戲物件
        this.gameObjects.forEach(obj => {
            if (obj.render) {
                obj.render(this.ctx);
            }
        });
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    stop() {
        this.isRunning = false;
    }
}

// 事件系統
class EventSystem {
    constructor() {
        this.events = new Map();
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }
    
    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}

// 道具系統
class Inventory {
    constructor() {
        this.items = [];
        this.maxItems = 10;
        this.updateUI();
    }
    
    addItem(item) {
        if (this.items.length < this.maxItems) {
            this.items.push(item);
            this.updateUI();
            return true;
        }
        return false;
    }
    
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            this.updateUI();
            return true;
        }
        return false;
    }
    
    hasItem(itemName) {
        return this.items.some(item => item.name === itemName);
    }
    
    updateUI() {
        const container = document.getElementById('inventoryItems');
        container.innerHTML = '';
        
        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.textContent = item.icon || '?';
            itemElement.title = item.name;
            itemElement.addEventListener('click', () => {
                if (item.onUse) {
                    item.onUse();
                }
            });
            container.appendChild(itemElement);
        });
    }
}

// CG動畫系統
class CGSystem {
    constructor() {
        this.isPlaying = false;
        this.currentCG = null;
    }
    
    playCG(cgData) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentCG = cgData;
        
        const overlay = document.createElement('div');
        overlay.className = 'cg-overlay';
        
        const image = document.createElement('img');
        image.className = 'cg-image';
        image.src = cgData.image;
        image.alt = cgData.title || 'CG動畫';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'cg-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => this.closeCG());
        
        overlay.appendChild(image);
        overlay.appendChild(closeBtn);
        
        // 如果有對話文字，顯示對話框
        if (cgData.dialogue) {
            const dialogue = document.createElement('div');
            dialogue.className = 'cg-dialogue';
            dialogue.textContent = cgData.dialogue;
            overlay.appendChild(dialogue);
        }
        
        document.body.appendChild(overlay);
        
        // 自動關閉（如果有設定時間）
        if (cgData.duration) {
            setTimeout(() => this.closeCG(), cgData.duration);
        }
        
        // 觸發CG播放事件
        if (window.gameEngine) {
            window.gameEngine.eventSystem.emit('cgPlayed', cgData);
        }
    }
    
    closeCG() {
        const overlay = document.querySelector('.cg-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.isPlaying = false;
        this.currentCG = null;
        
        // 觸發CG結束事件
        if (window.gameEngine) {
            window.gameEngine.eventSystem.emit('cgEnded', this.currentCG);
        }
    }
}

// 基礎遊戲物件類
class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.engine = null;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    isColliding(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    }
    
    render(ctx) {
        if (!this.visible) return;
        // 子類別需要實作具體的渲染邏輯
    }
    
    update(deltaTime) {
        // 子類別可以覆寫此方法
    }
}

// 玩家角色類
class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.speed = 200; // 像素/秒
        this.color = '#3498db';
        this.direction = { x: 0, y: 0 };
    }
    
    update(deltaTime) {
        // 處理移動輸入
        this.direction.x = 0;
        this.direction.y = 0;
        
        if (this.engine) {
            if (this.engine.keys['ArrowLeft'] || this.engine.keys['KeyA']) {
                this.direction.x = -1;
            }
            if (this.engine.keys['ArrowRight'] || this.engine.keys['KeyD']) {
                this.direction.x = 1;
            }
            if (this.engine.keys['ArrowUp'] || this.engine.keys['KeyW']) {
                this.direction.y = -1;
            }
            if (this.engine.keys['ArrowDown'] || this.engine.keys['KeyS']) {
                this.direction.y = 1;
            }
        }
        
        // 正規化對角線移動
        if (this.direction.x !== 0 && this.direction.y !== 0) {
            this.direction.x *= 0.707;
            this.direction.y *= 0.707;
        }
        
        // 更新位置
        this.x += this.direction.x * this.speed * deltaTime / 1000;
        this.y += this.direction.y * this.speed * deltaTime / 1000;
        
        // 邊界檢查
        this.x = Math.max(0, Math.min(this.x, this.engine.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.engine.height - this.height));
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 繪製方向指示器
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            ctx.fillStyle = '#e74c3c';
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const indicatorSize = 8;
            ctx.fillRect(
                centerX + this.direction.x * 20 - indicatorSize / 2,
                centerY + this.direction.y * 20 - indicatorSize / 2,
                indicatorSize,
                indicatorSize
            );
        }
    }
}

// 道具類
class Item extends GameObject {
    constructor(x, y, itemData) {
        super(x, y, 24, 24);
        this.itemData = itemData;
        this.collected = false;
        this.hovered = false;
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        // 檢查滑鼠懸停
        if (this.engine && this.engine.mouse) {
            const mouse = this.engine.mouse;
            this.hovered = mouse.x >= this.x && mouse.x <= this.x + this.width &&
                          mouse.y >= this.y && mouse.y <= this.y + this.height;
        }
        
        // 檢查點擊
        if (this.hovered && this.engine && this.engine.mouse.clicked) {
            this.collect();
        }
    }
    
    collect() {
        if (this.collected) return;
        
        this.collected = true;
        
        // 添加到道具欄
        if (this.engine && this.engine.inventory) {
            const success = this.engine.inventory.addItem(this.itemData);
            if (success) {
                // 觸發獲得道具事件
                this.engine.eventSystem.emit('itemCollected', this.itemData);
                
                // 顯示對話
                if (this.itemData.dialogue) {
                    this.showDialogue(this.itemData.dialogue);
                }
            }
        }
    }
    
    showDialogue(text) {
        const dialogueElement = document.getElementById('dialogue');
        const textElement = document.getElementById('dialogueText');
        
        textElement.textContent = text;
        dialogueElement.classList.remove('hidden');
        
        // 自動隱藏對話框
        setTimeout(() => {
            dialogueElement.classList.add('hidden');
        }, 3000);
    }
    
    render(ctx) {
        if (this.collected) return;
        
        // 繪製道具
        ctx.fillStyle = this.hovered ? '#e74c3c' : '#f39c12';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 繪製圖標
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.itemData.icon || '?',
            this.x + this.width / 2,
            this.y + this.height / 2 + 6
        );
        
        // 繪製名稱
        if (this.hovered) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                this.itemData.name,
                this.x + this.width / 2,
                this.y - 5
            );
        }
    }
}

// 場景基類
class Scene {
    constructor() {
        this.engine = null;
        this.gameObjects = [];
        this.background = '#34495e';
    }
    
    init() {
        // 子類別可以覆寫此方法
    }
    
    addGameObject(obj) {
        this.gameObjects.push(obj);
        if (this.engine) {
            this.engine.addGameObject(obj);
        }
    }
    
    update(deltaTime) {
        this.gameObjects.forEach(obj => {
            if (obj.update) {
                obj.update(deltaTime);
            }
        });
    }
    
    render(ctx) {
        // 繪製背景
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 繪製場景物件
        this.gameObjects.forEach(obj => {
            if (obj.render) {
                obj.render(ctx);
            }
        });
    }
}
