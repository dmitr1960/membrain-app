// Простая и надежная генерация карточек
function generateFlashcards(text) {
    if (!text || text.trim().length < 10) {
        return [new SmartFlashcard(
            "Введите текст для изучения", 
            "Добавьте текст длиной от 10 символов для генерации карточек"
        )];
    }
    
    console.log("Начало генерации карточек");
    
    // Простое разбиение на предложения
    const sentences = text.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 10 && trimmed.split(' ').length >= 3;
    });
    
    console.log("Найдено предложений:", sentences.length);
    
    const flashcards = [];
    
    // Проходим по каждому предложению
    for (let i = 0; i < sentences.length && flashcards.length < 8; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;
        
        // Создаем карточку для каждого предложения
        const card = createCardFromSentence(sentence);
        if (card) {
            flashcards.push(card);
        }
    }
    
    console.log("Сгенерировано карточек:", flashcards.length);
    
    // Если ничего не сгенерировалось, создаем хотя бы одну карточку
    if (flashcards.length === 0) {
        flashcards.push(new SmartFlashcard(
            "Основная идея текста",
            text.substring(0, 100) + (text.length > 100 ? '...' : '')
        ));
    }
    
    return flashcards;
}

// Создание одной карточки из предложения
function createCardFromSentence(sentence) {
    // Очищаем предложение от мусора
    let cleaned = sentence
        .replace(/^\d+\.?\s*/, '') // Удаляем "1. ", "2. "
        .replace(/^[-•]\s*/, '')   // Удаляем маркеры списка
        .replace(/Содержимое ответа/g, '') // Удаляем мусор
        .trim();
    
    // Если предложение слишком короткое после очистки, пропускаем
    if (cleaned.length < 15 || cleaned.split(' ').length < 3) {
        return null;
    }
    
    // Извлекаем основное понятие (первые 2-3 значимых слова)
    const words = cleaned.split(' ').filter(word => 
        word.length > 2 && 
        !['это', 'также', 'которые', 'который', 'например'].includes(word.toLowerCase())
    );
    
    if (words.length < 2) {
        return null;
    }
    
    const mainConcept = words.slice(0, 2).join(' ');
    
    // Создаем вопрос БЕЗ "Что такое"
    const question = `Объясните: ${mainConcept}`;
    
    return new SmartFlashcard(question, cleaned);
}
