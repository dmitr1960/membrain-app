// manual.js - ИСПРАВЛЕННЫЙ РАБОЧИЙ КОД

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
        console.log('MemBrain инициализирован');
        this.bindEvents();
        this.showMainInterface();
    }

    bindEvents() {
        console.log('Привязка событий...');
        
        // Проверяем существование элементов перед привязкой
        const elements = {
            generateBtn: document.getElementById('generateBtn'),
            startReviewBtn: document.getElementById('startReviewBtn'),
            showAnswerBtn: document.getElementById('showAnswerBtn'),
            hardBtn: document.getElementById('hardBtn'),
            goodBtn: document.getElementById('goodBtn'),
            easyBtn: document.getElementById('easyBtn')
        };
        
        console.log('Найденные элементы:', elements);
        
        // Привязываем события только если элементы существуют
        if (elements.generateBtn) {
            elements.generateBtn.addEventListener('click', () => this.generateCards());
            console.log('Кнопка generateBtn привязана');
        } else {
            console.error('Кнопка generateBtn не найдена!');
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
        console.log('Генерация карточек...');
        
        const textInput = document.getElementById('textInput');
        if (!textInput) {
            alert('Поле ввода не найдено!');
            return;
        }
        
        const text = textInput.value.trim();
        console.log('Введенный текст:', text);
        
        if (!text) {
            alert('Введите текст для генерации карточек');
            return;
        }
        
        this.cards = [];
        
        // Разбиваем текст на предложения
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        console.log('Найдено предложений:', sentences.length);
        
        if (sentences.length === 0) {
            alert('Не удалось извлечь предложения из текста');
            return;
        }
        
        // Создаем карточки из каждого предложения
        sentences.forEach(sentence => {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length > 0) {
                const question = this.generateQuestion(cleanSentence);
                const answer = cleanSentence;
                
                if (question && answer) {
                    this.cards.push(new MemoryCard(question, answer));
                }
            }
        });
        
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Сгенерировано ${this.cards.length} карточек!`);
    }

    generateQuestion(sentence) {
        let cleanSentence = sentence.trim();
        
        // Убираем "Что такое" если уже есть в предложении
        if (cleanSentence.toLowerCase().startsWith('что такое')) {
            cleanSentence = cleanSentence.substring(9).trim();
        }
        
        // Находим термин для вопроса
        let term;
        const words = cleanSentence.split(' ').filter(word => word.length > 0);
        
        if (words.length <= 3) {
            term = cleanSentence;
        } else if (cleanSentence.includes(' это ') || cleanSentence.includes(' - ') || cleanSentence.includes(' – ')) {
            const parts = cleanSentence.split(/ это | - | – /);
            term = parts[0].trim();
        } else {
            term = words.slice(0, Math.min(3, words.length)).join(' ');
        }
        
        // Убираем знаки препинания в конце
        term = term.replace(/[.,!?;:]$/, '');
        
        return `Что такое ${term}?`;
    }

    displayGeneratedCards() {
        const cardsList = document.getElementById('cardsList');
        const cardsContainer = document.getElementById('cardsContainer');
        
        if (!cardsList || !cardsContainer) {
            console.error('Элементы cardsList или cardsContainer не найдены!');
            return;
        }
        
        cardsList.innerHTML = '';
        
        this.cards.forEach((card, index) => {
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

// Запуск приложения после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM полностью загружен, запуск приложения...');
    const app = new MemoryApp();
    app.init();
});
