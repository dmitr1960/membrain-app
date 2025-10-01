// manual.js - УМНАЯ ГЕНЕРАЦИЯ ПО СМЫСЛОВЫМ БЛОКАМ

class MemoryCard {
    constructor(question, answer, theme = '', subject = '') {
        this.question = question;
        this.answer = answer;
        this.theme = theme;
        this.subject = subject;
        this.id = Date.now() + '_' + Math.floor(Math.random() * 1000000);
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
        this.deletingThemeName = null;
        this.deletingSubjectName = null;
        
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

    // ДЕЛЕГИРОВАНИЕ СОБЫТИЙ
    setupEventDelegation() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Редактирование карточки
            if (target.classList.contains('edit-btn')) {
                const cardId = target.getAttribute('data-card-id');
                console.log('Edit clicked, cardId:', cardId);
                if (cardId) {
                    this.showEditModal(cardId);
                }
                e.stopPropagation();
            }
            
            // Удаление карточки
            if (target.classList.contains('delete-btn')) {
                const cardId = target.getAttribute('data-card-id');
                console.log('Delete clicked, cardId:', cardId);
                if (cardId) {
                    this.showDeleteModal(cardId);
                }
                e.stopPropagation();
            }
            
            // Удаление темы
            if (target.classList.contains('delete-theme-btn')) {
                const themeName = target.getAttribute('data-theme-name');
                const subjectName = target.getAttribute('data-subject-name');
                if (themeName && subjectName) {
                    this.showDeleteThemeModal(themeName, subjectName);
                }
                e.stopPropagation();
            }
            
            // Удаление предмета
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

    setupModalHandlers() {
        // Закрытие модальных окон при клике вне их
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

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEditModal();
                this.hideDeleteModal();
                this.hideDeleteThemeModal();
                this.hideDeleteSubjectModal();
            }
        });
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
        const subjectInput = document.getElementById('subjectInput');
        
        if (!textInput) return;
        
        const text = textInput.value.trim();
        let theme = themeInput ? themeInput.value.trim() : '';
        let subject = subjectInput ? subjectInput.value.trim() : '';
        
        if (!text) {
            alert('Введите текст для генерации карточек');
            return;
        }
        
        if (!subject) {
            alert('Введите название предмета');
            return;
        }
        
        if (!theme) {
            theme = this.findMainTopic(text);
            if (themeInput) themeInput.value = theme;
        }
        
        const newCards = this.intelligentCardGeneration(text, theme, subject);
        
        this.cards = [...this.cards, ...newCards];
        this.saveCards();
        this.displayGeneratedCards();
        
        alert(`Добавлено ${newCards.length} карточек по теме "${theme}"! Всего карточек: ${this.cards.length}`);
    }

    intelligentCardGeneration(text, theme, subject) {
        const newCards = [];
        
        // Разбиваем текст на смысловые блоки
        const meaningBlocks = this.extractMeaningBlocks(text);
        
        console.log('Найдены смысловые блоки:', meaningBlocks);
        
        // Создаем карточки для каждого смыслового блока
        meaningBlocks.forEach((block, index) => {
            const question = this.generateSmartQuestion(block, theme, index, meaningBlocks.length);
            const answer = block.content;
            
            if (answer.length > 20) { // Минимальная длина ответа
                newCards.push(new MemoryCard(question, answer, theme, subject));
            }
        });
        
        // Если не удалось выделить смысловые блоки, создаем одну общую карточку
        if (newCards.length === 0 && text.length > 50) {
            newCards.push(new MemoryCard(
                `Что такое ${theme}?`,
                text,
                theme,
                subject
            ));
        }
        
        return newCards;
    }

    extractMeaningBlocks(text) {
        const blocks = [];
        
        // Очищаем текст от лишних пробелов
        const cleanText = text.replace(/\n\s*\n/g, '\n').trim();
        
        // Разбиваем на абзацы
        const paragraphs = cleanText.split(/\n+/).filter(p => p.trim().length > 0);
        
        paragraphs.forEach(paragraph => {
            const trimmedPara = paragraph.trim();
            
            // Если абзац короткий, проверяем, не является ли он заголовком
            if (trimmedPara.length < 100 && this.looksLikeHeading(trimmedPara)) {
                blocks.push({
                    type: 'heading',
                    content: trimmedPara,
                    isImportant: true
                });
            } else {
                // Разбиваем длинные абзацы на предложения и группируем по смыслу
                const sentences = trimmedPara.split(/[.!?]+/).filter(s => s.trim().length > 10);
                
                if (sentences.length <= 2) {
                    // Короткий абзац - один блок
                    blocks.push({
                        type: 'paragraph',
                        content: trimmedPara,
                        isImportant: this.isImportantContent(trimmedPara)
                    });
                } else {
                    // Длинный абзац - разбиваем на смысловые группы
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
        
        // Объединяем очень короткие блоки
        return this.mergeShortBlocks(blocks);
    }

    looksLikeHeading(text) {
        const headingIndicators = [
            /^[А-Я][а-я]+\s*:/, // Слово с двоеточием
            /^[IVXLCDM]+\./, // Римские цифры
            /^\d+\./, // Арабские цифры
            /^[а-я]\)/, // Буква со скобкой
            /^[•\-*]\s/, // Маркеры списка
            /^[А-Я][^.!?]*$/, // Текст без точек в конце
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
            
            // Проверяем, начинается ли новое понятие
            const startsNewConcept = this.startsNewConcept(cleanSentence);
            
            if (startsNewConcept && currentGroup.length > 0) {
                groups.push([...currentGroup]);
                currentGroup = [cleanSentence];
            } else {
                currentGroup.push(cleanSentence);
            }
            
            // Если это последнее предложение, добавляем текущую группу
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
                // Заголовок всегда начинает новый блок
                if (currentBlock) {
                    merged.push(currentBlock);
                }
                currentBlock = block;
            } else if (currentBlock && currentBlock.content.length < 150) {
                // Объединяем с текущим блоком, если он короткий
                currentBlock.content += ' ' + block.content;
                currentBlock.isImportant = currentBlock.isImportant || block.isImportant;
            } else {
                // Начинаем новый блок
                if (currentBlock) {
                    merged.push(currentBlock);
                }
                currentBlock = block;
            }
        });
        
        // Добавляем последний блок
        if (currentBlock) {
            merged.push(currentBlock);
        }
        
        return merged.filter(block => block.content.length > 30); // Убираем очень короткие блоки
    }

    generateSmartQuestion(block, theme, index, totalBlocks) {
        const content = block.content.toLowerCase();
        
        // Вопросы для заголовков
        if (block.type === 'heading') {
            return `Что означает "${block.content}"?`;
        }
        
        // Вопросы по содержанию
        if (content.includes('определение') || content.includes('означает') || content.includes('это')) {
            return `Какое определение дается?`;
        }
        
        if (content.includes('функция') || content.includes('роль') || content.includes('значение')) {
            return `Какую функцию выполняет?`;
        }
        
        if (content.includes('свойство') || content.includes('характеристика') || content.includes('особенность')) {
            return `Какие свойства имеет?`;
        }
        
        if (content.includes('вид') || content.includes('тип') || content.includes('классификация')) {
            return `Какие виды существуют?`;
        }
        
        if (content.includes('пример') || content.includes('например')) {
            return `Приведите пример`;
        }
        
        if (content.includes('причина') || content.includes('влияние') || content.includes('зависит')) {
            return `Какие причины и следствия?`;
        }
        
        if (content.includes('отличие') || content.includes('различие') || content.includes('сходство')) {
            return `В чём отличие?`;
        }
        
        if (content.includes('состоит') || content.includes('включает') || content.includes('структура')) {
            return `Из чего состоит?`;
        }
        
        if (content.includes('процесс') || content.includes('этап') || content.includes('стадия')) {
            return `Как происходит процесс?`;
        }
        
        // Умные вопросы по контексту
        if (block.isImportant && index === 0) {
            return `В чём состоит основная идея?`;
        }
        
        if (block.isImportant) {
            const importantQuestions = [
                `Что важно знать?`,
                `Какой ключевой момент?`,
                `Какая основная мысль?`,
                `Что следует запомнить?`
            ];
            return importantQuestions[index % importantQuestions.length];
        }
        
        // Стандартные вопросы для остальных случаев
        const standardQuestions = [
            `Что описывается в этом фрагменте?`,
            `О чём идёт речь?`,
            `Какая информация содержится?`,
            `Что уточняется?`,
            `Какой аспект рассматривается?`
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

    createContextQuestion(sentence, mainTopic, index) {
        const lowerSentence = sentence.toLowerCase();
        
        // ИСПРАВЛЕНИЕ: Убираем тему из вопроса, оставляем только контекстные вопросы
        if (index === 0) {
            return `В чём состоит основная идея?`;
        }
        
        if (lowerSentence.includes('ограничен') || lowerSentence.includes('нет ограничен')) {
            return `Какие ограничения существуют?`;
        }
        
        if (lowerSentence.includes('верна') || lowerSentence.includes('справедлива') || 
            lowerSentence.includes('действует') || lowerSentence.includes('применима')) {
            return `Для каких случаев это применимо?`;
        }
        
        if (lowerSentence.includes('услов') || lowerSentence.includes('требован')) {
            return `Какие условия должны выполняться?`;
        }
        
        if (lowerSentence.includes('пример') || lowerSentence.includes('например')) {
            return `Приведите пример`;
        }
        
        if (lowerSentence.includes('значен') || lowerSentence.includes('важн')) {
            return `Какое значение имеет?`;
        }
        
        if (lowerSentence.includes('свойств') || lowerSentence.includes('особенност')) {
            return `Какие свойства имеет?`;
        }
        
        if (lowerSentence.includes('применен') || lowerSentence.includes('использ')) {
            return `Где применяется?`;
        }
        
        if (lowerSentence.includes('виды') || lowerSentence.includes('типы') || lowerSentence.includes('классификац')) {
            return `Какие виды существуют?`;
        }
        
        if (lowerSentence.includes('функц') || lowerSentence.includes('роль')) {
            return `Какую функцию выполняет?`;
        }
        
        const contextQuestions = [
            `Что ещё важно знать?`,
            `Какие дополнительные свойства?`,
            `Какие особенности?`,
            `Что уточняется?`,
            `Как работает?`,
            `В чём особенность?`,
            `Какие характеристики?`,
            `Что описывает это утверждение?`
        ];
        
        return contextQuestions[index % contextQuestions.length];
    }

    displayGeneratedCards() {
        const cardsList = document.getElementById('cardsList');
        const cardsContainer = document.getElementById('cardsContainer');
        
        if (!cardsList || !cardsContainer) return;
        
        cardsList.innerHTML = '';
        
        // Показываем все карточки текущей темы
        const currentSubject = document.getElementById('subjectInput').value.trim();
        const currentTheme = document.getElementById('themeInput').value.trim();
        
        const recentCards = this.cards.filter(card => 
            card.subject === currentSubject && card.theme === currentTheme
        );
        
        if (recentCards.length === 0) {
            // Если не нашли по теме, показываем последние 20 карточек
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

    // ДОБАВЛЕННЫЙ ВСПОМОГАТЕЛЬНЫЙ МЕТОД
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
                    ✏️ Редактировать
                </button>
                <button class="delete-btn" data-card-id="${card.id}">
                    🗑️ Удалить
                </button>
            </div>
        `;
        return cardElement;
    }

    showCatalog() {
        if (this.cards.length === 0) {
            alert('Нет созданных карточек. Сначала создайте карточки.');
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
                            🗑️
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
                                🗑️
                            </button>
                        </div>
                        <div class="theme-cards" id="theme-${this.encodeId(subject)}-${this.encodeId(theme)}">
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
        
        // Начинаем повторение с первой карточки текущей сессии
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

    // МЕТОДЫ РЕДАКТИРОВАНИЯ И УДАЛЕНИЯ КАРТОЧЕК
    showEditModal(cardId) {
        const card = this.cards.find(c => c.id == cardId);
        if (!card) {
            alert('Ошибка: карточка не найдена');
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
            alert('Ошибка: карточка не найдена');
            return;
        }
        
        const newSubject = document.getElementById('editSubject').value.trim();
        const newTheme = document.getElementById('editTheme').value.trim();
        const newQuestion = document.getElementById('editQuestion').value.trim();
        const newAnswer = document.getElementById('editAnswer').value.trim();
        
        if (!newQuestion || !newAnswer || !newSubject) {
            alert('Предмет, вопрос и ответ не могут быть пустыми!');
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
        
        const initialLength = this.cards.length;
        this.cards = this.cards.filter(c => c.id != this.deletingCardId);
        
        if (this.cards.length === initialLength) {
            alert('Ошибка при удалении карточки');
            return;
        }
        
        this.saveCards();
        this.hideDeleteModal();
        
        if (this.currentInterface === 'catalogInterface') {
            this.showCatalog();
        } else if (this.currentInterface === 'cardsContainer') {
            this.displayGeneratedCards();
        }
        
        alert('Карточка удалена! ✅');
    }

    // МЕТОДЫ УДАЛЕНИЯ ТЕМ И ПРЕДМЕТОВ
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
        
        alert(`Тема "${this.deletingThemeName}" и ${deletedCount} карточек удалены! ✅`);
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
        
        alert(`Предмет "${this.deletingSubjectName}" и ${deletedCount} карточек удалены! ✅`);
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
        try {
            localStorage.setItem('memoryCards', JSON.stringify(this.cards));
            console.log('Cards saved successfully, total:', this.cards.length);
        } catch (e) {
            console.error('Error saving cards:', e);
        }
    }

    loadCards() {
        try {
            const saved = localStorage.getItem('memoryCards');
            if (!saved) return [];
            
            const cardsData = JSON.parse(saved);
            const cards = cardsData.map(cardData => {
                return {
                    id: cardData.id || ('card_' + Date.now() + '_' + Math.floor(Math.random() * 1000000)),
                    question: cardData.question || '',
                    answer: cardData.answer || '',
                    theme: cardData.theme || '',
                    subject: cardData.subject || '',
                    lastReviewed: cardData.lastReviewed || null,
                    confidence: cardData.confidence || 3
                };
            });
            
            console.log('Cards loaded:', cards.length);
            return cards;
        } catch (e) {
            console.error('Error loading cards:', e);
            return [];
        }
    }
}

// Глобальная переменная для доступа к приложению
let memoryApp;

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    memoryApp = new MemoryApp();
    memoryApp.init();
    console.log('MemBrain app initialized');
});
