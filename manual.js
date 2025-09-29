// manual.js - ФИНАЛЬНЫЙ РАБОЧИЙ ВАРИАНТ

class MemoryCard {
    constructor(question, answer, category = 'general') {
        this.question = this.cleanQuestion(question);
        this.answer = answer;
        this.category = category;
        this.id = Date.now() + Math.random();
        this.lastReviewed = null;
        this.confidence = 0;
    }

    cleanQuestion(question) {
        // Убираем дублирование "Что такое"
        if (question.startsWith('Что такое Что такое')) {
            question = question.replace('Что такое Что такое', 'Что такое');
        }
        // Убедимся, что вопрос заканчивается знаком вопроса
        if (!question.endsWith('?')) {
            question = question + '?';
        }
        return question;
    }
}

class MemoryApp {
    constructor() {
        this.cards = this.loadCards();
        this.currentCardIndex = 0;
        this.isAnswerShown = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showCard();
        this.updateStats();
    }

    bindEvents() {
        document.getElementById('showAnswerBtn').addEventListener('click', () => this.showAnswer());
        document.getElementById('nextCardBtn').addEventListener('click', () => this.nextCard());
        document.getElementById('addCardBtn').addEventListener('click', () => this.showAddCardForm());
        document.getElementById('saveCardBtn').addEventListener('click', () => this.saveCard());
        document.getElementById('cancelCardBtn').addEventListener('click', () => this.hideAddCardForm());
        document.getElementById('generateCardBtn').addEventListener('click', () => this.generateCard());
        document.getElementById('saveGeneratedCardBtn').addEventListener('click', () => this.saveGeneratedCard());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCards());
        document.getElementById('importBtn').addEventListener('click', () => this.importCards());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileImport(e));
    }

    // ФИКСИРОВАННАЯ ГЕНЕРАЦИЯ ПОЛНЫХ И КОРРЕКТНЫХ ВОПРОСОВ
    generateQuestion(text) {
        // Находим первое законченное предложение
        const sentenceMatch = text.match(/[^.!?]*[.!?]/);
        if (!sentenceMatch) {
            // Если нет точек, берем первые 7 слов
            const words = text.split(' ').filter(w => w.trim().length > 0);
            if (words.length === 0) return null;
            
            const term = words.slice(0, Math.min(4, words.length)).join(' ');
            return `Что такое ${term}?`;
        }
        
        let sentence = sentenceMatch[0].trim();
        
        // Убираем лишние пробелы и знаки препинания
        sentence = sentence.replace(/\s+/g, ' ').replace(/[.,;:]$/, '');
        
        // Определяем тип предложения и генерируем соответствующий вопрос
        if (sentence.includes(' это ') || sentence.includes(' - ') || sentence.includes(' – ')) {
            // Для определительных предложений
            const parts = sentence.split(/ это | - | – /);
            if (parts.length >= 2 && parts[0].trim().length > 2) {
                const term = parts[0].trim();
                return `Что такое ${term}?`;
            }
        }
        
        // Для простых утвердительных предложений
        const words = sentence.split(' ').filter(w => w.trim().length > 0);
        if (words.length <= 5) {
            // Короткое предложение - используем целиком
            return `Что такое ${sentence}?`;
        } else {
            // Длинное предложение - берем ключевые слова
            const keyWords = this.extractKeyWords(sentence);
            return `Что такое ${keyWords}?`;
        }
    }

    extractKeyWords(sentence) {
        const words = sentence.split(' ');
        const stopWords = ['и', 'в', 'на', 'с', 'по', 'для', 'о', 'от', 'до', 'из', 'у', 'без', 'под', 'над', 'при', 'после'];
        
        // Фильтруем стоп-слова и берем значимые слова
        const meaningfulWords = words.filter(word => {
            const cleanWord = word.toLowerCase().replace(/[.,!?;:]$/, '');
            return cleanWord.length > 2 && !stopWords.includes(cleanWord);
        });
        
        // Берем 2-4 самых значимых слова
        const keyWords = meaningfulWords.slice(0, 4);
        
        return keyWords.length > 0 ? keyWords.join(' ') : words.slice(0, 3).join(' ');
    }

    generateAnswer(text) {
        // Находим все предложения
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
        
        if (sentences.length === 0) {
            return text.length > 200 ? text.substring(0, 200) + '...' : text;
        }
        
        // Берем первое предложение как основной ответ
        let answer = sentences[0].trim();
        
        // Добавляем второе предложение если есть и если нужно
        if (sentences.length > 1 && answer.length < 100) {
            answer += '. ' + sentences[1].trim();
        }
        
        // Убедимся, что ответ не слишком длинный
        if (answer.length > 300) {
            answer = answer.substring(0, 300) + '...';
        }
        
        // Добавляем точку в конце если нет
        if (!answer.endsWith('.') && !answer.endsWith('...')) {
            answer += '.';
        }
        
        return answer;
    }

    async generateCard() {
        const textInput = document.getElementById('textInput').value.trim();
        if (!textInput) {
            alert('Введите текст для генерации карточки');
            return;
        }

        try {
            const question = this.generateQuestion(textInput);
            const answer = this.generateAnswer(textInput);

            if (!question || !answer) {
                throw new Error('Не удалось сгенерировать карточку из данного текста');
            }

            // Показываем превью
            document.getElementById('generatedQuestion').value = question;
            document.getElementById('generatedAnswer').value = answer;
            document.getElementById('cardPreview').style.display = 'block';

        } catch (error) {
            alert('Ошибка генерации: ' + error.message);
        }
    }

    saveGeneratedCard() {
        const question = document.getElementById('generatedQuestion').value;
        const answer = document.getElementById('generatedAnswer').value;

        if (!question || !answer) {
            alert('Заполните вопрос и ответ');
            return;
        }

        const card = new MemoryCard(question, answer);
        this.cards.push(card);
        this.saveCards();
        this.hideAddCardForm();
        this.showCard(this.cards.length - 1);
        this.updateStats();

        // Сбрасываем форму
        document.getElementById('textInput').value = '';
        document.getElementById('generatedQuestion').value = '';
        document.getElementById('generatedAnswer').value = '';
        document.getElementById('cardPreview').style.display = 'none';
        
        alert('Карточка успешно сохранена!');
    }

    showCard(index = null) {
        if (this.cards.length === 0) {
            this.showEmptyState();
            return;
        }

        if (index !== null) {
            this.currentCardIndex = index;
        }

        const card = this.cards[this.currentCardIndex];
        document.getElementById('question').textContent = card.question;
        document.getElementById('answer').textContent = '';
        document.getElementById('answer').style.display = 'none';
        document.getElementById('showAnswerBtn').style.display = 'block';
        this.isAnswerShown = false;

        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('cardContainer').style.display = 'block';
        this.updateProgress();
    }

    showAnswer() {
        if (this.cards.length === 0) return;

        const card = this.cards[this.currentCardIndex];
        document.getElementById('answer').textContent = card.answer;
        document.getElementById('answer').style.display = 'block';
        document.getElementById('showAnswerBtn').style.display = 'none';
        this.isAnswerShown = true;

        // Обновляем дату последнего просмотра
        card.lastReviewed = new Date().toISOString();
        this.saveCards();
    }

    nextCard() {
        if (this.cards.length === 0) return;

        if (this.isAnswerShown) {
            const confidence = document.querySelector('input[name="confidence"]:checked');
            if (confidence) {
                this.cards[this.currentCardIndex].confidence = parseInt(confidence.value);
                document.querySelector('input[name="confidence"]:checked').checked = false;
            }
        }

        this.currentCardIndex = (this.currentCardIndex + 1) % this.cards.length;
        this.showCard();
    }

    showAddCardForm() {
        document.getElementById('addCardModal').style.display = 'block';
        document.getElementById('textInput').focus();
    }

    hideAddCardForm() {
        document.getElementById('addCardModal').style.display = 'none';
        document.getElementById('manualQuestion').value = '';
        document.getElementById('manualAnswer').value = '';
        document.getElementById('textInput').value = '';
        document.getElementById('cardPreview').style.display = 'none';
    }

    saveCard() {
        const question = document.getElementById('manualQuestion').value.trim();
        const answer = document.getElementById('manualAnswer').value.trim();

        if (!question || !answer) {
            alert('Заполните вопрос и ответ');
            return;
        }

        const card = new MemoryCard(question, answer);
        this.cards.push(card);
        this.saveCards();
        this.hideAddCardForm();
        this.showCard(this.cards.length - 1);
        this.updateStats();
        
        alert('Карточка успешно сохранена!');
    }

    updateStats() {
        document.getElementById('totalCards').textContent = this.cards.length;
        
        const reviewedToday = this.cards.filter(card => {
            if (!card.lastReviewed) return false;
            const lastReviewed = new Date(card.lastReviewed);
            const today = new Date();
            return lastReviewed.toDateString() === today.toDateString();
        }).length;

        document.getElementById('reviewedToday').textContent = reviewedToday;
    }

    updateProgress() {
        if (this.cards.length === 0) {
            document.getElementById('progress').textContent = '0/0';
            return;
        }
        document.getElementById('progress').textContent = 
            `${this.currentCardIndex + 1}/${this.cards.length}`;
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('cardContainer').style.display = 'none';
    }

    saveCards() {
        localStorage.setItem('memoryCards', JSON.stringify(this.cards));
    }

    loadCards() {
        const saved = localStorage.getItem('memoryCards');
        return saved ? JSON.parse(saved) : [];
    }

    exportCards() {
        if (this.cards.length === 0) {
            alert('Нет карточек для экспорта');
            return;
        }

        const data = JSON.stringify(this.cards, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'memory-cards.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importCards() {
        document.getElementById('fileInput').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedCards = JSON.parse(e.target.result);
                if (Array.isArray(importedCards)) {
                    this.cards = [...this.cards, ...importedCards];
                    this.saveCards();
                    this.showCard();
                    this.updateStats();
                    alert(`Успешно импортировано ${importedCards.length} карточек`);
                } else {
                    alert('Неверный формат файла');
                }
            } catch (error) {
                alert('Ошибка при импорте файла: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new MemoryApp();
});
