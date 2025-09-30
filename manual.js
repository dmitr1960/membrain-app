// manual.js - УНИВЕРСАЛЬНЫЙ КОД ДЛЯ ЛЮБЫХ ТЕМ

class MemoryCard {
    constructor(question, answer, theme = '') {
        this.question = question;
        this.answer = answer;
        this.theme = theme;
        this.id = Date.now() + Math.random();
        this.lastReviewed = null;
        this.confidence = 3;
    }
}

class MemoryApp {
    constructor() {
        this.cards = this.loadCards();
        this.currentCardIndex = 0;
        this.isAnswerShown = false;
        this.currentInterface = 'mainInterface'; // НОВОЕ: отслеживаем текущий интерфейс
    }

    init() {
        this.bindEvents();
        this.showMainInterface();
        this.setupPasteHandler();
        this.setupBackButton(); // НОВОЕ: настройка кнопки назад
    }

    // НОВЫЙ МЕТОД: Настройка кнопки назад
    setupBackButton() {
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    }

    // НОВЫЙ МЕТОД: Логика кнопки назад
    goBack() {
        switch(this.currentInterface) {
            case 'cardsContainer':
            case 'catalogInterface':
            case 'reviewInterface':
                this.showMainInterface();
                break;
            default:
                this.showMainInterface();
        }
    }

    // Обработчик вставки текста
    setupPasteHandler() {
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.autoDetectTheme();
                }, 10);
            });
        }
    }

    // Автоопределение темы из текста
    autoDetectTheme() {
        const textInput = document.getElementById('textInput');
        const themeInput = document.getElementById('themeInput');
        
        if (!textInput || !themeInput) return;
        
        const text = textInput.value.trim();
        if (!text) return;
        
        if (!themeInput.value.trim()) {
            const detectedTheme = this.findMainTopic(text);
            if (detectedTheme && detectedTheme !== 'основное понятие') {
                themeInput.value = detectedTheme;
            }
        }
    }

    bindEvents() {
        const elements = {
            generateBtn: document.getElementById('generateBtn'),
            startReviewBtn: document.getElementById('startReviewBtn'),
            showAnswerBtn: document.getElementById('showAnswerBtn'),
            hardBtn: document.getElementById('hardBtn'),
            goodBtn: document.getElementById('goodBtn'),
            easyBtn: document.getElementById('easyBtn')
        };
        
        if (elements.generateBtn) {
            elements.generateBtn.addEventListener('click', () => this.generateCards());
        }
        
        if (elements.startReviewBtn) {
            elements.startReviewBtn.addEventListener('click', () => this.startReview());
        }
        
        if (elements.showAnswerBtn) {
            elements.showAnswerBtn.addEventListener('click', () => this.showAnswer());
        }
        
        if (elements.hardBtn) {
            elements.hardBtn.addEventListener('click', () => this.rateCard(2));
        }
        
        if (elements.goodBtn) {
            elements.goodBtn.addEventListener('click', () => this.rateCard(3));
        }
        
        if (elements.easyBtn) {
            elements.easyBtn.addEventListener('click', () => this.rateCard(4));
        }
    }

    generateCards() {
        const textInput = document.getElementById('textInput');
        const themeInput = document.getElementById('themeInput');
        
        if (!textInput) return;
        
        const text = textInput.value.trim();
        let theme = themeInput ? themeInput.value.trim() : '';
        
        if (!text) {
            alert('Введите текст для генерации карточек');
            return;
        }
        
        if (!theme) {
            theme = this.findMainTopic(text);
            if (themeInput) themeInput.value = theme;
        }
        
        const newCards = [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        if (sentences.length === 0) {
            newCards.push(new MemoryCard(
                `Что такое ${theme}?`,
                text,
                theme
            ));
        } else {
            sentences.forEach((sentence, index) => {
                const cleanSentence = sentence.trim();
                const question = this.createContextQuestion(cleanSentence, theme, index);
                newCards.push(new MemoryCard(question, cleanSentence, theme));
            });
        }
        
        this.cards = [...this.cards, ...newCards];
        
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Добавлено ${newCards.length} карточек по теме "${theme}"! Всего карточек: ${this.cards.length}`);
    }

    // Находим основную тему текста
    findMainTopic(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            
            if (firstLine.length <= 100) {
                let cleanLine = firstLine
                    .replace(/(формулировка|определение|понятие|теория|закон|принцип|правило|сущность|основа|разновидности|виды|типы|классификация)\s+/gi, '')
                    .replace(/[.:\-–—]/g, '')
                    .trim();
                
                const wordCount = cleanLine.split(' ').length;
                if (wordCount >= 1 && wordCount <= 6 && cleanLine.length > 3) {
                    return cleanLine;
                }
            }
        }
        
        const sentences = text.split(/[.!?]+/).slice(0, 2);
        for (let sentence of sentences) {
            let cleanSentence = sentence
                .replace(/(формулировка|определение|понятие|теория|разновидности|виды|типы)\s+/gi, '')
                .trim();
            
            const words = cleanSentence.split(' ').filter(word => word.length > 0);
            
            for (let i = 0; i < words.length; i++) {
                const word = words[i].replace(/[^a-яё]/gi, '');
                if (word.length > 4 && words[i][0] === words[i][0].toUpperCase()) {
                    if (!this.isServiceWord(word.toLowerCase())) {
                        return word;
                    }
                }
            }
            
            const meaningfulWords = words.filter(word => {
                const clean = word.replace(/[^a-яё]/gi, '');
                return clean.length > 4 && !this.isServiceWord(clean.toLowerCase());
            });
            
            if (meaningfulWords.length >= 2) {
                return meaningfulWords.slice(0, 2).join(' ');
            }
            
            if (meaningfulWords.length === 1) {
                return meaningfulWords[0];
            }
        }
        
        const firstSentenceWords = text.split(' ').slice(0, 2);
        if (firstSentenceWords.length >= 2) {
            return firstSentenceWords.join(' ');
        }
        
        return 'основное понятие';
    }

    // Проверка служебных слов
    isServiceWord(word) {
        const serviceWords = [
            'формулировка', 'определение', 'понятие', 'теория', 'закон',
            'принцип', 'правило', 'теорема', 'аксиома', 'лемма', 
            'свойство', 'признак', 'явление', 'процесс', 'явление',
            'сущность', 'основа', 'смысл', 'значение', 'роль',
            'разновидности', 'виды', 'типы', 'классификация', 'пример',
            'особенности', 'характеристики', 'свойства', 'функции'
        ];
        return serviceWords.includes(word);
    }

    // Создаем осмысленные вопросы в контексте темы
    createContextQuestion(sentence, mainTopic, index) {
        const lowerSentence = sentence.toLowerCase();
        const lowerTopic = mainTopic.toLowerCase();
        
        if (lowerSentence.includes(lowerTopic) && sentence.length < 50) {
            const alternativeQuestions = [
                `Какие ключевые аспекты этого понятия?`,
                `Что конкретно описывает это утверждение?`,
                `Какая важная информация содержится здесь?`,
                `О чём идёт речь в этом контексте?`,
                `Что означает это положение?`
            ];
            return alternativeQuestions[index % alternativeQuestions.length];
        }
        
        if (index === 0) {
            return `В чём состоит ${mainTopic}?`;
        }
        
        if (lowerSentence.includes('ограничен') || lowerSentence.includes('нет ограничен')) {
            return `Какие ограничения имеет ${mainTopic}?`;
        }
        
        if (lowerSentence.includes('верна') || lowerSentence.includes('справедлива') || 
            lowerSentence.includes('действует') || lowerSentence.includes('применима')) {
            return `Для каких случаев применима ${mainTopic}?`;
        }
        
        if (lowerSentence.includes('услов') || lowerSentence.includes('требован')) {
            return `Какие условия должны выполняться для ${mainTopic}?`;
        }
        
        if (lowerSentence.includes('пример') || lowerSentence.includes('например')) {
            return `Приведите пример ${mainTopic}`;
        }
        
        if (lowerSentence.includes('значен') || lowerSentence.includes('важн')) {
            return `Какое значение имеет ${mainTopic}?`;
        }
        
        if (lowerSentence.includes('свойств') || lowerSentence.includes('особенност')) {
            return `Какие свойства имеет ${mainTopic}?`;
        }
        
        if (lowerSentence.includes('применен') || lowerSentence.includes('использ')) {
            return `Где применяется ${mainTopic}?`;
        }
        
        if (lowerSentence.includes('виды') || lowerSentence.includes('типы') || lowerSentence.includes('классификац')) {
            return `Какие виды ${mainTopic} существуют?`;
        }
        
        if (lowerSentence.includes('функц') || lowerSentence.includes('роль')) {
            return `Какую функцию выполняет ${mainTopic}?`;
        }
        
        const contextQuestions = [
            `Что ещё важно знать о ${mainTopic}?`,
            `Какие дополнительные свойства имеет ${mainTopic}?`,
            `Какие особенности имеет ${mainTopic}?`,
            `Что уточняется в ${mainTopic}?`,
            `Как работает ${mainTopic}?`,
            `В чём особенность ${mainTopic}?`,
            `Какие характеристики у ${mainTopic}?`,
            `Что описывает это утверждение о ${mainTopic}?`
        ];
        
        return contextQuestions[index % contextQuestions.length];
    }

    displayGeneratedCards() {
        const cardsList = document.getElementById('cardsList');
        const cardsContainer = document.getElementById('cardsContainer');
        
        if (!cardsList || !cardsContainer) return;
        
        cardsList.innerHTML = '';
        
        const recentCards = this.cards.slice(-10);
        
        recentCards.forEach((card) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                ${card.theme ? `<div class="card-theme">${card.theme}</div>` : ''}
                <div class="card-question">${card.question}</div>
                <div class="card-answer">${card.answer}</div>
            `;
            cardsList.appendChild(cardElement);
        });
        
        this.showInterface('cardsContainer');
    }

    // УЛУЧШЕННЫЙ МЕТОД: Показ каталога с древовидной структурой
    showCatalog() {
        if (this.cards.length === 0) {
            alert('Нет созданных карточек. Сначала создайте карточки.');
            this.showInterface('mainInterface');
            return;
        }
        
        const groupedByTheme = this.groupCardsByTheme();
        let catalogHTML = '';
        
        Object.entries(groupedByTheme).forEach(([theme, themeCards]) => {
            catalogHTML += `
                <div class="theme-group">
                    <div class="theme-header" onclick="memoryApp.toggleTheme('${theme}')">
                        <div class="theme-title">${theme}</div>
                        <div class="theme-count">${themeCards.length}</div>
                    </div>
                    <div class="theme-cards" id="theme-${this.encodeThemeId(theme)}">
                        ${themeCards.map(card => `
                            <div class="catalog-card">
                                <div style="font-weight: bold; margin-bottom: 8px;">${card.question}</div>
                                <div style="color: #666; font-size: 14px;">${card.answer.substring(0, 100)}${card.answer.length > 100 ? '...' : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        document.getElementById('catalogList').innerHTML = catalogHTML;
        this.showInterface('catalogInterface');
    }

    // НОВЫЙ МЕТОД: Переключение отображения карточек темы
    toggleTheme(theme) {
        const themeElement = document.getElementById(`theme-${this.encodeThemeId(theme)}`);
        if (themeElement) {
            if (themeElement.style.display === 'block') {
                themeElement.style.display = 'none';
            } else {
                themeElement.style.display = 'block';
            }
        }
    }

    // НОВЫЙ МЕТОД: Кодирование ID темы для использования в DOM
    encodeThemeId(theme) {
        return theme.replace(/[^a-zA-Z0-9а-яА-Я]/g, '-').toLowerCase();
    }

    // Группировка карточек по темам
    groupCardsByTheme() {
        return this.cards.reduce((groups, card) => {
            const theme = card.theme || 'Без темы';
            if (!groups[theme]) groups[theme] = [];
            groups[theme].push(card);
            return groups;
        }, {});
    }

    // УЛУЧШЕННЫЙ МЕТОД: Универсальный показ интерфейсов
    showInterface(interfaceName) {
        // Скрываем все интерфейсы
        document.getElementById('mainInterface').style.display = 'none';
        document.getElementById('cardsContainer').style.display = 'none';
        document.getElementById('reviewInterface').style.display = 'none';
        document.getElementById('catalogInterface').style.display = 'none';
        
        // Показываем нужный интерфейс
        document.getElementById(interfaceName).style.display = 'block';
        
        // Обновляем кнопку назад
        this.updateBackButton(interfaceName);
        
        // Сохраняем текущий интерфейс
        this.currentInterface = interfaceName;
    }

    // НОВЫЙ МЕТОД: Обновление видимости кнопки назад
    updateBackButton(interfaceName) {
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            if (interfaceName === 'mainInterface') {
                backBtn.style.display = 'none';
            } else {
                backBtn.style.display = 'block';
            }
        }
    }

    // УЛУЧШЕННЫЙ МЕТОД: Показ главного интерфейса
    showMainInterface() {
        this.showInterface('mainInterface');
    }

    startReview() {
        if (this.cards.length === 0) {
            alert('Нет карточек для повторения. Сначала создайте карточки.');
            this.showInterface('mainInterface');
            return;
        }
        
        this.currentCardIndex = 0;
        this.showInterface('reviewInterface');
        this.showCard();
    }

    showCard() {
        if (this.cards.length === 0) return;
        
        const card = this.cards[this.currentCardIndex];
        document.getElementById('questionCard').textContent = card.question;
        document.getElementById('answerCard').textContent = '';
        document.getElementById('answerCard').style.display = 'none';
        
        document.getElementById('showAnswerBtn').style.display = 'block';
        document.getElementById('hardBtn').style.display = 'none';
        document.getElementById('goodBtn').style.display = 'none';
        document.getElementById('easyBtn').style.display = 'none';
        
        this.isAnswerShown = false;
        this.updateProgress();
    }

    showAnswer() {
        if (this.cards.length === 0) return;
        
        const card = this.cards[this.currentCardIndex];
        document.getElementById('answerCard').textContent = card.answer;
        document.getElementById('answerCard').style.display = 'block';
        
        document.getElementById('showAnswerBtn').style.display = 'none';
        document.getElementById('hardBtn').style.display = 'inline-block';
        document.getElementById('goodBtn').style.display = 'inline-block';
        document.getElementById('easyBtn').style.display = 'inline-block';
        
        this.isAnswerShown = true;
        card.lastReviewed = new Date().toISOString();
        this.saveCards();
    }

    rateCard(rating) {
        if (this.cards.length === 0) return;
        
        this.cards[this.currentCardIndex].confidence = rating;
        this.saveCards();
        
        this.currentCardIndex++;
        
        if (this.currentCardIndex < this.cards.length) {
            this.showCard();
        } else {
            alert('Повторение завершено!');
            this.showInterface('mainInterface');
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            const progress = (this.currentCardIndex / this.cards.length) * 100;
            progressFill.style.width = progress + '%';
        }
    }

    saveCards() {
        localStorage.setItem('memoryCards', JSON.stringify(this.cards));
    }

    loadCards() {
        const saved = localStorage.getItem('memoryCards');
        return saved ? JSON.parse(saved) : [];
    }
}

// Глобальная переменная для доступа к приложению
let memoryApp;

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    memoryApp = new MemoryApp();
    memoryApp.init();
});
