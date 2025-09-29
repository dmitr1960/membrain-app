// ==================== AI ГЕНЕРАЦИЯ КАРТОЧЕК ====================

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

// Улучшенная AI-генерация карточек
function generateFlashcards(text) {
    if (!text || text.trim().length < 10) {
        return [new SmartFlashcard(
            "Текст слишком короткий", 
            "Добавьте больше информации для генерации карточек (минимум 10 символов)"
        )];
    }
    
    const cleanedText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = cleanedText.split(/(?<!\d)\.(?!\d)/).filter(s => s.trim().length > 10);
    
    const flashcards = [];
    
    sentences.forEach((sentence, index) => {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence || trimmedSentence.split(' ').length < 3) return;
        
        const { question, answer } = generateQuestionAnswer(trimmedSentence, index);
        
        if (question && answer) {
            flashcards.push(new SmartFlashcard(question, answer));
        }
    });
    
    if (flashcards.length < 2) {
        return generateBackupFlashcards(cleanedText);
    }
    
    return flashcards.slice(0, 10);
}

function generateQuestionAnswer(sentence, index) {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('это') || lowerSentence.includes('означает') || 
        lowerSentence.includes('называется') || index === 0) {
        const concept = extractMainConcept(sentence);
        return {
            question: `Что такое ${concept}?`,
            answer: sentence
        };
    }
    
    if (lowerSentence.includes('стадии') || lowerSentence.includes('этапы') || 
        lowerSentence.includes('процесс') || lowerSentence.includes('включает')) {
        return {
            question: `Какие ${extractProcessType(sentence)}?`,
            answer: sentence
        };
    }
    
    if (lowerSentence.includes('происходит') || lowerSentence.includes('находится') || 
        lowerSentence.includes('в ') || lowerSentence.includes('на ')) {
        const concept = extractMainConcept(sentence);
        return {
            question: `Где ${concept}?`,
            answer: sentence
        };
    }
    
    if (lowerSentence.includes('функции') || lowerSentence.includes('назначение') || 
        lowerSentence.includes('служит') || lowerSentence.includes('участие')) {
        const concept = extractMainConcept(sentence);
        return {
            question: `Какие функции выполняет ${concept}?`,
            answer: sentence
        };
    }
    
    return generateDefaultQA(sentence);
}

function extractMainConcept(sentence) {
    const cleaned = sentence.replace(/^\d+\.?\s*/, '');
    const words = cleaned.split(' ').filter(word => 
        word.length > 2 && 
        !['это', 'также', 'которые', 'который', 'содержащие', 'является'].includes(word.toLowerCase())
    );
    
    const concept = words.slice(0, 4).join(' ').replace(/[.,;:]$/, '');
    return concept || 'данное понятие';
}

function extractProcessType(sentence) {
    if (sentence.includes('стадии')) return 'стадии этого процесса';
    if (sentence.includes('этапы')) return 'этапы этого процесса';
    if (sentence.includes('функции')) return 'функции этого процесса';
    return 'основные характеристики';
}

function generateDefaultQA(sentence) {
    const concept = extractMainConcept(sentence);
    const firstWord = concept.split(' ')[0].toLowerCase();
    
    const questionWords = {
        'как': 'Как происходит этот процесс?',
        'что': 'Что это означает?',
        'где': 'Где это происходит?',
        'когда': 'Когда это происходит?',
        'почему': 'Почему это важно?'
    };
    
    const question = questionWords[firstWord] || `Что такое ${concept}?`;
    
    return {
        question: question,
        answer: sentence
    };
}

function generateBackupFlashcards(text) {
    const chunks = text.split(/(?<=\.[^0-9])\s+/).filter(chunk => chunk.length > 20);
    const flashcards = [];
    
    chunks.forEach((chunk, index) => {
        const sentences = chunk.split(/(?<!\d)\.(?!\d)/).filter(s => s.trim().length > 10);
        
        sentences.forEach(sentence => {
            const concept = extractMainConcept(sentence);
            if (concept && concept.split(' ').length > 1) {
                flashcards.push(new SmartFlashcard(
                    `Что такое ${concept}?`,
                    sentence.trim()
                ));
            }
        });
    });
    
    if (flashcards.length === 0) {
        const mainConcept = extractMainConcept(text.slice(0, 100));
        flashcards.push(new SmartFlashcard(
            `Что такое ${mainConcept}?`,
            text.slice(0, 200) + '...'
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
    
    if (text.length < 10) {
        alert('Пожалуйста, введите текст для изучения (минимум 10 символов)');
        return;
    }
    
    currentCards = generateFlashcards(text);
    displayCards(currentCards);
});

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
    
    // Сохраняем прогресс в localStorage
    saveProgress();
    
    currentReviewIndex++;
    showNextCard();
}

function endReviewSession() {
    alert('Повторение завершено! 🎉\n\nСледующее повторение через: ' + 
          getNextReviewTime() + '\n\nПрогресс сохранен.');
    
    // Возвращаем к главному экрану
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
        const progress = JSON.parse(saved);
        // Можно добавить логику загрузки прогресса
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupRatingButtons();
    loadProgress();
});
