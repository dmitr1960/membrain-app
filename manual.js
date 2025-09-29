// manual.js - УНИВЕРСАЛЬНЫЙ РАБОЧИЙ КОД

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
        
        // УНИВЕРСАЛЬНЫЙ ПАРСИНГ ЛЮБОГО ТЕКСТА
        const cards = this.parseUniversalText(text);
        
        if (cards.length === 0) {
            alert('Не удалось извлечь информацию из текста. Попробуйте более структурированный текст.');
            return;
        }
        
        this.cards = cards;
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Сгенерировано ${this.cards.length} карточек!`);
    }

    // УНИВЕРСАЛЬНЫЙ ПАРСИНГ ТЕКСТА
    parseUniversalText(text) {
        const cards = [];
        
        // Очищаем текст от мусора
        const cleanText = text
            .replace(/Содержимое ответа\s*/gi, '')
            .replace(/Ответ:\s*/gi, '')
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Разбиваем на предложения
        const sentences = cleanText.split(/[.!?]+/).filter(s => {
            const clean = s.trim();
            return clean.length > 10 && clean.split(' ').length > 3;
        });
        
        if (sentences.length === 0) {
            // Если не нашли предложений, создаем одну карточку из всего текста
            const mainTerm = this.extractMainTerm(cleanText);
            if (mainTerm && cleanText.length > 20) {
                cards.push(new MemoryCard(
                    `Что такое ${mainTerm}?`,
                    cleanText
                ));
            }
            return cards;
        }
        
        // Создаем карточки из предложений
        sentences.forEach(sentence => {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length > 0) {
                const mainTerm = this.extractMainTerm(cleanSentence);
                if (mainTerm) {
                    cards.push(new MemoryCard(
                        `Что такое ${mainTerm}?`,
                        cleanSentence
                    ));
                }
            }
        });
        
        return cards;
    }

    // ИЗВЛЕЧЕНИЕ ГЛАВНОГО ТЕРМИНА ИЗ ТЕКСТА
    extractMainTerm(text) {
        // Убираем "Что такое" если уже есть
        let cleanText = text.replace(/^Что такое\s+/i, '').trim();
        
        // Ищем термин в начале предложения (первые 2-4 слова)
        const words = cleanText.split(' ').filter(word => {
            const cleanWord = word.replace(/[^a-яё]/gi, '');
            return cleanWord.length > 2 && !this.isStopWord(cleanWord.toLowerCase());
        });
        
        if (words.length === 0) return null;
        
        // Пробуем разные комбинации
        const candidates = [];
        
        // Комбинация из 1 слова (если длинное)
        if (words[0].length >= 4) {
            candidates.push(words[0]);
        }
        
        // Комбинация из 2 слов
        if (words.length >= 2) {
            candidates.push(words.slice(0, 2).join(' '));
        }
        
        // Комбинация из 3 слов
        if (words.length >= 3) {
            candidates.push(words.slice(0, 3).join(' '));
        }
        
        // Выбираем самую подходящую комбинацию
        for (let candidate of candidates) {
            const cleanCandidate = this.cleanTerm(candidate);
            if (cleanCandidate.length >= 3 && cleanCandidate.length <= 35) {
                return cleanCandidate;
            }
        }
        
        return this.cleanTerm(words[0]);
    }

    // ОЧИСТКА ТЕРМИНА
    cleanTerm(term) {
        return term
            .replace(/^[^a-яё]*|[^a-яё]*$/gi, '')
            .replace(/[.,:;!?]$/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // СПИСОК СТОП-СЛОВ
    isStopWord(word) {
        const stopWords = [
            'это', 'что', 'как', 'для', 'при', 'из', 'от', 'на', 'в', 'с', 'по', 'у',
            'о', 'за', 'до', 'не', 'но', 'или', 'и', 'да', 'нет', 'если', 'то',
            'так', 'же', 'бы', 'вот', 'там', 'тут', 'здесь', 'там', 'где', 'когда',
            'потому', 'поэтому', 'чтобы', 'который', 'какой', 'чей', 'сколько',
            'она', 'они', 'его', 'её', 'их', 'ему', 'ей', 'им', 'теорема'
        ];
        return stopWords.includes(word);
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
