// manual.js - ИСПРАВЛЕННАЯ ЛОГИКА ТЕРМИНОВ

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

    // ИСПРАВЛЕННОЕ ИЗВЛЕЧЕНИЕ ГЛАВНОГО ТЕРМИНА
    extractMainTerm(text) {
        // Убираем "Что такое" если уже есть
        let cleanText = text.replace(/^Что такое\s+/i, '').trim();
        
        // Ищем ОСНОВНОЙ ТЕРМИН в тексте
        const words = cleanText.split(' ');
        
        // СЛУЧАЙ 1: Если текст начинается с термина (например: "Формулировка теоремы Фалеса:")
        if (cleanText.match(/^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+/)) {
            // Берем первые 2-3 слова как термин
            const potentialTerm = words.slice(0, Math.min(3, words.length)).join(' ');
            if (potentialTerm.length > 5 && potentialTerm.length < 40) {
                return this.cleanTerm(potentialTerm);
            }
        }
        
        // СЛУЧАЙ 2: Ищем существительные в тексте (слова с большой буквы или длинные слова)
        const nouns = words.filter(word => {
            const cleanWord = word.replace(/[^a-яё]/gi, '');
            // Ищем слова с большой буквы ИЛИ длинные слова (>= 6 букв)
            return (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) ||
                   cleanWord.length >= 6;
        }).filter(word => !this.isStopWord(word.toLowerCase()));
        
        if (nouns.length > 0) {
            // Берем первое подходящее существительное
            return this.cleanTerm(nouns[0]);
        }
        
        // СЛУЧАЙ 3: Ищем самые длинные слова в тексте
        const longWords = words
            .map(word => ({ word, length: word.replace(/[^a-яё]/gi, '').length }))
            .filter(item => item.length >= 5 && !this.isStopWord(item.word.toLowerCase()))
            .sort((a, b) => b.length - a.length);
        
        if (longWords.length > 0) {
            return this.cleanTerm(longWords[0].word);
        }
        
        // СЛУЧАЙ 4: Берем первые 2 слова, исключая стоп-слова
        const meaningfulWords = words.filter(word => {
            const cleanWord = word.replace(/[^a-яё]/gi, '');
            return cleanWord.length > 3 && !this.isStopWord(cleanWord.toLowerCase());
        });
        
        if (meaningfulWords.length >= 2) {
            return this.cleanTerm(meaningfulWords.slice(0, 2).join(' '));
        }
        
        if (meaningfulWords.length === 1) {
            return this.cleanTerm(meaningfulWords[0]);
        }
        
        // СЛУЧАЙ 5: Если ничего не нашли, берем первые 2 слова
        if (words.length >= 2) {
            return this.cleanTerm(words.slice(0, 2).join(' '));
        }
        
        return words[0] ? this.cleanTerm(words[0]) : 'основное понятие';
    }

    // ОЧИСТКА ТЕРМИНА
    cleanTerm(term) {
        return term
            .replace(/^[^a-яё]*|[^a-яё]*$/gi, '')
            .replace(/[.,:;!?]$/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ОБНОВЛЕННЫЙ СПИСОК СТОП-СЛОВ
    isStopWord(word) {
        const stopWords = [
            'это', 'что', 'как', 'для', 'при', 'из', 'от', 'на', 'в', 'с', 'по', 'у',
            'о', 'за', 'до', 'не', 'но', 'или', 'и', 'да', 'нет', 'если', 'то',
            'так', 'же', 'бы', 'вот', 'там', 'тут', 'здесь', 'там', 'где', 'когда',
            'потому', 'поэтому', 'чтобы', 'который', 'какой', 'чей', 'сколько',
            'она', 'они', 'его', 'её', 'их', 'ему', 'ей', 'им', 
            'если', 'то', 'они', 'она', 'оно', 'они', 'его', 'её', 'их',
            'все', 'всё', 'весь', 'вся', 'всё', 'всех', 'всем', 'всеми',
            'кто', 'чего', 'чем', 'ком', 'чём', 'том', 'тем', 'та', 'те',
            'мой', 'твой', 'свой', 'наш', 'ваш', 'ихний',
            'формулировка', 'определение', 'понятие', 'теория', 'закон'
        ];
        return stopWords.includes(word);
    }

    // ВСЕ ОСТАЛЬНЫЕ МЕТОДЫ БЕЗ ИЗМЕНЕНИЙ
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
