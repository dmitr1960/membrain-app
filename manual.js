// СУПЕР-ПРОСТАЯ ГЕНЕРАЦИЯ КАРТОЧЕК
function generateFlashcards(text) {
    console.log("=== НАЧАЛО ГЕНЕРАЦИИ ===");
    console.log("Получен текст:", text);
    
    // Проверка на пустой текст
    if (!text || text.trim().length < 5) {
        console.log("Текст слишком короткий");
        return [
            new SmartFlashcard(
                "Добавьте текст", 
                "Введите текст для изучения (минимум 10 символов)"
            )
        ];
    }
    
    // ПРОСТОЕ разбиение на предложения
    const sentences = text.split(/[.!?]+/);
    console.log("Разбито на предложений:", sentences.length);
    
    const flashcards = [];
    
    // ПРОСТО берем каждое предложение и создаем карточку
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        
        // Пропускаем пустые и очень короткие предложения
        if (!sentence || sentence.length < 10) {
            continue;
        }
        
        console.log("Обрабатываем предложение:", sentence.substring(0, 50));
        
        // ПРОСТОЙ вопрос - берем первые 3 слова
        const words = sentence.split(' ').filter(word => word.length > 0);
        if (words.length < 3) continue;
        
        const mainWords = words.slice(0, 3).join(' ');
        const question = `Объясните: ${mainWords}`;
        
        // Создаем карточку
        const card = new SmartFlashcard(question, sentence);
        flashcards.push(card);
        console.log("Создана карточка:", question);
        
        // Ограничиваем количество карточек
        if (flashcards.length >= 6) break;
    }
    
    console.log("=== ЗАВЕРШЕНО ===");
    console.log("Итоговое количество карточек:", flashcards.length);
    
    // Если вообще ничего не создалось - создаем одну общую карточку
    if (flashcards.length === 0) {
        console.log("Создаем резервную карточку");
        const firstWords = text.split(' ').slice(0, 4).join(' ');
        flashcards.push(
            new SmartFlashcard(
                `Тема: ${firstWords}`,
                text.substring(0, 150) + (text.length > 150 ? '...' : '')
            )
        );
    }
    
    return flashcards;
}
