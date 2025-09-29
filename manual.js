// ==================== БАЗОВАЯ РАБОЧАЯ ВЕРСИЯ ====================

class SmartFlashcard {
    constructor(question, answer) {
        this.id = Date.now() + Math.random();
        this.question = question;
        this.answer = answer;
        this.interval = 1;
        this.repetition = 0;
        this.easeFactor = 2.5;
        this.nextReview = new Date();
        this.lastScore = null;
        this.createdDate = new Date();
    }
    
    updateInterval(quality) {
        if (quality < 3) {
            this.interval = 1;
            this.repetition = 0;
        } else {
            if (this.repetition === 0) this.interval = 1;
            else if (this.repetition === 1) this.interval = 3;
            else this.interval = Math.round(this.interval * this.easeFactor);
            
            this.repetition++;
        }
        
        this.easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        this.easeFactor = Math.max(1.3, Math.min(this.easeFactor, 5.0));
        
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + this.interval);
        this.nextReview = nextDate;
        this.lastScore = quality;
    }
    
    needsReview() {
        return new Date() >= this.nextReview;
    }
}

// ПРОСТАЯ И РАБОТАЮЩАЯ ГЕНЕРАЦИЯ КАРТОЧЕК
function generateFlashcards(text) {
    // Проверка на пустой текст
    if (!text || text.trim().length < 10) {
        return [new SmartFlashcard(
            "Добавьте текст", 
            "Введите текст для изучения (минимум 10 символов)"
        )];
    }
    
    // Простое разбиение на предложения
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    const flashcards = [];
    
    // Создаем карточки из предложений
    sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (!trimmed || trimmed.split(' ').length < 3) return;
        
        // Берем первые 2-3 слова для вопроса
        const words = trimmed.split(' ').filter(word => word.length > 2);
        if (words.length < 2) return;
        
        const mainConcept = words.slice(0, 2).join(' ');
        const question = `Что такое ${mainConcept}?`;
        const answer = trimmed;
        
        flashcards.push(new SmartFlashcard(question, answer));
    });
    
    // Если карточек мало, создаем одну общую
    if (flashcards.length === 0) {
        const firstWords = text.split(' ').slice(0, 3).join(' ');
        flashcards.push(new SmartFlashcard(
            `Что такое ${firstWords}?`,
            text.substring(0, 100) + '...'
        ));
    }
    
    return flashcards.slice(0, 8);
}

// ==================== СИСТЕМА ПОВТОРЕНИЙ ====================

let currentCards = [];
let reviewCards = [];
let currentReviewIndex = 0;

// Генерация карточек
document.getElementById('generateBtn').addEventListener('click', function() {
    const text = document.getElementById('textInput').value.trim();
    
    if (text.length < 10) {
        alert('Пожалуйста, введите текст для изучения (минимум 10 символов)');
        return;
    }
    
    currentCards = generateFlashcards(text);
    displayCards(currentCards);
});

// Показ карточек
function displayCards(cards) {
    const cardsList = document.getElementById('cardsList');
    const cardsContainer = document.getElementById('cardsContainer');
    const mainInterface = document.getElementById('mainInterface');
    
    cardsList.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-question">${index + 1}. ${card.question}</div>
            <div class="card-answer">${card.answer}</div>
        `;
        cardsList.appendChild(cardElement);
    });
    
    mainInterface.style.display = 'none';
    cardsContainer.style.display = 'block';
}

// Система повторений
document.getElementById('startReviewBtn').addEventListener('click', function() {
    startReviewSession();
});

function startReviewSession() {
    reviewCards = [...currentCards];
    currentReviewIndex = 0;
    
    document.getElementById('cardsContainer').style.display = 'none';
    document.getElementById('reviewInterface').style.display = 'block';
    
    showNextCard();
}

function showNextCard() {
    if (currentReviewIndex >= reviewCards.length) {
        endReviewSession();
        return;
    }
    
    const card = reviewCards[currentReviewIndex];
    const progress = ((currentReviewIndex) / reviewCards.length) * 100;
    
    document.getElementById('questionCard').textContent = card.question;
    document.getElementById('answerCard').style.display = 'none';
    document.getElementById('answerCard').textContent = card.answer;
    
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('showAnswerBtn').style.display = 'block';
    document.getElementById('hardBtn').style.display = 'none';
    document.getElementById('goodBtn').style.display = 'none';
    document.getElementById('easyBtn').style.display = 'none';
}

document.getElementById('showAnswerBtn').addEventListener('click', function() {
    document.getElementById('answerCard').style.display = 'block';
    document.getElementById('showAnswerBtn').style.display = 'none';
    document.getElementById('hardBtn').style.display = 'inline-block';
    document.getElementById('goodBtn').style.display = 'inline-block';
    document.getElementById('easyBtn').style.display = 'inline-block';
});

// Кнопки оценки
function setupRatingButtons() {
    document.getElementById('hardBtn').addEventListener('click', function() {
        rateCard(2);
    });
    
    document.getElementById('goodBtn').addEventListener('click', function() {
        rateCard(3);
    });
    
    document.getElementById('easyBtn').addEventListener('click', function() {
        rateCard(4);
    });
}

function rateCard(rating) {
    const card = reviewCards[currentReviewIndex];
    card.updateInterval(rating);
    
    saveProgress();
    
    currentReviewIndex++;
    showNextCard();
}

function endReviewSession() {
    alert('Повторение завершено! 🎉\n\nСледующее повторение через день\n\nПрогресс сохранен.');
    
    document.getElementById('reviewInterface').style.display = 'none';
    document.getElementById('mainInterface').style.display = 'block';
    document.getElementById('textInput').value = '';
}

function saveProgress() {
    const progress = {
        cards: currentCards.map(card => ({
            id: card.id,
            interval: card.interval,
            repetition: card.repetition,
            easeFactor: card.easeFactor,
            nextReview: card.nextReview
        })),
        lastReview: new Date()
    };
    
    localStorage.setItem('membrainProgress', JSON.stringify(progress));
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupRatingButtons();
});
