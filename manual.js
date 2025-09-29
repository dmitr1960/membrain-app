// ==================== MEMBRAIN - AI ТРЕНЕР ПАМЯТИ ====================

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

// УМНАЯ ГЕНЕРАЦИЯ КАРТОЧЕК
function generateFlashcards(text) {
    if (!text || text.trim().length < 10) {
        return [new SmartFlashcard(
            "Добавьте текст для изучения", 
            "Введите текст длиной от 10 символов для генерации карточек"
        )];
    }
    
    // Очистка текста от мусора
    const cleanedText = text
        .replace(/\d+\.\s*/g, '') // Удаляем "1. ", "2. "
        .replace(/Содержимое ответа/g, '') // Удаляем мусор
        .replace(/\n/g, '. ') // Заменяем переносы
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim();
    
    // Разбиваем на предложения
    const sentences = cleanedText.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 20 && trimmed.split(' ').length >= 4;
    });
    
    const flashcards = [];
    
    // Создаем карточки
    sentences.forEach((sentence) => {
        const trimmed = sentence.trim();
        if (!trimmed) return;
        
        // Очищаем предложение
        const cleanSentence = trimmed.replace(/^\d+\s*/, '').trim();
        if (cleanSentence.length < 15) return;
        
        // Извлекаем ключевые слова
        const words = cleanSentence.split(' ').filter(word => 
            word.length > 3 && 
            !['это', 'также', 'которые', 'который', 'например', 'процесс'].includes(word.toLowerCase())
        );
        
        let mainConcept;
        if (words.length >= 2) {
            mainConcept = words.slice(0, 2).join(' ');
        } else {
            // Резервный вариант
            const allWords = cleanSentence.split(' ').filter(word => word.length > 2);
            mainConcept = allWords.slice(1, 3).join(' ') || allWords.slice(0, 2).join(' ');
        }
        
        if (!mainConcept || mainConcept.split(' ').length < 2) return;
        
        // Создаем вопрос в зависимости от содержания
        let question;
        const lowerSentence = cleanSentence.toLowerCase();
        
        if (lowerSentence.includes('это') || lowerSentence.includes('означает')) {
            question = `Дайте определение: ${mainConcept}`;
        } else if (lowerSentence.includes('например') || lowerSentence.includes('пример')) {
            question = `Приведите пример: ${mainConcept}`;
        } else if (lowerSentence.includes('функция') || lowerSentence.includes('назначение')) {
            question = `Какие функции у ${mainConcept}?`;
        } else {
            question = `Объясните: ${mainConcept}`;
        }
        
        const answer = cleanSentence;
        
        flashcards.push(new SmartFlashcard(question, answer));
    });
    
    // Гарантируем хотя бы 2 карточки
    if (flashcards.length < 2) {
        const firstWords = cleanedText.split(' ').filter(word => word.length > 3).slice(0, 2).join(' ');
        flashcards.push(
            new SmartFlashcard(
                `Основная тема: ${firstWords || 'текста'}`,
                cleanedText.substring(0, 120) + (cleanedText.length > 120 ? '...' : '')
            )
        );
    }
    
    return flashcards.slice(0, 8);
}

// ==================== СИСТЕМА ИНТЕРФЕЙСА ====================

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

// Показ сгенерированных карточек
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

// Начало повторения
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

// Показ следующей карточки
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

// Показ ответа
document.getElementById('showAnswerBtn').addEventListener('click', function() {
    document.getElementById('answerCard').style.display = 'block';
    document.getElementById('showAnswerBtn').style.display = 'none';
    document.getElementById('hardBtn').style.display = 'inline-block';
    document.getElementById('goodBtn').style.display = 'inline-block';
    document.getElementById('easyBtn').style.display = 'inline-block';
});

// Настройка кнопок оценки
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

// Оценка карточки
function rateCard(rating) {
    const card = reviewCards[currentReviewIndex];
    card.updateInterval(rating);
    
    saveProgress();
    
    currentReviewIndex++;
    showNextCard();
}

// Завершение сессии
function endReviewSession() {
    alert('Повторение завершено! 🎉\n\nСледующее повторение через день\n\nПрогресс сохранен.');
    
    document.getElementById('reviewInterface').style.display = 'none';
    document.getElementById('mainInterface').style.display = 'block';
    document.getElementById('textInput').value = '';
}

// Сохранение прогресса
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

// Загрузка прогресса
function loadProgress() {
    const saved = localStorage.getItem('membrainProgress');
    if (saved) {
        try {
            const progress = JSON.parse(saved);
            console.log('Загружен прогресс:', progress);
        } catch (e) {
            console.log('Ошибка загрузки прогресса:', e);
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('MemBrain инициализирован');
    setupRatingButtons();
    loadProgress();
});
