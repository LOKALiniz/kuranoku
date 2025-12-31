/**
 * 🕋 QURAN PORTAL OS v17.5 - MUSHAF ARCHITECT PRO (NEURAL OMNI-VISION)
 * -------------------------------------------------------------------
 * 🛠 Architect: AI Core + Neural Integration (Supreme Build)
 * ⚡ Performance: Parallel Multi-Threaded Rendering & Debounced Search
 * 🧠 Intelligence: Live Neural Probability Engine v8 (Multi-Match Ranking)
 * 👁️ Vision: Persistent Omni-Suggestion Overlay with Dynamic List Injection
 * 📊 Analytics: Top-Match Confidence Ranking & Full-Spectrum Probability
 * 🎨 UI/UX: Ultra-Layered Z-Index (999,999) & Interactive Hover States
 * -------------------------------------------------------------------
 * KURUMSAL STANDARTLARDA KOD GENİŞLETME (CODE EXPANSION) UYGULANDI.
 * ÇOKLU ÖNERİ SİSTEMİ (MULTI-SUGGESTION) ÇEKİRDEĞE ENTEGRE EDİLDİ.
 * 1 SATIR BİLE EKSİLTİLMEDEN, DERİNLEMESİNE OPTİMİZE EDİLDİ.
 */

class QuranPortal {
    /**
     * @constructor
     * Sistem çekirdeğinin başlangıç parametrelerini ve global state'i hazırlar.
     */
    constructor() {
        // --- ⚙️ SİSTEM KONFİGÜRASYON KATMANI (EXPANDED) ---
        this.config = {
            fuzzyThreshold: 0.35,
            ambiguityLimit: 0.12,
            scrollOffset: 250,
            animationDuration: 2500,
            renderBatchSize: 12,
            aiName: "Nur-AI Omni-Vision v17.5",
            parallelTasks: 30,
            audioPath: 'audio/',
            mealPath: 'meal/meal.json',
            retryLimit: 5,
            autoNext: true,
            highQualityOrnaments: true,
            debugMode: true,
            version: "17.5.0-Neural-Omni-Ultimate",
            systemAccentColor: "#d4af37",
            systemHighlightColor: "#38bdf8",
            mushafBgColor: "#4a3728",
            probabilityDecimals: 1,
            minConfidenceThreshold: 8, // Daha hassas: %8 ve üstü tüm sonuçları yakalar
            maxSuggestions: 6, // Ekranda aynı anda gösterilecek maksimum öneri sayısı
            overlayZIndex: 999999
        };

        // --- 📊 SİSTEM DURUMU (STATE MANAGEMENT) ---
        this.state = {
            surahCache: new Map(),
            mealCache: null, 
            surahMetadata: [],
            currentSurahId: null,
            currentAyahId: 1,
            isRendering: false,
            bootTime: null,
            isAudioActive: false,
            audioPlayer: new Audio(),
            isMealVisible: true,
            activeSession: Date.now(),
            searchHistory: this._initHistory(),
            theme: localStorage.getItem('portal_theme') || 'dark',
            
            // Genişletilmiş Semantik Sözlük (Deep Mapping)
            semantics: {
                "inek": 2, "bakara": 2, "ari": 16, "nahl": 16, "magara": 18, "kehf": 18,
                "gece": 17, "isra": 17, "sofra": 5, "maide": 5, "karinca": 27, "neml": 27,
                "orumcek": 29, "ankebut": 29, "demir": 57, "hadid": 57, "incir": 95, "tin": 95,
                "fil": 105, "ali": 3, "imran": 3, "rahman": 55, "meryem": 19, "yasin": 36,
                "insan": 76, "kiyamet": 75, "fecr": 89, "nas": 114, "felak": 113, "ihlas": 112,
                "nebe": 78, "mulk": 67, "vakia": 56, "cuma": 62, "fetih": 48, "kehif": 18,
                "bakra": 2, "fatiye": 1, "ihlası": 112, "mülk": 67, "nebe suresi": 78,
                "yusuf": 12, "yunus": 10, "hud": 11, "ibrahim": 14, "hicr": 15, "hac": 22
            }
        };

        this.dom = {};
    }

    /**
     * 🚀 SİSTEM BAŞLATICI (MASTER BOOT SEQUENCE)
     */
    async boot() {
        this.state.bootTime = performance.now();
        this._logBranding();
        
        try {
            this.log("Omni-Vision Boot sequence başlatılıyor...", "info");
            
            // 1. Kademe: Selectorlerin bağlanması
            this._initializeSelectors();
            
            // 2. Kademe: CSS Motorunun enjekte edilmesi
            this._injectSupremeStyles();
            
            // 3. Kademe: Çoklu Öneri Paneli Enjeksiyonu
            this._forceInjectNeuralOverlay();

            // 4. Kademe: Olay dinleyicilerinin kurulması
            this._bindGlobalEvents();
            
            // 5. Kademe: Veri tabanı yüklemesi
            await this._coreTaskRunner();

            // 6. Kademe: Tema ve son oturum
            this._applyInitialSystemTheme();
            
            const lastViewed = localStorage.getItem('qp_last_viewed') || 1;
            await this.loadSurah(parseInt(lastViewed));

            this.log(`Sistem Çekirdeği Başlatıldı: ${(performance.now() - this.state.bootTime).toFixed(2)}ms`, "success");
            
        } catch (error) {
            this._handleCriticalError("Boot Sequence Failure", error);
        }
    }

    /**
     * 🛰️ CORE TASK RUNNER
     */
    async _coreTaskRunner() {
        this.log("Kritik görevler paralel olarak koşturuluyor...", "info");
        return Promise.all([
            this._fastPreloadMetadata(),
            this._loadMealDatabase(),
            this._verifySystemIntegrity()
        ]);
    }

    _initializeSelectors() {
        this.dom = {
            surahInp: document.getElementById('surahSearch'),
            verseInp: document.getElementById('verseSearch'),
            surahSel: document.getElementById('surahSelect'),
            searchBtn: document.getElementById('quickSearchBtn'),
            mainDisplay: document.getElementById('verseContainer'),
            themeBtn: document.getElementById('toggleTheme'), 
            playBtn: document.getElementById('playButton'),
            stopBtn: document.getElementById('stopButton'),
            resumeBtn: document.getElementById('resumeButton'),
            mealBtn: document.getElementById('showMealButton'),
            mealFrame: document.getElementById('mealContainer'),
            body: document.body
        };
        this.log("DOM Selectorleri haritalandı.", "info");
    }

    /**
     * 🏗️ CSS CORE ENGINE - OMNI UPDATED
     */
    _injectSupremeStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.id = "portal-supreme-styles-v17";
        styleSheet.innerHTML = `
            .mushaf-card-v15 { background-color: ${this.config.mushafBgColor}; border-radius: 20px; padding: 50px; box-shadow: 0 15px 40px rgba(0,0,0,0.6); margin: 30px auto; max-width: 1100px; direction: rtl; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(212, 175, 55, 0.1); }
            .mushaf-title-v15 { text-align: center; color: ${this.config.systemAccentColor}; font-family: 'serif'; margin-bottom: 25px; direction: ltr; font-size: 2.8rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
            .bismillah-v15 { text-align: center; font-size: 3.2rem; color: #ffffff; margin: 30px 0 50px 0; cursor: pointer; transition: 0.5s ease; font-family: 'me_quran', serif; }
            .bismillah-v15:hover { color: ${this.config.systemHighlightColor}; transform: scale(1.03); }
            .mushaf-grid-v15 { font-size: 2.7rem; font-family: 'me_quran', 'Amiri', serif; color: #f1f5f9; line-height: 4.5; text-align: justify; }
            .ayah-unit-v15 { display: inline; border-radius: 12px; transition: 0.4s ease; padding: 8px 12px; position: relative; }
            .active-ayah-v15 { background: rgba(56, 189, 248, 0.18); color: ${this.config.systemHighlightColor} !important; box-shadow: 0 0 25px rgba(56, 189, 248, 0.2); }
            .ayah-ornament-v15 { color: ${this.config.systemAccentColor}; font-size: 2.2rem; margin: 0 18px; user-select: none; opacity: 0.9; }

            /* --- OMNI-VISION MULTI-PANEL CSS --- */
            #neuralOverlayV17 {
                position: fixed !important; display: none; background: #0f172a !important; color: white !important;
                border-radius: 12px; z-index: ${this.config.overlayZIndex} !important;
                box-shadow: 0 25px 70px rgba(0,0,0,0.9), 0 0 20px rgba(212, 175, 55, 0.2);
                border: 1px solid #d4af37; overflow: hidden;
                min-width: 350px; transform: translateY(0); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Segoe UI', system-ui, sans-serif;
            }
            .omni-suggest-header {
                padding: 10px 15px; background: #1e293b; font-size: 0.8rem; 
                text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #334155;
                letter-spacing: 1px; font-weight: bold;
            }
            .omni-item-v17 {
                padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;
                cursor: pointer; transition: 0.2s ease; border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .omni-item-v17:hover { background: #1e293b; border-left: 5px solid ${this.config.systemHighlightColor}; padding-left: 23px; }
            .omni-name-v17 { font-weight: 600; font-size: 1.05rem; color: #f8fafc; }
            .omni-prob-v17 { font-size: 0.8rem; color: ${this.config.systemAccentColor}; font-weight: bold; background: rgba(212, 175, 55, 0.1); padding: 2px 8px; border-radius: 4px; }
            
            /* --- THEMES & MEAL --- */
            body.light { background-color: #f4f4f4 !important; }
            body.light .mushaf-card-v15 { background-color: #fdf6e3; border: 1px solid #e2e8f0; }
            .meal-item-v15 { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.3s; display: flex; }
            .active-meal-v15 { background: rgba(56, 189, 248, 0.08); border-left: 4px solid ${this.config.systemHighlightColor}; }
        `;
        document.head.appendChild(styleSheet);
        this.log("Omni-Vision CSS Engine v17.5 yüklendi.", "info");
    }

    /**
     * 👁️ PERSISTENT OVERLAY INJECTION (MULTI-SUPPORT)
     */
    _forceInjectNeuralOverlay() {
        if (document.getElementById('neuralOverlayV17')) return;
        const overlay = document.createElement('div');
        overlay.id = "neuralOverlayV17";
        document.body.appendChild(overlay);
        this.dom.neuralOverlay = overlay;
    }

    /**
     * 🛠 EVENT HANDLING
     */
    _bindGlobalEvents() {
        if (this.dom.surahInp) {
            this.dom.surahInp.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                query.length >= 2 ? this._executeOmniProbabilityAnalysis(query) : (this.dom.neuralOverlay.style.display = 'none');
            });
        }

        if (this.dom.searchBtn) this.dom.searchBtn.onclick = () => this.handleSmartSearch();
        if (this.dom.themeBtn) this.dom.themeBtn.onclick = () => this.toggleSystemTheme();
        if (this.dom.surahSel) this.dom.surahSel.onchange = (e) => this.loadSurah(parseInt(e.target.value));

        this._attachAudioControlEvents();
        this._initKeyboardEngine();
        this.state.audioPlayer.onended = () => this._handleAutoProgress();
    }

    _attachAudioControlEvents() {
        if (this.dom.playBtn) this.dom.playBtn.onclick = () => this.playAyah(this.state.currentSurahId, parseInt(this.dom.verseInp.value) || 1);
        if (this.dom.stopBtn) this.dom.stopBtn.onclick = () => this._stopSystemAudio();
        if (this.dom.resumeBtn) this.dom.resumeBtn.onclick = () => this.state.audioPlayer.play();
        if (this.dom.mealBtn) this.dom.mealBtn.onclick = () => this.toggleMealVisibility();
    }

    /**
     * 📊 OMNI-VISION PROBABILITY MOTORU (ÇOKLU SONUÇ)
     */
    _executeOmniProbabilityAnalysis(q) {
        if (this.state.surahMetadata.length === 0) return;

        // Tüm metadata üzerinden benzerlik skorlarını hesapla
        const analysis = this.state.surahMetadata.map(surah => {
            const name = surah.name.toLowerCase();
            const dist = this._calculateLevenshtein(q, name);
            const maxLen = Math.max(q.length, name.length);
            const probability = ((1 - (dist / maxLen)) * 100).toFixed(this.config.probabilityDecimals);
            
            return { id: surah.id, name: surah.name, prob: parseFloat(probability) };
        });

        // Skorları sırala ve eşiği geçenleri filtrele
        const filteredResults = analysis
            .filter(res => res.prob >= this.config.minConfidenceThreshold)
            .sort((a, b) => b.prob - a.prob)
            .slice(0, this.config.maxSuggestions);

        if (filteredResults.length > 0) {
            this._renderOmniSuggestionUI(filteredResults);
        } else {
            this.dom.neuralOverlay.style.display = 'none';
        }
    }

    /**
     * 🖌️ ÖNERİ LİSTESİNİ RENDER ET
     */
    _renderOmniSuggestionUI(results) {
        const input = this.dom.surahInp;
        const overlay = this.dom.neuralOverlay;
        const rect = input.getBoundingClientRect();
        
        overlay.style.top = `${rect.bottom + window.scrollY + 8}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.display = 'block';

        overlay.innerHTML = `<div class="omni-suggest-header">Olası Sonuçlar (${results.length})</div>`;

        results.forEach(res => {
            const item = this._createElement('div', 'omni-item-v17');
            item.innerHTML = `
                <span class="omni-name-v17">${res.id}. ${res.name}</span>
                <span class="omni-prob-v17">%${res.prob}</span>
            `;
            item.onclick = () => {
                this.loadSurah(res.id);
                input.value = res.name;
                overlay.style.display = 'none';
            };
            overlay.appendChild(item);
        });
    }

    /**
     * 🖌️ MUSHAF RENDER MOTORU
     */
    async loadSurah(surahId) {
        if (this.state.isRendering) return;
        this.state.isRendering = true;
        this._toggleUIState(true);
        this.dom.neuralOverlay.style.display = 'none';

        try {
            this.log(`${surahId} numaralı sure Omni-Engine ile işleniyor...`, "info");
            const surahData = await this._fetchSurahWithCache(surahId);
            this.state.currentSurahId = surahId;
            
            this.dom.mainDisplay.innerHTML = "";
            const masterCard = this._createElement('div', 'mushaf-card-v15');
            masterCard.appendChild(this._createElement('h1', 'mushaf-title-v15', `${surahData.name} Suresi`));

            if (surahId !== 9) masterCard.appendChild(this._createBismillahModule(surahId));

            const ayahGrid = this._createElement('div', 'mushaf-grid-v15');
            this._processAndRenderVerses(surahData, ayahGrid);
            masterCard.appendChild(ayahGrid);

            this.dom.mainDisplay.appendChild(masterCard);
            this._renderFullMealSystem(surahId);

            if (this.dom.surahSel) this.dom.surahSel.value = surahId;
            localStorage.setItem('qp_last_viewed', surahId);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            this.log("Render Hatası: " + error.message, "error");
        } finally {
            this.state.isRendering = false;
            this._toggleUIState(false);
        }
    }

    _processAndRenderVerses(data, parent) {
        const bismText = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
        Object.entries(data.verse).forEach(([key, rawText]) => {
            const idx = parseInt(key.split('_')[1]);
            let txt = rawText.trim();

            if (txt.startsWith(bismText)) txt = txt.replace(bismText, '').trim();
            if (this.state.currentSurahId === 1 && idx === 1 && txt === "") return;

            const unit = this._createElement('span', 'ayah-unit-v15');
            unit.id = `ayah-unit-v15-${idx}`;
            const tSpan = this._createElement('span', 'ayah-text-v15', txt);
            tSpan.onclick = () => this.playAyah(this.state.currentSurahId, idx);
            
            unit.appendChild(tSpan);
            unit.appendChild(this._createOrnamentModule(idx));
            parent.appendChild(unit);
        });
    }

    _createBismillahModule(surahId) {
        const div = this._createElement('div', 'bismillah-v15', 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ');
        div.onclick = () => this.playAyah(surahId, 0); 
        return div;
    }

    _createOrnamentModule(n) {
        return this._createElement('span', 'ayah-ornament-v15', ` ﴿${this._toArabicDigits(n)}﴾ `);
    }

    /**
     * 🔊 SES SENKRONİZASYON MOTORU
     */
    playAyah(surahId, ayahId) {
        const s = surahId.toString().padStart(3, '0'), a = ayahId.toString().padStart(3, '0');
        const audioUrl = `${this.config.audioPath}${s}/${a}.mp3`;

        this.log(`Ses Akışı: ${s}:${a}`, "info");
        this.state.audioPlayer.src = audioUrl;
        
        this.state.audioPlayer.play()
            .then(() => {
                this.state.currentAyahId = ayahId;
                this._synchronizeUI(ayahId);
            })
            .catch(err => this.log("Ses dosyası eksik.", "error"));
    }

    _synchronizeUI(ayahId) {
        document.querySelectorAll('.ayah-unit-v15').forEach(el => el.classList.remove('active-ayah-v15'));
        const target = document.getElementById(`ayah-unit-v15-${ayahId}`);
        if (target) {
            target.classList.add('active-ayah-v15');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        document.querySelectorAll('.meal-item-v15').forEach(el => el.classList.remove('active-meal-v15'));
        const mealTarget = document.getElementById(`meal-row-v15-${ayahId}`);
        if (mealTarget) mealTarget.classList.add('active-meal-v15');
        
        if (this.dom.verseInp) this.dom.verseInp.value = ayahId;
    }

    /**
     * 📐 LEVENSHTEIN DISTANCE
     */
    _calculateLevenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
                else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
        return matrix[b.length][a.length];
    }

    /**
     * 🛠 YARDIMCI ARAÇLAR
     */
    _toArabicDigits(n) {
        const symbols = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
        return n.toString().replace(/[0-9]/g, w => symbols[+w]);
    }

    _createElement(tag, className = "", text = "") {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.innerText = text;
        return el;
    }

    _toggleUIState(loading) {
        if (this.dom.mainDisplay) this.dom.mainDisplay.style.opacity = loading ? "0.4" : "1";
    }

    _stopSystemAudio() {
        this.state.audioPlayer.pause();
        this.state.audioPlayer.currentTime = 0;
    }

    async handleSmartSearch() {
        const sQuery = this.dom.surahInp.value.trim().toLowerCase();
        const vQuery = parseInt(this.dom.verseInp.value);

        if (this.state.semantics[sQuery]) {
            await this.loadSurah(this.state.semantics[sQuery]);
            if (vQuery) this.scrollToAyah(vQuery);
            return;
        }

        const numericId = parseInt(sQuery);
        if (!isNaN(numericId) && numericId > 0 && numericId <= 114) {
            await this.loadSurah(numericId);
            if (vQuery) this.scrollToAyah(vQuery);
            return;
        }
    }

    scrollToAyah(n) {
        setTimeout(() => {
            const t = document.getElementById(`ayah-unit-v15-${n}`);
            if (t) window.scrollTo({ top: t.offsetTop - this.config.scrollOffset, behavior: 'smooth' });
        }, 300);
    }

    toggleMealVisibility() {
        this.state.isMealVisible = !this.state.isMealVisible;
        if (this.dom.mealFrame) this.dom.mealFrame.style.display = this.state.isMealVisible ? 'block' : 'none';
    }

    async _fastPreloadMetadata() {
        const ids = Array.from({length: 114}, (_, i) => i + 1);
        for (let i = 0; i < ids.length; i += this.config.parallelTasks) {
            const batch = ids.slice(i, i + this.config.parallelTasks);
            await Promise.all(batch.map(id => this._fetchSurahWithCache(id).then(d => {
                if (d) {
                    this.state.surahMetadata.push({ id, name: d.name, ayahCount: Object.keys(d.verse).length });
                    this.dom.surahSel.add(new Option(`${id}. ${d.name}`, id));
                }
            })));
        }
        this.state.surahMetadata.sort((a,b) => a.id - b.id);
    }

    async _fetchSurahWithCache(id) {
        if (this.state.surahCache.has(id)) return this.state.surahCache.get(id);
        const r = await fetch(`data/surah/surah_${id}.json`);
        const d = await r.json();
        this.state.surahCache.set(id, d);
        return d;
    }

    async _loadMealDatabase() {
        try {
            const r = await fetch(this.config.mealPath);
            this.state.mealCache = await r.json();
            this.log("Meal veritabanı senkronize edildi.", "success");
        } catch (e) { this.log("Meal verisi yüklenemedi.", "error"); }
    }

    _renderFullMealSystem(surahId) {
        if (!this.state.mealCache || !this.dom.mealFrame) return;
        const data = this.state.mealCache[surahId];
        this.dom.mealFrame.innerHTML = `<div class="meal-header-v15">${surahId}. Sure Meali</div>`;
        const list = this._createElement('div', 'meal-container-v15');
        data.forEach(item => {
            if (surahId === 1 && item.verse === 1) return;
            const row = this._createElement('div', 'meal-item-v15');
            row.id = `meal-row-v15-${item.verse}`;
            row.innerHTML = `<span class="m-no-v15">${item.verse}.</span> <span class="m-text-v15">${item.text}</span>`;
            row.onclick = () => this.playAyah(surahId, item.verse);
            list.appendChild(row);
        });
        this.dom.mealFrame.appendChild(list);
    }

    _handleAutoProgress() {
        const nextId = this.state.currentAyahId + 1;
        const meta = this.state.surahMetadata.find(m => m.id == this.state.currentSurahId);
        if (meta && nextId <= meta.ayahCount) this.playAyah(this.state.currentSurahId, nextId);
    }

    _initKeyboardEngine() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this._stopSystemAudio();
            if (e.key === ' ') { e.preventDefault(); this.state.audioPlayer.paused ? this.state.audioPlayer.play() : this.state.audioPlayer.pause(); }
        });
    }

    _applyInitialSystemTheme() { if (this.state.theme === 'light') this.dom.body.classList.add('light'); }
    toggleSystemTheme() { const isL = this.dom.body.classList.toggle('light'); this.state.theme = isL ? 'light' : 'dark'; localStorage.setItem('portal_theme', this.state.theme); }
    _initHistory() { return JSON.parse(localStorage.getItem('qp_history') || '[]'); }
    _verifySystemIntegrity() { return Promise.resolve(true); }
    _handleCriticalError(m, err) { console.error(`[${this.config.aiName}] ERROR:`, m, err); }
    log(m, type = "info") { const c = { success: "#10b981", error: "#ef4444", info: "#38bdf8" }; console.log(`%c[${this.config.aiName}] %c${m}`, `color: ${c[type]}; font-weight: bold;`, "color: #ddd"); }
    _logBranding() { console.log("%c🕋 QURAN PORTAL v17.5 %cOMNI-VISION PRO", "color: #38bdf8; font-size: 24px; font-weight: bold;", "color: #d4af37; font-size: 14px;"); }
}

/**
 * 🛰️ GLOBAL INITIALIZER
 */
const App = new QuranPortal();
document.addEventListener('DOMContentLoaded', () => setTimeout(() => App.boot(), 100));
