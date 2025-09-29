// manual.js - ПРОСТОЙ РАБОЧИЙ ВАРИАНТ

class MemoryCard {
    constructor(question, answer, category = 'general') {
        this.question = question;
        this.answer = answer;
        this.category = category;
        this.id = Date.now() + Math.random();
        this.lastReviewed = null;
        this.confidence = 0;
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
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCards());
        document.getElementById('importBtn').addEventListener('click', () => this.importCards());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileImport(e));
    }

    // ПРОСТАЯ ГЕНЕРАЦИЯ КАРТОЧЕК
    generateCard() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();
        
        if (!text) {
            alert('Введите текст для генерации карточки');
            return;
        }
        
        // Простая логика: первое слово = вопрос, весь текст = ответ
        const words = text.split(' ');
        const firstWord = words[0];
        const question = `Что такое ${firstWord}?`;
        const answer = text;
        
        // Сразу создаем карточку
        const card = new MemoryCard(question, answer);
        this.cards.push(card);
        this.saveCards();
        this.hideAddCardForm();
        this.showCard(this.cards.length - 1);
        this.updateStats();
        
        alert('Карточка успешно создана!');
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
    }

    hideAddCardForm() {
        document.getElementById('addCardModal').style.display = 'none';
        document.getElementById('manualQuestion').value = '';
        document.getElementById('manualAnswer').value = '';
        document.getElementById('textInput').value = '';
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
                alert('Ошибка при импорте файла');
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
