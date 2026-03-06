/**
 * 🛡️ QURAN PORTAL - ADMİN PANELİ
 * Ctrl+Q ile açılır, şifre: 13123406
 * Firebase Firestore'dan tüm kullanıcı verilerini çeker
 */

class AdminPanel {
    constructor() {
        this.isOpen = false;
        this.isAuthenticated = false;
        this.adminPassword = '13123406';
        this.currentTab = 'dashboard';
        this.users = [];
        this.siteStats = {};
    }

    init() {
        this._injectHTML();
        this._injectCSS();
        this._bindEvents();
        console.log('%c🛡️ Admin Panel v1.0 — Ctrl+Q ile aç', 'color:#f59e0b;font-weight:bold;');
    }

    _injectHTML() {
        const el = document.createElement('div');
        el.id = 'adminOverlay';
        el.innerHTML = `
        <div id="adminPanel">
            <!-- Şifre Ekranı -->
            <div id="adminAuthScreen">
                <div class="adm-lock">🔐</div>
                <div class="adm-title">Admin Paneli</div>
                <div class="adm-subtitle">Yönetici şifresi girin</div>
                <input type="password" id="adminPassInput" placeholder="Şifre" class="adm-input" />
                <div id="adminPassError" class="adm-error hidden">Yanlış şifre!</div>
                <button id="adminPassBtn" class="adm-btn-primary">Giriş Yap</button>
            </div>

            <!-- Ana Panel -->
            <div id="adminMain" class="hidden">
                <div class="adm-header">
                    <div class="adm-logo">🛡️ Admin Paneli</div>
                    <div class="adm-header-right">
                        <span class="adm-version">Quran Portal v18.0</span>
                        <button id="adminCloseBtn" class="adm-close-btn">✕</button>
                    </div>
                </div>

                <!-- Tab Bar -->
                <div class="adm-tabs">
                    <button class="adm-tab active" data-tab="dashboard">📊 Dashboard</button>
                    <button class="adm-tab" data-tab="users">👥 Kullanıcılar</button>
                    <button class="adm-tab" data-tab="stats">📈 İstatistik</button>
                    <button class="adm-tab" data-tab="online">🟢 Online</button>
                    <button class="adm-tab" data-tab="broadcast">📣 Yayın</button>
                    <button class="adm-tab" data-tab="timeline">🕐 Zaman</button>
                    <button class="adm-tab" data-tab="settings">⚙️ Ayarlar</button>
                </div>

                <!-- Dashboard Tab -->
                <div id="tab-dashboard" class="adm-tab-content">
                    <div class="adm-cards-grid">
                        <div class="adm-card">
                            <div class="adm-card-icon">👥</div>
                            <div class="adm-card-val" id="adm-totalUsers">—</div>
                            <div class="adm-card-label">Toplam Kullanıcı</div>
                        </div>
                        <div class="adm-card">
                            <div class="adm-card-icon">✅</div>
                            <div class="adm-card-val" id="adm-activeToday">—</div>
                            <div class="adm-card-label">Bugün Aktif</div>
                        </div>
                        <div class="adm-card">
                            <div class="adm-card-icon">📖</div>
                            <div class="adm-card-val" id="adm-totalAyahs">—</div>
                            <div class="adm-card-label">Toplam Okunan Ayet</div>
                        </div>
                        <div class="adm-card">
                            <div class="adm-card-icon">⏱️</div>
                            <div class="adm-card-val" id="adm-totalListen">—</div>
                            <div class="adm-card-label">Toplam Dinleme</div>
                        </div>
                        <div class="adm-card">
                            <div class="adm-card-icon">🧠</div>
                            <div class="adm-card-val" id="adm-totalHifz">—</div>
                            <div class="adm-card-label">Hafızlık Seansı</div>
                        </div>
                        <div class="adm-card">
                            <div class="adm-card-icon">📿</div>
                            <div class="adm-card-val" id="adm-totalZikr">—</div>
                            <div class="adm-card-label">Toplam Zikir</div>
                        </div>
                        <div class="adm-card">
                            <div class="adm-card-icon">🛡️</div>
                            <div class="adm-card-val" id="adm-totalAdmins">—</div>
                            <div class="adm-card-label">Admin Sayısı</div>
                        </div>
                        <div class="adm-card">
                            <div class="adm-card-icon">🚫</div>
                            <div class="adm-card-val" id="adm-totalBanned">—</div>
                            <div class="adm-card-label">Engellenen</div>
                        </div>
                        <div class="adm-card" style="border-color:#6ee7b7;background:#0d1f17" onclick="Admin._switchTab('online')" title="Online kullanıcılar" style="cursor:pointer">
                            <div class="adm-card-icon">🟢</div>
                            <div class="adm-card-val" id="adm-dashOnline">—</div>
                            <div class="adm-card-label">Şu An Online</div>
                        </div>
                    </div>
                    <div class="adm-section-title">🕐 Son Kayıt Olan Kullanıcılar</div>
                    <div id="adm-recentUsers" class="adm-recent-list"></div>
                    <div class="adm-refresh-row">
                        <button id="adm-refreshBtn" class="adm-btn-secondary">🔄 Verileri Yenile</button>
                        <span id="adm-lastRefresh" class="adm-last-refresh"></span>
                    </div>
                </div>

                <!-- Kullanıcılar Tab -->
                <div id="tab-users" class="adm-tab-content hidden">
                    <div class="adm-search-bar">
                        <input type="text" id="adm-userSearch" placeholder="🔍 E-posta veya isim ara..." class="adm-input" />
                        <select id="adm-userSort" class="adm-select">
                            <option value="newest">En Yeni</option>
                            <option value="oldest">En Eski</option>
                            <option value="mostAyah">En Çok Ayet</option>
                            <option value="mostListen">En Çok Dinleme</option>
                        </select>
                    </div>
                    <div id="adm-userList" class="adm-user-list"></div>
                </div>

                <!-- İstatistik Tab -->
                <div id="tab-stats" class="adm-tab-content hidden">
                    <div class="adm-section-title">📊 Site Geneli İstatistikler</div>
                    <div id="adm-globalStats" class="adm-global-stats"></div>
                    <div class="adm-section-title" style="margin-top:20px">🏆 En Aktif Kullanıcılar</div>
                    <div id="adm-topUsers" class="adm-top-list"></div>
                    <div class="adm-section-title" style="margin-top:20px">📅 Son 7 Gün Aktivite</div>
                    <div id="adm-activityChart" style="background:#1e293b;border-radius:12px;padding:14px;height:120px;display:flex;align-items:flex-end;gap:6px"></div>
                </div>

                <!-- Online Kullanıcılar Tab -->
                <div id="tab-online" class="adm-tab-content hidden">
                    <div class="adm-section-title">🟢 Anlık Online Kullanıcılar</div>
                    <div id="adm-onlineCount" style="font-size:2rem;font-weight:bold;color:#6ee7b7;text-align:center;margin:8px 0;font-family:sans-serif">—</div>
                    <div id="adm-onlineList" style="display:flex;flex-direction:column;gap:6px;margin-top:8px"></div>
                    <div style="margin-top:12px">
                        <button id="adm-refreshOnline" class="adm-btn-secondary" style="width:100%">🔄 Yenile</button>
                    </div>
                    <div class="adm-section-title" style="margin-top:16px">📊 Sure Popülerlik Grafiği</div>
                    <div id="adm-surahChart" style="background:#1e293b;border-radius:12px;padding:14px;margin-top:8px"></div>
                </div>

                <!-- Zaman Çizelgesi Tab -->
                <div id="tab-timeline" class="adm-tab-content hidden">
                    <div class="adm-section-title">🕐 Kullanıcı Aktivite Zaman Çizelgesi</div>
                    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                        <select id="adm-timelineUser" class="adm-select" style="flex:1;min-width:160px">
                            <option value="">— Kullanıcı Seç —</option>
                        </select>
                        <button id="adm-timelineLoad" class="adm-btn-secondary">Yükle</button>
                    </div>
                    <div id="adm-timelineContent" style="color:#475569;text-align:center;padding:1.5rem;font-family:sans-serif">Kullanıcı seçin</div>
                    <div class="adm-section-title" style="margin-top:20px">📤 Kullanıcı Raporu İndir</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                        <button id="adm-exportPdfBtn" class="adm-btn-secondary">📄 PDF Rapor</button>
                        <button id="adm-exportFullBtn" class="adm-btn-secondary">📥 Tüm Veriler JSON</button>
                        <button id="adm-exportCsvBtn2" class="adm-btn-secondary">📊 CSV</button>
                    </div>
                </div>

                <!-- Yayın Tab -->
                <div id="tab-broadcast" class="adm-tab-content hidden">
                    <div class="adm-section-title">📣 Site Yayını & Duyuru</div>

                    <div class="adm-setting-row">
                        <label>📢 Anlık Duyuru Metni</label>
                        <textarea id="adm-announcement" class="adm-textarea" placeholder="Duyuru metni buraya... (Boş = duyuru kapalı)"></textarea>
                        <div id="adm-ann-preview" style="background:#f59e0b22;border:1px solid #f59e0b44;border-radius:8px;padding:8px;font-size:0.85rem;color:#fcd34d;margin-top:4px;display:none">
                            <span>Önizleme: 📢 </span><span id="adm-ann-preview-text"></span>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:8px">
                            <button id="adm-saveAnnouncement" class="adm-btn-primary" style="flex:1">💾 Yayınla</button>
                            <button id="adm-clearAnnouncement" class="adm-btn-danger">✕ Kaldır</button>
                        </div>
                        <div id="adm-annMsg" style="font-size:0.82rem;margin-top:4px;display:none"></div>
                    </div>

                    <div class="adm-setting-row">
                        <label>📌 Kalıcı Pinned Mesaj <span style="color:#64748b;font-size:0.78rem">(Sayfanın altında hep görünür)</span></label>
                        <textarea id="adm-pinnedMsg" class="adm-textarea" placeholder="Kalıcı mesaj (boş = kapalı)..."></textarea>
                        <div style="display:flex;gap:8px;margin-top:8px">
                            <button id="adm-savePinned" class="adm-btn-primary" style="flex:1">📌 Sabitle</button>
                            <button id="adm-clearPinned" class="adm-btn-danger">✕ Kaldır</button>
                        </div>
                        <div id="adm-pinnedMsg2" style="font-size:0.82rem;margin-top:4px;display:none"></div>
                    </div>

                    <div class="adm-setting-row">
                        <label>🎨 Banner Rengi</label>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            <button class="adm-color-btn" data-color="#f59e0b" style="background:#f59e0b;color:#000;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:bold">Altın</button>
                            <button class="adm-color-btn" data-color="#10b981" style="background:#10b981;color:#000;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:bold">Yeşil</button>
                            <button class="adm-color-btn" data-color="#ef4444" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:bold">Kırmızı</button>
                            <button class="adm-color-btn" data-color="#3b82f6" style="background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:bold">Mavi</button>
                        </div>
                    </div>

                    <div class="adm-setting-row">
                        <label>📨 Toplu Bildirim <span style="color:#64748b;font-size:0.78rem">(Tüm kullanıcılara not gönder)</span></label>
                        <textarea id="adm-bulkMsg" class="adm-textarea" placeholder="Tüm kullanıcılara gönderilecek mesaj..."></textarea>
                        <div style="display:flex;gap:8px;margin-top:8px">
                            <button id="adm-sendBulk" class="adm-btn-primary" style="flex:1">📨 Herkese Gönder</button>
                        </div>
                        <div id="adm-bulkStatus" style="font-size:0.82rem;margin-top:4px;display:none"></div>
                    </div>
                </div>

                <!-- Ayarlar Tab -->
                <div id="tab-settings" class="adm-tab-content hidden">
                    <div class="adm-section-title">⚙️ Sistem Yönetimi</div>

                    <div class="adm-setting-row">
                        <label>🚫 Kullanıcı Engelle</label>
                        <div style="display:flex;gap:8px;margin-bottom:8px">
                            <input type="text" id="adm-banInput" class="adm-input" placeholder="UID veya e-posta" />
                            <button id="adm-banBtn" class="adm-btn-danger">Engelle</button>
                        </div>
                        <div class="adm-section-title" style="margin-bottom:6px">Engellenenler</div>
                        <div id="adm-bannedList" style="color:#475569;font-size:0.82rem;font-family:sans-serif">—</div>
                    </div>

                    <div class="adm-setting-row">
                        <label>📤 Veri İndir</label>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            <button id="adm-exportBtn" class="adm-btn-secondary">📥 JSON</button>
                            <button id="adm-exportCsvBtn" class="adm-btn-secondary">📊 CSV</button>
                            <button id="adm-exportEmailsBtn" class="adm-btn-secondary">📧 E-postalar</button>
                        </div>
                    </div>

                    <div class="adm-setting-row">
                        <label>🌙 Bakım Modu</label>
                        <div style="display:flex;align-items:center;gap:12px">
                            <label class="adm-toggle-wrap">
                                <input type="checkbox" id="adm-maintenanceToggle">
                                <span class="adm-toggle-slider"></span>
                            </label>
                            <span id="adm-maintenanceStatus" style="color:#64748b;font-size:0.85rem;font-family:sans-serif">Kapalı</span>
                        </div>
                    </div>

                    <div class="adm-setting-row">
                        <label>🔑 Admin Şifresi Değiştir</label>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            <input type="password" id="adm-newPass1" class="adm-input" placeholder="Yeni şifre" style="flex:1" />
                            <input type="password" id="adm-newPass2" class="adm-input" placeholder="Tekrar" style="flex:1" />
                            <button id="adm-changePassBtn" class="adm-btn-primary">Değiştir</button>
                        </div>
                        <div id="adm-passChangeMsg" class="hidden" style="color:#6ee7b7;font-size:0.85rem;margin-top:4px"></div>
                    </div>

                    <div class="adm-setting-row" style="margin-top:8px">
                        <button id="adm-logoutAdmin" class="adm-btn-danger" style="width:100%">🚪 Admin Oturumunu Kapat</button>
                    </div>
                </div>

            </div><!-- /adminMain -->
        </div><!-- /adminPanel -->
        `;
        document.body.appendChild(el);
    }

    _injectCSS() {
        const s = document.createElement('style');
        s.id = 'admin-styles';
        s.innerHTML = `
        #adminOverlay {
            display: none;
            position: fixed; inset: 0; z-index: 9999999;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(6px);
            align-items: center; justify-content: center;
            padding: 1rem;
        }
        #adminOverlay.open { display: flex; }
        .adm-toggle-wrap { position:relative;display:inline-block;width:44px;height:24px;cursor:pointer; }
        .adm-toggle-wrap input { opacity:0;width:0;height:0; }
        .adm-toggle-slider { position:absolute;inset:0;background:#334155;border-radius:24px;transition:0.3s; }
        .adm-toggle-slider::before { content:'';position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#94a3b8;border-radius:50%;transition:0.3s; }
        .adm-toggle-wrap input:checked + .adm-toggle-slider { background:#f59e0b; }
        .adm-toggle-wrap input:checked + .adm-toggle-slider::before { transform:translateX(20px);background:#fff; }
        #adminPanel {
            background: #0a0f1e;
            border: 2px solid #f59e0b;
            border-radius: 20px;
            width: 100%; max-width: 960px;
            max-height: 90vh;
            overflow: hidden;
            display: flex; flex-direction: column;
            box-shadow: 0 0 60px rgba(245,158,11,0.2), 0 25px 80px rgba(0,0,0,0.8);
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        #adminAuthScreen {
            display: flex; flex-direction: column; align-items: center;
            padding: 3rem 2rem; gap: 14px;
        }
        .adm-lock { font-size: 3rem; }
        .adm-title { font-size: 1.6rem; color: #f59e0b; font-weight: bold; }
        .adm-subtitle { color: #64748b; font-size: 0.9rem; }
        .adm-input {
            background: #1e293b; color: #e2e8f0;
            border: 1.5px solid #334155; border-radius: 10px;
            padding: 0.65rem 1rem; font-size: 1rem;
            width: 100%; box-sizing: border-box; direction: ltr;
        }
        .adm-input:focus { border-color: #f59e0b; outline: none; }
        .adm-error { color: #f87171; font-size: 0.85rem; }
        .adm-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000; border: none; border-radius: 10px;
            padding: 0.65rem 1.5rem; font-size: 1rem; font-weight: bold;
            cursor: pointer; width: 100%; transition: 0.2s;
        }
        .adm-btn-primary:hover { transform: scale(1.02); }
        .adm-btn-secondary {
            background: #1e293b; color: #94a3b8;
            border: 1.5px solid #334155; border-radius: 10px;
            padding: 0.55rem 1.2rem; font-size: 0.9rem; cursor: pointer;
        }
        .adm-btn-danger {
            background: #7f1d1d; color: #fca5a5;
            border: none; border-radius: 10px;
            padding: 0.55rem 1.2rem; font-size: 0.9rem; cursor: pointer;
        }
        .adm-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-bottom: 2px solid #f59e0b;
        }
        .adm-logo { color: #f59e0b; font-size: 1.2rem; font-weight: bold; }
        .adm-header-right { display: flex; align-items: center; gap: 12px; }
        .adm-version { color: #475569; font-size: 0.8rem; }
        .adm-close-btn {
            background: #334155; color: #94a3b8;
            border: none; border-radius: 8px;
            width: 32px; height: 32px; cursor: pointer;
            font-size: 1rem; display: flex; align-items: center; justify-content: center;
        }
        .adm-close-btn:hover { background: #7f1d1d; color: #fca5a5; }
        .adm-tabs {
            display: flex; gap: 4px; padding: 10px 16px;
            background: #0f172a; border-bottom: 1px solid #1e293b;
            overflow-x: auto;
        }
        .adm-tab {
            background: transparent; color: #64748b;
            border: none; border-radius: 8px;
            padding: 0.45rem 0.9rem; font-size: 0.85rem; cursor: pointer;
            white-space: nowrap; transition: 0.2s;
        }
        .adm-tab.active { background: #1e3a5f; color: #f59e0b; font-weight: bold; }
        .adm-tab-content { padding: 20px; overflow-y: auto; flex: 1; }
        .adm-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px; margin-bottom: 24px;
        }
        .adm-card {
            background: #1e293b; border: 1px solid #334155;
            border-radius: 14px; padding: 1rem; text-align: center;
        }
        .adm-card-icon { font-size: 1.6rem; margin-bottom: 4px; }
        .adm-card-val { font-size: 1.6rem; font-weight: bold; color: #f59e0b; }
        .adm-card-label { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
        .adm-section-title {
            color: #f59e0b; font-size: 0.85rem; font-weight: bold;
            text-transform: uppercase; letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .adm-recent-list, .adm-user-list, .adm-top-list { display: flex; flex-direction: column; gap: 8px; }
        .adm-user-row {
            background: #1e293b; border: 1px solid #334155;
            border-radius: 12px; padding: 12px 16px;
            display: grid;
            grid-template-columns: 40px 1fr 1fr 80px 80px 100px;
            gap: 10px; align-items: center;
            font-size: 0.85rem;
        }
        .adm-user-row:hover { border-color: #f59e0b44; }
        .adm-user-avatar {
            width: 36px; height: 36px; border-radius: 50%;
            background: linear-gradient(135deg, #1e3a5f, #0f172a);
            display: flex; align-items: center; justify-content: center;
            color: #f59e0b; font-weight: bold; font-size: 1rem;
            border: 2px solid #f59e0b44;
            overflow: hidden;
        }
        .adm-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .adm-user-name { color: #e2e8f0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .adm-user-email { color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .adm-user-stat { color: #94a3b8; text-align: center; }
        .adm-user-provider {
            display: flex; align-items: center; justify-content: center;
        }
        .adm-provider-badge {
            padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;
        }
        .badge-google { background: #1e3a5f; color: #60a5fa; }
        .badge-email { background: #064e3b; color: #6ee7b7; }
        .adm-user-actions { display: flex; gap: 4px; }
        .adm-action-btn {
            background: #334155; color: #94a3b8;
            border: none; border-radius: 6px;
            padding: 4px 8px; font-size: 0.75rem; cursor: pointer;
        }
        .adm-action-btn:hover { background: #7f1d1d; color: #fca5a5; }
        .adm-user-detail {
            display: none;
            background: #0f172a; border: 1px solid #334155;
            border-radius: 10px; padding: 14px; margin-top: 4px;
            font-size: 0.82rem; color: #94a3b8;
        }
        .adm-user-detail.open { display: block; }
        .adm-detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .adm-detail-item label { color: #475569; display: block; font-size: 0.75rem; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
        .adm-detail-item span { color: #e2e8f0; word-break: break-all; }
        .adm-search-bar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .adm-select {
            background: #1e293b; color: #e2e8f0;
            border: 1.5px solid #334155; border-radius: 10px;
            padding: 0.5rem 0.8rem; font-size: 0.9rem; cursor: pointer;
        }
        .adm-global-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
        .adm-stat-row {
            background: #1e293b; border: 1px solid #334155;
            border-radius: 10px; padding: 12px 16px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .adm-stat-row span:first-child { color: #94a3b8; font-size: 0.9rem; }
        .adm-stat-row span:last-child { color: #f59e0b; font-weight: bold; }
        .adm-top-item {
            background: #1e293b; border: 1px solid #334155;
            border-radius: 10px; padding: 10px 16px;
            display: flex; align-items: center; gap: 12px;
        }
        .adm-top-rank { color: #f59e0b; font-weight: bold; font-size: 1.1rem; min-width: 24px; }
        .adm-top-name { color: #e2e8f0; flex: 1; font-size: 0.9rem; }
        .adm-top-val { color: #64748b; font-size: 0.85rem; }
        .adm-setting-row { background: #1e293b; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; }
        .adm-setting-row label { color: #94a3b8; font-size: 0.85rem; }
        .adm-textarea { background: #0f172a; color: #e2e8f0; border: 1.5px solid #334155; border-radius: 8px; padding: 0.6rem; font-size: 0.9rem; width: 100%; min-height: 80px; resize: vertical; box-sizing: border-box; direction: ltr; }
        .adm-refresh-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
        .adm-last-refresh { color: #475569; font-size: 0.8rem; }
        .adm-loading { text-align: center; color: #475569; padding: 2rem; }
        .adm-empty { text-align: center; color: #334155; padding: 2rem; font-size: 1.1rem; }
        .adm-col-header {
            display: grid;
            grid-template-columns: 40px 1fr 1fr 80px 80px 100px;
            gap: 10px; padding: 6px 16px;
            font-size: 0.75rem; color: #475569;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .hidden { display: none !important; }
        @media (max-width: 700px) {
            #adminPanel { max-height: 95vh; border-radius: 14px; }
            .adm-user-row { grid-template-columns: 36px 1fr 60px; }
            .adm-user-email, .adm-user-stat, .adm-user-provider { display: none; }
            .adm-col-header { display: none; }
            .adm-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        `;
        document.head.appendChild(s);
    }

    _bindEvents() {
        // Ctrl+Q ile aç/kapat
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'q') { e.preventDefault(); this.toggle(); }
        });

        // Şifre girişi
        document.getElementById('adminPassBtn').onclick = () => this._checkPassword();
        document.getElementById('adminPassInput').onkeydown = (e) => { if (e.key === 'Enter') this._checkPassword(); };

        // Kapat
        document.getElementById('adminCloseBtn').onclick = () => this.close();
        document.getElementById('adminOverlay').onclick = (e) => { if (e.target.id === 'adminOverlay') this.close(); };

        // Tablar
        document.querySelectorAll('.adm-tab').forEach(btn => {
            btn.onclick = () => this._switchTab(btn.dataset.tab);
        });

        // Yenile
        document.getElementById('adm-refreshBtn').onclick = () => this._loadAllData();

        // Kullanıcı ara
        document.getElementById('adm-userSearch').oninput = () => this._filterUsers();
        document.getElementById('adm-userSort').onchange = () => this._filterUsers();

        // Ayarlar
        document.getElementById('adm-banBtn').onclick = () => this._banUser();
        document.getElementById('adm-exportBtn').onclick = () => this._exportData();
        document.getElementById('adm-exportCsvBtn').onclick = () => this._exportCSV();
        document.getElementById('adm-exportEmailsBtn').onclick = () => this._exportEmails();
        document.getElementById('adm-changePassBtn').onclick = () => this._changePassword();
        document.getElementById('adm-logoutAdmin').onclick = () => this._logoutAdmin();
        const maintToggle = document.getElementById('adm-maintenanceToggle');
        if (maintToggle) maintToggle.onchange = () => this._toggleMaintenance();
        // Yayın tab — event'ler _initBroadcastTab içinde lazy bind
        // saveAnnouncement/clearAnnouncement broadcast tabda bağlanıyor
        const saveAnnBtn = document.getElementById('adm-saveAnnouncement');
        const clearAnnBtn = document.getElementById('adm-clearAnnouncement');
        if (saveAnnBtn) saveAnnBtn.onclick = () => this._saveAnnouncement();
        if (clearAnnBtn) clearAnnBtn.onclick = () => this._clearAnnouncement();
    }

    _checkPassword() {
        const input = document.getElementById('adminPassInput').value;
        const stored = localStorage.getItem('adm_pass') || this.adminPassword;
        // Token tabanlı bypass: kullanıcı Firebase'de admin ise şifresiz giriş
        const tokenMatch = localStorage.getItem('adm_user_token') && window._userIsAdmin;
        if (input === stored || (tokenMatch && input === '')) {
            this._grantPanelAccess();
        } else if (input === stored) {
            this._grantPanelAccess();
        } else {
            document.getElementById('adminPassError').classList.remove('hidden');
            document.getElementById('adminPassInput').value = '';
            document.getElementById('adminPassInput').focus();
        }
    }

    _grantPanelAccess() {
        this.isAuthenticated = true;
        document.getElementById('adminAuthScreen').classList.add('hidden');
        document.getElementById('adminMain').classList.remove('hidden');
        this._loadAllData();
        document.getElementById('adminPassInput').value = '';
        document.getElementById('adminPassError').classList.add('hidden');
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        document.getElementById('adminOverlay').classList.add('open');
        // Firebase admin tokenı varsa direkt ana paneli aç
        if (window._userIsAdmin && !this.isAuthenticated) {
            this._grantPanelAccess();
            return;
        }
        if (!this.isAuthenticated) {
            setTimeout(() => document.getElementById('adminPassInput').focus(), 100);
        }
    }

    close() {
        this.isOpen = false;
        document.getElementById('adminOverlay').classList.remove('open');
    }

    _switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.adm-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.adm-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`tab-${tab}`).classList.remove('hidden');
        if (tab === 'stats') this._renderStats();
        if (tab === 'broadcast') this._initBroadcastTab();
        if (tab === 'online') this._initOnlineTab();
        if (tab === 'timeline') this._initTimelineTab();
    }

    async _loadAllData() {
        if (!window.FirebaseAuth) return;
        const { db } = window.FirebaseAuth;
        document.getElementById('adm-refreshBtn').textContent = '⏳ Yükleniyor...';

        try {
            // Firebase Admin SDK olmadan collection listesi çekmek için
            // users koleksiyonunu çekiyoruz — her kullanıcı kendi dokümanını yazıyor
            const { collection, getDocs } = await this._getFirestoreHelpers();
            const snapshot = await getDocs(collection(db, 'users'));

            this.users = [];
            snapshot.forEach(doc => {
                this.users.push({ uid: doc.id, ...doc.data() });
            });

            // Firebase Auth kullanıcı listesi (sadece admin SDK'da mümkün olduğu için
            // Firestore'daki profile verilerini kullanıyoruz)
            this._renderDashboard();
            this._renderUserList(this.users);
            this._renderStats();
            this._loadAnnouncement();
            this._loadBannedList();
            this._loadAdminCount();
            this._loadDashboardOnline();

            const now = new Date().toLocaleTimeString('tr-TR');
            document.getElementById('adm-lastRefresh').textContent = `Son güncelleme: ${now}`;
        } catch (e) {
            console.error('Admin veri hatası:', e);
        }

        document.getElementById('adm-refreshBtn').textContent = '🔄 Verileri Yenile';
    }

    async _getFirestoreHelpers() {
        // firebase-init.js'deki import'ları kullan
        return {
            collection: (db, path) => {
                const { doc } = window.FirebaseAuth;
                // Firestore collection referansı
                return window._firestoreCollection(db, path);
            },
            getDocs: window._firestoreGetDocs
        };
    }

    _renderDashboard() {
        const u = this.users;
        const today = new Date().toDateString();

        let totalAyahs = 0, totalListen = 0, totalHifz = 0, totalZikr = 0, activeToday = 0;
        u.forEach(user => {
            const s = user.stats || {};
            totalAyahs += s.ayahCount || 0;
            totalListen += s.listenSeconds || 0;
            totalHifz += s.hifzCount || 0;
            totalZikr += s.zikrTotal || 0;
            if (s.goalDate === today) activeToday++;
        });

        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('adm-totalUsers', u.length);
        el('adm-activeToday', activeToday);
        el('adm-totalAyahs', totalAyahs.toLocaleString('tr-TR'));
        el('adm-totalListen', this._formatDuration(totalListen));
        el('adm-totalHifz', totalHifz.toLocaleString('tr-TR'));
        el('adm-totalZikr', totalZikr.toLocaleString('tr-TR'));

        // Son kayıtlar
        const recent = [...u].sort((a,b) => (b.createdAt||0) - (a.createdAt||0)).slice(0, 5);
        const rList = document.getElementById('adm-recentUsers');
        rList.innerHTML = recent.length ? recent.map(u => this._userMiniCard(u)).join('') : '<div class="adm-empty">Henüz kullanıcı yok</div>';
    }

    _userMiniCard(u) {
        const name = u.displayName || u.email || u.uid.slice(0,8);
        const initial = (name[0] || '?').toUpperCase();
        const avatar = u.photoURL ? `<img src="${u.photoURL}" onerror="this.style.display='none'">` : initial;
        const provider = u.provider === 'google.com' ? '<span class="adm-provider-badge badge-google">Google</span>' : '<span class="adm-provider-badge badge-email">E-posta</span>';
        const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—';
        return `
        <div class="adm-top-item">
            <div class="adm-user-avatar">${avatar}</div>
            <div class="adm-top-name">${name}</div>
            ${provider}
            <div class="adm-top-val">${joined}</div>
        </div>`;
    }

    _renderUserList(users) {
        const list = document.getElementById('adm-userList');

        // Kolon başlıkları
        const header = document.createElement('div');
        header.className = 'adm-col-header';
        header.innerHTML = '<span></span><span>İsim</span><span>E-posta</span><span>Ayet</span><span>Dinleme</span><span>İşlem</span>';

        list.innerHTML = '';
        list.appendChild(header);

        if (!users.length) { list.innerHTML += '<div class="adm-empty">Kullanıcı bulunamadı</div>'; return; }

        users.forEach(u => {
            const name = u.displayName || '—';
            const email = u.email || '—';
            const initial = ((name !== '—' ? name : email)[0] || '?').toUpperCase();
            const avatar = u.photoURL ? `<img src="${u.photoURL}" onerror="this.style.display='none'">` : initial;
            const provider = u.provider === 'google.com' ? 'badge-google">Google' : 'badge-email">E-posta';
            const s = u.stats || {};
            const ayahs = (s.ayahCount || 0).toLocaleString('tr-TR');
            const listen = this._formatDuration(s.listenSeconds || 0);
            const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—';
            const lastSeen = s.goalDate || '—';
            const surahCount = (s.surahsOpened || []).length;
            const hifz = s.hifzCount || 0;
            const goal = s.dailyGoal || 10;
            const todayAyahs = s.todayAyahs || 0;
            const isAdmin = u.isAdmin ? '<span style="background:#1a3a1a;color:#6ee7b7;border-radius:6px;padding:1px 6px;font-size:0.7rem;margin-left:4px">🛡️Admin</span>' : '';

            const rowId = `user-row-${u.uid}`;
            const detailId = `user-detail-${u.uid}`;

            const row = document.createElement('div');
            row.innerHTML = `
            <div class="adm-user-row" id="${rowId}" style="cursor:pointer" onclick="Admin._toggleDetail('${u.uid}')">
                <div class="adm-user-avatar">${avatar}</div>
                <div>
                    <div class="adm-user-name">${name}${isAdmin}</div>
                    <div style="font-size:0.75rem;color:#475569">${u.uid.slice(0,12)}...</div>
                </div>
                <div class="adm-user-email">${email}</div>
                <div class="adm-user-stat">${ayahs}</div>
                <div class="adm-user-stat">${listen}</div>
                <div class="adm-user-provider"><span class="adm-provider-badge ${provider}</span></div>
            </div>
            <div class="adm-user-detail" id="${detailId}">
                <div class="adm-detail-grid">
                    <div class="adm-detail-item"><label>Tam İsim</label><span>${name}</span></div>
                    <div class="adm-detail-item"><label>E-posta</label><span>${email}</span></div>
                    <div class="adm-detail-item"><label>UID</label><span style="font-size:0.75rem;word-break:break-all">${u.uid}</span></div>
                    <div class="adm-detail-item"><label>Kayıt Tarihi</label><span>${joined}</span></div>
                    <div class="adm-detail-item"><label>Son Aktif</label><span>${lastSeen}</span></div>
                    <div class="adm-detail-item"><label>Giriş Yöntemi</label><span>${u.provider === 'google.com' ? '🔵 Google' : '📧 E-posta'}</span></div>
                    <div class="adm-detail-item"><label>Profil Fotoğrafı</label><span>${u.photoURL ? '✅ Var' : '❌ Yok'}</span></div>
                    <div class="adm-detail-item"><label>Okunan Ayet</label><span>${ayahs}</span></div>
                    <div class="adm-detail-item"><label>Toplam Dinleme</label><span>${listen}</span></div>
                    <div class="adm-detail-item"><label>Açılan Sure</label><span>${surahCount}</span></div>
                    <div class="adm-detail-item"><label>Hafızlık Seansı</label><span>${hifz}</span></div>
                    <div class="adm-detail-item"><label>Günlük Hedef</label><span>${todayAyahs} / ${goal} ayet</span></div>
                    ${u.photoURL ? `<div class="adm-detail-item" style="grid-column:1/-1"><label>Profil Görseli</label><br><img src="${u.photoURL}" style="width:48px;height:48px;border-radius:50%;margin-top:4px"></div>` : ''}
                </div>
                <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
                    <button class="adm-btn-danger adm-action-btn" onclick="Admin._confirmBan('${u.uid}','${email}')">🚫 Engelle</button>
                    <button class="adm-btn-secondary adm-action-btn" onclick="Admin._copyUID('${u.uid}')">📋 UID Kopyala</button>
                    <button class="adm-btn-secondary adm-action-btn" onclick="Admin._grantAdmin('${u.uid}','${email}')" style="background:#1a3a1a;color:#6ee7b7;border:1px solid #064e3b">🛡️ Admin Ver</button>
                    <button class="adm-btn-secondary adm-action-btn" onclick="Admin._revokeAdmin('${u.uid}')" style="background:#3a1a1a;color:#fca5a5;border:1px solid #7f1d1d">❌ Admin Al</button>
                    <button class="adm-btn-secondary adm-action-btn" onclick="Admin._sendUserNote('${u.uid}','${name}')" style="background:#1e293b;color:#fcd34d;border:1px solid #78350f">📝 Not Gönder</button>
                </div>
            </div>`;
            list.appendChild(row);
        });
    }

    _toggleDetail(uid) {
        const el = document.getElementById(`user-detail-${uid}`);
        if (el) el.classList.toggle('open');
    }

    _filterUsers() {
        const q = document.getElementById('adm-userSearch').value.toLowerCase();
        const sort = document.getElementById('adm-userSort').value;
        let filtered = this.users.filter(u =>
            (u.email || '').toLowerCase().includes(q) ||
            (u.displayName || '').toLowerCase().includes(q) ||
            u.uid.toLowerCase().includes(q)
        );
        if (sort === 'newest') filtered.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
        else if (sort === 'oldest') filtered.sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
        else if (sort === 'mostAyah') filtered.sort((a,b) => ((b.stats||{}).ayahCount||0) - ((a.stats||{}).ayahCount||0));
        else if (sort === 'mostListen') filtered.sort((a,b) => ((b.stats||{}).listenSeconds||0) - ((a.stats||{}).listenSeconds||0));
        this._renderUserList(filtered);
    }

    _renderStats() {
        const u = this.users;
        let totalAyahs = 0, totalListen = 0, totalHifz = 0, totalZikr = 0;
        const surahPopularity = {};
        u.forEach(user => {
            const s = user.stats || {};
            totalAyahs += s.ayahCount || 0;
            totalListen += s.listenSeconds || 0;
            totalHifz += s.hifzCount || 0;
            totalZikr += s.zikrTotal || 0;
            (s.surahsOpened || []).forEach(sid => { surahPopularity[sid] = (surahPopularity[sid] || 0) + 1; });
        });

        const avgAyah = u.length ? Math.round(totalAyahs / u.length) : 0;
        const avgListen = u.length ? Math.round(totalListen / u.length) : 0;

        document.getElementById('adm-globalStats').innerHTML = `
            <div class="adm-stat-row"><span>👥 Toplam Kullanıcı</span><span>${u.length}</span></div>
            <div class="adm-stat-row"><span>📖 Toplam Okunan Ayet</span><span>${totalAyahs.toLocaleString('tr-TR')}</span></div>
            <div class="adm-stat-row"><span>⏱️ Toplam Dinleme Süresi</span><span>${this._formatDuration(totalListen)}</span></div>
            <div class="adm-stat-row"><span>🧠 Toplam Hafızlık Seansı</span><span>${totalHifz.toLocaleString('tr-TR')}</span></div>
            <div class="adm-stat-row"><span>📿 Toplam Zikir</span><span>${totalZikr.toLocaleString('tr-TR')}</span></div>
            <div class="adm-stat-row"><span>📊 Kullanıcı Başına Ort. Ayet</span><span>${avgAyah}</span></div>
            <div class="adm-stat-row"><span>📊 Kullanıcı Başına Ort. Dinleme</span><span>${this._formatDuration(avgListen)}</span></div>
            <div class="adm-stat-row"><span>🔵 Google Girişi</span><span>${u.filter(x => x.provider === 'google.com').length}</span></div>
            <div class="adm-stat-row"><span>📧 E-posta Girişi</span><span>${u.filter(x => x.provider !== 'google.com').length}</span></div>
        `;

        // En aktif kullanıcılar
        const topUsers = [...u].sort((a,b) => ((b.stats||{}).ayahCount||0) - ((a.stats||{}).ayahCount||0)).slice(0, 10);
        document.getElementById('adm-topUsers').innerHTML = topUsers.map((u, i) => {
            const name = u.displayName || u.email || u.uid.slice(0,12);
            const s = u.stats || {};
            return `<div class="adm-top-item">
                <div class="adm-top-rank">${i+1}.</div>
                <div class="adm-top-name">${name}</div>
                <div class="adm-top-val">📖 ${(s.ayahCount||0)} ayet · ⏱️ ${this._formatDuration(s.listenSeconds||0)}</div>
            </div>`;
        }).join('') || '<div class="adm-empty">Veri yok</div>';

        this._renderActivityChart();
    }

    async _saveAnnouncement() {
        if (!window.FirebaseAuth) { alert('Firebase bağlı değil!'); return; }
        const text = document.getElementById('adm-announcement').value.trim();
        const msgEl = document.getElementById('adm-annMsg');
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            await setDoc(doc(db, 'settings', 'announcement'), {
                text, active: text.length > 0, updatedAt: Date.now()
            });
            if (msgEl) { msgEl.textContent = '✅ Duyuru yayınlandı!'; msgEl.style.color='#6ee7b7'; msgEl.style.display='block'; setTimeout(()=>msgEl.style.display='none',3000); }
        } catch (e) {
            if (msgEl) { msgEl.textContent = '❌ '+e.message; msgEl.style.color='#f87171'; msgEl.style.display='block'; }
        }
    }

    async _clearAnnouncement() {
        if (!window.FirebaseAuth) return;
        const msgEl = document.getElementById('adm-annMsg');
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            await setDoc(doc(db, 'settings', 'announcement'), { text:'', active:false, updatedAt:Date.now() });
            document.getElementById('adm-announcement').value = '';
            if (msgEl) { msgEl.textContent='✅ Duyuru kaldırıldı.'; msgEl.style.color='#6ee7b7'; msgEl.style.display='block'; setTimeout(()=>msgEl.style.display='none',2500); }
        } catch(e) { console.error(e); }
    }

    async _loadAnnouncement() {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'settings', 'announcement'));
            if (snap.exists() && snap.data().text) {
                document.getElementById('adm-announcement').value = snap.data().text;
            }
        } catch(e) {}
    }

    async _loadBannedList() {
        const el = document.getElementById('adm-bannedList');
        if (!el) return;
        if (!window.FirebaseAuth) { el.textContent='Firebase bağlı değil'; return; }
        try {
            const { db } = window.FirebaseAuth;
            const { collection, getDocs } = window.FirebaseAuth;
            const snap = await getDocs(collection(db, 'banned'));
            if (snap.empty) { el.textContent='Engellenen kullanıcı yok.'; return; }
            const rows = [];
            snap.forEach(d => {
                const data = d.data();
                rows.push(`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1e293b;font-family:sans-serif">
                    <span style="color:#94a3b8">${data.email||d.id.slice(0,16)}</span>
                    <button onclick="Admin._unbanUser('${d.id}')" style="background:#064e3b;color:#6ee7b7;border:none;border-radius:6px;padding:2px 8px;font-size:0.75rem;cursor:pointer">Kaldır</button>
                </div>`);
            });
            el.innerHTML = rows.join('');
        } catch(e) { el.textContent='Yüklenemedi: '+e.message; }
    }

    async _unbanUser(uid) {
        if (!window.FirebaseAuth) return;
        try {
            const module = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const { db, doc } = window.FirebaseAuth;
            await module.deleteDoc(doc(db, 'banned', uid));
            this._loadBannedList();
        } catch(e) { alert('Hata: '+e.message); }
    }

    _exportCSV() {
        const rows = [['UID','Email','İsim','Provider','Kayıt','Ayet','Dinleme(sn)','Hafızlık']];
        this.users.forEach(u => {
            const s = u.stats||{};
            rows.push([u.uid,u.email||'',u.displayName||'',u.provider||'',
                u.createdAt?new Date(u.createdAt).toLocaleDateString('tr-TR'):'',
                s.ayahCount||0,s.listenSeconds||0,s.hifzCount||0]);
        });
        const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
        a.download = 'quran-users-'+new Date().toISOString().slice(0,10)+'.csv';
        a.click();
    }

    _exportEmails() {
        const emails = this.users.filter(u=>u.email).map(u=>u.email).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([emails],{type:'text/plain'}));
        a.download = 'emails.txt'; a.click();
    }

    async _toggleMaintenance() {
        if (!window.FirebaseAuth) return;
        const checked = document.getElementById('adm-maintenanceToggle').checked;
        const statusEl = document.getElementById('adm-maintenanceStatus');
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            await setDoc(doc(db, 'settings', 'maintenance'), { active:checked, updatedAt:Date.now() });
            if (statusEl) { statusEl.textContent = checked ? '🔴 Açık' : '✅ Kapalı'; statusEl.style.color = checked?'#f87171':'#6ee7b7'; }
        } catch(e) {}
    }

    _confirmBan(uid, email) {
        if (confirm(`"${email || uid}" kullanıcısını engellemek istediğinize emin misiniz?`)) {
            this._banUserById(uid, email);
        }
    }

    async _banUserById(uid, email) {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            await setDoc(doc(db, 'banned', uid), { uid, email, bannedAt: Date.now() });
            alert('✅ Kullanıcı engellendi. (Firestore banned koleksiyonuna eklendi)');
        } catch (e) { alert('Hata: ' + e.message); }
    }

    async _banUser() {
        const val = document.getElementById('adm-banInput').value.trim();
        if (!val) return;
        const user = this.users.find(u => u.uid === val || u.email === val);
        if (user) { this._confirmBan(user.uid, user.email); document.getElementById('adm-banInput').value = ''; }
        else { alert('Kullanıcı bulunamadı.'); }
    }

    _exportData() {
        const json = JSON.stringify(this.users, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `quran-portal-users-${new Date().toISOString().slice(0,10)}.json`;
        a.click(); URL.revokeObjectURL(url);
    }

    _changePassword() {
        const p1 = document.getElementById('adm-newPass1').value;
        const p2 = document.getElementById('adm-newPass2').value;
        const msg = document.getElementById('adm-passChangeMsg');
        if (!p1 || p1 !== p2) { msg.textContent = '❌ Şifreler eşleşmiyor!'; msg.style.color = '#f87171'; msg.classList.remove('hidden'); return; }
        if (p1.length < 4) { msg.textContent = '❌ Çok kısa!'; msg.style.color = '#f87171'; msg.classList.remove('hidden'); return; }
        localStorage.setItem('adm_pass', p1);
        msg.textContent = '✅ Şifre değiştirildi!'; msg.style.color = '#6ee7b7'; msg.classList.remove('hidden');
        document.getElementById('adm-newPass1').value = '';
        document.getElementById('adm-newPass2').value = '';
    }

    _logoutAdmin() {
        this.isAuthenticated = false;
        document.getElementById('adminMain').classList.add('hidden');
        document.getElementById('adminAuthScreen').classList.remove('hidden');
        this.close();
    }

    _copyUID(uid) {
        navigator.clipboard.writeText(uid).then(() => alert('✅ UID kopyalandı!'));
    }

    _initBroadcastTab() {
        this._loadAnnouncement();
        this._loadPinnedMsg();
        this._initBulkNotification();

        const annTa = document.getElementById('adm-announcement');
        if (annTa && !annTa._previewBound) {
            annTa._previewBound = true;
            annTa.oninput = () => {
                const prev = document.getElementById('adm-ann-preview');
                const prevText = document.getElementById('adm-ann-preview-text');
                if (annTa.value.trim()) { prev.style.display='block'; prevText.textContent = annTa.value.trim(); }
                else { prev.style.display='none'; }
            };
        }

        // Banner renk butonları
        document.querySelectorAll('.adm-color-btn').forEach(btn => {
            if (!btn._bound) {
                btn._bound = true;
                btn.onclick = async () => {
                    const color = btn.dataset.color;
                    if (!window.FirebaseAuth) return;
                    try {
                        const { db, doc, setDoc } = window.FirebaseAuth;
                        await setDoc(doc(db, 'settings', 'bannerColor'), { color, updatedAt: Date.now() });
                        // Anlık güncelle
                        const banner = document.getElementById('siteBanner');
                        if (banner) banner.style.background = color;
                        btn.style.outline = '2px solid #fff';
                        setTimeout(() => btn.style.outline='', 1000);
                    } catch(e) {}
                };
            }
        });

        // Pinned mesaj butonları
        const savePinBtn = document.getElementById('adm-savePinned');
        const clearPinBtn = document.getElementById('adm-clearPinned');
        if (savePinBtn && !savePinBtn._bound) {
            savePinBtn._bound = true;
            savePinBtn.onclick = () => this._savePinnedMsg();
            clearPinBtn.onclick = () => this._clearPinnedMsg();
        }
    }

    async _loadPinnedMsg() {
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, getDoc } = window.FirebaseAuth;
            const snap = await getDoc(doc(db, 'settings', 'pinnedMsg'));
            const ta = document.getElementById('adm-pinnedMsg');
            if (snap.exists() && snap.data().text && ta) ta.value = snap.data().text;
        } catch(e) {}
    }

    async _savePinnedMsg() {
        if (!window.FirebaseAuth) return;
        const text = document.getElementById('adm-pinnedMsg').value.trim();
        const msgEl = document.getElementById('adm-pinnedMsg2');
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            await setDoc(doc(db, 'settings', 'pinnedMsg'), { text, active: text.length>0, updatedAt: Date.now() });
            if (msgEl) { msgEl.textContent='✅ Sabitlendi!'; msgEl.style.color='#6ee7b7'; msgEl.style.display='block'; setTimeout(()=>msgEl.style.display='none',2500); }
        } catch(e) { if (msgEl) { msgEl.textContent='❌ '+e.message; msgEl.style.color='#f87171'; msgEl.style.display='block'; } }
    }

    async _clearPinnedMsg() {
        if (!window.FirebaseAuth) return;
        const msgEl = document.getElementById('adm-pinnedMsg2');
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            await setDoc(doc(db, 'settings', 'pinnedMsg'), { text:'', active:false, updatedAt:Date.now() });
            const ta = document.getElementById('adm-pinnedMsg'); if (ta) ta.value='';
            if (msgEl) { msgEl.textContent='✅ Kaldırıldı.'; msgEl.style.color='#6ee7b7'; msgEl.style.display='block'; setTimeout(()=>msgEl.style.display='none',2000); }
        } catch(e) {}
    }

    _renderActivityChart() {
        const chartEl = document.getElementById('adm-activityChart');
        if (!chartEl) return;

        // Son 7 günün aktivitesini hesapla (lastSeen bazlı)
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            days.push({ label: d.toLocaleDateString('tr-TR', { weekday: 'short' }), date: d.toDateString(), count: 0 });
        }

        this.users.forEach(u => {
            const s = u.stats || {};
            if (s.goalDate) {
                const day = days.find(d => d.date === s.goalDate);
                if (day) day.count++;
            }
        });

        const maxCount = Math.max(...days.map(d => d.count), 1);
        chartEl.innerHTML = days.map(d => {
            const pct = Math.max(8, (d.count / maxCount) * 100);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                <div style="color:#f59e0b;font-size:0.75rem;font-family:sans-serif">${d.count}</div>
                <div style="width:100%;background:linear-gradient(to top,#f59e0b,#fcd34d);border-radius:4px 4px 0 0;height:${pct}%;min-height:6px;transition:height 0.5s"></div>
                <div style="color:#64748b;font-size:0.72rem;font-family:sans-serif">${d.label}</div>
            </div>`;
        }).join('');
    }

    async _grantAdmin(uid, email) {
        if (!window.FirebaseAuth) return;
        if (!confirm(`"${email || uid}" kullanıcısına Admin yetkisi verilsin mi?\n\nBu kullanıcı Ctrl+Q ile şifresiz giriş yapabilecek.`)) return;
        try {
            const { db, doc, setDoc, updateDoc } = window.FirebaseAuth;
            // Admins koleksiyonuna ekle
            await setDoc(doc(db, 'admins', uid), { uid, email, grantedAt: Date.now(), grantedBy: 'master' });
            // User dokümanına da işaretle
            await updateDoc(doc(db, 'users', uid), { isAdmin: true });
            // Güncelle
            const user = this.users.find(u => u.uid === uid);
            if (user) user.isAdmin = true;
            this._filterUsers();
            this._showAdminToast(`✅ ${email || uid} artık admin!`, '#6ee7b7');
        } catch(e) { alert('Hata: ' + e.message); }
    }

    async _revokeAdmin(uid) {
        if (!window.FirebaseAuth) return;
        const user = this.users.find(u => u.uid === uid);
        const name = user ? (user.email || uid) : uid;
        if (!confirm(`"${name}" kullanıcısının admin yetkisi alınsın mı?`)) return;
        try {
            const module = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const { db, doc, updateDoc } = window.FirebaseAuth;
            await module.deleteDoc(doc(db, 'admins', uid));
            await updateDoc(doc(db, 'users', uid), { isAdmin: false });
            if (user) user.isAdmin = false;
            this._filterUsers();
            this._showAdminToast(`✅ Admin yetkisi alındı.`, '#f87171');
        } catch(e) { alert('Hata: ' + e.message); }
    }

    async _sendUserNote(uid, name) {
        const msg = prompt(`📝 "${name}" kullanıcısına not/mesaj gönder:\n(Kullanıcı bir sonraki girişte görür)`);
        if (!msg || !msg.trim()) return;
        if (!window.FirebaseAuth) return;
        try {
            const { db, doc, setDoc } = window.FirebaseAuth;
            await setDoc(doc(db, 'userNotes', uid), {
                uid, message: msg.trim(), from: 'Admin', sentAt: Date.now(), read: false
            });
            this._showAdminToast(`✅ Not gönderildi!`, '#6ee7b7');
        } catch(e) { alert('Hata: ' + e.message); }
    }

    async _loadAdminCount() {
        if (!window.FirebaseAuth) return;
        try {
            const { db } = window.FirebaseAuth;
            const { collection, getDocs } = window.FirebaseAuth;
            const [admSnap, banSnap] = await Promise.all([
                getDocs(collection(db, 'admins')),
                getDocs(collection(db, 'banned'))
            ]);
            const el = id => document.getElementById(id);
            if (el('adm-totalAdmins')) el('adm-totalAdmins').textContent = admSnap.size;
            if (el('adm-totalBanned')) el('adm-totalBanned').textContent = banSnap.size;
        } catch(e) {}
    }

    // ============================================================
    // 🟢 ONLINE KULLANICILARI TAB
    // ============================================================
    async _initOnlineTab() {
        if (this._onlineTabReady) return;
        this._onlineTabReady = true;
        document.getElementById('adm-refreshOnline').onclick = () => this._loadOnlineUsers();
        await this._loadOnlineUsers();
        await this._renderSurahPopularity();
    }

    async _loadOnlineUsers() {
        if (!window.FirebaseAuth) return;
        const { db, collection, getDocs } = window.FirebaseAuth;
        const countEl = document.getElementById('adm-onlineCount');
        const listEl = document.getElementById('adm-onlineList');
        try {
            const snap = await getDocs(collection(db, 'presence'));
            const now = Date.now();
            const online = [];
            snap.forEach(d => {
                const data = d.data();
                const isOnline = data.online && (now - (data.lastSeen||0)) < 5 * 60 * 1000; // 5 dk
                if (isOnline) online.push(data);
            });
            countEl.innerHTML = `<span style="color:#6ee7b7">${online.length}</span> <span style="font-size:0.9rem;color:#64748b">online</span>`;
            listEl.innerHTML = online.length ? online.map(u => `
                <div style="background:#1e293b;border:1px solid #1a3a1a;border-left:3px solid #6ee7b7;border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:10px;font-family:sans-serif">
                    <div style="width:8px;height:8px;background:#6ee7b7;border-radius:50%;animation:pulse 1.5s infinite"></div>
                    <span style="color:#e2e8f0;font-size:0.88rem">${u.displayName||'Bilinmiyor'}</span>
                    <span style="color:#475569;font-size:0.75rem;margin-left:auto">${this._timeAgo(u.lastSeen)}</span>
                </div>`).join('') :
                '<div style="color:#475569;text-align:center;padding:1rem;font-family:sans-serif">Şu an aktif kullanıcı yok</div>';
        } catch(e) {
            countEl.textContent = '—';
            if (e.message?.includes('permission')) listEl.innerHTML = '<div style="color:#f87171;font-family:sans-serif;font-size:0.82rem">⚠️ Firestore kuralları: presence koleksiyonuna okuma izni ver</div>';
        }
    }

    async _renderSurahPopularity() {
        const el = document.getElementById('adm-surahChart');
        if (!el) return;
        const topSurahs = {};
        this.users.forEach(u => {
            (u.stats?.surahsOpened||[]).forEach(sid => { topSurahs[sid] = (topSurahs[sid]||0)+1; });
        });
        const sorted = Object.entries(topSurahs).sort((a,b)=>b[1]-a[1]).slice(0,10);
        if (!sorted.length) { el.innerHTML='<div style="color:#475569;text-align:center;font-family:sans-serif">Veri yok</div>'; return; }
        const max = sorted[0][1] || 1;
        const surahNames = {1:'Fatiha',2:'Bakara',3:'Al-i İmran',18:'Kehf',36:'Yasin',55:'Rahman',56:'Vakıa',67:'Mülk',78:'Nebe',114:'Nas'};
        el.innerHTML = `<div style="font-family:sans-serif;font-size:0.78rem;color:#94a3b8;margin-bottom:8px">En çok okunan 10 sure</div>` +
        sorted.map(([sid, cnt]) => {
            const pct = Math.round((cnt/max)*100);
            const name = surahNames[parseInt(sid)] || `Sure ${sid}`;
            return `<div style="margin-bottom:6px">
                <div style="display:flex;justify-content:space-between;color:#94a3b8;font-size:0.75rem;margin-bottom:2px"><span>${name}</span><span>${cnt} okuma</span></div>
                <div style="background:#334155;border-radius:4px;height:8px;overflow:hidden">
                    <div style="background:linear-gradient(90deg,#f59e0b,#fcd34d);height:100%;width:${pct}%;transition:width 0.5s"></div>
                </div>
            </div>`;
        }).join('');
    }

    // ============================================================
    // 🕐 AKTİVİTE ZEMANLİNE TAB
    // ============================================================
    _initTimelineTab() {
        if (this._timelineTabReady) return;
        this._timelineTabReady = true;
        const sel = document.getElementById('adm-timelineUser');
        this.users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.uid;
            opt.textContent = u.displayName || u.email || u.uid.slice(0,12);
            sel.appendChild(opt);
        });
        document.getElementById('adm-timelineLoad').onclick = () => this._loadTimeline(sel.value);
        document.getElementById('adm-exportPdfBtn').onclick = () => this._exportUserPdf(sel.value);
        document.getElementById('adm-exportFullBtn').onclick = () => this._exportFullJson();
        document.getElementById('adm-exportCsvBtn2').onclick = () => this._exportCSV();
    }

    async _loadTimeline(uid) {
        if (!uid) return;
        const el = document.getElementById('adm-timelineContent');
        el.innerHTML = '<div style="color:#64748b;font-family:sans-serif;text-align:center;padding:1rem">⏳ Yükleniyor...</div>';
        const user = this.users.find(u => u.uid === uid);
        if (!user) { el.innerHTML='<div style="color:#f87171;font-family:sans-serif">Kullanıcı bulunamadı</div>'; return; }
        const s = user.stats || {};
        const events = [
            { date: user.createdAt, icon:'🌱', text:'Hesap oluşturuldu' },
            { date: user.lastSeen, icon:'👁️', text:'Son görülme' },
            s.firstAyah && { date: s.firstAyah, icon:'🎵', text:'İlk ayet dinlendi' },
            s.firstHifz && { date: s.firstHifz, icon:'🧠', text:'İlk hafızlık seansı' },
        ].filter(Boolean).sort((a,b)=>(b.date||0)-(a.date||0));

        el.innerHTML = `
            <div style="font-family:sans-serif;font-size:0.82rem;color:#94a3b8;margin-bottom:10px">
                ${user.displayName||user.email||uid} — ${events.length} kayıt
            </div>
            ${events.map(e=>`
                <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #1e293b">
                    <span style="font-size:1.1rem">${e.icon}</span>
                    <div>
                        <div style="color:#e2e8f0;font-size:0.85rem">${e.text}</div>
                        <div style="color:#475569;font-size:0.72rem">${e.date ? new Date(e.date).toLocaleString('tr-TR') : '—'}</div>
                    </div>
                </div>`).join('')}
            <div style="margin-top:12px;background:#1e293b;border-radius:10px;padding:12px;font-size:0.78rem;color:#64748b">
                <div>📖 Okunan Sure: ${(s.surahsOpened||[]).length}</div>
                <div>🎵 Toplam Ayet: ${s.ayahCount||0}</div>
                <div>⏱️ Dinleme: ${this._formatDuration(s.listenSeconds||0)}</div>
                <div>🧠 Hafızlık: ${s.hifzCount||0} seans</div>
                <div>📿 Zikir: ${s.zikrTotal||0}</div>
                <div>🔥 Streak: ${s.streakDays||0} gün</div>
            </div>`;
    }

    async _exportUserPdf(uid) {
        if (!uid) { alert('Kullanıcı seçin'); return; }
        const user = this.users.find(u=>u.uid===uid);
        if (!user) return;
        const s = user.stats || {};
        const content = `KULLANICI RAPORU
================
Ad: ${user.displayName||'—'}
E-posta: ${user.email||'—'}
UID: ${user.uid}
Kayıt: ${user.createdAt?new Date(user.createdAt).toLocaleDateString('tr-TR'):'—'}
Son görülme: ${user.lastSeen?new Date(user.lastSeen).toLocaleString('tr-TR'):'—'}

İSTATİSTİKLER
=============
Okunan sure sayısı: ${(s.surahsOpened||[]).length}
Toplam ayet: ${s.ayahCount||0}
Dinleme süresi: ${this._formatDuration(s.listenSeconds||0)}
Hafızlık seans: ${s.hifzCount||0}
Zikir sayısı: ${s.zikrTotal||0}
Günlük streak: ${s.streakDays||0} gün
Günlük hedef: ${s.dailyGoal||10} ayet

Okunan Sureler: ${(s.surahsOpened||[]).join(', ')||'—'}`;

        const blob = new Blob([content], {type:'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `kullanici_raporu_${uid.slice(0,8)}.txt`;
        a.click();
        this._showAdminToast('✅ Rapor indirildi', '#6ee7b7');
    }

    _exportFullJson() {
        const data = { exportedAt: new Date().toISOString(), totalUsers: this.users.length, users: this.users };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `quran_portal_full_${Date.now()}.json`;
        a.click();
        this._showAdminToast('✅ JSON indirildi', '#6ee7b7');
    }

    // ============================================================
    // 📨 TOPLU BİLDİRİM
    // ============================================================
    async _initBulkNotification() {
        const btn = document.getElementById('adm-sendBulk');
        if (!btn || btn._bound) return;
        btn._bound = true;
        btn.onclick = async () => {
            const msg = document.getElementById('adm-bulkMsg').value.trim();
            const statusEl = document.getElementById('adm-bulkStatus');
            if (!msg) { alert('Mesaj boş olamaz'); return; }
            if (!confirm(`${this.users.length} kullanıcıya mesaj gönderilsin mi?\n"${msg.slice(0,60)}..."`)) return;
            btn.disabled = true; btn.textContent = '⏳ Gönderiliyor...';
            statusEl.style.display='block'; statusEl.style.color='#94a3b8';
            statusEl.textContent='0 / ' + this.users.length;
            const { db, doc, setDoc } = window.FirebaseAuth;
            let sent = 0;
            for (const user of this.users) {
                try {
                    await setDoc(doc(db, 'userNotes', user.uid), {
                        uid: user.uid, message: msg, from: 'Admin (Toplu)',
                        sentAt: Date.now(), read: false
                    });
                    sent++;
                    statusEl.textContent = `${sent} / ${this.users.length} gönderildi`;
                } catch(e) {}
            }
            btn.disabled=false; btn.textContent='📨 Herkese Gönder';
            statusEl.style.color='#6ee7b7';
            statusEl.textContent=`✅ ${sent} kullanıcıya gönderildi!`;
            this._showAdminToast(`✅ ${sent} kullanıcıya mesaj gönderildi`, '#6ee7b7');
        };
    }

    async _loadDashboardOnline() {
        if (!window.FirebaseAuth) return;
        const el = document.getElementById('adm-dashOnline');
        if (!el) return;
        try {
            const { db, collection, getDocs } = window.FirebaseAuth;
            const snap = await getDocs(collection(db, 'presence'));
            const now = Date.now();
            let cnt = 0;
            snap.forEach(d => {
                const data = d.data();
                if (data.online && (now-(data.lastSeen||0)) < 5*60*1000) cnt++;
            });
            el.textContent = cnt;
            el.style.color = cnt > 0 ? '#6ee7b7' : '#64748b';
        } catch(e) { el.textContent='—'; }
    }

    _timeAgo(ts) {
        if (!ts) return '—';
        const diff = Date.now() - ts;
        const m = Math.floor(diff/60000);
        if (m < 1) return 'az önce';
        if (m < 60) return `${m} dk önce`;
        const h = Math.floor(m/60);
        if (h < 24) return `${h} saat önce`;
        return `${Math.floor(h/24)} gün önce`;
    }

    _showAdminToast(msg, color) {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1e293b;color:${color};border:1px solid ${color}55;padding:10px 24px;border-radius:20px;font-family:sans-serif;font-size:0.9rem;z-index:9999999;pointer-events:none;transition:opacity 0.4s;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.5)`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 2500);
    }

    _formatDuration(seconds) {
        if (!seconds) return '0 dk';
        const min = Math.floor(seconds / 60);
        if (min < 60) return min + ' dk';
        return Math.floor(min/60) + 's ' + (min%60) + 'dk';
    }
}

// Global instance
const Admin = new AdminPanel();
document.addEventListener('DOMContentLoaded', () => Admin.init());
