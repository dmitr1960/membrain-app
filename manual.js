function generateCards() {
  const subject = document.getElementById('subject').value.trim();
  const topic = document.getElementById('topic').value.trim();
  const text = document.getElementById('text').value.trim();
  const cardsContainer = document.getElementById('cards');

  if (!text) {
    cardsContainer.innerHTML = "<p>⚠️ Введите материал для генерации карточек.</p>";
    return;
  }

  // Простейшая локальная генерация карточек:
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
  cardsContainer.innerHTML = "";

  sentences.forEach((sentence, i) => {
    const question = `Что главное в предложении №${i + 1}?`;
    const answer = sentence.trim();

    const card = document.createElement('div');
    card.className = "card";
    card.innerHTML = `<b>${question}</b><br><span>${answer}</span>`;
    cardsContainer.appendChild(card);
  });

  if (!sentences.length) {
    cardsContainer.innerHTML = "<p>Не удалось выделить карточки. Попробуйте другой текст.</p>";
  }
}

