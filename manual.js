// manual.js - ДОБАВЛЯЕМ РЕДАКТИРОВАНИЕ КАРТОЧЕК

class MemoryApp {
    constructor() {
        this.cards = this.loadCards();
        this.currentCardIndex = 0;
        this.isAnswerShown = false;
        this.currentInterface = 'mainInterface';
        this.editingCardId = null; // НОВОЕ: ID карточки для редактирования
        this.deletingCardId = null; // НОВОЕ: ID карточки для удаления
    }

    // НОВЫЕ МЕТОДЫ ДЛЯ РЕДАКТИРОВАНИЯ

    // Показ формы редактирования
    showEditModal(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;
        
        this.editingCardId = cardId;
        
        document.getElementById('editTheme').value = card.theme || '';
        document.getElementById('editQuestion').value = card.question || '';
        document.getElementById('editAnswer').value = card.answer || '';
        
        document.getElementById('editModal').style.display = 'flex';
    }

    // Скрытие формы редактирования
    hideEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingCardId = null;
    }

    // Сохранение отредактированной карточки
    saveEditedCard() {
        if (!this.editingCardId) return;
        
        const card = this.cards.find(c => c.id === this.editingCardId);
        if (!card) return;
        
        const newTheme = document.getElementById('editTheme').value.trim();
        const newQuestion = document.getElementById('editQuestion').value.trim();
        const newAnswer = document.getElementById('editAnswer').value.trim();
        
        if (!newQuestion || !newAnswer) {
            alert('Вопрос и ответ не могут быть пустыми!');
            return;
        }
        
        // Обновляем карточку
        card.theme = newTheme;
        card.question = newQuestion;
        card.answer = newAnswer;
        
        this.saveCards();
        this.hideEditModal();
        
        // Обновляем отображение в каталоге
        if (this.currentInterface === 'catalogInterface') {
            this.showCatalog();
        }
        
        alert('Карточка успешно обновлена! ✅');
    }

    // Показ подтверждения удаления
    showDeleteModal(cardId) {
        this.deletingCardId = cardId;
        document.getElementById('deleteModal').style.display = 'flex';
    }

    // Скрытие подтверждения удаления
    hideDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        this.deletingCardId = null;
    }

    // Подтверждение удаления карточки
    confirmDeleteCard() {
        if (!this.deletingCardId) return;
        
        this.cards = this.cards.filter(c => c.id !== this.deletingCardId);
        this.saveCards();
        this.hideDeleteModal();
        
        // Обновляем отображение
        if (this.currentInterface === 'catalogInterface') {
            this.showCatalog();
        }
        
        alert('Карточка удалена! ✅');
    }

    // ОБНОВЛЯЕМ МЕТОД showCatalog ДЛЯ ДОБАВЛЕНИЯ КНОПОК
    showCatalog() {
        if (this.cards.length === 0) {
            alert('Нет созданных карточек. Сначала создайте карточки.');
            this.showInterface('mainInterface');
            return;
        }
        
        const groupedByTheme = this.groupCardsByTheme();
        let catalogHTML = '';
        
        Object.entries(groupedByTheme).forEach(([theme, themeCards]) => {
            catalogHTML += `
                <div class="theme-group">
                    <div class="theme-header" onclick="memoryApp.toggleTheme('${theme}')">
                        <div class="theme-title">${theme}</div>
                        <div class="theme-count">${themeCards.length}</div>
                    </div>
                    <div class="theme-cards" id="theme-${this.encodeThemeId(theme)}">
                        ${themeCards.map(card => `
                            <div class="catalog-card">
                                <div style="font-weight: bold; margin-bottom: 8px;">${card.question}</div>
                                <div style="color: #666; font-size: 14px; margin-bottom: 10px;">${card.answer.substring(0, 100)}${card.answer.length > 100 ? '...' : ''}</div>
                                
                                <!-- НОВОЕ: КНОПКИ РЕДАКТИРОВАНИЯ И УДАЛЕНИЯ -->
                                <div class="card-actions">
                                    <button class="edit-btn" onclick="memoryApp.showEditModal('${card.id}')">
                                        ✏️ Редактировать
                                    </button>
                                    <button class="delete-btn" onclick="memoryApp.showDeleteModal('${card.id}')">
                                        🗑️ Удалить
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        document.getElementById('catalogList').innerHTML = catalogHTML;
        this.showInterface('catalogInterface');
    }

    // ОБНОВЛЯЕМ МЕТОД displayGeneratedCards ДЛЯ КНОПОК РЕДАКТИРОВАНИЯ
    displayGeneratedCards() {
        const cardsList = document.getElementById('cardsList');
        const cardsContainer = document.getElementById('cardsContainer');
        
        if (!cardsList || !cardsContainer) return;
        
        cardsList.innerHTML = '';
        
        const recentCards = this.cards.slice(-10);
        
        recentCards.forEach((card) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                ${card.theme ? `<div class="card-theme">${card.theme}</div>` : ''}
                <div class="card-question">${card.question}</div>
                <div class="card-answer">${card.answer}</div>
                
                <!-- НОВОЕ: КНОПКИ РЕДАКТИРОВАНИЯ И УДАЛЕНИЯ -->
                <div class="card-actions">
                    <button class="edit-btn" onclick="memoryApp.showEditModal('${card.id}')">
                        ✏️ Редактировать
                    </button>
                    <button class="delete-btn" onclick="memoryApp.showDeleteModal('${card.id}')">
                        🗑️ Удалить
                    </button>
                </div>
            `;
            cardsList.appendChild(cardElement);
        });
        
        this.showInterface('cardsContainer');
    }

    // ОСТАЛЬНЫЕ МЕТОДЫ БЕЗ ИЗМЕНЕНИЙ
    // ... (generateCards, startReview, showCard и т.д.)
}

// Глобальная переменная для доступа к приложению
let memoryApp;

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    memoryApp = new MemoryApp();
    memoryApp.init();
});
