// ==================== УЛУЧШЕННАЯ AI-ГЕНЕРАЦИЯ ====================

// Улучшенная функция извлечения основного понятия
function extractMainConcept(sentence) {
    // Очищаем предложение от мусора
    let cleaned = sentence
        .replace(/^\d+\.?\s*/, '') // Удаляем начальные цифры
        .replace(/^[-•]\s*/, '')   // Удаляем маркеры списка
        .trim();
    
    // Удаляем начальные стоп-слова
    cleaned = cleaned.replace(/^(это|также|например|которые|который|содержащие|является|включает)\s+/i, '');
    
    // Разбиваем на слова и фильтруем
    const words = cleaned.split(/\s+/).filter(word => {
        const lowerWord = word.toLowerCase();
        return word.length > 2 && 
               !['это', 'также', 'которые', 'который', 'содержащие', 'является', 
                 'например', 'процесс', 'может', 'имеет', 'быть', 'очень', 'как', 'что'].includes(lowerWord);
    });
    
    // Берем 2-3 наиболее значимых слова
    let concept = words.slice(0, 3).join(' ');
    
    // Убираем знаки препинания в конце
    concept = concept.replace(/[.,;:!?]$/, '');
    
    return concept || 'данное понятие';
}

// Улучшенная генерация вопросов и ответов
function generateQuestionAnswer(sentence, index) {
    const trimmedSentence = sentence.trim();
    const lowerSentence = trimmedSentence.toLowerCase();
    
    // Обработка определений (начинаются с "это")
    if (lowerSentence.includes('это') || index === 0) {
        const concept = extractMainConcept(trimmedSentence);
        // Проверяем, чтобы не было дублирования "Что такое"
        if (!concept.toLowerCase().includes('что такое') && concept.length > 5) {
            return {
                question: `Что такое ${concept}?`,
                answer: trimmedSentence
            };
        }
    }
    
    // Обработка процессов и стадий
    if (lowerSentence.includes('стадии') || lowerSentence.includes('этапы')) {
        const concept = extractMainConcept(trimmedSentence);
        return {
            question: `Какие стадии включает ${concept}?`,
            answer: trimmedSentence
        };
    }
    
    // Обработка функций и назначения
    if (lowerSentence.includes('функция') || lowerSentence.includes('назначение') || 
        lowerSentence.includes('служит') || lowerSentence.includes('используется')) {
        const concept = extractMainConcept(trimmedSentence);
        return {
            question: `Какие функции выполняет ${concept}?`,
            answer: trimmedSentence
        };
    }
    
    // Обработка математических понятий
    if (lowerSentence.includes('вероятность') || lowerSentence.includes('число') || 
        lowerSentence.includes('равна') || lowerSentence.includes('формула')) {
        const concept = extractMainConcept(trimmedSentence);
        return {
            question: `Как определяется ${concept}?`,
            answer: trimmedSentence
        };
    }
    
    // Обработка примеров
    if (lowerSentence.includes('например') || lowerSentence.includes('пример')) {
        const concept = extractMainConcept(trimmedSentence.replace(/например\s+/i, ''));
        return {
            question: `Приведите пример ${concept}`,
            answer: trimmedSentence
        };
    }
    
    // Улучшенный вопрос по умолчанию
    return generateDefaultQA(trimmedSentence);
}

// Улучшенный вопрос по умолчанию
function generateDefaultQA(sentence) {
    const concept = extractMainConcept(sentence);
    
    // Если concept слишком короткий, используем другую логику
    if (concept.split(' ').length < 2) {
        const words = sentence.split(' ').slice(0, 4).join(' ');
        return {
            question: `Что означает "${words}"?`,
            answer: sentence
        };
    }
    
    const firstWord = concept.split(' ')[0].toLowerCase();
    
    const questionTemplates = {
        'как': `Как работает ${concept}?`,
        'что': `Что такое ${concept}?`, 
        'где': `Где применяется ${concept}?`,
        'когда': `Когда используется ${concept}?`,
        'почему': `Почему важен ${concept}?`,
        'какие': `Какие особенности имеет ${concept}?`,
        'какой': `Какой принцип у ${concept}?`
    };
    
    const question = questionTemplates[firstWord] || `Что такое ${concept}?`;
    
    return {
        question: question,
        answer: sentence
    };
}

// Улучшенная резервная генерация
function generateBackupFlashcards(text) {
    // Более интеллектуальное разбиение на предложения
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const flashcards = [];
    
    sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (trimmed.length < 20) return;
        
        const concept = extractMainConcept(trimmed);
        if (concept && concept.length > 3) {
            // Избегаем дублирования вопросов
            const existingQuestion = flashcards.find(card => 
                card.question.includes(concept) || concept.includes(card.question)
            );
            
            if (!existingQuestion) {
                flashcards.push(new SmartFlashcard(
                    `Что такое ${concept}?`,
                    trimmed
                ));
            }
        }
    });
    
    // Если карточек мало, создаем обобщающие
    if (flashcards.length < 3) {
        const mainTopics = text.split(/[.!?]/)[0]; // Первое предложение
        const mainConcept = extractMainConcept(mainTopics);
        flashcards.push(new SmartFlashcard(
            `Что такое ${mainConcept}?`,
            text.slice(0, 150) + '...'
        ));
    }
    
    return flashcards.slice(0, 6);
}
