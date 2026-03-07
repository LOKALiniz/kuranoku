/**
 * 🕋 QURAN PORTAL OS v18.0 - FIREBASE EDITION
 * Firebase Auth + Firestore + Kelime Tooltip + Meal Düzeltmesi
 */

class QuranPortal {
    constructor() {
        this.config = {
            fuzzyThreshold: 0.35,
            ambiguityLimit: 0.12,
            scrollOffset: 250,
            animationDuration: 2500,
            renderBatchSize: 12,
            aiName: "Nur-AI v18.0",
            parallelTasks: 30,
            audioPath: 'audio/',
            mealPath: 'meal/meal.json',
            retryLimit: 5,
            autoNext: true,
            version: "18.0.0-Firebase",
            systemAccentColor: "#d4af37",
            systemHighlightColor: "#38bdf8",
            mushafBgColor: "#4a3728",
            probabilityDecimals: 1,
            minConfidenceThreshold: 8,
            maxSuggestions: 6,
            overlayZIndex: 999999
        };

        this.state = {
            surahCache: new Map(),
            mealCache: null,
            surahMetadata: [],
            currentSurahId: null,
            currentAyahId: 1,
            isRendering: false,
            bootTime: null,
            audioPlayer: new Audio(),
            isMealVisible: true,
            theme: localStorage.getItem('portal_theme') || 'dark',
            currentUser: null,
            authMode: 'login', // 'login' | 'register'
            // 🎤 KARAOKE
            karaokeActive: false,
            karaokeTimings: null,   // { "1:1": [[wordIdx, startMs, endMs], ...], ... }
            karaokeRAF: null,       // requestAnimationFrame handle
            karaokeCurrentKey: null,
            semantics: {
                "inek": 2, "bakara": 2, "ari": 16, "nahl": 16, "magara": 18, "kehf": 18,
                "gece": 17, "isra": 17, "sofra": 5, "maide": 5, "karinca": 27, "neml": 27,
                "orumcek": 29, "ankebut": 29, "demir": 57, "hadid": 57, "incir": 95, "tin": 95,
                "fil": 105, "ali": 3, "imran": 3, "rahman": 55, "meryem": 19, "yasin": 36,
                "insan": 76, "kiyamet": 75, "fecr": 89, "nas": 114, "felak": 113, "ihlas": 112,
                "nebe": 78, "mulk": 67, "vakia": 56, "cuma": 62, "fetih": 48,
                "bakra": 2, "fatiye": 1, "yusuf": 12, "yunus": 10, "hud": 11,
                "ibrahim": 14, "hicr": 15, "hac": 22
            }
        };

        // Basit Arapça → Türkçe kelime sözlüğü
        this.wordDict = {
            "اللَّهِ": "Allah'ın", "اللَّهُ": "Allah", "الرَّحْمَنِ": "Rahman (çok merhametli)",
            "الرَّحِيمِ": "Rahim (çok bağışlayıcı)", "بِسْمِ": "adıyla", "الْحَمْدُ": "Hamd (övgü)",
            "رَبِّ": "Rabbi (Rabb'i)", "الْعَالَمِينَ": "âlemlerin", "مَالِكِ": "sahibi/hükümdarı",
            "يَوْمِ": "günün", "الدِّينِ": "din/hesap", "إِيَّاكَ": "yalnız sana",
            "نَعْبُدُ": "ibadet ederiz", "وَإِيَّاكَ": "ve yalnız senden", "نَسْتَعِينُ": "yardım isteriz",
            "اهْدِنَا": "bizi hidayet et", "الصِّرَاطَ": "yolu", "الْمُسْتَقِيمَ": "doğru",
            "قُلْ": "De ki", "هُوَ": "O", "أَحَدٌ": "birdir/tektir", "الصَّمَدُ": "Samed (hiçbir şeye muhtaç olmayan)",
            "لَمْ": "değil/olmadı", "يَلِدْ": "doğurmadı", "وَلَمْ": "ve olmadı",
            "يُولَدْ": "doğurulmadı", "كُفُوًا": "denk/eşit", "آمَنَ": "iman etti",
            "الْكِتَابِ": "Kitab'a", "نُورٌ": "nur/ışık", "رَحْمَةٌ": "rahmet/merhamet",
            "عَلِيمٌ": "çok bilen", "حَكِيمٌ": "hüküm sahibi/hikmet sahibi",
            "خَبِيرٌ": "haberdar olan", "قَدِيرٌ": "gücü yeten", "غَفُورٌ": "bağışlayan",
            "السَّمَاوَاتِ": "göklerin", "الْأَرْضِ": "yerin/toprağın", "خَلَقَ": "yarattı",
            "النَّاسِ": "insanların", "الْجِنِّ": "cinlerin", "الشَّيْطَانِ": "şeytanın",
            "الْمُؤْمِنِينَ": "müminlerin", "الْمُتَّقِينَ": "takva sahiplerinin",
            "يَا": "Ey", "أَيُّهَا": "ey", "لَا": "hayır/yok/değil",
            "إِلَٰهَ": "ilah", "إِلَّا": "ancak/sadece", "مُحَمَّدٌ": "Muhammed",
            "رَسُولُ": "elçisi/resulü", "صَلَاةَ": "namazı", "زَكَاةَ": "zekâtı",
            "الْجَنَّةَ": "cennete", "النَّارَ": "ateşe/cehenneme"
        };

        this.dom = {};
        this.hifz = null;
        this.quiz = null;
        this.match = null;
        this.zikr = { count: 0, current: '', currentTr: '', total: 0 };
    }

    // ============================================================
    // 🔥 FİREBASE AUTH SİSTEMİ
    // ============================================================

    _waitForFirebase(cb) {
        if (window.FirebaseAuth) { cb(); return; }
        let tries = 0;
        const interval = setInterval(() => {
            tries++;
            if (window.FirebaseAuth) { clearInterval(interval); cb(); }
            else if (tries > 50) { clearInterval(interval); this._showAuthWithoutFirebase(); }
        }, 100);
    }

    _showAuthWithoutFirebase() {
        // Firebase config girilmemişse uyarı göster
        document.getElementById('authError').textContent = '⚠️ firebase-init.js dosyasına firebaseConfig ekleyin!';
        document.getElementById('authError').classList.remove('hidden');
    }

    _initFirebaseAuth() {
        const { auth, onAuthStateChanged } = window.FirebaseAuth;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.state.currentUser = user;
                if (window.FirebaseAuth && window.FirebaseAuth.saveUserProfile) {
                    window.FirebaseAuth.saveUserProfile(user);
                }
                this._showApp(user);
                // Presence — online kullanıcı sayısı
                this._initPresence(user.uid, user.displayName || user.email?.split('@')[0] || 'Kullanıcı');
                // Admin yetkisi var mı kontrol et
                this._checkAdminPrivilege(user.uid);
                // Admin notu var mı?
                this._checkUserNote(user.uid);
            } else {
                this.state.currentUser = null;
                this._showAuthScreen();
            }
        });

        // Tab geçişleri
        document.getElementById('tabLogin').onclick = () => this._switchAuthTab('login');
        document.getElementById('tabRegister').onclick = () => this._switchAuthTab('register');
        document.getElementById('authSubmitBtn').onclick = () => this._handleAuthSubmit();
        document.getElementById('authGoogleBtn').onclick = () => this._handleGoogleLogin();

        // Sağ üst auth butonları
        const topLoginBtn = document.getElementById('topLoginBtn');
        const topRegisterBtn = document.getElementById('topRegisterBtn');
        const authModalCloseBtn = document.getElementById('authModalClose');
        const authModalOverlay = document.getElementById('authModal');
        const statsLoginBtn = document.getElementById('statsLoginBtn');

        if (topLoginBtn) topLoginBtn.onclick = () => this.openAuthModal('login');
        if (topRegisterBtn) topRegisterBtn.onclick = () => this.openAuthModal('register');
        if (authModalCloseBtn) authModalCloseBtn.onclick = () => this.closeAuthModal();
        if (authModalOverlay) authModalOverlay.onclick = (e) => { if(e.target===authModalOverlay) this.closeAuthModal(); };
        if (statsLoginBtn) statsLoginBtn.onclick = () => this.openAuthModal('login');
    }

    _switchAuthTab(mode) {
        this.state.authMode = mode;
        const isLogin = mode === 'login';
        document.getElementById('tabLogin').classList.toggle('active', isLogin);
        document.getElementById('tabRegister').classList.toggle('active', !isLogin);
        document.getElementById('authPasswordConfirm').classList.toggle('hidden', isLogin);
        document.getElementById('authSubmitBtn').textContent = isLogin ? 'Giriş Yap' : 'Kayıt Ol';
        document.getElementById('authSubtitle').textContent = isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun';
        document.getElementById('authError').classList.add('hidden');
    }

    async _handleAuthSubmit() {
        const { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.FirebaseAuth;
        const email = document.getElementById('authEmail').value.trim();
        const pass = document.getElementById('authPassword').value;
        const pass2 = document.getElementById('authPasswordConfirm').value;
        const errEl = document.getElementById('authError');

        errEl.classList.add('hidden');
        if (!email || !pass) { this._showAuthError('E-posta ve şifre gerekli.'); return; }

        if (this.state.authMode === 'register') {
            if (pass !== pass2) { this._showAuthError('Şifreler eşleşmiyor!'); return; }
            if (pass.length < 6) { this._showAuthError('Şifre en az 6 karakter olmalı.'); return; }
        }

        this._setAuthLoading(true);
        try {
            if (this.state.authMode === 'login') {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                await createUserWithEmailAndPassword(auth, email, pass);
            }
        } catch (e) {
            this._setAuthLoading(false);
            this._showAuthError(this._translateFirebaseError(e.code));
        }
    }

    async _handleGoogleLogin() {
        const { auth, googleProvider, signInWithPopup } = window.FirebaseAuth;
        this._setAuthLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e) {
            this._setAuthLoading(false);
            this._showAuthError(this._translateFirebaseError(e.code));
        }
    }

    _showAuthError(msg) {
        const el = document.getElementById('authError');
        el.textContent = msg;
        el.classList.remove('hidden');
    }

    _setAuthLoading(loading) {
        document.getElementById('authForm').style.display = loading ? 'none' : 'block';
        document.getElementById('authLoading').classList.toggle('hidden', !loading);
    }

    _translateFirebaseError(code) {
        const map = {
            'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
            'auth/wrong-password': 'Şifre yanlış.',
            'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
            'auth/invalid-email': 'Geçersiz e-posta adresi.',
            'auth/weak-password': 'Şifre çok zayıf.',
            'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.',
            'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı.',
            'auth/network-request-failed': 'Ağ bağlantısı hatası.'
        };
        return map[code] || 'Bir hata oluştu: ' + code;
    }

    _showApp(user) {
        const name = user.displayName || user.email.split('@')[0];
        // Modal kapat
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.add('hidden');
        // Top bar güncelle
        const topBtns = document.getElementById('topAuthButtons');
        const topUser = document.getElementById('topUserInfo');
        const topName = document.getElementById('topUserName');
        if (topBtns) topBtns.classList.add('hidden');
        if (topUser) topUser.classList.remove('hidden');
        if (topName) topName.textContent = '👤 ' + name;
        // Çıkış butonu
        const logoutBtn = document.getElementById('topLogoutBtn');
        if (logoutBtn) logoutBtn.onclick = () => window.FirebaseAuth.signOut(window.FirebaseAuth.auth);
        // İstatistik paneli içeriği göster
        const statsPrompt = document.getElementById('statsLoginPrompt');
        const statsContent = document.getElementById('statsContent');
        if (statsPrompt) statsPrompt.classList.add('hidden');
        if (statsContent) statsContent.classList.remove('hidden');
    }

    _showAuthScreen() {
        // Modal AÇMA - sadece top bar güncelle
        const topBtns = document.getElementById('topAuthButtons');
        const topUser = document.getElementById('topUserInfo');
        if (topBtns) topBtns.classList.remove('hidden');
        if (topUser) topUser.classList.add('hidden');
        // İstatistik paneli prompt göster
        const statsPrompt = document.getElementById('statsLoginPrompt');
        const statsContent = document.getElementById('statsContent');
        if (statsPrompt) statsPrompt.classList.remove('hidden');
        if (statsContent) statsContent.classList.add('hidden');
        this._setAuthLoading(false);
    }

    openAuthModal(mode) {
        const modal = document.getElementById('authModal');
        if (modal) { modal.classList.remove('hidden'); this._switchAuthTab(mode||'login'); }
    }

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.add('hidden');
        document.getElementById('authError').classList.add('hidden');
    }

    // ============================================================
    // 🔥 FİREBASE İSTATİSTİK KAYDETME
    // ============================================================

    async _loadStats() {
        if (!this.state.currentUser || !window.FirebaseAuth) {
            return JSON.parse(localStorage.getItem('qp_stats') || '{}');
        }
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const ref = doc(db, 'users', this.state.currentUser.uid);
            const snap = await getDoc(ref);
            return snap.exists() ? (snap.data().stats || {}) : {};
        } catch (e) {
            return JSON.parse(localStorage.getItem('qp_stats') || '{}');
        }
    }

    async _saveStats(stats) {
        localStorage.setItem('qp_stats', JSON.stringify(stats));
        if (!this.state.currentUser || !window.FirebaseAuth) return;
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            const ref = doc(db, 'users', this.state.currentUser.uid);
            await setDoc(ref, { stats }, { merge: true });
        } catch (e) { /* sessiz hata */ }
    }

    // ============================================================
    // 🚀 BOOT
    // ============================================================

    async boot() {
        this.state.bootTime = performance.now();
        this._logBranding();

        try {
            this._initializeSelectors();
            this._injectSupremeStyles();
            this._forceInjectNeuralOverlay();
            this._bindGlobalEvents();
            this._initBubbleMenu();

            await this._coreTaskRunner();

            this._applyInitialSystemTheme();
            this._initFontSpeedControls();
            this._initStatsSystem();
            this._initZikrSystem();
            this._initGamesSystem();

            // Firebase hazır olunca auth başlat
            this._waitForFirebase(() => {
                this._initFirebaseAuth();
            });

            const lastViewed = localStorage.getItem('qp_last_viewed') || 1;
            await this.loadSurah(parseInt(lastViewed));
            await this._renderDailyVerse();
            this._loadSiteBanner();
            this._loadPinnedMessageFromFirebase();
            this._initVerseSearch();
            this._initAutoTheme();
            setTimeout(() => this._loadLastPosition(), 2000);
            this._scheduleNotification(JSON.parse(localStorage.getItem('qp_notif')||'{"enabled":false}'));
            this._initPWAInstall();
            this._initOfflineDetection();

            this.log(`Boot tamamlandı: ${(performance.now() - this.state.bootTime).toFixed(2)}ms`, "success");
        } catch (error) {
            this._handleCriticalError("Boot Failure", error);
        }
    }

    async _coreTaskRunner() {
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
            hifzBtn: document.getElementById('hifzButton'),
            hifzPanel: document.getElementById('hifzPanel'),
            hifzStartVerse: document.getElementById('hifzStartVerse'),
            hifzRepeatCount: document.getElementById('hifzRepeatCount'),
            hifzStartBtn: document.getElementById('hifzStartBtn'),
            hifzStopBtn: document.getElementById('hifzStopBtn'),
            hifzStatus: document.getElementById('hifzStatus'),
            hifzStatusText: document.getElementById('hifzStatusText'),
            statsBtn: document.getElementById('statsButton'),
            statsPanel: document.getElementById('statsPanel'),
            zikrBtn: document.getElementById('zikrButton'),
            zikrPanel: document.getElementById('zikrPanel'),
            gamesBtn: document.getElementById('gamesButton'),
            gamesPanel: document.getElementById('gamesPanel'),
            prayerBtn: document.getElementById('prayerButton'),
            prayerPanel: document.getElementById('prayerPanel'),
            duaBtn: document.getElementById('duaButton'),
            duaPanel: document.getElementById('duaPanel'),
            bookmarkBtn: document.getElementById('bookmarkButton'),
            bookmarkPanel: document.getElementById('bookmarkPanel'),
            searchVerseBtn: document.getElementById('searchVerseButton'),
            searchVersePanel: document.getElementById('searchVersePanel'),
            badgeBtn: document.getElementById('badgeButton'),
            badgePanel: document.getElementById('badgePanel'),
            calendarBtn: document.getElementById('calendarButton'),
            calendarPanel: document.getElementById('calendarPanel'),
            shareBtn: document.getElementById('shareButton'),
            sharePanel: document.getElementById('sharePanel'),
            // Yeni butonlar
            tefsirBtn: document.getElementById('tefsirButton'),
            tefsirPanel: document.getElementById('tefsirPanel'),
            esmaBtn: document.getElementById('esmaButton'),
            esmaPanel: document.getElementById('esmaPanel'),
            leaderboardBtn: document.getElementById('leaderboardButton'),
            leaderboardPanel: document.getElementById('leaderboardPanel'),
            hatimBtn: document.getElementById('hatimButton'),
            hatimPanel: document.getElementById('hatimPanel'),
            notifBtn: document.getElementById('notifButton'),
            offlineBtn: document.getElementById('offlineButton'),
            notifPanel: document.getElementById('notifPanel'),
            fontSlider: document.getElementById('fontSizeSlider'),
            fontVal: document.getElementById('fontSizeVal'),
            speedSlider: document.getElementById('speedSlider'),
            speedVal: document.getElementById('speedVal'),
            tooltip: document.getElementById('wordTooltip'),
            body: document.body
        };
    }

    _injectSupremeStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.id = "portal-supreme-styles-v18";
        styleSheet.innerHTML = `
            .mushaf-card-v15 { background-color: ${this.config.mushafBgColor}; border-radius: 20px; padding: 50px; box-shadow: 0 15px 40px rgba(0,0,0,0.6); margin: 30px auto; max-width: 1100px; direction: rtl; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(212, 175, 55, 0.1); }
            .mushaf-title-v15 { text-align: center; color: ${this.config.systemAccentColor}; font-family: serif; margin-bottom: 25px; direction: ltr; font-size: 2.8rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
            .bismillah-v15 { text-align: center; font-size: 3.2rem; color: #d4af37; margin: 30px 0 50px 0; cursor: pointer; transition: 0.5s ease; font-family: 'Amiri Quran', serif; }
            .bismillah-v15:hover { color: #f59e0b; transform: scale(1.03); }
            body.light .bismillah-v15 { color: #92400e !important; }
            .mushaf-grid-v15 { font-size: 2.7rem; font-family: 'Amiri Quran', serif; color: #f1e8d5; line-height: 4.5; text-align: justify; }
            body.light .mushaf-grid-v15 { color: #1a0a00 !important; }
            .ayah-unit-v15 { display: inline; border-radius: 12px; transition: 0.4s ease; padding: 8px 12px; position: relative; }
            .active-ayah-v15 { background: rgba(56, 189, 248, 0.18); color: ${this.config.systemHighlightColor} !important; box-shadow: 0 0 25px rgba(56, 189, 248, 0.2); }
            .ayah-ornament-v15 { color: ${this.config.systemAccentColor}; font-size: 2.2rem; margin: 0 18px; user-select: none; opacity: 0.9; }
            .ayah-word { display: inline; cursor: pointer; border-radius: 4px; transition: background 0.15s; padding: 2px 1px; }
            .ayah-word:hover { background: rgba(174,226,255,0.15); }
            #neuralOverlayV17 { position: fixed !important; display: none; background: #0f172a !important; color: white !important; border-radius: 12px; z-index: ${this.config.overlayZIndex} !important; box-shadow: 0 25px 70px rgba(0,0,0,0.9); border: 1px solid #d4af37; overflow: hidden; min-width: 350px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-family: 'Segoe UI', system-ui, sans-serif; }
            .omni-suggest-header { padding: 10px 15px; background: #1e293b; font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #334155; letter-spacing: 1px; font-weight: bold; }
            .omni-item-v17 { padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s ease; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .omni-item-v17:hover { background: #1e293b; border-left: 5px solid ${this.config.systemHighlightColor}; padding-left: 23px; }
            .omni-name-v17 { font-weight: 600; font-size: 1.05rem; color: #f8fafc; }
            .omni-prob-v17 { font-size: 0.8rem; color: ${this.config.systemAccentColor}; font-weight: bold; background: rgba(212,175,55,0.1); padding: 2px 8px; border-radius: 4px; }
            body.light .mushaf-card-v15 { background-color: #fdf6e3; border: 1px solid #e2e8f0; }
            .meal-item-v15 { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.3s; display: flex; gap: 10px; align-items: flex-start; }
            .active-meal-v15 { background: rgba(56,189,248,0.08); border-left: 4px solid ${this.config.systemHighlightColor}; }
            .m-no-v15 { color: ${this.config.systemAccentColor}; min-width: 30px; font-weight: bold; font-family: sans-serif; font-size: 0.95rem; }
            .m-text-v15 { color: #e2e8f0; font-family: sans-serif; font-size: 1rem; line-height: 1.7; direction: ltr; }
            .meal-header-v15 { color: ${this.config.systemAccentColor}; font-size: 1.2rem; padding: 16px 20px; border-bottom: 1px solid rgba(212,175,55,0.2); font-family: sans-serif; }
            .hifz-active-ayah { background: rgba(100,220,120,0.18) !important; color: #6ee7b7 !important; box-shadow: 0 0 20px rgba(100,220,120,0.25) !important; }
        `;
        document.head.appendChild(styleSheet);
    }

    _forceInjectNeuralOverlay() {
        if (document.getElementById('neuralOverlayV17')) return;
        const overlay = document.createElement('div');
        overlay.id = "neuralOverlayV17";
        document.body.appendChild(overlay);
        this.dom.neuralOverlay = overlay;
    }

    _bindGlobalEvents() {
        if (this.dom.surahInp) {
            this.dom.surahInp.addEventListener('input', (e) => {
                const q = e.target.value.trim().toLowerCase();
                q.length >= 2 ? this._executeOmniProbabilityAnalysis(q) : (this.dom.neuralOverlay.style.display = 'none');
            });
        }
        if (this.dom.searchBtn) this.dom.searchBtn.onclick = () => this.handleSmartSearch();
        if (this.dom.themeBtn) this.dom.themeBtn.onclick = () => this.toggleSystemTheme();
        if (this.dom.surahSel) this.dom.surahSel.onchange = (e) => this.loadSurah(parseInt(e.target.value));
        this._attachAudioControlEvents();
        this._initKeyboardEngine();
        this.state.audioPlayer.onended = () => this._handleAutoProgress();

        // Dışarı tıklayınca overlay'i kapat
        document.addEventListener('click', (e) => {
            if (this.dom.neuralOverlay && !this.dom.surahInp.contains(e.target)) {
                this.dom.neuralOverlay.style.display = 'none';
            }
        });
    }

    _attachAudioControlEvents() {
        if (this.dom.playBtn) this.dom.playBtn.onclick = () => this.playAyah(this.state.currentSurahId, parseInt(this.dom.verseInp.value) || 1);
        if (this.dom.stopBtn) this.dom.stopBtn.onclick = () => this._stopSystemAudio();
        if (this.dom.resumeBtn) this.dom.resumeBtn.onclick = () => {
            // Eğer ses zaten yüklüyse ve duraklatılmışsa devam ettir
            if (this.state.currentSurahId && !this.state.audioPlayer.paused) return;
            if (this.state.currentSurahId && this.state.audioPlayer.src && this.state.audioPlayer.paused) {
                this.state.audioPlayer.play();
                return;
            }
            // Yoksa kayıtlı pozisyondan başlat
            this._resumeReading();
        };
        if (this.dom.mealBtn) this.dom.mealBtn.onclick = () => this._scrollToMeal();
        if (this.dom.hifzBtn) this.dom.hifzBtn.onclick = () => this._togglePanel('hifzPanel');
        if (this.dom.hifzStartBtn) this.dom.hifzStartBtn.onclick = () => this._startHifzMode();
        if (this.dom.hifzStopBtn) this.dom.hifzStopBtn.onclick = () => this._stopHifzMode();
        if (this.dom.statsBtn) this.dom.statsBtn.onclick = () => this._togglePanel('statsPanel');
        if (this.dom.zikrBtn) this.dom.zikrBtn.onclick = () => this._togglePanel('zikrPanel');
        if (this.dom.gamesBtn) this.dom.gamesBtn.onclick = () => this._togglePanel('gamesPanel');
        if (this.dom.prayerBtn) this.dom.prayerBtn.onclick = () => { this._togglePanel('prayerPanel'); if (!document.getElementById('prayerPanel').classList.contains('hidden')) this._initPrayerPanel(); };
        if (this.dom.duaBtn) this.dom.duaBtn.onclick = () => { this._togglePanel('duaPanel'); if (!document.getElementById('duaPanel').classList.contains('hidden')) this._initDuaPanel(); };
        if (this.dom.bookmarkBtn) this.dom.bookmarkBtn.onclick = () => { this._togglePanel('bookmarkPanel'); if (!document.getElementById('bookmarkPanel').classList.contains('hidden')) this._renderBookmarks(); };
        if (this.dom.searchVerseBtn) this.dom.searchVerseBtn.onclick = () => { this._togglePanel('searchVersePanel'); setTimeout(()=>{ const i=document.getElementById('verseSearchInput'); if(i)i.focus(); },100); };
        if (this.dom.badgeBtn) this.dom.badgeBtn.onclick = () => { this._togglePanel('badgePanel'); if (!document.getElementById('badgePanel').classList.contains('hidden')) this._renderBadges(); };
        if (this.dom.calendarBtn) this.dom.calendarBtn.onclick = () => { this._togglePanel('calendarPanel'); if (!document.getElementById('calendarPanel').classList.contains('hidden')) this._renderCalendar(); };
        if (this.dom.shareBtn) this.dom.shareBtn.onclick = () => { this._togglePanel('sharePanel'); if (!document.getElementById('sharePanel').classList.contains('hidden')) this._initSharePanel(); };
        // Yeni paneller
        if (this.dom.tefsirBtn) this.dom.tefsirBtn.onclick = () => { this._togglePanel('tefsirPanel'); if (!document.getElementById('tefsirPanel').classList.contains('hidden')) this._initTefsirPanel(this.state.currentSurahId, this.state.currentAyahId||1); };
        if (this.dom.esmaBtn) this.dom.esmaBtn.onclick = () => { this._togglePanel('esmaPanel'); if (!document.getElementById('esmaPanel').classList.contains('hidden')) this._initEsmaPanel(); };
        if (this.dom.leaderboardBtn) this.dom.leaderboardBtn.onclick = () => { this._togglePanel('leaderboardPanel'); if (!document.getElementById('leaderboardPanel').classList.contains('hidden')) this._initLeaderboard(); };
        if (this.dom.hatimBtn) this.dom.hatimBtn.onclick = () => { this._togglePanel('hatimPanel'); if (!document.getElementById('hatimPanel').classList.contains('hidden')) this._initHatimGroup(); };
        if (this.dom.notifBtn) this.dom.notifBtn.onclick = () => { this._togglePanel('notifPanel'); if (!document.getElementById('notifPanel').classList.contains('hidden')) this._initNotifications(); };
        if (this.dom.offlineBtn) this.dom.offlineBtn.onclick = () => { this._togglePanel('offlinePanel'); if (!document.getElementById('offlinePanel').classList.contains('hidden')) this._initOfflinePanel(); };
        // Bubble page 2 extra butonlar
        const adminBtn2 = document.getElementById('bubbleAdminBtn');
        if (adminBtn2) adminBtn2.onclick = () => { document.getElementById('adminPanelOverlay')?.classList.remove('hidden'); setTimeout(close,80); };
        const profileBtn = document.getElementById('bubbleProfileBtn');
        if (profileBtn) profileBtn.onclick = () => { this._showToast('👤 Profil yakında eklenecek!', '#38bdf8'); };
        const themeBtn2 = document.getElementById('bubbleTheme2Btn');
        if (themeBtn2) themeBtn2.onclick = () => { this.toggleSystemTheme(); setTimeout(close,80); };
    }

    _togglePanel(panelId) {
        ['hifzPanel','statsPanel','zikrPanel','gamesPanel','prayerPanel','duaPanel','bookmarkPanel','searchVersePanel','badgePanel','calendarPanel','sharePanel','tefsirPanel','esmaPanel','leaderboardPanel','hatimPanel','notifPanel','offlinePanel'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === panelId) {
                el.classList.toggle('hidden');
                if (!el.classList.contains('hidden') && id === 'statsPanel') this._refreshStats();
            } else {
                el.classList.add('hidden');
            }
        });
    }

    _scrollToMeal() {
        const mealEl = document.getElementById('inlineMealBlock');
        if (mealEl) mealEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ============================================================
    // 📊 OMNI-VISION ARAMA MOTORU
    // ============================================================

    _normStr(s) {
        // Türkçe + yaygın yazım hatalarını normalize et
        return s.toLowerCase()
            .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
            .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
            .replace(/â/g,'a').replace(/î/g,'i').replace(/û/g,'u')
            .replace(/[^a-z0-9]/g,'');
    }

    _executeOmniProbabilityAnalysis(q) {
        if (this.state.surahMetadata.length === 0) return;
        const qN = this._normStr(q);

        // Semantics map'de direkt eşleşme
        if (this.state.semantics[q.toLowerCase()]) {
            const sid = this.state.semantics[q.toLowerCase()];
            const found = this.state.surahMetadata.find(m => m.id === sid);
            if (found) {
                this._renderOmniSuggestionUI([{ id: found.id, name: found.name, prob: 100, badge: 'Anlam Eşleşmesi' }]);
                return;
            }
        }

        const analysis = this.state.surahMetadata.map(surah => {
            const nameN = this._normStr(surah.name);
            let prob = 0;

            // 1) Tam eşleşme → 100
            if (nameN === qN) { prob = 100; }
            // 2) Başlangıç eşleşmesi → yüksek bonus
            else if (nameN.startsWith(qN)) { prob = 80 + (qN.length / nameN.length) * 18; }
            // 3) İçinde geçiyor → orta bonus
            else if (nameN.includes(qN)) { prob = 65 + (qN.length / nameN.length) * 15; }
            // 4) Levenshtein mesafesi
            else {
                const dist = this._calculateLevenshtein(qN, nameN);
                const maxLen = Math.max(qN.length, nameN.length);
                prob = (1 - dist / maxLen) * 100;
                // Kısmi örtüşme bonus: ilk N karakter eşleşiyorsa
                const overlap = Math.min(qN.length, nameN.length);
                let matchCount = 0;
                for (let i = 0; i < overlap; i++) { if (qN[i] === nameN[i]) matchCount++; }
                prob += (matchCount / overlap) * 15;
            }

            return { id: surah.id, name: surah.name, prob: Math.min(100, Math.round(prob * 10) / 10) };
        });

        const filtered = analysis
            .filter(r => r.prob >= 10)
            .sort((a, b) => b.prob - a.prob)
            .slice(0, 8);

        filtered.length > 0
            ? this._renderOmniSuggestionUI(filtered)
            : (this.dom.neuralOverlay.style.display = 'none');
    }

    _renderOmniSuggestionUI(results) {
        const input = this.dom.surahInp;
        const overlay = this.dom.neuralOverlay;
        const rect = input.getBoundingClientRect();
        overlay.style.top = `${rect.bottom + window.scrollY + 8}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.display = 'block';
        overlay.innerHTML = `<div class="omni-suggest-header">Sonuçlar (${results.length})</div>`;
        results.forEach(res => {
            const item = this._createElement('div', 'omni-item-v17');
            item.innerHTML = `<span class="omni-name-v17">${res.id}. ${res.name}</span><span class="omni-prob-v17">%${res.prob}</span>`;
            item.onclick = () => { this.loadSurah(res.id); input.value = res.name; overlay.style.display = 'none'; };
            overlay.appendChild(item);
        });
    }

    // ============================================================
    // 🖌️ MUSHAF RENDER MOTORU
    // ============================================================

    async loadSurah(surahId) {
        if (this.state.isRendering) return;
        this.state.isRendering = true;
        this._toggleUIState(true);
        this.dom.neuralOverlay.style.display = 'none';

        try {
            const surahData = await this._fetchSurahWithCache(surahId);
            if (!surahData) {
                this.dom.mainDisplay.innerHTML = `<div style="color:#f87171;font-family:sans-serif;text-align:center;padding:40px;font-size:1rem">⚠️ Sure yüklenemedi. İnternet bağlantınızı kontrol edin veya sayfayı yenileyin.</div>`;
                return;
            }
            this.state.currentSurahId = surahId;
            this.dom.mainDisplay.innerHTML = "";

            const masterCard = this._createElement('div', 'mushaf-card-v15');
            masterCard.appendChild(this._createElement('h1', 'mushaf-title-v15', `${surahData.name} Suresi`));
            if (surahId !== 9) masterCard.appendChild(this._createBismillahModule(surahId));

            const ayahGrid = this._createElement('div', 'mushaf-grid-v15');
            this._processAndRenderVerses(surahData, ayahGrid);
            masterCard.appendChild(ayahGrid);
            this.dom.mainDisplay.appendChild(masterCard);

            // Meal inline render
            this._renderFullMealSystem(surahId);

            if (this.dom.surahSel) this.dom.surahSel.value = surahId;
            localStorage.setItem('qp_last_viewed', surahId);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // İstatistik: açılan sure
            this._loadStats().then(stats => {
                const set = new Set(stats.surahsOpened || []);
                set.add(surahId);
                stats.surahsOpened = [...set];
                this._saveStats(stats);
            });

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

            // Her kelimeyi ayrı span'a böl → tooltip için
            const wordsContainer = document.createElement('span');
            wordsContainer.className = 'ayah-text-v15';
            const words = txt.split(' ');
            words.forEach((word, wi) => {
                if (!word) return;
                const wSpan = document.createElement('span');
                wSpan.className = 'ayah-word';
                wSpan.textContent = word + (wi < words.length - 1 ? ' ' : '');
                wSpan.dataset.word = word;

                // Hover → tooltip göster
                wSpan.addEventListener('mouseenter', (e) => this._showWordTooltip(e, word));
                wSpan.addEventListener('mouseleave', () => this._hideWordTooltip());
                // Mobil: dokunuş → tooltip
                wSpan.addEventListener('touchstart', (e) => { e.preventDefault(); this._showWordTooltip(e.touches[0], word); }, { passive: false });
                wSpan.addEventListener('touchend', () => setTimeout(() => this._hideWordTooltip(), 2000));

                wordsContainer.appendChild(wSpan);
            });

            // Çift tıklama ile ses çal, uzun basma ile yer imi
            let clickTimer = null;
            let longPressTimer = null;
            wordsContainer.addEventListener('click', () => {
                if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; this.playAyah(this.state.currentSurahId, idx); }
                else { clickTimer = setTimeout(() => { clickTimer = null; }, 350); }
            });
            // Uzun basma = yer imi ekle
            unit.addEventListener('mousedown', () => {
                longPressTimer = setTimeout(() => { this._addBookmark(this.state.currentSurahId, idx); }, 700);
            });
            unit.addEventListener('mouseup', () => clearTimeout(longPressTimer));
            unit.addEventListener('touchstart', () => { longPressTimer = setTimeout(() => this._addBookmark(this.state.currentSurahId, idx), 700); }, { passive: true });
            unit.addEventListener('touchend', () => clearTimeout(longPressTimer));

            unit.appendChild(wordsContainer);
            unit.appendChild(this._createOrnamentModule(idx));
            parent.appendChild(unit);
        });
    }

    // ============================================================
    // 💬 KELİME TOOLTIP SİSTEMİ (DÜZELTİLDİ)
    // ============================================================

    _showWordTooltip(e, word) {
        const tooltip = this.dom.tooltip;
        if (!tooltip) return;

        // Sözlükte ara — tam eşleşme ya da kısmi
        let meaning = this.wordDict[word];
        if (!meaning) {
            // Harekesiz karşılaştırma (diakritikleri temizle)
            const clean = word.replace(/[\u064B-\u065F\u0670]/g, '');
            for (const [k, v] of Object.entries(this.wordDict)) {
                if (k.replace(/[\u064B-\u065F\u0670]/g, '') === clean) { meaning = v; break; }
            }
        }

        if (!meaning) return; // Sözlükte yoksa tooltip gösterme

        tooltip.textContent = meaning;
        tooltip.classList.remove('hidden');

        const x = (e.clientX || e.pageX) + window.scrollX;
        const y = (e.clientY || e.pageY) + window.scrollY;
        tooltip.style.left = Math.min(x - 20, window.innerWidth - 200) + 'px';
        tooltip.style.top = (y - 40) + 'px';
    }

    _hideWordTooltip() {
        if (this.dom.tooltip) this.dom.tooltip.classList.add('hidden');
    }

    // ============================================================
    // 📖 MEAL SİSTEMİ (DÜZELTİLDİ - 1. ayetten başlar)
    // ============================================================

    _renderFullMealSystem(surahId) {
        if (!this.state.mealCache) { console.warn('Meal cache yok'); return; }
        const data = this.state.mealCache[surahId];
        if (!data || !data.length) { console.warn('Sure meali bulunamadı:', surahId); return; }

        const old = document.getElementById('inlineMealBlock');
        if (old) old.remove();

        const block = document.createElement('div');
        block.id = 'inlineMealBlock';
        block.className = 'meal-inline';

        const title = document.createElement('div');
        title.className = 'meal-inline-title';
        title.textContent = `📖 ${surahId}. Sure — Türkçe Meal`;
        block.appendChild(title);

        // ✅ LTR container - Türkçe soldan sağa yazılsın
        const list = document.createElement('div');
        list.className = 'meal-container-v15';
        list.style.direction = 'ltr';

        // Sadece Fatiha sure 1 için verse 1 atla (besmele)
        // Diğer TÜM sureler verse 1'den başlar
        data.forEach(item => {
            if (surahId === 1 && item.verse === 1) return;

            const row = document.createElement('div');
            row.className = 'meal-item-v15';
            row.id = `meal-row-v15-${item.verse}`;
            row.style.direction = 'ltr';

            const numSpan = document.createElement('span');
            numSpan.className = 'm-no-v15';
            numSpan.textContent = item.verse + '.';

            const textSpan = document.createElement('span');
            textSpan.className = 'm-text-v15';
            textSpan.dir = 'ltr';
            textSpan.style.direction = 'ltr';
            textSpan.style.textAlign = 'left';
            textSpan.style.display = 'block';
            textSpan.textContent = item.text || '';

            row.appendChild(numSpan);
            row.appendChild(textSpan);
            row.onclick = () => this.playAyah(surahId, item.verse);
            list.appendChild(row);
        });

        block.appendChild(list);

        const vc = this.dom.mainDisplay;
        if (vc && vc.parentNode) vc.parentNode.insertBefore(block, vc.nextSibling);
        if (this.dom.mealFrame) this.dom.mealFrame.classList.add('hidden');
    }

    // ============================================================
    // 🔊 SES SİSTEMİ
    // ============================================================

    playAyah(surahId, ayahId) {
        const s = surahId.toString().padStart(3, '0'), a = ayahId.toString().padStart(3, '0');
        this.state.audioPlayer.src = `${this.config.audioPath}${s}/${a}.mp3`;
        this.state.audioPlayer.playbackRate = parseFloat(localStorage.getItem('qp_speed') || '1');
        this.state.audioPlayer.play()
            .then(() => {
                this.state.currentAyahId = ayahId;
                this._synchronizeUI(ayahId);
                this._trackAyahPlayed(surahId);
                if (ayahId > 0) this._saveReadingPosition(surahId, ayahId);
                // 🎤 Karaoke
                if (this.state.karaokeActive && ayahId > 0) {
                    this._startKaraokeForAyah(surahId, ayahId);
                }
            })
            .catch(() => this.log("Ses dosyası eksik.", "error"));
    }

    _synchronizeUI(ayahId) {
        document.querySelectorAll('.ayah-unit-v15').forEach(el => el.classList.remove('active-ayah-v15'));
        const target = document.getElementById(`ayah-unit-v15-${ayahId}`);
        if (target) { target.classList.add('active-ayah-v15'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        document.querySelectorAll('.meal-item-v15').forEach(el => el.classList.remove('active-meal-v15'));
        const mealTarget = document.getElementById(`meal-row-v15-${ayahId}`);
        if (mealTarget) mealTarget.classList.add('active-meal-v15');
        if (this.dom.verseInp) this.dom.verseInp.value = ayahId;
    }

    async _trackAyahPlayed(surahId) {
        const stats = await this._loadStats();
        const prevCount = stats.ayahCount || 0;
        stats.ayahCount = prevCount + 1;
        const set = new Set(stats.surahsOpened || []);
        const prevSurahs = set.size;
        set.add(surahId);
        stats.surahsOpened = [...set];
        const today = new Date().toDateString();
        if (stats.goalDate !== today) { stats.goalDate = today; stats.todayAyahs = 0; }
        stats.todayAyahs = (stats.todayAyahs || 0) + 1;
        await this._saveStats(stats);
        // 🎊 Kilometre taşı kutlaması
        const milestones = {100:'100 ayet dinlediniz! 🎵', 500:'500 ayet! Harika! ⭐', 1000:'1000 ayet! Muhteşem! 🌟'};
        if (milestones[stats.ayahCount]) this._showCelebration(milestones[stats.ayahCount]);
        if (set.size !== prevSurahs) {
            const sureMilestones = {1:'İlk sureyi açtınız! 🌱', 10:'10 sure! 📖', 57:'Yarı Kur\'an! 🌙', 114:'HATİM! Tebrikler! 🏆'};
            if (sureMilestones[set.size]) this._showCelebration(sureMilestones[set.size]);
        }
    }

    _handleAutoProgress() {
        const nextId = this.state.currentAyahId + 1;
        const meta = this.state.surahMetadata.find(m => m.id == this.state.currentSurahId);
        if (meta && nextId <= meta.ayahCount) this.playAyah(this.state.currentSurahId, nextId);
    }

    // ============================================================
    // 🎤 KARAOKE — KELİME KELİME VURGULAMA
    // ============================================================

    async _toggleKaraoke() {
        this.state.karaokeActive = !this.state.karaokeActive;
        const btn = document.getElementById('karaokeToggleBtn');
        if (btn) {
            btn.style.background = this.state.karaokeActive ? '#d4af37' : '';
            btn.textContent = this.state.karaokeActive ? '🎤 Karaoke: Açık' : '🎤 Karaoke: Kapalı';
        }
        // Bubble menu karaoke butonunu da güncelle
        const menuBtn = document.getElementById('karaokeMenuBtn');
        if (menuBtn) {
            const icon = menuBtn.querySelector('.bubble-btn-icon');
            const label = menuBtn.querySelector('.bubble-btn-label');
            if (icon) icon.textContent = this.state.karaokeActive ? '🎤' : '🎤';
            if (label) label.textContent = this.state.karaokeActive ? 'Karaoke ✓' : 'Karaoke';
            menuBtn.style.background = this.state.karaokeActive ? 'rgba(212,175,55,0.2)' : '';
            menuBtn.style.borderColor = this.state.karaokeActive ? '#d4af37' : '';
        }
        if (this.state.karaokeActive) {
            // Şu an çalan ayet varsa hemen başlat
            if (!this.state.audioPlayer.paused && this.state.currentSurahId && this.state.currentAyahId > 0) {
                await this._startKaraokeForAyah(this.state.currentSurahId, this.state.currentAyahId);
            }
            this._showToast('🎤 Karaoke modu açıldı', '#d4af37');
        } else {
            this._stopKaraoke();
            this._showToast('🎤 Karaoke modu kapatıldı', '#64748b');
        }
    }

    async _loadKaraokeTiming(surahId) {
        // Zaten yüklüyse tekrar yükleme
        if (this.state.karaokeTimings && this.state.karaokeTimings._surahId === surahId) {
            return this.state.karaokeTimings;
        }
        try {
            // Quran Foundation API — reciter 7 = Mishary Alafasy (segments destekliyor)
            const reciterId = 7;
            const url = `https://api.quran.com/api/v4/recitations/${reciterId}/by_chapter/${surahId}?per_page=300&fields=segments`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API hatası');
            const json = await res.json();
            // audio_files dizisini verse_key → segments map'ine çevir
            const map = { _surahId: surahId };
            (json.audio_files || []).forEach(af => {
                if (af.segments && af.segments.length) {
                    map[af.verse_key] = af.segments; // [[wordIdx, startMs, endMs], ...]
                }
            });
            this.state.karaokeTimings = map;
            return map;
        } catch (e) {
            // API başarısız → eşit dağılım fallback
            return null;
        }
    }

    async _startKaraokeForAyah(surahId, ayahId) {
        // Önceki RAF'ı temizle
        if (this.state.karaokeRAF) cancelAnimationFrame(this.state.karaokeRAF);
        this._clearWordHighlights();

        const timings = await this._loadKaraokeTiming(surahId);
        const verseKey = `${surahId}:${ayahId}`;
        this.state.karaokeCurrentKey = verseKey;

        const unit = document.getElementById(`ayah-unit-v15-${ayahId}`);
        if (!unit) return;
        const wordSpans = unit.querySelectorAll('.ayah-word');
        if (!wordSpans.length) return;

        let segments = timings ? timings[verseKey] : null;

        // Fallback: segment yoksa eşit böl
        if (!segments || !segments.length) {
            const audio = this.state.audioPlayer;
            // Ayetin toplam süresini bilmiyoruz, tahmini yap
            const totalWords = wordSpans.length;
            const dur = audio.duration || 5;
            const msPerWord = (dur * 1000) / totalWords;
            segments = Array.from({length: totalWords}, (_, i) => [i + 1, i * msPerWord, (i + 1) * msPerWord]);
        }

        // Segment map: wordIndex (1-based) → {start, end} ms
        const segMap = {};
        segments.forEach(([wi, start, end]) => { segMap[wi] = { start, end }; });

        const audio = this.state.audioPlayer;
        let lastHighlighted = -1;

        const tick = () => {
            if (!this.state.karaokeActive || this.state.karaokeCurrentKey !== verseKey) return;
            if (audio.paused) { this.state.karaokeRAF = requestAnimationFrame(tick); return; }

            const nowMs = audio.currentTime * 1000;
            let found = -1;
            for (let i = 1; i <= wordSpans.length; i++) {
                const seg = segMap[i];
                if (seg && nowMs >= seg.start && nowMs <= seg.end) { found = i - 1; break; }
            }

            if (found !== lastHighlighted) {
                wordSpans.forEach((s, i) => {
                    s.classList.toggle('karaoke-active', i === found);
                    s.classList.toggle('karaoke-past', i < found);
                });
                lastHighlighted = found;
            }
            this.state.karaokeRAF = requestAnimationFrame(tick);
        };
        this.state.karaokeRAF = requestAnimationFrame(tick);
    }

    _stopKaraoke() {
        if (this.state.karaokeRAF) { cancelAnimationFrame(this.state.karaokeRAF); this.state.karaokeRAF = null; }
        this._clearWordHighlights();
    }

    _clearWordHighlights() {
        document.querySelectorAll('.karaoke-active, .karaoke-past').forEach(el => {
            el.classList.remove('karaoke-active', 'karaoke-past');
        });
    }

    _stopSystemAudio() {
        this.state.audioPlayer.pause();
        // Karaoke durdur
        if (this.state.karaokeActive) this._stopKaraoke();
        // currentTime sıfırlanmıyor — Devam Et kaldığı yerden başlar
    }

    // ============================================================
    // 🧠 HAFIZLIK MODU
    // ============================================================

    _startHifzMode() {
        const meta = this.state.surahMetadata.find(m => m.id == this.state.currentSurahId);
        if (!meta) { alert('Lütfen önce bir sure seçin!'); return; }
        const repeatCount = Math.min(100, Math.max(1, parseInt(this.dom.hifzRepeatCount.value) || 3));
        const startVerse = Math.max(1, parseInt(this.dom.hifzStartVerse.value) || 1);
        this.hifz = { active: true, surahId: this.state.currentSurahId, ayahCount: meta.ayahCount, currentVerse: startVerse, repeatTotal: repeatCount, repeatDone: 0 };
        this._stopSystemAudio();
        this.state.audioPlayer.onended = () => this._hifzOnAyahEnd();
        this.dom.hifzPanel.classList.add('hidden');
        this._hifzUpdateStatus();
        this.dom.hifzStatus.classList.remove('hidden');
        this._hifzPlayCurrent();
        this._loadStats().then(stats => { stats.hifzCount = (stats.hifzCount || 0) + 1; this._saveStats(stats); });
    }

    _hifzPlayCurrent() {
        if (!this.hifz || !this.hifz.active) return;
        this._hifzHighlight(this.hifz.currentVerse);
        this.playAyah(this.hifz.surahId, this.hifz.currentVerse);
        this._hifzUpdateStatus();
    }

    _hifzOnAyahEnd() {
        if (!this.hifz || !this.hifz.active) return;
        this.hifz.repeatDone++;
        if (this.hifz.repeatDone < this.hifz.repeatTotal) { this._hifzUpdateStatus(); setTimeout(() => this._hifzPlayCurrent(), 600); }
        else { this.hifz.repeatDone = 0; this.hifz.currentVerse++; if (this.hifz.currentVerse > this.hifz.ayahCount) this._hifzFinish(); else { this._hifzUpdateStatus(); setTimeout(() => this._hifzPlayCurrent(), 800); } }
    }

    _hifzHighlight(ayahId) {
        document.querySelectorAll('.ayah-unit-v15').forEach(el => el.classList.remove('active-ayah-v15', 'hifz-active-ayah'));
        const target = document.getElementById(`ayah-unit-v15-${ayahId}`);
        if (target) { target.classList.add('hifz-active-ayah'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        if (this.dom.verseInp) this.dom.verseInp.value = ayahId;
    }

    _hifzUpdateStatus() {
        if (!this.hifz || !this.dom.hifzStatusText) return;
        const { currentVerse, repeatDone, repeatTotal, ayahCount } = this.hifz;
        this.dom.hifzStatusText.innerHTML = `<strong>${currentVerse}. Ayet</strong> &nbsp;|&nbsp; Tekrar: <strong>${repeatDone + 1} / ${repeatTotal}</strong> &nbsp;|&nbsp; İlerleme: <strong>${currentVerse} / ${ayahCount}</strong>`;
    }

    _hifzFinish() {
        this.hifz.active = false;
        this._stopSystemAudio();
        this.state.audioPlayer.onended = () => this._handleAutoProgress();
        document.querySelectorAll('.hifz-active-ayah').forEach(el => el.classList.remove('hifz-active-ayah'));
        if (this.dom.hifzStatusText) this.dom.hifzStatusText.innerHTML = '✅ Sure tamamlandı! Tebrikler 🎉';
    }

    _stopHifzMode() {
        if (this.hifz) this.hifz.active = false;
        this._stopSystemAudio();
        this.state.audioPlayer.onended = () => this._handleAutoProgress();
        document.querySelectorAll('.hifz-active-ayah').forEach(el => el.classList.remove('hifz-active-ayah'));
        if (this.dom.hifzStatus) this.dom.hifzStatus.classList.add('hidden');
        this.dom.hifzPanel.classList.remove('hidden');
    }

    // ============================================================
    // ⚡ YAZIT BOYUTU & HIZ
    // ============================================================

    _initFontSpeedControls() {
        const { fontSlider, fontVal, speedSlider, speedVal } = this.dom;
        const savedFont = parseFloat(localStorage.getItem('qp_fontsize') || '2.7');
        const savedSpeed = parseFloat(localStorage.getItem('qp_speed') || '1');
        if (fontSlider) {
            fontSlider.value = savedFont;
            if (fontVal) fontVal.textContent = savedFont.toFixed(1) + 'rem';
            this._applyFontSize(savedFont);
            fontSlider.oninput = () => {
                const v = parseFloat(fontSlider.value);
                this._applyFontSize(v);
                if (fontVal) fontVal.textContent = v.toFixed(1) + 'rem';
                localStorage.setItem('qp_fontsize', v);
            };
        }
        if (speedSlider) {
            speedSlider.value = savedSpeed;
            if (speedVal) speedVal.textContent = savedSpeed + 'x';
            speedSlider.oninput = () => {
                const v = parseFloat(speedSlider.value);
                this.state.audioPlayer.playbackRate = v;
                if (speedVal) speedVal.textContent = v + 'x';
                localStorage.setItem('qp_speed', v);
            };
        }
    }

    _applyFontSize(size) {
        let s = document.getElementById('dynamic-font-style');
        if (!s) { s = document.createElement('style'); s.id = 'dynamic-font-style'; document.head.appendChild(s); }
        s.innerHTML = `.mushaf-grid-v15 { font-size: ${size}rem !important; } .bismillah-v15 { font-size: ${size * 1.18}rem !important; }`;
    }

    // ============================================================
    // 📊 İSTATİSTİK SİSTEMİ
    // ============================================================

    _initStatsSystem() {
        setInterval(() => {
            if (!this.state.audioPlayer.paused) {
                this._loadStats().then(stats => {
                    stats.listenSeconds = (stats.listenSeconds || 0) + 1;
                    this._saveStats(stats);
                });
            }
        }, 5000); // Her 5 saniyede bir kaydet (Firebase limitini aşmamak için)

        const setGoalBtn = document.getElementById('setGoalBtn');
        if (setGoalBtn) setGoalBtn.onclick = async () => {
            const v = parseInt(document.getElementById('dailyGoalInput').value) || 10;
            const stats = await this._loadStats();
            stats.dailyGoal = v;
            await this._saveStats(stats);
            this._refreshStats();
        };

        const resetBtn = document.getElementById('resetStatsBtn');
        if (resetBtn) resetBtn.onclick = async () => {
            if (confirm('Tüm istatistikler silinsin mi?')) {
                await this._saveStats({});
                this._refreshStats();
            }
        };
    }

    async _refreshStats() {
        const s = await this._loadStats();
        const el = (id) => document.getElementById(id);
        const totalMin = Math.floor((s.listenSeconds || 0) / 60);
        if (el('statListenTime')) el('statListenTime').textContent = totalMin < 60 ? totalMin + ' dk' : Math.floor(totalMin/60) + 's ' + (totalMin%60) + 'dk';
        if (el('statAyahCount')) el('statAyahCount').textContent = s.ayahCount || 0;
        if (el('statSurahCount')) el('statSurahCount').textContent = (s.surahsOpened || []).length;
        if (el('statHifzCount')) el('statHifzCount').textContent = s.hifzCount || 0;
        const goal = s.dailyGoal || 10;
        const today = new Date().toDateString();
        const todayAyahs = s.goalDate === today ? (s.todayAyahs || 0) : 0;
        if (el('dailyGoalInput')) el('dailyGoalInput').value = goal;
        if (el('dailyGoalTarget')) el('dailyGoalTarget').textContent = goal;
        if (el('dailyGoalStatus')) el('dailyGoalStatus').textContent = `${todayAyahs} / ${goal} ayet`;
        const pct = Math.min(100, Math.round((todayAyahs / goal) * 100));
        if (el('goalBarFill')) el('goalBarFill').style.width = pct + '%';
    }

    // ============================================================
    // 📿 ZİKİR MATİK
    // ============================================================

    _initZikrSystem() {
        this.zikr = { count: 0, current: '', currentTr: '', total: parseInt(localStorage.getItem('qp_zikr_total') || '0') };
        document.getElementById('zikrTotal').textContent = this.zikr.total;

        document.querySelectorAll('.zikr-preset').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.zikr-preset').forEach(b => b.classList.remove('active-zikr'));
                btn.classList.add('active-zikr');
                this.zikr.current = btn.dataset.zikr;
                this.zikr.currentTr = btn.dataset.tr;
                this.zikr.count = 0;
                document.getElementById('zikrArabic').textContent = btn.dataset.zikr;
                document.getElementById('zikrTr').textContent = btn.dataset.tr;
                document.getElementById('zikrCount').textContent = '0';
                document.getElementById('zikrProgressFill').style.width = '0%';
            };
        });

        document.getElementById('zikrTapBtn').onclick = () => {
            if (!this.zikr.current) { document.getElementById('zikrArabic').style.color='#f87171'; setTimeout(()=>document.getElementById('zikrArabic').style.color='',500); return; }
            this.zikr.count++;
            this.zikr.total++;
            localStorage.setItem('qp_zikr_total', this.zikr.total);
            const base = parseInt(document.getElementById('zikrTarget').value) || 33;
            // Tur bazlı ilerleme: 33→66→99→...
            const turNo = Math.floor((this.zikr.count - 1) / base); // 0-indexed tur
            const inTur = this.zikr.count - turNo * base;           // bu turdaki sayı
            const pct = Math.min(100, (inTur / base) * 100);
            document.getElementById('zikrCount').textContent = this.zikr.count;
            document.getElementById('zikrTotal').textContent = this.zikr.total;
            document.getElementById('zikrProgressFill').style.width = pct + '%';
            // Tura ulaşıldı
            if (this.zikr.count % base === 0) {
                const turTamamlandi = this.zikr.count / base;
                document.getElementById('zikrCount').style.color = '#6ee7b7';
                const msgEl = document.getElementById('zikrMilestoneMsg');
                if (msgEl) { msgEl.textContent = `🎉 ${turTamamlandi}. tur • Toplam: ${this.zikr.count}`; msgEl.style.opacity='1'; setTimeout(()=>{ msgEl.style.opacity='0'; },2000); }
                setTimeout(() => { document.getElementById('zikrCount').style.color = '#aee2ff'; }, 1500);
            }
        };

        document.getElementById('zikrResetBtn').onclick = () => {
            this.zikr.count = 0;
            document.getElementById('zikrCount').textContent = '0';
            document.getElementById('zikrProgressFill').style.width = '0%';
            const msgEl = document.getElementById('zikrMilestoneMsg');
            if (msgEl) { msgEl.textContent=''; msgEl.style.opacity='0'; }
        };
    }

    // ============================================================
    // 🎮 OYUNLAR
    // ============================================================

    _initGamesSystem() {
        document.getElementById('startQuizBtn').onclick = () => this._startQuiz();
        document.getElementById('startMatchBtn').onclick = () => this._startMatch();
        document.getElementById('startCountBtn').onclick = () => this._startCountGame();
        document.getElementById('startHangmanBtn').onclick = () => this._startHangman();
        document.getElementById('startMemoryBtn').onclick = () => this._startMemory();
        document.getElementById('startOrderBtn').onclick = () => this._startOrderGame();
        document.getElementById('startSurahOrderBtn').onclick = () => this._startSurahOrderGame();
        document.getElementById('startSpeedQuizBtn').onclick = () => this._startSpeedQuiz();
        document.querySelectorAll('.game-back-btn').forEach(b => b.onclick = () => this._showGamesMenu());
        document.getElementById('quizNextBtn').onclick = () => this._nextQuizQuestion();
        document.getElementById('matchNextBtn').onclick = () => this._nextMatchQuestion();
        document.getElementById('countNextBtn').onclick = () => this._nextCountQuestion();
        document.getElementById('hangmanGuessBtn').onclick = () => this._hangmanGuess();
        document.getElementById('hangmanInput').onkeydown = (e) => { if(e.key==='Enter') this._hangmanGuess(); };
        document.getElementById('memoryNewBtn').onclick = () => this._startMemory();
        document.getElementById('startWordCompleteBtn').onclick = () => this._startWordComplete();
        document.getElementById('startTrueFalseBtn').onclick = () => this._startTrueFalse();
        document.getElementById('startSurahFirstBtn').onclick = () => this._startSurahFirst();
        document.getElementById('wcCheckBtn').onclick = () => this._checkWordComplete();
        document.getElementById('wcNextBtn').onclick = () => this._nextWordComplete();
        document.getElementById('wcInput').onkeydown = (e) => { if(e.key==='Enter') this._checkWordComplete(); };
        document.getElementById('tfTrueBtn').onclick = () => this._tfAnswer(true);
        document.getElementById('tfFalseBtn').onclick = () => this._tfAnswer(false);
        document.getElementById('tfNextBtn').onclick = () => this._nextTrueFalse();
        document.getElementById('sfNextBtn').onclick = () => this._nextSurahFirst();
        document.getElementById('surahOrderNextBtn').onclick = () => this._nextSurahOrderQ();
        document.getElementById('speedQuizNextBtn').onclick = () => this._nextSpeedQuizQ();
    }

    _showGamesMenu() {
        document.getElementById('gamesMenu').classList.remove('hidden');
        ['quizArea','matchArea','countArea','hangmanArea','memoryArea','orderArea','surahOrderArea','speedQuizArea','wordCompleteArea','trueFalseArea','surahFirstArea'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        if (this._speedQuizTimer) { clearInterval(this._speedQuizTimer); this._speedQuizTimer = null; }
        if (this._tfTimer) { clearInterval(this._tfTimer); this._tfTimer = null; }
    }

    // ─── Oyun 3: Kaç Ayet Var? ───────────────────────────────
    _startCountGame() {
        if (this.state.surahMetadata.length < 4) return;
        this.countGame = { score:0, total:0 };
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('countArea').classList.remove('hidden');
        document.getElementById('countNextBtn').classList.add('hidden');
        this._nextCountQuestion();
    }
    _nextCountQuestion() {
        document.getElementById('countNextBtn').classList.add('hidden');
        document.getElementById('countFeedback').textContent = '';
        const all = this.state.surahMetadata;
        const correct = all[Math.floor(Math.random() * all.length)];
        const nums = new Set([correct.ayahCount]);
        while (nums.size < 4) {
            const n = Math.max(1, correct.ayahCount + Math.floor(Math.random()*30)-15);
            nums.add(n);
        }
        const opts = [...nums].sort(() => Math.random()-0.5);
        document.getElementById('countQuestion').innerHTML =
            `<div class="quiz-sub">Bu surede kaç ayet vardır?</div>
             <div class="quiz-big">${correct.name}</div>`;
        const div = document.getElementById('countOptions');
        div.innerHTML = '';
        opts.forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = n + ' ayet';
            btn.onclick = () => {
                div.querySelectorAll('button').forEach(b=>b.disabled=true);
                if (n===correct.ayahCount) { btn.classList.add('correct'); this.countGame.score++; document.getElementById('countFeedback').textContent='✅ Doğru!'; }
                else { btn.classList.add('wrong'); div.querySelectorAll('button').forEach(b=>{ if(parseInt(b.textContent)===correct.ayahCount) b.classList.add('correct'); }); document.getElementById('countFeedback').textContent=`❌ Doğrusu: ${correct.ayahCount}`; }
                this.countGame.total++;
                document.getElementById('countScore').textContent=`${this.countGame.score}/${this.countGame.total}`;
                document.getElementById('countNextBtn').classList.remove('hidden');
            };
            div.appendChild(btn);
        });
        document.getElementById('countScore').textContent=`${this.countGame.score}/${this.countGame.total}`;
    }

    // ─── Oyun 4: Hangman (Sure Bulmaca) ─────────────────────
    _startHangman() {
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('hangmanArea').classList.remove('hidden');
        this._newHangmanWord();
    }
    _newHangmanWord() {
        const all = this.state.surahMetadata;
        const surah = all[Math.floor(Math.random()*all.length)];
        this.hangman = { word: surah.name.toUpperCase(), guessed: new Set(), wrong: 0, max: 6 };
        document.getElementById('hangmanMsg').textContent = '';
        document.getElementById('hangmanInput').value = '';
        this._updateHangman();
    }
    _hangmanGuess() {
        const inp = document.getElementById('hangmanInput');
        const ch = inp.value.toUpperCase().trim();
        inp.value = '';
        if (!ch || ch.length!==1 || this.hangman.guessed.has(ch)) return;
        this.hangman.guessed.add(ch);
        if (!this.hangman.word.includes(ch)) this.hangman.wrong++;
        this._updateHangman();
    }
    _updateHangman() {
        const {word,guessed,wrong,max} = this.hangman;
        const display = word.split('').map(c=>c===' '?'  ':guessed.has(c)?c:'_').join(' ');
        document.getElementById('hangmanWord').textContent = display;
        const wrongLetters = [...guessed].filter(c=>!word.includes(c));
        document.getElementById('hangmanWrong').textContent = wrongLetters.length ? 'Yanlış: '+wrongLetters.join(' ') : '';
        const faces = ['😄','😐','😟','😰','😱','😵','💀'];
        document.getElementById('hangmanFace').textContent = faces[Math.min(wrong,6)];
        document.getElementById('hangmanHaklar').textContent = `${max-wrong} hak`;
        if (!display.includes('_')) {
            document.getElementById('hangmanMsg').innerHTML='🎉 Tebrikler! Sure: <b>'+word+'</b>';
            setTimeout(()=>this._newHangmanWord(),2000);
        } else if (wrong>=max) {
            document.getElementById('hangmanMsg').innerHTML='💀 Bitti! Cevap: <b>'+word+'</b>';
            setTimeout(()=>this._newHangmanWord(),2500);
        }
    }

    // ─── Oyun 5: Hafıza Kartları ─────────────────────────────
    _startMemory() {
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('memoryArea').classList.remove('hidden');
        const all = this.state.surahMetadata;
        const picked = [];
        const used = new Set();
        while (picked.length<6) {
            const s = all[Math.floor(Math.random()*all.length)];
            if (!used.has(s.id)) { used.add(s.id); picked.push(s); }
        }
        const pairs = [];
        picked.forEach(s => {
            pairs.push({key:s.id, label:String(s.id), match:s.id});
            pairs.push({key:s.id, label:s.name, match:s.id});
        });
        pairs.sort(()=>Math.random()-0.5);
        this.memory = { cards: pairs.map((p,i)=>({...p,i,open:false,done:false})), flipped:[], locked:false, moves:0 };
        this._renderMemory();
        document.getElementById('memoryMoves').textContent='Hamle: 0';
        document.getElementById('memoryResult').textContent='';
    }
    _renderMemory() {
        const grid = document.getElementById('memoryGrid');
        grid.innerHTML='';
        this.memory.cards.forEach((card,i) => {
            const el = document.createElement('div');
            el.className = 'mem-card'+(card.open||card.done?' flipped':'')+(card.done?' done':'');
            el.innerHTML = `<div class="mem-front">🕋</div><div class="mem-back">${card.label}</div>`;
            el.onclick = ()=>this._flipMemory(i);
            grid.appendChild(el);
        });
    }
    _flipMemory(i) {
        const m = this.memory;
        if (m.locked||m.cards[i].open||m.cards[i].done) return;
        m.cards[i].open=true;
        m.flipped.push(i);
        this._renderMemory();
        if (m.flipped.length===2) {
            m.locked=true; m.moves++;
            document.getElementById('memoryMoves').textContent=`Hamle: ${m.moves}`;
            const [a,b] = m.flipped;
            if (m.cards[a].match===m.cards[b].match && m.cards[a].label!==m.cards[b].label) {
                m.cards[a].done=m.cards[b].done=true;
                m.flipped=[]; m.locked=false;
                this._renderMemory();
                if (m.cards.every(c=>c.done)) document.getElementById('memoryResult').textContent=`🎉 Tamamlandı! ${m.moves} hamle`;
            } else {
                setTimeout(()=>{ m.cards[a].open=m.cards[b].open=false; m.flipped=[]; m.locked=false; this._renderMemory(); },900);
            }
        }
    }

    _startQuiz() {
        if (this.state.surahMetadata.length < 4) return;
        this.quiz = { score: 0, total: 0 };
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('quizArea').classList.remove('hidden');
        document.getElementById('quizNextBtn').classList.add('hidden');
        this._nextQuizQuestion();
    }

    _nextQuizQuestion() {
        document.getElementById('quizNextBtn').classList.add('hidden');
        document.getElementById('quizFeedback').textContent = '';
        const all = this.state.surahMetadata;
        const correct = all[Math.floor(Math.random() * all.length)];
        const opts = [correct];
        while (opts.length < 4) { const r = all[Math.floor(Math.random() * all.length)]; if (!opts.find(o => o.id === r.id)) opts.push(r); }
        opts.sort(() => Math.random() - 0.5);
        document.getElementById('quizQuestion').innerHTML = `<div style="font-size:1rem;color:#94a3b8;margin-bottom:8px">Bu numara hangi sureye aittir?</div><div style="font-size:2.5rem;color:#aee2ff;font-weight:bold;font-family:sans-serif">${correct.id}</div>`;
        const optDiv = document.getElementById('quizOptions');
        optDiv.innerHTML = '';
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = opt.name;
            btn.onclick = () => {
                document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
                if (opt.id === correct.id) { btn.classList.add('correct'); this.quiz.score++; document.getElementById('quizFeedback').innerHTML = '✅ Doğru!'; }
                else { btn.classList.add('wrong'); document.querySelectorAll('.quiz-opt-btn').forEach(b => { if (b.textContent === correct.name) b.classList.add('correct'); }); document.getElementById('quizFeedback').innerHTML = `❌ Doğrusu: <strong>${correct.name}</strong>`; }
                this.quiz.total++;
                document.getElementById('quizScore').textContent = `Skor: ${this.quiz.score} / ${this.quiz.total}`;
                document.getElementById('quizNextBtn').classList.remove('hidden');
            };
            optDiv.appendChild(btn);
        });
        document.getElementById('quizScore').textContent = `Skor: ${this.quiz.score} / ${this.quiz.total}`;
    }

    _startMatch() {
        if (!this.state.mealCache) { alert('Meal veritabanı henüz yüklenmedi.'); return; }
        this.match = { score: 0, total: 0 };
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('matchArea').classList.remove('hidden');
        document.getElementById('matchNextBtn').classList.add('hidden');
        this._nextMatchQuestion();
    }

    _nextMatchQuestion() {
        document.getElementById('matchNextBtn').classList.add('hidden');
        document.getElementById('matchFeedback').textContent = '';
        const keys = Object.keys(this.state.mealCache);
        const sid = parseInt(keys[Math.floor(Math.random() * keys.length)]);
        const verses = this.state.mealCache[sid];
        if (!verses || verses.length < 4) { this._nextMatchQuestion(); return; }
        const correct = verses[Math.floor(Math.random() * verses.length)];
        const surahData = this.state.surahCache.get(sid);
        if (!surahData) { this._nextMatchQuestion(); return; }
        const arabicText = surahData.verse[`verse_${correct.verse}`] || '';
        if (!arabicText) { this._nextMatchQuestion(); return; }
        const rest = verses.filter(v => v.verse !== correct.verse);
        const opts = [correct];
        while (opts.length < 4 && rest.length > 0) opts.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
        if (opts.length < 4) { this._nextMatchQuestion(); return; }
        opts.sort(() => Math.random() - 0.5);
        document.getElementById('matchQuestion').textContent = arabicText;
        const optDiv = document.getElementById('matchOptions');
        optDiv.innerHTML = '';
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = opt.text.length > 80 ? opt.text.slice(0, 80) + '…' : opt.text;
            btn.onclick = () => {
                document.querySelectorAll('#matchOptions .quiz-opt-btn').forEach(b => b.disabled = true);
                if (opt.verse === correct.verse) { btn.classList.add('correct'); this.match.score++; document.getElementById('matchFeedback').innerHTML = '✅ Doğru!'; }
                else { btn.classList.add('wrong'); document.getElementById('matchFeedback').innerHTML = `❌ Yanlış!`; }
                this.match.total++;
                document.getElementById('matchScore').textContent = `Skor: ${this.match.score} / ${this.match.total}`;
                document.getElementById('matchNextBtn').classList.remove('hidden');
            };
            optDiv.appendChild(btn);
        });
        document.getElementById('matchScore').textContent = `Skor: ${this.match.score} / ${this.match.total}`;
    }

    // ============================================================
    // 🌟 GÜNÜN AYETİ
    // ============================================================

    async _renderDailyVerse() {
        const box = document.getElementById('dailyVerseBox');
        if (!box) return;
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
        const counts = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,14,10,77,18,12,31,40,15,6,29,51,49,30,52,16,23,54,41,44,37,0,25,78,43,38,35,28,25,27,20,17,13,14,11,15,9,14,14,6,6,5,8,8,3,7,6,11,11];
        const total = counts.reduce((a,b) => a+b, 0);
        const ayahIndex = seed % total;
        let cumulative = 0, targetSurah = 1, targetAyah = 1;
        for (let i = 0; i < counts.length; i++) {
            if (ayahIndex < cumulative + counts[i]) { targetSurah = i + 1; targetAyah = ayahIndex - cumulative + 1; break; }
            cumulative += counts[i];
        }
        try {
            const data = await this._fetchSurahWithCache(targetSurah);
            if (!data) return;
            const arabic = data.verse?.[`verse_${targetAyah}`] || '';
            // mealCache bekle — yüklenmemişse tekrar dene
            if (!this.state.mealCache) {
                await this._loadMealDatabase();
            }
            const meal = this.state.mealCache?.[targetSurah] ?
                (this.state.mealCache[targetSurah].find(v => v.verse === targetAyah)?.text || '') : '';
            const arabicEl = document.getElementById('dailyVerseArabic');
            const mealEl   = document.getElementById('dailyVerseMeal');
            const refEl    = document.getElementById('dailyVerseRef');
            if (arabicEl) arabicEl.textContent = arabic;
            if (mealEl)   mealEl.textContent   = meal || '(meal yüklenemedi)';
            if (refEl)    refEl.textContent     = `${data.name} Suresi — ${targetAyah}. Ayet`;
            box.style.display = '';
        } catch(e) {
            console.warn('Günün ayeti yüklenemedi:', e);
        }
    }

    // ============================================================
    // 🛠 YARDIMCI ARAÇLAR
    // ============================================================

    async _fastPreloadMetadata() {
        const ids = Array.from({length: 114}, (_, i) => i + 1);
        for (let i = 0; i < ids.length; i += this.config.parallelTasks) {
            const batch = ids.slice(i, i + this.config.parallelTasks);
            await Promise.all(batch.map(id => this._fetchSurahWithCache(id).then(d => {
                if (d) {
                    this.state.surahMetadata.push({ id, name: d.name, ayahCount: Object.keys(d.verse).length });
                    if (this.dom.surahSel) this.dom.surahSel.add(new Option(`${id}. ${d.name}`, id));
                }
            }).catch(() => {})));
        }
        this.state.surahMetadata.sort((a,b) => a.id - b.id);
    }

    async _fetchSurahWithCache(id) {
        if (this.state.surahCache.has(id)) return this.state.surahCache.get(id);
        try {
            const r = await fetch(`data/surah/surah_${id}.json`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const d = await r.json();
            this.state.surahCache.set(id, d);
            return d;
        } catch(e) {
            this.log(`Sure ${id} yüklenemedi: ${e.message}`, 'warn');
            return null;
        }
    }

    async _loadMealDatabase() {
        try {
            const r = await fetch(this.config.mealPath);
            this.state.mealCache = await r.json();
            this.log("Meal veritabanı yüklendi.", "success");
        } catch (e) { this.log("Meal verisi yüklenemedi.", "error"); }
    }

    _calculateLevenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++)
            for (let j = 1; j <= a.length; j++)
                matrix[i][j] = b.charAt(i-1) === a.charAt(j-1) ? matrix[i-1][j-1] : Math.min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1);
        return matrix[b.length][a.length];
    }

    _toArabicDigits(n) {
        const s = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
        return n.toString().replace(/[0-9]/g, w => s[+w]);
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

    async handleSmartSearch() {
        const sQuery = this.dom.surahInp.value.trim().toLowerCase();
        const vQuery = parseInt(this.dom.verseInp.value);
        if (this.state.semantics[sQuery]) { await this.loadSurah(this.state.semantics[sQuery]); if (vQuery) this.scrollToAyah(vQuery); return; }
        const numericId = parseInt(sQuery);
        if (!isNaN(numericId) && numericId > 0 && numericId <= 114) { await this.loadSurah(numericId); if (vQuery) this.scrollToAyah(vQuery); }
    }

    scrollToAyah(n) {
        setTimeout(() => {
            const t = document.getElementById(`ayah-unit-v15-${n}`);
            if (t) window.scrollTo({ top: t.offsetTop - this.config.scrollOffset, behavior: 'smooth' });
        }, 300);
    }

    _initKeyboardEngine() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this._stopSystemAudio();
            // Admin paneli açıksa veya input/textarea'daysa space'i engelleme
            const tag = e.target.tagName;
            const adminOpen = document.getElementById('adminOverlay') && document.getElementById('adminOverlay').classList.contains('open');
            if (e.key === ' ' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !adminOpen) {
                e.preventDefault();
                this.state.audioPlayer.paused ? this.state.audioPlayer.play() : this.state.audioPlayer.pause();
            }
        });
    }

    _applyInitialSystemTheme() { if (this.state.theme === 'light') this.dom.body.classList.add('light'); }
    toggleSystemTheme() {
        const isL = this.dom.body.classList.toggle('light');
        this.state.theme = isL ? 'light' : 'dark';
        localStorage.setItem('portal_theme', this.state.theme); // Manuel seçim — auto-theme bunu görünce dokunmaz
    }
    _initHistory() { return JSON.parse(localStorage.getItem('qp_history') || '[]'); }
    _verifySystemIntegrity() { return Promise.resolve(true); }
    _handleCriticalError(m, err) { console.error(`[QURAN PORTAL] ERROR:`, m, err); }
    log(m, type = "info") { const c = { success: "#10b981", error: "#ef4444", info: "#38bdf8" }; console.log(`%c[QP v18] %c${m}`, `color: ${c[type]}; font-weight: bold;`, "color: #ddd"); }
    // ─── Oyun 6: Ayet Sırala ─────────────────────────────────
    _startOrderGame() {
        if (!this.state.mealCache) { alert('Meal veritabanı yüklenmedi.'); return; }
        this.orderGame = { score: 0, total: 0, correctOrder: [] };
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('orderArea').classList.remove('hidden');
        document.getElementById('orderNextBtn').classList.add('hidden');
        this._nextOrderQuestion();
    }

    _nextOrderQuestion() {
        document.getElementById('orderNextBtn').classList.add('hidden');
        document.getElementById('orderFeedback').textContent = '';
        const keys = Object.keys(this.state.mealCache);
        const sid = parseInt(keys[Math.floor(Math.random() * keys.length)]);
        const verses = this.state.mealCache[sid];
        if (!verses || verses.length < 4) { this._nextOrderQuestion(); return; }
        const startIdx = Math.floor(Math.random() * (verses.length - 3));
        const chunk = verses.slice(startIdx, startIdx + 4);
        this.orderGame.correctOrder = chunk.map(v => v.verse);
        const shuffled = [...chunk].sort(() => Math.random() - 0.5);

        document.getElementById('orderQuestion').innerHTML = `<div class="quiz-sub">Bu ayetleri doğru sıraya diz (tıkla → yerleştir)</div><div class="quiz-big">${this.state.surahMetadata.find(m=>m.id===sid)?.name||''} Suresi</div>`;

        const wordsEl = document.getElementById('orderWords');
        const answerEl = document.getElementById('orderAnswer');
        wordsEl.innerHTML = '';
        answerEl.innerHTML = '<div style="color:#64748b;font-size:0.8rem;margin-bottom:4px">Sıralama:</div>';
        this.orderGame.answerSlots = [];

        shuffled.forEach((v, i) => {
            const btn = document.createElement('button');
            btn.className = 'order-word-btn';
            btn.textContent = v.text.slice(0, 45) + (v.text.length > 45 ? '…' : '');
            btn.dataset.verse = v.verse;
            btn.onclick = () => {
                if (btn.disabled) return;
                btn.disabled = true; btn.style.opacity = '0.4';
                const slot = document.createElement('div');
                slot.className = 'order-slot';
                slot.textContent = (this.orderGame.answerSlots.length + 1) + '. ' + btn.textContent;
                slot.dataset.verse = v.verse;
                answerEl.appendChild(slot);
                this.orderGame.answerSlots.push(v.verse);
            };
            wordsEl.appendChild(btn);
        });

        document.getElementById('orderScore').textContent = `${this.orderGame.score}/${this.orderGame.total}`;
    }

    _checkOrderAnswer() {
        const correct = JSON.stringify(this.orderGame.correctOrder);
        const given = JSON.stringify(this.orderGame.answerSlots);
        this.orderGame.total++;
        if (correct === given) {
            this.orderGame.score++;
            document.getElementById('orderFeedback').textContent = '✅ Doğru sıra!';
        } else {
            document.getElementById('orderFeedback').textContent = '❌ Yanlış! Doğru sıra: ' + this.orderGame.correctOrder.join(' → ');
        }
        document.getElementById('orderScore').textContent = `${this.orderGame.score}/${this.orderGame.total}`;
        document.getElementById('orderNextBtn').classList.remove('hidden');
    }

    // ─── Oyun 7: Sure Sırası ─────────────────────────────────
    _startSurahOrderGame() {
        if (this.state.surahMetadata.length < 4) return;
        this.surahOrderGame = { score: 0, total: 0 };
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('surahOrderArea').classList.remove('hidden');
        document.getElementById('surahOrderNextBtn').classList.add('hidden');
        this._nextSurahOrderQ();
    }

    _nextSurahOrderQ() {
        document.getElementById('surahOrderNextBtn').classList.add('hidden');
        document.getElementById('surahOrderFeedback').textContent = '';
        const all = this.state.surahMetadata;
        const correct = all[Math.floor(Math.random() * all.length)];
        const wrong = new Set([correct.id]);
        const opts = [correct.id];
        while (opts.length < 4) {
            const n = Math.max(1, Math.min(114, correct.id + Math.floor(Math.random() * 10) - 5));
            if (!wrong.has(n)) { wrong.add(n); opts.push(n); }
        }
        opts.sort(() => Math.random() - 0.5);
        document.getElementById('surahOrderQ').innerHTML =
            `<div class="quiz-sub">Bu sure Kur\'an'da kaçıncı suredir?</div><div class="quiz-big">${correct.name}</div>`;
        const div = document.getElementById('surahOrderOptions');
        div.innerHTML = '';
        opts.forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = n + '. Sure';
            btn.onclick = () => {
                div.querySelectorAll('button').forEach(b => b.disabled = true);
                this.surahOrderGame.total++;
                if (n === correct.id) { btn.classList.add('correct'); this.surahOrderGame.score++; document.getElementById('surahOrderFeedback').textContent = '✅ Doğru!'; }
                else { btn.classList.add('wrong'); div.querySelectorAll('button').forEach(b => { if (parseInt(b.textContent) === correct.id) b.classList.add('correct'); }); document.getElementById('surahOrderFeedback').textContent = `❌ Doğrusu: ${correct.id}. sure`; }
                document.getElementById('surahOrderScore').textContent = `${this.surahOrderGame.score}/${this.surahOrderGame.total}`;
                document.getElementById('surahOrderNextBtn').classList.remove('hidden');
            };
            div.appendChild(btn);
        });
        document.getElementById('surahOrderScore').textContent = `${this.surahOrderGame.score}/${this.surahOrderGame.total}`;
    }

    // ─── Oyun 8: Hızlı Bilgi (10 sn timer) ──────────────────
    _startSpeedQuiz() {
        if (this.state.surahMetadata.length < 4) return;
        this.speedQuiz = { score: 0, total: 0 };
        this._speedQuizTimer = null;
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('speedQuizArea').classList.remove('hidden');
        document.getElementById('speedQuizNextBtn').classList.add('hidden');
        this._nextSpeedQuizQ();
    }

    _nextSpeedQuizQ() {
        document.getElementById('speedQuizNextBtn').classList.add('hidden');
        document.getElementById('speedQuizFeedback').textContent = '';
        if (this._speedQuizTimer) clearInterval(this._speedQuizTimer);

        const all = this.state.surahMetadata;
        const correct = all[Math.floor(Math.random() * all.length)];
        const qTypes = ['number', 'ayahCount', 'name'];
        const qType = qTypes[Math.floor(Math.random() * qTypes.length)];

        let questionHTML = '', optsFn;
        if (qType === 'number') {
            questionHTML = `<div class="quiz-sub">Bu numara hangi sureye aittir?</div><div class="quiz-big" style="font-size:2.8rem;color:#aee2ff">${correct.id}</div>`;
            const opts = [correct]; while (opts.length < 4) { const r = all[Math.floor(Math.random()*all.length)]; if (!opts.find(o=>o.id===r.id)) opts.push(r); }
            opts.sort(()=>Math.random()-0.5);
            optsFn = (div) => opts.forEach(opt => { const b = document.createElement('button'); b.className='quiz-opt-btn'; b.textContent=opt.name; b.onclick=()=>this._speedQuizAnswer(b, opt.id===correct.id, div); div.appendChild(b); });
        } else if (qType === 'ayahCount') {
            questionHTML = `<div class="quiz-sub">Kaç ayet var?</div><div class="quiz-big">${correct.name}</div>`;
            const nums = new Set([correct.ayahCount]); while(nums.size<4) nums.add(Math.max(1,correct.ayahCount+Math.floor(Math.random()*20)-10));
            const opts = [...nums].sort(()=>Math.random()-0.5);
            optsFn = (div) => opts.forEach(n => { const b=document.createElement('button'); b.className='quiz-opt-btn'; b.textContent=n+' ayet'; b.onclick=()=>this._speedQuizAnswer(b,n===correct.ayahCount,div); div.appendChild(b); });
        } else {
            questionHTML = `<div class="quiz-sub">Bu sure numarası kaçtır?</div><div class="quiz-big">${correct.name}</div>`;
            const wrong = new Set([correct.id]); const opts=[correct.id]; while(opts.length<4){const n=Math.max(1,Math.min(114,correct.id+Math.floor(Math.random()*10)-5)); if(!wrong.has(n)){wrong.add(n);opts.push(n);}} opts.sort(()=>Math.random()-0.5);
            optsFn = (div) => opts.forEach(n => { const b=document.createElement('button'); b.className='quiz-opt-btn'; b.textContent=n+'. Sure'; b.onclick=()=>this._speedQuizAnswer(b,n===correct.id,div); div.appendChild(b); });
        }

        document.getElementById('speedQuizQ').innerHTML = questionHTML;
        const div = document.getElementById('speedQuizOptions'); div.innerHTML = '';
        optsFn(div);
        document.getElementById('speedQuizScore').textContent = `${this.speedQuiz.score}/${this.speedQuiz.total}`;

        // 10 sn timer
        let timeLeft = 10;
        document.getElementById('speedTimerVal').textContent = timeLeft;
        document.getElementById('speedTimerFill').style.width = '100%';
        document.getElementById('speedTimerFill').style.transition = 'none';
        setTimeout(() => {
            document.getElementById('speedTimerFill').style.transition = 'width 10s linear';
            document.getElementById('speedTimerFill').style.width = '0%';
        }, 50);
        this._speedQuizTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('speedTimerVal').textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(this._speedQuizTimer);
                div.querySelectorAll('button').forEach(b=>b.disabled=true);
                this.speedQuiz.total++;
                document.getElementById('speedQuizFeedback').textContent = '⏰ Süre doldu!';
                document.getElementById('speedQuizScore').textContent = `${this.speedQuiz.score}/${this.speedQuiz.total}`;
                document.getElementById('speedQuizNextBtn').classList.remove('hidden');
            }
        }, 1000);
    }

    _speedQuizAnswer(btn, isCorrect, div) {
        if (this._speedQuizTimer) clearInterval(this._speedQuizTimer);
        div.querySelectorAll('button').forEach(b=>b.disabled=true);
        this.speedQuiz.total++;
        if (isCorrect) { btn.classList.add('correct'); this.speedQuiz.score++; document.getElementById('speedQuizFeedback').textContent='✅ Doğru!'; }
        else { btn.classList.add('wrong'); document.getElementById('speedQuizFeedback').textContent='❌ Yanlış!'; }
        document.getElementById('speedQuizScore').textContent = `${this.speedQuiz.score}/${this.speedQuiz.total}`;
        document.getElementById('speedTimerFill').style.width = '0%';
        document.getElementById('speedQuizNextBtn').classList.remove('hidden');
    }

    // ============================================================
    // 🕌 NAMAZ VAKİTLERİ
    // ============================================================

    _initPrayerPanel() {
        const btn = document.getElementById('prayerSearchBtn');
        const inp = document.getElementById('prayerCityInput');
        if (btn && !btn._bound) {
            btn._bound = true;
            btn.onclick = () => this._fetchPrayerTimes(inp.value.trim());
            inp.onkeydown = (e) => { if(e.key==='Enter') this._fetchPrayerTimes(inp.value.trim()); };
        }
        // Türkiye'deyse Istanbul varsayılan
        if (!inp.value) { inp.value = 'Istanbul'; this._fetchPrayerTimes('Istanbul'); }
    }

    async _fetchPrayerTimes(city) {
        if (!city) return;
        const el = document.getElementById('prayerTimes');
        const nextEl = document.getElementById('prayerNextInfo');
        el.innerHTML = '<div style="color:#64748b;text-align:center;grid-column:1/-1;padding:1rem">⏳ Yükleniyor...</div>';
        nextEl.textContent = '';
        try {
            const resp = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`);
            const json = await resp.json();
            if (json.code !== 200) { el.innerHTML = '<div style="color:#f87171;grid-column:1/-1">Şehir bulunamadı.</div>'; return; }

            const t = json.data.timings;
            const date = json.data.date;
            const hijri = date.hijri;
            const prayers = [
                { name:'İmsak',  time:t.Imsak,   icon:'🌙' },
                { name:'Sabah',  time:t.Fajr,    icon:'🌅' },
                { name:'Güneş', time:t.Sunrise,  icon:'☀️' },
                { name:'Öğle',  time:t.Dhuhr,   icon:'🌞' },
                { name:'İkindi', time:t.Asr,     icon:'🌇' },
                { name:'Akşam', time:t.Maghrib,  icon:'🌆' },
                { name:'Yatsı', time:t.Isha,     icon:'🌃' },
            ];

            const now = new Date();
            const nowMin = now.getHours()*60+now.getMinutes();

            const toMin = (timeStr) => {
                const [h,m] = timeStr.split(':').map(Number);
                return h*60+m;
            };

            // Geçmiş / aktif / gelecek tespiti
            let nextIdx = -1;
            for (let i = 0; i < prayers.length; i++) {
                if (toMin(prayers[i].time) > nowMin) { nextIdx = i; break; }
            }
            const activeIdx = nextIdx === -1 ? prayers.length-1 : nextIdx-1;

            el.innerHTML = prayers.map((p, i) => {
                const isActive = i === activeIdx;
                const isNext   = i === nextIdx;
                const isPast   = toMin(p.time) < nowMin && !isActive;
                const border   = isActive ? '#f59e0b' : isNext ? '#38bdf8' : '#334155';
                const bg       = isActive ? '#2a1f00' : isNext ? '#0f2233' : '#1e293b';
                const timeColor= isActive ? '#f59e0b' : isNext ? '#38bdf8' : '#94a3b8';
                const opacity  = isPast ? '0.45' : '1';
                return `
                <div style="background:${bg};border:1.5px solid ${border};border-radius:12px;padding:10px 6px;text-align:center;opacity:${opacity};transition:0.2s">
                    <div style="font-size:1.2rem">${p.icon}</div>
                    <div style="color:#94a3b8;font-size:0.72rem;margin:2px 0">${p.name}</div>
                    <div style="color:${timeColor};font-weight:bold;font-size:0.95rem">${p.time}</div>
                    ${isActive ? '<div style="font-size:0.65rem;color:#f59e0b;margin-top:2px">● Şimdi</div>' : ''}
                    ${isNext   ? '<div style="font-size:0.65rem;color:#38bdf8;margin-top:2px">↑ Sonraki</div>' : ''}
                </div>`;
            }).join('');

            // Hicri tarih + geri sayım
            const hijriText = `${hijri.day} ${hijri.month.ar} ${hijri.year}`;
            if (nextIdx !== -1) {
                const nextPrayer = prayers[nextIdx];
                const diffMin = toMin(nextPrayer.time) - nowMin;
                const h = Math.floor(diffMin/60), m = diffMin%60;
                const countdown = h > 0 ? `${h} saat ${m} dk` : `${m} dakika`;
                nextEl.innerHTML = `
                    <span style="color:#64748b;font-size:0.8rem;margin-right:10px">🗓 ${hijriText}</span>
                    <span>⏰ <strong>${nextPrayer.name}</strong>'a ${countdown} kaldı (${nextPrayer.time})</span>`;
            } else {
                nextEl.innerHTML = `<span style="color:#64748b;font-size:0.8rem;margin-right:10px">🗓 ${hijriText}</span><span>🌙 Bugünkü tüm vakitler geçti</span>`;
            }

            // Canlı geri sayım — her dakika güncelle
            if (this._prayerCountdownInterval) clearInterval(this._prayerCountdownInterval);
            this._prayerCountdownInterval = setInterval(() => {
                if (document.getElementById('prayerPanel') && !document.getElementById('prayerPanel').classList.contains('hidden')) {
                    this._fetchPrayerTimes(city);
                } else {
                    clearInterval(this._prayerCountdownInterval);
                }
            }, 60000);

        } catch(e) {
            el.innerHTML = '<div style="color:#f87171;grid-column:1/-1;padding:1rem">Veri alınamadı. İnternet bağlantısını kontrol edin.</div>';
        }
    }

    // ============================================================
    // 🤲 DUALAR
    // ============================================================

    _initDuaPanel() {
        const duas = [
            { cat: 'Sabah', arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ', tr: 'Sabahladık, mülk de Allah\'a sabahladı.', kaynak: 'Müslim' },
            { cat: 'Akşam', arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ', tr: 'Akşamladık, mülk de Allah\'a akşamladı.', kaynak: 'Müslim' },
            { cat: 'Yemek', arabic: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ', tr: 'Allah\'ın adıyla ve Allah\'ın bereketi ile.', kaynak: 'Ebu Davud' },
            { cat: 'Uyku', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', tr: 'Allah\'ım, senin adınla ölür ve dirilirm.', kaynak: 'Buhari' },
            { cat: 'Yolculuk', arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا', tr: 'Bunu bize boyun eğdireni tesbih ederiz.', kaynak: 'Tirmizi' },
            { cat: 'Şifa', arabic: 'أَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ', tr: 'Ey insanların Rabbi, sıkıntıyı gider.', kaynak: 'Buhari' },
            { cat: 'İstihare', arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ', tr: 'Allah\'ım, ilminle senden hayır dilerim.', kaynak: 'Buhari' },
            { cat: 'Af', arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ', tr: 'Rabbim, beni bağışla ve tevbemi kabul et.', kaynak: 'Tirmizi' },
        ];

        const tabsEl = document.getElementById('duaTabs');
        const contentEl = document.getElementById('duaContent');
        if (tabsEl.children.length > 0) return; // zaten init edilmiş

        duas.forEach((d, i) => {
            const btn = document.createElement('button');
            btn.className = 'dua-tab-btn';
            btn.textContent = d.cat;
            btn.style.cssText = 'background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:20px;padding:4px 12px;font-size:0.82rem;cursor:pointer;transition:0.2s';
            btn.onclick = () => {
                tabsEl.querySelectorAll('.dua-tab-btn').forEach(b => { b.style.background='#1e293b'; b.style.color='#94a3b8'; b.style.borderColor='#334155'; });
                btn.style.background='linear-gradient(135deg,#f59e0b,#d97706)'; btn.style.color='#000'; btn.style.borderColor='#f59e0b';
                contentEl.innerHTML = `
                    <div style="font-size:1.6rem;line-height:2.5;font-family:'Amiri Quran',serif;color:#e2e8f0;direction:rtl;margin-bottom:12px">${d.arabic}</div>
                    <div style="color:#94a3b8;font-size:0.95rem;line-height:1.7;direction:ltr;margin-bottom:8px">${d.tr}</div>
                    <div style="color:#475569;font-size:0.8rem">Kaynak: ${d.kaynak}</div>`;
            };
            tabsEl.appendChild(btn);
            if (i === 0) setTimeout(() => btn.click(), 50);
        });
    }

    // ============================================================
    // 🔖 YER İMİ SİSTEMİ
    // ============================================================

    _addBookmark(surahId, ayahId) {
        const meta = this.state.surahMetadata.find(m => m.id === surahId);
        const surahName = meta ? meta.name : `Sure ${surahId}`;
        const bookmarks = JSON.parse(localStorage.getItem('qp_bookmarks') || '[]');
        const exists = bookmarks.find(b => b.surahId === surahId && b.ayahId === ayahId);
        if (exists) { this._showToast('Zaten yer imi var!', '#f59e0b'); return; }
        bookmarks.unshift({ surahId, ayahId, surahName, savedAt: Date.now() });
        if (bookmarks.length > 50) bookmarks.pop();
        localStorage.setItem('qp_bookmarks', JSON.stringify(bookmarks));
        this._showToast(`🔖 ${surahName} ${ayahId}. ayet kaydedildi`, '#6ee7b7');
        // Ayeti vurgula
        const unit = document.getElementById(`ayah-unit-v15-${ayahId}`);
        if (unit) { unit.style.outline = '2px solid #f59e0b'; setTimeout(() => unit.style.outline = '', 1500); }
    }

    _renderBookmarks() {
        const bookmarks = JSON.parse(localStorage.getItem('qp_bookmarks') || '[]');
        const list = document.getElementById('bookmarkList');
        const empty = document.getElementById('bookmarkEmpty');
        if (!list) return;
        if (!bookmarks.length) { list.innerHTML = ''; empty.style.display='block'; return; }
        empty.style.display = 'none';
        list.innerHTML = bookmarks.map((b, i) => `
            <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:sans-serif">
                <div>
                    <div style="color:#e2e8f0;font-weight:600;font-size:0.9rem">📖 ${b.surahName} — ${b.ayahId}. Ayet</div>
                    <div style="color:#475569;font-size:0.75rem;margin-top:2px">${new Date(b.savedAt).toLocaleDateString('tr-TR')}</div>
                </div>
                <div style="display:flex;gap:6px">
                    <button onclick="App.loadSurah(${b.surahId}).then(()=>setTimeout(()=>App.scrollToAyah(${b.ayahId}),400))" style="background:#1e3a5f;color:#aee2ff;border:none;border-radius:8px;padding:4px 10px;font-size:0.78rem;cursor:pointer">Git</button>
                    <button onclick="App.playAyah(${b.surahId},${b.ayahId})" style="background:#064e3b;color:#6ee7b7;border:none;border-radius:8px;padding:4px 10px;font-size:0.78rem;cursor:pointer">▶</button>
                    <button onclick="App._removeBookmark(${i})" style="background:#7f1d1d;color:#fca5a5;border:none;border-radius:8px;padding:4px 8px;font-size:0.78rem;cursor:pointer">✕</button>
                </div>
            </div>`).join('');
    }

    _removeBookmark(idx) {
        const bookmarks = JSON.parse(localStorage.getItem('qp_bookmarks') || '[]');
        bookmarks.splice(idx, 1);
        localStorage.setItem('qp_bookmarks', JSON.stringify(bookmarks));
        this._renderBookmarks();
    }

    _showToast(msg, color = '#6ee7b7') {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:${color};border:1px solid ${color}44;padding:10px 20px;border-radius:20px;font-family:sans-serif;font-size:0.88rem;z-index:9999999;pointer-events:none;transition:opacity 0.4s;white-space:nowrap`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 400); }, 2200);
    }

    // ============================================================
    // 🔍 MEAL İÇİNDE ARA
    // ============================================================

    async _checkAdminPrivilege(uid) {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'admins', uid));
            if (snap.exists()) {
                // Bu kullanıcı admin — token'ı localStorage'a yaz
                window._userIsAdmin = true;
                localStorage.setItem('adm_user_token', uid);
                // Admin paneline şifresiz giriş yetki ver
                if (typeof Admin !== 'undefined') {
                    Admin.isAuthenticated = true;
                    // Sol alt köşeye gizli admin göstergesi
                    if (!document.getElementById('adminIndicator')) {
                        const ind = document.createElement('div');
                        ind.id = 'adminIndicator';
                        ind.style.cssText = 'position:fixed;bottom:60px;left:12px;z-index:9999;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;padding:4px 10px;border-radius:20px;font-size:0.72rem;font-family:sans-serif;font-weight:bold;cursor:pointer;opacity:0.7;transition:opacity 0.2s';
                        ind.textContent = '🛡️ Admin';
                        ind.title = 'Ctrl+Q ile Admin Paneli';
                        ind.onclick = () => { if(typeof Admin!=='undefined') Admin.open(); };
                        ind.onmouseenter = () => ind.style.opacity='1';
                        ind.onmouseleave = () => ind.style.opacity='0.7';
                        document.body.appendChild(ind);
                    }
                }
            }
        } catch(e) {}
    }

    async _checkUserNote(uid) {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc, updateDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'userNotes', uid));
            if (snap.exists() && !snap.data().read) {
                const data = snap.data();
                setTimeout(() => {
                    this._showToast(`📝 Admin'den not: ${data.message}`, '#fcd34d');
                    updateDoc(doc(db, 'userNotes', uid), { read: true });
                }, 2000);
            }
        } catch(e) {}
    }

    _initVerseSearch() {
        const btn = document.getElementById('verseSearchBtn');
        const inp = document.getElementById('verseSearchInput');
        if (!btn || btn._bound) return;
        btn._bound = true;
        const doSearch = () => this._searchInMeal(inp.value.trim());
        btn.onclick = doSearch;
        inp.onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };
    }

    _searchInMeal(query) {
        const results = document.getElementById('verseSearchResults');
        if (!results) return;
        if (!query || query.length < 2) { results.innerHTML = '<div style="color:#64748b;text-align:center;padding:1rem;font-family:sans-serif">En az 2 karakter girin.</div>'; return; }
        if (!this.state.mealCache) { results.innerHTML = '<div style="color:#f87171;text-align:center;padding:1rem;font-family:sans-serif">Meal veritabanı yüklenmedi.</div>'; return; }
        results.innerHTML = '<div style="color:#64748b;text-align:center;padding:1rem;font-family:sans-serif">🔍 Aranıyor...</div>';

        const q = query.toLowerCase();
        const found = [];
        const meta = this.state.surahMetadata;

        for (const [sid, verses] of Object.entries(this.state.mealCache)) {
            const surahId = parseInt(sid);
            const surahMeta = meta.find(m => m.id === surahId);
            if (!surahMeta) continue;
            for (const v of verses) {
                if (v.text && v.text.toLowerCase().includes(q)) {
                    found.push({ surahId, surahName: surahMeta.name, ayahId: v.verse, text: v.text });
                    if (found.length >= 40) break;
                }
            }
            if (found.length >= 40) break;
        }

        if (!found.length) { results.innerHTML = '<div style="color:#64748b;text-align:center;padding:1rem;font-family:sans-serif">Sonuç bulunamadı.</div>'; return; }

        results.innerHTML = `<div style="color:#64748b;font-size:0.78rem;margin-bottom:8px;font-family:sans-serif">${found.length} sonuç (ilk 40)</div>` +
        found.map(f => {
            const highlighted = f.text.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi'), m => `<mark style="background:#f59e0b33;color:#fcd34d;border-radius:3px">${m}</mark>`);
            return `<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 14px;margin-bottom:6px;font-family:sans-serif">
                <div style="color:#f59e0b;font-size:0.78rem;margin-bottom:4px">${f.surahName} — ${f.ayahId}. Ayet</div>
                <div style="color:#e2e8f0;font-size:0.85rem;line-height:1.6;direction:ltr">${highlighted}</div>
                <div style="margin-top:6px;display:flex;gap:6px">
                    <button onclick="App.loadSurah(${f.surahId}).then(()=>setTimeout(()=>App.scrollToAyah(${f.ayahId}),400))" style="background:#1e3a5f;color:#aee2ff;border:none;border-radius:6px;padding:3px 8px;font-size:0.75rem;cursor:pointer">📖 Git</button>
                    <button onclick="App.playAyah(${f.surahId},${f.ayahId})" style="background:#064e3b;color:#6ee7b7;border:none;border-radius:6px;padding:3px 8px;font-size:0.75rem;cursor:pointer">▶ Dinle</button>
                </div>
            </div>`;
        }).join('');
    }

    // ============================================================
    // ✏️ OYUN: KELİME TAMAMLA
    // ============================================================
    _startWordComplete() {
        if (!this.state.mealCache) { alert('Meal yüklenmedi'); return; }
        this.wcGame = { score:0, total:0, correct:'' };
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('wordCompleteArea').classList.remove('hidden');
        document.getElementById('wcNextBtn').classList.add('hidden');
        this._nextWordComplete();
    }
    _nextWordComplete() {
        document.getElementById('wcNextBtn').classList.add('hidden');
        document.getElementById('wcFeedback').textContent='';
        document.getElementById('wcInput').value='';
        const keys = Object.keys(this.state.mealCache);
        let verse = null, attempts=0;
        while (!verse && attempts<30) {
            attempts++;
            const sid = parseInt(keys[Math.floor(Math.random()*keys.length)]);
            const verses = this.state.mealCache[sid];
            if (!verses) continue;
            const v = verses[Math.floor(Math.random()*verses.length)];
            const words = (v.text||'').split(' ').filter(w=>w.length>4);
            if (words.length>3) verse={text:v.text, words};
        }
        if (!verse) return;
        const words = verse.text.split(' ');
        const idx = Math.floor(Math.random()*(words.length));
        const correct = words[idx];
        this.wcGame.correct = correct.toLowerCase().replace(/[,.:;!?]/g,'');
        const blanked = words.map((w,i)=>i===idx?'_____':w).join(' ');
        document.getElementById('wcQuestion').innerHTML=`<div class="quiz-sub">Eksik kelimeyi tahmin et</div><div style="font-size:0.95rem;color:#e2e8f0;line-height:1.8;direction:ltr;text-align:center;font-family:sans-serif">${blanked}</div>`;
        document.getElementById('wcHint').textContent=`İpucu: ${correct.length} harf, "${correct[0]}" ile başlıyor`;
        document.getElementById('wcScore').textContent=`${this.wcGame.score}/${this.wcGame.total}`;
        setTimeout(()=>document.getElementById('wcInput').focus(),100);
    }
    _checkWordComplete() {
        const inp = document.getElementById('wcInput').value.trim().toLowerCase().replace(/[,.:;!?]/g,'');
        if (!inp) return;
        this.wcGame.total++;
        const correct = this.wcGame.correct;
        const isRight = inp===correct || inp===correct.replace(/[,.:;!?]/g,'');
        if (isRight) { this.wcGame.score++; document.getElementById('wcFeedback').innerHTML='✅ Doğru!'; }
        else { document.getElementById('wcFeedback').innerHTML=`❌ Cevap: <strong>${correct}</strong>`; }
        document.getElementById('wcScore').textContent=`${this.wcGame.score}/${this.wcGame.total}`;
        document.getElementById('wcNextBtn').classList.remove('hidden');
    }

    // ============================================================
    // ✅ OYUN: DOĞRU / YANLIŞ
    // ============================================================
    _startTrueFalse() {
        this.tfGame = { score:0, total:0, correct:null };
        this._tfTimer = null;
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('trueFalseArea').classList.remove('hidden');
        document.getElementById('tfNextBtn').classList.add('hidden');
        this._nextTrueFalse();
    }
    _nextTrueFalse() {
        document.getElementById('tfNextBtn').classList.add('hidden');
        document.getElementById('tfFeedback').textContent='';
        ['tfTrueBtn','tfFalseBtn'].forEach(id=>{ const b=document.getElementById(id); if(b){b.disabled=false;b.style.opacity='1';} });
        const all = this.state.surahMetadata;
        const surah = all[Math.floor(Math.random()*all.length)];
        // Yarısı doğru, yarısı yanlış
        const isTrue = Math.random()>0.5;
        let statement='', correct=isTrue;
        if (isTrue) {
            const types=['ayah','position'];
            const t=types[Math.floor(Math.random()*types.length)];
            if (t==='ayah') statement=`${surah.name} suresinde ${surah.ayahCount} ayet vardır.`;
            else statement=`${surah.name} suresi Kur\'an'da ${surah.id}. suredir.`;
        } else {
            const wrong=surah.ayahCount+Math.floor(Math.random()*20)+5;
            statement=`${surah.name} suresinde ${wrong} ayet vardır.`;
        }
        this.tfGame.correct=correct;
        document.getElementById('tfQuestion').innerHTML=`<div class="quiz-sub">Bu ifade doğru mu?</div><div style="font-size:1rem;color:#e2e8f0;font-family:sans-serif;line-height:1.7;text-align:center">${statement}</div>`;
        document.getElementById('tfScore').textContent=`${this.tfGame.score}/${this.tfGame.total}`;
    }
    _tfAnswer(answer) {
        ['tfTrueBtn','tfFalseBtn'].forEach(id=>{ const b=document.getElementById(id); if(b)b.disabled=true; });
        this.tfGame.total++;
        const isRight=answer===this.tfGame.correct;
        if (isRight) { this.tfGame.score++; document.getElementById('tfFeedback').textContent='✅ Doğru!'; }
        else { document.getElementById('tfFeedback').textContent='❌ Yanlış!'; }
        document.getElementById('tfScore').textContent=`${this.tfGame.score}/${this.tfGame.total}`;
        document.getElementById('tfNextBtn').classList.remove('hidden');
    }

    // ============================================================
    // 🔤 OYUN: İLK AYET KİM?
    // ============================================================
    _startSurahFirst() {
        if (!this.state.mealCache) { alert('Meal yüklenmedi'); return; }
        this.sfGame = { score:0, total:0 };
        document.getElementById('gamesMenu').classList.add('hidden');
        document.getElementById('surahFirstArea').classList.remove('hidden');
        document.getElementById('sfNextBtn').classList.add('hidden');
        this._nextSurahFirst();
    }
    _nextSurahFirst() {
        document.getElementById('sfNextBtn').classList.add('hidden');
        document.getElementById('sfFeedback').textContent='';
        const all = this.state.surahMetadata.filter(m=>this.state.mealCache&&this.state.mealCache[m.id]&&this.state.mealCache[m.id][0]);
        if (all.length<4) return;
        const correct=all[Math.floor(Math.random()*all.length)];
        const firstVerse=(this.state.mealCache[correct.id][0]||{}).text||'';
        if (!firstVerse) { this._nextSurahFirst(); return; }
        const opts=[correct]; while(opts.length<4){ const r=all[Math.floor(Math.random()*all.length)]; if(!opts.find(o=>o.id===r.id))opts.push(r); }
        opts.sort(()=>Math.random()-0.5);
        document.getElementById('sfQuestion').innerHTML=`<div class="quiz-sub">Bu sure hangisiyle başlar?</div><div style="font-size:0.88rem;color:#94a3b8;line-height:1.7;direction:ltr;text-align:center;font-family:sans-serif;padding:0 8px">"${firstVerse.slice(0,100)}${firstVerse.length>100?'…':''}"</div>`;
        const div=document.getElementById('sfOptions');
        div.innerHTML='';
        opts.forEach(opt=>{
            const btn=document.createElement('button');
            btn.className='quiz-opt-btn';
            btn.textContent=opt.name;
            btn.onclick=()=>{
                div.querySelectorAll('button').forEach(b=>b.disabled=true);
                this.sfGame.total++;
                if(opt.id===correct.id){btn.classList.add('correct');this.sfGame.score++;document.getElementById('sfFeedback').textContent='✅ Doğru!';}
                else{btn.classList.add('wrong');div.querySelectorAll('button').forEach(b=>{if(b.textContent===correct.name)b.classList.add('correct')});document.getElementById('sfFeedback').textContent=`❌ Doğrusu: ${correct.name}`;}
                document.getElementById('sfScore').textContent=`${this.sfGame.score}/${this.sfGame.total}`;
                document.getElementById('sfNextBtn').classList.remove('hidden');
            };
            div.appendChild(btn);
        });
        document.getElementById('sfScore').textContent=`${this.sfGame.score}/${this.sfGame.total}`;
    }

    // ============================================================
    // 🏅 ROZET SİSTEMİ
    // ============================================================
    async _renderBadges() {
        const el = document.getElementById('badgeGrid');
        const pctEl = document.getElementById('badgeSurahPct');
        const fillEl = document.getElementById('badgeSurahFill');
        if (!el) return;
        const stats = await this._loadStats();
        const opened = (stats.surahsOpened||[]).length;
        const pct = Math.round((opened/114)*100);
        if (pctEl) pctEl.textContent = pct+'%';
        if (fillEl) fillEl.style.width = pct+'%';

        const BADGES = [
            // Okuma rozetleri
            { id:'first_surah',   icon:'🌱', name:'İlk Adım',       desc:'1 sure oku',                  cond: opened>=1 },
            { id:'three_surahs',  icon:'📗', name:'Üç Sure',        desc:'3 sure oku',                  cond: opened>=3 },
            { id:'five_surahs',   icon:'📚', name:'Beş Sure',       desc:'5 sure oku',                  cond: opened>=5 },
            { id:'ten_surahs',    icon:'📖', name:'On Sure',        desc:'10 sure oku',                 cond: opened>=10 },
            { id:'twenty_surahs', icon:'📕', name:'Yirmi Sure',     desc:'20 sure oku',                 cond: opened>=20 },
            { id:'half_quran',    icon:'🌙', name:'Yarı Kur\'an',   desc:'57 sure oku',                 cond: opened>=57 },
            { id:'full_quran',    icon:'🏆', name:'Hatim',          desc:'Tüm 114 sureyi oku',          cond: opened>=114 },
            // Dinleme rozetleri
            { id:'first_ayah',    icon:'🎵', name:'İlk Ses',        desc:'1 ayet dinle',                cond: (stats.ayahCount||0)>=1 },
            { id:'10_ayahs',      icon:'🔉', name:'10 Ayet',        desc:'10 ayet dinle',               cond: (stats.ayahCount||0)>=10 },
            { id:'50_ayahs',      icon:'🎶', name:'50 Ayet',        desc:'50 ayet dinle',               cond: (stats.ayahCount||0)>=50 },
            { id:'100_ayahs',     icon:'💯', name:'100 Ayet',       desc:'100 ayet dinle',              cond: (stats.ayahCount||0)>=100 },
            { id:'500_ayahs',     icon:'⭐', name:'500 Ayet',       desc:'500 ayet dinle',              cond: (stats.ayahCount||0)>=500 },
            { id:'1000_ayahs',    icon:'🌟', name:'1000 Ayet',      desc:'1000 ayet dinle',             cond: (stats.ayahCount||0)>=1000 },
            // Süre rozetleri
            { id:'min_listen',    icon:'⏱️', name:'30 Dakika',      desc:'30 dk dinle',                 cond: (stats.listenSeconds||0)>=1800 },
            { id:'hour_listen',   icon:'⌛', name:'1 Saat',         desc:'1 saat dinle',                cond: (stats.listenSeconds||0)>=3600 },
            { id:'5hour_listen',  icon:'🕐', name:'5 Saat',         desc:'5 saat dinle',                cond: (stats.listenSeconds||0)>=18000 },
            // Hafızlık rozetleri
            { id:'hifz_start',    icon:'🧠', name:'Hafız Adayı',    desc:'1 hafızlık seansı',           cond: (stats.hifzCount||0)>=1 },
            { id:'hifz_5',        icon:'📝', name:'5 Seans',        desc:'5 hafızlık seansı',           cond: (stats.hifzCount||0)>=5 },
            { id:'hifz_10',       icon:'🎓', name:'10 Seans',       desc:'10 hafızlık seansı',          cond: (stats.hifzCount||0)>=10 },
            { id:'hifz_30',       icon:'🎖️', name:'30 Seans',       desc:'30 hafızlık seansı',          cond: (stats.hifzCount||0)>=30 },
            // Zikir rozetleri
            { id:'zikr_33',       icon:'📿', name:'33 Zikir',       desc:'33 zikir çek',                cond: (stats.zikrTotal||0)>=33 },
            { id:'zikr_100',      icon:'💎', name:'100 Zikir',      desc:'100 zikir çek',               cond: (stats.zikrTotal||0)>=100 },
            { id:'zikr_1000',     icon:'👑', name:'1000 Zikir',     desc:'1000 zikir çek',              cond: (stats.zikrTotal||0)>=1000 },
            // Hedef rozetleri
            { id:'daily_goal',    icon:'🎯', name:'Hedef Tutan',    desc:'Günlük hedefe ulaş',          cond: (stats.todayAyahs||0)>=(stats.dailyGoal||10) },
            { id:'day_streak3',   icon:'🔥', name:'3 Gün Streak',   desc:'3 gün üst üste giriş',        cond: (stats.streakDays||0)>=3 },
            { id:'day_streak7',   icon:'🔥', name:'7 Gün Streak',   desc:'7 gün üst üste giriş',        cond: (stats.streakDays||0)>=7 },
            { id:'day_streak30',  icon:'💫', name:'30 Gün Streak',  desc:'30 gün üst üste giriş',       cond: (stats.streakDays||0)>=30 },
            // Özel
            { id:'ramadan',       icon:'🌙', name:'Ramazan Ruhu',   desc:'Ramazan ayında giriş yap',    cond: new Date().getMonth()===2 },
            { id:'early_bird',    icon:'🌅', name:'Sabah Namazı',   desc:'Sabah 5-7 arası oku',         cond: (()=>{ const h=new Date().getHours(); return h>=5&&h<7; })() },
            { id:'night_reader',  icon:'🌃', name:'Gece Okuyanı',   desc:'Gece 22-02 arası oku',        cond: (()=>{ const h=new Date().getHours(); return h>=22||h<2; })() },
        ];

        el.innerHTML = BADGES.map(b => `
            <div style="background:${b.cond?'#1a3a1a':'#1e293b'};border:1.5px solid ${b.cond?'#6ee7b7':'#334155'};border-radius:14px;padding:12px 8px;text-align:center;transition:0.3s;opacity:${b.cond?'1':'0.5'}">
                <div style="font-size:1.8rem;margin-bottom:4px">${b.icon}</div>
                <div style="color:${b.cond?'#6ee7b7':'#94a3b8'};font-size:0.78rem;font-weight:bold;font-family:sans-serif">${b.name}</div>
                <div style="color:#475569;font-size:0.68rem;font-family:sans-serif;margin-top:2px">${b.desc}</div>
                ${b.cond?'<div style="color:#6ee7b7;font-size:0.65rem;margin-top:3px">✅ Kazanıldı</div>':''}
            </div>`).join('');
    }

    // ============================================================
    // 📅 DİNİ GÜNLER TAKVİMİ
    // ============================================================
    _renderCalendar() {
        const el = document.getElementById('calendarContent');
        if (!el || el.dataset.loaded) return;
        el.dataset.loaded = '1';
        const year = new Date().getFullYear();
        const events = [
            { month:1,  day:1,  name:'Yılbaşı',                    icon:'🎊', color:'#64748b' },
            { month:1,  day:28, name:'Regaip Kandili (yaklaşık)',   icon:'🌙', color:'#6ee7b7' },
            { month:2,  day:26, name:'Miraç Kandili (yaklaşık)',    icon:'✨', color:'#6ee7b7' },
            { month:3,  day:14, name:'Berat Kandili (yaklaşık)',    icon:'🕌', color:'#6ee7b7' },
            { month:3,  day:1,  name:'Ramazan Başlangıcı (yaklaşık)',icon:'🌙',color:'#f59e0b' },
            { month:3,  day:31, name:'Kadir Gecesi (yaklaşık)',     icon:'⭐', color:'#fcd34d' },
            { month:4,  day:1,  name:'Ramazan Bayramı 1. Günü',    icon:'🎉', color:'#f59e0b' },
            { month:4,  day:2,  name:'Ramazan Bayramı 2. Günü',    icon:'🎉', color:'#f59e0b' },
            { month:4,  day:3,  name:'Ramazan Bayramı 3. Günü',    icon:'🎉', color:'#f59e0b' },
            { month:4,  day:23, name:'Ulusal Egemenlik ve Çocuk Bayramı', icon:'🏅', color:'#38bdf8' },
            { month:5,  day:19, name:'Atatürk\'ü Anma, Gençlik Bayramı', icon:'🏅', color:'#38bdf8' },
            { month:6,  day:5,  name:'Kurban Bayramı 1. Günü (yaklaşık)', icon:'🎊', color:'#f59e0b' },
            { month:6,  day:7,  name:'Kurban Bayramı 3. Günü',     icon:'🎊', color:'#f59e0b' },
            { month:9,  day:12, name:'Hz. Muhammed\'in Doğumu (yaklaşık)',icon:'☪️',color:'#6ee7b7' },
            { month:10, day:29, name:'Cumhuriyet Bayramı',          icon:'🏅', color:'#38bdf8' },
        ];
        const now = new Date();
        const nowDay = now.getMonth()*100+now.getDate();
        const sorted = [...events].sort((a,b)=>(a.month*100+a.day)-(b.month*100+b.day));
        const upcoming = sorted.filter(e=>e.month*100+e.day>=nowDay).slice(0,8);
        const past = sorted.filter(e=>e.month*100+e.day<nowDay);
        const render = arr => arr.map(e=>{
            const d=new Date(year,e.month-1,e.day);
            const diff=Math.ceil((d-now)/(1000*60*60*24));
            const diffText=diff===0?'Bugün!':diff>0?`${diff} gün sonra`:`${Math.abs(diff)} gün önce`;
            return `<div style="background:#1e293b;border:1px solid #334155;border-left:3px solid ${e.color};border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:12px;font-family:sans-serif">
                <div style="font-size:1.4rem">${e.icon}</div>
                <div style="flex:1">
                    <div style="color:#e2e8f0;font-size:0.88rem;font-weight:600">${e.name}</div>
                    <div style="color:#64748b;font-size:0.75rem">${e.day} ${['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][e.month]} ${year}</div>
                </div>
                <div style="color:${e.color};font-size:0.75rem;font-weight:bold;white-space:nowrap">${diffText}</div>
            </div>`;
        }).join('');
        el.innerHTML = `
            <div style="color:#f59e0b;font-size:0.78rem;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-family:sans-serif">Yaklaşan Günler</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">${render(upcoming)}</div>
            ${past.length?`<div style="color:#475569;font-size:0.78rem;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-family:sans-serif">Geçen Günler</div><div style="display:flex;flex-direction:column;gap:6px;opacity:0.55">${render(past)}</div>`:''}`;
    }

    // ============================================================
    // 📤 AYET PAYLAŞMA
    // ============================================================
    _initSharePanel() {
        const preview = document.getElementById('shareVersePreview');
        if (!preview) return;
        const surahId = this.state.currentSurahId;
        const ayahId = this.state.currentAyahId || 1;
        const meta = this.state.surahMetadata.find(m=>m.id===surahId);
        const surahName = meta?.name || `Sure ${surahId}`;
        const surahData = this.state.surahCache.get(surahId);
        const arabic = surahData?.verse[`verse_${ayahId}`] || '';
        const meal = this.state.mealCache?.[surahId]?.find(v=>v.verse===ayahId)?.text || '';
        const shareText = `${arabic}\n\n"${meal}"\n\n📖 ${surahName} Suresi - ${ayahId}. Ayet\nKur\'an-ı Kerim Oku`;
        preview.innerHTML = `
            <div style="font-size:1.2rem;color:#e2e8f0;direction:rtl;font-family:'Amiri Quran',serif;margin-bottom:6px">${arabic||'Önce bir sure açıp ayet seçin'}</div>
            ${meal?`<div style="color:#94a3b8;font-size:0.82rem;direction:ltr;font-family:sans-serif">"${meal}"</div>`:''}
            ${surahName?`<div style="color:#f59e0b;font-size:0.75rem;font-family:sans-serif;margin-top:4px">📖 ${surahName} - ${ayahId}. Ayet</div>`:''}`;
        const enc = encodeURIComponent(shareText);
        const wa = document.getElementById('shareWhatsApp');
        const tw = document.getElementById('shareTwitter');
        const tg = document.getElementById('shareTelegram');
        const cp = document.getElementById('shareCopy');
        if (wa && !wa._bound) {
            wa._bound=true;
            wa.onclick=()=>window.open(`https://wa.me/?text=${enc}`,'_blank');
            tw.onclick=()=>window.open(`https://twitter.com/intent/tweet?text=${enc}`,'_blank');
            tg.onclick=()=>window.open(`https://t.me/share/url?url=https://kuran-ae9ae.web.app&text=${enc}`,'_blank');
            cp.onclick=()=>{ navigator.clipboard.writeText(shareText); this._showToast('📋 Kopyalandı!','#6ee7b7'); };
        }
    }

    // ============================================================
    // 🌐 PRESENCE (ONLINE KULLANICI SAYISI)
    // ============================================================
    _initPresence(uid, displayName) {
        if (!window.FirebaseAuth?.setUserPresence) return;
        window.FirebaseAuth.setUserPresence(uid, displayName);
        // Sayfa kapatılınca offline yap
        window.addEventListener('beforeunload', () => window.FirebaseAuth.clearUserPresence(uid));
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) window.FirebaseAuth.clearUserPresence(uid);
            else window.FirebaseAuth.setUserPresence(uid, displayName);
        });
    }

    async _loadPinnedMessageFromFirebase() {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'settings', 'pinnedMsg'));
            if (!snap.exists()) return;
            const data = snap.data();
            if (!data.active || !data.text) return;
            if (document.getElementById('pinnedMsgBar')) return;
            const bar = document.createElement('div');
            bar.id = 'pinnedMsgBar';
            bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99998;background:#1e293b;border-top:2px solid #f59e0b;color:#e2e8f0;padding:10px 50px 10px 20px;font-size:0.88rem;font-family:sans-serif;text-align:center';
            bar.innerHTML = `📌 ${data.text} <button onclick="document.getElementById('pinnedMsgBar').remove()" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:#334155;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;color:#94a3b8">✕</button>`;
            document.body.appendChild(bar);
        } catch(e) {}
    }

    // ============================================================
    // 💬 FLOATING BUBBLE MENÜ
    // ============================================================
    _initBubbleMenu() {
        const menu    = document.getElementById('bubbleMenu');
        const trigger = document.getElementById('bubbleTrigger');
        const grid    = document.getElementById('bubbleGrid');
        const wrapper = document.getElementById('bubblePagesWrapper');
        if (!trigger || !grid || !menu) return;

        let isOpen    = false;
        let curPage   = 1;
        const PAGES   = 3;
        let menuDragX, menuDragY, menuOrigLeft, menuOrigBottom, menuDragging = false;

        // ── SAYFA GEÇİŞİ (track kayma) ──
        const track = document.getElementById('bubblePagesTrack');
        const showPage = (n) => {
            curPage = Math.max(1, Math.min(PAGES, n));
            if (track) {
                // Her sayfa wrapper'ın 1/3'ü kadar — sola kaydır
                track.style.transform = `translateX(-${(curPage - 1) * (100 / 3)}%)`;
            }
            document.querySelectorAll('.bubble-dot').forEach((d, i) => {
                d.classList.toggle('active', i + 1 === curPage);
            });
        };

        // Noktalara tıkla
        document.querySelectorAll('.bubble-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                showPage(parseInt(dot.dataset.page));
            });
        });

        // ── AÇ / KAPAT ──
        const open = () => {
            isOpen = true;
            grid.classList.remove('hidden');
            trigger.classList.add('open');
            trigger.querySelector('.bubble-trigger-icon').textContent = '✕';
            const rect = menu.getBoundingClientRect();
            grid.style.bottom = rect.top > window.innerHeight * 0.55 ? '70px' : 'auto';
            grid.style.top    = rect.top > window.innerHeight * 0.55 ? 'auto' : '70px';
            grid.style.right  = rect.left > 260 ? '0' : 'auto';
            grid.style.left   = rect.left > 260 ? 'auto' : '0';
            showPage(curPage);
        };
        const close = () => {
            isOpen = false;
            grid.classList.add('hidden');
            trigger.classList.remove('open');
            trigger.querySelector('.bubble-trigger-icon').textContent = '☰';
        };

        // ── TEK / ÇİFT TIKLAMA ──
        let lastClickTime = 0;
        trigger.addEventListener('click', (e) => {
            if (menuDragging) return;
            e.stopPropagation();
            const now = Date.now();
            if (now - lastClickTime < 380) {
                close(); lastClickTime = 0;
                this.playAyah(this.state.currentSurahId, 1);
                this._showToast('▶️ Sure baştan oynatılıyor…', '#38bdf8');
                return;
            }
            lastClickTime = now;
            isOpen ? close() : open();
        });

        document.addEventListener('click', (e) => {
            if (isOpen && !menu.contains(e.target)) close();
        });

        // ── BALONCUĞU SÜRÜKLE (menü pozisyonu) ──
        let dragStartX, dragStartY;
        const onDragStart = (e) => {
            if (!trigger.contains(e.target)) return;
            menuDragging = false;
            const t = e.touches ? e.touches[0] : e;
            dragStartX = t.clientX; dragStartY = t.clientY;
            const rect = menu.getBoundingClientRect();
            menuOrigLeft   = rect.left;
            menuOrigBottom = window.innerHeight - rect.bottom;
            menu.style.right = 'auto'; menu.style.top = 'auto';
            menu.style.left   = menuOrigLeft   + 'px';
            menu.style.bottom = menuOrigBottom + 'px';
            close();
            e.preventDefault();
        };
        const onDragMove = (e) => {
            if (dragStartX === undefined) return;
            const t = e.touches ? e.touches[0] : e;
            const dx = t.clientX - dragStartX, dy = t.clientY - dragStartY;
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) menuDragging = true;
            if (!menuDragging) return;
            menu.style.left   = Math.max(0, Math.min(window.innerWidth  - 64, menuOrigLeft   + dx)) + 'px';
            menu.style.bottom = Math.max(0, Math.min(window.innerHeight - 64, menuOrigBottom - dy)) + 'px';
            e.preventDefault();
        };
        const onDragEnd = () => { dragStartX = dragStartY = undefined; };

        trigger.addEventListener('mousedown',  onDragStart, { passive: false });
        trigger.addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('mousemove', onDragMove,  { passive: false });
        document.addEventListener('touchmove', onDragMove,  { passive: false });
        document.addEventListener('mouseup',   onDragEnd);
        document.addEventListener('touchend',  onDragEnd);

        // ── SAYFALARI SWIPE İLE GEÇ ──
        let swipeStartX, swipeStartY, swipeActive = false;
        const swipeTarget = track || wrapper;
        if (swipeTarget) {
            swipeTarget.addEventListener('touchstart', (e) => {
                const t = e.touches[0];
                swipeStartX = t.clientX; swipeStartY = t.clientY; swipeActive = true;
            }, { passive: true });
            swipeTarget.addEventListener('touchend', (e) => {
                if (!swipeActive) return;
                const dx = e.changedTouches[0].clientX - swipeStartX;
                const dy = e.changedTouches[0].clientY - swipeStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
                    showPage(dx < 0 ? curPage + 1 : curPage - 1);
                }
                swipeActive = false;
            }, { passive: true });
            // Mouse swipe (desktop)
            let mouseSwipeX;
            swipeTarget.addEventListener('mousedown', (e) => { mouseSwipeX = e.clientX; });
            swipeTarget.addEventListener('mouseup', (e) => {
                if (mouseSwipeX === undefined) return;
                const dx = e.clientX - mouseSwipeX;
                if (Math.abs(dx) > 40) showPage(dx < 0 ? curPage + 1 : curPage - 1);
                mouseSwipeX = undefined;
            });
        }

        // ── SAYFA 3 ÖZEL BUTONLARI ──
        const themeBtn = document.getElementById('bubbleThemeBtn');
        if (themeBtn) themeBtn.onclick = () => {
            document.body.classList.toggle('light');
            localStorage.setItem('qp_theme', document.body.classList.contains('light') ? 'light' : 'dark');
            setTimeout(close, 80);
        };
        const topBtn = document.getElementById('bubbleTopBtn');
        if (topBtn) topBtn.onclick = () => { window.scrollTo({top:0,behavior:'smooth'}); setTimeout(close,80); };
        const reloadBtn = document.getElementById('bubbleReloadBtn');
        if (reloadBtn) reloadBtn.onclick = () => { if (confirm('Sayfayı yenile?')) location.reload(); };
        const karaokeMenuBtn = document.getElementById('karaokeMenuBtn');
        if (karaokeMenuBtn) karaokeMenuBtn.onclick = () => { this._toggleKaraoke(); setTimeout(close,80); };

        // Buton tıklamada kapat
        document.querySelectorAll('.bubble-btn').forEach(btn => {
            if (!['bubbleThemeBtn','bubbleTheme2Btn','bubbleTopBtn','bubbleReloadBtn'].includes(btn.id))
                btn.addEventListener('click', () => setTimeout(close, 80));
        });
    }
    // ============================================================
    // 🎤 KARAOKE — KELIME KELIME VURGULAMA
    // ============================================================

    async _karaokeStart(surahId, ayahId) {
        // Önceki karaoke temizle
        this._karaokeClear();
        this.karaoke = { surahId, ayahId, timings: null, wordIndex: -1 };

        // Kelime span'larını al
        const unit = document.getElementById(`ayah-unit-v15-${ayahId}`);
        if (!unit) return;
        const words = unit.querySelectorAll('.ayah-word');
        if (!words.length) return;
        this.karaoke.words = words;

        // 1) Everyayah timing API'sini dene
        try {
            const s = surahId.toString().padStart(3, '0');
            const a = ayahId.toString().padStart(3, '0');
            const url = `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${s}${a}.mp3`;
            // Timing verisi: everyayah word-by-word JSON
            const timingUrl = `https://raw.githubusercontent.com/islamic-network/cdn/master/info/ayah-timings/${surahId}_${ayahId}.json`;
            const res = await fetch(timingUrl, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                const data = await res.json();
                if (data && data.words) {
                    this.karaoke.timings = data.words.map(w => w.timestamp || w.start_time || 0);
                    return; // timing var, _karaokeUpdate halleder
                }
            }
        } catch(e) { /* API yok, tahmini moda geç */ }

        // 2) Tahmini mod — ses süresi / kelime sayısı
        this._karaokeEstimatedMode();
    }

    _karaokeEstimatedMode() {
        // Ses yüklenince süreyi al, kelimelere eşit böl
        const audio = this.state.audioPlayer;
        const setupEstimate = () => {
            const dur = audio.duration;
            if (!dur || isNaN(dur)) return;
            const words = this.karaoke.words;
            const count  = words.length;
            // Her kelimeye eşit süre
            this.karaoke.timings = Array.from({length: count}, (_, i) => (dur / count) * i);
        };
        if (audio.duration && !isNaN(audio.duration)) {
            setupEstimate();
        } else {
            audio.addEventListener('loadedmetadata', setupEstimate, { once: true });
            audio.addEventListener('canplay', setupEstimate, { once: true });
        }
    }

    _karaokeUpdate() {
        if (!this.karaoke || !this.karaoke.timings || !this.karaoke.words) return;
        const t = this.state.audioPlayer.currentTime;
        const timings = this.karaoke.timings;
        const words   = this.karaoke.words;

        // Hangi kelime oynuyor?
        let idx = 0;
        for (let i = 0; i < timings.length; i++) {
            if (t >= timings[i]) idx = i;
            else break;
        }

        if (idx === this.karaoke.wordIndex) return; // değişmedi
        this.karaoke.wordIndex = idx;

        // Önceki vurguyu kaldır
        words.forEach(w => w.classList.remove('karaoke-active', 'karaoke-done'));

        // Geçmiş kelimeleri "done", aktifi "active" yap
        words.forEach((w, i) => {
            if (i < idx)  w.classList.add('karaoke-done');
            if (i === idx) w.classList.add('karaoke-active');
        });
    }

    _karaokeClear() {
        if (this.karaoke && this.karaoke.words) {
            this.karaoke.words.forEach(w => w.classList.remove('karaoke-active', 'karaoke-done'));
        }
        this.karaoke = null;
    }

    _logBranding() { console.log("%c🕋 QURAN PORTAL v18.0 %cFIREBASE EDITION", "color: #38bdf8; font-size: 24px; font-weight: bold;", "color: #d4af37; font-size: 14px;"); }

    async _loadSiteBanner() {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'settings', 'announcement'));
            if (!snap.exists()) return;
            const data = snap.data();
            if (!data.active || !data.text) return;
            // Banner zaten var mı?
            if (document.getElementById('siteBanner')) return;
            const banner = document.createElement('div');
            banner.id = 'siteBanner';
            banner.innerHTML = `
                <span id="siteBannerText">📢 ${data.text}</span>
                <button id="siteBannerClose" onclick="document.getElementById('siteBanner').remove()">✕</button>
            `;
            document.body.prepend(banner);
        } catch(e) { /* sessiz */ }
    }


    // ============================================================
    // 📖 TEFSİR PANELİ
    // ============================================================
    async _initTefsirPanel(surahId, ayahId) {
        const panel = document.getElementById('tefsirPanel');
        if (!panel) return;
        panel.classList.remove('hidden');
        const content = document.getElementById('tefsirContent');
        if (!content) return;
        content.innerHTML = '<div style="color:#94a3b8;font-family:sans-serif;text-align:center;padding:20px">⏳ Tefsir yükleniyor...</div>';
        try {
            const res = await fetch(`https://api.quran.com/api/v4/tafsirs/tr-diyanet-isleri/by_ayah/${surahId}:${ayahId}`);
            if (!res.ok) throw new Error();
            const json = await res.json();
            const text = json.tafsir?.text || '';
            const clean = text.replace(/<[^>]+>/g,'').trim();
            const meta = this.state.surahMetadata.find(m=>m.id===surahId);
            content.innerHTML = `
                <div style="font-family:sans-serif;direction:ltr">
                    <div style="color:#d4af37;font-weight:bold;font-size:0.9rem;margin-bottom:10px">
                        📖 ${meta?.name||'Sure'} Suresi — ${ayahId}. Ayet Tefsiri
                    </div>
                    <div style="color:#e2e8f0;font-size:0.88rem;line-height:1.9;border-left:3px solid #d4af37;padding-left:12px">
                        ${clean||'Bu ayet için tefsir bulunamadı.'}
                    </div>
                    <div style="color:#64748b;font-size:0.72rem;margin-top:10px">Kaynak: Diyanet İşleri Tefsiri</div>
                </div>`;
        } catch(e) {
            content.innerHTML = `<div style="color:#f87171;font-family:sans-serif;font-size:0.85rem;padding:10px">❌ Tefsir yüklenemedi. İnternet bağlantınızı kontrol edin.</div>`;
        }
    }

    // ============================================================
    // 🗣️ ESMAÜL HÜSNA PANELİ
    // ============================================================
    _initEsmaPanel() {
        const esma = [
            {ar:"الرَّحْمَنُ",tr:"Er-Rahman",mean:"Sonsuz merhamet sahibi"},
            {ar:"الرَّحِيمُ",tr:"Er-Rahim",mean:"Çok bağışlayıcı, merhamet eden"},
            {ar:"الْمَلِكُ",tr:"El-Melik",mean:"Mülkün sahibi, hükümdar"},
            {ar:"الْقُدُّوسُ",tr:"El-Kuddüs",mean:"Her türlü eksiklikten münezzeh"},
            {ar:"السَّلَامُ",tr:"Es-Selam",mean:"Her türlü tehlikeden emin kılan"},
            {ar:"الْمُؤْمِنُ",tr:"El-Mü\'min",mean:"Güven veren, inanan"},
            {ar:"الْمُهَيْمِنُ",tr:"El-Müheymin",mean:"Her şeyi gözetip koruyan"},
            {ar:"الْعَزِيزُ",tr:"El-Aziz",mean:"İzzet sahibi, üstün, güçlü"},
            {ar:"الْجَبَّارُ",tr:"El-Cebbar",mean:"Her şeye galip gelen"},
            {ar:"الْمُتَكَبِّرُ",tr:"El-Mütekebbir",mean:"Kibriya ve azamet sahibi"},
            {ar:"الْخَالِقُ",tr:"El-Halik",mean:"Her şeyi yaratan"},
            {ar:"الْبَارِئُ",tr:"El-Bari\'",mean:"Eşsiz şekilde yaratan"},
            {ar:"الْمُصَوِّرُ",tr:"El-Musavvir",mean:"Her şeye şekil veren"},
            {ar:"الْغَفَّارُ",tr:"El-Gaffar",mean:"Çok affeden, mağfiret eden"},
            {ar:"الْقَهَّارُ",tr:"El-Kahhar",mean:"Her şeye hakim olan"},
            {ar:"الْوَهَّابُ",tr:"El-Vehhab",mean:"Karşılıksız veren"},
            {ar:"الرَّزَّاقُ",tr:"Er-Rezzak",mean:"Rızık veren"},
            {ar:"الْفَتَّاحُ",tr:"El-Fettah",mean:"Her şeyi açan, müşkülleri gideren"},
            {ar:"الْعَلِيمُ",tr:"El-Alim",mean:"Her şeyi bilen"},
            {ar:"الْقَابِضُ",tr:"El-Kabız",mean:"Daraltan, alan"},
            {ar:"الْبَاسِطُ",tr:"El-Basit",mean:"Genişleten, veren"},
            {ar:"الْخَافِضُ",tr:"El-Hafıd",mean:"Alçaltan"},
            {ar:"الرَّافِعُ",tr:"Er-Rafi\'",mean:"Yükselten"},
            {ar:"الْمُعِزُّ",tr:"El-Muizz",mean:"İzzet veren"},
            {ar:"الْمُذِلُّ",tr:"El-Müzill",mean:"Zillete düşüren"},
            {ar:"السَّمِيعُ",tr:"Es-Semi'",mean:"Her şeyi işiten"},
            {ar:"الْبَصِيرُ",tr:"El-Basir",mean:"Her şeyi gören"},
            {ar:"الْحَكَمُ",tr:"El-Hakem",mean:"Hükmeden, hakim"},
            {ar:"الْعَدْلُ",tr:"El-Adl",mean:"Mutlak adalet sahibi"},
            {ar:"اللَّطِيفُ",tr:"El-Latif",mean:"Her şeyin inceliğini bilen, lütufkâr"},
            {ar:"الْخَبِيرُ",tr:"El-Habir",mean:"Her şeyden haberdar olan"},
            {ar:"الْحَلِيمُ",tr:"El-Halim",mean:"Cezalandırmada acele etmeyen"},
            {ar:"الْعَظِيمُ",tr:"El-Azim",mean:"Yüceliği sonsuz olan"},
            {ar:"الْغَفُورُ",tr:"El-Gafur",mean:"Çok affeden"},
            {ar:"الشَّكُورُ",tr:"Eş-Şekur",mean:"Az amele çok sevap veren"},
            {ar:"الْعَلِيُّ",tr:"El-Aliyy",mean:"Yüce, yüksek"},
            {ar:"الْكَبِيرُ",tr:"El-Kebir",mean:"Büyüklükte sonsuz olan"},
            {ar:"الْحَفِيظُ",tr:"El-Hafız",mean:"Her şeyi koruyan"},
            {ar:"الْمُقِيتُ",tr:"El-Mukit",mean:"Rızık ve kuvvet veren"},
            {ar:"الْحَسِيبُ",tr:"El-Hasib",mean:"Hesap gören"},
            {ar:"الْجَلِيلُ",tr:"El-Celil",mean:"Celal sahibi, yüce"},
            {ar:"الْكَرِيمُ",tr:"El-Kerim",mean:"Çok cömert, ikram eden"},
            {ar:"الرَّقِيبُ",tr:"Er-Rakib",mean:"Her şeyi gözetip izleyen"},
            {ar:"الْمُجِيبُ",tr:"El-Mücib",mean:"Duaları kabul eden"},
            {ar:"الْوَاسِعُ",tr:"El-Vasi\'",mean:"Rahmeti her şeyi kuşatan"},
            {ar:"الْحَكِيمُ",tr:"El-Hakim",mean:"Hikmeti sonsuz olan"},
            {ar:"الْوَدُودُ",tr:"El-Vedud",mean:"Çok seven, sevilen"},
            {ar:"الْمَجِيدُ",tr:"El-Mecid",mean:"Şan ve şeref sahibi"},
            {ar:"الْبَاعِثُ",tr:"El-Bais",mean:"Ölüleri dirilten"},
            {ar:"الشَّهِيدُ",tr:"Eş-Şehid",mean:"Her şeye şahit olan"},
            {ar:"الْحَقُّ",tr:"El-Hakk",mean:"Varlığı zorunlu, değişmez olan"},
            {ar:"الْوَكِيلُ",tr:"El-Vekil",mean:"Her şeyin yöneticisi"},
            {ar:"الْقَوِيُّ",tr:"El-Kaviyy",mean:"Güç ve kuvvet sahibi"},
            {ar:"الْمَتِينُ",tr:"El-Metin",mean:"Kuvveti pek sağlam olan"},
            {ar:"الْوَلِيُّ",tr:"El-Veliyy",mean:"Dost, yardımcı"},
            {ar:"الْحَمِيدُ",tr:"El-Hamid",mean:"Övülmeye layık olan"},
            {ar:"الْمُحْصِي",tr:"El-Muhsi",mean:"Her şeyi sayan, bilen"},
            {ar:"الْمُبْدِئُ",tr:"El-Mübdi\'",mean:"Yoktan var eden"},
            {ar:"الْمُعِيدُ",tr:"El-Muid",mean:"Yeniden yaratan"},
            {ar:"الْمُحْيِي",tr:"El-Muhyi",mean:"Hayat veren"},
            {ar:"الْمُمِيتُ",tr:"El-Mümit",mean:"Ölümü yaratan"},
            {ar:"الْحَيُّ",tr:"El-Hayy",mean:"Diri, ölümsüz"},
            {ar:"الْقَيُّومُ",tr:"El-Kayyum",mean:"Her şeyi ayakta tutan"},
            {ar:"الْوَاجِدُ",tr:"El-Vacid",mean:"Her şeyi bulan"},
            {ar:"الْمَاجِدُ",tr:"El-Macid",mean:"Kerem ve şan sahibi"},
            {ar:"الْواحِدُ",tr:"El-Vahid",mean:"Tek, eşi benzeri olmayan"},
            {ar:"الصَّمَدُ",tr:"Es-Samed",mean:"Her şey ona muhtaç, o kimseye muhtaç değil"},
            {ar:"الْقَادِرُ",tr:"El-Kadir",mean:"Gücü her şeye yeten"},
            {ar:"الْمُقْتَدِرُ",tr:"El-Muktedir",mean:"İstediği gibi tasarruf eden"},
            {ar:"الْمُقَدِّمُ",tr:"El-Mukaddim",mean:"Öne geçiren"},
            {ar:"الْمُؤَخِّرُ",tr:"El-Muahhir",mean:"Geriye bırakan"},
            {ar:"الْأَوَّلُ",tr:"El-Evvel",mean:"İlk, başlangıcı olmayan"},
            {ar:"الْآخِرُ",tr:"El-Ahir",mean:"Son, sonu olmayan"},
            {ar:"الظَّاهِرُ",tr:"Ez-Zahir",mean:"Varlığı açık, aşikâr"},
            {ar:"الْبَاطِنُ",tr:"El-Batın",mean:"Gizli, her şeyin iç yüzünü bilen"},
            {ar:"الْوَالِي",tr:"El-Vali",mean:"Mülkün sahibi ve yöneticisi"},
            {ar:"الْمُتَعَالِي",tr:"El-Müteali",mean:"Çok yüce"},
            {ar:"الْبَرُّ",tr:"El-Berr",mean:"İyilik kaynağı"},
            {ar:"التَّوَّابُ",tr:"Et-Tevvab",mean:"Tövbeleri kabul eden"},
            {ar:"الْمُنْتَقِمُ",tr:"El-Müntekim",mean:"Suçluları cezalandıran"},
            {ar:"الْعَفُوُّ",tr:"El-Afüvv",mean:"Affeden, bağışlayan"},
            {ar:"الرَّؤُوفُ",tr:"Er-Rauf",mean:"Çok şefkatli"},
            {ar:"مَالِكُ الْمُلْكِ",tr:"Malikül-Mülk",mean:"Mülkün gerçek sahibi"},
            {ar:"ذُو الْجَلَالِ وَالْإِكْرَامِ",tr:"Zül-Celali vel-İkram",mean:"Celal ve ikram sahibi"},
            {ar:"الْمُقْسِطُ",tr:"El-Muksit",mean:"Adaletli davranan"},
            {ar:"الْجَامِعُ",tr:"El-Cami\'",mean:"Her şeyi toplayan"},
            {ar:"الْغَنِيُّ",tr:"El-Ganiyy",mean:"Kimseye muhtaç olmayan"},
            {ar:"الْمُغْنِي",tr:"El-Muğni",mean:"İstediğine zenginlik veren"},
            {ar:"الْمَانِعُ",tr:"El-Mani\'",mean:"Engelleyen, koruyan"},
            {ar:"الضَّارُّ",tr:"Ed-Darr",mean:"Zarar verme gücünü elinde tutan"},
            {ar:"النَّافِعُ",tr:"En-Nafi\'",mean:"Fayda veren"},
            {ar:"النُّورُ",tr:"En-Nur",mean:"Aydınlatan, nurlandıran"},
            {ar:"الْهَادِي",tr:"El-Hadi",mean:"Hidayet veren"},
            {ar:"الْبَدِيعُ",tr:"El-Bedi\'",mean:"Eşsiz yaratan"},
            {ar:"الْبَاقِي",tr:"El-Baki",mean:"Varlığı sonsuz olan"},
            {ar:"الْوَارِثُ",tr:"El-Varis",mean:"Her şeyin asıl sahibi"},
            {ar:"الرَّشِيدُ",tr:"Er-Reşid",mean:"Doğru yola ileten"},
            {ar:"الصَّبُورُ",tr:"Es-Sabur",mean:"Çok sabırlı olan"}
        ];
        const panel = document.getElementById('esmaPanel');
        if (!panel) return;
        const content = document.getElementById('esmaContent');
        if (!content || content.dataset.loaded) return;
        content.dataset.loaded = '1';
        let current = 0;
        const cards = esma.map((e,i) => `
            <div class="esma-card" onclick="this.classList.toggle('esma-flipped')" title="Tıkla - anlam göster">
                <div class="esma-front">
                    <div class="esma-num">${i+1}</div>
                    <div class="esma-arabic">${e.ar}</div>
                    <div class="esma-name">${e.tr}</div>
                </div>
                <div class="esma-back">
                    <div class="esma-meaning">${e.mean}</div>
                </div>
            </div>`).join('');
        content.innerHTML = `
            <div style="font-family:sans-serif;color:#94a3b8;font-size:0.75rem;text-align:center;margin-bottom:12px;direction:ltr">
                Tıklayarak anlamını gör • 99 isim
            </div>
            <div class="esma-grid">${cards}</div>`;
    }

    // ============================================================
    // 🏆 LİDERLİK TABLOSU
    // ============================================================
    async _initLeaderboard() {
        const panel = document.getElementById('leaderboardPanel');
        if (!panel) return;
        const content = document.getElementById('leaderboardContent');
        if (!content) return;
        content.innerHTML = '<div style="color:#94a3b8;font-family:sans-serif;text-align:center;padding:20px">⏳ Yükleniyor...</div>';
        try {
            if (!window.FirebaseAuth) throw new Error('Firebase yok');
            const { db, collection, getDocs, query, orderBy, limit } = window.FirebaseAuth;
            const q = query(collection(db, 'stats'), orderBy('ayahCount', 'desc'), limit(20));
            const snap = await getDocs(q);
            const rows = [];
            let rank = 1;
            snap.forEach(doc => {
                const d = doc.data();
                const name = d.displayName || d.email?.split('@')[0] || 'Anonim';
                const medals = ['🥇','🥈','🥉'];
                const medal = medals[rank-1] || `${rank}.`;
                rows.push(`
                    <div class="lb-row ${rank<=3?'lb-top':''}">
                        <span class="lb-rank">${medal}</span>
                        <span class="lb-name">${name}</span>
                        <span class="lb-score">${(d.ayahCount||0).toLocaleString()} ayet</span>
                        <span class="lb-surahs">${(d.surahsOpened||[]).length}/114 sure</span>
                    </div>`);
                rank++;
            });
            content.innerHTML = rows.length
                ? `<div class="lb-list">${rows.join('')}</div>`
                : '<div style="color:#94a3b8;font-family:sans-serif;text-align:center;padding:20px">Henüz kayıt yok.</div>';
        } catch(e) {
            content.innerHTML = '<div style="color:#f87171;font-family:sans-serif;font-size:0.85rem;padding:10px">Liderlik tablosu yüklenemedi.</div>';
        }
    }

    // ============================================================
    // 👥 HATİM GRUBU
    // ============================================================
    async _initHatimGroup() {
        const panel = document.getElementById('hatimPanel');
        if (!panel) return;
        const content = document.getElementById('hatimContent');
        if (!content) return;
        if (!window.FirebaseAuth || !this.state.currentUser) {
            content.innerHTML = '<div style="color:#f87171;font-family:sans-serif;padding:10px">Hatim grubu için giriş yapmanız gerekiyor.</div>';
            return;
        }
        const { db, collection, getDocs, doc, setDoc, getDoc, query } = window.FirebaseAuth;
        // Mevcut hatim gruplarını çek
        content.innerHTML = '<div style="color:#94a3b8;font-family:sans-serif;text-align:center;padding:20px">⏳ Yükleniyor...</div>';
        try {
            const snap = await getDocs(collection(db, 'hatimGroups'));
            let html = `<div style="font-family:sans-serif;direction:ltr">
                <div style="display:flex;gap:8px;margin-bottom:14px">
                    <input id="hatimGroupName" placeholder="Grup adı..." style="flex:1;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:7px 12px;border-radius:8px;font-size:0.85rem"/>
                    <button onclick="App._createHatimGroup()" style="background:#d4af37;color:#000;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:0.85rem;font-weight:bold">+ Oluştur</button>
                </div>
                <div id="hatimGroupList">`;
            if (snap.empty) {
                html += '<div style="color:#64748b;text-align:center;padding:16px">Henüz grup yok. İlk grubu oluştur!</div>';
            } else {
                snap.forEach(d => {
                    const g = d.data();
                    const prog = Math.round(((g.completedJuz||0)/30)*100);
                    html += `
                        <div style="background:#1e293b;border-radius:10px;padding:12px;margin-bottom:8px;border:1px solid #334155">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <span style="color:#e2e8f0;font-weight:bold">${g.name||'Grup'}</span>
                                <span style="color:#94a3b8;font-size:0.78rem">${(g.members||[]).length} üye</span>
                            </div>
                            <div style="margin:8px 0">
                                <div style="background:#0f172a;border-radius:4px;height:8px;overflow:hidden">
                                    <div style="background:#d4af37;height:100%;width:${prog}%;transition:width 0.5s"></div>
                                </div>
                                <div style="color:#94a3b8;font-size:0.72rem;margin-top:3px">${g.completedJuz||0}/30 Cüz tamamlandı (%${prog})</div>
                            </div>
                            <button onclick="App._joinHatimGroup('${d.id}')" style="background:#0ea5e9;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:0.78rem">Katıl</button>
                        </div>`;
                });
            }
            html += '</div></div>';
            content.innerHTML = html;
        } catch(e) {
            content.innerHTML = '<div style="color:#f87171;font-family:sans-serif;padding:10px">Hatim grubu yüklenemedi.</div>';
        }
    }

    async _createHatimGroup() {
        const name = document.getElementById('hatimGroupName')?.value?.trim();
        if (!name) return;
        if (!window.FirebaseAuth) return;
        const { db, collection, addDoc } = window.FirebaseAuth;
        await addDoc(collection(db, 'hatimGroups'), {
            name, members: [this.state.currentUser.uid],
            completedJuz: 0, createdAt: Date.now(),
            createdBy: this.state.currentUser.uid
        });
        this._showToast('✅ Hatim grubu oluşturuldu!', '#6ee7b7');
        this._initHatimGroup();
    }

    async _joinHatimGroup(groupId) {
        if (!window.FirebaseAuth) return;
        const { db, doc, updateDoc, arrayUnion } = window.FirebaseAuth;
        await updateDoc(doc(db, 'hatimGroups', groupId), {
            members: arrayUnion(this.state.currentUser.uid)
        });
        this._showToast('✅ Gruba katıldınız!', '#6ee7b7');
    }

    // ============================================================
    // 🔔 HATIRLATICI BİLDİRİMİ
    // ============================================================
    async _initNotifications() {
        const panel = document.getElementById('notifPanel');
        if (!panel) return;
        const content = document.getElementById('notifContent');
        if (!content) return;
        const saved = JSON.parse(localStorage.getItem('qp_notif') || '{"enabled":false,"time":"07:00","msg":"Günlük Kuran okuma zamani! 📖"}');
        content.innerHTML = `
            <div style="font-family:sans-serif;direction:ltr">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
                    <label style="color:#e2e8f0;font-size:0.88rem">Bildirim:</label>
                    <input type="checkbox" id="notifEnabled" ${saved.enabled?'checked':''} style="width:18px;height:18px;cursor:pointer"/>
                    <span id="notifStatus" style="color:${saved.enabled?'#6ee7b7':'#64748b'};font-size:0.82rem">${saved.enabled?'Açık':'Kapalı'}</span>
                </div>
                <div style="margin-bottom:12px">
                    <label style="color:#94a3b8;font-size:0.82rem;display:block;margin-bottom:4px">Hatırlatma saati:</label>
                    <input type="time" id="notifTime" value="${saved.time}" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:8px;font-size:0.9rem"/>
                </div>
                <div style="margin-bottom:12px">
                    <label style="color:#94a3b8;font-size:0.82rem;display:block;margin-bottom:4px">Mesaj:</label>
                    <input type="text" id="notifMsg" value="${saved.msg}" style="width:100%;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:8px;font-size:0.85rem;box-sizing:border-box"/>
                </div>
                <button onclick="App._saveNotification()" style="background:#d4af37;color:#000;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-weight:bold;font-size:0.85rem">💾 Kaydet</button>
                <button onclick="App._testNotification()" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:0.85rem;margin-left:8px">🔔 Test</button>
            </div>`;
        document.getElementById('notifEnabled').onchange = function() {
            document.getElementById('notifStatus').textContent = this.checked ? 'Açık' : 'Kapalı';
            document.getElementById('notifStatus').style.color = this.checked ? '#6ee7b7' : '#64748b';
        };
        this._scheduleNotification(saved);
    }

    _saveNotification() {
        const data = {
            enabled: document.getElementById('notifEnabled')?.checked || false,
            time: document.getElementById('notifTime')?.value || '07:00',
            msg: document.getElementById('notifMsg')?.value || 'Günlük Kur\'an okuma zamanı! 📖'
        };
        localStorage.setItem('qp_notif', JSON.stringify(data));
        this._scheduleNotification(data);
        this._showToast('✅ Bildirim ayarları kaydedildi', '#6ee7b7');
    }

    _testNotification() {
        if (Notification.permission === 'granted') {
            new Notification('📖 Kur\'an-ı Kerim', { body: 'Test bildirimi başarılı!', icon: '/favicon.ico' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => {
                if (p === 'granted') new Notification('📖 Kur\'an-ı Kerim', { body: 'Bildirimler aktif!', icon: '/favicon.ico' });
            });
        } else {
            this._showToast('❌ Bildirim izni reddedildi', '#f87171');
        }
    }

    _scheduleNotification(data) {
        if (this._notifInterval) clearInterval(this._notifInterval);
        if (!data.enabled) return;
        const check = () => {
            const now = new Date();
            const [h,m] = data.time.split(':').map(Number);
            if (now.getHours()===h && now.getMinutes()===m) {
                const last = localStorage.getItem('qp_notif_last');
                const today = now.toDateString();
                if (last !== today) {
                    localStorage.setItem('qp_notif_last', today);
                    if (Notification.permission === 'granted') {
                        new Notification('📖 Kur\'an-ı Kerim', { body: data.msg, icon: '/favicon.ico' });
                    } else {
                        Notification.requestPermission().then(p => {
                            if (p === 'granted') new Notification('📖 Kur\'an-ı Kerim', { body: data.msg, icon: '/favicon.ico' });
                        });
                    }
                }
            }
        };
        this._notifInterval = setInterval(check, 60000);
        check();
    }

    // ============================================================
    // 📚 OKUMA GEÇMİŞİ / KALDIĞIN YERDEN DEVAM
    // ============================================================
    _saveReadingPosition(surahId, ayahId) {
        const pos = { surahId, ayahId, time: Date.now() };
        localStorage.setItem('qp_lastpos', JSON.stringify(pos));
        // Geçmişe de ekle
        const hist = JSON.parse(localStorage.getItem('qp_history') || '[]');
        hist.unshift(pos);
        if (hist.length > 50) hist.pop();
        localStorage.setItem('qp_history', JSON.stringify(hist));
    }

    _loadLastPosition() {
        const pos = JSON.parse(localStorage.getItem('qp_lastpos') || 'null');
        if (!pos) return;
        const meta = this.state.surahMetadata.find(m=>m.id===pos.surahId);
        const surahName = meta?.name || `Sure ${pos.surahId}`;
        const timeStr = new Date(pos.time).toLocaleDateString('tr-TR', {day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});
        const bar = document.createElement('div');
        bar.id = 'resumeBar';
        bar.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9995;background:#1e293b;border:1.5px solid #d4af37;color:#e2e8f0;padding:10px 18px;border-radius:16px;font-family:sans-serif;font-size:0.82rem;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.5);white-space:nowrap;max-width:90vw';
        bar.innerHTML = `📖 Kaldığın yer: <strong style="color:#d4af37">${surahName} - ${pos.ayahId}. ayet</strong> <span style="color:#64748b">(${timeStr})</span>
            <button onclick="App._resumeReading()" style="background:#d4af37;color:#000;border:none;border-radius:8px;padding:4px 12px;cursor:pointer;font-weight:bold;font-size:0.8rem">▶ Devam Et</button>
            <button onclick="document.getElementById('resumeBar').remove()" style="background:transparent;border:none;color:#64748b;cursor:pointer;font-size:1rem">✕</button>`;
        document.body.appendChild(bar);
        setTimeout(() => bar?.remove(), 15000);
    }

    async _resumeReading() {
        const pos = JSON.parse(localStorage.getItem('qp_lastpos') || 'null');
        if (!pos) return;
        document.getElementById('resumeBar')?.remove();
        const meta = this.state.surahMetadata.find(m=>m.id===pos.surahId);
        if (meta) {
            // Sure seçicisini güncelle
            if (this.dom.surahInp) this.dom.surahInp.value = meta.name;
            const sel = document.getElementById('surahSelect');
            if (sel) sel.value = pos.surahId;
            // Sureyi yükle
            await this.loadSurah(pos.surahId);
            // Kısa bekle: sure render edilsin, sonra o ayetten başlat
            setTimeout(() => {
                // O ayetten sesi başlat
                this.playAyah(pos.surahId, pos.ayahId);
                // Ayet ekranda görünsün
                setTimeout(() => {
                    const el = document.getElementById(`ayah-unit-v15-${pos.ayahId}`);
                    if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
                }, 400);
            }, 600);
        }
    }

    // ============================================================
    // 🌙 OTOMATİK TEMA (GÜNE GÖRE)
    // ============================================================
    _initAutoTheme() {
        // Kullanıcı daha önce manuel tema seçtiyse dokunma
        const manual = localStorage.getItem('portal_theme');
        if (manual) return;
        // Hiç seçilmemişse gün saatine göre uygula
        const h = new Date().getHours();
        const isDay = h >= 6 && h < 19;
        document.body.classList.toggle('light', isDay);
        this.state.theme = isDay ? 'light' : 'dark';
        // Her saat başı kontrol et
        setInterval(() => {
            if (localStorage.getItem('portal_theme')) return;
            const hr = new Date().getHours();
            const day = hr >= 6 && hr < 19;
            document.body.classList.toggle('light', day);
        }, 3600000);
    }

    // ============================================================
    // 🎊 KUTLAMA ANİMASYONU
    // ============================================================
    _showCelebration(msg = '🎉 Tebrikler!') {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;pointer-events:none;';
        el.innerHTML = `
            <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:2px solid #d4af37;border-radius:24px;padding:32px 48px;text-align:center;animation:celebPop 0.4s cubic-bezier(.175,.885,.32,1.275);box-shadow:0 20px 60px rgba(0,0,0,0.8)">
                <div style="font-size:3rem;margin-bottom:8px">🏆</div>
                <div style="color:#d4af37;font-size:1.4rem;font-family:sans-serif;font-weight:bold">${msg}</div>
            </div>
            <style>@keyframes celebPop{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}</style>`;
        document.body.appendChild(el);
        // Konfeti efekti
        this._spawnConfetti();
        setTimeout(() => el.remove(), 3500);
    }

    _spawnConfetti() {
        const colors = ['#d4af37','#38bdf8','#6ee7b7','#f87171','#a78bfa'];
        for (let i = 0; i < 60; i++) {
            const p = document.createElement('div');
            const color = colors[Math.floor(Math.random()*colors.length)];
            const x = Math.random()*100, size = 6+Math.random()*8;
            p.style.cssText = `position:fixed;top:-10px;left:${x}vw;width:${size}px;height:${size}px;background:${color};border-radius:${Math.random()>0.5?'50%':'2px'};z-index:99998;animation:confettiFall ${1.5+Math.random()*2}s ease-in forwards;animation-delay:${Math.random()*0.8}s;pointer-events:none`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 4000);
        }
        if (!document.getElementById('confettiStyle')) {
            const s = document.createElement('style');
            s.id = 'confettiStyle';
            s.textContent = '@keyframes confettiFall{to{top:105vh;transform:rotate(720deg) translateX(50px);opacity:0}}';
            document.head.appendChild(s);
        }
    }

    _createBismillahModule(surahId) {
        const div = this._createElement('div', 'bismillah-v15', 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ');
        const isDark = !document.body.classList.contains('light');
        const baseColor = isDark ? '#2c1500' : '#2c1500';
        div.style.cssText = `color:${baseColor};opacity:1;font-size:3.2rem;text-align:center;margin:30px 0 50px 0;font-family:"Amiri Quran",serif;cursor:pointer;transition:color 0.3s ease;direction:rtl;display:block;width:100%;`;
        div.onclick = () => this.playAyah(surahId, 0);
        div.onmouseenter = () => { div.style.color = '#d4af37'; };
        div.onmouseleave = () => { div.style.color = baseColor; };
        return div;
    }

    _createOrnamentModule(n) {
        return this._createElement('span', 'ayah-ornament-v15', ` ﴿${this._toArabicDigits(n)}﴾ `);
    }

    // ============================================================
    // 📲 PWA INSTALL
    // ============================================================
    _initPWAInstall() {
        const btn = document.getElementById('pwaInstallBtn');
        if (!btn) return;

        // Store deferred prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this._deferredInstallPrompt = e;
            btn.style.display = 'block';
        });

        btn.onclick = async () => {
            if (!this._deferredInstallPrompt) {
                this._showToast('📲 Uygulama zaten kurulu veya tarayıcı desteklemiyor', '#94a3b8');
                return;
            }
            this._deferredInstallPrompt.prompt();
            const { outcome } = await this._deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                btn.style.display = 'none';
                this._showToast('✅ Uygulama ana ekrana eklendi!', '#6ee7b7');
            }
            this._deferredInstallPrompt = null;
        };

        window.addEventListener('appinstalled', () => {
            btn.style.display = 'none';
            this._deferredInstallPrompt = null;
        });
    }

    // ============================================================
    // 🔇 ÇEVRİMDIŞI ALGILAMA
    // ============================================================
    _initOfflineDetection() {
        const update = () => {
            const isOnline = navigator.onLine;
            const existing = document.getElementById('offlineBar');
            if (!isOnline) {
                if (!existing) {
                    const bar = document.createElement('div');
                    bar.id = 'offlineBar';
                    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#7f1d1d;color:#fca5a5;text-align:center;padding:6px;font-family:sans-serif;font-size:0.82rem;font-weight:bold';
                    bar.textContent = '🔇 Çevrimdışı Mod — İnternet bağlantısı yok';
                    document.body.prepend(bar);
                }
            } else {
                if (existing) existing.remove();
            }
        };
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        update();
    }

    // ============================================================
    // 🔇 ÇEVRİMDIŞI PANEL
    // ============================================================
    _initOfflinePanel() {
        const content = document.getElementById('offlineContent');
        if (!content) return;

        const isOnline = navigator.onLine;
        const cachedSurahs = this.state.surahCache.size;
        const totalSurahs = 114;
        const pct = Math.round((cachedSurahs / totalSurahs) * 100);

        content.innerHTML = `
            <div style="font-family:sans-serif;direction:ltr">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;background:${isOnline?'#064e3b':'#7f1d1d'};border-radius:10px;padding:10px 14px">
                    <span style="font-size:1.4rem">${isOnline ? '🟢' : '🔴'}</span>
                    <div>
                        <div style="color:${isOnline?'#6ee7b7':'#fca5a5'};font-weight:bold;font-size:0.9rem">${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</div>
                        <div style="color:#94a3b8;font-size:0.78rem">${isOnline ? 'İnternet bağlantısı aktif' : 'İnternet bağlantısı yok'}</div>
                    </div>
                </div>

                <div style="margin-bottom:14px">
                    <div style="display:flex;justify-content:space-between;color:#94a3b8;font-size:0.82rem;margin-bottom:6px">
                        <span>📦 Önbellekteki Sureler</span>
                        <span style="color:#d4af37">${cachedSurahs} / ${totalSurahs} (${pct}%)</span>
                    </div>
                    <div style="background:#1e293b;border-radius:6px;height:8px;overflow:hidden">
                        <div style="height:100%;background:linear-gradient(90deg,#d4af37,#f59e0b);width:${pct}%;transition:width 0.6s"></div>
                    </div>
                </div>

                <div style="color:#94a3b8;font-size:0.82rem;margin-bottom:14px;line-height:1.5">
                    Açılan sureler otomatik olarak önbelleğe alınır. Çevrimdışı kullanım için tüm sureleri önceden indirebilirsiniz.
                </div>

                <div style="display:flex;flex-direction:column;gap:8px">
                    <button id="downloadAllSurahsBtn" style="background:linear-gradient(135deg,#d4af37,#f59e0b);color:#000;border:none;border-radius:10px;padding:10px 16px;font-weight:bold;font-size:0.88rem;cursor:pointer">
                        ⬇️ Tüm Sureleri İndir (${totalSurahs - cachedSurahs} kaldı)
                    </button>
                    <button id="clearCacheBtn" style="background:#1e293b;color:#f87171;border:1px solid #334155;border-radius:10px;padding:10px 16px;font-size:0.88rem;cursor:pointer">
                        🗑️ Önbelleği Temizle
                    </button>
                </div>
                <div id="offlineDownloadStatus" style="color:#94a3b8;font-size:0.8rem;margin-top:10px;text-align:center"></div>
            </div>`;

        document.getElementById('downloadAllSurahsBtn').onclick = () => this._downloadAllSurahs();
        document.getElementById('clearCacheBtn').onclick = () => {
            this.state.surahCache.clear();
            this._initOfflinePanel();
            this._showToast('🗑️ Önbellek temizlendi', '#f87171');
        };
    }

    async _downloadAllSurahs() {
        const btn = document.getElementById('downloadAllSurahsBtn');
        const status = document.getElementById('offlineDownloadStatus');
        if (!btn || !status) return;
        btn.disabled = true;
        btn.textContent = '⏳ İndiriliyor...';
        let downloaded = 0, failed = 0;
        for (let i = 1; i <= 114; i++) {
            try {
                if (!this.state.surahCache.has(i)) {
                    await this._fetchSurahWithCache(i);
                    downloaded++;
                }
                status.textContent = `İlerleme: ${i}/114 sure işlendi`;
            } catch(e) { failed++; }
        }
        btn.disabled = false;
        const total = this.state.surahCache.size;
        btn.textContent = `✅ ${total}/114 sure önbellekte`;
        status.textContent = failed > 0 ? `⚠️ ${failed} sure indirilemedi` : '✅ Tüm sureler indirildi!';
        setTimeout(() => this._initOfflinePanel(), 1500);
    }
}

const App = new QuranPortal();
document.addEventListener('DOMContentLoaded', () => setTimeout(() => App.boot(), 100));
