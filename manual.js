// manual.js - ПОЛНЫЙ КОД С УЛУЧШЕННОЙ ГЕНЕРАЦИЕЙ ВОПРОСОВ

class MemoryCard {
    constructor(question, answer, theme = '', subject = '') {
        this.question = question;
        this.answer = answer;
        this.theme = theme;
        this.subject = subject;
        this.id = Date.now() + '_' + Math.floor(Math.random() * 1000000);
        this.lastReviewed = null;
        this.confidence = 3;
        this.createdAt = new Date().toISOString();
        this.nextReviewDate = this.calculateNextReviewDate();
    }

    calculateNextReviewDate() {
        const intervals = {
            2: 1,    // Сложно - через 1 день
            3: 3,    // Нормально - через 3 дня  
            4: 7     // Легко - через 7 дней
        };
        
        const nextDate = new Date();
        if (this.lastReviewed) {
            nextDate.setTime(new Date(this.lastReviewed).getTime());
        }
        nextDate.setDate(nextDate.getDate() + intervals[this.confidence]);
        return nextDate;
    }

    isDueForReview() {
        if (!this.lastReviewed) return true;
        return new Date() >= new Date(this.nextReviewDate);
    }

    getConfidenceText() {
        const confidenceMap = {
            2: '😣 Сложно',
            3: '😐 Нормально',
            4: '😊 Легко'
        };
        return confidenceMap[this.confidence] || '😐 Нормально';
    }
}

// УЛУЧШЕННЫЙ ГЕНЕРАТОР ВОПРОСОВ
class QuestionGenerator {
    constructor() {
        this.patterns = {
            location: [
                /столица/i,
                /город/i,
                /страна/i,
                /расположен/i,
                /находится/i,
                /место/i,
                /река/i,
                /гора/i,
                /озеро/i,
                /материк/i
            ],
            date: [
                /год/i,
                /век/i,
                /дата/i,
                /когда/i,
                /время/i,
                /период/i,
                /возраст/i,
                /эпоха/i
            ],
            person: [
                /ученый/i,
                /писатель/i,
                /поэт/i,
                /изобретатель/i,
                /открыл/i,
                /создал/i,
                /автор/i,
                /художник/i,
                /композитор/i,
                /правитель/i
            ],
            event: [
                /война/i,
                /революция/i,
                /событие/i,
                /явление/i,
                /процесс/i,
                /битва/i,
                /реформа/i,
                /открытие/i
            ],
            definition: [
                /определение/i,
                /означает/i,
                /понятие/i,
                /термин/i,
                /называется/i,
                /это\s+/,
                /является/i
            ]
        };
    }

    generateCardsFromFacts(facts, theme = '', subject = '') {
        return facts.map(factObj => {
            const fact = factObj.fact || factObj;
            const { question, answer } = this.generateQuestionAnswer(fact);
            return new MemoryCard(question, answer, theme, subject);
        });
    }

    generateQuestionAnswer(fact) {
        const factType = this.detectFactType(fact);
        const { question, answer } = this.applyQuestionTemplate(fact, factType);
        
        return { question, answer };
    }

    detectFactType(fact) {
        const lowerFact = fact.toLowerCase();
        
        for (const [type, patterns] of Object.entries(this.patterns)) {
            if (patterns.some(pattern => pattern.test(lowerFact))) {
                return type;
            }
        }
        
        return 'general';
    }

    applyQuestionTemplate(fact, factType) {
        const templates = {
            location: this.generateLocationQuestion,
            date: this.generateDateQuestion,
            person: this.generatePersonQuestion,
            event: this.generateEventQuestion,
            definition: this.generateDefinitionQuestion,
            general: this.generateGeneralQuestion
        };

        const generator = templates[factType] || templates.general;
        return generator.call(this, fact);
    }

    generateLocationQuestion(fact) {
        if (/столица/i.test(fact)) {
            const country = this.extractEntity(fact, /столица\s+([^—.,]+)/i) || 
                           this.extractEntity(fact, /([^—.,]+)\s+столица/i);
            return {
                question: `Какая столица ${country || 'этой страны'}?`,
                answer: this.extractAnswer(fact)
            };
        }
        
        return {
            question: `Где ${this.makeQuestionPhrase(fact)}?`,
            answer: this.extractAnswer(fact)
        };
    }

    generateDateQuestion(fact) {
        const yearMatch = fact.match(/\b(\d{4})\b/);
        if (yearMatch) {
            const event = this.extractEntity(fact, /(.+)\s+\d{4}/) || 
                         this.extractEntity(fact, /\d{4}\s+(.+)/);
            return {
                question: `Когда ${event ? `было ${event}` : 'произошло это событие'}?`,
                answer: `${yearMatch[1]} год`
            };
        }
        
        return {
            question: `Когда ${this.makeQuestionPhrase(fact)}?`,
            answer: this.extractAnswer(fact)
        };
    }

    generatePersonQuestion(fact) {
        return {
            question: `Кто ${this.makeQuestionPhrase(fact)}?`,
            answer: this.extractAnswer(fact)
        };
    }

    generateEventQuestion(fact) {
        return {
            question: `Что ${this.makeQuestionPhrase(fact)}?`,
            answer: this.extractAnswer(fact)
        };
    }

    generateDefinitionQuestion(fact) {
        const term = this.extractEntity(fact, /([^—]+)\s+—/) ||
                    this.extractEntity(fact, /([^—]+)\s+это/) ||
                    this.extractEntity(fact, /определение\s+([^.,]+)/i);
        
        if (term) {
            return {
                question: `Что такое "${term.trim()}"?`,
                answer: this.extractAnswer(fact)
            };
        }
        
        return {
            question: `Что означает "${this.extractMainSubject(fact)}"?`,
            answer: this.extractAnswer(fact)
        };
    }

    generateGeneralQuestion(fact) {
        const mainSubject = this.extractMainSubject(fact);
        return {
            question: `Как называется ${mainSubject}?`,
            answer: this.extractAnswer(fact)
        };
    }

    extractEntity(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
    }

    extractAnswer(fact) {
        const parts = fact.split(/[—–:]/);
        if (parts.length > 1) {
            return parts[1].trim();
        }
        
        const words = fact.split(' ');
        if (words.length <= 5) {
            return fact;
        }
        
        return words.slice(-3).join(' ');
    }

    makeQuestionPhrase(fact) {
        let phrase = fact.toLowerCase();
        phrase = phrase.replace(/это\s+/, '');
        phrase = phrase.replace(/является\s+/, '');
        phrase = phrase.replace(/был[ао]?\s+/, '');
        phrase = phrase.replace(/есть\s+/, '');
        
        const words = phrase.split(' ');
        if (words.length > 8) {
            phrase = words.slice(0, 8).join(' ');
        }
        
        return phrase;
    }

    extractMainSubject(fact) {
        const words = fact.split(' ');
        return words.slice(0, Math.min(3, words.length)).join(' ');
    }

    async generateQuestionWithAI(fact) {
        console.log('AI question generation for:', fact);
        return new Promise(resolve => {
            setTimeout(() => {
                const fallback = this.generateQuestionAnswer(fact);
                resolve(fallback);
            }, 500);
        });
    }
}

// ОСНОВНОЙ КЛАСС ПРИЛОЖЕНИЯ
class MemoryApp {
    constructor() {
        this.cards = this.loadCards();
        this.currentCardIndex = 0;
        this.isAnswerShown = false;
        this.currentInterface = 'mainInterface';
        this.editingCardId = null;
        this.deletingCardId = null;
        this.deletingThemeName = null;
        this.deletingSubjectName = null;
        this.reviewCards = [];
        this.selectedReviewOption = null;
        this.selectedSubjects = new Set();
        this.selectedThemes = new Set();
        this.selectedConfidence = 'all';
        
        this.questionGenerator = new QuestionGenerator();
        
        console.log('App initialized with cards:', this.cards.length);
    }

    init() {
        this.bindEvents();
        this.showMainInterface();
        this.setupPasteHandler();
        this.setupBackButton();
        this.setupModalHandlers();
        this.setupEventDelegation();
    }

    setupEventDelegation() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.classList.contains('edit-btn')) {
                const cardId = target.getAttribute('data-card-id');
                if (cardId) {
                    this.showEditModal(cardId);
                }
                e.stopPropagation();
            }
            
            if (target.classList.contains('delete-btn')) {
                const cardId = target.getAttribute('data-card-id');
                if (cardId) {
                    this.showDeleteModal(cardId);
                }
                e.stopPropagation();
            }
            
            if (target.classList.contains('delete-theme-btn')) {
                const themeName = target.getAttribute('data-theme-name');
                const subjectName = target.getAttribute('data-subject-name');
                if (themeName && subjectName) {
                    this.showDeleteThemeModal(themeName, subjectName);
                }
                e.stopPropagation();
            }
            
            if (target.classList.contains('delete-subject-btn')) {
                const subjectName = target.getAttribute('data-subject-name');
                if (subjectName) {
                    this.showDeleteSubjectModal(subjectName);
                }
                e.stopPropagation();
            }
        });
    }

    bindEvents() {
        const elements = {
            generateBtn: document.getElementById('generateBtn'),
            askAiBtn: document.getElementById('askAiBtn'),
            startReviewBtn: document.getElementById('startReviewBtn'),
            startReviewSelectionBtn: document.getElementById('startReviewSelectionBtn'),
            showAnswerBtn: document.getElementById('showAnswerBtn'),
            hardBtn: document.getElementById('hardBtn'),
            goodBtn: document.getElementById('goodBtn'),
            easyBtn: document.getElementById('easyBtn')
        };
        
        if (elements.generateBtn) {
            elements.generateBtn.addEventListener('click', () => this.generateCards());
        }
        
        if (elements.askAiBtn) {
            elements.askAiBtn.addEventListener('click', () => this.askAI());
        }
        
        if (elements.startReviewBtn) {
            elements.startReviewBtn.addEventListener('click', () => this.startReview());
        }
        
        if (elements.startReviewSelectionBtn) {
            elements.startReviewSelectionBtn.addEventListener('click', () => this.startSelectedReview());
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

        const questionInput = document.getElementById('questionInput');
        if (questionInput) {
            questionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.askAI();
                }
            });
        }
    }

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

    setupBackButton() {
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    }

    setupModalHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.hideEditModal();
            }
            if (e.target.id === 'deleteModal') {
                this.hideDeleteModal();
            }
            if (e.target.id === 'deleteThemeModal') {
                this.hideDeleteThemeModal();
            }
            if (e.target.id === 'deleteSubjectModal') {
                this.hideDeleteSubjectModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEditModal();
                this.hideDeleteModal();
                this.hideDeleteThemeModal();
                this.hideDeleteSubjectModal();
            }
        });
    }

    // СИСТЕМА ПОВТОРЕНИЯ
    showReviewSelect() {
        if (this.cards.length === 0) {
            this.showNotification('Нет карточек для повторения. Сначала создайте карточки.', 'error');
            this.showInterface('mainInterface');
            return;
        }
        
        this.selectedReviewOption = null;
        this.selectedSubjects.clear();
        this.selectedThemes.clear();
        this.selectedConfidence = 'all';
        
        this.updateCustomSelectionUI();
        this.showInterface('reviewSelectInterface');
    }

    selectReviewOption(option) {
        document.querySelectorAll('.review-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        event.target.closest('.review-option').classList.add('selected');
        this.selectedReviewOption = option;
        
        const customSelection = document.getElementById('customSelection');
        if (option === 'custom') {
            customSelection.style.display = 'block';
        } else {
            customSelection.style.display = 'none';
        }
        
        this.updateStartButton();
    }

    updateCustomSelectionUI() {
        const subjects = [...new Set(this.cards.map(card => card.subject).filter(Boolean))];
        const themes = [...new Set(this.cards.map(card => card.theme).filter(Boolean))];
        
        const subjectSelection = document.getElementById('subjectSelection');
        subjectSelection.innerHTML = subjects.map(subject => 
            `<div class="selection-item" onclick="memoryApp.toggleSelection(this, 'subject')" data-value="${subject}">${subject}</div>`
        ).join('');
        
        const themeSelection = document.getElementById('themeSelection');
        themeSelection.innerHTML = themes.map(theme => 
            `<div class="selection-item" onclick="memoryApp.toggleSelection(this, 'theme')" data-value="${theme}">${theme}</div>`
        ).join('');
    }

    toggleSelection(element, type) {
        const value = element.getAttribute('data-value');
        
        if (type === 'subject') {
            if (this.selectedSubjects.has(value)) {
                this.selectedSubjects.delete(value);
                element.classList.remove('selected');
            } else {
                this.selectedSubjects.add(value);
                element.classList.add('selected');
            }
        } else if (type === 'theme') {
            if (this.selectedThemes.has(value)) {
                this.selectedThemes.delete(value);
                element.classList.remove('selected');
            } else {
                this.selectedThemes.add(value);
                element.classList.add('selected');
            }
        } else if (type === 'confidence') {
            document.querySelectorAll('.selection-item[data-value]').forEach(el => {
                if (el.parentElement.querySelector('.selection-title').textContent.includes('Сложность')) {
                    el.classList.remove('selected');
                }
            });
            
            this.selectedConfidence = value;
            element.classList.add('selected');
        }
        
        this.updateStartButton();
    }

    updateStartButton() {
        const startBtn = document.getElementById('startReviewSelectionBtn');
        if (!startBtn) return;
        
        let canStart = false;
        
        if (this.selectedReviewOption === 'custom') {
            canStart = this.selectedSubjects.size > 0 || this.selectedThemes.size > 0;
        } else {
            canStart = this.selectedReviewOption !== null;
        }
        
        startBtn.disabled = !canStart;
        
        if (canStart) {
            const cardCount = this.getSelectedCards().length;
            startBtn.textContent = `🚀 Начать повторение (${cardCount} карточек)`;
        } else {
            startBtn.textContent = '🚀 Начать повторение выбранных карточек';
        }
    }

    getSelectedCards() {
        let filteredCards = [...this.cards];
        
        switch (this.selectedReviewOption) {
            case 'all':
                break;
            case 'due':
                filteredCards = filteredCards.filter(card => card.isDueForReview());
                break;
            case 'hard':
                filteredCards = filteredCards.filter(card => card.confidence === 2);
                break;
            case 'custom':
                if (this.selectedSubjects.size > 0) {
                    filteredCards = filteredCards.filter(card => 
                        this.selectedSubjects.has(card.subject)
                    );
                }
                if (this.selectedThemes.size > 0) {
                    filteredCards = filteredCards.filter(card => 
                        this.selectedThemes.has(card.theme)
                    );
                }
                if (this.selectedConfidence !== 'all') {
                    filteredCards = filteredCards.filter(card => 
                        card.confidence === parseInt(this.selectedConfidence)
                    );
                }
                break;
        }
        
        return this.shuffleArray(filteredCards);
    }

    startSelectedReview() {
        this.reviewCards = this.getSelectedCards();
        
        if (this.reviewCards.length === 0) {
            this.showNotification('Нет карточек, соответствующих выбранным критериям', 'error');
            return;
        }
        
        this.currentCardIndex = 0;
        this.showInterface('reviewInterface');
        this.showCard();
    }

    showCard() {
        if (this.reviewCards.length === 0) return;
        
        const card = this.reviewCards[this.currentCardIndex];
        
        document.getElementById('reviewProgress').textContent = 
            `${this.currentCardIndex + 1}/${this.reviewCards.length}`;
        document.getElementById('reviewSubjectTheme').textContent = 
            `${card.subject || 'Без предмета'}: ${card.theme || 'Без темы'}`;
        
        document.getElementById('questionCard').textContent = card.question;
        document.getElementById('answerCard').textContent = '';
        document.getElementById('answerCard').style.display = 'none';
        
        document.getElementById('cardMeta').innerHTML = `
            <strong>Сложность:</strong> ${card.getConfidenceText()} | 
            <strong>Последнее повторение:</strong> ${card.lastReviewed ? 
                new Date(card.lastReviewed).toLocaleDateString('ru-RU') : 'Никогда'}
        `;
        
        document.getElementById('showAnswerBtn').style.display = 'block';
        document.getElementById('hardBtn').style.display = 'none';
        document.getElementById('goodBtn').style.display = 'none';
        document.getElementById('easyBtn').style.display = 'none';
        
        this.isAnswerShown = false;
        this.updateProgress();
    }

    showAnswer() {
        if (this.reviewCards.length === 0) return;
        
        const card = this.reviewCards[this.currentCardIndex];
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
        if (this.reviewCards.length === 0) return;
        
        const card = this.reviewCards[this.currentCardIndex];
        card.confidence = rating;
        card.nextReviewDate = card.calculateNextReviewDate();
        this.saveCards();
        
        this.currentCardIndex++;
        
        if (this.currentCardIndex < this.reviewCards.length) {
            this.showCard();
        } else {
            const completedCount = this.reviewCards.length;
            this.showNotification(`Повторение завершено! Вы повторили ${completedCount} карточек! 🎉`, 'success');
            setTimeout(() => {
                this.showInterface('mainInterface');
            }, 2000);
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        if (progressFill && this.reviewCards.length > 0) {
            const progress = (this.currentCardIndex / this.reviewCards.length) * 100;
            progressFill.style.width = progress + '%';
        }
    }

    startReview() {
        if (this.cards.length === 0) {
            this.showNotification('Нет карточек для повторения. Сначала создайте карточки.', 'error');
            this.showInterface('mainInterface');
            return;
        }
        
        this.reviewCards = this.shuffleArray([...this.cards]);
        this.currentCardIndex = 0;
        this.showInterface('reviewInterface');
        this.showCard();
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // AI ФУНКЦИОНАЛ
    async askAI() {
        const questionInput = document.getElementById('questionInput');
        const textInput = document.getElementById('textInput');
        const askAiBtn = document.getElementById('askAiBtn');
        
        if (!questionInput || !textInput) return;
        
        const question = questionInput.value.trim();
        if (!question) {
            this.showNotification('Введите вопрос для AI', 'error');
            return;
        }
        
        askAiBtn.innerHTML = '<div class="loading"></div> Генерируем ответ...';
        askAiBtn.disabled = true;
        
        try {
            const aiResponse = await this.generateAIResponse(question);
            textInput.value = aiResponse;
            this.autoDetectThemeFromQuestion(question);
            this.showNotification('AI сгенерировал ответ! Теперь можно создать карточки', 'success');
        } catch (error) {
            console.error('AI error:', error);
            this.showNotification('Ошибка при генерации ответа', 'error');
        } finally {
            askAiBtn.innerHTML = '🤖 Спросить AI';
            askAiBtn.disabled = false;
        }
    }

    async generateAIResponse(question) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const knowledgeBase = {
            'что такое фотосинтез': `Фотосинтез — это процесс преобразования энергии света в химическую энергию, происходящий в растениях, водорослях и некоторых бактериях.

Основные этапы фотосинтеза:
1. Световые реакции - поглощение света хлорофиллом
2. Темновые реакции (цикл Кальвина) - фиксация углекислого газа

Уравнение фотосинтеза: 6CO₂ + 6H₂O + свет → C₆H₁₂O₆ + 6O₂

Значение фотосинтеза:
• Производство кислорода
• Создание органических веществ
• Основа пищевых цепей`,

            'строение клетки': `Клетка — основная структурная и функциональная единица живых организмов.

Основные компоненты клетки:
1. Ядро - содержит генетический материал (ДНК)
2. Цитоплазма - внутренняя среда клетки
3. Мембрана - регулирует обмен веществ
4. Митохондрии - энергетические станции
5. Рибосомы - синтез белка
6. Эндоплазматическая сеть - транспорт веществ

Особенности растительных клеток:
• Хлоропласты для фотосинтеза
• Клеточная стенка из целлюлозы
• Крупные вакуоли`,

            'отечественная война 1812 года': `Отечественная война 1812 года — военный конфликт между Российской империей и наполеоновской Францией.

Основные события:
• 12 июня 1812 - вторжение Наполеона
• Бородинское сражение (26 августа)
• Сдача Москвы
• Отступление французской армии
• 14 декабря - изгнание врага из России

Главные герои:
• Михаил Кутузов
• Петр Багратион  
• Михаил Барклай-де-Толли
• Денис Давыдов

Итоги:
• Разгром Великой армии Наполеона
• Начало заграничных походов русской армии
• Рост национального самосознания в России`
        };
        
        const lowerQuestion = question.toLowerCase();
        
        for (const [key, answer] of Object.entries(knowledgeBase)) {
            if (lowerQuestion.includes(key)) {
                return answer;
            }
        }
        
        return `Ответ на вопрос: "${question}"

Это сложный и многогранный вопрос. Вот основные аспекты:

1. Определение и основные понятия
2. Ключевые характеристики 
3. Практическое значение и применение
4. Исторический контекст развития
5. Современное понимание и перспективы

Для более точного ответа рекомендуется обратиться к специализированным источникам и учебной литературе.`;
    }

    autoDetectThemeFromQuestion(question) {
        const themeInput = document.getElementById('themeInput');
        if (!themeInput || themeInput.value.trim()) return;
        
        const detectedTheme = this.findMainTopic(question);
        if (detectedTheme && detectedTheme !== 'основное понятие') {
            themeInput.value = detectedTheme;
        }
    }

    // УЛУЧШЕННАЯ ГЕНЕРАЦИЯ КАРТОЧЕК
    generateCards() {
        const textInput = document.getElementById('textInput');
        const themeInput = document.getElementById('themeInput');
        const subjectInput = document.getElementById('subjectInput');
        
        if (!textInput) return;
        
        const text = textInput.value.trim();
        let theme = themeInput ? themeInput.value.trim() : '';
        let subject = subjectInput ? subjectInput.value.trim() : '';
        
        if (!text) {
            this.showNotification('Введите текст для генерации карточек', 'error');
            return;
        }
        
        if (!subject) {
            this.showNotification('Введите название предмета', 'error');
            return;
        }
        
        if (!theme) {
            theme = this.findMainTopic(text);
            if (themeInput) themeInput.value = theme;
        }
        
        const newCards = this.improvedCardGeneration(text, theme, subject);
        
        this.cards = [...this.cards, ...newCards];
        this.saveCards();
        this.displayGeneratedCards();
        
        this.showNotification(`Добавлено ${newCards.length} карточек по теме "${theme}"! Всего карточек: ${this.cards.length}`, 'success');
    }

    improvedCardGeneration(text, theme, subject) {
        const facts = this.extractFactsFromText(text);
        console.log('Извлеченные факты:', facts);
        
        const factCards = this.questionGenerator.generateCardsFromFacts(facts, theme, subject);
        
        if (factCards.length === 0) {
            return this.intelligentCardGeneration(text, theme, subject);
        }
        
        return factCards;
    }

    extractFactsFromText(text) {
        const facts = [];
        
        const cleanText = text.replace(/\n\s*\n/g, '\n').trim();
        const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            
            if (this.looksLikeFact(trimmed)) {
                facts.push({ fact: trimmed });
            }
        });
        
        if (facts.length < 3 && sentences.length > 0) {
            const keySentences = sentences
                .filter(s => this.isImportantSentence(s))
                .slice(0, 5);
                
            keySentences.forEach(sentence => {
                facts.push({ fact: sentence.trim() });
            });
        }
        
        return facts;
    }

    looksLikeFact(sentence) {
        const factPatterns = [
            /[^—]+—[^—]/,
            /[^:]+:[^:]/,
            /является/i,
            /это\s+/,
            /означает/i,
            /называется/i,
            /состоит\s+в/i,
            /заключается\s+в/i
        ];
        
        return factPatterns.some(pattern => pattern.test(sentence));
    }

    isImportantSentence(sentence) {
        const importantIndicators = [
            /определение/i,
            /понятие/i,
            /сущность/i,
            /основн/i,
            /главн/i,
            /ключев/i,
            /важн/i,
            /заключ/i
        ];
        
        return importantIndicators.some(indicator => indicator.test(sentence.toLowerCase()));
    }

    intelligentCardGeneration(text, theme, subject) {
        const newCards = [];
        
        const meaningBlocks = this.extractMeaningBlocks(text);
        
        console.log('Найдены смысловые блоки (старый метод):', meaningBlocks);
        
        meaningBlocks.forEach((block, index) => {
            try {
                const { question, answer } = this.questionGenerator.generateQuestionAnswer(block.content);
                
                if (answer.length > 10) {
                    newCards.push(new MemoryCard(question, answer, theme, subject));
                }
            } catch (error) {
                console.error('Error generating card:', error);
                const oldQuestion = this.generateSmartQuestion(block, theme, index, meaningBlocks.length);
                if (block.content.length > 20) {
                    newCards.push(new MemoryCard(oldQuestion, block.content, theme, subject));
                }
            }
        });
        
        if (newCards.length === 0 && text.length > 50) {
            const { question, answer } = this.questionGenerator.generateQuestionAnswer(text);
            newCards.push(new MemoryCard(question, answer, theme, subject));
        }
        
        return newCards;
    }

    // СТАРЫЕ МЕТОДЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
    extractMeaningBlocks(text) {
        const blocks = [];
        const cleanText = text.replace(/\n\s*\n/g, '\n').trim();
        const paragraphs = cleanText.split(/\n+/).filter(p => p.trim().length > 0);
        
        paragraphs.forEach(paragraph => {
            const trimmedPara = paragraph.trim();
            
            if (trimmedPara.length < 100 && this.looksLikeHeading(trimmedPara)) {
                blocks.push({
                    type: 'heading',
                    content: trimmedPara,
                    isImportant: true
                });
            } else {
                const sentences = trimmedPara.split(/[.!?]+/).filter(s => s.trim().length > 10);
                
                if (sentences.length <= 2) {
                    blocks.push({
                        type: 'paragraph',
                        content: trimmedPara,
                        isImportant: this.isImportantContent(trimmedPara)
                    });
                } else {
                    const sentenceGroups = this.groupSentencesByMeaning(sentences);
                    sentenceGroups.forEach(group => {
                        blocks.push({
                            type: 'concept',
                            content: group.join(' '),
                            isImportant: group.some(s => this.isImportantContent(s))
                        });
                    });
                }
            }
        });
        
        return this.mergeShortBlocks(blocks);
    }

    looksLikeHeading(text) {
        const headingIndicators = [
            /^[А-Я][а-я]+\s*:/,
            /^[IVXLCDM]+\./,
            /^\d+\./,
            /^[а-я]\)/,
            /^[•\-*]\s/,
            /^[А-Я][^.!?]*$/,
            /^(определение|понятие|теория|закон|принцип|правило|свойство|признак|функция|роль|значение|виды|типы|классификация|пример|особенности|характеристики)/i
        ];
        
        return headingIndicators.some(pattern => pattern.test(text));
    }

    isImportantContent(text) {
        const importantKeywords = [
            'определение', 'определяется', 'является', 'состоит', 'включает',
            'главный', 'основной', 'важный', 'ключевой', 'существенный',
            'функция', 'роль', 'значение', 'свойство', 'признак',
            'отличие', 'различие', 'сходство', 'преимущество', 'недостаток',
            'причина', 'следствие', 'результат', 'влияние', 'зависимость'
        ];
        
        const lowerText = text.toLowerCase();
        return importantKeywords.some(keyword => lowerText.includes(keyword));
    }

    groupSentencesByMeaning(sentences) {
        const groups = [];
        let currentGroup = [];
        
        sentences.forEach((sentence, index) => {
            const cleanSentence = sentence.trim();
            const startsNewConcept = this.startsNewConcept(cleanSentence);
            
            if (startsNewConcept && currentGroup.length > 0) {
                groups.push([...currentGroup]);
                currentGroup = [cleanSentence];
            } else {
                currentGroup.push(cleanSentence);
            }
            
            if (index === sentences.length - 1 && currentGroup.length > 0) {
                groups.push([...currentGroup]);
            }
        });
        
        return groups;
    }

    startsNewConcept(sentence) {
        const conceptStarters = [
            /^кроме того/i,
            /^также/i,
            /^при этом/i,
            /^с другой стороны/i,
            /^однако/i,
            /^таким образом/i,
            /^в результате/i,
            /^например/i,
            /^в частности/i,
            /^во-первых/i,
            /^во-вторых/i,
            /^следующий/i,
            /^другой/i,
            /^отдельный/i,
            /^особый/i
        ];
        
        return conceptStarters.some(starter => starter.test(sentence));
    }

    mergeShortBlocks(blocks) {
        const merged = [];
        let currentBlock = null;
        
        blocks.forEach(block => {
            if (block.type === 'heading') {
                if (currentBlock) {
                    merged.push(currentBlock);
                }
                currentBlock = block;
            } else if (currentBlock && currentBlock.content.length < 150) {
                currentBlock.content += ' ' + block.content;
                currentBlock.isImportant = currentBlock.isImportant || block.isImportant;
            } else {
                if (currentBlock) {
                    merged.push(currentBlock);
                }
                currentBlock = block;
            }
        });
        
        if (currentBlock) {
            merged.push(currentBlock);
        }
        
        return merged.filter(block => block.content.length > 30);
    }

    generateSmartQuestion(block, theme, index, totalBlocks) {
        const content = block.content.toLowerCase();
        
        if (block.type === 'heading') {
            return `Что означает "${block.content}"?`;
        }
        
        if (content.includes('определение') || content.includes('означает') || content.includes('это')) {
            return 'Какое определение дается?';
        }
        
        if (content.includes('функция') || content.includes('роль') || content.includes('значение')) {
            return 'Какую функцию выполняет?';
        }
        
        if (content.includes('свойство') || content.includes('характеристика') || content.includes('особенность')) {
            return 'Какие свойства имеет?';
        }
        
        if (content.includes('вид') || content.includes('тип') || content.includes('классификация')) {
            return 'Какие виды существуют?';
        }
        
        if (content.includes('пример') || content.includes('например')) {
            return 'Приведите пример';
        }
        
        if (content.includes('причина') || content.includes('влияние') || content.includes('зависит')) {
            return 'Какие причины и следствия?';
        }
        
        if (content.includes('отличие') || content.includes('различие') || content.includes('сходство')) {
            return 'В чём отличие?';
        }
        
        if (content.includes('состоит') || content.includes('включает') || content.includes('структура')) {
            return 'Из чего состоит?';
        }
        
        if (content.includes('процесс') || content.includes('этап') || content.includes('стадия')) {
            return 'Как происходит процесс?';
        }
        
        if (block.isImportant && index === 0) {
            return 'В чём состоит основная идея?';
        }
        
        if (block.isImportant) {
            const importantQuestions = [
                'Что важно знать?',
                'Какой ключевой момент?',
                'Какая основная мысль?',
                'Что следует запомнить?'
            ];
            return importantQuestions[index % importantQuestions.length];
        }
        
        const standardQuestions = [
            'Что описывается в этом фрагменте?',
            'О чём идёт речь?',
            'Какая информация содержится?',
            'Что уточняется?',
            'Какой аспект рассматривается?'
        ];
        
        return standardQuestions[index % standardQuestions.length];
    }

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

    // ИНТЕРФЕЙС И НАВИГАЦИЯ
    showInterface(interfaceName) {
        document.getElementById('mainInterface').style.display = 'none';
        document.getElementById('cardsContainer').style.display = 'none';
        document.getElementById('reviewInterface').style.display = 'none';
        document.getElementById('catalogInterface').style.display = 'none';
        document.getElementById('reviewSelectInterface').style.display = 'none';
        
        document.getElementById(interfaceName).style.display = 'block';
        this.updateBackButton(interfaceName);
        this.currentInterface = interfaceName;
    }

    updateBackButton(interfaceName) {
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            if (interfaceName === 'mainInterface') {
                backBtn.style.display = 'none';
            } else {
                backBtn.style.display = 'block';
                
                if (interfaceName === 'reviewInterface') {
                    backBtn.onclick = () => this.showReviewSelect();
                } else {
                    backBtn.onclick = () => this.showMainInterface();
                }
            }
        }
    }

    goBack() {
        switch(this.currentInterface) {
            case 'cardsContainer':
            case 'catalogInterface':
            case 'reviewInterface':
            case 'reviewSelectInterface':
                this.showMainInterface();
                break;
            default:
                this.showMainInterface();
        }
    }

    showMainInterface() {
        this.showInterface('mainInterface');
    }

    // КАТАЛОГ
    showCatalog() {
        if (this.cards.length === 0) {
            this.showNotification('Нет созданных карточек. Сначала создайте карточки.', 'error');
            this.showInterface('mainInterface');
            return;
        }
        
        const groupedBySubject = this.groupCardsBySubject();
        let catalogHTML = '';
        
        Object.entries(groupedBySubject).forEach(([subject, subjectData]) => {
            const themeCount = Object.keys(subjectData.themes).length;
            const totalCards = Object.values(subjectData.themes).reduce((sum, theme) => sum + theme.length, 0);
            
            catalogHTML += `
                <div class="subject-group">
                    <div class="subject-header" onclick="memoryApp.toggleSubject('${this.encodeId(subject)}')">
                        <div class="subject-title">${subject}</div>
                        <div class="subject-count">${totalCards} карточек</div>
                        <button class="delete-subject-btn" data-subject-name="${subject}">
                            🗑
                        </button>
                    </div>
                    <div class="subject-themes" id="subject-${this.encodeId(subject)}">
            `;
            
            Object.entries(subjectData.themes).forEach(([theme, themeCards]) => {
                catalogHTML += `
                    <div class="theme-group">
                        <div class="theme-header" onclick="memoryApp.toggleTheme('${this.encodeId(subject)}', '${this.encodeId(theme)}')">
                            <div class="theme-title">${theme}</div>
                            <div class="theme-count">${themeCards.length}</div>
                            <button class="delete-theme-btn" data-subject-name="${subject}" data-theme-name="${theme}">
                                🗑
                            </button>
                        </div>
                        <div class="theme-cards" id="theme-${this.encodeId(subject)}-${this.encodeId(theme)}">
                            ${themeCards.map(card => `
                                <div class="catalog-card">
                                    <div style="font-weight: bold; margin-bottom: 8px;">${card.question}</div>
                                    <div style="color: #666; font-size: 14px; margin-bottom: 10px;">${card.answer.substring(0, 100)}${card.answer.length > 100 ? '...' : ''}</div>
                                    <div class="card-actions">
                                        <button class="edit-btn" data-card-id="${card.id}">
                                            ✏ Редактировать
                                        </button>
                                        <button class="delete-btn" data-card-id="${card.id}">
                                            🗑 Удалить
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            
            catalogHTML += `
                    </div>
                </div>
            `;
        });
        
        document.getElementById('catalogList').innerHTML = catalogHTML;
        this.showInterface('catalogInterface');
    }

    groupCardsBySubject() {
        return this.cards.reduce((groups, card) => {
            const subject = card.subject || 'Без предмета';
            const theme = card.theme || 'Без темы';
            
            if (!groups[subject]) {
                groups[subject] = { themes: {} };
            }
            
            if (!groups[subject].themes[theme]) {
                groups[subject].themes[theme] = [];
            }
            
            groups[subject].themes[theme].push(card);
            return groups;
        }, {});
    }

    toggleSubject(subjectId) {
        const subjectElement = document.getElementById(`subject-${subjectId}`);
        if (subjectElement) {
            if (subjectElement.style.display === 'block') {
                subjectElement.style.display = 'none';
            } else {
                subjectElement.style.display = 'block';
            }
        }
    }

    toggleTheme(subjectId, themeId) {
        const themeElement = document.getElementById(`theme-${subjectId}-${themeId}`);
        if (themeElement) {
            if (themeElement.style.display === 'block') {
                themeElement.style.display = 'none';
            } else {
                themeElement.style.display = 'block';
            }
        }
    }

    encodeId(text) {
        return text.replace(/[^a-zA-Z0-9а-яА-Я]/g, '-').toLowerCase();
    }

    // ОТОБРАЖЕНИЕ СГЕНЕРИРОВАННЫХ КАРТОЧЕК
    displayGeneratedCards() {
        const cardsList = document.getElementById('cardsList');
        const cardsContainer = document.getElementById('cardsContainer');
        
        if (!cardsList || !cardsContainer) return;
        
        cardsList.innerHTML = '';
        
        const currentSubject = document.getElementById('subjectInput').value.trim();
        const currentTheme = document.getElementById('themeInput').value.trim();
        
        const recentCards = this.cards.filter(card => 
            card.subject === currentSubject && card.theme === currentTheme
        );
        
        if (recentCards.length === 0) {
            const allRecentCards = this.cards.slice(-20);
            allRecentCards.forEach((card) => {
                const cardElement = this.createCardElement(card);
                cardsList.appendChild(cardElement);
            });
        } else {
            recentCards.forEach((card) => {
                const cardElement = this.createCardElement(card);
                cardsList.appendChild(cardElement);
            });
        }
        
        this.showInterface('cardsContainer');
    }

    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            ${card.subject ? `<div class="card-subject">${card.subject}</div>` : ''}
            ${card.theme ? `<div class="card-theme">${card.theme}</div>` : ''}
            <div class="card-question">${card.question}</div>
            <div class="card-answer">${card.answer}</div>
            <div class="card-actions">
                <button class="edit-btn" data-card-id="${card.id}">
                    ✏ Редактировать
                </button>
                <button class="delete-btn" data-card-id="${card.id}">
                    🗑 Удалить
                </button>
            </div>
        `;
        return cardElement;
    }

    // СТАТИСТИКА
    showStatistics() {
        const stats = this.getStatistics();
        
        const statsText = `
📊 Статистика обучения:

Всего карточек: ${stats.totalCards}
Повторено сегодня: ${stats.reviewedToday}

По сложности:
😣 Сложные: ${stats.byConfidence.hard}
😐 Нормальные: ${stats.byConfidence.good}  
😊 Легкие: ${stats.byConfidence.easy}

По предметам:
${Object.entries(stats.bySubject).map(([subject, count]) => `• ${subject}: ${count} карточек`).join('\n')}
        `.trim();
        
        alert(statsText);
    }

    getStatistics() {
        const today = new Date().toDateString();
        const reviewedToday = this.cards.filter(card => 
            card.lastReviewed && new Date(card.lastReviewed).toDateString() === today
        ).length;
        
        const bySubject = this.cards.reduce((acc, card) => {
            const subject = card.subject || 'Без предмета';
            acc[subject] = (acc[subject] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalCards: this.cards.length,
            reviewedToday,
            byConfidence: {
                hard: this.cards.filter(c => c.confidence === 2).length,
                good: this.cards.filter(c => c.confidence === 3).length,
                easy: this.cards.filter(c => c.confidence === 4).length
            },
            bySubject
        };
    }

    // УВЕДОМЛЕНИЯ
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ
    showEditModal(cardId) {
        const card = this.cards.find(c => c.id == cardId);
        if (!card) {
            this.showNotification('Ошибка: карточка не найдена', 'error');
            return;
        }
        
        this.editingCardId = cardId;
        
        document.getElementById('editSubject').value = card.subject || '';
        document.getElementById('editTheme').value = card.theme || '';
        document.getElementById('editQuestion').value = card.question || '';
        document.getElementById('editAnswer').value = card.answer || '';
        
        document.getElementById('editModal').style.display = 'flex';
    }

    hideEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingCardId = null;
    }

    saveEditedCard() {
        if (!this.editingCardId) return;
        
        const card = this.cards.find(c => c.id == this.editingCardId);
        if (!card) {
            this.showNotification('Ошибка: карточка не найдена', 'error');
            return;
        }
        
        const newSubject = document.getElementById('editSubject').value.trim();
        const newTheme = document.getElementById('editTheme').value.trim();
        const newQuestion = document.getElementById('editQuestion').value.trim();
        const newAnswer = document.getElementById('editAnswer').value.trim();
        
        if (!newQuestion || !newAnswer || !newSubject) {
            this.showNotification('Предмет, вопрос и ответ не могут быть пустыми!', 'error');
            return;
        }
        
        card.subject = newSubject;
        card.theme = newTheme;
        card.question = newQuestion;
        card.answer = newAnswer;
        
        this.saveCards();
        this.hideEditModal();
        
        if (this.currentInterface === 'catalogInterface') {
            this.showCatalog();
        } else if (this.currentInterface === 'cardsContainer') {
            this.displayGeneratedCards();
        }
        
        this.showNotification('Карточка успешно обновлена! ✅', 'success');
    }

    showDeleteModal(cardId) {
        this.deletingCardId = cardId;
        document.getElementById('deleteModal').style.display = 'flex';
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        this.deletingCardId = null;
    }

    confirmDeleteCard() {
        if (!this.deletingCardId) return;
        
        const initialLength = this.cards.length;
        this.cards = this.cards.filter(c => c.id != this.deletingCardId);
        
        if (this.cards.length === initialLength) {
            this.showNotification('Ошибка при удалении карточки', 'error');
            return;
        }
        
        this.saveCards();
        this.hideDeleteModal();
        
        if (this.currentInterface === 'catalogInterface') {
            this.showCatalog();
        } else if (this.currentInterface === 'cardsContainer') {
            this.displayGeneratedCards();
        }
        
        this.showNotification('Карточка удалена! ✅', 'success');
    }

    showDeleteThemeModal(themeName, subjectName) {
        this.deletingThemeName = themeName;
        this.deletingSubjectName = subjectName;
        
        const themeCards = this.cards.filter(card => 
            card.subject === subjectName && card.theme === themeName
        );
        
        document.getElementById('deleteThemeText').textContent = 
            `Вы уверены, что хотите удалить тему "${themeName}" и все ${themeCards.length} карточек в ней? Это действие нельзя отменить.`;
        
        document.getElementById('deleteThemeModal').style.display = 'flex';
    }

    hideDeleteThemeModal() {
        document.getElementById('deleteThemeModal').style.display = 'none';
        this.deletingThemeName = null;
        this.deletingSubjectName = null;
    }

    confirmDeleteTheme() {
        if (!this.deletingThemeName || !this.deletingSubjectName) return;
        
        const initialLength = this.cards.length;
        this.cards = this.cards.filter(card => 
            !(card.subject === this.deletingSubjectName && card.theme === this.deletingThemeName)
        );
        
        const deletedCount = initialLength - this.cards.length;
        this.saveCards();
        this.hideDeleteThemeModal();
        this.showCatalog();
        
        this.showNotification(`Тема "${this.deletingThemeName}" и ${deletedCount} карточек удалены! ✅`, 'success');
    }

    showDeleteSubjectModal(subjectName) {
        this.deletingSubjectName = subjectName;
        
        const subjectCards = this.cards.filter(card => card.subject === subjectName);
        const themeCount = new Set(subjectCards.map(card => card.theme)).size;
        
        document.getElementById('deleteSubjectText').textContent = 
            `Вы уверены, что хотите удалить предмет "${subjectName}" (${themeCount} тем, ${subjectCards.length} карточек)? Это действие нельзя отменить.`;
        
        document.getElementById('deleteSubjectModal').style.display = 'flex';
    }

    hideDeleteSubjectModal() {
        document.getElementById('deleteSubjectModal').style.display = 'none';
        this.deletingSubjectName = null;
    }

    confirmDeleteSubject() {
        if (!this.deletingSubjectName) return;
        
        const initialLength = this.cards.length;
        this.cards = this.cards.filter(card => card.subject !== this.deletingSubjectName);
        
        const deletedCount = initialLength - this.cards.length;
        this.saveCards();
        this.hideDeleteSubjectModal();
        this.showCatalog();
        
        this.showNotification(`Предмет "${this.deletingSubjectName}" и ${deletedCount} карточек удалены! ✅`, 'success');
    }

    // ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
    shareApp() {
        const shareText = 'MemBrain - бесплатное приложение для создания карточек и обучения с интервальными повторениями!';
        
        if (navigator.share) {
            navigator.share({
                title: 'MemBrain',
                text: shareText,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('Ссылка скопирована! Отправьте друзьям и коллегам! 🎉', 'success');
            });
        }
    }

    saveCards() {
        try {
            localStorage.setItem('memoryCards', JSON.stringify(this.cards));
            console.log('Cards saved successfully, total:', this.cards.length);
        } catch (e) {
            console.error('Error saving cards:', e);
            this.showNotification('Ошибка сохранения данных', 'error');
        }
    }

    loadCards() {
        try {
            const saved = localStorage.getItem('memoryCards');
            if (!saved) return [];
            
            const cardsData = JSON.parse(saved);
            const cards = cardsData.map(cardData => {
                const card = new MemoryCard(
                    cardData.question || '',
                    cardData.answer || '',
                    cardData.theme || '',
                    cardData.subject || ''
                );
                card.id = cardData.id || card.id;
                card.lastReviewed = cardData.lastReviewed || null;
                card.confidence = cardData.confidence || 3;
                card.createdAt = cardData.createdAt || new Date().toISOString();
                return card;
            });
            
            console.log('Cards loaded:', cards.length);
            return cards;
        } catch (e) {
            console.error('Error loading cards:', e);
            this.showNotification('Ошибка загрузки данных', 'error');
            return [];
        }
    }
}

// ТЕСТИРОВАНИЕ ГЕНЕРАТОРА ВОПРОСОВ
function testQuestionGenerator() {
    const generator = new QuestionGenerator();
    
    const testFacts = [
        { fact: "Столица Франции — Париж" },
        { fact: "Великая Отечественная война была в 1941-1945 годах" },
        { fact: "Александр Пушкин — великий русский поэт" },
        { fact: "Фотосинтез — это процесс преобразования света в химическую энергию" },
        { fact: "Вода кипит при 100 градусах Цельсия" }
    ];
    
    console.log('=== ТЕСТ ГЕНЕРАТОРА ВОПРОСОВ ===');
    testFacts.forEach(factObj => {
        const result = generator.generateQuestionAnswer(factObj.fact);
        console.log('Факт:', factObj.fact);
        console.log('Вопрос:', result.question);
        console.log('Ответ:', result.answer);
        console.log('---');
    });
}

// Глобальная переменная для доступа к приложению
let memoryApp;

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    memoryApp = new MemoryApp();
    memoryApp.init();
    console.log('MemBrain app initialized');
    
    // Тестируем генератор вопросов
    testQuestionGenerator();
});
