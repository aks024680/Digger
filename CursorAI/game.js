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
    // 創建遊戲引擎
    window.gameEngine = new GameEngine('gameCanvas');
    
    // 創建遊戲場景
    const gameScene = new GameScene();
    gameEngine.addScene('game', gameScene);
    
    // 設置場景
    gameEngine.setScene('game');
    
    // 啟動遊戲
    gameEngine.start();
    
    console.log('遊戲引擎已啟動！');
    console.log('操作說明：');
    console.log('- 使用方向鍵或WASD移動角色');
    console.log('- 點擊道具收集');
    console.log('- 收集古老卷軸可觸發CG動畫');
    console.log('- 收集3個道具後會觸發完成CG');
}

// 當頁面載入完成時初始化遊戲
document.addEventListener('DOMContentLoaded', initGame);
