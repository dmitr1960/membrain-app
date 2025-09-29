// manual.js - ПОЛНЫЙ ИСПРАВЛЕННЫЙ КОД

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
        
        const elements = {
            generateBtn: document.getElementById('generateBtn'),
            startReviewBtn: document.getElementById('startReviewBtn'),
            showAnswerBtn: document.getElementById('showAnswerBtn'),
            hardBtn: document.getElementById('hardBtn'),
            goodBtn: document.getElementById('goodBtn'),
            easyBtn: document.getElementById('easyBtn')
        };
        
        console.log('Найденные элементы:', elements);
        
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
        
        // УЛУЧШЕННОЕ разбиение на смысловые блоки
        const blocks = this.splitTextIntoBlocks(text);
        console.log('Найдено блоков:', blocks.length);
        
        if (blocks.length === 0) {
            alert('Не удалось извлечь информацию из текста.');
            return;
        }
        
        // Создаем карточки из каждого блока
        blocks.forEach(block => {
            const { question, answer } = this.generateCardFromBlock(block);
            
            if (question && answer) {
                this.cards.push(new MemoryCard(question, answer));
                console.log('Создана карточка:', { question, answer });
            }
        });
        
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Сгенерировано ${this.cards.length} карточек!`);
    }

    splitTextIntoBlocks(text) {
        // Сначала разбиваем на предложения
        const sentences = text.split(/[.!?]+/).filter(s => {
            const clean = s.trim();
            return clean.length > 10 && clean.split(' ').length > 2;
        });
        
        // Объединяем короткие связанные предложения
        const blocks = [];
        let currentBlock = '';
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            const words = sentence.split(' ');
            
            if (words.length <= 5 && i < sentences.length - 1) {
                // Короткое предложение - объединяем со следующим
                currentBlock += (currentBlock ? ' ' : '') + sentence;
            } else {
                // Длинное предложение или конец текста
                if (currentBlock) {
                    currentBlock += ' ' + sentence;
                    blocks.push(currentBlock);
                    currentBlock = '';
                } else {
                    blocks.push(sentence);
                }
            }
        }
        
        if (currentBlock) {
            blocks.push(currentBlock);
        }
        
        return blocks;
    }

    generateCardFromBlock(block) {
        let cleanBlock = block.trim();
        
        // Убираем "Что такое" если уже есть
        if (cleanBlock.toLowerCase().startsWith('что такое')) {
            cleanBlock = cleanBlock.substring(9).trim();
        }
        
        let question, answer;
        
        // ТИП 1: Определение "Термин - это объяснение"
        if (cleanBlock.includes(' - это ') || cleanBlock.includes(' – это ')) {
            const parts = cleanBlock.split(/ - это | – это /);
            if (parts.length >= 2) {
                const term = this.cleanTerm(parts[0]);
                question = `Что такое ${term}?`;
                answer = cleanBlock;
            }
        }
        // ТИП 2: Определение "Термин это объяснение" 
        else if (cleanBlock.includes(' это ')) {
            const parts = cleanBlock.split(' это ');
            if (parts.length >= 2) {
                const term = this.cleanTerm(parts[0]);
                question = `Что такое ${term}?`;
                answer = cleanBlock;
            }
        }
        // ТИП 3: Определение через тире "Термин - объяснение"
        else if (cleanBlock.match(/[а-яё]+\s*[-–]\s*[а-яё]/i)) {
            const parts = cleanBlock.split(/[-–]/);
            if (parts.length >= 2) {
                const term = this.cleanTerm(parts[0]);
                question = `Что такое ${term}?`;
                answer = cleanBlock;
            }
        }
        // ТИП 4: Нумерованный список "1. Термин: объяснение"
        else if (cleanBlock.match(/^\d+[\.\)]\s/)) {
            const termMatch = cleanBlock.match(/^\d+[\.\)]\s*(.+?)(?::|$)/);
            if (termMatch) {
                const term = this.cleanTerm(termMatch[1]);
                question = `Что такое ${term}?`;
                answer = cleanBlock;
            }
        }
        
        // ТИП 5: Обычное предложение - извлекаем главный термин
        if (!question) {
            const keyTerm = this.extractKeyTerm(cleanBlock);
            question = `Что такое ${keyTerm}?`;
            answer = cleanBlock;
        }
        
        // Убедимся, что ответ не слишком длинный
        if (answer.length > 400) {
            answer = answer.substring(0, 400) + '...';
        }
        
        return { question, answer };
    }

    cleanTerm(term) {
        return term.trim()
            .replace(/[.,:;!?]$/, '')
            .replace(/^(\d+[\.\)]\s*)/, '') // Убираем нумерацию
            .replace(/\s+/g, ' ');
    }

    extractKeyTerm(text) {
        const words = text.split(' ').filter(word => {
            const cleanWord = word.replace(/[.,!?;:]$/, '');
            return cleanWord.length > 2 && 
                   !['это', 'что', 'как', 'для', 'при', 'из', 'от', 'на', 'в', 'с', 'по', 'у'].includes(cleanWord.toLowerCase());
        });
        
        if (words.length === 0) return 'понятие';
        
        // Пробуем разные комбинации терминов
        const candidates = [
            words[0],
            words.slice(0, 2).join(' '),
            words.slice(0, 3).join(' ')
        ];
        
        // Выбираем самую подходящую комбинацию
        for (let candidate of candidates) {
            const cleanCandidate = this.cleanTerm(candidate);
            if (cleanCandidate.length >= 3 && cleanCandidate.length <= 30) {
                return cleanCandidate;
            }
        }
        
        return this.cleanTerm(words[0]);
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
