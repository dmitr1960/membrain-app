/* manual.js — JoBrain (полная автономная логика)
   - Хранение: localStorage (ключ JO_BRAIN_DATA)
   - Структура данных: { subjects: { [subject]: { themes: { [theme]: [cards...] } } } }
   - Card: { id, subject, theme, question, answer, ef, interval, repetitions, lastReviewed, nextReview }
*/

(function(){
  const KEY = 'JO_BRAIN_DATA_v1';

  /* ---------- DOM ---------- */
  const subjectInput = document.getElementById('subjectInput');
  const themeInput = document.getElementById('themeInput');
  const aiPrompt = document.getElementById('aiPrompt');
  const textInput = document.getElementById('textInput');

  const generateBtn = document.getElementById('generateBtn');
  const aiGenerateBtn = document.getElementById('aiGenerateBtn');
  const catalogBtn = document.getElementById('catalogBtn');
  const reviewBtn = document.getElementById('reviewBtn');

  const cardsContainer = document.getElementById('cardsContainer');

  const catalogModal = document.getElementById('catalogModal');
  const catalogList = document.getElementById('catalogList');
  const closeCatalog = document.getElementById('closeCatalog');

  const editModal = document.getElementById('editModal');
  const editSubject = document.getElementById('editSubject');
  const editTheme = document.getElementById('editTheme');
  const editQuestion = document.getElementById('editQuestion');
  const editAnswer = document.getElementById('editAnswer');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  const reviewModal = document.getElementById('reviewModal');
  const reviewList = document.getElementById('reviewList');
  const closeReview = document.getElementById('closeReview');

  const pasteBtn = document.getElementById('pasteBtn');

  /* ---------- helpers ---------- */
  function loadStore(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{"subjects":{}}'); }catch(e){ return {subjects:{}}; } }
  function saveStore(store){ localStorage.setItem(KEY, JSON.stringify(store)); }
  function uid(prefix='c'){ return prefix + '_' + Date.now() + '_' + Math.floor(Math.random()*9999); }
  function nowISO(){ return new Date().toISOString(); }
  function isCyrillic(s){ return /[а-яёА-ЯЁ]/.test(s); }
  function getTargetLang(){ const r = document.querySelector('input[name="lang"]:checked'); return r ? r.value : 'auto'; }

  /* ---------- text cleaning ---------- */
  function cleanTextRaw(text, theme=''){
    if(!text) return '';
    let t = text.replace(/\r/g,' ').replace(/\t/g,' ').trim();
    // remove list markers / numbering like 1. , 1) , I.
    t = t.replace(/(^|\n)\s*[\dIVXLCDM]+\s*[\)\.\-–—]?\s*/gi,'$1');
    t = t.replace(/(^|\n)\s*[\-\*\•]\s*/g,'$1');
    // remove duplicate theme mentions at start
    if(theme){
      const esc = theme.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      t = t.replace(new RegExp('(^|\\n)\\s*'+esc+'\\s*[:\\-–—]?\\s*','gi'),'$1');
    }
    // collapse spaces
    t = t.split('\n').map(l=>l.trim()).filter(Boolean).join('\n');
    return t;
  }

  function splitSentences(text){
    if(!text) return [];
    // split by punctuation while keeping formulas inline
    return text.replace(/\n+/g,' ').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>8);
  }

  /* ---------- choose language for generation/answers ---------- */
  function detectInputLanguage(text){
    if(!text) return 'ru';
    const hasCyr = isCyrillic(text);
    return hasCyr ? 'ru' : 'en';
  }

  async function maybeTranslateTo(target, text){
    // Offline lightweight translation behavior:
    // - if target === 'auto' or same as input => return text
    // - if target === 'en' and input is cyrillic => simple dictionary fallback + mark [EN]
    // For production replace with real LLM/local model
    const inputLang = detectInputLanguage(text);
    if(target === 'auto' || target === inputLang) return text;
    if(target === 'en' && inputLang === 'ru'){
      // small naive replacements
      const dict = {'фотосинтез':'photosynthesis','клетка':'cell','вода':'water','углекислый газ':'carbon dioxide','кислород':'oxygen','свет':'light'};
      let out = text;
      Object.keys(dict).forEach(k => {
        out = out.replace(new RegExp(k, 'gi'), dict[k]);
      });
      // prefix and return
      return '[EN] ' + out;
    }
    // other fallback: just mark
    return '['+target.toUpperCase()+'] ' + text;
  }

  /* ---------- AI local fallback ---------- */
  async function generateAIResponse(prompt){
    // small knowledge base + fallback summary; synchronous simulated delay
    const kb = {
      'фотосинтез': `Фотосинтез — это процесс преобразования энергии света в химическую энергию. Основные этапы: световые и темновые реакции. Уравнение: 6CO2 + 6H2O -> C6H12O6 + 6O2.`,
      'строение клетки': `Клетка состоит из мембраны, цитоплазмы и ядра. Митохондрии обеспечивают энергию, рибосомы — синтез белка.`,
    };
    const p = (prompt||'').toLowerCase();
    for(const k of Object.keys(kb)){
      if(p.includes(k)) return kb[k];
    }
    // generic fallback: take prompt and create bullets
    const generic = `Краткий ответ на: ${prompt}\n\n1) Ключевая идея: ...\n2) Важные элементы: ...\n3) Короткое определение: ...`;
    return generic;
  }

  /* ---------- question generator (improved, local) ---------- */
  function detectFactType(sentence){
    const s = sentence.toLowerCase();
    if(/\b(столица|город|находится|расположен|река|гора|озеро)\b/.test(s)) return 'location';
    if(/\b(год|век|дата|когда|период)\b/.test(s)) return 'date';
    if(/\b(ученый|писатель|автор|открыл|создал)\b/.test(s)) return 'person';
    if(/\b(война|революция|сражение|битва|реформа|открытие)\b/.test(s)) return 'event';
    if(/\b(определение|это|называется|понятие|термин)\b/.test(s)) return 'definition';
    return 'general';
  }

  function extractEntity(sentence, pattern){
    const m = sentence.match(pattern);
    return m ? m[1].trim() : null;
  }

  function makeQuestionFromSentence(sentence, theme=''){
    const type = detectFactType(sentence);
    let q = '';
    try{
      if(type==='definition'){
        // try to find term before dash "X — Y"
        let term = extractEntity(sentence, /([^—–-]+)\s[—–-:]\s/);
        if(!term) term = extractEntity(sentence, /([^,.;()]+)\s+это\s+/i);
        if(term) q = `Что такое ${term.trim()}?`;
        else q = `Что означает данное определение?`;
      } else if(type==='date'){
        const y = sentence.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
        if(y) q = `Когда произошло событие (в каком году)?`;
        else q = `Когда произошло описанное событие?`;
      } else if(type==='person'){
        q = `Кто упоминается в этом фрагменте?`;
      } else if(type==='location'){
        q = `Где происходит описанное явление/событие?`;
      } else if(type==='event'){
        q = `Что описывается в этом фрагменте?`;
      } else {
        // general: try to shorten to 8-12 words
        const words = sentence.split(' ').filter(Boolean);
        const frag = words.slice(0, Math.min(10, words.length)).join(' ');
        q = `О чём говорится: "${frag}${words.length>10?'...':''}"?`;
      }
      // cleanup: remove theme mention if present
      if(theme){
        const re = new RegExp('\\b' + theme.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b','gi');
        q = q.replace(re,'').replace(/\s{2,}/g,' ').trim();
      }
      // ensure ends with '?'
      if(!q.endsWith('?')) q += '?';
      return q;
    }catch(e){
      return 'Что описывается в этом фрагменте?';
    }
  }

  /* ---------- generate cards flow ---------- */
  async function improvedCardGeneration(rawText, theme, subject){
    const cleaned = cleanTextRaw(rawText, theme);
    const sents = splitSentences(cleaned);
    // compute word freq for importance
    const allWords = cleaned.toLowerCase().match(/\b[а-яёa-z]+\b/gi) || [];
    const freq = {};
    const stop = new Set(['и','в','на','что','как','это','для','по','из','the','and','in','of','to','is','it']);
    allWords.forEach(w=>{ if(!stop.has(w)) freq[w] = (freq[w]||0) + 1; });
    function scoreSentence(s){
      const words = (s.toLowerCase().match(/\b[а-яёa-z]+\b/gi)||[]);
      let sc=0; words.forEach(w=>{ sc += freq[w]||0;});
      return sc/Math.sqrt(Math.max(1, words.length));
    }
    const scored = sents.map(s=>({s,score:scoreSentence(s)})).sort((a,b)=>b.score-a.score);
    const top = scored.slice(0, Math.min(8, scored.length)).map(x=>x.s);
    const cards = [];
    const targetLang = getTargetLang();

    for(let i=0;i<top.length;i++){
      const sentence = top[i];
      let q = makeQuestionFromSentence(sentence, theme);
      let a = sentence;
      // clean answer
      a = a.replace(/^[\d\)\.\-•\s]+/,'').trim();
      // translate if needed (offline)
      const finalA = await maybeTranslateTo(targetLang, a);
      cards.push({
        id: uid('card'),
        subject: subject || 'Без предмета',
        theme: theme || 'Без темы',
        question: q,
        answer: finalA,
        ef: 2.5,
        interval: 1,
        repetitions: 0,
        lastReviewed: null,
        nextReview: nowISO()
      });
    }
    return dedupeCards(cards);
  }

  function dedupeCards(cards){
    const map = new Map();
    const out = [];
    for(const c of cards){
      const key = (c.question+'|'+c.answer).toLowerCase().replace(/\s+/g,' ').trim();
      if(!map.has(key)){ map.set(key, true); out.push(c); }
    }
    return out;
  }

  /* ---------- store helpers ---------- */
  function addCardsToStore(cards){
    const store = loadStore();
    if(!store.subjects) store.subjects = {};
    cards.forEach(card=>{
      const s = card.subject || 'Без предмета';
      const t = card.theme || 'Без темы';
      if(!store.subjects[s]) store.subjects[s] = {themes:{}};
      if(!store.subjects[s].themes[t]) store.subjects[s].themes[t] = [];
      // avoid duplicates by id or q/a
      const exists = store.subjects[s].themes[t].some(c => (c.question===card.question && c.answer===card.answer));
      if(!exists) store.subjects[s].themes[t].push(card);
    });
    saveStore(store);
  }

  /* ---------- render functions ---------- */
  function renderCardsList(cards){
    cardsContainer.innerHTML = '';
    if(!cards || cards.length===0){
      cardsContainer.innerHTML = '<div style="color:#6b7280">Нет карточек. Сначала создайте их.</div>'; return;
    }
    cards.forEach(card=>{
      const el = document.createElement('div'); el.className = 'card';
      el.innerHTML = `
        <div class="meta"><div>${card.subject} · ${card.theme}</div><div>${card.repetitions?('Повт.: '+card.repetitions):''}</div></div>
        <div class="q">${escapeHTML(card.question)}</div>
        <div class="a">${escapeHTML(card.answer)}</div>
        <div class="card-actions">
          <button class="btn ghost small edit" data-id="${card.id}">✏ Редактировать</button>
          <button class="btn ghost small save" data-id="${card.id}">💾 Сохранить</button>
          <button class="btn ghost small del" data-id="${card.id}">🗑 Удалить</button>
        </div>
      `;
      // toggle answer
      el.querySelector('.q').addEventListener('click', ()=> {
        const a = el.querySelector('.a'); a.style.display = a.style.display === 'none' ? 'block' : 'none';
      });
      // edit
      el.querySelector('.edit').addEventListener('click', ()=> showEdit(card));
      // save (just persist changes if in-store)
      el.querySelector('.save').addEventListener('click', ()=> {
        // nothing special: if in store, already saved; show notification
        toast('Карточка сохранена (локально).');
      });
      // delete
      el.querySelector('.del').addEventListener('click', ()=> {
        deleteCard(card.id);
      });
      cardsContainer.appendChild(el);
    });
  }

  function escapeHTML(s){ return String(s).replace(/[&<>]/g, c => (c=='&'?'&amp;':c=='<'?'&lt;':'&gt;')); }

  /* ---------- catalog UI ---------- */
  function openCatalog(){
    const store = loadStore();
    catalogList.innerHTML = '';
    const subjects = Object.keys(store.subjects || {});
    if(subjects.length===0){ catalogList.innerHTML = '<div style="color:#6b7280">Каталог пуст — создайте карточки</div>'; catalogModal.style.display='flex'; return; }
    subjects.forEach(subj=>{
      const div = document.createElement('div'); div.style.marginBottom='12px';
      const themeMap = store.subjects[subj].themes || {};
      const themeCount = Object.keys(themeMap).length;
      div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">
        <div><strong>${escapeHTML(subj)}</strong> · ${themeCount} тем</div>
        <div><button class="btn ghost open-subj" data-sub="${escapeHTML(subj)}">Открыть</button></div>
      </div>`;
      catalogList.appendChild(div);
    });
    // attach handlers
    catalogList.querySelectorAll('.open-subj').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const subj = btn.getAttribute('data-sub');
        openSubjectView(subj);
      });
    });
    catalogModal.style.display = 'flex';
  }

  function openSubjectView(subject){
    const store = loadStore();
    const themes = store.subjects[subject].themes || {};
    catalogList.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">
      <button class="btn ghost back">← Назад</button><h3>${escapeHTML(subject)}</h3>
    </div>`;
    const container = document.createElement('div');
    Object.keys(themes).forEach(theme=>{
      const cards = themes[theme];
      const themeDiv = document.createElement('div'); themeDiv.className='panel'; themeDiv.style.marginTop='8px';
      themeDiv.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">
        <div><strong>${escapeHTML(theme)}</strong> · ${cards.length} карточек</div>
        <div><button class="btn ghost open-theme" data-sub="${escapeHTML(subject)}" data-theme="${escapeHTML(theme)}">Открыть тему</button></div>
      </div>`;
      container.appendChild(themeDiv);
    });
    catalogList.appendChild(container);
    // back handler
    catalogList.querySelector('.back').addEventListener('click', openCatalog);
    catalogList.querySelectorAll('.open-theme').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const s = btn.getAttribute('data-sub'), t = btn.getAttribute('data-theme');
        showThemeCards(s,t);
      });
    });
  }

  function showThemeCards(subject, theme){
    const store = loadStore();
    const cards = (store.subjects[subject] && store.subjects[subject].themes[theme]) || [];
    // render in catalogList area with back button
    catalogList.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">
      <button class="btn ghost back">← Назад</button><h3>${escapeHTML(subject)} — ${escapeHTML(theme)}</h3>
    </div>`;
    const list = document.createElement('div'); list.style.marginTop='10px';
    cards.forEach(card=>{
      const el = document.createElement('div'); el.className='card';
      el.style.marginBottom='8px';
      el.innerHTML = `<div class="meta"><div>${escapeHTML(card.question)}</div></div>
        <div class="a">${escapeHTML(card.answer)}</div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="btn ghost edit" data-id="${card.id}">✏ Редактировать</button>
          <button class="btn ghost delete" data-id="${card.id}">🗑 Удалить</button>
          <button class="btn ghost review" data-id="${card.id}">🔁 Повторить</button>
        </div>`;
      list.appendChild(el);
    });
    catalogList.appendChild(list);
    catalogList.querySelector('.back').addEventListener('click', ()=> openSubjectView(subject));

    // handlers for edit/delete/review
    catalogList.querySelectorAll('.edit').forEach(b => b.addEventListener('click', ()=> {
      const id = b.getAttribute('data-id'); openEditById(id);
    }));
    catalogList.querySelectorAll('.delete').forEach(b => b.addEventListener('click', ()=> {
      const id = b.getAttribute('data-id'); confirmDelete(id, subject, theme);
    }));
    catalogList.querySelectorAll('.review').forEach(b => b.addEventListener('click', ()=>{
      const id = b.getAttribute('data-id'); startReviewById(id);
    }));
  }

  function openEditById(id){
    const store = loadStore();
    for(const s of Object.keys(store.subjects || {})){
      for(const t of Object.keys(store.subjects[s].themes || {})){
        const arr = store.subjects[s].themes[t];
        const found = arr.find(c=>c.id===id);
        if(found){
          showEdit(found); return;
        }
      }
    }
    toast('Карточка не найдена');
  }

  function showEdit(card){
    editModal.style.display = 'flex';
    editSubject.value = card.subject; editTheme.value = card.theme;
    editQuestion.value = card.question; editAnswer.value = card.answer;
    saveEditBtn.onclick = ()=> {
      const newS = editSubject.value.trim()||'Без предмета';
      const newT = editTheme.value.trim()||'Без темы';
      const newQ = editQuestion.value.trim()||card.question;
      const newA = editAnswer.value.trim()||card.answer;
      // update store
      const store = loadStore();
      // remove old
      for(const s of Object.keys(store.subjects)){
        for(const t of Object.keys(store.subjects[s].themes||{})){
          store.subjects[s].themes[t] = store.subjects[s].themes[t].filter(c=>c.id!==card.id);
        }
      }
      if(!store.subjects[newS]) store.subjects[newS]={themes:{}};
      if(!store.subjects[newS].themes[newT]) store.subjects[newS].themes[newT]=[];
      const updated = Object.assign({}, card, {subject:newS, theme:newT, question:newQ, answer:newA});
      store.subjects[newS].themes[newT].push(updated);
      saveStore(store);
      editModal.style.display='none';
      toast('Карточка обновлена');
      openCatalog();
    };
    cancelEditBtn.onclick = ()=> editModal.style.display='none';
  }

  function confirmDelete(id, subject, theme){
    if(!confirm('Удалить эту карточку?')) return;
    const store = loadStore();
    if(store.subjects[subject] && store.subjects[subject].themes[theme]){
      store.subjects[subject].themes[theme] = store.subjects[subject].themes[theme].filter(c=>c.id !== id);
      saveStore(store);
      toast('Карточка удалена');
      showThemeCards(subject, theme);
    }
  }

  function deleteCard(id){
    const store = loadStore();
    for(const s of Object.keys(store.subjects||{})){
      for(const t of Object.keys(store.subjects[s].themes||{})){
        const lenBefore = store.subjects[s].themes[t].length;
        store.subjects[s].themes[t] = store.subjects[s].themes[t].filter(c=>c.id!==id);
        if(store.subjects[s].themes[t].length!==lenBefore){
          saveStore(store); toast('Удалено'); openCatalog(); renderAllCards(); return;
        }
      }
    }
    toast('Не нашёл карточку для удаления');
  }

  /* ---------- Review / SM-2 lite ---------- */
  function startReviewById(id){
    // show modal with single card review
    const store = loadStore();
    let card = null;
    for(const s of Object.keys(store.subjects||{})){
      for(const t of Object.keys(store.subjects[s].themes||{})){
        const found = store.subjects[s].themes[t].find(c=>c.id===id);
        if(found){ card = found; break; }
      }
      if(card) break;
    }
    if(!card){ toast('Карточка не найдена'); return; }
    reviewList.innerHTML = renderReviewCard(card);
    reviewModal.style.display='flex';
    attachReviewHandlers(card);
  }

  function renderReviewCard(card){
    return `<div class="card"><div class="meta">${escapeHTML(card.subject)} · ${escapeHTML(card.theme)}</div>
      <div class="q">${escapeHTML(card.question)}</div>
      <div class="a" style="display:none">${escapeHTML(card.answer)}</div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn primary rate" data-rate="5">😊 Легко</button>
        <button class="btn ghost rate" data-rate="3">😐 Нормально</button>
        <button class="btn warn rate" data-rate="1">😣 Сложно</button>
      </div></div>`;
  }

  function attachReviewHandlers(card){
    const a = reviewList.querySelector('.a');
    const q = reviewList.querySelector('.q');
    q.addEventListener('click', ()=> { a.style.display = a.style.display === 'none' ? 'block' : 'none'; });
    reviewList.querySelectorAll('.rate').forEach(btn=>{
      btn.addEventListener('click', ()=> {
        const r = parseInt(btn.getAttribute('data-rate'));
        applySM2(card, r);
        // persist
        persistCardUpdate(card);
        toast('Оценено: ' + (r===5?'Легко': r===3?'Нормально':'Сложно'));
        reviewModal.style.display='none';
      });
    });
  }

  function applySM2(card, grade){
    // grade: 5 easy, 3 normal, 1 hard
    if(grade < 3){
      card.repetitions = 0;
      card.interval = 1;
    } else {
      card.repetitions = (card.repetitions||0) + 1;
      if(card.repetitions===1) card.interval = 1;
      else if(card.repetitions===2) card.interval = 3;
      else card.interval = Math.round((card.interval||1) * (card.ef||2.5));
    }
    // update efactor
    const q = grade;
    card.ef = (card.ef || 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if(card.ef < 1.3) card.ef = 1.3;
    card.lastReviewed = nowISO();
    // nextReview (days)
    const next = new Date();
    next.setDate(next.getDate() + (card.interval || 1));
    card.nextReview = next.toISOString();
  }

  function persistCardUpdate(card){
    const store = loadStore();
    for(const s of Object.keys(store.subjects||{})){
      for(const t of Object.keys(store.subjects[s].themes||{})){
        const idx = store.subjects[s].themes[t].findIndex(c=>c.id===card.id);
        if(idx!==-1){
          store.subjects[s].themes[t][idx] = card;
          saveStore(store); return;
        }
      }
    }
  }

  /* ---------- UI events ---------- */
  generateBtn.addEventListener('click', async ()=>{
    const subject = (subjectInput.value||'').trim() || 'Без предмета';
    const theme = (themeInput.value||'').trim() || 'Без темы';
    const text = (textInput.value||'').trim();
    if(!text){ toast('Введите текст темы или используйте AI-генерацию'); return; }
    const cards = await improvedCardGeneration(text, theme, subject);
    if(cards.length===0){ toast('Не удалось создать карты. Уточните текст.'); return; }
    addCardsToStore(cards);
    toast(`Добавлено ${cards.length} карточек в тему "${theme}"`);
    renderAllCards();
  });

  aiGenerateBtn.addEventListener('click', async ()=>{
    // take aiPrompt and/or text input. Use local AI fallback to generate a summarized text, then generate cards.
    const subject = (subjectInput.value||'').trim() || 'Без предмета';
    const theme = (themeInput.value||'').trim() || 'Без темы';
    const prompt = (aiPrompt.value||'').trim();
    let sourceText = (textInput.value||'').trim();
    if(!prompt && !sourceText){ toast('Введите запрос для AI или текст'); return; }
    // if prompt present use AI to produce detailed text
    const aiSource = prompt ? await generateAIResponse(prompt) : sourceText;
    // put generated text into textarea for user visibility
    textInput.value = aiSource;
    // then generate cards from aiSource
    const cards = await improvedCardGeneration(aiSource, theme, subject);
    addCardsToStore(cards);
    toast(`AI сгенерировал ${cards.length} карточек по теме "${theme}"`);
    renderAllCards();
  });

  catalogBtn.addEventListener('click', ()=> openCatalog());
  closeCatalog.addEventListener('click', ()=> catalogModal.style.display='none');
  reviewBtn.addEventListener('click', ()=> {
    // open review modal with due cards (nextReview <= now)
    const store = loadStore();
    let due = [];
    const now = new Date();
    for(const s of Object.keys(store.subjects||{})){
      for(const t of Object.keys(store.subjects[s].themes||{})){
        (store.subjects[s].themes[t]||[]).forEach(c=>{
          if(!c.nextReview) due.push(c);
          else if(new Date(c.nextReview) <= now) due.push(c);
        });
      }
    }
    if(due.length===0){ toast('Нет карточек, которым пора повторить'); return; }
    reviewList.innerHTML = '';
    due.forEach(card => {
      const div = document.createElement('div'); div.className='card';
      div.innerHTML = `<div class="meta">${escapeHTML(card.subject)} · ${escapeHTML(card.theme)}</div>
        <div class="q">${escapeHTML(card.question)}</div>
        <div class="a" style="display:none">${escapeHTML(card.answer)}</div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn primary rate" data-id="${card.id}" data-rate="5">😊 Легко</button>
          <button class="btn ghost rate" data-id="${card.id}" data-rate="3">😐 Нормально</button>
          <button class="btn warn rate" data-id="${card.id}" data-rate="1">😣 Сложно</button>
        </div>`;
      reviewList.appendChild(div);
      div.querySelector('.q').addEventListener('click', ()=> {
        const a = div.querySelector('.a'); a.style.display = a.style.display==='none'?'block':'none';
      });
      div.querySelectorAll('.rate').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const id = btn.getAttribute('data-id'); const rate = parseInt(btn.getAttribute('data-rate'));
          const store2 = loadStore();
          for(const s of Object.keys(store2.subjects||{})){
            for(const t of Object.keys(store2.subjects[s].themes||{})){
              const idx = store2.subjects[s].themes[t].findIndex(c=>c.id===id);
              if(idx!==-1){
                applySM2(store2.subjects[s].themes[t][idx], rate);
                saveStore(store2);
                toast('Оценка принята');
                // remove card from UI list
                reviewList.removeChild(div);
                return;
              }
            }
          }
        });
      });
    });
    reviewModal.style.display='flex';
  });

  closeReview.addEventListener('click', ()=> reviewModal.style.display='none');

  // Paste button: try to paste from clipboard (user gesture)
  pasteBtn && pasteBtn.addEventListener('click', async ()=>{
    try{
      const txt = await navigator.clipboard.readText();
      if(txt) textInput.value = txt;
      toast('Вставлено из буфера обмена');
    }catch(e){ toast('Ошибка доступа к буферу обмена'); }
  });

  /* ---------- helpers: render all cards (recently added) ---------- */
  function renderAllCards(){
    // show recent 20 cards across store
    const store = loadStore();
    const cards = [];
    for(const s of Object.keys(store.subjects||{})){
      for(const t of Object.keys(store.subjects[s].themes||{})){
        (store.subjects[s].themes[t]||[]).forEach(c => cards.push(c));
      }
    }
    // sort by created time inferred from id timestamp
    cards.sort((a,b)=> (b.id > a.id?1:-1));
    renderCardsList(cards.slice(0,50));
  }

  /* ---------- small utilities ---------- */
  function toast(msg){ console.log('Toast:',msg); /* minimal UI */ alert(msg); }

  /* ---------- init ---------- */
  function init(){
    // initial render
    renderAllCards();
    // close modals on background click
    [catalogModal, editModal, reviewModal].forEach(m=>{
      m && m.addEventListener('click', (e)=>{ if(e.target===m) m.style.display='none'; });
    });
  }

  init();

  // expose some functions to console for debugging (optional)
  window.jo = {
    loadStore, saveStore, improvedCardGeneration, renderAllCards
  };

})();
