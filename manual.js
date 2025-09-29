// ==================== ПРОСТАЯ И РАБОЧАЯ AI-ГЕНЕРАЦИЯ ====================

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

// Простая и надежная генерация карточек
function generateFlashcards(text) {
    if (!text || text.trim().length < 10) {
        return [new SmartFlashcard(
            "Текст слишком короткий", 
            "Добавьте больше информации для генерации карточек (минимум 10 символов)"
        )];
    }
    
    console.log("Генерация карточек для текста:", text.substring(0, 100));
    
    // Простое разбиение на предложения
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    console.log("Найдено предложений:", sentences.length);
    
    const flashcards = [];
    
    sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (!trimmed || trimmed.length < 20) return;
        
        // Простая логика - первое существительное становится вопросом
        const words = trimmed.split(' ').filter(word => word.length > 3);
        if (words.length < 3) return;
        
        const mainConcept = words.slice(0, 3).join(' ').replace(/[.,;:]$/, '');
        const question = `Что такое ${mainConcept}?`;
        const answer = trimmed;
        
        flashcards.push(new SmartFlashcard(question, answer));
    });
    
    console.log("Сгенерировано карточек:", flashcards.length);
    
    // Если карточек мало, создаем одну общую
    if (flashcards.length === 0) {
        const firstSentence = text.split(/[.!?]+/)[0].substring(0, 100);
        const words = firstSentence.split(' ').filter(word => word.length > 3);
        const mainConcept = words.slice(0, 2).join(' ') || 'главная тема';
        
        flashcards.push(new SmartFlashcard(
            `Что такое ${mainConcept}?`,
            firstSentence + '...'
        ));
    }
    
    return flashcards.slice(0, 8);
}

// ==================== ИНТЕРФЕЙС И УПРАВЛЕНИЕ ====================

let currentCards = [];
let reviewCards = [];
let currentReviewIndex = 0;

document.getElementById('generateBtn').addEventListener('click', function() {
    const text = document.getElementById('textInput').value.trim();
    console.log("Нажата кнопка генерации, текст:", text);
    
    if (text.length < 10) {
        alert('Пожалуйста, введите текст для изучения (минимум 10 символов)');
        return;
    }
    
    currentCards = generateFlashcards(text);
    console.log("Карточки сгенерированы:", currentCards);
    displayCards(currentCards);
});

function displayCards(cards) {
    const cardsList = document.getElementById('cardsList');
    const cardsContainer = document.getElementById('cardsContainer');
    const mainInterface = document.getElementById('mainInterface');
    
    console.log("Отображение карточек:", cards.length);
    
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

// Остальной код оставляем без изменений...
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
    alert('Повторение завершено! 🎉\n\nСледующее повторение через: ' + 
          getNextReviewTime() + '\n\nПрогресс сохранен.');
    
    document.getElementById('reviewInterface').style.display = 'none';
    document.getElementById('mainInterface').style.display = 'block';
    document.getElementById('textInput').value = '';
}

function getNextReviewTime() {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1);
    return nextReview.toLocaleDateString('ru-RU');
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

function loadProgress() {
    const saved = localStorage.getItem('membrainProgress');
    if (saved) {
        console.log("Загружен прогресс:", JSON.parse(saved));
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log("MemBrain инициализирован");
    setupRatingButtons();
    loadProgress();
});
