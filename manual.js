// manual.js - ПРОСТОЙ И РАБОЧИЙ КОД

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
        
        // ПРОСТОЙ ПАРСИНГ - РАЗБИВАЕМ НА ПРЕДЛОЖЕНИЯ И СОЗДАЕМ ЛОГИЧНЫЕ ВОПРОСЫ
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        if (sentences.length === 0) {
            alert('Не удалось извлечь предложения из текста');
            return;
        }
        
        // ДЛЯ ПЕРВОГО ПРЕДЛОЖЕНИЯ - ВОПРОС О ГЛАВНОМ ПОНЯТИИ
        if (sentences.length >= 1) {
            const firstSentence = sentences[0].trim();
            const mainConcept = this.findMainConcept(firstSentence);
            this.cards.push(new MemoryCard(
                `Что такое ${mainConcept}?`,
                firstSentence
            ));
        }
        
        // ДЛЯ ОСТАЛЬНЫХ ПРЕДЛОЖЕНИЙ - ВОПРОСЫ О ДЕТАЛЯХ
        for (let i = 1; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (sentence.length > 0) {
                const question = this.createDetailQuestion(sentence, i);
                this.cards.push(new MemoryCard(question, sentence));
            }
        }
        
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Сгенерировано ${this.cards.length} карточек!`);
    }

    // НАХОДИМ ГЛАВНОЕ ПОНЯТИЕ В ПЕРВОМ ПРЕДЛОЖЕНИИ
    findMainConcept(sentence) {
        // Ищем слова с большой буквы в начале предложения
        const words = sentence.split(' ');
        
        // Вариант 1: Первые 2-3 слова если они с большой буквы
        if (words.length >= 2 && words[0][0] === words[0][0].toUpperCase()) {
            if (words[1][0] === words[1][0].toUpperCase()) {
                return words.slice(0, 2).join(' ');
            }
            return words[0];
        }
        
        // Вариант 2: Ищем самое длинное слово
        const longWords = words.filter(word => word.length > 5)
                              .sort((a, b) => b.length - a.length);
        if (longWords.length > 0) {
            return longWords[0];
        }
        
        // Вариант 3: Первые 2 слова
        return words.slice(0, 2).join(' ');
    }

    // СОЗДАЕМ ВОПРОС ДЛЯ ДОПОЛНИТЕЛЬНЫХ ПРЕДЛОЖЕНИЙ
    createDetailQuestion(sentence, index) {
        const lowerSentence = sentence.toLowerCase();
        
        if (lowerSentence.includes('огранич') || lowerSentence.includes('услови')) {
            return 'Какие ограничения существуют?';
        }
        if (lowerSentence.includes('пример') || lowerSentence.includes('например')) {
            return 'Приведите пример применения';
        }
        if (lowerSentence.includes('значен') || lowerSentence.includes('важн')) {
            return 'Какое значение имеет это понятие?';
        }
        if (lowerSentence.includes('свойств') || lowerSentence.includes('особенност')) {
            return 'Какие свойства существуют?';
        }
        if (lowerSentence.includes('применен') || lowerSentence.includes('использ')) {
            return 'Где применяется?';
        }
        
        // Стандартные вопросы для дополнительных предложений
        const detailQuestions = [
            'Какие дополнительные особенности?',
            'Что ещё важно знать?',
            'Какие детали нужно учитывать?',
            'Что уточняется в теореме?',
            'Какие условия выполнения?'
        ];
        
        return detailQuestions[index % detailQuestions.length];
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
