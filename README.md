# CW发报器 - 摩尔斯电码训练工具

一个功能完整、设计精美的HTML小组件，可以方便地集成到任何网站中，用于摩尔斯电码的发送和接收练习。

## 🎯 功能特色

### 核心功能
- **发送器模块**：练习将文本转化为摩尔斯电码
- **接收器模块**：练习将摩尔斯电码转化为文本
- **练习模式**：随机从题库抽调常用语供用户练习解码
- **学习辅助**：完整的摩尔斯电码对照表，支持点击播放

### 设计特色
- **复古电台美学**：采用20世纪中期军用无线电设备设计语言
- **响应式设计**：完美适配桌面、平板和移动设备
- **丰富动画**：使用Anime.js实现流畅的交互动画
- **音频可视化**：使用p5.js创建实时波形显示
- **可自定义**：支持主题、音频、显示等多种设置

## 🚀 快速开始

### 基本集成

1. **下载文件**
   ```bash
   git clone [repository-url]
   cd cw-transmitter
   ```

2. **基础集成到您的网站**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>我的网站 - CW发报器</title>
       <link rel="stylesheet" href="cw-transmitter.css">
   </head>
   <body>
       <!-- 您的网站内容 -->
       
       <!-- CW发报器容器 -->
       <div id="cw-transmitter-container">
           <iframe src="cw-transmitter/index.html" 
                   width="100%" 
                   height="800" 
                   frameborder="0"
                   style="border-radius: 8px;">
           </iframe>
       </div>
       
       <!-- 或者直接在页面中嵌入 -->
       <div id="cw-app">
           <!-- 复制index.html的内容到这里 -->
       </div>
       
       <script src="cw-transmitter.js"></script>
   </body>
   </html>
   ```

### 高级集成选项

#### 方法1：iframe集成（推荐）
```html
<div class="cw-transmitter-wrapper">
    <iframe src="path/to/cw-transmitter/index.html" 
            id="cwTransmitterFrame"
            width="100%" 
            height="900">
    </iframe>
</div>

<script>
    // 与iframe通信（可选）
    const cwFrame = document.getElementById('cwTransmitterFrame');
    
    // 发送消息到CW发报器
    cwFrame.contentWindow.postMessage('start-practice', '*');
    
    // 接收来自CW发报器的消息
    window.addEventListener('message', (event) => {
        if (event.data.type === 'morse-sent') {
            console.log('发送完成:', event.data.text);
        }
    });
</script>
```

#### 方法2：直接嵌入
```html
<div id="cw-transmitter-app">
    <!-- 将index.html的body内容复制到这里 -->
</div>

<!-- 确保引入所有必要的脚本 -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>
<script src="path/to/cw-transmitter.js"></script>
```

#### 方法3：Vue/React组件集成
```javascript
// Vue组件示例
<template>
    <div class="cw-transmitter-component">
        <CWTransmitter 
            :speed="20"
            :frequency="700"
            @onSend="handleSend"
            @onReceive="handleReceive"
        />
    </div>
</template>

<script>
import CWTransmitter from './components/CWTransmitter.vue';

export default {
    components: { CWTransmitter },
    methods: {
        handleSend(data) {
            console.log('发送数据:', data);
        },
        handleReceive(data) {
            console.log('接收数据:', data);
        }
    }
};
</script>
```

## ⚙️ 自定义配置

### 初始化参数
```javascript
const transmitter = new CWTransmitter({
    speed: 20,           // 发送速度 (WPM)
    frequency: 700,      // 音频频率 (Hz)
    volume: 0.5,         // 音量 (0-1)
    autoDecode: true,    // 自动解码
    soundEnabled: true,  // 音效开关
    theme: 'vintage'     // 主题选择
});
```

### 主题定制
```css
/* 自定义主题 */
.cw-transmitter {
    --primary-color: #2D4A3E;
    --accent-color: #D2691E;
    --text-color: #F5F5DC;
    --border-radius: 8px;
    --font-family: 'Noto Sans SC', sans-serif;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .cw-transmitter {
        font-size: 14px;
    }
}
```

### 功能定制
```javascript
// 添加自定义功能
class CustomCWTransmitter extends CWTransmitter {
    constructor(options) {
        super(options);
        this.customFeature = options.customFeature || false;
    }
    
    // 添加新的发送方法
    async sendCustomSequence(sequence) {
        // 自定义发送逻辑
        for (let char of sequence) {
            await this.playTone(this.getCustomDuration(char));
            await this.sleep(this.customGap);
        }
    }
    
    // 覆盖默认行为
    updateMorseOutput() {
        super.updateMorseOutput();
        // 添加自定义逻辑
        this.customValidation();
    }
}
```

## 📱 响应式设计

CW发报器完全支持响应式设计，在不同设备上都有良好的表现：

### 桌面端 (>1024px)
- 双面板布局，发送器和接收器并排显示
- 完整功能访问
- 丰富的动画效果

### 平板端 (768px-1024px)
- 自适应布局，保持核心功能
- 触摸友好的控件
- 优化的交互体验

### 移动端 (<768px)
- 单面板垂直布局
- 大按钮设计，便于触摸操作
- 简化的界面，保持核心功能

## 🎨 样式定制

### CSS变量
```css
:root {
    --military-green: #2D4A3E;    /* 主背景色 */
    --ivory-white: #F5F5DC;       /* 文本颜色 */
    --amber-orange: #D2691E;      /* 强调色 */
    --dark-gold: #B8860B;         /* 次要强调 */
    --danger-red: #DC143C;        /* 错误状态 */
    --success-green: #228B22;     /* 成功状态 */
    --info-blue: #4169E1;         /* 信息状态 */
}
```

### 自定义样式示例
```css
/* 现代主题 */
.cw-modern {
    --military-green: #2c3e50;
    --ivory-white: #ecf0f1;
    --amber-orange: #e67e22;
    --border-radius: 12px;
}

/* 暗色主题 */
.cw-dark {
    --military-green: #1a1a1a;
    --ivory-white: #ffffff;
    --amber-orange: #ff6b35;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}
```

## 🔧 API 参考

### 主要方法

#### `sendMorseCode(text)`
发送摩尔斯电码
```javascript
transmitter.sendMorseCode('HELLO WORLD');
```

#### `decodeMorseInput(morse)`
解码摩尔斯电码
```javascript
const text = transmitter.decodeMorseInput('.... . .-.. .-.. ---');
console.log(text); // HELLO
```

#### `playTone(duration, frequency)`
播放音频信号
```javascript
transmitter.playTone(100, 800); // 播放100ms的800Hz音频
```

#### `setSpeed(wpm)`
设置发送速度
```javascript
transmitter.setSpeed(25); // 设置为25 WPM
```

### 事件监听

```javascript
// 监听发送事件
transmitter.on('sendComplete', (data) => {
    console.log('发送完成:', data);
});

// 监听解码事件
transmitter.on('decodeComplete', (data) => {
    console.log('解码完成:', data);
});

// 监听练习模式事件
transmitter.on('practiceMode', (data) => {
    console.log('练习模式:', data);
});
```

## 🌐 浏览器兼容性

CW发报器支持所有现代浏览器：

### 完全支持
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 部分支持（功能降级）
- IE 11（无音频可视化，基础功能）
- 移动端浏览器（触摸优化）

### 必需功能
- Web Audio API（音频播放）
- LocalStorage（数据存储）
- ES6+（现代JavaScript）

## 📦 文件结构

```
cw-transmitter/
├── index.html              # 主页面
├── cw-transmitter.js       # 核心JavaScript
├── resources/
│   └── background.jpg      # 背景图片
├── README.md              # 使用文档
└── examples/
    ├── iframe-example.html    # iframe集成示例
    ├── vue-example.html       # Vue集成示例
    └── react-example.jsx      # React集成示例
```

## 🎮 使用技巧

### 键盘快捷键
- `Ctrl+Enter`: 快速发送
- `Ctrl+D`: 快速解码
- `Space`: 在练习模式中播放音频
- `Esc`: 清除当前输入

### 学习建议
1. **从慢速开始**：建议从10-15 WPM开始练习
2. **每日练习**：每天15-30分钟的持续练习
3. **混合练习**：结合发送和接收练习
4. **使用练习模式**：随机生成的练习题目
5. **查看历史记录**：分析学习进度和错误模式

### 高级功能
- **自定义音频频率**：调整到最适合您听力的频率
- **速度渐进**：逐步提高发送速度
- **错误分析**：通过历史记录分析常见错误
- **导出数据**：导出学习记录进行备份

## 🔒 隐私和安全

- **本地存储**：所有数据仅存储在用户本地浏览器
- **无外部依赖**：除CDN资源外，无外部服务调用
- **开源代码**：完全透明的开源实现
- **无追踪**：不包含任何追踪或分析代码

## 🆘 常见问题

### Q: 没有声音怎么办？
A: 
1. 检查浏览器音频权限
2. 确认音量设置不为零
3. 检查是否启用了音效
4. 尝试刷新页面

### Q: 如何集成到WordPress？
A:
1. 上传文件到WordPress主题目录
2. 使用iframe插件或直接编辑主题文件
3. 确保所有资源路径正确

### Q: 支持哪些字符？
A: 支持A-Z, 0-9, 常用标点符号和特殊字符

### Q: 如何自定义样式？
A: 通过CSS变量或覆盖默认CSS类来自定义样式

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📞 联系

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件到：Kyunana097@gmail.com
- 访问项目主页：[project-url]

---

**享受学习CW的乐趣！**73 📡✨