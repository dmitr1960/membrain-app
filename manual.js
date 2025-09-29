// manual.js - ФИНАЛЬНЫЙ ИСПРАВЛЕННЫЙ КОД

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
        
        // ОЧИСТКА ТЕКСТА ОТ МУСОРА
        const cleanText = this.cleanInputText(text);
        const blocks = this.splitTextIntoBlocks(cleanText);
        
        if (blocks.length === 0) {
            alert('Не удалось извлечь информацию из текста.');
            return;
        }
        
        // СОЗДАЕМ КАРТОЧКИ ИЗ КАЖДОГО БЛОКА
        blocks.forEach(block => {
            const { question, answer } = this.generateCardFromBlock(block);
            if (question && answer) {
                this.cards.push(new MemoryCard(question, answer));
            }
        });
        
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Сгенерировано ${this.cards.length} карточек!`);
    }

    // ОЧИСТКА ВХОДНОГО ТЕКСТА ОТ МУСОРА
    cleanInputText(text) {
        return text
            .replace(/Содержимое ответа\s*/gi, '') // Убираем "Содержимое ответа"
            .replace(/Ответ:\s*/gi, '') // Убираем "Ответ:"
            .replace(/Вопрос:\s*/gi, '') // Убираем "Вопрос:"
            .replace(/\d+\.\s*(?=\d+\.)/g, '\n') // Разбиваем нумерованные списки
            .replace(/\n+/g, '. ') // Заменяем переносы на точки
            .replace(/\s+/g, ' ') // Убираем лишние пробелы
            .trim();
    }

    // РАЗБИЕНИЕ НА СМЫСЛОВЫЕ БЛОКИ
    splitTextIntoBlocks(text) {
        // Сначала разбиваем по точкам, воскл. и вопр. знакам
        let sentences = text.split(/[.!?]+/).filter(s => {
            const clean = s.trim();
            return clean.length > 20; // Только значимые предложения
        });
        
        // Объединяем очень короткие предложения
        const blocks = [];
        let currentBlock = '';
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            const words = sentence.split(' ').length;
            
            if (words < 8 && i < sentences.length - 1) {
                // Короткое предложение - объединяем со следующим
                currentBlock += (currentBlock ? ' ' : '') + sentence + '.';
            } else {
                if (currentBlock) {
                    blocks.push(currentBlock + ' ' + sentence);
                    currentBlock = '';
                } else {
                    blocks.push(sentence);
                }
            }
        }
        
        return blocks.filter(block => block.trim().length > 0);
    }

    // ГЕНЕРАЦИЯ КАРТОЧКИ ИЗ БЛОКА
    generateCardFromBlock(block) {
        const cleanBlock = block.trim();
        
        // ПОИСК ОСНОВНОГО ТЕРМИНА И ОПРЕДЕЛЕНИЯ
        let mainTerm = '';
        let definition = '';
        
        // Паттерн 1: "Термин - это определение"
        const pattern1 = cleanBlock.match(/^(.+?)\s*[-–]\s*это\s*(.+)$/i);
        if (pattern1) {
            mainTerm = this.cleanTerm(pattern1[1]);
            definition = pattern1[2];
        }
        
        // Паттерн 2: "Термин это определение" 
        const pattern2 = cleanBlock.match(/^(.+?)\s+это\s+(.+)$/i);
        if (pattern2 && !mainTerm) {
            mainTerm = this.cleanTerm(pattern2[1]);
            definition = pattern2[2];
        }
        
        // Паттерн 3: "Термин - определение" (без "это")
        const pattern3 = cleanBlock.match(/^(.+?)\s*[-–]\s*(.+)$/);
        if (pattern3 && !mainTerm) {
            mainTerm = this.cleanTerm(pattern3[1]);
            definition = pattern3[2];
        }
        
        // Паттерн 4: "Термин: определение"
        const pattern4 = cleanBlock.match(/^(.+?):\s*(.+)$/);
        if (pattern4 && !mainTerm) {
            mainTerm = this.cleanTerm(pattern4[1]);
            definition = pattern4[2];
        }
        
        // Если нашли структуру "термин - определение"
        if (mainTerm && definition) {
            return {
                question: `Что такое ${mainTerm}?`,
                answer: `${mainTerm} - это ${definition}`
            };
        }
        
        // ЕСЛИ НЕ НАШЛИ СТРУКТУРУ - ИЗВЛЕКАЕМ КЛЮЧЕВОЙ ТЕРМИН
        const keyTerm = this.extractKeyTerm(cleanBlock);
        return {
            question: `Что такое ${keyTerm}?`,
            answer: cleanBlock
        };
    }

    // ОЧИСТКА ТЕРМИНА
    cleanTerm(term) {
        return term
            .replace(/^[^a-яё]*|[^a-яё]*$/gi, '') // Убираем не-буквы в начале/конце
            .replace(/\d+[\.\)]\s*/, '') // Убираем нумерацию "1." "23)"
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ИЗВЛЕЧЕНИЕ КЛЮЧЕВОГО ТЕРМИНА ИЗ ТЕКСТА
    extractKeyTerm(text) {
        const words = text.split(' ')
            .filter(word => {
                const clean = word.replace(/[^a-яё]/gi, '');
                return clean.length > 3 && 
                       !this.isStopWord(clean.toLowerCase());
            });
        
        if (words.length === 0) return 'основное понятие';
        
        // Ищем самые информативные слова (первые не-стоп слова)
        const informativeWords = [];
        const allWords = text.split(' ');
        
        for (let word of allWords) {
            const clean = this.cleanTerm(word);
            if (clean.length > 3 && !this.isStopWord(clean.toLowerCase())) {
                informativeWords.push(clean);
                if (informativeWords.length >= 2) break;
            }
        }
        
        return informativeWords.length > 0 ? informativeWords.join(' ') : words[0];
    }

    // СПИСОК СТОП-СЛОВ
    isStopWord(word) {
        const stopWords = [
            'это', 'что', 'как', 'для', 'при', 'из', 'от', 'на', 'в', 'с', 'по', 'у',
            'о', 'за', 'до', 'не', 'но', 'или', 'и', 'да', 'нет', 'если', 'то',
            'так', 'же', 'бы', 'вот', 'там', 'тут', 'здесь', 'там', 'где', 'когда',
            'потому', 'поэтому', 'чтобы', 'который', 'какой', 'чей', 'сколько'
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
