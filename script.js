/**
 * ğŸ•‹ QURAN PORTAL OS v18.0 - FIREBASE EDITION
 * Firebase Auth + Firestore + Kelime Tooltip + Meal DÃ¼zeltmesi
 */

class QuranPortal {
    constructor() {
        this.config = {
            fuzzyThreshold: 0.35,
            ambiguityLimit: 0.12,
            scrollOffset: 250,
            animationDuration: 2500,
            renderBatchSize: 12,
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
            // ğŸ¤ KARAOKE
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

        // Basit ArapÃ§a â†’ TÃ¼rkÃ§e kelime sÃ¶zlÃ¼ÄŸÃ¼
        this.wordDict = {
            "Ø§Ù„Ù„ÙÙ‘Ù‡Ù": "Allah'Ä±n", "Ø§Ù„Ù„ÙÙ‘Ù‡Ù": "Allah", "Ø§Ù„Ø±ÙÙ‘Ø­Ù’Ù…ÙÙ†Ù": "Rahman (Ã§ok merhametli)",
            "Ø§Ù„Ø±ÙÙ‘Ø­ÙÙŠÙ…Ù": "Rahim (Ã§ok baÄŸÄ±ÅŸlayÄ±cÄ±)", "Ø¨ÙØ³Ù’Ù…Ù": "adÄ±yla", "Ø§Ù„Ù’Ø­ÙÙ…Ù’Ø¯Ù": "Hamd (Ã¶vgÃ¼)",
            "Ø±ÙØ¨ÙÙ‘": "Rabbi (Rabb'i)", "Ø§Ù„Ù’Ø¹ÙØ§Ù„ÙÙ…ÙÙŠÙ†Ù": "Ã¢lemlerin", "Ù…ÙØ§Ù„ÙÙƒÙ": "sahibi/hÃ¼kÃ¼mdarÄ±",
            "ÙŠÙÙˆÙ’Ù…Ù": "gÃ¼nÃ¼n", "Ø§Ù„Ø¯ÙÙ‘ÙŠÙ†Ù": "din/hesap", "Ø¥ÙÙŠÙÙ‘Ø§ÙƒÙ": "yalnÄ±z sana",
            "Ù†ÙØ¹Ù’Ø¨ÙØ¯Ù": "ibadet ederiz", "ÙˆÙØ¥ÙÙŠÙÙ‘Ø§ÙƒÙ": "ve yalnÄ±z senden", "Ù†ÙØ³Ù’ØªÙØ¹ÙÙŠÙ†Ù": "yardÄ±m isteriz",
            "Ø§Ù‡Ù’Ø¯ÙÙ†ÙØ§": "bizi hidayet et", "Ø§Ù„ØµÙÙ‘Ø±ÙØ§Ø·Ù": "yolu", "Ø§Ù„Ù’Ù…ÙØ³Ù’ØªÙÙ‚ÙÙŠÙ…Ù": "doÄŸru",
            "Ù‚ÙÙ„Ù’": "De ki", "Ù‡ÙÙˆÙ": "O", "Ø£ÙØ­ÙØ¯ÙŒ": "birdir/tektir", "Ø§Ù„ØµÙÙ‘Ù…ÙØ¯Ù": "Samed (hiÃ§bir ÅŸeye muhtaÃ§ olmayan)",
            "Ù„ÙÙ…Ù’": "deÄŸil/olmadÄ±", "ÙŠÙÙ„ÙØ¯Ù’": "doÄŸurmadÄ±", "ÙˆÙÙ„ÙÙ…Ù’": "ve olmadÄ±",
            "ÙŠÙÙˆÙ„ÙØ¯Ù’": "doÄŸurulmadÄ±", "ÙƒÙÙÙÙˆÙ‹Ø§": "denk/eÅŸit", "Ø¢Ù…ÙÙ†Ù": "iman etti",
            "Ø§Ù„Ù’ÙƒÙØªÙØ§Ø¨Ù": "Kitab'a", "Ù†ÙÙˆØ±ÙŒ": "nur/Ä±ÅŸÄ±k", "Ø±ÙØ­Ù’Ù…ÙØ©ÙŒ": "rahmet/merhamet",
            "Ø¹ÙÙ„ÙÙŠÙ…ÙŒ": "Ã§ok bilen", "Ø­ÙÙƒÙÙŠÙ…ÙŒ": "hÃ¼kÃ¼m sahibi/hikmet sahibi",
            "Ø®ÙØ¨ÙÙŠØ±ÙŒ": "haberdar olan", "Ù‚ÙØ¯ÙÙŠØ±ÙŒ": "gÃ¼cÃ¼ yeten", "ØºÙÙÙÙˆØ±ÙŒ": "baÄŸÄ±ÅŸlayan",
            "Ø§Ù„Ø³ÙÙ‘Ù…ÙØ§ÙˆÙØ§ØªÙ": "gÃ¶klerin", "Ø§Ù„Ù’Ø£ÙØ±Ù’Ø¶Ù": "yerin/topraÄŸÄ±n", "Ø®ÙÙ„ÙÙ‚Ù": "yarattÄ±",
            "Ø§Ù„Ù†ÙÙ‘Ø§Ø³Ù": "insanlarÄ±n", "Ø§Ù„Ù’Ø¬ÙÙ†ÙÙ‘": "cinlerin", "Ø§Ù„Ø´ÙÙ‘ÙŠÙ’Ø·ÙØ§Ù†Ù": "ÅŸeytanÄ±n",
            "Ø§Ù„Ù’Ù…ÙØ¤Ù’Ù…ÙÙ†ÙÙŠÙ†Ù": "mÃ¼minlerin", "Ø§Ù„Ù’Ù…ÙØªÙÙ‘Ù‚ÙÙŠÙ†Ù": "takva sahiplerinin",
            "ÙŠÙØ§": "Ey", "Ø£ÙÙŠÙÙ‘Ù‡ÙØ§": "ey", "Ù„ÙØ§": "hayÄ±r/yok/deÄŸil",
            "Ø¥ÙÙ„ÙÙ°Ù‡Ù": "ilah", "Ø¥ÙÙ„ÙÙ‘Ø§": "ancak/sadece", "Ù…ÙØ­ÙÙ…ÙÙ‘Ø¯ÙŒ": "Muhammed",
            "Ø±ÙØ³ÙÙˆÙ„Ù": "elÃ§isi/resulÃ¼", "ØµÙÙ„ÙØ§Ø©Ù": "namazÄ±", "Ø²ÙÙƒÙØ§Ø©Ù": "zekÃ¢tÄ±",
            "Ø§Ù„Ù’Ø¬ÙÙ†ÙÙ‘Ø©Ù": "cennete", "Ø§Ù„Ù†ÙÙ‘Ø§Ø±Ù": "ateÅŸe/cehenneme"
        };

        this.dom = {};
        this.hifz = null;
        this.quiz = null;
        this.match = null;
        this.zikr = { count: 0, current: '', currentTr: '', total: 0 };
    }

    // ============================================================
    // ğŸ”¥ FÄ°REBASE AUTH SÄ°STEMÄ°
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
        // Firebase config girilmemiÅŸse uyarÄ± gÃ¶ster
        document.getElementById('authError').textContent = 'âš ï¸ firebase-init.js dosyasÄ±na firebaseConfig ekleyin!';
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
                // Presence â€” online kullanÄ±cÄ± sayÄ±sÄ±
                this._initPresence(user.uid, user.displayName || user.email?.split('@')[0] || 'KullanÄ±cÄ±');
                // Admin yetkisi var mÄ± kontrol et
                this._checkAdminPrivilege(user.uid);
                // Admin notu var mÄ±?
                this._checkUserNote(user.uid);
            } else {
                this.state.currentUser = null;
                this._showAuthScreen();
            }
        });

        // Tab geÃ§iÅŸleri
        document.getElementById('tabLogin').onclick = () => this._switchAuthTab('login');
        document.getElementById('tabRegister').onclick = () => this._switchAuthTab('register');
        document.getElementById('authSubmitBtn').onclick = () => this._handleAuthSubmit();
        document.getElementById('authGoogleBtn').onclick = () => this._handleGoogleLogin();

        // SaÄŸ Ã¼st auth butonlarÄ±
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
        document.getElementById('authSubmitBtn').textContent = isLogin ? 'GiriÅŸ Yap' : 'KayÄ±t Ol';
        document.getElementById('authSubtitle').textContent = isLogin ? 'HesabÄ±nÄ±za giriÅŸ yapÄ±n' : 'Yeni hesap oluÅŸturun';
        document.getElementById('authError').classList.add('hidden');
    }

    async _handleAuthSubmit() {
        const { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.FirebaseAuth;
        const email = document.getElementById('authEmail').value.trim();
        const pass = document.getElementById('authPassword').value;
        const pass2 = document.getElementById('authPasswordConfirm').value;
        const errEl = document.getElementById('authError');

        errEl.classList.add('hidden');
        if (!email || !pass) { this._showAuthError('E-posta ve ÅŸifre gerekli.'); return; }

        if (this.state.authMode === 'register') {
            if (pass !== pass2) { this._showAuthError('Åifreler eÅŸleÅŸmiyor!'); return; }
            if (pass.length < 6) { this._showAuthError('Åifre en az 6 karakter olmalÄ±.'); return; }
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
            'auth/user-not-found': 'Bu e-posta ile kayÄ±tlÄ± hesap bulunamadÄ±.',
            'auth/wrong-password': 'Åifre yanlÄ±ÅŸ.',
            'auth/email-already-in-use': 'Bu e-posta zaten kayÄ±tlÄ±.',
            'auth/invalid-email': 'GeÃ§ersiz e-posta adresi.',
            'auth/weak-password': 'Åifre Ã§ok zayÄ±f.',
            'auth/too-many-requests': 'Ã‡ok fazla deneme. LÃ¼tfen bekleyin.',
            'auth/popup-closed-by-user': 'GiriÅŸ penceresi kapatÄ±ldÄ±.',
            'auth/network-request-failed': 'AÄŸ baÄŸlantÄ±sÄ± hatasÄ±.'
        };
        return map[code] || 'Bir hata oluÅŸtu: ' + code;
    }

    _showApp(user) {
        const name = user.displayName || user.email.split('@')[0];
        // Modal kapat
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.add('hidden');
        // Top bar gÃ¼ncelle
        const topBtns = document.getElementById('topAuthButtons');
        const topUser = document.getElementById('topUserInfo');
        const topName = document.getElementById('topUserName');
        if (topBtns) topBtns.classList.add('hidden');
        if (topUser) topUser.classList.remove('hidden');
        if (topName) topName.textContent = 'ğŸ‘¤ ' + name;
        // Ã‡Ä±kÄ±ÅŸ butonu
        const logoutBtn = document.getElementById('topLogoutBtn');
        if (logoutBtn) logoutBtn.onclick = () => window.FirebaseAuth.signOut(window.FirebaseAuth.auth);
        // Ä°statistik paneli iÃ§eriÄŸi gÃ¶ster
        const statsPrompt = document.getElementById('statsLoginPrompt');
        const statsContent = document.getElementById('statsContent');
        if (statsPrompt) statsPrompt.classList.add('hidden');
        if (statsContent) statsContent.classList.remove('hidden');
    }

    _showAuthScreen() {
        // Modal AÃ‡MA - sadece top bar gÃ¼ncelle
        const topBtns = document.getElementById('topAuthButtons');
        const topUser = document.getElementById('topUserInfo');
        if (topBtns) topBtns.classList.remove('hidden');
        if (topUser) topUser.classList.add('hidden');
        // Ä°statistik paneli prompt gÃ¶ster
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
    // ğŸ”¥ FÄ°REBASE Ä°STATÄ°STÄ°K KAYDETME
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
    // ğŸš€ BOOT
    // ============================================================

    async boot() {
        this.state.bootTime = performance.now();
        this._logBranding();

        // tefsir.json lokal yÃ¼kle
        this.tefsirData = {};
        try {
            const paths = ['tefsir.json', './tefsir.json', '/kuranoku/tefsir.json'];
            for (const p of paths) {
                const r = await fetch(p);
                if (r.ok) { this.tefsirData = await r.json(); break; }
            }
        } catch(e) {}

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

            // Firebase hazÄ±r olunca auth baÅŸlat
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

            this.log(`Boot tamamlandÄ±: ${(performance.now() - this.state.bootTime).toFixed(2)}ms`, "success");
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

        // DÄ±ÅŸarÄ± tÄ±klayÄ±nca overlay'i kapat
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
            if (this.state.currentSurahId && this.state.audioPlayer.src && this.state.audioPlayer.paused) {
                this.state.audioPlayer.play();
            } else {
                this._resumeReading();
            }
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
        if (this.dom.calendarBtn) this.dom.calendarBtn.onclick = () => { this._openModal('calendarOverlay'); this._calYear = null; this._renderCalendar(); };
        if (this.dom.shareBtn) this.dom.shareBtn.onclick = () => { this._togglePanel('sharePanel'); if (!document.getElementById('sharePanel').classList.contains('hidden')) this._initSharePanel(); };
        // Yeni paneller
        if (this.dom.tefsirBtn) this.dom.tefsirBtn.onclick = () => {
            // Bubble menÃ¼yÃ¼ kapat
            const grid = document.getElementById('bubbleGrid');
            if (grid) grid.classList.add('hidden');
            const trigger = document.getElementById('bubbleTrigger');
            if (trigger) { trigger.classList.remove('open'); trigger.querySelector('.bubble-trigger-icon').textContent = 'â˜°'; }
            // Meal aÃ§Ä±ksa direk scroll, kapalÄ±ysa Ã¶nce aÃ§ sonra scroll et
            const mealBlock = document.getElementById('inlineMealBlock');
            const mealBtn = document.getElementById('showMealButton');
            const scrollToMeal = () => {
                const el = document.getElementById('inlineMealBlock');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
            if (mealBlock && !mealBlock.classList.contains('hidden')) {
                scrollToMeal();
            } else {
                if (mealBtn) mealBtn.click();
                setTimeout(scrollToMeal, 350);
            }
        };
        if (this.dom.esmaBtn) this.dom.esmaBtn.onclick = () => { this._openModal('esmaOverlay'); this._initEsmaPanel(); };
        if (this.dom.leaderboardBtn) this.dom.leaderboardBtn.onclick = () => { this._openModal('leaderboardOverlay'); this._initLeaderboard(); };
        if (this.dom.hatimBtn) this.dom.hatimBtn.onclick = () => { this._openModal('hatimOverlay'); this._initHatimGroup(); };
        if (this.dom.notifBtn) this.dom.notifBtn.onclick = () => { this._openModal('notifOverlay'); this._initNotifications(); };
        if (this.dom.offlineBtn) this.dom.offlineBtn.onclick = () => { this._openModal('offlineOverlay'); this._initOfflinePanel(); };
        // Bubble page 2 extra butonlar
        const adminBtn2 = document.getElementById('bubbleAdminBtn');
        if (adminBtn2) adminBtn2.onclick = () => { document.getElementById('adminPanelOverlay')?.classList.remove('hidden'); setTimeout(close,80); };
        const profileBtn = document.getElementById('bubbleProfileBtn');
        if (profileBtn) profileBtn.onclick = () => { this._showToast('ğŸ‘¤ Profil yakÄ±nda eklenecek!', '#38bdf8'); };
        const themeBtn2 = document.getElementById('bubbleTheme2Btn');
        if (themeBtn2) themeBtn2.onclick = () => { this.toggleSystemTheme(); setTimeout(close,80); };
    }

    _togglePanel(panelId) {
        ['hifzPanel','statsPanel','zikrPanel','gamesPanel','prayerPanel','duaPanel','bookmarkPanel','searchVersePanel','badgePanel','sharePanel'].forEach(id => {
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

    _openModal(overlayId) {
        document.querySelectorAll('.qp-modal-overlay').forEach(el => el.classList.add('hidden'));
        const el = document.getElementById(overlayId);
        if (!el) return;
        el.classList.remove('hidden');
        el.onclick = (e) => { if (e.target === el) this._closeModal(overlayId); };
    }
    _closeModal(overlayId) {
        const el = document.getElementById(overlayId);
        if (el) el.classList.add('hidden');
    }

    _scrollToMeal() {
        const mealEl = document.getElementById('inlineMealBlock');
        if (mealEl) mealEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ============================================================
    // ğŸ“Š OMNI-VISION ARAMA MOTORU
    // ============================================================

    _normStr(s) {
        // TÃ¼rkÃ§e + yaygÄ±n yazÄ±m hatalarÄ±nÄ± normalize et
        return s.toLowerCase()
            .replace(/ÄŸ/g,'g').replace(/Ã¼/g,'u').replace(/ÅŸ/g,'s')
            .replace(/Ä±/g,'i').replace(/Ã¶/g,'o').replace(/Ã§/g,'c')
            .replace(/Ã¢/g,'a').replace(/Ã®/g,'i').replace(/Ã»/g,'u')
            .replace(/[^a-z0-9]/g,'');
    }

    _executeOmniProbabilityAnalysis(q) {
        if (this.state.surahMetadata.length === 0) return;
        const qN = this._normStr(q);

        // Semantics map'de direkt eÅŸleÅŸme
        if (this.state.semantics[q.toLowerCase()]) {
            const sid = this.state.semantics[q.toLowerCase()];
            const found = this.state.surahMetadata.find(m => m.id === sid);
            if (found) {
                this._renderOmniSuggestionUI([{ id: found.id, name: found.name, prob: 100, badge: 'Anlam EÅŸleÅŸmesi' }]);
                return;
            }
        }

        const analysis = this.state.surahMetadata.map(surah => {
            const nameN = this._normStr(surah.name);
            let prob = 0;

            // 1) Tam eÅŸleÅŸme â†’ 100
            if (nameN === qN) { prob = 100; }
            // 2) BaÅŸlangÄ±Ã§ eÅŸleÅŸmesi â†’ yÃ¼ksek bonus
            else if (nameN.startsWith(qN)) { prob = 80 + (qN.length / nameN.length) * 18; }
            // 3) Ä°Ã§inde geÃ§iyor â†’ orta bonus
            else if (nameN.includes(qN)) { prob = 65 + (qN.length / nameN.length) * 15; }
            // 4) Levenshtein mesafesi
            else {
                const dist = this._calculateLevenshtein(qN, nameN);
                const maxLen = Math.max(qN.length, nameN.length);
                prob = (1 - dist / maxLen) * 100;
                // KÄ±smi Ã¶rtÃ¼ÅŸme bonus: ilk N karakter eÅŸleÅŸiyorsa
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
        overlay.innerHTML = `<div class="omni-suggest-header">SonuÃ§lar (${results.length})</div>`;
        results.forEach(res => {
            const item = this._createElement('div', 'omni-item-v17');
            item.innerHTML = `<span class="omni-name-v17">${res.id}. ${res.name}</span><span class="omni-prob-v17">%${res.prob}</span>`;
            item.onclick = () => { this.loadSurah(res.id); input.value = res.name; overlay.style.display = 'none'; };
            overlay.appendChild(item);
        });
    }

    // ============================================================
    // ğŸ–Œï¸ MUSHAF RENDER MOTORU
    // ============================================================

    async loadSurah(surahId) {
        if (this.state.isRendering) return;
        this.state.isRendering = true;
        this._toggleUIState(true);
        this.dom.neuralOverlay.style.display = 'none';

        try {
            const surahData = await this._fetchSurahWithCache(surahId);
            if (!surahData) {
                this.dom.mainDisplay.innerHTML = `<div style="color:#f87171;font-family:sans-serif;text-align:center;padding:40px;font-size:1rem">âš ï¸ Sure yÃ¼klenemedi. Ä°nternet baÄŸlantÄ±nÄ±zÄ± kontrol edin veya sayfayÄ± yenileyin.</div>`;
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

            // Ä°statistik: aÃ§Ä±lan sure
            this._loadStats().then(stats => {
                const set = new Set(stats.surahsOpened || []);
                set.add(surahId);
                stats.surahsOpened = [...set];
                this._saveStats(stats);
            });

        } catch (error) {
            this.log("Render HatasÄ±: " + error.message, "error");
        } finally {
            this.state.isRendering = false;
            this._toggleUIState(false);
        }
    }

    _processAndRenderVerses(data, parent) {
        const bismText = "Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙÙ‘Ù‡Ù Ø§Ù„Ø±ÙÙ‘Ø­Ù’Ù…ÙÙ†Ù Ø§Ù„Ø±ÙÙ‘Ø­ÙÙŠÙ…Ù";
        Object.entries(data.verse).forEach(([key, rawText]) => {
            const idx = parseInt(key.split('_')[1]);
            let txt = rawText.trim();
            if (txt.startsWith(bismText)) txt = txt.replace(bismText, '').trim();
            if (this.state.currentSurahId === 1 && idx === 1 && txt === "") return;

            const unit = this._createElement('span', 'ayah-unit-v15');
            unit.id = `ayah-unit-v15-${idx}`;

            // Her kelimeyi ayrÄ± span'a bÃ¶l â†’ tooltip iÃ§in
            const wordsContainer = document.createElement('span');
            wordsContainer.className = 'ayah-text-v15';
            const words = txt.split(' ');
            words.forEach((word, wi) => {
                if (!word) return;
                const wSpan = document.createElement('span');
                wSpan.className = 'ayah-word';
                wSpan.textContent = word + (wi < words.length - 1 ? ' ' : '');
                wSpan.dataset.word = word;

                // Hover â†’ tooltip gÃ¶ster
                wSpan.addEventListener('mouseenter', (e) => this._showWordTooltip(e, word));
                wSpan.addEventListener('mouseleave', () => this._hideWordTooltip());
                // Mobil: dokunuÅŸ â†’ tooltip
                wSpan.addEventListener('touchstart', (e) => { e.preventDefault(); this._showWordTooltip(e.touches[0], word); }, { passive: false });
                wSpan.addEventListener('touchend', () => setTimeout(() => this._hideWordTooltip(), 2000));

                wordsContainer.appendChild(wSpan);
            });

            // Ã‡ift tÄ±klama ile ses Ã§al, uzun basma ile yer imi
            let clickTimer = null;

            wordsContainer.addEventListener('click', () => {
                if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; this.playAyah(this.state.currentSurahId, idx); }
                else { clickTimer = setTimeout(() => { clickTimer = null; }, 350); }
            });


            unit.appendChild(wordsContainer);
            unit.appendChild(this._createOrnamentModule(idx));
            parent.appendChild(unit);
        });
    }

    // ============================================================
    // ğŸ’¬ KELÄ°ME TOOLTIP SÄ°STEMÄ° (DÃœZELTÄ°LDÄ°)
    // ============================================================

    _showWordTooltip(e, word) {
        const tooltip = this.dom.tooltip;
        if (!tooltip) return;

        // SÃ¶zlÃ¼kte ara â€” tam eÅŸleÅŸme ya da kÄ±smi
        let meaning = this.wordDict[word];
        if (!meaning) {
            // Harekesiz karÅŸÄ±laÅŸtÄ±rma (diakritikleri temizle)
            const clean = word.replace(/[\u064B-\u065F\u0670]/g, '');
            for (const [k, v] of Object.entries(this.wordDict)) {
                if (k.replace(/[\u064B-\u065F\u0670]/g, '') === clean) { meaning = v; break; }
            }
        }

        if (!meaning) return; // SÃ¶zlÃ¼kte yoksa tooltip gÃ¶sterme

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
    // ğŸ“– MEAL SÄ°STEMÄ° (DÃœZELTÄ°LDÄ° - 1. ayetten baÅŸlar)
    // ============================================================

    _renderFullMealSystem(surahId) {
        if (!this.state.mealCache) { console.warn('Meal cache yok'); return; }
        const data = this.state.mealCache[surahId];
        if (!data || !data.length) { console.warn('Sure meali bulunamadÄ±:', surahId); return; }

        const old = document.getElementById('inlineMealBlock');
        if (old) old.remove();

        const block = document.createElement('div');
        block.id = 'inlineMealBlock';
        block.className = 'meal-inline';

        const title = document.createElement('div');
        title.className = 'meal-inline-title';
        title.textContent = `ğŸ“– ${surahId}. Sure â€” TÃ¼rkÃ§e Meal`;
        block.appendChild(title);

        // âœ… LTR container - TÃ¼rkÃ§e soldan saÄŸa yazÄ±lsÄ±n
        const list = document.createElement('div');
        list.className = 'meal-container-v15';
        list.style.direction = 'ltr';

        // Sadece Fatiha sure 1 iÃ§in verse 1 atla (besmele)
        // DiÄŸer TÃœM sureler verse 1'den baÅŸlar
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

            // ğŸ“œ Tefsir butonu â€” meal satÄ±rÄ± sonuna
            const tefsirBtn = document.createElement('button');
            tefsirBtn.className = 'meal-tefsir-btn';
            tefsirBtn.innerHTML = 'ğŸ“œ Tefsir';
            tefsirBtn.title = `${item.verse}. Ayet Tefsiri`;
            tefsirBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleInlineTefsir(row, surahId, item.verse, tefsirBtn);
            });

            row.appendChild(numSpan);
            row.appendChild(textSpan);
            row.appendChild(tefsirBtn);
            row.onclick = () => this.playAyah(surahId, item.verse);
            list.appendChild(row);
        });

        block.appendChild(list);

        const vc = this.dom.mainDisplay;
        if (vc && vc.parentNode) vc.parentNode.insertBefore(block, vc.nextSibling);
        if (this.dom.mealFrame) this.dom.mealFrame.classList.add('hidden');
    }

    // ============================================================
    // ğŸ”Š SES SÄ°STEMÄ°
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
                // ğŸ¤ Karaoke
                if (this.state.karaokeActive && ayahId > 0) {
                    this._startKaraokeForAyah(surahId, ayahId);
                }
            })
            .catch(() => this.log("Ses dosyasÄ± eksik.", "error"));
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
        // ğŸŠ Kilometre taÅŸÄ± kutlamasÄ±
        const milestones = {100:'100 ayet dinlediniz! ğŸµ', 500:'500 ayet! Harika! â­', 1000:'1000 ayet! MuhteÅŸem! ğŸŒŸ'};
        if (milestones[stats.ayahCount]) this._showCelebration(milestones[stats.ayahCount]);
        if (set.size !== prevSurahs) {
            const sureMilestones = {1:'Ä°lk sureyi aÃ§tÄ±nÄ±z! ğŸŒ±', 10:'10 sure! ğŸ“–', 57:'YarÄ± Kur\'an! ğŸŒ™', 114:'HATÄ°M! Tebrikler! ğŸ†'};
            if (sureMilestones[set.size]) this._showCelebration(sureMilestones[set.size]);
        }
    }

    _handleAutoProgress() {
        const nextId = this.state.currentAyahId + 1;
        const meta = this.state.surahMetadata.find(m => m.id == this.state.currentSurahId);
        if (meta && nextId <= meta.ayahCount) this.playAyah(this.state.currentSurahId, nextId);
    }

    // ============================================================
    // ğŸ¤ KARAOKE â€” KELÄ°ME KELÄ°ME VURGULAMA
    // ============================================================

    async _toggleKaraoke() {
        this.state.karaokeActive = !this.state.karaokeActive;
        const btn = document.getElementById('karaokeToggleBtn');
        if (btn) {
            btn.style.background = this.state.karaokeActive ? '#d4af37' : '';
            btn.textContent = this.state.karaokeActive ? 'ğŸ¤ Karaoke: AÃ§Ä±k' : 'ğŸ¤ Karaoke: KapalÄ±';
        }
        // Bubble menu karaoke butonunu da gÃ¼ncelle
        const menuBtn = document.getElementById('karaokeMenuBtn');
        if (menuBtn) {
            const icon = menuBtn.querySelector('.bubble-btn-icon');
            const label = menuBtn.querySelector('.bubble-btn-label');
            if (icon) icon.textContent = this.state.karaokeActive ? 'ğŸ¤' : 'ğŸ¤';
            if (label) label.textContent = this.state.karaokeActive ? 'Karaoke âœ“' : 'Karaoke';
            menuBtn.style.background = this.state.karaokeActive ? 'rgba(212,175,55,0.2)' : '';
            menuBtn.style.borderColor = this.state.karaokeActive ? '#d4af37' : '';
        }
        if (this.state.karaokeActive) {
            // Åu an Ã§alan ayet varsa hemen baÅŸlat
            if (!this.state.audioPlayer.paused && this.state.currentSurahId && this.state.currentAyahId > 0) {
                await this._startKaraokeForAyah(this.state.currentSurahId, this.state.currentAyahId);
            }
            this._showToast('ğŸ¤ Karaoke modu aÃ§Ä±ldÄ±', '#d4af37');
        } else {
            this._stopKaraoke();
            this._showToast('ğŸ¤ Karaoke modu kapatÄ±ldÄ±', '#64748b');
        }
    }

    async _loadKaraokeTiming(surahId) {
        // Zaten yÃ¼klÃ¼yse tekrar yÃ¼kleme
        if (this.state.karaokeTimings && this.state.karaokeTimings._surahId === surahId) {
            return this.state.karaokeTimings;
        }
        try {
            // Quran Foundation API â€” reciter 7 = Mishary Alafasy (segments destekliyor)
            const reciterId = 7;
            const url = `https://api.quran.com/api/v4/recitations/${reciterId}/by_chapter/${surahId}?per_page=300&fields=segments`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API hatasÄ±');
            const json = await res.json();
            // audio_files dizisini verse_key â†’ segments map'ine Ã§evir
            const map = { _surahId: surahId };
            (json.audio_files || []).forEach(af => {
                if (af.segments && af.segments.length) {
                    map[af.verse_key] = af.segments; // [[wordIdx, startMs, endMs], ...]
                }
            });
            this.state.karaokeTimings = map;
            return map;
        } catch (e) {
            // API baÅŸarÄ±sÄ±z â†’ eÅŸit daÄŸÄ±lÄ±m fallback
            return null;
        }
    }

    async _startKaraokeForAyah(surahId, ayahId) {
        // Ã–nceki RAF'Ä± temizle
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

        // Fallback: segment yoksa eÅŸit bÃ¶l
        if (!segments || !segments.length) {
            const audio = this.state.audioPlayer;
            // Ayetin toplam sÃ¼resini bilmiyoruz, tahmini yap
            const totalWords = wordSpans.length;
            const dur = audio.duration || 5;
            const msPerWord = (dur * 1000) / totalWords;
            segments = Array.from({length: totalWords}, (_, i) => [i + 1, i * msPerWord, (i + 1) * msPerWord]);
        }

        // Segment map: wordIndex (1-based) â†’ {start, end} ms
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
        // currentTime sÄ±fÄ±rlanmÄ±yor â€” Devam Et kaldÄ±ÄŸÄ± yerden baÅŸlar
    }

    // ============================================================
    // ğŸ§  HAFIZLIK MODU
    // ============================================================

    _startHifzMode() {
        const meta = this.state.surahMetadata.find(m => m.id == this.state.currentSurahId);
        if (!meta) { alert('LÃ¼tfen Ã¶nce bir sure seÃ§in!'); return; }
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
        this.dom.hifzStatusText.innerHTML = `<strong>${currentVerse}. Ayet</strong> &nbsp;|&nbsp; Tekrar: <strong>${repeatDone + 1} / ${repeatTotal}</strong> &nbsp;|&nbsp; Ä°lerleme: <strong>${currentVerse} / ${ayahCount}</strong>`;
    }

    _hifzFinish() {
        this.hifz.active = false;
        this._stopSystemAudio();
        this.state.audioPlayer.onended = () => this._handleAutoProgress();
        document.querySelectorAll('.hifz-active-ayah').forEach(el => el.classList.remove('hifz-active-ayah'));
        if (this.dom.hifzStatusText) this.dom.hifzStatusText.innerHTML = 'âœ… Sure tamamlandÄ±! Tebrikler ğŸ‰';
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
    // âš¡ YAZIT BOYUTU & HIZ
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
    // ğŸ“Š Ä°STATÄ°STÄ°K SÄ°STEMÄ°
    // ============================================================

    _initStatsSystem() {
        setInterval(() => {
            if (!this.state.audioPlayer.paused) {
                this._loadStats().then(stats => {
                    stats.listenSeconds = (stats.listenSeconds || 0) + 1;
                    this._saveStats(stats);
                });
            }
        }, 5000); // Her 5 saniyede bir kaydet (Firebase limitini aÅŸmamak iÃ§in)

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
            if (confirm('TÃ¼m istatistikler silinsin mi?')) {
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
    // ğŸ“¿ ZÄ°KÄ°R MATÄ°K
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
            // Tur bazlÄ± ilerleme: 33â†’66â†’99â†’...
            const turNo = Math.floor((this.zikr.count - 1) / base); // 0-indexed tur
            const inTur = this.zikr.count - turNo * base;           // bu turdaki sayÄ±
            const pct = Math.min(100, (inTur / base) * 100);
            document.getElementById('zikrCount').textContent = this.zikr.count;
            document.getElementById('zikrTotal').textContent = this.zikr.total;
            document.getElementById('zikrProgressFill').style.width = pct + '%';
            // Tura ulaÅŸÄ±ldÄ±
            if (this.zikr.count % base === 0) {
                const turTamamlandi = this.zikr.count / base;
                document.getElementById('zikrCount').style.color = '#6ee7b7';
                const msgEl = document.getElementById('zikrMilestoneMsg');
                if (msgEl) { msgEl.textContent = `ğŸ‰ ${turTamamlandi}. tur â€¢ Toplam: ${this.zikr.count}`; msgEl.style.opacity='1'; setTimeout(()=>{ msgEl.style.opacity='0'; },2000); }
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
    // ğŸ® OYUNLAR
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
        // Aktif oyun bitmeden menÃ¼ye dÃ¶nÃ¼nce puanÄ± kaydet
        this._tryRecordGameScore();
        document.getElementById('gamesMenu').classList.remove('hidden');
        ['quizArea','matchArea','countArea','hangmanArea','memoryArea','orderArea','surahOrderArea','speedQuizArea','wordCompleteArea','trueFalseArea','surahFirstArea'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        if (this._speedQuizTimer) { clearInterval(this._speedQuizTimer); this._speedQuizTimer = null; }
        if (this._tfTimer) { clearInterval(this._tfTimer); this._tfTimer = null; }
    }

    // Oyun puanÄ± hesapla ve Firebase'e yaz
    _tryRecordGameScore() {
        // Hangi oyun aktifti, skoru oku
        const games = [
            { key: 'quiz',        label: 'Sure Bilgi YarÄ±ÅŸmasÄ±',  mult: 10 },
            { key: 'match',       label: 'Ayet-Meal EÅŸleÅŸtir',    mult: 12 },
            { key: 'countGame',   label: 'KaÃ§ Ayet Var?',         mult: 8  },
            { key: 'orderGame',   label: 'Ayet SÄ±rala',           mult: 15 },
            { key: 'surahOrderGame', label: 'Sure SÄ±rasÄ±',        mult: 10 },
            { key: 'speedQuiz',   label: 'HÄ±zlÄ± Bilgi',           mult: 18 },
            { key: 'wcGame',      label: 'Kelime Tamamla',        mult: 12 },
            { key: 'tfGame',      label: 'DoÄŸru/YanlÄ±ÅŸ',          mult: 8  },
            { key: 'sfGame',      label: 'Ä°lk Ayet Kim?',         mult: 10 },
        ];
        let bestGame = null, bestPts = 0;
        games.forEach(g => {
            const obj = this[g.key];
            if (!obj || !obj.total || obj.total < 3) return; // min 3 soru
            if (obj._recorded) return; // zaten kaydedildi
            const acc  = obj.score / obj.total;
            const pts  = Math.round(obj.score * g.mult * (1 + acc)); // doÄŸruluk bonusu
            if (pts > bestPts) { bestPts = pts; bestGame = { ...g, pts, score: obj.score, total: obj.total }; }
            obj._recorded = true;
        });
        if (!bestGame || bestPts < 1) return;
        this._saveGameScore(bestGame.pts, bestGame.label, bestGame.score, bestGame.total);
    }

    async _saveGameScore(pts, gameName, score, total) {
        // Toast gÃ¶ster
        this._showToast(`ğŸ® ${gameName}: +${pts} puan! (${score}/${total})`, '#d4af37');
        if (!window.FirebaseAuth || !this.state.currentUser) return;
        try {
            const { db, doc, getDoc, setDoc } = window.FirebaseAuth;
            const uid = this.state.currentUser.uid;
            const ref = doc(db, 'gameScores', uid);
            const snap = await getDoc(ref);
            const existing = snap.exists() ? snap.data() : {};
            const newTotal  = (existing.totalPoints || 0) + pts;
            const gamesPlayed = (existing.gamesPlayed || 0) + 1;
            const history = existing.history || [];
            history.unshift({ pts, gameName, score, total, ts: Date.now() });
            if (history.length > 20) history.pop();
            await setDoc(ref, {
                totalPoints: newTotal,
                gamesPlayed,
                history,
                displayName: this.state.currentUser.displayName || this.state.currentUser.email?.split('@')[0] || 'Anonim',
                uid,
                updatedAt: Date.now()
            });
        } catch(e) { console.warn('Oyun puanÄ± kaydedilemedi:', e); }
    }

    // â”€â”€â”€ Oyun 3: KaÃ§ Ayet Var? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _startCountGame() {
        if (this.state.surahMetadata.length < 4) return;
        this.countGame = { score:0, total:0, _recorded:false };
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
            `<div class="quiz-sub">Bu surede kaÃ§ ayet vardÄ±r?</div>
             <div class="quiz-big">${correct.name}</div>`;
        const div = document.getElementById('countOptions');
        div.innerHTML = '';
        opts.forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = n + ' ayet';
            btn.onclick = () => {
                div.querySelectorAll('button').forEach(b=>b.disabled=true);
                if (n===correct.ayahCount) { btn.classList.add('correct'); this.countGame.score++; document.getElementById('countFeedback').textContent='âœ… DoÄŸru!'; }
                else { btn.classList.add('wrong'); div.querySelectorAll('button').forEach(b=>{ if(parseInt(b.textContent)===correct.ayahCount) b.classList.add('correct'); }); document.getElementById('countFeedback').textContent=`âŒ DoÄŸrusu: ${correct.ayahCount}`; }
                this.countGame.total++;
                document.getElementById('countScore').textContent=`${this.countGame.score}/${this.countGame.total}`;
                if (this.countGame.total % 10 === 0) { this.countGame._recorded=false; this._tryRecordGameScore(); }
                document.getElementById('countNextBtn').classList.remove('hidden');
            };
            div.appendChild(btn);
        });
        document.getElementById('countScore').textContent=`${this.countGame.score}/${this.countGame.total}`;
    }

    // â”€â”€â”€ Oyun 4: Hangman (Sure Bulmaca) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        document.getElementById('hangmanWrong').textContent = wrongLetters.length ? 'YanlÄ±ÅŸ: '+wrongLetters.join(' ') : '';
        const faces = ['ğŸ˜„','ğŸ˜','ğŸ˜Ÿ','ğŸ˜°','ğŸ˜±','ğŸ˜µ','ğŸ’€'];
        document.getElementById('hangmanFace').textContent = faces[Math.min(wrong,6)];
        document.getElementById('hangmanHaklar').textContent = `${max-wrong} hak`;
        if (!display.includes('_')) {
            document.getElementById('hangmanMsg').innerHTML='ğŸ‰ Tebrikler! Sure: <b>'+word+'</b>';
            setTimeout(()=>this._newHangmanWord(),2000);
        } else if (wrong>=max) {
            document.getElementById('hangmanMsg').innerHTML='ğŸ’€ Bitti! Cevap: <b>'+word+'</b>';
            setTimeout(()=>this._newHangmanWord(),2500);
        }
    }

    // â”€â”€â”€ Oyun 5: HafÄ±za KartlarÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            el.innerHTML = `<div class="mem-front">ğŸ•‹</div><div class="mem-back">${card.label}</div>`;
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
                if (m.cards.every(c=>c.done)) document.getElementById('memoryResult').textContent=`ğŸ‰ TamamlandÄ±! ${m.moves} hamle`;
            } else {
                setTimeout(()=>{ m.cards[a].open=m.cards[b].open=false; m.flipped=[]; m.locked=false; this._renderMemory(); },900);
            }
        }
    }

    _startQuiz() {
        if (this.state.surahMetadata.length < 4) return;
        this.quiz = { score: 0, total: 0, _recorded: false };
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
                if (opt.id === correct.id) { btn.classList.add('correct'); this.quiz.score++; document.getElementById('quizFeedback').innerHTML = 'âœ… DoÄŸru!'; }
                else { btn.classList.add('wrong'); document.querySelectorAll('.quiz-opt-btn').forEach(b => { if (b.textContent === correct.name) b.classList.add('correct'); }); document.getElementById('quizFeedback').innerHTML = `âŒ DoÄŸrusu: <strong>${correct.name}</strong>`; }
                this.quiz.total++;
                document.getElementById('quizScore').textContent = `Skor: ${this.quiz.score} / ${this.quiz.total}`;
                if (this.quiz.total % 10 === 0) { this.quiz._recorded=false; this._tryRecordGameScore(); }
                document.getElementById('quizNextBtn').classList.remove('hidden');
            };
            optDiv.appendChild(btn);
        });
        document.getElementById('quizScore').textContent = `Skor: ${this.quiz.score} / ${this.quiz.total}`;
    }

    _startMatch() {
        if (!this.state.mealCache) { alert('Meal veritabanÄ± henÃ¼z yÃ¼klenmedi.'); return; }
        this.match = { score: 0, total: 0, _recorded: false };
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
            btn.textContent = opt.text.length > 80 ? opt.text.slice(0, 80) + 'â€¦' : opt.text;
            btn.onclick = () => {
                document.querySelectorAll('#matchOptions .quiz-opt-btn').forEach(b => b.disabled = true);
                if (opt.verse === correct.verse) { btn.classList.add('correct'); this.match.score++; document.getElementById('matchFeedback').innerHTML = 'âœ… DoÄŸru!'; }
                else { btn.classList.add('wrong'); document.getElementById('matchFeedback').innerHTML = `âŒ YanlÄ±ÅŸ!`; }
                this.match.total++;
                document.getElementById('matchScore').textContent = `Skor: ${this.match.score} / ${this.match.total}`;
                if (this.match.total % 10 === 0) { this.match._recorded=false; this._tryRecordGameScore(); }
                document.getElementById('matchNextBtn').classList.remove('hidden');
            };
            optDiv.appendChild(btn);
        });
        document.getElementById('matchScore').textContent = `Skor: ${this.match.score} / ${this.match.total}`;
    }

    // ============================================================
    // ğŸŒŸ GÃœNÃœN AYETÄ°
    // ============================================================

    async _renderDailyVerse() {
        const box = document.getElementById('dailyVerseBox');
        if (!box) return;

        // DÃ¼zgÃ¼n hash â€” her gÃ¼n tamamen farklÄ± sure+ayet
        const today = new Date();
        const rawSeed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
        let h = rawSeed ^ 0xDEADBEEF;
        h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
        h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
        h = Math.abs(h ^ (h >>> 16));

        const counts = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,14,10,77,18,12,31,40,15,6,29,51,49,30,52,16,23,54,41,44,37,0,25,78,43,38,35,28,25,27,20,17,13,14,11,15,9,14,14,6,6,5,8,8,3,7,6,11,11];
        const total = counts.reduce((a,b) => a+b, 0);
        const ayahIndex = h % total;
        let cumulative = 0, targetSurah = 1, targetAyah = 1;
        for (let i = 0; i < counts.length; i++) {
            if (ayahIndex < cumulative + counts[i]) { targetSurah = i + 1; targetAyah = ayahIndex - cumulative + 1; break; }
            cumulative += counts[i];
        }

        try {
            const data = await this._fetchSurahWithCache(targetSurah);
            if (!data) return;
            const arabic = data.verse?.[`verse_${targetAyah}`] || '';
            if (!this.state.mealCache) await this._loadMealDatabase();
            const meal = this.state.mealCache?.[targetSurah]?.find(v => v.verse === targetAyah)?.text || '';

            // HTML'i yeni yapÄ±ya gÃ¶re render et
            const cacheKey = `qp_dv_ai_${targetSurah}_${targetAyah}`;
            const cachedAI = localStorage.getItem(cacheKey);

            box.innerHTML = `
                <div class="dv-badge">ğŸŒŸ GÃ¼nÃ¼n Ayeti</div>
                <div class="dv-arabic-text">${arabic}</div>
                <div class="dv-meal-text">${meal}</div>
                <div class="dv-ref-text">ğŸ“– ${data.name} Suresi &mdash; ${targetAyah}. Ayet</div>
                <div class="dv-ai-block">
                    <div class="dv-ai-label">âœ¨ NUR-AI Yorumu</div>
                    <div class="dv-ai-body" id="dvAiBody" style="color:#94a3b8;font-size:0.88rem;line-height:1.7;font-style:italic">${cachedAI || '<span class="dv-thinking"><span></span><span></span><span></span></span>'}</div>
                </div>
                <button class="dv-share-btn" onclick="App._shareDailyVerse('${data.name}',${targetAyah})">ğŸ“¤ PaylaÅŸ</button>`;
            box.style.display = '';

            if (!cachedAI) this._fetchDailyVerseAI(meal, arabic, data.name, targetAyah, cacheKey);
        } catch(e) {
            console.warn('GÃ¼nÃ¼n ayeti yÃ¼klenemedi:', e);
        }
    }

    _fetchDailyVerseAI(meal, arabic, sureName, ayahNum, cacheKey) {
        const bodyEl = document.getElementById('dvAiBody');
        if (!bodyEl) return;
        const fallbacks = [
            `"${meal}" â€” Bu ayet, bugÃ¼n sana Ã¶zel bir hatÄ±rlatma. Kalbine nakÅŸet, gÃ¼nÃ¼n boyunca zihninde taÅŸÄ±.`,
            `${sureName} Suresi'nin bu ayeti, her okunduÄŸunda farklÄ± bir derinlik sunar. Meali Ã¼zerinde sessizce dÃ¼ÅŸÃ¼n; belki bugÃ¼n tam ihtiyacÄ±n olan sÃ¶z budur.`,
            `YÃ¼ce Allah'Ä±n bu kelamÄ± asÄ±rlar boyunca milyonlara rehberlik etti. "${meal}" â€” Bu sÃ¶zÃ¼ bugÃ¼n iÃ§in bir pusula olarak al.`,
            `Bu ayet bir davet; duraksayÄ±p dÃ¼ÅŸÃ¼nmek, kalbini aÃ§mak iÃ§in. "${meal}" â€” BugÃ¼n bu sÃ¶zle yÃ¼rÃ¼.`,
            `${sureName} Suresi bize hatÄ±rlatÄ±yor: Her zorlukta, her sevinÃ§te Allah'Ä±n kelamÄ±na dÃ¶nmek en bÃ¼yÃ¼k huzurun kapÄ±sÄ±dÄ±r.`
        ];
        const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        bodyEl.style.fontStyle = 'italic';
        bodyEl.style.color = '#94a3b8';
        bodyEl.textContent = '';
        let i = 0;
        const type = () => {
            if (i < pick.length) { bodyEl.textContent += pick[i++]; setTimeout(type, 18); }
            else { localStorage.setItem(cacheKey, pick); }
        };
        type();
    }

    _shareDailyVerse(sureName, ayahNum) {
        const arabic = document.querySelector('.dv-arabic-text')?.textContent || '';
        const meal   = document.querySelector('.dv-meal-text')?.textContent || '';
        const text   = `ğŸ“– ${sureName} Suresi â€” ${ayahNum}. Ayet\n\n${arabic}\n\n${meal}\n\nâ€” Kur'an-Ä± Kerim`;
        if (navigator.share) navigator.share({ title: 'GÃ¼nÃ¼n Ayeti', text });
        else navigator.clipboard.writeText(text).then(() => this._showToast('ğŸ“‹ Panoya kopyalandÄ±!', '#6ee7b7'));
    }

    // ============================================================
    // ğŸ›  YARDIMCI ARAÃ‡LAR
    // ============================================================

    async _fastPreloadMetadata() {
        const ids = Array.from({length: 114}, (_, i) => i + 1);
        for (let i = 0; i < ids.length; i += this.config.parallelTasks) {
            const batch = ids.slice(i, i + this.config.parallelTasks);
            await Promise.all(batch.map(id => this._fetchSurahWithCache(id).then(d => {
                if (d) this.state.surahMetadata.push({ id, name: d.name, ayahCount: Object.keys(d.verse).length });
            }).catch(() => {})));
        }
        this.state.surahMetadata.sort((a, b) => a.id - b.id);
        if (this.dom.surahSel) {
            this.dom.surahSel.innerHTML = '';
            this.state.surahMetadata.forEach(m => this.dom.surahSel.add(new Option(`${m.id}. ${m.name}`, m.id)));
        }
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
            this.log(`Sure ${id} yÃ¼klenemedi: ${e.message}`, 'warn');
            return null;
        }
    }

    async _loadMealDatabase() {
        try {
            const r = await fetch(this.config.mealPath);
            this.state.mealCache = await r.json();
            this.log("Meal veritabanÄ± yÃ¼klendi.", "success");
        } catch (e) { this.log("Meal verisi yÃ¼klenemedi.", "error"); }
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
        const s = ['Ù ','Ù¡','Ù¢','Ù£','Ù¤','Ù¥','Ù¦','Ù§','Ù¨','Ù©'];
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
            // Admin paneli aÃ§Ä±ksa veya input/textarea'daysa space'i engelleme
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
        localStorage.setItem('portal_theme', this.state.theme); // Manuel seÃ§im â€” auto-theme bunu gÃ¶rÃ¼nce dokunmaz
    }
    _initHistory() { return JSON.parse(localStorage.getItem('qp_history') || '[]'); }
    _verifySystemIntegrity() { return Promise.resolve(true); }
    _handleCriticalError(m, err) { console.error(`[QURAN PORTAL] ERROR:`, m, err); }
    log(m, type = "info") { const c = { success: "#10b981", error: "#ef4444", info: "#38bdf8" }; console.log(`%c[QP v18] %c${m}`, `color: ${c[type]}; font-weight: bold;`, "color: #ddd"); }
    // â”€â”€â”€ Oyun 6: Ayet SÄ±rala â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _startOrderGame() {
        if (!this.state.mealCache) { alert('Meal veritabanÄ± yÃ¼klenmedi.'); return; }
        this.orderGame = { score: 0, total: 0, correctOrder: [], _recorded: false };
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

        document.getElementById('orderQuestion').innerHTML = `<div class="quiz-sub">Bu ayetleri doÄŸru sÄ±raya diz (tÄ±kla â†’ yerleÅŸtir)</div><div class="quiz-big">${this.state.surahMetadata.find(m=>m.id===sid)?.name||''} Suresi</div>`;

        const wordsEl = document.getElementById('orderWords');
        const answerEl = document.getElementById('orderAnswer');
        wordsEl.innerHTML = '';
        answerEl.innerHTML = '<div style="color:#64748b;font-size:0.8rem;margin-bottom:4px">SÄ±ralama:</div>';
        this.orderGame.answerSlots = [];

        shuffled.forEach((v, i) => {
            const btn = document.createElement('button');
            btn.className = 'order-word-btn';
            btn.textContent = v.text.slice(0, 45) + (v.text.length > 45 ? 'â€¦' : '');
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
            document.getElementById('orderFeedback').textContent = 'âœ… DoÄŸru sÄ±ra!';
        } else {
            document.getElementById('orderFeedback').textContent = 'âŒ YanlÄ±ÅŸ! DoÄŸru sÄ±ra: ' + this.orderGame.correctOrder.join(' â†’ ');
        }
        document.getElementById('orderScore').textContent = `${this.orderGame.score}/${this.orderGame.total}`;
        document.getElementById('orderNextBtn').classList.remove('hidden');
    }

    // â”€â”€â”€ Oyun 7: Sure SÄ±rasÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _startSurahOrderGame() {
        if (this.state.surahMetadata.length < 4) return;
        this.surahOrderGame = { score: 0, total: 0, _recorded: false };
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
            `<div class="quiz-sub">Bu sure Kur\'an'da kaÃ§Ä±ncÄ± suredir?</div><div class="quiz-big">${correct.name}</div>`;
        const div = document.getElementById('surahOrderOptions');
        div.innerHTML = '';
        opts.forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = n + '. Sure';
            btn.onclick = () => {
                div.querySelectorAll('button').forEach(b => b.disabled = true);
                this.surahOrderGame.total++;
                if (n === correct.id) { btn.classList.add('correct'); this.surahOrderGame.score++; document.getElementById('surahOrderFeedback').textContent = 'âœ… DoÄŸru!'; }
                else { btn.classList.add('wrong'); div.querySelectorAll('button').forEach(b => { if (parseInt(b.textContent) === correct.id) b.classList.add('correct'); }); document.getElementById('surahOrderFeedback').textContent = `âŒ DoÄŸrusu: ${correct.id}. sure`; }
                document.getElementById('surahOrderScore').textContent = `${this.surahOrderGame.score}/${this.surahOrderGame.total}`;
                document.getElementById('surahOrderNextBtn').classList.remove('hidden');
            };
            div.appendChild(btn);
        });
        document.getElementById('surahOrderScore').textContent = `${this.surahOrderGame.score}/${this.surahOrderGame.total}`;
    }

    // â”€â”€â”€ Oyun 8: HÄ±zlÄ± Bilgi (10 sn timer) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _startSpeedQuiz() {
        if (this.state.surahMetadata.length < 4) return;
        this.speedQuiz = { score: 0, total: 0, _recorded: false };
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
            questionHTML = `<div class="quiz-sub">KaÃ§ ayet var?</div><div class="quiz-big">${correct.name}</div>`;
            const nums = new Set([correct.ayahCount]); while(nums.size<4) nums.add(Math.max(1,correct.ayahCount+Math.floor(Math.random()*20)-10));
            const opts = [...nums].sort(()=>Math.random()-0.5);
            optsFn = (div) => opts.forEach(n => { const b=document.createElement('button'); b.className='quiz-opt-btn'; b.textContent=n+' ayet'; b.onclick=()=>this._speedQuizAnswer(b,n===correct.ayahCount,div); div.appendChild(b); });
        } else {
            questionHTML = `<div class="quiz-sub">Bu sure numarasÄ± kaÃ§tÄ±r?</div><div class="quiz-big">${correct.name}</div>`;
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
                document.getElementById('speedQuizFeedback').textContent = 'â° SÃ¼re doldu!';
                document.getElementById('speedQuizScore').textContent = `${this.speedQuiz.score}/${this.speedQuiz.total}`;
                document.getElementById('speedQuizNextBtn').classList.remove('hidden');
            }
        }, 1000);
    }

    _speedQuizAnswer(btn, isCorrect, div) {
        if (this._speedQuizTimer) clearInterval(this._speedQuizTimer);
        div.querySelectorAll('button').forEach(b=>b.disabled=true);
        this.speedQuiz.total++;
        if (isCorrect) { btn.classList.add('correct'); this.speedQuiz.score++; document.getElementById('speedQuizFeedback').textContent='âœ… DoÄŸru!'; }
        else { btn.classList.add('wrong'); document.getElementById('speedQuizFeedback').textContent='âŒ YanlÄ±ÅŸ!'; }
        document.getElementById('speedQuizScore').textContent = `${this.speedQuiz.score}/${this.speedQuiz.total}`;
        if (this.speedQuiz.total % 10 === 0) { this.speedQuiz._recorded=false; this._tryRecordGameScore(); }
        document.getElementById('speedTimerFill').style.width = '0%';
        document.getElementById('speedQuizNextBtn').classList.remove('hidden');
    }

    // ============================================================
    // ğŸ•Œ NAMAZ VAKÄ°TLERÄ°
    // ============================================================

    _initPrayerPanel() {
        const btn = document.getElementById('prayerSearchBtn');
        const inp = document.getElementById('prayerCityInput');
        const locBtn = document.getElementById('prayerLocBtn');
        const viewRow = document.getElementById('prayerCityViewRow');
        const editRow = document.getElementById('prayerCityRow');
        const cityDisplay = document.getElementById('prayerCityDisplay');
        const editBtnEl = document.getElementById('prayerCityEditBtn');

        const savedCity = localStorage.getItem('qp_prayer_city') || '';

        const showCity = (city) => {
            if (cityDisplay) cityDisplay.textContent = city;
            if (viewRow) viewRow.style.display = 'flex';
            if (editRow) editRow.style.display = 'none';
        };
        const showEdit = () => {
            if (viewRow) viewRow.style.display = 'none';
            if (editRow) editRow.style.display = 'flex';
        };

        if (savedCity) {
            showCity(savedCity);
            if (inp) inp.value = savedCity;
            this._fetchPrayerTimes(savedCity);
        } else {
            showEdit();
            if (inp) inp.value = 'Mersin';
            this._fetchPrayerTimes('Mersin');
        }

        if (editBtnEl && !editBtnEl._bound) {
            editBtnEl._bound = true;
            editBtnEl.onclick = () => showEdit();
        }

        if (btn && !btn._bound) {
            btn._bound = true;
            btn.onclick = () => {
                const city = inp ? inp.value.trim() : '';
                if (!city) return;
                localStorage.setItem('qp_prayer_city', city);
                showCity(city);
                this._fetchPrayerTimes(city);
            };
        }

        if (inp && !inp._bound) {
            inp._bound = true;
            inp.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    const city = inp.value.trim();
                    if (!city) return;
                    localStorage.setItem('qp_prayer_city', city);
                    showCity(city);
                    this._fetchPrayerTimes(city);
                }
            };
        }

        if (locBtn && !locBtn._bound) {
            locBtn._bound = true;
            locBtn.onclick = () => this._autoLocatePrayerCity('prayerCityInput', (city) => {
                localStorage.setItem('qp_prayer_city', city);
                showCity(city);
                this._fetchPrayerTimes(city);
            });
        }
    }

    _autoLocatePrayerCity(inputId, onSuccess) {
        const statusEl = document.getElementById('prayerCityInput_loc');
        const inp = document.getElementById(inputId);
        if (!navigator.geolocation) {
            if (statusEl) statusEl.textContent = 'âŒ TarayÄ±cÄ± konum desteklemiyor';
            return;
        }
        // Daha Ã¶nce kaydedilmiÅŸ ÅŸehir varsa tekrar izin isteme
        const savedCity = localStorage.getItem('qp_geo_city');
        if (savedCity) {
            if (inp) inp.value = savedCity;
            if (statusEl) { statusEl.textContent = `âœ… ${savedCity}`; setTimeout(() => { if(statusEl) statusEl.textContent=''; }, 2000); }
            if (onSuccess) onSuccess(savedCity);
            return;
        }
        if (statusEl) statusEl.textContent = 'ğŸ“ Konum alÄ±nÄ±yor...';
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lon } = pos.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr`);
                    const data = await res.json();
                    const city = data.address?.city || data.address?.town || data.address?.county || data.address?.state || '';
                    if (!city) { if (statusEl) statusEl.textContent = 'âŒ Åehir bulunamadÄ±'; return; }
                    localStorage.setItem('qp_geo_city', city);
                    if (inp) inp.value = city;
                    if (statusEl) statusEl.textContent = `âœ… ${city}`;
                    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
                    if (onSuccess) onSuccess(city);
                } catch(e) {
                    if (statusEl) statusEl.textContent = 'âŒ Konum Ã§Ã¶zÃ¼mlenemedi';
                }
            },
            (err) => {
                if (statusEl) statusEl.textContent = 'âŒ Konum izni reddedildi';
            },
            { timeout: 10000 }
        );
    }

    async _fetchPrayerTimes(city) {
        if (!city) return;
        const el = document.getElementById('prayerTimes');
        const nextEl = document.getElementById('prayerNextInfo');
        el.innerHTML = '<div style="color:#64748b;text-align:center;grid-column:1/-1;padding:1rem">â³ YÃ¼kleniyor...</div>';
        nextEl.textContent = '';
        try {
            const resp = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`);
            const json = await resp.json();
            if (json.code !== 200) { el.innerHTML = '<div style="color:#f87171;grid-column:1/-1">Åehir bulunamadÄ±.</div>'; return; }

            const t = json.data.timings;
            const date = json.data.date;
            const hijri = date.hijri;
            const prayers = [
                { name:'Ä°msak',  time:t.Imsak,   icon:'ğŸŒ™' },
                { name:'Sabah',  time:t.Fajr,    icon:'ğŸŒ…' },
                { name:'GÃ¼neÅŸ', time:t.Sunrise,  icon:'â˜€ï¸' },
                { name:'Ã–ÄŸle',  time:t.Dhuhr,   icon:'ğŸŒ' },
                { name:'Ä°kindi', time:t.Asr,     icon:'ğŸŒ‡' },
                { name:'AkÅŸam', time:t.Maghrib,  icon:'ğŸŒ†' },
                { name:'YatsÄ±', time:t.Isha,     icon:'ğŸŒƒ' },
            ];

            const now = new Date();
            const nowMin = now.getHours()*60+now.getMinutes();

            const toMin = (timeStr) => {
                const [h,m] = timeStr.split(':').map(Number);
                return h*60+m;
            };

            // GeÃ§miÅŸ / aktif / gelecek tespiti
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
                    ${isActive ? '<div style="font-size:0.65rem;color:#f59e0b;margin-top:2px">â— Åimdi</div>' : ''}
                    ${isNext   ? '<div style="font-size:0.65rem;color:#38bdf8;margin-top:2px">â†‘ Sonraki</div>' : ''}
                </div>`;
            }).join('');

            // Hicri tarih + geri sayÄ±m
            const hijriText = `${hijri.day} ${hijri.month.ar} ${hijri.year}`;
            if (nextIdx !== -1) {
                const nextPrayer = prayers[nextIdx];
                const diffMin = toMin(nextPrayer.time) - nowMin;
                const h = Math.floor(diffMin/60), m = diffMin%60;
                const countdown = h > 0 ? `${h} saat ${m} dk` : `${m} dakika`;
                nextEl.innerHTML = `
                    <span style="color:#64748b;font-size:0.8rem;margin-right:10px">ğŸ—“ ${hijriText}</span>
                    <span>â° <strong>${nextPrayer.name}</strong>'a ${countdown} kaldÄ± (${nextPrayer.time})</span>`;
            } else {
                nextEl.innerHTML = `<span style="color:#64748b;font-size:0.8rem;margin-right:10px">ğŸ—“ ${hijriText}</span><span>ğŸŒ™ BugÃ¼nkÃ¼ tÃ¼m vakitler geÃ§ti</span>`;
            }

            // CanlÄ± geri sayÄ±m â€” her dakika gÃ¼ncelle
            if (this._prayerCountdownInterval) clearInterval(this._prayerCountdownInterval);
            this._prayerCountdownInterval = setInterval(() => {
                if (document.getElementById('prayerPanel') && !document.getElementById('prayerPanel').classList.contains('hidden')) {
                    this._fetchPrayerTimes(city);
                } else {
                    clearInterval(this._prayerCountdownInterval);
                }
            }, 60000);

        } catch(e) {
            el.innerHTML = '<div style="color:#f87171;grid-column:1/-1;padding:1rem">Veri alÄ±namadÄ±. Ä°nternet baÄŸlantÄ±sÄ±nÄ± kontrol edin.</div>';
        }
    }

    // ============================================================
    // ğŸ¤² DUALAR
    // ============================================================

    _initDuaPanel() {
        const duas = [
            { cat: 'Sabah', arabic: 'Ø£ÙØµÙ’Ø¨ÙØ­Ù’Ù†ÙØ§ ÙˆÙØ£ÙØµÙ’Ø¨ÙØ­Ù Ø§Ù„Ù’Ù…ÙÙ„Ù’ÙƒÙ Ù„ÙÙ„ÙÙ‘Ù‡Ù', tr: 'SabahladÄ±k, mÃ¼lk de Allah\'a sabahladÄ±.', kaynak: 'MÃ¼slim' },
            { cat: 'AkÅŸam', arabic: 'Ø£ÙÙ…Ù’Ø³ÙÙŠÙ’Ù†ÙØ§ ÙˆÙØ£ÙÙ…Ù’Ø³ÙÙ‰ Ø§Ù„Ù’Ù…ÙÙ„Ù’ÙƒÙ Ù„ÙÙ„ÙÙ‘Ù‡Ù', tr: 'AkÅŸamladÄ±k, mÃ¼lk de Allah\'a akÅŸamladÄ±.', kaynak: 'MÃ¼slim' },
            { cat: 'Yemek', arabic: 'Ø§ÙÙ„Ù’Ø­ÙÙ…Ù’Ø¯Ù Ù„ÙÙ„Ù‘Ù°Ù‡Ù Ø§ÙÙ„Ù’Ø­ÙÙ…Ù’Ø¯Ù Ù„ÙÙ„Ù‘Ù°Ù‡Ù Ø§ÙÙ„Ù’Ø­ÙÙ…Ù’Ø¯Ù Ù„ÙÙ„Ù‘Ù°Ù‡Ù Ø§Ù„ÙÙ‘Ø°ÙÙ‰ Ø§ÙØ·Ù’Ø¹ÙÙ…ÙÙ†ÙØ§ ÙˆÙØ³ÙÙ‚ÙØ§Ù†ÙØ§ ÙˆÙØ¬ÙØ¹ÙÙ„ÙÙ†ÙØ§ Ù…ÙÙ†Ù Ø§Ù„Ù’Ù…ÙØ³Ù’Ù„ÙÙ…ÙÙŠÙ†Ù. Ø§ÙÙ„Ù’Ø­ÙÙ…Ù’Ø¯Ù Ù„ÙÙ„Ù‘Ù°Ù‡Ù Ø±ÙØ¨ÙÙ‘ Ø§Ù„Ù’Ø¹ÙØ§Ù„ÙÙ…ÙÙŠÙ†Ù. ÙˆÙØ§Ù„ØµÙÙ‘Ù„ÙØ§Ø©Ù ÙˆÙØ§Ù„Ø³ÙÙ‘Ù„ÙØ§Ù…Ù Ø¹ÙÙ„ÙÙ‰ Ø³ÙÙŠÙÙ‘Ø¯ÙÙ†ÙØ§ Ù…ÙØ­ÙÙ…ÙÙ‘Ø¯Ù ÙˆÙØ¹ÙÙ„ÙÙ‰ Ø¢Ù„ÙÙ‡Ù ÙˆÙØµÙØ­Ù’Ø¨ÙÙ‡Ù Ø§ÙØ¬Ù’Ù…ÙØ¹ÙÙŠÙ†Ù. âÙˆÙØ§Ø¹Ù’ÙÙ Ø¹ÙÙ†ÙÙ‘Ø§ ÙˆÙØ§ØºÙ’ÙÙØ±Ù’ Ù„ÙÙ†ÙØ§ ÙˆÙØ§Ø±Ù’Ø­ÙÙ…Ù’Ù†ÙØ§ Ø§ÙÙ†Ù’ØªÙ Ù…ÙÙˆÙ’Ù„ÙØ§Ù†ÙØ§ ÙÙØ§Ù†Ù’ØµÙØ±Ù’Ù†ÙØ§ Ø¹ÙÙ„ÙÙ‰ Ø§Ù„Ù’Ù‚ÙÙˆÙ’Ù…Ù Ø§Ù„Ù’ÙƒÙØ§ÙÙØ±ÙÙŠÙ†Ùâ (Ù£ defa)', tr: 'Allah\'a hamdolsun, Allah\'a hamdolsun, Allah\'a hamdolsun. O ki bizi yedirdi, iÃ§irdi ve MÃ¼slÃ¼manlardan kÄ±ldÄ±. Hamd, Ã¢lemlerin Rabbi Allah\'a mahsustur. Efendimiz Muhammed\'e, Ã¢line ve ashabÄ±nÄ±n tÃ¼mÃ¼ne salÃ¢t ve selam olsun. âBizi affet, bizi baÄŸÄ±ÅŸla, bize merhamet et; sen bizim MevlÃ¢mÄ±zsÄ±n, inkÃ¢rcÄ± topluma karÅŸÄ± bize yardÄ±m et.â (3 defa)', kaynak: 'Bakara 286 / Ebu Davud' },
            { cat: 'Uyku', arabic: 'Ø¨ÙØ§Ø³Ù’Ù…ÙÙƒÙ Ø§Ù„Ù„ÙÙ‘Ù‡ÙÙ…ÙÙ‘ Ø£ÙÙ…ÙÙˆØªÙ ÙˆÙØ£ÙØ­Ù’ÙŠÙØ§', tr: 'Allah\'Ä±m, senin adÄ±nla Ã¶lÃ¼r ve dirilirm.', kaynak: 'Buhari' },
            { cat: 'Yolculuk', arabic: 'Ø³ÙØ¨Ù’Ø­ÙØ§Ù†Ù Ø§Ù„ÙÙ‘Ø°ÙÙŠ Ø³ÙØ®ÙÙ‘Ø±Ù Ù„ÙÙ†ÙØ§ Ù‡ÙØ°ÙØ§', tr: 'Bunu bize boyun eÄŸdireni tesbih ederiz.', kaynak: 'Tirmizi' },
            { cat: 'Åifa', arabic: 'Ø£ÙØ°Ù’Ù‡ÙØ¨Ù Ø§Ù„Ù’Ø¨ÙØ£Ù’Ø³Ù Ø±ÙØ¨ÙÙ‘ Ø§Ù„Ù†ÙÙ‘Ø§Ø³Ù', tr: 'Ey insanlarÄ±n Rabbi, sÄ±kÄ±ntÄ±yÄ± gider.', kaynak: 'Buhari' },
            { cat: 'Ä°stihare', arabic: 'Ø§Ù„Ù„ÙÙ‘Ù‡ÙÙ…ÙÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙØ³Ù’ØªÙØ®ÙÙŠØ±ÙÙƒÙ Ø¨ÙØ¹ÙÙ„Ù’Ù…ÙÙƒÙ', tr: 'Allah\'Ä±m, ilminle senden hayÄ±r dilerim.', kaynak: 'Buhari' },
            { cat: 'Af', arabic: 'Ø±ÙØ¨ÙÙ‘ Ø§ØºÙ’ÙÙØ±Ù’ Ù„ÙÙŠ ÙˆÙØªÙØ¨Ù’ Ø¹ÙÙ„ÙÙŠÙÙ‘', tr: 'Rabbim, beni baÄŸÄ±ÅŸla ve tevbemi kabul et.', kaynak: 'Tirmizi' },
        ];

        const tabsEl = document.getElementById('duaTabs');
        const contentEl = document.getElementById('duaContent');
        if (tabsEl.children.length > 0) return; // zaten init edilmiÅŸ

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
    // ğŸ”– YER Ä°MÄ° SÄ°STEMÄ°
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
        this._showToast(`ğŸ”– ${surahName} ${ayahId}. ayet kaydedildi`, '#6ee7b7');
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
                    <div style="color:#e2e8f0;font-weight:600;font-size:0.9rem">ğŸ“– ${b.surahName} â€” ${b.ayahId}. Ayet</div>
                    <div style="color:#475569;font-size:0.75rem;margin-top:2px">${new Date(b.savedAt).toLocaleDateString('tr-TR')}</div>
                </div>
                <div style="display:flex;gap:6px">
                    <button onclick="App.loadSurah(${b.surahId}).then(()=>setTimeout(()=>App.scrollToAyah(${b.ayahId}),400))" style="background:#1e3a5f;color:#aee2ff;border:none;border-radius:8px;padding:4px 10px;font-size:0.78rem;cursor:pointer">Git</button>
                    <button onclick="App.playAyah(${b.surahId},${b.ayahId})" style="background:#064e3b;color:#6ee7b7;border:none;border-radius:8px;padding:4px 10px;font-size:0.78rem;cursor:pointer">â–¶</button>
                    <button onclick="App._removeBookmark(${i})" style="background:#7f1d1d;color:#fca5a5;border:none;border-radius:8px;padding:4px 8px;font-size:0.78rem;cursor:pointer">âœ•</button>
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
    // ğŸ” MEAL Ä°Ã‡Ä°NDE ARA
    // ============================================================

    async _checkAdminPrivilege(uid) {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'admins', uid));
            if (snap.exists()) {
                // Bu kullanÄ±cÄ± admin â€” token'Ä± localStorage'a yaz
                window._userIsAdmin = true;
                localStorage.setItem('adm_user_token', uid);
                // Admin paneline ÅŸifresiz giriÅŸ yetki ver
                if (typeof Admin !== 'undefined') {
                    Admin.isAuthenticated = true;
                    // Sol alt kÃ¶ÅŸeye gizli admin gÃ¶stergesi
                    if (!document.getElementById('adminIndicator')) {
                        const ind = document.createElement('div');
                        ind.id = 'adminIndicator';
                        ind.style.cssText = 'position:fixed;bottom:60px;left:12px;z-index:9999;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;padding:4px 10px;border-radius:20px;font-size:0.72rem;font-family:sans-serif;font-weight:bold;cursor:pointer;opacity:0.7;transition:opacity 0.2s';
                        ind.textContent = 'ğŸ›¡ï¸ Admin';
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
                    this._showToast(`ğŸ“ Admin'den not: ${data.message}`, '#fcd34d');
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
        if (!this.state.mealCache) { results.innerHTML = '<div style="color:#f87171;text-align:center;padding:1rem;font-family:sans-serif">Meal veritabanÄ± yÃ¼klenmedi.</div>'; return; }
        results.innerHTML = '<div style="color:#64748b;text-align:center;padding:1rem;font-family:sans-serif">ğŸ” AranÄ±yor...</div>';

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

        if (!found.length) { results.innerHTML = '<div style="color:#64748b;text-align:center;padding:1rem;font-family:sans-serif">SonuÃ§ bulunamadÄ±.</div>'; return; }

        results.innerHTML = `<div style="color:#64748b;font-size:0.78rem;margin-bottom:8px;font-family:sans-serif">${found.length} sonuÃ§ (ilk 40)</div>` +
        found.map(f => {
            const highlighted = f.text.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi'), m => `<mark style="background:#f59e0b33;color:#fcd34d;border-radius:3px">${m}</mark>`);
            return `<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 14px;margin-bottom:6px;font-family:sans-serif">
                <div style="color:#f59e0b;font-size:0.78rem;margin-bottom:4px">${f.surahName} â€” ${f.ayahId}. Ayet</div>
                <div style="color:#e2e8f0;font-size:0.85rem;line-height:1.6;direction:ltr">${highlighted}</div>
                <div style="margin-top:6px;display:flex;gap:6px">
                    <button onclick="App.loadSurah(${f.surahId}).then(()=>setTimeout(()=>App.scrollToAyah(${f.ayahId}),400))" style="background:#1e3a5f;color:#aee2ff;border:none;border-radius:6px;padding:3px 8px;font-size:0.75rem;cursor:pointer">ğŸ“– Git</button>
                    <button onclick="App.playAyah(${f.surahId},${f.ayahId})" style="background:#064e3b;color:#6ee7b7;border:none;border-radius:6px;padding:3px 8px;font-size:0.75rem;cursor:pointer">â–¶ Dinle</button>
                </div>
            </div>`;
        }).join('');
    }

    // ============================================================
    // âœï¸ OYUN: KELÄ°ME TAMAMLA
    // ============================================================
    _startWordComplete() {
        if (!this.state.mealCache) { alert('Meal yÃ¼klenmedi'); return; }
        this.wcGame = { score:0, total:0, correct:'', _recorded:false };
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
        document.getElementById('wcHint').textContent=`Ä°pucu: ${correct.length} harf, "${correct[0]}" ile baÅŸlÄ±yor`;
        document.getElementById('wcScore').textContent=`${this.wcGame.score}/${this.wcGame.total}`;
        setTimeout(()=>document.getElementById('wcInput').focus(),100);
    }
    _checkWordComplete() {
        const inp = document.getElementById('wcInput').value.trim().toLowerCase().replace(/[,.:;!?]/g,'');
        if (!inp) return;
        this.wcGame.total++;
        if (this.wcGame.total % 10 === 0) { this.wcGame._recorded=false; this._tryRecordGameScore(); }
        const correct = this.wcGame.correct;
        const isRight = inp===correct || inp===correct.replace(/[,.:;!?]/g,'');
        if (isRight) { this.wcGame.score++; document.getElementById('wcFeedback').innerHTML='âœ… DoÄŸru!'; }
        else { document.getElementById('wcFeedback').innerHTML=`âŒ Cevap: <strong>${correct}</strong>`; }
        document.getElementById('wcScore').textContent=`${this.wcGame.score}/${this.wcGame.total}`;
        document.getElementById('wcNextBtn').classList.remove('hidden');
    }

    // ============================================================
    // âœ… OYUN: DOÄRU / YANLIÅ
    // ============================================================
    _startTrueFalse() {
        this.tfGame = { score:0, total:0, correct:null, _recorded:false };
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
        // YarÄ±sÄ± doÄŸru, yarÄ±sÄ± yanlÄ±ÅŸ
        const isTrue = Math.random()>0.5;
        let statement='', correct=isTrue;
        if (isTrue) {
            const types=['ayah','position'];
            const t=types[Math.floor(Math.random()*types.length)];
            if (t==='ayah') statement=`${surah.name} suresinde ${surah.ayahCount} ayet vardÄ±r.`;
            else statement=`${surah.name} suresi Kur\'an'da ${surah.id}. suredir.`;
        } else {
            const wrong=surah.ayahCount+Math.floor(Math.random()*20)+5;
            statement=`${surah.name} suresinde ${wrong} ayet vardÄ±r.`;
        }
        this.tfGame.correct=correct;
        document.getElementById('tfQuestion').innerHTML=`<div class="quiz-sub">Bu ifade doÄŸru mu?</div><div style="font-size:1rem;color:#e2e8f0;font-family:sans-serif;line-height:1.7;text-align:center">${statement}</div>`;
        document.getElementById('tfScore').textContent=`${this.tfGame.score}/${this.tfGame.total}`;
    }
    _tfAnswer(answer) {
        ['tfTrueBtn','tfFalseBtn'].forEach(id=>{ const b=document.getElementById(id); if(b)b.disabled=true; });
        this.tfGame.total++;
        if (this.tfGame.total % 10 === 0) { this.tfGame._recorded=false; this._tryRecordGameScore(); }
        const isRight=answer===this.tfGame.correct;
        if (isRight) { this.tfGame.score++; document.getElementById('tfFeedback').textContent='âœ… DoÄŸru!'; }
        else { document.getElementById('tfFeedback').textContent='âŒ YanlÄ±ÅŸ!'; }
        document.getElementById('tfScore').textContent=`${this.tfGame.score}/${this.tfGame.total}`;
        document.getElementById('tfNextBtn').classList.remove('hidden');
    }

    // ============================================================
    // ğŸ”¤ OYUN: Ä°LK AYET KÄ°M?
    // ============================================================
    _startSurahFirst() {
        if (!this.state.mealCache) { alert('Meal yÃ¼klenmedi'); return; }
        this.sfGame = { score:0, total:0, _recorded:false };
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
        document.getElementById('sfQuestion').innerHTML=`<div class="quiz-sub">Bu sure hangisiyle baÅŸlar?</div><div style="font-size:0.88rem;color:#94a3b8;line-height:1.7;direction:ltr;text-align:center;font-family:sans-serif;padding:0 8px">"${firstVerse.slice(0,100)}${firstVerse.length>100?'â€¦':''}"</div>`;
        const div=document.getElementById('sfOptions');
        div.innerHTML='';
        opts.forEach(opt=>{
            const btn=document.createElement('button');
            btn.className='quiz-opt-btn';
            btn.textContent=opt.name;
            btn.onclick=()=>{
                div.querySelectorAll('button').forEach(b=>b.disabled=true);
                this.sfGame.total++;
                if(opt.id===correct.id){btn.classList.add('correct');this.sfGame.score++;document.getElementById('sfFeedback').textContent='âœ… DoÄŸru!';}
                if (this.sfGame.total % 10 === 0) { this.sfGame._recorded=false; this._tryRecordGameScore(); }
                else{btn.classList.add('wrong');div.querySelectorAll('button').forEach(b=>{if(b.textContent===correct.name)b.classList.add('correct')});document.getElementById('sfFeedback').textContent=`âŒ DoÄŸrusu: ${correct.name}`;}
                document.getElementById('sfScore').textContent=`${this.sfGame.score}/${this.sfGame.total}`;
                document.getElementById('sfNextBtn').classList.remove('hidden');
            };
            div.appendChild(btn);
        });
        document.getElementById('sfScore').textContent=`${this.sfGame.score}/${this.sfGame.total}`;
    }

    // ============================================================
    // ğŸ… ROZET SÄ°STEMÄ°
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
            { id:'first_surah',   icon:'ğŸŒ±', name:'Ä°lk AdÄ±m',       desc:'1 sure oku',                  cond: opened>=1 },
            { id:'three_surahs',  icon:'ğŸ“—', name:'ÃœÃ§ Sure',        desc:'3 sure oku',                  cond: opened>=3 },
            { id:'five_surahs',   icon:'ğŸ“š', name:'BeÅŸ Sure',       desc:'5 sure oku',                  cond: opened>=5 },
            { id:'ten_surahs',    icon:'ğŸ“–', name:'On Sure',        desc:'10 sure oku',                 cond: opened>=10 },
            { id:'twenty_surahs', icon:'ğŸ“•', name:'Yirmi Sure',     desc:'20 sure oku',                 cond: opened>=20 },
            { id:'half_quran',    icon:'ğŸŒ™', name:'YarÄ± Kur\'an',   desc:'57 sure oku',                 cond: opened>=57 },
            { id:'full_quran',    icon:'ğŸ†', name:'Hatim',          desc:'TÃ¼m 114 sureyi oku',          cond: opened>=114 },
            // Dinleme rozetleri
            { id:'first_ayah',    icon:'ğŸµ', name:'Ä°lk Ses',        desc:'1 ayet dinle',                cond: (stats.ayahCount||0)>=1 },
            { id:'10_ayahs',      icon:'ğŸ”‰', name:'10 Ayet',        desc:'10 ayet dinle',               cond: (stats.ayahCount||0)>=10 },
            { id:'50_ayahs',      icon:'ğŸ¶', name:'50 Ayet',        desc:'50 ayet dinle',               cond: (stats.ayahCount||0)>=50 },
            { id:'100_ayahs',     icon:'ğŸ’¯', name:'100 Ayet',       desc:'100 ayet dinle',              cond: (stats.ayahCount||0)>=100 },
            { id:'500_ayahs',     icon:'â­', name:'500 Ayet',       desc:'500 ayet dinle',              cond: (stats.ayahCount||0)>=500 },
            { id:'1000_ayahs',    icon:'ğŸŒŸ', name:'1000 Ayet',      desc:'1000 ayet dinle',             cond: (stats.ayahCount||0)>=1000 },
            // SÃ¼re rozetleri
            { id:'min_listen',    icon:'â±ï¸', name:'30 Dakika',      desc:'30 dk dinle',                 cond: (stats.listenSeconds||0)>=1800 },
            { id:'hour_listen',   icon:'âŒ›', name:'1 Saat',         desc:'1 saat dinle',                cond: (stats.listenSeconds||0)>=3600 },
            { id:'5hour_listen',  icon:'ğŸ•', name:'5 Saat',         desc:'5 saat dinle',                cond: (stats.listenSeconds||0)>=18000 },
            // HafÄ±zlÄ±k rozetleri
            { id:'hifz_start',    icon:'ğŸ§ ', name:'HafÄ±z AdayÄ±',    desc:'1 hafÄ±zlÄ±k seansÄ±',           cond: (stats.hifzCount||0)>=1 },
            { id:'hifz_5',        icon:'ğŸ“', name:'5 Seans',        desc:'5 hafÄ±zlÄ±k seansÄ±',           cond: (stats.hifzCount||0)>=5 },
            { id:'hifz_10',       icon:'ğŸ“', name:'10 Seans',       desc:'10 hafÄ±zlÄ±k seansÄ±',          cond: (stats.hifzCount||0)>=10 },
            { id:'hifz_30',       icon:'ğŸ–ï¸', name:'30 Seans',       desc:'30 hafÄ±zlÄ±k seansÄ±',          cond: (stats.hifzCount||0)>=30 },
            // Zikir rozetleri
            { id:'zikr_33',       icon:'ğŸ“¿', name:'33 Zikir',       desc:'33 zikir Ã§ek',                cond: (stats.zikrTotal||0)>=33 },
            { id:'zikr_100',      icon:'ğŸ’', name:'100 Zikir',      desc:'100 zikir Ã§ek',               cond: (stats.zikrTotal||0)>=100 },
            { id:'zikr_1000',     icon:'ğŸ‘‘', name:'1000 Zikir',     desc:'1000 zikir Ã§ek',              cond: (stats.zikrTotal||0)>=1000 },
            // Hedef rozetleri
            { id:'daily_goal',    icon:'ğŸ¯', name:'Hedef Tutan',    desc:'GÃ¼nlÃ¼k hedefe ulaÅŸ',          cond: (stats.todayAyahs||0)>=(stats.dailyGoal||10) },
            { id:'day_streak3',   icon:'ğŸ”¥', name:'3 GÃ¼n Streak',   desc:'3 gÃ¼n Ã¼st Ã¼ste giriÅŸ',        cond: (stats.streakDays||0)>=3 },
            { id:'day_streak7',   icon:'ğŸ”¥', name:'7 GÃ¼n Streak',   desc:'7 gÃ¼n Ã¼st Ã¼ste giriÅŸ',        cond: (stats.streakDays||0)>=7 },
            { id:'day_streak30',  icon:'ğŸ’«', name:'30 GÃ¼n Streak',  desc:'30 gÃ¼n Ã¼st Ã¼ste giriÅŸ',       cond: (stats.streakDays||0)>=30 },
            // Ã–zel
            { id:'ramadan',       icon:'ğŸŒ™', name:'Ramazan Ruhu',   desc:'Ramazan ayÄ±nda giriÅŸ yap',    cond: new Date().getMonth()===2 },
            { id:'early_bird',    icon:'ğŸŒ…', name:'Sabah NamazÄ±',   desc:'Sabah 5-7 arasÄ± oku',         cond: (()=>{ const h=new Date().getHours(); return h>=5&&h<7; })() },
            { id:'night_reader',  icon:'ğŸŒƒ', name:'Gece OkuyanÄ±',   desc:'Gece 22-02 arasÄ± oku',        cond: (()=>{ const h=new Date().getHours(); return h>=22||h<2; })() },
        ];

        el.innerHTML = BADGES.map(b => `
            <div style="background:${b.cond?'#1a3a1a':'#1e293b'};border:1.5px solid ${b.cond?'#6ee7b7':'#334155'};border-radius:14px;padding:12px 8px;text-align:center;transition:0.3s;opacity:${b.cond?'1':'0.5'}">
                <div style="font-size:1.8rem;margin-bottom:4px">${b.icon}</div>
                <div style="color:${b.cond?'#6ee7b7':'#94a3b8'};font-size:0.78rem;font-weight:bold;font-family:sans-serif">${b.name}</div>
                <div style="color:#475569;font-size:0.68rem;font-family:sans-serif;margin-top:2px">${b.desc}</div>
                ${b.cond?'<div style="color:#6ee7b7;font-size:0.65rem;margin-top:3px">âœ… KazanÄ±ldÄ±</div>':''}
            </div>`).join('');
    }

    // ============================================================
    // ğŸ“… DÄ°NÄ° GÃœNLER TAKVÄ°MÄ°
    // ============================================================
    // â”€â”€ Ä°slami Takvim â€” GerÃ§ek Grid + Diyanet Tarihleri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _getDiniGunler() {
        // Diyanet Ä°ÅŸleri BaÅŸkanlÄ±ÄŸÄ± resmi takvimi (2025 + 2026)
        return [
            // â”€â”€ 2025 â”€â”€
            { date:'2025-01-01', name:'ÃœÃ§ Aylar BaÅŸlangÄ±cÄ± (Recep)', icon:'ğŸŒ™', color:'#6ee7b7', hicri:'1 Recep 1446' },
            { date:'2025-01-02', name:'Regaip Kandili',               icon:'âœ¨', color:'#a78bfa', hicri:'2 Recep 1446' },
            { date:'2025-01-26', name:'MiraÃ§ Kandili',                icon:'ğŸš€', color:'#a78bfa', hicri:'26 Recep 1446' },
            { date:'2025-02-13', name:'Berat Kandili',                icon:'ğŸ“œ', color:'#a78bfa', hicri:'14 Åaban 1446' },
            { date:'2025-03-01', name:'Ramazan BaÅŸlangÄ±cÄ±',           icon:'ğŸŒ™', color:'#f59e0b', hicri:'1 Ramazan 1446' },
            { date:'2025-03-27', name:'Kadir Gecesi',                 icon:'â­', color:'#fcd34d', hicri:'27 Ramazan 1446' },
            { date:'2025-03-30', name:'Ramazan BayramÄ± 1. GÃ¼nÃ¼',      icon:'ğŸ‰', color:'#f59e0b', hicri:'1 Åevval 1446' },
            { date:'2025-03-31', name:'Ramazan BayramÄ± 2. GÃ¼nÃ¼',      icon:'ğŸ‰', color:'#f59e0b', hicri:'2 Åevval 1446' },
            { date:'2025-04-01', name:'Ramazan BayramÄ± 3. GÃ¼nÃ¼',      icon:'ğŸ‰', color:'#f59e0b', hicri:'3 Åevval 1446' },
            { date:'2025-06-04', name:'Kurban BayramÄ± Arefesi',       icon:'ğŸŒ…', color:'#fb923c', hicri:'9 Zilhicce 1446' },
            { date:'2025-06-05', name:'Kurban BayramÄ± 1. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'10 Zilhicce 1446' },
            { date:'2025-06-06', name:'Kurban BayramÄ± 2. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'11 Zilhicce 1446' },
            { date:'2025-06-07', name:'Kurban BayramÄ± 3. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'12 Zilhicce 1446' },
            { date:'2025-06-08', name:'Kurban BayramÄ± 4. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'13 Zilhicce 1446' },
            { date:'2025-09-04', name:'Mevlid Kandili',               icon:'â˜ªï¸', color:'#6ee7b7', hicri:'12 RebiÃ¼levvel 1447' },
            // â”€â”€ 2026 â”€â”€
            { date:'2026-01-15', name:'MiraÃ§ Kandili',                icon:'ğŸš€', color:'#a78bfa', hicri:'26 Recep 1447' },
            { date:'2026-02-02', name:'Berat Kandili',                icon:'ğŸ“œ', color:'#a78bfa', hicri:'14 Åaban 1447' },
            { date:'2026-02-19', name:'Ramazan BaÅŸlangÄ±cÄ±',           icon:'ğŸŒ™', color:'#f59e0b', hicri:'1 Ramazan 1447' },
            { date:'2026-03-16', name:'Kadir Gecesi',                 icon:'â­', color:'#fcd34d', hicri:'27 Ramazan 1447' },
            { date:'2026-03-20', name:'Ramazan BayramÄ± 1. GÃ¼nÃ¼',      icon:'ğŸ‰', color:'#f59e0b', hicri:'1 Åevval 1447' },
            { date:'2026-03-21', name:'Ramazan BayramÄ± 2. GÃ¼nÃ¼',      icon:'ğŸ‰', color:'#f59e0b', hicri:'2 Åevval 1447' },
            { date:'2026-03-22', name:'Ramazan BayramÄ± 3. GÃ¼nÃ¼',      icon:'ğŸ‰', color:'#f59e0b', hicri:'3 Åevval 1447' },
            { date:'2026-05-26', name:'Kurban BayramÄ± Arefesi',       icon:'ğŸŒ…', color:'#fb923c', hicri:'9 Zilhicce 1447' },
            { date:'2026-05-27', name:'Kurban BayramÄ± 1. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'10 Zilhicce 1447' },
            { date:'2026-05-28', name:'Kurban BayramÄ± 2. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'11 Zilhicce 1447' },
            { date:'2026-05-29', name:'Kurban BayramÄ± 3. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'12 Zilhicce 1447' },
            { date:'2026-05-30', name:'Kurban BayramÄ± 4. GÃ¼nÃ¼',       icon:'ğŸŠ', color:'#f59e0b', hicri:'13 Zilhicce 1447' },
            { date:'2026-12-21', name:'ÃœÃ§ Aylar BaÅŸlangÄ±cÄ± (Recep)', icon:'ğŸŒ™', color:'#6ee7b7', hicri:'1 Recep 1448' },
            { date:'2026-12-25', name:'Regaip Kandili',               icon:'âœ¨', color:'#a78bfa', hicri:'5 Recep 1448' },
        ];
    }

    async _renderCalendar() {
        const container = document.getElementById('calendarContent');
        if (!container) return;

        // State init
        if (!this._calYear) {
            const now = new Date();
            this._calYear  = now.getFullYear();
            this._calMonth = now.getMonth(); // 0-based
        }

        const events   = this._getDiniGunler();
        const today    = new Date();
        today.setHours(0,0,0,0);
        const MONTHS_TR = ['Ocak','Åubat','Mart','Nisan','MayÄ±s','Haziran','Temmuz','AÄŸustos','EylÃ¼l','Ekim','KasÄ±m','AralÄ±k'];
        const DAYS_TR   = ['Pzt','Sal','Ã‡ar','Per','Cum','Cmt','Paz'];

        const y = this._calYear;
        const m = this._calMonth;
        const firstDay = new Date(y, m, 1);
        const lastDay  = new Date(y, m + 1, 0);
        // Pazartesi baÅŸlangÄ±Ã§lÄ± â€” JS'de 0=Pazar, biz 0=Pzt istiyoruz
        let startDow = firstDay.getDay(); // 0=Pazar
        startDow = (startDow + 6) % 7;   // â†’ 0=Pzt

        // Event map: "YYYY-MM-DD" â†’ [events]
        const evMap = {};
        events.forEach(e => {
            if (!evMap[e.date]) evMap[e.date] = [];
            evMap[e.date].push(e);
        });

        // Hicri tarihi API'den al
        let hijriToday = '';
        try {
            const r = await fetch(`https://api.aladhan.com/v1/gToH?date=${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`);
            if (r.ok) {
                const j = await r.json();
                const h = j.data?.hijri;
                if (h) hijriToday = `${h.day} ${h.month?.en} ${h.year}`;
            }
        } catch(e) {}

        // Grid hÃ¼creleri
        let cells = '';
        // BoÅŸ baÅŸlangÄ±Ã§ hÃ¼creleri
        for (let i = 0; i < startDow; i++) cells += `<div class="qcal-cell qcal-empty"></div>`;
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const cellDate = new Date(y, m, d);
            const isToday = cellDate.getTime() === today.getTime();
            const dayEvents = evMap[dateStr] || [];
            const hasFest = dayEvents.some(e => e.name.includes('Bayram'));
            const hasKandil = dayEvents.some(e => e.icon === 'âœ¨' || e.icon === 'ğŸš€' || e.icon === 'ğŸ“œ' || e.icon === 'â­' || e.icon === 'â˜ªï¸');
            const hasMoon  = dayEvents.some(e => e.icon === 'ğŸŒ™');
            let dotHtml = '';
            if (dayEvents.length) {
                const colors = [...new Set(dayEvents.map(e => e.color))].slice(0,3);
                dotHtml = `<div class="qcal-dots">${colors.map(c=>`<span class="qcal-dot" style="background:${c}"></span>`).join('')}</div>`;
            }
            cells += `<div class="qcal-cell${isToday?' qcal-today':''}${hasFest?' qcal-fest':''}${hasKandil?' qcal-kandil':''}${hasMoon?' qcal-moon':''}" data-date="${dateStr}" onclick="App._calDayClick('${dateStr}')">
                <span class="qcal-num">${d}</span>
                ${dotHtml}
            </div>`;
        }

        // YaklaÅŸan dini gÃ¼nler listesi
        const upcoming = events
            .filter(e => new Date(e.date) >= today)
            .sort((a,b) => new Date(a.date) - new Date(b.date))
            .slice(0, 7);

        const upcomingHtml = upcoming.map(e => {
            const dt = new Date(e.date);
            const diff = Math.round((dt - today) / 86400000);
            const diffTxt = diff === 0 ? 'BugÃ¼n! ğŸ‰' : diff === 1 ? 'YarÄ±n' : `${diff} gÃ¼n sonra`;
            const [ey, em, ed] = e.date.split('-');
            return `<div class="qcal-ev-row" style="border-left-color:${e.color}">
                <div class="qcal-ev-icon">${e.icon}</div>
                <div class="qcal-ev-info">
                    <div class="qcal-ev-name">${e.name}</div>
                    <div class="qcal-ev-date">${parseInt(ed)} ${MONTHS_TR[parseInt(em)-1]} ${ey} Â· ${e.hicri}</div>
                </div>
                <div class="qcal-ev-diff" style="color:${e.color}">${diffTxt}</div>
            </div>`;
        }).join('');

        container.innerHTML = `
        <div class="qcal-wrap">
            <!-- Hicri bugÃ¼n -->
            ${hijriToday ? `<div class="qcal-hijri-today">ğŸŒ™ BugÃ¼n: ${hijriToday} (Hicri)</div>` : ''}

            <!-- Ay navigasyon -->
            <div class="qcal-nav">
                <button class="qcal-nav-btn" onclick="App._calPrev()">â€¹</button>
                <span class="qcal-nav-title">${MONTHS_TR[m]} ${y}</span>
                <button class="qcal-nav-btn" onclick="App._calNext()">â€º</button>
            </div>

            <!-- GÃ¼n baÅŸlÄ±klarÄ± -->
            <div class="qcal-grid">
                ${DAYS_TR.map(d=>`<div class="qcal-head">${d}</div>`).join('')}
                ${cells}
            </div>

            <!-- SeÃ§ili gÃ¼n detay -->
            <div id="qcalDayDetail" class="qcal-day-detail hidden"></div>

            <!-- YaklaÅŸan gÃ¼nler -->
            <div class="qcal-section-title">ğŸ“… YaklaÅŸan Dini GÃ¼nler</div>
            <div class="qcal-ev-list">${upcomingHtml || '<div style="color:#64748b;text-align:center;padding:16px">YaklaÅŸan dini gÃ¼n bulunamadÄ±</div>'}</div>

            <div class="qcal-source">Kaynak: Diyanet Ä°ÅŸleri BaÅŸkanlÄ±ÄŸÄ± Resmi Takvimi</div>
        </div>`;
    }

    _calPrev() {
        this._calMonth--;
        if (this._calMonth < 0) { this._calMonth = 11; this._calYear--; }
        this._renderCalendar();
    }
    _calNext() {
        this._calMonth++;
        if (this._calMonth > 11) { this._calMonth = 0; this._calYear++; }
        this._renderCalendar();
    }
    _calDayClick(dateStr) {
        const events = this._getDiniGunler().filter(e => e.date === dateStr);
        const detail = document.getElementById('qcalDayDetail');
        if (!detail) return;
        const [y,m,d] = dateStr.split('-');
        const MONTHS_TR = ['Ocak','Åubat','Mart','Nisan','MayÄ±s','Haziran','Temmuz','AÄŸustos','EylÃ¼l','Ekim','KasÄ±m','AralÄ±k'];
        if (!events.length) {
            detail.classList.add('hidden');
            return;
        }
        detail.classList.remove('hidden');
        detail.innerHTML = `<div style="font-family:sans-serif">
            <div style="color:#94a3b8;font-size:0.75rem;margin-bottom:8px">${parseInt(d)} ${MONTHS_TR[parseInt(m)-1]} ${y}</div>
            ${events.map(e=>`<div style="display:flex;align-items:center;gap:10px;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:6px;border-left:3px solid ${e.color}">
                <span style="font-size:1.3rem">${e.icon}</span>
                <div>
                    <div style="color:#e2e8f0;font-weight:600;font-size:0.9rem">${e.name}</div>
                    <div style="color:#64748b;font-size:0.72rem">${e.hicri}</div>
                </div>
            </div>`).join('')}
        </div>`;
    }

    // ============================================================
    // ğŸ“¤ AYET PAYLAÅMA
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
        const shareText = `${arabic}\n\n"${meal}"\n\nğŸ“– ${surahName} Suresi - ${ayahId}. Ayet\nKur\'an-Ä± Kerim Oku`;
        preview.innerHTML = `
            <div style="font-size:1.2rem;color:#e2e8f0;direction:rtl;font-family:'Amiri Quran',serif;margin-bottom:6px">${arabic||'Ã–nce bir sure aÃ§Ä±p ayet seÃ§in'}</div>
            ${meal?`<div style="color:#94a3b8;font-size:0.82rem;direction:ltr;font-family:sans-serif">"${meal}"</div>`:''}
            ${surahName?`<div style="color:#f59e0b;font-size:0.75rem;font-family:sans-serif;margin-top:4px">ğŸ“– ${surahName} - ${ayahId}. Ayet</div>`:''}`;
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
            cp.onclick=()=>{ navigator.clipboard.writeText(shareText); this._showToast('ğŸ“‹ KopyalandÄ±!','#6ee7b7'); };
        }
    }

    // ============================================================
    // ğŸŒ PRESENCE (ONLINE KULLANICI SAYISI)
    // ============================================================
    _initPresence(uid, displayName) {
        if (!window.FirebaseAuth?.setUserPresence) return;
        window.FirebaseAuth.setUserPresence(uid, displayName);
        // Sayfa kapatÄ±lÄ±nca offline yap
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
            bar.innerHTML = `ğŸ“Œ ${data.text} <button onclick="document.getElementById('pinnedMsgBar').remove()" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:#334155;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;color:#94a3b8">âœ•</button>`;
            document.body.appendChild(bar);
        } catch(e) {}
    }

    // ============================================================
    // ğŸ’¬ FLOATING BUBBLE MENÃœ
    // ============================================================
    _initBubbleMenu() {
        const menu    = document.getElementById('bubbleMenu');
        const trigger = document.getElementById('bubbleTrigger');
        const grid    = document.getElementById('bubbleGrid');
        const wrapper = document.getElementById('bubblePagesWrapper');
        if (!trigger || !grid || !menu) return;

        let isOpen    = false;
        let curPage   = 1;
        const PAGES   = 4;
        let menuDragX, menuDragY, menuOrigLeft, menuOrigBottom, menuDragging = false;

        // â”€â”€ SAYFA GEÃ‡Ä°ÅÄ° (track kayma) â”€â”€
        const track = document.getElementById('bubblePagesTrack');
        const showPage = (n) => {
            curPage = Math.max(1, Math.min(PAGES, n));
            if (track) {
                // Her sayfa wrapper'Ä±n 1/3'Ã¼ kadar â€” sola kaydÄ±r
                track.style.transform = `translateX(-${(curPage - 1) * (100 / 4)}%)`;
            }
            document.querySelectorAll('.bubble-dot').forEach((d, i) => {
                d.classList.toggle('active', i + 1 === curPage);
            });
        };

        // Noktalara tÄ±kla
        document.querySelectorAll('.bubble-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                showPage(parseInt(dot.dataset.page));
            });
        });

        // â”€â”€ AÃ‡ / KAPAT â”€â”€
        const open = () => {
            isOpen = true;
            grid.classList.remove('hidden');
            trigger.classList.add('open');
            trigger.querySelector('.bubble-trigger-icon').textContent = 'âœ•';
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
            trigger.querySelector('.bubble-trigger-icon').textContent = 'â˜°';
        };

        // â”€â”€ AÃ‡ / KAPAT â”€â”€
        trigger.addEventListener('click', (e) => {
            if (menuDragging) return;
            e.stopPropagation();
            isOpen ? close() : open();
        });

        document.addEventListener('click', (e) => {
            if (isOpen && !menu.contains(e.target)) close();
        });

        // â”€â”€ BALONCUÄU SÃœRÃœKLE (menÃ¼ pozisyonu) â”€â”€
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

        trigger.addEventListener('mousedown',  onDragStart, { passive: true });
        trigger.addEventListener('touchstart', onDragStart, { passive: true });
        document.addEventListener('mousemove', onDragMove,  { passive: false });
        document.addEventListener('touchmove', onDragMove,  { passive: false });
        document.addEventListener('mouseup',   onDragEnd);
        document.addEventListener('touchend',  onDragEnd);

        // â”€â”€ SAYFALARI SWIPE Ä°LE GEÃ‡ â”€â”€
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

        // â”€â”€ SAYFA 3 Ã–ZEL BUTONLARI â”€â”€
        const themeBtn = document.getElementById('bubbleThemeBtn');
        if (themeBtn) themeBtn.onclick = () => {
            document.body.classList.toggle('light');
            localStorage.setItem('qp_theme', document.body.classList.contains('light') ? 'light' : 'dark');
            setTimeout(close, 80);
        };
        const topBtn = document.getElementById('bubbleTopBtn');
        if (topBtn) topBtn.onclick = () => { window.scrollTo({top:0,behavior:'smooth'}); setTimeout(close,80); };
        const reloadBtn = document.getElementById('bubbleReloadBtn');
        if (reloadBtn) reloadBtn.onclick = () => { if (confirm('SayfayÄ± yenile?')) location.reload(); };
        const karaokeMenuBtn = document.getElementById('karaokeMenuBtn');
        if (karaokeMenuBtn) karaokeMenuBtn.onclick = () => { this._toggleKaraoke(); setTimeout(close,80); };

        // Buton tÄ±klamada kapat
        document.querySelectorAll('.bubble-btn').forEach(btn => {
            if (!['bubbleThemeBtn','bubbleTheme2Btn','bubbleTopBtn','bubbleReloadBtn'].includes(btn.id))
                btn.addEventListener('click', () => setTimeout(close, 80));
        });
    }
    // ============================================================
    // ğŸ¤ KARAOKE â€” KELIME KELIME VURGULAMA
    // ============================================================

    async _karaokeStart(surahId, ayahId) {
        // Ã–nceki karaoke temizle
        this._karaokeClear();
        this.karaoke = { surahId, ayahId, timings: null, wordIndex: -1 };

        // Kelime span'larÄ±nÄ± al
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
        } catch(e) { /* API yok, tahmini moda geÃ§ */ }

        // 2) Tahmini mod â€” ses sÃ¼resi / kelime sayÄ±sÄ±
        this._karaokeEstimatedMode();
    }

    _karaokeEstimatedMode() {
        // Ses yÃ¼klenince sÃ¼reyi al, kelimelere eÅŸit bÃ¶l
        const audio = this.state.audioPlayer;
        const setupEstimate = () => {
            const dur = audio.duration;
            if (!dur || isNaN(dur)) return;
            const words = this.karaoke.words;
            const count  = words.length;
            // Her kelimeye eÅŸit sÃ¼re
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

        if (idx === this.karaoke.wordIndex) return; // deÄŸiÅŸmedi
        this.karaoke.wordIndex = idx;

        // Ã–nceki vurguyu kaldÄ±r
        words.forEach(w => w.classList.remove('karaoke-active', 'karaoke-done'));

        // GeÃ§miÅŸ kelimeleri "done", aktifi "active" yap
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

    _logBranding() { console.log("%cğŸ•‹ QURAN PORTAL v18.0 %cFIREBASE EDITION", "color: #38bdf8; font-size: 24px; font-weight: bold;", "color: #d4af37; font-size: 14px;"); }

    async _loadSiteBanner() {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'settings', 'announcement'));
            if (!snap.exists()) return;
            const data = snap.data();
            if (!data.active || !data.text) return;
            // Banner zaten var mÄ±?
            if (document.getElementById('siteBanner')) return;
            const banner = document.createElement('div');
            banner.id = 'siteBanner';
            banner.innerHTML = `
                <span id="siteBannerText">ğŸ“¢ ${data.text}</span>
                <button id="siteBannerClose" onclick="document.getElementById('siteBanner').remove()">âœ•</button>
            `;
            document.body.prepend(banner);
        } catch(e) { /* sessiz */ }
    }


    // ============================================================
    // ğŸ“– TEFSÄ°R PANELÄ°
    // ============================================================
    // ============================================================
    // ğŸ“– TEFSÄ°R PANELÄ° â€” LOKAL JSON
    // ============================================================
    // ============================================================
    // ğŸ“œ INLINE TEFSÄ°R â€” Meal satÄ±rÄ±nÄ±n altÄ±nda aÃ§Ä±lÄ±r/kapanÄ±r
    // ============================================================
    _toggleInlineTefsir(row, surahId, ayahId, btn) {
        // AynÄ± satÄ±rda zaten aÃ§Ä±k mÄ±?
        const existing = row.nextElementSibling;
        if (existing && existing.classList.contains('inline-tefsir-box')) {
            existing.style.maxHeight = '0';
            existing.style.opacity = '0';
            setTimeout(() => existing.remove(), 320);
            btn.innerHTML = 'ğŸ“œ Tefsir';
            btn.classList.remove('active');
            return;
        }

        // BaÅŸka aÃ§Ä±k inline tefsir varsa kapat
        document.querySelectorAll('.inline-tefsir-box').forEach(el => {
            el.style.maxHeight = '0'; el.style.opacity = '0';
            setTimeout(() => el.remove(), 280);
        });
        document.querySelectorAll('.meal-tefsir-btn.active').forEach(b => {
            b.innerHTML = 'ğŸ“œ Tefsir'; b.classList.remove('active');
        });

        const meta = this.state.surahMetadata.find(m => m.id === surahId);
        const sureName = meta?.name || `Sure ${surahId}`;
        const lokal = this.tefsirData?.[String(surahId)]?.[String(ayahId)] || this.tefsirData?.[String(surahId)]?.['_default'];

        const box = document.createElement('div');
        box.className = 'inline-tefsir-box';
        box.innerHTML = lokal
            ? `<div class="itb-header">ğŸ“œ ${sureName} â€” ${ayahId}. Ayet Tefsiri</div>
               <div class="itb-text">${lokal}</div>
               <div class="itb-source">ğŸ“š Lokal Tefsir VeritabanÄ±</div>`
            : `<div class="itb-header">ğŸ“œ ${sureName} â€” ${ayahId}. Ayet</div>
               <div class="itb-empty">Bu ayet iÃ§in henÃ¼z tefsir eklenmemiÅŸ.<br><span>tefsir.json â†’ Sure ${surahId}, Ayet ${ayahId}</span></div>`;

        // SatÄ±rdan sonra ekle
        row.insertAdjacentElement('afterend', box);

        // Animasyon â€” iki frame bekle ki DOM render olsun
        requestAnimationFrame(() => requestAnimationFrame(() => {
            box.style.maxHeight = (box.scrollHeight + 80) + 'px';
            box.style.opacity = '1';
        }));

        btn.innerHTML = 'ğŸ“œ Kapat';
        btn.classList.add('active');

        // Meal bÃ¶lÃ¼mÃ¼ne smooth scroll
        setTimeout(() => {
            box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
    }

    _showTefsirForAyah(surahId, ayahId) {
        this._openModal('tefsirOverlay');
        const content = document.getElementById('tefsirContent');
        const titleEl = document.getElementById('tefsirModalTitle');
        if (!content) return;
        const meta = this.state.surahMetadata.find(m => m.id === surahId);
        const sureName = meta?.name || `Sure ${surahId}`;
        if (titleEl) titleEl.textContent = `ğŸ“œ ${sureName} â€” ${ayahId}. Ayet`;
        const lokal = this.tefsirData?.[String(surahId)]?.[String(ayahId)] || this.tefsirData?.[String(surahId)]?.['_default'];
        if (lokal) {
            content.innerHTML = `
                <div style="margin-bottom:14px;padding:10px 14px;background:rgba(212,175,55,0.08);border-radius:10px;border-left:3px solid #d4af37">
                    <div style="color:#d4af37;font-weight:bold;font-size:0.85rem">${sureName} Suresi â€” ${ayahId}. Ayet</div>
                </div>
                <div style="color:#e2e8f0;font-size:0.95rem;line-height:2;text-align:justify">${lokal}</div>
                <div style="color:#475569;font-size:0.7rem;margin-top:16px;padding-top:10px;border-top:1px solid #1e293b">ğŸ“š Lokal Tefsir VeritabanÄ±</div>`;
        } else {
            content.innerHTML = `
                <div style="margin-bottom:14px;padding:10px 14px;background:rgba(212,175,55,0.08);border-radius:10px;border-left:3px solid #d4af37">
                    <div style="color:#d4af37;font-weight:bold;font-size:0.85rem">${sureName} Suresi â€” ${ayahId}. Ayet</div>
                </div>
                <div style="color:#94a3b8;text-align:center;padding:24px;font-size:0.9rem;line-height:1.8">
                    ğŸ“‹ Bu ayet iÃ§in henÃ¼z tefsir eklenmemiÅŸ.<br>
                    <span style="color:#475569;font-size:0.78rem">tefsir.json â†’ Sure ${surahId}, Ayet ${ayahId}</span>
                </div>`;
        }
    }

    async _initTefsirPanel(surahId, ayahId) {
        this._showTefsirForAyah(surahId, ayahId);
    }

    // ============================================================
    // ğŸ—£ï¸ ESMAÃœL HÃœSNA PANELÄ°
    // ============================================================
    _initEsmaPanel() {
        const esma = [
            {ar:"Ø§Ù„Ø±ÙÙ‘Ø­Ù’Ù…ÙÙ†Ù",tr:"Er-Rahman",mean:"Sonsuz merhamet sahibi"},
            {ar:"Ø§Ù„Ø±ÙÙ‘Ø­ÙÙŠÙ…Ù",tr:"Er-Rahim",mean:"Ã‡ok baÄŸÄ±ÅŸlayÄ±cÄ±, merhamet eden"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ„ÙÙƒÙ",tr:"El-Melik",mean:"MÃ¼lkÃ¼n sahibi, hÃ¼kÃ¼mdar"},
            {ar:"Ø§Ù„Ù’Ù‚ÙØ¯ÙÙ‘ÙˆØ³Ù",tr:"El-KuddÃ¼s",mean:"Her tÃ¼rlÃ¼ eksiklikten mÃ¼nezzeh"},
            {ar:"Ø§Ù„Ø³ÙÙ‘Ù„ÙØ§Ù…Ù",tr:"Es-Selam",mean:"Her tÃ¼rlÃ¼ tehlikeden emin kÄ±lan"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ¤Ù’Ù…ÙÙ†Ù",tr:"El-MÃ¼\'min",mean:"GÃ¼ven veren, inanan"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ‡ÙÙŠÙ’Ù…ÙÙ†Ù",tr:"El-MÃ¼heymin",mean:"Her ÅŸeyi gÃ¶zetip koruyan"},
            {ar:"Ø§Ù„Ù’Ø¹ÙØ²ÙÙŠØ²Ù",tr:"El-Aziz",mean:"Ä°zzet sahibi, Ã¼stÃ¼n, gÃ¼Ã§lÃ¼"},
            {ar:"Ø§Ù„Ù’Ø¬ÙØ¨ÙÙ‘Ø§Ø±Ù",tr:"El-Cebbar",mean:"Her ÅŸeye galip gelen"},
            {ar:"Ø§Ù„Ù’Ù…ÙØªÙÙƒÙØ¨ÙÙ‘Ø±Ù",tr:"El-MÃ¼tekebbir",mean:"Kibriya ve azamet sahibi"},
            {ar:"Ø§Ù„Ù’Ø®ÙØ§Ù„ÙÙ‚Ù",tr:"El-Halik",mean:"Her ÅŸeyi yaratan"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØ§Ø±ÙØ¦Ù",tr:"El-Bari\'",mean:"EÅŸsiz ÅŸekilde yaratan"},
            {ar:"Ø§Ù„Ù’Ù…ÙØµÙÙˆÙÙ‘Ø±Ù",tr:"El-Musavvir",mean:"Her ÅŸeye ÅŸekil veren"},
            {ar:"Ø§Ù„Ù’ØºÙÙÙÙ‘Ø§Ø±Ù",tr:"El-Gaffar",mean:"Ã‡ok affeden, maÄŸfiret eden"},
            {ar:"Ø§Ù„Ù’Ù‚ÙÙ‡ÙÙ‘Ø§Ø±Ù",tr:"El-Kahhar",mean:"Her ÅŸeye hakim olan"},
            {ar:"Ø§Ù„Ù’ÙˆÙÙ‡ÙÙ‘Ø§Ø¨Ù",tr:"El-Vehhab",mean:"KarÅŸÄ±lÄ±ksÄ±z veren"},
            {ar:"Ø§Ù„Ø±ÙÙ‘Ø²ÙÙ‘Ø§Ù‚Ù",tr:"Er-Rezzak",mean:"RÄ±zÄ±k veren"},
            {ar:"Ø§Ù„Ù’ÙÙØªÙÙ‘Ø§Ø­Ù",tr:"El-Fettah",mean:"Her ÅŸeyi aÃ§an, mÃ¼ÅŸkÃ¼lleri gideren"},
            {ar:"Ø§Ù„Ù’Ø¹ÙÙ„ÙÙŠÙ…Ù",tr:"El-Alim",mean:"Her ÅŸeyi bilen"},
            {ar:"Ø§Ù„Ù’Ù‚ÙØ§Ø¨ÙØ¶Ù",tr:"El-KabÄ±z",mean:"Daraltan, alan"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØ§Ø³ÙØ·Ù",tr:"El-Basit",mean:"GeniÅŸleten, veren"},
            {ar:"Ø§Ù„Ù’Ø®ÙØ§ÙÙØ¶Ù",tr:"El-HafÄ±d",mean:"AlÃ§altan"},
            {ar:"Ø§Ù„Ø±ÙÙ‘Ø§ÙÙØ¹Ù",tr:"Er-Rafi\'",mean:"YÃ¼kselten"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ¹ÙØ²ÙÙ‘",tr:"El-Muizz",mean:"Ä°zzet veren"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ°ÙÙ„ÙÙ‘",tr:"El-MÃ¼zill",mean:"Zillete dÃ¼ÅŸÃ¼ren"},
            {ar:"Ø§Ù„Ø³ÙÙ‘Ù…ÙÙŠØ¹Ù",tr:"Es-Semi'",mean:"Her ÅŸeyi iÅŸiten"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØµÙÙŠØ±Ù",tr:"El-Basir",mean:"Her ÅŸeyi gÃ¶ren"},
            {ar:"Ø§Ù„Ù’Ø­ÙÙƒÙÙ…Ù",tr:"El-Hakem",mean:"HÃ¼kmeden, hakim"},
            {ar:"Ø§Ù„Ù’Ø¹ÙØ¯Ù’Ù„Ù",tr:"El-Adl",mean:"Mutlak adalet sahibi"},
            {ar:"Ø§Ù„Ù„ÙÙ‘Ø·ÙÙŠÙÙ",tr:"El-Latif",mean:"Her ÅŸeyin inceliÄŸini bilen, lÃ¼tufkÃ¢r"},
            {ar:"Ø§Ù„Ù’Ø®ÙØ¨ÙÙŠØ±Ù",tr:"El-Habir",mean:"Her ÅŸeyden haberdar olan"},
            {ar:"Ø§Ù„Ù’Ø­ÙÙ„ÙÙŠÙ…Ù",tr:"El-Halim",mean:"CezalandÄ±rmada acele etmeyen"},
            {ar:"Ø§Ù„Ù’Ø¹ÙØ¸ÙÙŠÙ…Ù",tr:"El-Azim",mean:"YÃ¼celiÄŸi sonsuz olan"},
            {ar:"Ø§Ù„Ù’ØºÙÙÙÙˆØ±Ù",tr:"El-Gafur",mean:"Ã‡ok affeden"},
            {ar:"Ø§Ù„Ø´ÙÙ‘ÙƒÙÙˆØ±Ù",tr:"EÅŸ-Åekur",mean:"Az amele Ã§ok sevap veren"},
            {ar:"Ø§Ù„Ù’Ø¹ÙÙ„ÙÙŠÙÙ‘",tr:"El-Aliyy",mean:"YÃ¼ce, yÃ¼ksek"},
            {ar:"Ø§Ù„Ù’ÙƒÙØ¨ÙÙŠØ±Ù",tr:"El-Kebir",mean:"BÃ¼yÃ¼klÃ¼kte sonsuz olan"},
            {ar:"Ø§Ù„Ù’Ø­ÙÙÙÙŠØ¸Ù",tr:"El-HafÄ±z",mean:"Her ÅŸeyi koruyan"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ‚ÙÙŠØªÙ",tr:"El-Mukit",mean:"RÄ±zÄ±k ve kuvvet veren"},
            {ar:"Ø§Ù„Ù’Ø­ÙØ³ÙÙŠØ¨Ù",tr:"El-Hasib",mean:"Hesap gÃ¶ren"},
            {ar:"Ø§Ù„Ù’Ø¬ÙÙ„ÙÙŠÙ„Ù",tr:"El-Celil",mean:"Celal sahibi, yÃ¼ce"},
            {ar:"Ø§Ù„Ù’ÙƒÙØ±ÙÙŠÙ…Ù",tr:"El-Kerim",mean:"Ã‡ok cÃ¶mert, ikram eden"},
            {ar:"Ø§Ù„Ø±ÙÙ‘Ù‚ÙÙŠØ¨Ù",tr:"Er-Rakib",mean:"Her ÅŸeyi gÃ¶zetip izleyen"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ¬ÙÙŠØ¨Ù",tr:"El-MÃ¼cib",mean:"DualarÄ± kabul eden"},
            {ar:"Ø§Ù„Ù’ÙˆÙØ§Ø³ÙØ¹Ù",tr:"El-Vasi\'",mean:"Rahmeti her ÅŸeyi kuÅŸatan"},
            {ar:"Ø§Ù„Ù’Ø­ÙÙƒÙÙŠÙ…Ù",tr:"El-Hakim",mean:"Hikmeti sonsuz olan"},
            {ar:"Ø§Ù„Ù’ÙˆÙØ¯ÙÙˆØ¯Ù",tr:"El-Vedud",mean:"Ã‡ok seven, sevilen"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ¬ÙÙŠØ¯Ù",tr:"El-Mecid",mean:"Åan ve ÅŸeref sahibi"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØ§Ø¹ÙØ«Ù",tr:"El-Bais",mean:"Ã–lÃ¼leri dirilten"},
            {ar:"Ø§Ù„Ø´ÙÙ‘Ù‡ÙÙŠØ¯Ù",tr:"EÅŸ-Åehid",mean:"Her ÅŸeye ÅŸahit olan"},
            {ar:"Ø§Ù„Ù’Ø­ÙÙ‚ÙÙ‘",tr:"El-Hakk",mean:"VarlÄ±ÄŸÄ± zorunlu, deÄŸiÅŸmez olan"},
            {ar:"Ø§Ù„Ù’ÙˆÙÙƒÙÙŠÙ„Ù",tr:"El-Vekil",mean:"Her ÅŸeyin yÃ¶neticisi"},
            {ar:"Ø§Ù„Ù’Ù‚ÙÙˆÙÙŠÙÙ‘",tr:"El-Kaviyy",mean:"GÃ¼Ã§ ve kuvvet sahibi"},
            {ar:"Ø§Ù„Ù’Ù…ÙØªÙÙŠÙ†Ù",tr:"El-Metin",mean:"Kuvveti pek saÄŸlam olan"},
            {ar:"Ø§Ù„Ù’ÙˆÙÙ„ÙÙŠÙÙ‘",tr:"El-Veliyy",mean:"Dost, yardÄ±mcÄ±"},
            {ar:"Ø§Ù„Ù’Ø­ÙÙ…ÙÙŠØ¯Ù",tr:"El-Hamid",mean:"Ã–vÃ¼lmeye layÄ±k olan"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ­Ù’ØµÙÙŠ",tr:"El-Muhsi",mean:"Her ÅŸeyi sayan, bilen"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ¨Ù’Ø¯ÙØ¦Ù",tr:"El-MÃ¼bdi\'",mean:"Yoktan var eden"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ¹ÙÙŠØ¯Ù",tr:"El-Muid",mean:"Yeniden yaratan"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ­Ù’ÙŠÙÙŠ",tr:"El-Muhyi",mean:"Hayat veren"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ…ÙÙŠØªÙ",tr:"El-MÃ¼mit",mean:"Ã–lÃ¼mÃ¼ yaratan"},
            {ar:"Ø§Ù„Ù’Ø­ÙÙŠÙÙ‘",tr:"El-Hayy",mean:"Diri, Ã¶lÃ¼msÃ¼z"},
            {ar:"Ø§Ù„Ù’Ù‚ÙÙŠÙÙ‘ÙˆÙ…Ù",tr:"El-Kayyum",mean:"Her ÅŸeyi ayakta tutan"},
            {ar:"Ø§Ù„Ù’ÙˆÙØ§Ø¬ÙØ¯Ù",tr:"El-Vacid",mean:"Her ÅŸeyi bulan"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ§Ø¬ÙØ¯Ù",tr:"El-Macid",mean:"Kerem ve ÅŸan sahibi"},
            {ar:"Ø§Ù„Ù’ÙˆØ§Ø­ÙØ¯Ù",tr:"El-Vahid",mean:"Tek, eÅŸi benzeri olmayan"},
            {ar:"Ø§Ù„ØµÙÙ‘Ù…ÙØ¯Ù",tr:"Es-Samed",mean:"Her ÅŸey ona muhtaÃ§, o kimseye muhtaÃ§ deÄŸil"},
            {ar:"Ø§Ù„Ù’Ù‚ÙØ§Ø¯ÙØ±Ù",tr:"El-Kadir",mean:"GÃ¼cÃ¼ her ÅŸeye yeten"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ‚Ù’ØªÙØ¯ÙØ±Ù",tr:"El-Muktedir",mean:"Ä°stediÄŸi gibi tasarruf eden"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ‚ÙØ¯ÙÙ‘Ù…Ù",tr:"El-Mukaddim",mean:"Ã–ne geÃ§iren"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ¤ÙØ®ÙÙ‘Ø±Ù",tr:"El-Muahhir",mean:"Geriye bÄ±rakan"},
            {ar:"Ø§Ù„Ù’Ø£ÙÙˆÙÙ‘Ù„Ù",tr:"El-Evvel",mean:"Ä°lk, baÅŸlangÄ±cÄ± olmayan"},
            {ar:"Ø§Ù„Ù’Ø¢Ø®ÙØ±Ù",tr:"El-Ahir",mean:"Son, sonu olmayan"},
            {ar:"Ø§Ù„Ø¸ÙÙ‘Ø§Ù‡ÙØ±Ù",tr:"Ez-Zahir",mean:"VarlÄ±ÄŸÄ± aÃ§Ä±k, aÅŸikÃ¢r"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØ§Ø·ÙÙ†Ù",tr:"El-BatÄ±n",mean:"Gizli, her ÅŸeyin iÃ§ yÃ¼zÃ¼nÃ¼ bilen"},
            {ar:"Ø§Ù„Ù’ÙˆÙØ§Ù„ÙÙŠ",tr:"El-Vali",mean:"MÃ¼lkÃ¼n sahibi ve yÃ¶neticisi"},
            {ar:"Ø§Ù„Ù’Ù…ÙØªÙØ¹ÙØ§Ù„ÙÙŠ",tr:"El-MÃ¼teali",mean:"Ã‡ok yÃ¼ce"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØ±ÙÙ‘",tr:"El-Berr",mean:"Ä°yilik kaynaÄŸÄ±"},
            {ar:"Ø§Ù„ØªÙÙ‘ÙˆÙÙ‘Ø§Ø¨Ù",tr:"Et-Tevvab",mean:"TÃ¶vbeleri kabul eden"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ†Ù’ØªÙÙ‚ÙÙ…Ù",tr:"El-MÃ¼ntekim",mean:"SuÃ§lularÄ± cezalandÄ±ran"},
            {ar:"Ø§Ù„Ù’Ø¹ÙÙÙÙˆÙÙ‘",tr:"El-AfÃ¼vv",mean:"Affeden, baÄŸÄ±ÅŸlayan"},
            {ar:"Ø§Ù„Ø±ÙÙ‘Ø¤ÙÙˆÙÙ",tr:"Er-Rauf",mean:"Ã‡ok ÅŸefkatli"},
            {ar:"Ù…ÙØ§Ù„ÙÙƒÙ Ø§Ù„Ù’Ù…ÙÙ„Ù’ÙƒÙ",tr:"MalikÃ¼l-MÃ¼lk",mean:"MÃ¼lkÃ¼n gerÃ§ek sahibi"},
            {ar:"Ø°ÙÙˆ Ø§Ù„Ù’Ø¬ÙÙ„ÙØ§Ù„Ù ÙˆÙØ§Ù„Ù’Ø¥ÙÙƒÙ’Ø±ÙØ§Ù…Ù",tr:"ZÃ¼l-Celali vel-Ä°kram",mean:"Celal ve ikram sahibi"},
            {ar:"Ø§Ù„Ù’Ù…ÙÙ‚Ù’Ø³ÙØ·Ù",tr:"El-Muksit",mean:"Adaletli davranan"},
            {ar:"Ø§Ù„Ù’Ø¬ÙØ§Ù…ÙØ¹Ù",tr:"El-Cami\'",mean:"Her ÅŸeyi toplayan"},
            {ar:"Ø§Ù„Ù’ØºÙÙ†ÙÙŠÙÙ‘",tr:"El-Ganiyy",mean:"Kimseye muhtaÃ§ olmayan"},
            {ar:"Ø§Ù„Ù’Ù…ÙØºÙ’Ù†ÙÙŠ",tr:"El-MuÄŸni",mean:"Ä°stediÄŸine zenginlik veren"},
            {ar:"Ø§Ù„Ù’Ù…ÙØ§Ù†ÙØ¹Ù",tr:"El-Mani\'",mean:"Engelleyen, koruyan"},
            {ar:"Ø§Ù„Ø¶ÙÙ‘Ø§Ø±ÙÙ‘",tr:"Ed-Darr",mean:"Zarar verme gÃ¼cÃ¼nÃ¼ elinde tutan"},
            {ar:"Ø§Ù„Ù†ÙÙ‘Ø§ÙÙØ¹Ù",tr:"En-Nafi\'",mean:"Fayda veren"},
            {ar:"Ø§Ù„Ù†ÙÙ‘ÙˆØ±Ù",tr:"En-Nur",mean:"AydÄ±nlatan, nurlandÄ±ran"},
            {ar:"Ø§Ù„Ù’Ù‡ÙØ§Ø¯ÙÙŠ",tr:"El-Hadi",mean:"Hidayet veren"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØ¯ÙÙŠØ¹Ù",tr:"El-Bedi\'",mean:"EÅŸsiz yaratan"},
            {ar:"Ø§Ù„Ù’Ø¨ÙØ§Ù‚ÙÙŠ",tr:"El-Baki",mean:"VarlÄ±ÄŸÄ± sonsuz olan"},
            {ar:"Ø§Ù„Ù’ÙˆÙØ§Ø±ÙØ«Ù",tr:"El-Varis",mean:"Her ÅŸeyin asÄ±l sahibi"},
            {ar:"Ø§Ù„Ø±ÙÙ‘Ø´ÙÙŠØ¯Ù",tr:"Er-ReÅŸid",mean:"DoÄŸru yola ileten"},
            {ar:"Ø§Ù„ØµÙÙ‘Ø¨ÙÙˆØ±Ù",tr:"Es-Sabur",mean:"Ã‡ok sabÄ±rlÄ± olan"}
        ];
        const content = document.getElementById('esmaContent');
        if (!content || content.dataset.loaded) return;
        content.dataset.loaded = '1';
        let current = 0;
        const cards = esma.map((e,i) => `
            <div class="esma-card" onclick="this.classList.toggle('esma-flipped')" title="TÄ±kla - anlam gÃ¶ster">
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
                TÄ±klayarak anlamÄ±nÄ± gÃ¶r â€¢ 99 isim
            </div>
            <div class="esma-grid">${cards}</div>`;
    }


    // ============================================================
    // ğŸ”‘ API KEY YÃ–NETÄ°MÄ°
    // ============================================================
    // ============================================================
    // ğŸ† LÄ°DERLÄ°K TABLOSU
    // ============================================================
    async _initLeaderboard() {
        const content = document.getElementById('leaderboardContent');
        if (!content) return;
        content.innerHTML = `
        <div style="font-family:sans-serif;direction:ltr">
          <!-- Sekmeler -->
          <div style="display:flex;gap:6px;margin-bottom:14px;background:#0f172a;border-radius:10px;padding:4px">
            <button id="lbTabGame"  onclick="App._lbShowTab('game')"  style="flex:1;padding:7px;border:none;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:bold;background:linear-gradient(135deg,#d4af37,#f59e0b);color:#000;transition:all 0.2s">ğŸ® Oyun PuanÄ±</button>
            <button id="lbTabRead"  onclick="App._lbShowTab('read')"  style="flex:1;padding:7px;border:none;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:bold;background:transparent;color:#64748b;transition:all 0.2s">ğŸ“– Okuma</button>
            <button id="lbTabEsma"  onclick="App._lbShowTab('esma')"  style="flex:1;padding:7px;border:none;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:bold;background:transparent;color:#64748b;transition:all 0.2s">âœ¨ EsmaÃ¼l HÃ¼sna</button>
          </div>
          <!-- YakÄ±nda uyarÄ±sÄ± -->
          <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1.5px solid #d4af3740;border-radius:12px;padding:14px 16px;margin-bottom:14px;text-align:center">
            <div style="font-size:1.4rem;margin-bottom:6px">ğŸš§</div>
            <div style="color:#d4af37;font-weight:bold;font-size:0.92rem;margin-bottom:4px">Liderlik Tablosu YakÄ±nda!</div>
            <div style="color:#94a3b8;font-size:0.8rem;line-height:1.5">Oyun oyna, Kur'an oku, EsmaÃ¼l HÃ¼sna'yÄ± tamamla â€”<br>puanlarÄ±n kaydediliyor. SÄ±ralamanÄ± Ã§ok yakÄ±nda burada gÃ¶receksin! ğŸ†</div>
          </div>
          <div id="lbBody"><div style="color:#94a3b8;text-align:center;padding:20px">â³ YÃ¼kleniyor...</div></div>
        </div>`;
        this._lbShowTab('game');
    }

    async _lbShowTab(tab) {
        // Tab aktif stili
        ['game','read','esma'].forEach(t => {
            const btn = document.getElementById('lbTab' + t.charAt(0).toUpperCase() + t.slice(1));
            if (!btn) return;
            if (t === tab) {
                btn.style.background = 'linear-gradient(135deg,#d4af37,#f59e0b)';
                btn.style.color = '#000';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = '#64748b';
            }
        });
        const body = document.getElementById('lbBody');
        if (!body) return;
        body.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:20px">â³ YÃ¼kleniyor...</div>';

        if (!window.FirebaseAuth) {
            body.innerHTML = '<div style="color:#f87171;text-align:center;padding:20px">Firebase baÄŸlantÄ±sÄ± yok.</div>';
            return;
        }
        const { db, collection, getDocs, query, orderBy, limit } = window.FirebaseAuth;
        const medals = ['ğŸ¥‡','ğŸ¥ˆ','ğŸ¥‰'];

        try {
            if (tab === 'game') {
                // Oyun puanÄ± liderlik tablosu
                const q = query(collection(db, 'gameScores'), orderBy('totalPoints','desc'), limit(20));
                const snap = await getDocs(q);
                if (snap.empty) { body.innerHTML = this._lbEmpty('HenÃ¼z oyun oynanmadÄ±. Ä°lk sÄ±rada sen ol! ğŸ®'); return; }
                const myUid = this.state.currentUser?.uid;
                let rows = '', rank = 1;
                snap.forEach(d => {
                    const data = d.data();
                    const name = data.displayName || 'Anonim';
                    const pts  = (data.totalPoints || 0).toLocaleString();
                    const gp   = data.gamesPlayed || 0;
                    const isMe = d.id === myUid;
                    const medal = medals[rank-1] || rank+'.';
                    const bg   = rank===1 ? 'rgba(212,175,55,0.12)' : rank===2 ? 'rgba(148,163,184,0.08)' : rank===3 ? 'rgba(180,120,60,0.08)' : 'transparent';
                    rows += `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:${bg};border:1px solid ${isMe?'#d4af37':'#1e293b'};margin-bottom:6px;transition:0.2s">
                        <span style="font-size:1.15rem;min-width:28px;text-align:center">${medal}</span>
                        <span style="flex:1;color:${isMe?'#d4af37':'#e2e8f0'};font-weight:${isMe?'bold':'normal'};font-size:0.9rem">${name}${isMe?' ğŸ‘¤':''}</span>
                        <div style="text-align:right">
                          <div style="color:#d4af37;font-weight:bold;font-size:0.95rem">${pts} puan</div>
                          <div style="color:#64748b;font-size:0.7rem">${gp} oyun</div>
                        </div>
                    </div>`;
                    rank++;
                });
                // Benim sÄ±ram yoksa en alta ekle
                let myRankHtml = '';
                if (myUid) {
                    const myDoc = await window.FirebaseAuth.getDoc(window.FirebaseAuth.doc(db,'gameScores',myUid));
                    if (myDoc.exists() && !rows.includes('ğŸ‘¤')) {
                        const d = myDoc.data();
                        myRankHtml = `<div style="margin-top:8px;padding:10px 12px;border-radius:10px;border:1px solid #d4af37;background:rgba(212,175,55,0.08)">
                            <span style="color:#d4af37;font-size:0.82rem">Senin puanÄ±n: <strong>${(d.totalPoints||0).toLocaleString()}</strong> â€” ${d.gamesPlayed||0} oyun</span>
                        </div>`;
                    }
                }
                body.innerHTML = `<div>${rows}</div>${myRankHtml}`;

            } else if (tab === 'read') {
                const q = query(collection(db, 'stats'), orderBy('ayahCount','desc'), limit(20));
                const snap = await getDocs(q);
                if (snap.empty) { body.innerHTML = this._lbEmpty('HenÃ¼z okuma kaydÄ± yok.'); return; }
                let rows = '', rank = 1;
                snap.forEach(d => {
                    const data = d.data();
                    const name  = data.displayName || data.email?.split('@')[0] || 'Anonim';
                    const ayah  = (data.ayahCount||0).toLocaleString();
                    const sure  = (data.surahsOpened||[]).length;
                    const medal = medals[rank-1] || rank+'.';
                    const bg    = rank===1?'rgba(212,175,55,0.12)':rank===2?'rgba(148,163,184,0.08)':rank===3?'rgba(180,120,60,0.08)':'transparent';
                    rows += `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:${bg};border:1px solid #1e293b;margin-bottom:6px">
                        <span style="font-size:1.15rem;min-width:28px;text-align:center">${medal}</span>
                        <span style="flex:1;color:#e2e8f0;font-size:0.88rem">${name}</span>
                        <div style="text-align:right">
                          <div style="color:#38bdf8;font-weight:bold;font-size:0.92rem">${ayah} ayet</div>
                          <div style="color:#64748b;font-size:0.7rem">${sure}/114 sure</div>
                        </div>
                    </div>`;
                    rank++;
                });
                body.innerHTML = rows;

            } else if (tab === 'esma') {
                const q = query(collection(db, 'esmaStats'), orderBy('esmaCount','desc'), limit(20));
                const snap = await getDocs(q);
                if (snap.empty) { body.innerHTML = this._lbEmpty('HenÃ¼z EsmaÃ¼l HÃ¼sna kaydÄ± yok.'); return; }
                let rows = '', rank = 1;
                snap.forEach(d => {
                    const data = d.data();
                    const name  = data.displayName || 'Anonim';
                    const cnt   = data.esmaCount || 0;
                    const pct   = Math.min(100, Math.round((cnt/99)*100));
                    const medal = medals[rank-1] || rank+'.';
                    const bg    = rank===1?'rgba(212,175,55,0.12)':rank===2?'rgba(148,163,184,0.08)':rank===3?'rgba(180,120,60,0.08)':'transparent';
                    rows += `<div style="padding:10px 12px;border-radius:10px;background:${bg};border:1px solid #1e293b;margin-bottom:6px">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px">
                            <span style="font-size:1.15rem;min-width:28px;text-align:center">${medal}</span>
                            <span style="flex:1;color:#e2e8f0;font-size:0.88rem">${name}</span>
                            <span style="color:#d4af37;font-weight:bold">${cnt}/99</span>
                        </div>
                        <div style="margin-left:38px;background:#1e293b;border-radius:4px;height:5px;overflow:hidden">
                            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#d4af37,#f59e0b);transition:width 0.5s"></div>
                        </div>
                    </div>`;
                    rank++;
                });
                body.innerHTML = rows;
            }
        } catch(e) {
            body.innerHTML = `<div style="color:#f87171;text-align:center;padding:14px;font-size:0.85rem">Veri yÃ¼klenemedi: ${e.message}</div>`;
        }
    }

    _lbEmpty(msg) {
        return `<div style="text-align:center;padding:24px;color:#64748b;font-size:0.88rem">${msg}</div>`;
    }

    // ============================================================
    // ğŸ‘¥ HATÄ°M GRUBU
    // ============================================================
    async _initHatimGroup() {
        const content = document.getElementById('hatimContent');
        if (!content) return;

        content.innerHTML = `
        <div style="font-family:sans-serif;direction:ltr">
          <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1.5px solid #d4af3740;border-radius:12px;padding:20px;margin-bottom:14px;text-align:center">
            <div style="font-size:1.8rem;margin-bottom:8px">ğŸš§</div>
            <div style="color:#d4af37;font-weight:bold;font-size:0.95rem;margin-bottom:6px">Hatim Grubu YakÄ±nda!</div>
            <div style="color:#94a3b8;font-size:0.8rem;line-height:1.6">
              ArkadaÅŸlarÄ±nla grup kurarak birlikte Kur'an hatmi yapabileceÄŸin bu Ã¶zellik Ã§ok yakÄ±nda geliyor.<br><br>
              <span style="color:#64748b;font-size:0.75rem">Grup oluÅŸtur Â· CÃ¼z paylaÅŸ Â· Ä°lerlemeyi takip et Â· Birlikte tamamla ğŸ“–</span>
            </div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;text-align:center">
            <div style="color:#64748b;font-size:0.78rem">âœ¨ GeliÅŸtirme aÅŸamasÄ±nda â€” beklemede kal</div>
          </div>
        </div>`;
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
        this._showToast('âœ… Hatim grubu oluÅŸturuldu!', '#6ee7b7');
        this._initHatimGroup();
    }

    async _joinHatimGroup(groupId) {
        if (!window.FirebaseAuth) return;
        const { db, doc, updateDoc, arrayUnion } = window.FirebaseAuth;
        await updateDoc(doc(db, 'hatimGroups', groupId), {
            members: arrayUnion(this.state.currentUser.uid)
        });
        this._showToast('âœ… Gruba katÄ±ldÄ±nÄ±z!', '#6ee7b7');
    }

    // ============================================================
    // ğŸ”” HATIRLATICI BÄ°LDÄ°RÄ°MÄ°
    // ============================================================
    async _initNotifications() {
        const content = document.getElementById('notifContent');
        if (!content) return;

        const saved = JSON.parse(localStorage.getItem('qp_notif') || '{"enabled":false,"time":"07:00","msg":"GÃ¼nlÃ¼k Kuran okuma zamani! ğŸ“–"}');
        const prayerCfg = JSON.parse(localStorage.getItem('qp_prayer_notif') || '{"enabled":false,"city":""}');
        const savedPrayerCity = localStorage.getItem('qp_prayer_city') || prayerCfg.city || '';

        const notifSupported = typeof Notification !== 'undefined';
        const permColor = !notifSupported ? '#64748b' : Notification.permission === 'granted' ? '#6ee7b7' : Notification.permission === 'denied' ? '#f87171' : '#fbbf24';
        const permText  = !notifSupported ? 'âš ï¸ Desteklenmiyor' : Notification.permission === 'granted' ? 'âœ… Ä°zin Verildi' : Notification.permission === 'denied' ? 'âŒ Reddedildi' : 'âš ï¸ Ä°zin Gerekli';

        content.innerHTML = `
        <div style="font-family:sans-serif;direction:ltr;display:flex;flex-direction:column;gap:16px">

          <!-- Ä°zin satÄ±rÄ± -->
          <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
            <span style="color:#94a3b8;font-size:0.82rem">Bildirim Ä°zni:</span>
            <span id="notifPermSpan" style="color:${permColor};font-size:0.82rem;font-weight:bold">${permText}</span>
            <button onclick="App._requestNotifPermission()" style="background:#0f2233;color:#38bdf8;border:1.5px solid #38bdf860;border-radius:8px;padding:4px 12px;cursor:pointer;font-size:0.78rem">Ä°zin Ver</button>
          </div>

          <!-- Namaz Vakti Bildirimi -->
          <div style="background:#1e293b;border:1.5px solid #334155;border-radius:12px;padding:14px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <span style="font-size:1.1rem">ğŸ•Œ</span>
              <span style="color:#e2e8f0;font-size:0.9rem;font-weight:bold;flex:1">Namaz Vakti Bildirimi</span>
              <input type="checkbox" id="prayerNotifEnabled" ${prayerCfg.enabled?'checked':''} style="width:18px;height:18px;cursor:pointer"/>
              <span id="prayerNotifStatus" style="color:${prayerCfg.enabled?'#6ee7b7':'#64748b'};font-size:0.8rem">${prayerCfg.enabled?'AÃ§Ä±k':'KapalÄ±'}</span>
            </div>

            <!-- Åehir gÃ¶rÃ¼ntÃ¼ modu -->
            <div id="pncViewRow" style="display:${savedPrayerCity?'flex':'none'};align-items:center;gap:8px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:6px 10px;margin-bottom:8px">
              <span>ğŸ“</span>
              <span id="pncCityDisplay" style="flex:1;color:#e2e8f0;font-size:0.9rem">${savedPrayerCity}</span>
              <button type="button" id="pncEditBtn" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1rem">âœï¸</button>
            </div>

            <!-- Åehir dÃ¼zenleme modu -->
            <div id="pncEditRow" style="display:${savedPrayerCity?'none':'flex'};gap:8px;margin-bottom:8px;flex-wrap:wrap">
              <input type="text" id="pncCityInput" placeholder="Åehir (Ã¶rn: Mersin)" value="${savedPrayerCity}" style="flex:1;min-width:120px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:6px 10px;font-size:0.85rem"/>
              <button type="button" id="pncLocBtn" style="background:#0f2233;color:#38bdf8;border:1.5px solid #38bdf860;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:0.82rem">ğŸ“ Konum</button>
            </div>
            <div id="pncLocStatus" style="font-size:0.75rem;color:#94a3b8;min-height:14px;margin-bottom:8px"></div>

            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" onclick="App._savePrayerNotif()" style="background:#d4af37;color:#000;border:none;border-radius:8px;padding:7px 16px;cursor:pointer;font-weight:bold;font-size:0.82rem">ğŸ’¾ Kaydet</button>
              <button type="button" onclick="App._testEzanSound()" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:7px 12px;cursor:pointer;font-size:0.82rem">ğŸ”Š Ezan Test</button>
            </div>

            <!-- Namaz Vakitleri Mini Tablo -->
            <div id="notifPrayerTimes" style="margin-top:14px"></div>
          </div>

          <!-- GÃ¼nlÃ¼k Okuma Bildirimi -->
          <div style="background:#1e293b;border:1.5px solid #334155;border-radius:12px;padding:14px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <span style="font-size:1.1rem">ğŸ“–</span>
              <span style="color:#e2e8f0;font-size:0.9rem;font-weight:bold;flex:1">GÃ¼nlÃ¼k Okuma HatÄ±rlatÄ±cÄ±</span>
              <input type="checkbox" id="notifEnabled" ${saved.enabled?'checked':''} style="width:18px;height:18px;cursor:pointer"/>
              <span id="notifStatus" style="color:${saved.enabled?'#6ee7b7':'#64748b'};font-size:0.8rem">${saved.enabled?'AÃ§Ä±k':'KapalÄ±'}</span>
            </div>
            <div style="margin-bottom:10px">
              <label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px">Saat:</label>
              <input type="time" id="notifTime" value="${saved.time}" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:8px;font-size:0.9rem"/>
            </div>
            <div style="margin-bottom:12px">
              <label style="color:#94a3b8;font-size:0.8rem;display:block;margin-bottom:4px">Mesaj:</label>
              <input type="text" id="notifMsg" value="${saved.msg}" style="width:100%;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:8px;font-size:0.85rem;box-sizing:border-box"/>
            </div>
            <div style="display:flex;gap:8px">
              <button type="button" onclick="App._saveNotification()" style="background:#d4af37;color:#000;border:none;border-radius:8px;padding:7px 16px;cursor:pointer;font-weight:bold;font-size:0.82rem">ğŸ’¾ Kaydet</button>
              <button type="button" onclick="App._testNotification()" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:7px 12px;cursor:pointer;font-size:0.82rem">ğŸ”” Test</button>
            </div>
          </div>

        </div>`;

        // Checkbox listeners
        document.getElementById('notifEnabled').onchange = function() {
            document.getElementById('notifStatus').textContent = this.checked ? 'AÃ§Ä±k' : 'KapalÄ±';
            document.getElementById('notifStatus').style.color = this.checked ? '#6ee7b7' : '#64748b';
            // AnÄ±nda kaydet
            const existing = JSON.parse(localStorage.getItem('qp_notif') || '{}');
            existing.enabled = this.checked;
            localStorage.setItem('qp_notif', JSON.stringify(existing));
        };
        document.getElementById('prayerNotifEnabled').onchange = function() {
            document.getElementById('prayerNotifStatus').textContent = this.checked ? 'AÃ§Ä±k' : 'KapalÄ±';
            document.getElementById('prayerNotifStatus').style.color = this.checked ? '#6ee7b7' : '#64748b';
            // AnÄ±nda kaydet
            const existing = JSON.parse(localStorage.getItem('qp_prayer_notif') || '{}');
            existing.enabled = this.checked;
            localStorage.setItem('qp_prayer_notif', JSON.stringify(existing));
        };

        // Åehir edit toggle
        const pncEditBtn = document.getElementById('pncEditBtn');
        if (pncEditBtn) pncEditBtn.onclick = () => {
            document.getElementById('pncViewRow').style.display = 'none';
            document.getElementById('pncEditRow').style.display = 'flex';
        };

        // Konum butonu
        const pncLocBtn = document.getElementById('pncLocBtn');
        if (pncLocBtn) pncLocBtn.onclick = () => this._notifCityLocate();

        this._scheduleNotification(saved);
        if (prayerCfg.enabled && savedPrayerCity) this._schedulePrayerNotifications(prayerCfg);
        if (savedPrayerCity) this._loadNotifPrayerTimes(savedPrayerCity);
    }


    async _loadNotifPrayerTimes(city) {
        const el = document.getElementById('notifPrayerTimes');
        if (!el) return;
        el.innerHTML = '<div style="color:#64748b;font-size:0.78rem;text-align:center;padding:8px">â³ Vakitler yÃ¼kleniyor...</div>';
        try {
            const now = new Date();
            const dateStr = now.toDateString();
            const cacheKey = `qp_pt_${city}_${dateStr}`;
            let times = JSON.parse(localStorage.getItem(cacheKey) || 'null');
            if (!times) {
                const r = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`);
                const j = await r.json();
                if (j.code !== 200) { el.innerHTML = `<div style="color:#f87171;font-size:0.78rem;text-align:center">${city} bulunamadÄ±</div>`; return; }
                times = j.data.timings;
                localStorage.setItem(cacheKey, JSON.stringify(times));
            }
            const nowMin = now.getHours()*60 + now.getMinutes();
            const prayers = [
                { name:'Ä°msak',  time:times.Imsak,   icon:'ğŸŒ™' },
                { name:'Sabah',  time:times.Fajr,    icon:'ğŸŒ…' },
                { name:'GÃ¼neÅŸ',  time:times.Sunrise, icon:'â˜€ï¸' },
                { name:'Ã–ÄŸle',   time:times.Dhuhr,   icon:'ğŸŒ' },
                { name:'Ä°kindi', time:times.Asr,     icon:'ğŸŒ‡' },
                { name:'AkÅŸam',  time:times.Maghrib, icon:'ğŸŒ†' },
                { name:'YatsÄ±',  time:times.Isha,    icon:'ğŸŒƒ' },
            ];
            const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
            let nextIdx = prayers.findIndex(p => toMin(p.time) > nowMin);
            const activeIdx = nextIdx === -1 ? prayers.length-1 : nextIdx-1;
            const rows = prayers.map((p,i) => {
                const isActive = i === activeIdx;
                const isPast = i < activeIdx;
                const bg = isActive ? 'rgba(212,175,55,0.15)' : 'transparent';
                const border = isActive ? '1px solid #d4af3760' : '1px solid transparent';
                const color = isActive ? '#d4af37' : isPast ? '#475569' : '#cbd5e1';
                return `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;background:${bg};border:${border}">
<span style="font-size:0.85rem;min-width:20px">${p.icon}</span>
<span style="flex:1;color:${color};font-size:0.82rem">${p.name}</span>
<span style="color:${isActive?'#d4af37':color};font-size:0.82rem;font-weight:${isActive?'bold':'normal'}">${p.time}${isActive?' â†':''}</span>
</div>`;
            }).join('');
            el.innerHTML = `<div style="margin-top:4px;border:1px solid #1e293b;border-radius:10px;padding:6px;background:#0f172a">
<div style="color:#64748b;font-size:0.72rem;text-align:center;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #1e293b">ğŸ“ ${city} â€” BugÃ¼n</div>
${rows}
</div>`;
        } catch(e) { el.innerHTML = '<div style="color:#f87171;font-size:0.78rem;text-align:center">Vakitler yÃ¼klenemedi</div>'; }
    }

    _notifCityLocate() {
        const statusEl = document.getElementById('pncLocStatus');
        const inp = document.getElementById('pncCityInput');
        if (!navigator.geolocation) { if(statusEl) statusEl.textContent='âŒ Konum desteklenmiyor'; return; }

        // Daha Ã¶nce kaydedilmiÅŸ ÅŸehir varsa tekrar izin isteme
        const savedCity = localStorage.getItem('qp_geo_city');
        if (savedCity) {
            if (inp) inp.value = savedCity;
            if (document.getElementById('pncCityDisplay')) document.getElementById('pncCityDisplay').textContent = savedCity;
            if (document.getElementById('pncViewRow')) document.getElementById('pncViewRow').style.display = 'flex';
            if (document.getElementById('pncEditRow')) document.getElementById('pncEditRow').style.display = 'none';
            if (statusEl) { statusEl.textContent = `âœ… ${savedCity}`; setTimeout(() => { if(statusEl) statusEl.textContent=''; }, 2000); }
            this._loadNotifPrayerTimes(savedCity);
            return;
        }

        if (statusEl) statusEl.textContent = 'ğŸ“ Konum alÄ±nÄ±yor...';
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=tr`);
                    const data = await res.json();
                    const city = data.address?.city || data.address?.town || data.address?.county || '';
                    if (!city) { if(statusEl) statusEl.textContent='âŒ Åehir bulunamadÄ±'; return; }
                    localStorage.setItem('qp_geo_city', city);
                    if (inp) inp.value = city;
                    document.getElementById('pncCityDisplay').textContent = city;
                    document.getElementById('pncViewRow').style.display = 'flex';
                    document.getElementById('pncEditRow').style.display = 'none';
                    if (statusEl) statusEl.textContent = `âœ… ${city}`;
                    setTimeout(() => { if(statusEl) statusEl.textContent=''; }, 3000);
                    this._loadNotifPrayerTimes(city);
                } catch(e) { if(statusEl) statusEl.textContent='âŒ Konum Ã§Ã¶zÃ¼mlenemedi'; }
            },
            () => { if(statusEl) statusEl.textContent='âŒ Konum izni reddedildi'; },
            { timeout: 10000 }
        );
    }

    _savePrayerNotif() {
        const city = (document.getElementById('pncCityInput')?.value || document.getElementById('pncCityDisplay')?.textContent || '').trim();
        const enabled = document.getElementById('prayerNotifEnabled')?.checked || false;
        if (!city) { this._showToast('âš ï¸ Åehir giriniz', '#fbbf24'); return; }
        const cfg = { enabled, city };
        localStorage.setItem('qp_prayer_notif', JSON.stringify(cfg));
        localStorage.setItem('qp_prayer_city', city);
        document.getElementById('pncCityDisplay').textContent = city;
        document.getElementById('pncViewRow').style.display = 'flex';
        document.getElementById('pncEditRow').style.display = 'none';
        this._showToast('âœ… Namaz vakti bildirimi kaydedildi', '#6ee7b7');
        if (enabled) this._schedulePrayerNotifications(cfg);
        else if (this._prayerNotifInterval) { clearInterval(this._prayerNotifInterval); this._prayerNotifInterval = null; }
        this._loadNotifPrayerTimes(city);
    }

    _schedulePrayerNotifications(cfg) {
        if (this._prayerNotifInterval) clearInterval(this._prayerNotifInterval);
        if (!cfg.enabled || !cfg.city) return;
        const check = async () => {
            const now = new Date();
            const dateStr = now.toDateString();
            const cacheKey = `qp_pt_${cfg.city}_${dateStr}`;
            let times = JSON.parse(localStorage.getItem(cacheKey) || 'null');
            if (!times) {
                try {
                    const r = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(cfg.city)}&country=TR&method=13`);
                    const j = await r.json();
                    if (j.code === 200) {
                        times = j.data.timings;
                        localStorage.setItem(cacheKey, JSON.stringify(times));
                    }
                } catch(e) { return; }
            }
            if (!times) return;
            const nowH = now.getHours(), nowM = now.getMinutes();
            const prayers = [
                { name:'Ä°msak',  time: times.Imsak   },
                { name:'Sabah',  time: times.Fajr    },
                { name:'Ã–ÄŸle',   time: times.Dhuhr   },
                { name:'Ä°kindi', time: times.Asr     },
                { name:'AkÅŸam',  time: times.Maghrib },
                { name:'YatsÄ±',  time: times.Isha    },
            ];
            for (const p of prayers) {
                const [ph, pm] = p.time.split(':').map(Number);
                if (ph === nowH && pm === nowM) {
                    const firedKey = `qp_pt_fired_${p.name}_${dateStr}`;
                    if (localStorage.getItem(firedKey)) continue;
                    localStorage.setItem(firedKey, '1');
                    this._playEzanSound();
                    if (Notification.permission === 'granted') {
                        new Notification(`ğŸ•Œ ${p.name} Vakti`, { body: `${cfg.city} iÃ§in ${p.name} vakti girdi.`, icon: '/favicon.ico' });
                    }
                    this._showToast(`ğŸ•Œ ${p.name} Vakti â€” ${cfg.city}`, '#d4af37');
                }
            }
        };
        this._prayerNotifInterval = setInterval(check, 15000);
        check();
    }

    _playEzanSound() {
        const audio = new Audio('audio/ezan.mp3');
        audio.play().catch(() => this._playEzanSoundSynthetic());
    }

    _playEzanSoundSynthetic() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [262,294,330,349,392,440,392,349,330,294,262,220,247,262,294,330,349,294,262,247];
            let time = ctx.currentTime;
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const vibrato = ctx.createOscillator();
                const vibratoGain = ctx.createGain();
                vibrato.frequency.value = 5.5;
                vibratoGain.gain.value = 6;
                vibrato.connect(vibratoGain);
                vibratoGain.connect(osc.frequency);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.4, time + 0.08);
                gain.gain.linearRampToValueAtTime(0, time + 0.52);
                osc.start(time);
                vibrato.start(time);
                osc.stop(time + 0.55);
                vibrato.stop(time + 0.55);
                time += 0.56;
            });
        } catch(e) {}
    }

    _testEzanSound() {
        this._playEzanSound();
        this._showToast('ğŸ”Š Ezan sesi test ediliyor...', '#d4af37');
    }

    _requestNotifPermission() {
        if (typeof Notification === 'undefined') {
            this._showToast('âš ï¸ Bu tarayÄ±cÄ± bildirimleri desteklemiyor', '#fbbf24');
            return;
        }
        if (Notification.permission === 'denied') {
            this._showToast('âŒ TarayÄ±cÄ± ayarlarÄ±ndan izin verin', '#f87171');
            return;
        }
        if (Notification.permission === 'granted') {
            this._showToast('âœ… Bildirim izni zaten verilmiÅŸ', '#6ee7b7');
            return;
        }
        Notification.requestPermission().then(p => {
            localStorage.setItem('qp_notif_perm_asked', '1');
            const el = document.getElementById('notifPermSpan');
            if (p === 'granted') {
                if (el) { el.textContent = 'âœ… Ä°zin Verildi'; el.style.color = '#6ee7b7'; }
                this._showToast('âœ… Bildirim izni verildi', '#6ee7b7');
            } else {
                if (el) { el.textContent = 'âŒ Reddedildi'; el.style.color = '#f87171'; }
                this._showToast('âŒ Bildirim izni reddedildi', '#f87171');
            }
        });
    }

    _saveNotification() {
        const data = {
            enabled: document.getElementById('notifEnabled')?.checked || false,
            time: document.getElementById('notifTime')?.value || '07:00',
            msg: document.getElementById('notifMsg')?.value || 'GÃ¼nlÃ¼k Kur\'an okuma zamanÄ±! ğŸ“–'
        };
        localStorage.setItem('qp_notif', JSON.stringify(data));
        this._scheduleNotification(data);
        this._showToast('âœ… Bildirim ayarlarÄ± kaydedildi', '#6ee7b7');
    }

    _testNotification() {
        if (typeof Notification === 'undefined') { this._showToast('âš ï¸ Bu tarayÄ±cÄ± bildirimleri desteklemiyor', '#fbbf24'); return; }
        if (Notification.permission === 'granted') {
            new Notification('ğŸ“– Kur\'an-Ä± Kerim', { body: 'Test bildirimi baÅŸarÄ±lÄ±!', icon: '/favicon.ico' });
        } else if (Notification.permission === 'denied') {
            this._showToast('âŒ Bildirim izni reddedildi. TarayÄ±cÄ± ayarlarÄ±ndan aÃ§Ä±n.', '#f87171');
        } else {
            this._showToast('âš ï¸ Ã–nce bildirim izni verin', '#fbbf24');
        }
    }

    _scheduleNotification(data) {
        if (this._notifInterval) clearInterval(this._notifInterval);
        if (!data.enabled || typeof Notification === 'undefined') return;
        const check = () => {
            const now = new Date();
            const [h,m] = data.time.split(':').map(Number);
            if (now.getHours()===h && now.getMinutes()===m) {
                const last = localStorage.getItem('qp_notif_last');
                const today = now.toDateString();
                if (last !== today) {
                    localStorage.setItem('qp_notif_last', today);
                    if (Notification.permission === 'granted') {
                        new Notification('ğŸ“– Kur\'an-Ä± Kerim', { body: data.msg, icon: '/favicon.ico' });
                    }
                    // Ä°zin yoksa sessizce geÃ§ â€” kullanÄ±cÄ± ayarlardan manuel verebilir
                }
            }
        };
        this._notifInterval = setInterval(check, 60000);
        check();
    }

    // ============================================================
    // ğŸ“š OKUMA GEÃ‡MÄ°ÅÄ° / KALDIÄIN YERDEN DEVAM
    // ============================================================
    _saveReadingPosition(surahId, ayahId) {
        const pos = { surahId, ayahId, time: Date.now() };
        localStorage.setItem('qp_lastpos', JSON.stringify(pos));
        // GeÃ§miÅŸe de ekle
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
        bar.innerHTML = `ğŸ“– KaldÄ±ÄŸÄ±n yer: <strong style="color:#d4af37">${surahName} - ${pos.ayahId}. ayet</strong> <span style="color:#64748b">(${timeStr})</span>
            <button onclick="App._resumeReading()" style="background:#d4af37;color:#000;border:none;border-radius:8px;padding:4px 12px;cursor:pointer;font-weight:bold;font-size:0.8rem">â–¶ Devam Et</button>
            <button onclick="document.getElementById('resumeBar').remove()" style="background:transparent;border:none;color:#64748b;cursor:pointer;font-size:1rem">âœ•</button>`;
        document.body.appendChild(bar);
        setTimeout(() => bar?.remove(), 15000);
    }

    async _resumeReading() {
        const pos = JSON.parse(localStorage.getItem('qp_lastpos') || 'null');
        if (!pos) return;
        document.getElementById('resumeBar')?.remove();
        const meta = this.state.surahMetadata.find(m=>m.id===pos.surahId);
        if (meta) {
            if (this.dom.surahInp) this.dom.surahInp.value = meta.name;
            const sel = document.getElementById('surahSelect');
            if (sel) sel.value = pos.surahId;
            await this.loadSurah(pos.surahId);
            setTimeout(() => {
                this.playAyah(pos.surahId, pos.ayahId);
                setTimeout(() => {
                    const el = document.getElementById(`ayah-unit-v15-${pos.ayahId}`);
                    if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
                }, 400);
            }, 700);
        }
    }

    // ============================================================
    // ğŸŒ™ OTOMATÄ°K TEMA (GÃœNE GÃ–RE)
    // ============================================================
    _initAutoTheme() {
        // KullanÄ±cÄ± daha Ã¶nce manuel tema seÃ§tiyse dokunma
        const manual = localStorage.getItem('portal_theme');
        if (manual) return;
        // HiÃ§ seÃ§ilmemiÅŸse gÃ¼n saatine gÃ¶re uygula
        const h = new Date().getHours();
        const isDay = h >= 6 && h < 19;
        document.body.classList.toggle('light', isDay);
        this.state.theme = isDay ? 'light' : 'dark';
        // Her saat baÅŸÄ± kontrol et
        setInterval(() => {
            if (localStorage.getItem('portal_theme')) return;
            const hr = new Date().getHours();
            const day = hr >= 6 && hr < 19;
            document.body.classList.toggle('light', day);
        }, 3600000);
    }

    // ============================================================
    // ğŸŠ KUTLAMA ANÄ°MASYONU
    // ============================================================
    _showCelebration(msg = 'ğŸ‰ Tebrikler!') {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;pointer-events:none;';
        el.innerHTML = `
            <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:2px solid #d4af37;border-radius:24px;padding:32px 48px;text-align:center;animation:celebPop 0.4s cubic-bezier(.175,.885,.32,1.275);box-shadow:0 20px 60px rgba(0,0,0,0.8)">
                <div style="font-size:3rem;margin-bottom:8px">ğŸ†</div>
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
        const div = this._createElement('div', 'bismillah-v15', 'Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙÙ‘Ù‡Ù Ø§Ù„Ø±ÙÙ‘Ø­Ù’Ù…ÙÙ†Ù Ø§Ù„Ø±ÙÙ‘Ø­ÙÙŠÙ…Ù');
        const isDark = !document.body.classList.contains('light');
        const baseColor = isDark ? '#d4af37' : '#92400e';
        div.style.cssText = `color:${baseColor};opacity:1;font-size:3.2rem;text-align:center;margin:30px 0 50px 0;font-family:"Amiri Quran",serif;cursor:pointer;transition:color 0.3s ease;direction:rtl;display:block;width:100%;`;
        div.onclick = () => this.playAyah(surahId, 1);
        div.onmouseenter = (e) => {
            div.style.color = '#f59e0b';
            // Tooltip gÃ¶ster
            const tooltip = this.dom.tooltip;
            if (tooltip) {
                tooltip.innerHTML = '';
                const arabicEl = document.createElement('div');
                arabicEl.style.cssText = 'font-size:1rem;color:#fcd34d;font-family:serif;margin-bottom:4px;text-align:center;direction:rtl';
                arabicEl.textContent = 'Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙÙ‘Ù‡Ù Ø§Ù„Ø±ÙÙ‘Ø­Ù’Ù…ÙÙ†Ù Ø§Ù„Ø±ÙÙ‘Ø­ÙÙŠÙ…Ù';
                const meaningEl = document.createElement('div');
                meaningEl.style.cssText = 'font-size:0.85rem;color:#e2e8f0;text-align:center;direction:ltr';
                meaningEl.textContent = 'Rahman ve Rahim olan Allah\'Ä±n adÄ±yla';
                tooltip.appendChild(arabicEl);
                tooltip.appendChild(meaningEl);
                tooltip.classList.remove('hidden');
                const cx = e.clientX, cy = e.clientY;
                const tipW = 240;
                let left = cx - tipW / 2;
                if (left < 8) left = 8;
                if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
                tooltip.style.left = left + 'px';
                tooltip.style.top = (cy - 70) + 'px';
            }
        };
        div.onmouseleave = () => {
            div.style.color = baseColor;
            if (this.dom.tooltip) this.dom.tooltip.classList.add('hidden');
        };
        // Mobil dokunuÅŸ
        div.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const tooltip = this.dom.tooltip;
            if (tooltip) {
                tooltip.innerHTML = '<div style="font-size:1rem;color:#fcd34d;text-align:center;direction:rtl;margin-bottom:4px">Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙÙ‘Ù‡Ù Ø§Ù„Ø±ÙÙ‘Ø­Ù’Ù…ÙÙ†Ù Ø§Ù„Ø±ÙÙ‘Ø­ÙÙŠÙ…Ù</div><div style="font-size:0.85rem;color:#e2e8f0;text-align:center">Rahman ve Rahim olan Allah\'Ä±n adÄ±yla</div>';
                tooltip.classList.remove('hidden');
                const tipW = 240;
                let left = touch.clientX - tipW / 2;
                if (left < 8) left = 8;
                if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
                tooltip.style.left = left + 'px';
                tooltip.style.top = (touch.clientY - 70) + 'px';
            }
        }, { passive: true });
        div.addEventListener('touchend', () => {
            setTimeout(() => { if (this.dom.tooltip) this.dom.tooltip.classList.add('hidden'); }, 2000);
        });
        return div;
    }

    _createOrnamentModule(n) {
        return this._createElement('span', 'ayah-ornament-v15', ` ï´¿${this._toArabicDigits(n)}ï´¾ `);
    }

    // ============================================================
    // ğŸ“² PWA INSTALL
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
                this._showToast('ğŸ“² Uygulama zaten kurulu veya tarayÄ±cÄ± desteklemiyor', '#94a3b8');
                return;
            }
            this._deferredInstallPrompt.prompt();
            const { outcome } = await this._deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                btn.style.display = 'none';
                this._showToast('âœ… Uygulama ana ekrana eklendi!', '#6ee7b7');
            }
            this._deferredInstallPrompt = null;
        };

        window.addEventListener('appinstalled', () => {
            btn.style.display = 'none';
            this._deferredInstallPrompt = null;
        });
    }

    // ============================================================
    // ğŸ”‡ Ã‡EVRÄ°MDIÅI ALGILAMA
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
                    bar.textContent = 'ğŸ”‡ Ã‡evrimdÄ±ÅŸÄ± Mod â€” Ä°nternet baÄŸlantÄ±sÄ± yok';
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
    // ğŸ”‡ Ã‡EVRÄ°MDIÅI PANEL
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
                    <span style="font-size:1.4rem">${isOnline ? 'ğŸŸ¢' : 'ğŸ”´'}</span>
                    <div>
                        <div style="color:${isOnline?'#6ee7b7':'#fca5a5'};font-weight:bold;font-size:0.9rem">${isOnline ? 'Ã‡evrimiÃ§i' : 'Ã‡evrimdÄ±ÅŸÄ±'}</div>
                        <div style="color:#94a3b8;font-size:0.78rem">${isOnline ? 'Ä°nternet baÄŸlantÄ±sÄ± aktif' : 'Ä°nternet baÄŸlantÄ±sÄ± yok'}</div>
                    </div>
                </div>

                <div style="margin-bottom:14px">
                    <div style="display:flex;justify-content:space-between;color:#94a3b8;font-size:0.82rem;margin-bottom:6px">
                        <span>ğŸ“¦ Ã–nbellekteki Sureler</span>
                        <span style="color:#d4af37">${cachedSurahs} / ${totalSurahs} (${pct}%)</span>
                    </div>
                    <div style="background:#1e293b;border-radius:6px;height:8px;overflow:hidden">
                        <div style="height:100%;background:linear-gradient(90deg,#d4af37,#f59e0b);width:${pct}%;transition:width 0.6s"></div>
                    </div>
                </div>

                <div style="color:#94a3b8;font-size:0.82rem;margin-bottom:14px;line-height:1.5">
                    AÃ§Ä±lan sureler otomatik olarak Ã¶nbelleÄŸe alÄ±nÄ±r. Ã‡evrimdÄ±ÅŸÄ± kullanÄ±m iÃ§in tÃ¼m sureleri Ã¶nceden indirebilirsiniz.
                </div>

                <div style="display:flex;flex-direction:column;gap:8px">
                    <button id="downloadAllSurahsBtn" style="background:linear-gradient(135deg,#d4af37,#f59e0b);color:#000;border:none;border-radius:10px;padding:10px 16px;font-weight:bold;font-size:0.88rem;cursor:pointer">
                        â¬‡ï¸ TÃ¼m Sureleri Ä°ndir (${totalSurahs - cachedSurahs} kaldÄ±)
                    </button>
                    <button id="clearCacheBtn" style="background:#1e293b;color:#f87171;border:1px solid #334155;border-radius:10px;padding:10px 16px;font-size:0.88rem;cursor:pointer">
                        ğŸ—‘ï¸ Ã–nbelleÄŸi Temizle
                    </button>
                </div>
                <div id="offlineDownloadStatus" style="color:#94a3b8;font-size:0.8rem;margin-top:10px;text-align:center"></div>
            </div>`;

        document.getElementById('downloadAllSurahsBtn').onclick = () => this._downloadAllSurahs();
        document.getElementById('clearCacheBtn').onclick = () => {
            this.state.surahCache.clear();
            this._initOfflinePanel();
            this._showToast('ğŸ—‘ï¸ Ã–nbellek temizlendi', '#f87171');
        };
    }

    async _downloadAllSurahs() {
        const btn = document.getElementById('downloadAllSurahsBtn');
        const status = document.getElementById('offlineDownloadStatus');
        if (!btn || !status) return;
        btn.disabled = true;
        btn.textContent = 'â³ Ä°ndiriliyor...';
        let downloaded = 0, failed = 0;
        for (let i = 1; i <= 114; i++) {
            try {
                if (!this.state.surahCache.has(i)) {
                    await this._fetchSurahWithCache(i);
                    downloaded++;
                }
                status.textContent = `Ä°lerleme: ${i}/114 sure iÅŸlendi`;
            } catch(e) { failed++; }
        }
        btn.disabled = false;
        const total = this.state.surahCache.size;
        btn.textContent = `âœ… ${total}/114 sure Ã¶nbellekte`;
        status.textContent = failed > 0 ? `âš ï¸ ${failed} sure indirilemedi` : 'âœ… TÃ¼m sureler indirildi!';
        setTimeout(() => this._initOfflinePanel(), 1500);
    }
}

const App = new QuranPortal();
document.addEventListener('DOMContentLoaded', () => setTimeout(() => App.boot(), 100));