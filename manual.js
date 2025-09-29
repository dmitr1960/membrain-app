// manual.js - ФИНАЛЬНЫЙ РАБОЧИЙ КОД

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
        
        // ПРЕОБРАЗОВАНИЕ ТЕКСТА В СТРУКТУРИРОВАННЫЕ БЛОКИ
        const blocks = this.parseStructuredText(text);
        
        if (blocks.length === 0) {
            alert('Не удалось извлечь информацию из текста.');
            return;
        }
        
        // СОЗДАЕМ КАЧЕСТВЕННЫЕ КАРТОЧКИ
        blocks.forEach(block => {
            if (block.term && block.definition) {
                const question = `Что такое ${block.term}?`;
                const answer = block.definition;
                this.cards.push(new MemoryCard(question, answer));
            }
        });
        
        this.saveCards();
        this.displayGeneratedCards();
        alert(`Сгенерировано ${this.cards.length} карточек!`);
    }

    // ПАРСИНГ СТРУКТУРИРОВАННОГО ТЕКСТА
    parseStructuredText(text) {
        const blocks = [];
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        let currentTerm = '';
        let currentDefinition = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Пропускаем пустые строки и служебные фразы
            if (!line || line.startsWith('Содержимое ответа') || line === 'Ответ:') {
                continue;
            }
            
            // Обрабатываем строки с определениями
            if (line.includes(' - это ') || line.includes(' — это ') || 
                line.includes(' это ') || line.match(/[а-яё]\s*[-—]\s*[а-яё]/i)) {
                
                // Сохраняем предыдущую карточку если есть
                if (currentTerm && currentDefinition) {
                    blocks.push({
                        term: currentTerm,
                        definition: currentDefinition
                    });
                }
                
                // Разбираем новую строку с определением
                const parsed = this.parseDefinitionLine(line);
                if (parsed.term && parsed.definition) {
                    currentTerm = parsed.term;
                    currentDefinition = parsed.definition;
                }
            }
            // Обрабатываем нумерованные пункты
            else if (line.match(/^\d+[\.\)]\s/)) {
                if (currentTerm && currentDefinition) {
                    blocks.push({
                        term: currentTerm,
                        definition: currentDefinition
                    });
                }
                
                const parsed = this.parseNumberedLine(line);
                if (parsed.term && parsed.definition) {
                    currentTerm = parsed.term;
                    currentDefinition = parsed.definition;
                }
            }
            // Обрабатываем примеры и дополнительные пояснения
            else if (line.startsWith('Например,') || line.startsWith('Если')) {
                // Добавляем к текущему определению
                if (currentDefinition) {
                    currentDefinition += ' ' + line;
                }
            }
            // Обычный текст - пробуем извлечь термин и определение
            else if (line.length > 20) {
                if (currentTerm && currentDefinition) {
                    blocks.push({
                        term: currentTerm,
                        definition: currentDefinition
                    });
                }
                
                const parsed = this.extractFromPlainText(line);
                if (parsed.term && parsed.definition) {
                    currentTerm = parsed.term;
                    currentDefinition = parsed.definition;
                } else {
                    // Если не нашли структуру, используем как есть
                    currentTerm = this.extractMainTerm(line);
                    currentDefinition = line;
                }
            }
        }
        
        // Добавляем последнюю карточку
        if (currentTerm && currentDefinition) {
            blocks.push({
                term: currentTerm,
                definition: currentDefinition
            });
        }
        
        return blocks;
    }

    // РАЗБОР СТРОКИ С ОПРЕДЕЛЕНИЕМ
    parseDefinitionLine(line) {
        let term = '';
        let definition = '';
        
        // Паттерн: "Термин - это определение"
        const pattern1 = line.match(/^(.+?)\s*[-—]\s*это\s*(.+)$/i);
        if (pattern1) {
            term = this.cleanTerm(pattern1[1]);
            definition = pattern1[2].trim();
            return { term, definition };
        }
        
        // Паттерн: "Термин это определение"
        const pattern2 = line.match(/^(.+?)\s+это\s+(.+)$/i);
        if (pattern2) {
            term = this.cleanTerm(pattern2[1]);
            definition = pattern2[2].trim();
            return { term, definition };
        }
        
        // Паттерн: "Термин - определение" (без "это")
        const pattern3 = line.match(/^(.+?)\s*[-—]\s*(.+)$/);
        if (pattern3) {
            term = this.cleanTerm(pattern3[1]);
            definition = pattern3[2].trim();
            return { term, definition };
        }
        
        return { term: '', definition: '' };
    }

    // РАЗБОР НУМЕРОВАННОЙ СТРОКИ
    parseNumberedLine(line) {
        // Убираем номер и точку
        const withoutNumber = line.replace(/^\d+[\.\)]\s*/, '').trim();
        
        // Пробуем найти термин и определение
        if (withoutNumber.includes(' - ') || withoutNumber.includes(' — ') || 
            withoutNumber.includes(' это ')) {
            return this.parseDefinitionLine(withoutNumber);
        }
        
        // Если структуры нет, берем первые слова как термин
        const words = withoutNumber.split(' ');
        if (words.length > 3) {
            const term = words.slice(0, 2).join(' ');
            const definition = withoutNumber;
            return { term: this.cleanTerm(term), definition };
        }
        
        return { term: this.cleanTerm(withoutNumber), definition: withoutNumber };
    }

    // ИЗВЛЕЧЕНИЕ ИЗ ОБЫЧНОГО ТЕКСТА
    extractFromPlainText(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        for (let sentence of sentences) {
            const parsed = this.parseDefinitionLine(sentence.trim());
            if (parsed.term && parsed.definition) {
                return parsed;
            }
        }
        
        return { term: '', definition: '' };
    }

    // ИЗВЛЕЧЕНИЕ ОСНОВНОГО ТЕРМИНА
    extractMainTerm(text) {
        const words = text.split(' ').filter(word => {
            const clean = word.replace(/[^a-яё]/gi, '');
            return clean.length > 3;
        });
        
        if (words.length >= 2) {
            return words.slice(0, 2).join(' ');
        }
        
        return words[0] || 'основное понятие';
    }

    // ОЧИСТКА ТЕРМИНА
    cleanTerm(term) {
        return term
            .replace(/^[^a-яё]*|[^a-яё]*$/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
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
