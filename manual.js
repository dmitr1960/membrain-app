// Новая интеллектуальная генерация карточек
function generateFlashcards(text) {
    if (!text || text.trim().length < 10) {
        return [new SmartFlashcard(
            "Текст слишком короткий", 
            "Добавьте больше информации для генерации карточек"
        )];
    }
    
    // Очищаем текст от готовых вопросов
    const cleanedText = text
        .replace(/Что такое [^?]+\?/g, '') // Удаляем "Что такое...?"
        .replace(/\d+\.\s*/g, '') // Удаляем нумерацию
        .replace(/Содержимое ответа/g, '') // Удаляем мусор
        .replace(/\n/g, '. ') // Заменяем переносы на точки
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim();
    
    // Разбиваем на предложения
    const sentences = cleanedText.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 15 && 
               trimmed.split(' ').length >= 4 &&
               !trimmed.match(/^\d/); // Исключаем начинающиеся с цифр
    });
    
    const flashcards = [];
    
    sentences.forEach((sentence) => {
        const trimmed = sentence.trim();
        if (!trimmed) return;
        
        // Создаем разные типы вопросов в зависимости от содержания
        const questionAnswer = createQuestionAnswer(trimmed);
        if (questionAnswer) {
            flashcards.push(new SmartFlashcard(
                questionAnswer.question,
                questionAnswer.answer
            ));
        }
    });
    
    // Если карточек мало, создаем обобщающие
    if (flashcards.length < 2) {
        return createFallbackCards(cleanedText);
    }
    
    return flashcards.slice(0, 8);
}

// Создание пары вопрос-ответ на основе предложения
function createQuestionAnswer(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Определения (содержит "это", "означает", "называется")
    if (lowerSentence.includes(' это ') || 
        lowerSentence.includes(' означает ') || 
        lowerSentence.includes(' называется ') ||
        lowerSentence.match(/^[^ ]+ — это /) ||
        lowerSentence.match(/^[^ ]+ это /)) {
        
        // Извлекаем понятие до "это"
        const match = sentence.match(/^([^—]+) — это (.+)/) || 
                     sentence.match(/^([^ ]+) это (.+)/) ||
                     sentence.match(/([^.!?]+) это ([^.!?]+)/);
        
        if (match) {
            const concept = match[1].trim();
            const definition = match[2].trim();
            return {
                question: `${concept} - это...?`,
                answer: definition
            };
        }
        
        // Альтернативный вариант
        const concept = extractMainConcept(sentence.split(' это ')[0]);
        return {
            question: `Дайте определение: ${concept}`,
            answer: sentence
        };
    }
    
    // Процессы и характеристики (содержит "включает", "состоит", "имеет")
    if (lowerSentence.includes('включает') || 
        lowerSentence.includes('состоит') || 
        lowerSentence.includes('имеет') ||
        lowerSentence.includes('характеризуется')) {
        
        const concept = extractMainConcept(sentence);
        return {
            question: `Какие характеристики имеет ${concept}?`,
            answer: sentence
        };
    }
    
    // Примеры (содержит "например", "пример", "как")
    if (lowerSentence.includes('например') || 
        lowerSentence.includes('пример') ||
        lowerSentence.includes('как ')) {
        
        const concept = extractMainConcept(sentence);
        return {
            question: `Приведите пример: ${concept}`,
            answer: sentence
        };
    }
    
    // Математические понятия
    if (lowerSentence.includes('вероятность') || 
        lowerSentence.includes('число') || 
        lowerSentence.includes('равна') ||
        lowerSentence.includes('формула')) {
        
        const concept = extractMainConcept(sentence);
        return {
            question: `Как вычисляется ${concept}?`,
            answer: sentence
        };
    }
    
    // По умолчанию - создаем вопрос на понимание
    const concept = extractMainConcept(sentence);
    if (concept && concept.length > 5) {
        return {
            question: `Объясните: ${concept}`,
            answer: sentence
        };
    }
    
    return null;
}

// Извлечение основного понятия (упрощенная версия)
function extractMainConcept(text) {
    // Удаляем мусор
    let cleaned = text
        .replace(/^[^а-яА-Я]*/, '') // Удаляем начальные не-буквы
        .replace(/[.,;:!?]$/, '')
        .trim();
    
    // Берем первые 2-3 значимых слова
    const words = cleaned.split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 3);
    
    return words.join(' ') || 'данное понятие';
}

// Резервная генерация
function createFallbackCards(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const flashcards = [];
    
    sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        const words = trimmed.split(' ').filter(word => word.length > 3);
        
        if (words.length >= 3) {
            const concept = words.slice(0, 2).join(' ');
            flashcards.push(new SmartFlashcard(
                `Объясните: ${concept}`,
                trimmed
            ));
        }
    });
    
    return flashcards.length > 0 ? flashcards : [
        new SmartFlashcard(
            "Основная тема текста",
            text.substring(0, 150) + (text.length > 150 ? '...' : '')
        )
    ];
}
