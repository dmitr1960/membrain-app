// manual.js - УНИВЕРСАЛЬНЫЙ КОД ДЛЯ ЛЮБЫХ ТЕМ

class MemoryCard {
    constructor(question, answer) {
        this.question = question;
        this.answer = answer;
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
    }

    init() {
        this.bindEvents();
        this.showMainInterface();
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
        if (!textInput) return;
        
        const text = textInput.value.trim();
        if (!text) {
            alert('Введите текст для генерации карточек');
            return;
        }
        
        this.cards = [];
        
        // Находим основную тему из текста
        const mainTopic = this.findMainTopic(text);
        
        // Разбиваем на предложения
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        if (sentences.length === 0) {
            // Одна карточка если мало текста
            this.cards.push(new MemoryCard(
                `Что такое ${mainTopic}?`,
                text
            ));
        } else {
            // Создаем осмысленные вопросы для каждого предложения
            sentences.forEach((sentence, index) => {
                const cleanSentence = sentence.trim();
                const question = this.createContextQuestion(cleanSentence, mainTopic, index);
                this.cards.push(new MemoryCard(question, cleanSentence));
            });
        }
        
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Сгенерировано ${this.cards.length} карточек!`);
    }

    // Находим основную тему текста - УНИВЕРСАЛЬНАЯ ВЕРСИЯ
    findMainTopic(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        // Ищем тему в первой строке
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            
            // Убираем служебные слова
            let cleanLine = firstLine
                .replace(/(формулировка|определение|понятие|теория|закон|принцип|правило|сущность|основа)\s+/gi, '')
                .replace(/[.:]/g, '')
                .trim();
            
            // Если после очистки остался осмысленный текст (2-6 слов)
            const wordCount = cleanLine.split(' ').length;
            if (wordCount >= 1 && wordCount <= 6 && cleanLine.length > 3) {
                return cleanLine;
            }
        }
        
        // Ищем в первом предложении
        const firstSentence = text.split(/[.!?]+/)[0];
        let cleanSentence = firstSentence
            .replace(/(формулировка|определение|понятие|теория)\s+/gi, '')
            .trim();
        
        const words = cleanSentence.split(' ');
        
        // Ищем слова с большой буквы (термины)
        for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[^a-яё]/gi, '');
            if (word.length > 4 && words[i][0] === words[i][0].toUpperCase()) {
                if (!this.isServiceWord(word.toLowerCase())) {
                    return word;
                }
            }
        }
        
        // Ищем самые длинные значимые слова
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
        
        // Последний вариант - первые два слова
        if (words.length >= 2) {
            return words.slice(0, 2).join(' ');
        }
        
        return 'основное понятие';
    }

    // Проверка служебных слов
    isServiceWord(word) {
        const serviceWords = [
            'формулировка', 'определение', 'понятие', 'теория', 'закон',
            'принцип', 'правило', 'теорема', 'аксиома', 'лемма', 
            'свойство', 'признак', 'явление', 'процесс', 'явление',
            'сущность', 'основа', 'смысл', 'значение', 'роль'
        ];
        return serviceWords.includes(word);
    }

    // Создаем осмысленные вопросы в контексте темы - УНИВЕРСАЛЬНАЯ ВЕРСИЯ
    createContextQuestion(sentence, mainTopic, index) {
        const lowerSentence = sentence.toLowerCase();
        
        // Определяем тип предложения и создаем соответствующий вопрос
        if (index === 0) {
            // Первое предложение - основное определение
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
        
        // Стандартные вопросы в контексте темы
        const contextQuestions = [
            `Что ещё важно знать о ${mainTopic}?`,
            `Какие дополнительные свойства имеет ${mainTopic}?`,
            `Какие особенности имеет ${mainTopic}?`,
            `Что уточняется в ${mainTopic}?`,
            `Как работает ${mainTopic}?`,
            `В чём особенность ${mainTopic}?`,
            `Какие характеристики у ${mainTopic}?`
        ];
        
        return contextQuestions[index % contextQuestions.length];
    }

    displayGeneratedCards() {
        const cardsList = document.getElementById('cardsList');
        const cardsContainer = document.getElementById('cardsContainer');
        
        if (!cardsList || !cardsContainer) return;
        
        cardsList.innerHTML = '';
        
        this.cards.forEach((card) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <div class="card-question">${card.question}</div>
                <div class="card-answer">${card.answer}</div>
            `;
            cardsList.appendChild(cardElement);
        });
        
        cardsContainer.style.display = 'block';
        document.getElementById('mainInterface').style.display = 'none';
    }

    startReview() {
        if (this.cards.length === 0) {
            alert('Нет карточек для повторения');
            return;
        }
        
        this.currentCardIndex = 0;
        this.showReviewInterface();
        this.showCard();
    }

    showReviewInterface() {
        document.getElementById('cardsContainer').style.display = 'none';
        document.getElementById('reviewInterface').style.display = 'block';
    }

    showMainInterface() {
        document.getElementById('mainInterface').style.display = 'block';
        document.getElementById('cardsContainer').style.display = 'none';
        document.getElementById('reviewInterface').style.display = 'none';
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
            this.showMainInterface();
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

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    new MemoryApp().init();
});
