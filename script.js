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

// 示例遊戲場景
class GameScene extends Scene {
    constructor() {
        super();
        this.background = '#2c3e50';
        this.player = null;
        this.items = [];
        this.cgTriggered = false;
    }
    
    init() {
        // 創建玩家
        this.player = new Player(100, 100);
        this.addGameObject(this.player);
        
        // 創建道具
        this.createItems();
        
        // 設置事件監聽
        this.setupEventListeners();
    }
    
    createItems() {
        // 鑰匙道具
        const key = new Item(200, 150, {
            name: '神秘鑰匙',
            icon: '🗝️',
            description: '一把古老的鑰匙，散發著神秘的光芒',
            dialogue: '你獲得了神秘鑰匙！這把鑰匙似乎能開啟某些特殊的門...',
            onUse: () => {
                this.showDialogue('你使用了神秘鑰匙，但似乎沒有什麼反應...');
            }
        });
        this.addGameObject(key);
        this.items.push(key);
        
        // 寶石道具
        const gem = new Item(400, 300, {
            name: '魔法寶石',
            icon: '💎',
            description: '一顆閃閃發光的魔法寶石',
            dialogue: '你獲得了魔法寶石！寶石中蘊含著強大的魔法力量。',
            onUse: () => {
                this.showDialogue('你使用了魔法寶石，感受到一股溫暖的力量！');
            }
        });
        this.addGameObject(gem);
        this.items.push(gem);
        
        // 藥水道具
        const potion = new Item(600, 200, {
            name: '治療藥水',
            icon: '🧪',
            description: '一瓶紅色的治療藥水',
            dialogue: '你獲得了治療藥水！這瓶藥水可以恢復你的生命值。',
            onUse: () => {
                this.showDialogue('你喝下了治療藥水，感覺身體充滿了活力！');
            }
        });
        this.addGameObject(potion);
        this.items.push(potion);
        
        // 特殊道具 - 觸發CG
        const specialItem = new Item(300, 400, {
            name: '古老卷軸',
            icon: '📜',
            description: '一張古老的魔法卷軸',
            dialogue: '你獲得了古老卷軸！卷軸上記載著失傳的魔法...',
            onUse: () => {
                this.triggerCG();
            }
        });
        this.addGameObject(specialItem);
        this.items.push(specialItem);
    }
    
    setupEventListeners() {
        // 監聽道具收集事件
        this.engine.eventSystem.on('itemCollected', (itemData) => {
            console.log('道具被收集:', itemData.name);
            
            // 檢查是否收集了所有道具
            if (this.engine.inventory.items.length >= 3 && !this.cgTriggered) {
                setTimeout(() => {
                    this.triggerCompletionCG();
                }, 2000);
            }
        });
        
        // 監聽CG播放事件
        this.engine.eventSystem.on('cgPlayed', (cgData) => {
            console.log('CG動畫播放:', cgData.title);
        });
        
        // 監聽CG結束事件
        this.engine.eventSystem.on('cgEnded', (cgData) => {
            console.log('CG動畫結束');
        });
    }
    
    triggerCG() {
        const cgData = {
            title: '魔法卷軸的記憶',
            image: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <rect width="400" height="300" fill="url(#grad1)"/>
                    <text x="200" y="100" font-family="Arial" font-size="24" fill="white" text-anchor="middle">古老卷軸的記憶</text>
                    <text x="200" y="140" font-family="Arial" font-size="16" fill="white" text-anchor="middle">當你觸摸這張卷軸時</text>
                    <text x="200" y="170" font-family="Arial" font-size="16" fill="white" text-anchor="middle">古老的魔法記憶湧入你的腦海</text>
                    <text x="200" y="200" font-family="Arial" font-size="16" fill="white" text-anchor="middle">你看到了失傳的魔法咒語...</text>
                    <circle cx="200" cy="220" r="30" fill="rgba(255,255,255,0.3)"/>
                    <text x="200" y="225" font-family="Arial" font-size="20" fill="white" text-anchor="middle">✨</text>
                </svg>
            `),
            dialogue: '古老的魔法記憶湧入你的腦海，你看到了失傳的魔法咒語...',
            duration: 5000
        };
        
        this.engine.cgSystem.playCG(cgData);
    }
    
    triggerCompletionCG() {
        this.cgTriggered = true;
        const cgData = {
            title: '收集完成！',
            image: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <rect width="400" height="300" fill="url(#grad2)"/>
                    <text x="200" y="100" font-family="Arial" font-size="28" fill="white" text-anchor="middle">🎉 恭喜！ 🎉</text>
                    <text x="200" y="140" font-family="Arial" font-size="18" fill="white" text-anchor="middle">你成功收集了所有道具！</text>
                    <text x="200" y="170" font-family="Arial" font-size="16" fill="white" text-anchor="middle">現在你擁有了強大的魔法力量</text>
                    <text x="200" y="200" font-family="Arial" font-size="16" fill="white" text-anchor="middle">可以開啟新的冒險了！</text>
                    <circle cx="200" cy="230" r="25" fill="rgba(255,255,255,0.4)"/>
                    <text x="200" y="235" font-family="Arial" font-size="24" fill="white" text-anchor="middle">⭐</text>
                </svg>
            `),
            dialogue: '恭喜！你成功收集了所有道具，現在你擁有了強大的魔法力量！',
            duration: 6000
        };
        
        this.engine.cgSystem.playCG(cgData);
    }
    
    showDialogue(text) {
        const dialogueElement = document.getElementById('dialogue');
        const textElement = document.getElementById('dialogueText');
        
        textElement.textContent = text;
        dialogueElement.classList.remove('hidden');
        
        // 設置關閉按鈕
        const nextBtn = document.getElementById('dialogueNext');
        nextBtn.onclick = () => {
            dialogueElement.classList.add('hidden');
        };
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // 檢查玩家與道具的碰撞
        this.items.forEach(item => {
            if (!item.collected && this.player.isColliding(item)) {
                // 可以添加自動收集邏輯
            }
        });
    }
    
    render(ctx) {
        super.render(ctx);
        
        // 繪製遊戲標題
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('2D遊戲引擎演示', this.engine.width / 2, 40);
        
        // 繪製操作說明
        ctx.font = '14px Arial';
        ctx.fillText('使用方向鍵或WASD移動，點擊道具收集', this.engine.width / 2, 60);
        
        // 繪製道具說明
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('道具說明：', 20, this.engine.height - 80);
        ctx.fillText('🗝️ 神秘鑰匙 - 可以開啟特殊的門', 20, this.engine.height - 60);
        ctx.fillText('💎 魔法寶石 - 蘊含魔法力量', 20, this.engine.height - 45);
        ctx.fillText('🧪 治療藥水 - 恢復生命值', 20, this.engine.height - 30);
        ctx.fillText('📜 古老卷軸 - 觸發特殊CG動畫', 20, this.engine.height - 15);
    }
}

// 初始化遊戲
function initGame() {
    // 創建帶菜單的遊戲引擎
    window.gameEngine = new GameEngineWithMenu('gameCanvas');
    
    // 創建遊戲場景
    const gameScene = new GameScene();
    gameEngine.addScene('game', gameScene);
    
    // 不直接啟動遊戲，而是顯示菜單
    console.log('遊戲引擎已啟動！');
    console.log('操作說明：');
    console.log('- 使用方向鍵或WASD移動角色');
    console.log('- 點擊道具收集');
    console.log('- 收集古老卷軸可觸發CG動畫');
    console.log('- 收集3個道具後會觸發完成CG');
    console.log('- 按ESC鍵返回主菜單');
}

// 當頁面載入完成時初始化遊戲
document.addEventListener('DOMContentLoaded', initGame);
// 遊戲開始面板類
class GameMenu {
    constructor(engine) {
        this.engine = engine;
        this.visible = true;
        this.buttons = [];
        this.setupMenu();
    }
    
    setupMenu() {
        // 創建菜單容器
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'gameMenu';
        this.menuContainer.className = 'game-menu';
        
        // 創建標題
        const title = document.createElement('h1');
        title.className = 'menu-title';
        title.textContent = '2D遊戲引擎';
        this.menuContainer.appendChild(title);
        
        // 創建按鈕容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'menu-buttons';
        
        // 創建4個按鈕
        const buttonConfigs = [
            { id: 'startGame', text: '開始遊戲', icon: '🎮', action: () => this.startGame() },
            { id: 'loadGame', text: '載入存檔', icon: '💾', action: () => this.loadGame() },
            { id: 'settings', text: '遊戲設定', icon: '⚙️', action: () => this.openSettings() },
            { id: 'exitGame', text: '結束遊戲', icon: '🚪', action: () => this.exitGame() }
        ];
        
        buttonConfigs.forEach(config => {
            const button = this.createButton(config);
            buttonContainer.appendChild(button);
            this.buttons.push(button);
        });
        
        this.menuContainer.appendChild(buttonContainer);
        
        // 添加到頁面
        document.body.appendChild(this.menuContainer);
        
        // 添加鍵盤導航支持
        this.setupKeyboardNavigation();
    }
    
    createButton(config) {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.id = config.id;
        
        const icon = document.createElement('span');
        icon.className = 'button-icon';
        icon.textContent = config.icon;
        
        const text = document.createElement('span');
        text.className = 'button-text';
        text.textContent = config.text;
        
        button.appendChild(icon);
        button.appendChild(text);
        
        // 添加點擊事件
        button.addEventListener('click', config.action);
        
        // 添加懸停效果
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 8px 25px rgba(52, 152, 219, 0.4)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        });
        
        return button;
    }
    
    setupKeyboardNavigation() {
        let currentButtonIndex = 0;
        
        document.addEventListener('keydown', (e) => {
            if (!this.visible) return;
            
            switch(e.code) {
                case 'ArrowUp':
                    e.preventDefault();
                    currentButtonIndex = (currentButtonIndex - 1 + this.buttons.length) % this.buttons.length;
                    this.highlightButton(currentButtonIndex);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    currentButtonIndex = (currentButtonIndex + 1) % this.buttons.length;
                    this.highlightButton(currentButtonIndex);
                    break;
                case 'Enter':
                case 'Space':
                    e.preventDefault();
                    this.buttons[currentButtonIndex].click();
                    break;
            }
        });
        
        // 初始高亮第一個按鈕
        this.highlightButton(0);
    }
    
    highlightButton(index) {
        this.buttons.forEach((button, i) => {
            if (i === index) {
                button.classList.add('highlighted');
                button.focus();
            } else {
                button.classList.remove('highlighted');
            }
        });
    }
    
    startGame() {
        this.hide();
        this.engine.setScene('game');
        this.engine.start();
        
        // 顯示遊戲開始提示
        this.showNotification('遊戲開始！使用方向鍵或WASD移動，點擊道具收集。');
    }
    
    loadGame() {
        // 模擬載入存檔功能
        const savedData = localStorage.getItem('gameSave');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.showNotification('存檔載入成功！');
                
                // 延遲一下再開始遊戲，讓用戶看到提示
                setTimeout(() => {
                    this.hide();
                    this.engine.setScene('game');
                    this.engine.start();
                    
                    // 恢復遊戲狀態
                    if (data.inventory) {
                        this.engine.inventory.items = data.inventory;
                        this.engine.inventory.updateUI();
                    }
                }, 1000);
            } catch (error) {
                this.showNotification('存檔載入失敗！');
            }
        } else {
            this.showNotification('沒有找到存檔文件！');
        }
    }
    
    openSettings() {
        this.showSettingsPanel();
    }
    
    exitGame() {
        if (confirm('確定要結束遊戲嗎？')) {
            // 保存遊戲狀態
            this.saveGame();
            window.close();
        }
    }
    
    showSettingsPanel() {
        // 創建設定面板
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settingsPanel';
        settingsPanel.className = 'settings-panel';
        
        settingsPanel.innerHTML = `
            <div class="settings-content">
                <h2>遊戲設定</h2>
                
                <div class="setting-group">
                    <label>音量設定</label>
                    <input type="range" id="volumeSlider" min="0" max="100" value="50">
                    <span id="volumeValue">50%</span>
                </div>
                
                <div class="setting-group">
                    <label>移動速度</label>
                    <input type="range" id="speedSlider" min="100" max="400" value="200">
                    <span id="speedValue">200</span>
                </div>
                
                <div class="setting-group">
                    <label>顯示FPS</label>
                    <input type="checkbox" id="showFPS">
                </div>
                
                <div class="setting-buttons">
                    <button id="saveSettings" class="settings-btn">保存設定</button>
                    <button id="closeSettings" class="settings-btn">關閉</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsPanel);
        
        // 設置事件監聽器
        this.setupSettingsEvents(settingsPanel);
    }
    
    setupSettingsEvents(panel) {
        const volumeSlider = panel.querySelector('#volumeSlider');
        const volumeValue = panel.querySelector('#volumeValue');
        const speedSlider = panel.querySelector('#speedSlider');
        const speedValue = panel.querySelector('#speedValue');
        const showFPS = panel.querySelector('#showFPS');
        
        // 音量滑塊
        volumeSlider.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value + '%';
        });
        
        // 速度滑塊
        speedSlider.addEventListener('input', (e) => {
            speedValue.textContent = e.target.value;
        });
        
        // 保存設定
        panel.querySelector('#saveSettings').addEventListener('click', () => {
            const settings = {
                volume: volumeSlider.value,
                speed: speedSlider.value,
                showFPS: showFPS.checked
            };
            
            localStorage.setItem('gameSettings', JSON.stringify(settings));
            this.showNotification('設定已保存！');
            panel.remove();
        });
        
        // 關閉設定
        panel.querySelector('#closeSettings').addEventListener('click', () => {
            panel.remove();
        });
        
        // 載入現有設定
        this.loadSettings(volumeSlider, speedSlider, showFPS);
    }
    
    loadSettings(volumeSlider, speedSlider, showFPS) {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                volumeSlider.value = settings.volume || 50;
                speedSlider.nextElementSibling.textContent = settings.volume + '%';
                speedSlider.value = settings.speed || 200;
                speedSlider.nextElementSibling.textContent = settings.speed;
                showFPS.checked = settings.showFPS || false;
            } catch (error) {
                console.log('載入設定失敗');
            }
        }
    }
    
    saveGame() {
        if (this.engine && this.engine.inventory) {
            const saveData = {
                inventory: this.engine.inventory.items,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('gameSave', JSON.stringify(saveData));
            this.showNotification('遊戲已自動保存！');
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 自動移除通知
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    show() {
        this.visible = true;
        this.menuContainer.style.display = 'flex';
        this.engine.stop();
    }
    
    hide() {
        this.visible = false;
        this.menuContainer.style.display = 'none';
    }
    
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// 擴展遊戲引擎以支持菜單
class GameEngineWithMenu extends GameEngine {
    constructor(canvasId) {
        super(canvasId);
        this.menu = new GameMenu(this);
        
        // 添加ESC鍵返回菜單
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && !this.menu.visible) {
                this.menu.show();
            }
        });
        
        // 自動保存
        setInterval(() => {
            if (this.menu && !this.menu.visible) {
                this.menu.saveGame();
            }
        }, 30000); // 每30秒自動保存
    }
}