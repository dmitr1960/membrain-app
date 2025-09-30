// manual.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

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
        this.currentInterface = 'mainInterface';
        this.editingCardId = null;
        this.deletingCardId = null;
    }

    init() {
        this.bindEvents();
        this.showMainInterface();
        this.setupPasteHandler();
        this.setupBackButton();
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
                <div class="card-actions">
                    <button class="edit-btn" data-card-id="${card.id}">
                        ✏️ Редактировать
                    </button>
                    <button class="delete-btn" data-card-id="${card.id}">
                        🗑️ Удалить
                    </button>
                </div>
            `;
            cardsList.appendChild(cardElement);
        });
        
        // Добавляем обработчики событий после создания элементов
        this.bindCardActions();
        this.showInterface('cardsContainer');
    }

    // ДОБАВЛЕННЫЙ МЕТОД ДЛЯ ОБРАБОТКИ КНОПОК
    bindCardActions() {
        // Обработчики для кнопок редактирования
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cardId = e.target.getAttribute('data-card-id');
                if (cardId) {
                    this.showEditModal(cardId);
                }
            });
        });
        
        // Обработчики для кнопок удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cardId = e.target.getAttribute('data-card-id');
                if (cardId) {
                    this.showDeleteModal(cardId);
                }
            });
        });
    }

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
                                <div style="color: #666; font-size: 14px; margin-bottom: 10px;">${card.answer.substring(0, 100)}${card.answer.length > 100 ? '...' : ''}</div>
                                <div class="card-actions">
                                    <button class="edit-btn" data-card-id="${card.id}">
                                        ✏️ Редактировать
                                    </button>
                                    <button class="delete-btn" data-card-id="${card.id}">
                                        🗑️ Удалить
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        document.getElementById('catalogList').innerHTML = catalogHTML;
        
        // Добавляем обработчики для каталога
        this.bindCardActions();
        this.showInterface('catalogInterface');
    }

    toggleTheme(theme) {
        const themeElement = document.getElementById(`theme-${this.encodeThemeId(theme)}`);
        if (themeElement) {
            if (themeElement.style.display === 'block') {
                themeElement.style.display = 'none';
            } else {
                themeElement.style.display = 'block';
                // Перепривязываем обработчики при показе темы
                setTimeout(() => this.bindCardActions(), 10);
            }
        }
    }

    encodeThemeId(theme) {
        return theme.replace(/[^a-zA-Z0-9а-яА-Я]/g, '-').toLowerCase();
    }

    groupCardsByTheme() {
        return this.cards.reduce((groups, card) => {
            const theme = card.theme || 'Без темы';
            if (!groups[theme]) groups[theme] = [];
            groups[theme].push(card);
            return groups;
        }, {});
    }

    showInterface(interfaceName) {
        document.getElementById('mainInterface').style.display = 'none';
        document.getElementById('cardsContainer').style.display = 'none';
        document.getElementById('reviewInterface').style.display = 'none';
        document.getElementById('catalogInterface').style.display = 'none';
        
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
            }
        }
    }

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

    // МЕТОДЫ РЕДАКТИРОВАНИЯ
    showEditModal(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;
        
        this.editingCardId = cardId;
        
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
        
        const card = this.cards.find(c => c.id === this.editingCardId);
        if (!card) return;
        
        const newTheme = document.getElementById('editTheme').value.trim();
        const newQuestion = document.getElementById('editQuestion').value.trim();
        const newAnswer = document.getElementById('editAnswer').value.trim();
        
        if (!newQuestion || !newAnswer) {
            alert('Вопрос и ответ не могут быть пустыми!');
            return;
        }
        
        card.theme = newTheme;
        card.question = newQuestion;
        card.answer = newAnswer;
        
        this.saveCards();
        this.hideEditModal();
        
        if (this.currentInterface === 'catalogInterface') {
            this.showCatalog();
        }
        
        alert('Карточка успешно обновлена! ✅');
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
        
        this.cards = this.cards.filter(c => c.id !== this.deletingCardId);
        this.saveCards();
        this.hideDeleteModal();
        
        if (this.currentInterface === 'catalogInterface') {
            this.showCatalog();
        }
        
        alert('Карточка удалена! ✅');
    }

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
                alert('Ссылка скопирована! Отправьте друзьям и коллегам! 🎉');
            });
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
