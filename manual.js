// ===============================
// MemBrain Lite / JoBrain (manual.js)
// ===============================
// Облегчённая версия без API и IndexedDB.
// Хранение данных — только в localStorage (JSON).
// Генерация карточек полностью оффлайн.
// Добавлен переключатель “Ответы на английском”.
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topicInput");
    const textInput = document.getElementById("textInput");
    const generateBtn = document.getElementById("generateBtn");
    const cardContainer = document.getElementById("cardContainer");
    const saveBtn = document.getElementById("saveBtn");
    const repeatBtn = document.getElementById("repeatBtn");
    const englishToggle = document.getElementById("englishToggle"); // переключатель “Ответы на английском”

    // ===============================
    // Утилиты
    // ===============================
    const loadData = () => {
        const data = localStorage.getItem("joBrainData");
        return data ? JSON.parse(data) : {};
    };

    const saveData = (data) => {
        localStorage.setItem("joBrainData", JSON.stringify(data));
    };

    const cleanText = (text) => {
        return text
            .replace(/\d+[\).]/g, "")
            .replace(/[•*]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    };

    const splitToBlocks = (text) => {
        return text
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 15)
            .map(s => cleanText(s));
    };

    const pickQuestion = (sentence) => {
        const s = sentence.toLowerCase();

        if (s.includes("определение") || s.includes("это"))
            return "Какое дается определение?";
        if (s.includes("функция") || s.includes("роль"))
            return "Какую функцию выполняет?";
        if (s.includes("свойство") || s.includes("характеристика"))
            return "Какие свойства имеет?";
        if (s.includes("пример") || s.includes("например"))
            return "Приведи пример.";
        if (s.includes("вид") || s.includes("тип"))
            return "Какие виды или типы существуют?";
        if (s.includes("причина") || s.includes("влияние"))
            return "Какие причины и следствия?";
        if (s.includes("структура") || s.includes("состоит"))
            return "Из чего состоит?";
        if (s.includes("процесс") || s.includes("этап"))
            return "Как происходит процесс?";
        return "Что главное в этом фрагменте?";
    };

    const translateToEnglish = async (text) => {
        // простой оффлайн словарь (без API)
        const smallDict = {
            "что такое": "What is",
            "какие виды": "What kinds of",
            "приведи пример": "Give an example of",
            "основная идея": "Main idea:",
            "определение": "Definition:",
            "причины": "Causes",
            "функция": "Function",
        };
        let t = text;
        for (const [ru, en] of Object.entries(smallDict)) {
            t = t.replace(new RegExp(ru, "gi"), en);
        }
        return t;
    };

    // ===============================
    // Генерация карточек
    // ===============================
    const generateCards = async () => {
        const topic = topicInput.value.trim();
        const text = textInput.value.trim();

        if (!topic || !text) {
            alert("Введите тему и текст!");
            return;
        }

        const sentences = splitToBlocks(text);
        const cards = [];

        for (let i = 0; i < sentences.length; i++) {
            const q = pickQuestion(sentences[i]);
            let a = sentences[i];

            if (englishToggle.checked) {
                a = await translateToEnglish(a);
            }

            cards.push({
                id: Date.now() + i,
                topic,
                question: q,
                answer: a,
                difficulty: "сложно",
                ef: 2.5,
                interval: 1,
                repetitions: 0
            });
        }

        renderCards(cards);

        const data = loadData();
        data[topic] = cards;
        saveData(data);

        alert("Карточки успешно созданы и сохранены!");
    };

    // ===============================
    // Отображение карточек
    // ===============================
    const renderCards = (cards) => {
        cardContainer.innerHTML = "";
        cards.forEach(card => {
            const div = document.createElement("div");
            div.className = "card";

            const q = document.createElement("div");
            q.className = "question";
            q.textContent = card.question;

            const a = document.createElement("div");
            a.className = "answer";
            a.textContent = card.answer;
            a.style.display = "none";

            q.addEventListener("click", () => {
                a.style.display = a.style.display === "none" ? "block" : "none";
            });

            div.appendChild(q);
            div.appendChild(a);
            cardContainer.appendChild(div);
        });
    };

    // ===============================
    // Интервальное повторение (SM-2 lite)
    // ===============================
    const updateCardPerformance = (card, grade) => {
        const q = grade; // 5 = легко, 3 = нормально, 1 = сложно
        if (q < 3) {
            card.repetitions = 0;
            card.interval = 1;
        } else {
            card.repetitions += 1;
            switch (card.repetitions) {
                case 1:
                    card.interval = 1;
                    break;
                case 2:
                    card.interval = 3;
                    break;
                default:
                    card.interval = Math.round(card.interval * card.ef);
            }
        }
        card.ef = card.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (card.ef < 1.3) card.ef = 1.3;
        card.difficulty = q === 5 ? "легко" : q === 3 ? "нормально" : "сложно";
    };

    // ===============================
    // События
    // ===============================
    generateBtn.addEventListener("click", generateCards);

    repeatBtn.addEventListener("click", () => {
        const topic = topicInput.value.trim();
        const data = loadData();
        if (!data[topic]) {
            alert("Для этой темы пока нет карточек.");
            return;
        }
        renderCards(data[topic]);
    });

    saveBtn.addEventListener("click", () => {
        const topic = topicInput.value.trim();
        const data = loadData();
        if (!data[topic]) {
            alert("Нет данных для сохранения.");
            return;
        }
        saveData(data);
        alert("Данные сохранены!");
    });

    // ===============================
    // Мини-стили (чтобы было красиво)
    // ===============================
    const style = document.createElement("style");
    style.textContent = `
        .card {
            background: white;
            border-radius: 16px;
            padding: 16px;
            margin: 10px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        .card:hover {
            transform: scale(1.02);
        }
        .question {
            font-weight: 600;
            cursor: pointer;
        }
        .answer {
            margin-top: 8px;
            color: #333;
            border-top: 1px solid #eee;
            padding-top: 8px;
        }
    `;
    document.head.appendChild(style);
});
