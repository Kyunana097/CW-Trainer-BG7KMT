// CW发报器 - 按钮修复版本
class CWTransmitter {
    constructor() {
        // 摩尔斯电码映射
        this.morseCodeMap = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
            '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
            ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-',
            '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
        };
        this.dropMs = 1200;   // 默认“入门”速度下的下落时间
        this.dropDuration = 600;   // ms，默认 15 WPM 时的下落时间
        this.reverseMorseMap = {};
        for (let char in this.morseCodeMap) {
            this.reverseMorseMap[this.morseCodeMap[char]] = char;
        }
        
        // 题库系统
        this.questionBank = {
            easy: this.generateEasyQuestions(),
            medium: this.generateMediumQuestions(),
            hard: this.generateHardQuestions()
        };
        
        // 速度模式
        this.speedModes = {
            learning: { interval: 1200, name: '学习速度' },
            normal: { interval: 600, name: '通联速度' },
            competition: { interval: 300, name: '竞赛速度' }
        };
        
        // 初始化状态
        this.isPlaying = false;
        this.sendMode = 'free';
        this.currentSpeedMode = 'learning';
        this.currentSpeed = 15;
        this.volume = 0.7;  
        this.soundEnabled = true;
        this.visualEnabled = true;
        this.characterInterval = this.speedModes.learning.interval;
        this.currentDifficulty = 'easy';
        
        // 发送状态
        this.sendBuffer = [];
        this.sendTimeout = null;
        this.sendStartTime = null;
        this.sendStats = { totalSymbols: 0, totalChars: 0, currentSpeed: 0 };
        
        // 接收状态
        this.currentQuestion = null;
        this.receiveStats = { totalQuestions: 0, correctAnswers: 0 };
        
        // 音频上下文
        this.audioContext = null;
        
        // 历史记录
        this.history = [];

        // 放在 constructor 末尾
        setTimeout(() => {
            this.initForegroundBars();   // ← 新增
            this.init();
        }, 100);
    }    
    
    // ✅ 新增辅助函数
    ensureSendResultReady() {
        const sendResult = document.getElementById('sendResult');
        if (sendResult && sendResult.textContent === '等待发送...') {
            sendResult.textContent = '';
        }
    }
    
    // 生成题库
    generateEasyQuestions() {
        const questions = [];
        for (let i = 65; i <= 90; i++) {
            const char = String.fromCharCode(i);
            questions.push({
                type: 'letter',
                question: char,
                answer: char,
                morse: this.morseCodeMap[char],
                display: `字母 ${char}`
            });
        }
        for (let i = 0; i <= 9; i++) {
            const num = i.toString();
            questions.push({
                type: 'number',
                question: num,
                answer: num,
                morse: this.morseCodeMap[num],
                display: `数字 ${num}`
            });
        }
        return questions;
    }
    
    generateMediumQuestions() {
        const questions = [];
        const qCodes = ['QRL', 'QRM', 'QRN', 'QRO', 'QRP', 'QRT', 'QRV', 'QRX', 'QRZ', 'QSL'];
        qCodes.forEach(qcode => {
            questions.push({
                type: 'qcode',
                question: qcode,
                answer: qcode,
                morse: qcode.split('').map(c => this.morseCodeMap[c]).join(' '),
                display: `Q简语 ${qcode}`
            });
        });
        
        const words = ['HELLO', 'RADIO', 'WORLD', 'CALL', 'NAME','CQ','DE',
            '73','88','TNX', 'PSE', 'OM', 'YL', 'SK', 'DX', 'FB', 'GL','QTH',
            '73S', '88S', 'ES', 'SHORTWAVE', 'THANKS', 'PLEASE', 'COPY',];
        words.forEach(word => {
            questions.push({
                type: 'word',
                question: word,
                answer: word,
                morse: word.split('').map(c => this.morseCodeMap[c]).join(' '),
                display: `单词 ${word}`
            });
        });
        
        return questions;
    }
    
    generateHardQuestions() {
        const questions = [];
        const sentences = [ '73 DE', 'CU AGN', '73 GL', '88 FB', 'PSE QSL',
            'OM SK', 'YL TNX', 'DX FB', 'CQ DX', 'DE OM', 'QTH IS', 'MY NAME',
            'HAM RADIO', 'MORSE CODE','PLEASE RESPOND',
            '73 ES 88', 'CQ DE', 'DX DX', 'FB FB', 'GL GL', 'SK SK',
            'TNX TNX', 'PSE PSE', 'QSL QSL', 'QTH QTHS', 'MY NAME IS',
            'GOOD LUCK', 'BEST REGARDS', 'SEE YOU', 'THANK YOU', 'PLEASE COPY',
            '73 AND 88', 'CQ CQ CQ', 'DE YL', 'DX IS', 'FB OM', 'GL YL',
            'SK OM', 'TNX FB', 'PSE DE', 'QSL VIA', 'QTH QTH', 'MY QTH',
            'CALL ME', 'RADIO CLUB', 'HAM OPERATOR', 'MORSE OPERATOR',
            'GOOD DAY', 'BEST WISHES', 'SEE U',
            'CALL SIGN', 'RADIO OPERATOR',
            'CQ CQ CQ DE BG7KMT K',
            'MY NAME IS ZHUANG',
            'QTH IS GUANGDONG CHINA',
            'PLEASE QSL VIA BUREAU',
            'THANKS FOR YOUR CALL',
            '73 AND BEST REGARDS',
            'SEE YOU NEXT TIME',
        ];
        
        sentences.forEach(sentence => {
            questions.push({
                type: 'sentence',
                question: sentence,
                answer: sentence,
                morse: sentence.split('').map(c => this.morseCodeMap[c]).join(' '),
                display: `句子: ${sentence}`
            });
        });
        
        return questions;
    }
    
    init() {
        try {
            this.initAudio();
            this.bindEvents();
            this.loadSettings();
            this.showStatus('系统就绪', 'ready');
            console.log('CW发报器初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.showStatus('初始化失败', 'error');
        }
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext initialized:', this.audioContext);
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    bindEvents() {
        // 使用更健壮的事件绑定方式
        this.bindElementEvent('dotButton', 'click', () => this.sendDot());
        this.bindElementEvent('dashButton', 'click', () => this.sendDash());
        this.bindElementEvent('clearSendResult', 'click', () => this.clearSendResult());
        
        // 速度模式
        this.bindElementEvent('learningMode', 'click', () => this.setSpeedMode('learning'));
        this.bindElementEvent('normalMode', 'click', () => this.setSpeedMode('normal'));
        this.bindElementEvent('competitionMode', 'click', () => this.setSpeedMode('competition'));
        
        // 模式切换
        this.bindElementEvent('freeModeBtn', 'click', () => this.setSendMode('free'));
        this.bindElementEvent('practiceModeBtn', 'click', () => this.setSendMode('practice'));
        this.bindElementEvent('startSendPractice', 'click', () => this.startSendPractice());
        
        // 接收器
        this.bindElementEvent('receiveSpeed', 'input', (e) => this.updateSpeed(e.target.value));
        this.bindElementEvent('playButton', 'click', () => this.playCurrentQuestion());
        this.bindElementEvent('stopButton', 'click', () => this.stopPlaying());
        this.bindElementEvent('submitAnswer', 'click', () => this.submitAnswer());
        this.bindElementEvent('clearAnswer', 'click', () => this.clearAnswer());
        this.bindElementEvent('startReceive', 'click', () => this.startReceivePractice());
        
        // 难度选择
        this.bindElementEvent('easyBtn', 'click', () => this.setDifficulty('easy'));
        this.bindElementEvent('mediumBtn', 'click', () => this.setDifficulty('medium'));
        this.bindElementEvent('hardBtn', 'click', () => this.setDifficulty('hard'));
        
        // 设置
        this.bindElementEvent('volumeSlider', 'input', (e) => this.updateVolume(e.target.value));
        this.bindElementEvent('soundToggle', 'change', (e) => this.soundEnabled = e.target.checked);
        this.bindElementEvent('visualToggle', 'change', (e) => this.visualEnabled = e.target.checked);
        
        console.log('事件绑定完成');
    }
    
    bindElementEvent(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);
            console.log(`事件绑定成功: ${elementId} -> ${eventType}`);
        } else {
            console.warn(`元素未找到: ${elementId}`);
        }
    }
    
    getRandomQuestion(difficulty = 'easy') {
        const questions = this.questionBank[difficulty];
        if (!questions || questions.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * questions.length);
        return questions[randomIndex];
    }
    
    // 发送功能
    sendDot() {
        console.log('发送点');
        this.addSymbol('.', 'dot');
        this.animateButton('dotButton');
    }
    
    sendDash() {
        console.log('发送划');
        this.addSymbol('-', 'dash');
        this.animateButton('dashButton');
    }
    
    addSymbol(symbol, type) {
        if (!this.sendStartTime) {
            this.sendStartTime = Date.now();
        }

        this.sendBuffer.push(symbol);
        this.sendStats.totalSymbols++;
        
        // 添加到频谱图
        if (this.visualEnabled) {
            this.addToSpectrum(symbol, type);
        }
        
        // 播放音频
        if (this.soundEnabled && this.audioContext) {
            this.playSymbolSound(symbol);
        }
        
        // 重置定时器
        if (this.sendTimeout) {
            clearTimeout(this.sendTimeout);
        }
        
        this.sendTimeout = setTimeout(() => {
            this.processSendBuffer();
        }, this.characterInterval);
        
        this.updateSendDisplay();
        this.showStatus('正在发送...', 'sending');
    }
    
    /* 创建前景 8 根柱子 */
    initForegroundBars() {
        const fg = document.querySelector('.cluster-8');
        fg.innerHTML = '';
        // 尝试根据底噪柱数量创建相同数量的前景柱，保持一一对应
        const bg = document.getElementById('spectrumBg');
        const bgBars = bg ? bg.querySelectorAll('.spectrum-bar') : null;
        if (!bgBars || bgBars.length === 0) {
            // 如果底噪尚未创建，稍后重试
            setTimeout(() => this.initForegroundBars(), 50);
            return;
        }

        bgBars.forEach((bb, i) => {
            const bar = document.createElement('div');
            bar.className = 'fg-bar';
            // 把每根前景柱放在与底噪同样的 left 位置
            const left = bb.style.left || bb.getAttribute('data-left') || `${(i / (bgBars.length - 1)) * 100}%`;
            bar.style.left = left;
            bar.style.transform = 'translateX(-50%)';
            // 初始高度取底噪附近的小值
            const h = 4 + Math.random() * 4;
            bar.style.height = `${h}%`;
            bar.dataset.h = String(h); // 当前高度
            bar.dataset.base = String(h); // 基线高度
            bar.dataset.target = String(h); // 目标高度（动画用）
            bar.dataset.index = String(i);
            fg.appendChild(bar);
        });
    }

    /* 按键时只动前景层 */
    raiseForegroundBars(type = 'dot') {
        const bars = Array.from(document.querySelectorAll('.fg-bar'));
        if (bars.length === 0) return;
        const total = bars.length;
        const center = Math.floor(total / 2);
        // 只让中间三根柱子被激发，移除高斯分布
        const indices = [center - 1, center, center + 1].filter(i => i >= 0 && i < total);
        // 峰值高度相同（发射功率相同），只在回落速度上区分点/划
        const peakForType = 75; // 所有符号的峰值高度相同
        const decayForType = type === 'dot' ? 0.80 : 0.96; // dot 更快回落

        indices.forEach((idx) => {
            const b = bars[idx];
            if (!b) return;
            const base = parseFloat(b.dataset.base || '4');
            // 三根柱子高度更接近，使用小幅随机差异
            const variance = 2; // +/-2%
            const noise = (Math.random() * 2 - 1) * (variance / 100) * peakForType;
            const target = Math.max(base, peakForType + noise);
            b.dataset.target = String(target);
            b.dataset.decay = String(decayForType);
            b.classList.add('show');
        });
    }

    lowerForegroundBars() {
        document.querySelectorAll('.fg-bar').forEach(b => {
            const base = parseFloat(b.dataset.base || '4');
            b.dataset.target = String(base);
        });
    }

    addToSpectrum(symbol, type) {
        const bottomSpectrum = document.getElementById('spectrumBottom');
        const placeholder    = document.getElementById('spectrumPlaceholder');

        /* 频谱显示由声音事件触发：playTone 会在开始时调用 raiseForegroundBars(type)，
           在结束时触发 lowerForegroundBars()，因此这里不直接控制前景柱。 */

        /* 2. 隐藏占位文字 */
        if (placeholder) placeholder.style.display = 'none';

        /* 3. 下落橙条速度随WPM，不清旧条 */
        const symbolEl = document.createElement('div');
        symbolEl.className = `morse-symbol ${type}-symbol`;
        symbolEl.style.left = (bottomSpectrum.offsetWidth - 8) / 2 + 'px';
        symbolEl.style.animation = `floatDown ${this.dropMs}ms ease-out forwards`;
        bottomSpectrum.appendChild(symbolEl);
        setTimeout(() => symbolEl.remove(), this.dropMs);
    }
    
    playSymbolSound(symbol) {
        if (!this.audioContext) return;
        
        const duration = symbol === '.' ? 100 : 300;
        // 将 symbol 传入 playTone，使声音事件驱动频谱激发
        this.playTone(duration, this.frequency, symbol);
    }
    
    async playTone(duration, frequency, symbol = '.') {
        if (!this.audioContext || !this.soundEnabled) return;

        return new Promise((resolve) => {
            const osc   = this.audioContext.createOscillator();
            const gain  = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter(); // ← 新增

            // ① 方波源
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, this.audioContext.currentTime);

            // ② 低通滤波：截止频率 1 kHz，Q 值 0.7（柔和滚降）
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

            // ③ 2 ms 淡入/淡出，消除爆音
            const vol   = Number(this.volume) || 0.7;
            const time  = Number(this.audioContext.currentTime) || 0;
            const dur   = Number(duration) || 100;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(vol * 0.1, time + 0.002);
            gain.gain.setValueAtTime(vol * 0.1, time + dur / 1000 - 0.002);
            gain.gain.linearRampToValueAtTime(0, time + dur / 1000);

            // ④ 连接顺序：osc → filter → gain → 扬声器
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);

            // 在声音开始时触发频谱前景（根据符号类型）
            const type = symbol === '-' ? 'dash' : 'dot';
            try {
                this.raiseForegroundBars(type);
            } catch (e) {
                // 忽略：有时在初始化早期 this 可能未完整绑定
            }

            osc.start(time);
            osc.stop(time + dur / 1000);
            osc.onended = () => {
                // 声音结束后开始降低前景（通过 lowerForegroundBars 将 target 设回基线）
                try {
                    // 点稍早触发回落，划延迟更长
                    const lowerDelay = type === 'dot' ? 50 : 150;
                    setTimeout(() => this.lowerForegroundBars(), lowerDelay);
                } catch (e) {}
                resolve();
            };
        });
    }
    
    processSendBuffer() {
        if (this.sendBuffer.length === 0) return;
        
        const morseCode = this.sendBuffer.join('');
        const character = this.reverseMorseMap[morseCode] || '?';
        
        // 显示结果
        const sendResult = document.getElementById('sendResult');
        if (sendResult) {
            this.ensureSendResultReady();
            sendResult.textContent += character;
        }
        
        // 清空缓冲区
        this.sendBuffer = [];
        this.sendStats.totalChars++;
        
        this.showStatus('字符识别完成', 'ready');
        this.addToHistory('sent', character, morseCode);
        // 新增：如果是练习模式，立即比对答案
        if (this.sendMode === 'practice') this.checkSendAnswer(character);
    }
    
    clearSendResult() {
        const sendResult = document.getElementById('sendResult');
        if (sendResult) {
            sendResult.textContent = '等待发送...';
            // ✅ 添加清空动画提示
            sendResult.style.transition = 'color 0.4s';
            sendResult.style.color = '#00fbffff';
            setTimeout(() => {
                sendResult.style.color = '';
            }, 400);
        }
        
        this.sendBuffer = [];
        this.sendStats.totalChars = 0;
        this.sendStats.totalSymbols = 0;
        this.sendStartTime = null;
        
        const sendCount = document.getElementById('sendCount');
        const currentChar = document.getElementById('currentChar');
        const sendSpeed = document.getElementById('sendSpeed');
        
        if (sendCount) sendCount.textContent = '0';
        if (currentChar) currentChar.textContent = '-';
        if (sendSpeed) sendSpeed.textContent = '0';
        
        this.clearSpectrum();
        this.showStatus('识别区已清空', 'ready');
    }
    
    clearSpectrum() {
        const spectrum = document.getElementById('spectrumDisplay');
        if (!spectrum) return;
        
        const symbols = spectrum.querySelectorAll('.morse-symbol');
        symbols.forEach(symbol => {
            if (symbol.parentNode) {
                symbol.parentNode.removeChild(symbol);
            }
        });
        
        const placeholder = document.getElementById('spectrumPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
    }
    
    // 速度模式管理
    setSpeedMode(mode) {
        this.currentSpeedMode = mode;
        this.characterInterval = this.speedModes[mode].interval;
        this.dropMs = this.characterInterval;   // ← 直接拿档位间隔
        
        this.updateSpeedModeUI();
        
        const intervalDisplay = document.getElementById('intervalDisplay');
        if (intervalDisplay) {
            intervalDisplay.textContent = `${this.characterInterval}ms`;
        }
    }
    
    updateSpeedModeUI() {
        const buttons = document.querySelectorAll('.speed-mode-button');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.getElementById(`${this.currentSpeedMode}Mode`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    // 发送练习模式
    setSendMode(mode) {
        this.sendMode = mode;
        
        const freeBtn = document.getElementById('freeModeBtn');
        const practiceBtn = document.getElementById('practiceModeBtn');
        const practicePanel = document.getElementById('sendPracticePanel');
        
        if (mode === 'free') {
            if (freeBtn) freeBtn.classList.add('active');
            if (practiceBtn) practiceBtn.classList.remove('active');
            if (practicePanel) practicePanel.classList.add('hidden');
        } else {
            if (freeBtn) freeBtn.classList.remove('active');
            if (practiceBtn) practiceBtn.classList.add('active');
            if (practicePanel) practicePanel.classList.remove('hidden');
        }
    }
    
    startSendPractice() {
        this.nextSendQuestion();
    }
    
    nextSendQuestion() {
        const difficulty = this.getCurrentDifficulty();
        const question = this.getRandomQuestion(difficulty);
        
        if (!question) {
            const sendQuestion = document.getElementById('sendQuestion');
            if (sendQuestion) {
                sendQuestion.textContent = '题库为空，请选择其他难度';
            }
            return;
        }
        
        this.currentQuestion = {
            text: question.question,
            morse: question.morse,
            position: 0,
            display: question.display
        };
        
        const sendQuestion = document.getElementById('sendQuestion');
        const sendResult = document.getElementById('sendResult');
        
        if (sendQuestion) sendQuestion.textContent = `请发送: ${question.display}`;
        if (sendResult) sendResult.textContent = '';
        
        this.sendBuffer = [];
        this.sendStartTime = Date.now();
        
        this.showStatus('练习模式 - 准备发送', 'ready');
    }
    
    checkSendAnswer(inputChar) {
        if (!this.currentQuestion) return;
        
        const expectedChar = this.currentQuestion.text[this.currentQuestion.position];
        
        if (inputChar === expectedChar) {
            this.currentQuestion.position++;
            
            if (this.currentQuestion.position >= this.currentQuestion.text.length) {
                const timeUsed = (Date.now() - this.sendStartTime) / 1000;
                const speed = Math.round((this.currentQuestion.text.length / timeUsed) * 60);
                
                const sendPracticeResult = document.getElementById('sendPracticeResult');
                if (sendPracticeResult) {
                    sendPracticeResult.innerHTML = 
                        `<span style="color: #00ff00;">✓ 完成! 速度: ${speed} WPM, 用时: ${timeUsed.toFixed(1)}s</span>`;
                }
                
                this.showStatus('练习完成', 'ready');
                
                setTimeout(() => {
                    this.nextSendQuestion();
                }, 3000);
            }
        } else {
            const sendPracticeResult = document.getElementById('sendPracticeResult');
            if (sendPracticeResult) {
                sendPracticeResult.innerHTML = `<span style="color: #ff8c00;">✗ 错误，请重新发送</span>`;
            }
        }
    }
    
    // 接收功能
    updateSpeed(value) {
        this.currentSpeed = parseInt(value);
        this.dropDuration = Math.round(16000 / this.currentSpeed);   
        const speedDisplay = document.getElementById('speedDisplay');
        if (speedDisplay) {
            speedDisplay.textContent = `${value} WPM`;
        }
    }
    
    updateVolume(value) {
        this.volume = parseInt(value) / 100;
        const volumeDisplay = document.getElementById('volumeDisplay');
        if (volumeDisplay) {
            console.log('Volume updated:', this.volume);
            volumeDisplay.textContent = `${value}%`;
        }
    }
    
    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        
        const buttons = document.querySelectorAll('.difficulty-button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('inactive');
        });
        
        const activeBtn = document.getElementById(`${difficulty}Btn`);
        if (activeBtn) {
            activeBtn.classList.remove('inactive');
            activeBtn.classList.add('active');
        }
    }
    
    getCurrentDifficulty() {
        return this.currentDifficulty || 'easy';
    }
    
    startReceivePractice() {
        this.nextReceiveQuestion();
    }
    
    nextReceiveQuestion() {
        const difficulty = this.getCurrentDifficulty();
        const question = this.getRandomQuestion(difficulty);
        
        if (!question) {
            const receiveQuestion = document.getElementById('receiveQuestion');
            if (receiveQuestion) {
                receiveQuestion.textContent = '题库为空，请选择其他难度';
            }
            return;
        }
        
        this.currentQuestion = {
            text: question.question,
            morse: question.morse,
            display: question.display
        };
        
        const receiveQuestion = document.getElementById('receiveQuestion');
        const receiveResult = document.getElementById('receiveResult');
        const receiveInput = document.getElementById('receiveInput');
        
        if (receiveQuestion) receiveQuestion.textContent = `准备接收: ${question.display}`;
        if (receiveResult) receiveResult.textContent = '等待接收...';
        if (receiveInput) receiveInput.value = '';
        
        this.resetScores();
        this.showStatus('接收练习 - 准备播放', 'ready');
    }
    
    playCurrentQuestion() {
        if (!this.currentQuestion || this.isPlaying) return;
        
        this.isPlaying = true;
        this.showStatus('正在播放...', 'sending');
        
        this.playMorseSequence(this.currentQuestion.text).then(() => {
            this.isPlaying = false;
            this.showStatus('播放完成', 'ready');
            const receiveResult = document.getElementById('receiveResult');
            if (receiveResult) {
                receiveResult.textContent = '请输入接收到的内容...';
            }
        });
    }
    
    stopPlaying() {
        this.isPlaying = false;
        this.showStatus('停止播放', 'ready');
    }
    
    async playMorseSequence(text) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const dotDuration = 1200 / this.currentSpeed;
        const dashDuration = dotDuration * 3;
        const charGap = dotDuration * 3;
        const wordGap = dotDuration * 7;
        
        for (let i = 0; i < text.length; i++) {
            if (!this.isPlaying) break;
            
            const char = text[i];
            
            if (char === ' ') {
                await this.sleep(wordGap);
                continue;
            }
            
            const morseCode = this.morseCodeMap[char];
            if (!morseCode) continue;
            
            for (let symbol of morseCode) {
                if (!this.isPlaying) break;
                
                if (symbol === '.') {
                    await this.playTone(dotDuration, undefined, '.');
                } else if (symbol === '-') {
                    await this.playTone(dashDuration, undefined, '-');
                }
                
                await this.sleep(dotDuration);
            }
            
            if (i < text.length - 1 && text[i + 1] !== ' ') {
                await this.sleep(charGap);
            }
        }
    }
    
    submitAnswer() {
        if (!this.currentQuestion) return;
        
        const receiveInput = document.getElementById('receiveInput');
        if (!receiveInput) return;
        
        const userAnswer = receiveInput.value.trim();
        const correctAnswer = this.currentQuestion.text;
        
        const accuracy = this.calculateAccuracy(userAnswer, correctAnswer);
        const speedScore = this.calculateSpeedScore();
        const totalScore = Math.round((accuracy + speedScore) / 2);
        
        // 更新得分显示
        const accuracyScore = document.getElementById('accuracyScore');
        const speedScoreElement = document.getElementById('speedScore');
        const totalScoreElement = document.getElementById('totalScore');
        
        if (accuracyScore) accuracyScore.textContent = `${accuracy}%`;
        if (speedScoreElement) speedScoreElement.textContent = speedScore;
        if (totalScoreElement) totalScoreElement.textContent = totalScore;
        
        // 显示结果
        const receiveResult = document.getElementById('receiveResult');
        if (receiveResult) {
            receiveResult.innerHTML = `
                <div style="color: ${accuracy >= 80 ? '#00ff00' : '#ff8c00'};">
                    <div>你的答案: ${userAnswer}</div>
                    <div>正确答案: ${correctAnswer}</div>
                    <div>准确率: ${accuracy}%</div>
                    <div>得分: ${totalScore}</div>
                </div>
            `;
        }
        
        // 更新统计
        this.receiveStats.totalQuestions++;
        if (accuracy >= 80) {
            this.receiveStats.correctAnswers++;
        }
        
        this.addToHistory('received', userAnswer, correctAnswer, accuracy);
    }
    
    calculateAccuracy(userAnswer, correctAnswer) {
        if (!userAnswer || !correctAnswer) return 0;
        
        const userWords = userAnswer.toUpperCase().split(' ');
        const correctWords = correctAnswer.toUpperCase().split(' ');
        
        let correctCount = 0;
        const minLength = Math.min(userWords.length, correctWords.length);
        
        for (let i = 0; i < minLength; i++) {
            if (userWords[i] === correctWords[i]) {
                correctCount++;
            }
        }
        
        return Math.round((correctCount / correctWords.length) * 100);
    }
    
    calculateSpeedScore() {
        return Math.min(this.currentSpeed * 2, 60);
    }
    
    clearAnswer() {
        const receiveInput = document.getElementById('receiveInput');
        const receiveResult = document.getElementById('receiveResult');
        
        if (receiveInput) receiveInput.value = '';
        if (receiveResult) receiveResult.textContent = '等待接收...';
        
        this.resetScores();
    }
    
    resetScores() {
        const accuracyScore = document.getElementById('accuracyScore');
        const speedScore = document.getElementById('speedScore');
        const totalScore = document.getElementById('totalScore');
        
        if (accuracyScore) accuracyScore.textContent = '0%';
        if (speedScore) speedScore.textContent = '0';
        if (totalScore) totalScore.textContent = '0';
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showStatus(message, status) {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (statusText) statusText.textContent = message;
        if (statusIndicator) {
            statusIndicator.className = 'status-led';
            if (status === 'sending') {
                statusIndicator.classList.add('status-sending');
            } else if (status === 'recognizing') {
                statusIndicator.classList.add('status-recognizing');
            } else {
                statusIndicator.classList.add('status-ready');
            }
        }
    }
    
    animateButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button && typeof anime !== 'undefined') {
            anime({
                targets: button,
                scale: [1, 0.95, 1],
                duration: 150,
                easing: 'easeOutQuad'
            });
        }
    }
    
    updateSendDisplay() {
        const sendCount = document.getElementById('sendCount');
        const currentChar = document.getElementById('currentChar');
        const sendSpeed = document.getElementById('sendSpeed');
        
        if (sendCount) sendCount.textContent = this.sendStats.totalChars;
        if (currentChar) currentChar.textContent = this.sendBuffer.join('') || '-';
        
        if (this.sendStartTime && sendSpeed) {
            const timeElapsed = (Date.now() - this.sendStartTime) / 1000 / 60;
            const speed = timeElapsed > 0 ? Math.round(this.sendStats.totalChars / timeElapsed) : 0;
            sendSpeed.textContent = speed;
        }
    }
    
    // 数据持久化
    saveSettings() {
        const settings = {
            currentSpeed: this.currentSpeed,
            frequency: this.frequency,
            volume: this.volume * 100,
            soundEnabled: this.soundEnabled,
            visualEnabled: this.visualEnabled,
            currentDifficulty: this.currentDifficulty,
            sendStats: this.sendStats,
            receiveStats: this.receiveStats
        };
        localStorage.setItem('cwTransmitterSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('cwTransmitterSettings');
        if (!saved) {
            // 首次访问 → 强制学习速度 + 保存
            this.currentSpeedMode = 'learning';
            this.currentSpeed      = 15;
            this.saveSettings();   // 立即写回，下次不再强制
            return;
        }
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.currentSpeedMode = 'learning';
                this.currentSpeed = settings.currentSpeed || 15;
                this.frequency = settings.frequency || 800;
                this.volume = (settings.volume || 70) / 100;
                this.soundEnabled = settings.soundEnabled !== false;
                this.visualEnabled = settings.visualEnabled !== false;
                this.currentDifficulty = settings.currentDifficulty || 'easy';
                
                this.updateSpeedModeUI();
                this.setDifficulty(this.currentDifficulty);
                
                // 更新UI
                const receiveSpeed = document.getElementById('receiveSpeed');
                const speedDisplay = document.getElementById('speedDisplay');
                const frequencySlider = document.getElementById('frequencySlider');
                const frequencyDisplay = document.getElementById('frequencyDisplay');
                const volumeSlider = document.getElementById('volumeSlider');
                const volumeDisplay = document.getElementById('volumeDisplay');
                const soundToggle = document.getElementById('soundToggle');
                const visualToggle = document.getElementById('visualToggle');
                
                if (receiveSpeed) receiveSpeed.value = this.currentSpeed;
                if (speedDisplay) speedDisplay.textContent = `${this.currentSpeed} WPM`;
                if (frequencySlider) frequencySlider.value = this.frequency;
                if (frequencyDisplay) frequencyDisplay.textContent = `${this.frequency}Hz`;
                if (volumeSlider) volumeSlider.value = this.volume * 100;
                if (volumeDisplay) volumeDisplay.textContent = `${Math.round(this.volume * 100)}%`;
                if (soundToggle) soundToggle.checked = this.soundEnabled;
                if (visualToggle) visualToggle.checked = this.visualEnabled;
            } catch (e) {
                console.warn('Failed to load settings:', e);
            }
        }
    }
    
    addToHistory(type, content, morse, accuracy = null) {
        const timestamp = new Date().toLocaleTimeString();
        const historyItem = {
            type,
            content,
            morse,
            timestamp,
            accuracy
        };
        
        this.history.unshift(historyItem);
        
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveSettings();
    }
}   

function startShortwaveSpectrum() {
    const bg = document.getElementById('spectrumBg');
    if (!bg) return;                       // 容器不存在就退出

    const barCount = window.innerWidth < 768 ? 30 : 60;
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'spectrum-bar';
        const leftPct = `${(i / (barCount - 1)) * 100}%`;
        bar.style.left = leftPct;
        bar.style.transform = 'translateX(-50%)';
        // 初始高度较低，使用 dataset 存储当前高度用于平滑动画
        const init = 5 + Math.random() * 6; // 5% ~ 11% 低噪声
        bar.style.height = `${init}%`;
        bar.dataset.h = String(init);
        // 抖动系数（用于让不同柱子抖动差异化）
        bar.dataset.jitter = String(0.8 + Math.random() * 1.2); // 0.8 ~ 2.0
        // 记录 left 以便前景柱能对齐
        bar.setAttribute('data-left', leftPct);
        bg.appendChild(bar);
    }
}

function animate() {
    const bg = document.getElementById('spectrumBg');
    if (!bg) return;
    const bars = bg.querySelectorAll('.spectrum-bar');
    if (bars.length === 0) return;
    bars.forEach(b => {
        // 目标高度：基线附近小幅随机抖动，但允许偶发突发以模拟真实短波底噪
        const base = 4; // 基线高度 4%
        const variance = 6; // 最大波动幅度
        const jitter = parseFloat(b.dataset.jitter) || 1;
        let target;
        // 小概率突发（根据 jitter 增强突发概率）
        if (Math.random() < 0.06 * Math.min(2, jitter)) {
            // 突发趋近于上限
            target = base + variance * (0.6 + Math.random() * 0.4);
        } else if (Math.random() < 0.04 * Math.min(2, jitter)) {
            // 偶发下陷
            target = base + variance * (0.05 + Math.random() * 0.15);
        } else {
            // 常规抖动
            target = base + Math.random() * variance;
        }
        const current = parseFloat(b.dataset.h || b.style.height.replace('%','')) || base;
        // 使用与 jitter 相关的插值因子，让某些柱子更“活跃”
        const alpha = Math.min(0.7, 0.06 + jitter * 0.28); // 0.06..0.64
        const next = current + (target - current) * alpha;
        b.style.height = `${next.toFixed(2)}%`;
        b.dataset.h = String(next);
    });
    // 前景柱：实现速升缓降和山峰分布的衰减
    const fg = document.querySelectorAll('.cluster-8 .fg-bar');
    if (fg && fg.length) {
        fg.forEach(f => {
            const base = parseFloat(f.dataset.base || '4');
            const target = parseFloat(f.dataset.target || String(base));
            const current = parseFloat(f.dataset.h || f.style.height.replace('%','')) || base;
            let nextF = current;
            if (current < target) {
                // 速升：如果目标高于当前，立即跳升接近目标（快速攻击）
                nextF = target;
            } else if (current > target) {
                // 缓降：慢慢衰减到目标（缓慢释放）
                // 支持每柱自定义 decay（dataset.decay），点/划会在 raiseForegroundBars 设置此值
                const decay = parseFloat(f.dataset.decay) || 0.92; // 每帧保留比例，靠近 1 更慢
                nextF = current * decay + target * (1 - decay);
                // 防止长时间残留极小差值
                if (Math.abs(nextF - target) < 0.05) nextF = target;
            }
            f.style.height = `${nextF.toFixed(2)}%`;
            f.dataset.h = String(nextF);
            // 如果目标为基线且已接近基线，移除 .show
            if (parseFloat(f.dataset.h) <= parseFloat(f.dataset.base) + 0.1) {
                f.classList.remove('show');
            }
        });
    }
    requestAnimationFrame(animate);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('CW发报器初始化...');
    
    // 检查必要的API支持
    if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {     
        startShortwaveSpectrum();
        // 启动频谱动画（较低振幅、较慢变化）
        animate();
        window.cwTransmitter = new CWTransmitter();

        // 频谱激发由声音事件驱动（playTone 内会调用 raiseForegroundBars），
        // 因此不再绑定全局键盘触发。

        console.log('CW发报器初始化完成');
    } else {
        console.error('Web Audio API 不支持');
        alert('您的浏览器不支持Web Audio API，音频功能将无法使用。');
    }
});