// --- VELAR DEMO — No API calls, all data from DEMO object ---
function demoMock(successCb) {
    return {
        getDashboardData() {
            const d = DEMO;
            const data = { kpi: d.kpi, portfolio: d.portfolio, insights: d.insights, nwEvolution: d.nwEvolution, pacData: d.pacData, events: d.events, exchangeRates: d.exchangeRates, inflationIT: 2.0 };
            setTimeout(() => successCb(JSON.stringify(data)), 80);
        },
        getFinancialsData() { setTimeout(() => successCb(JSON.stringify(DEMO.financials)), 80); },
        getNW2026Data() { setTimeout(() => successCb(JSON.stringify(DEMO.financials)), 80); },
        getDividendsChartData() { setTimeout(() => successCb(JSON.stringify(DEMO.dividends)), 80); },
        getDividendsData() { setTimeout(() => successCb(JSON.stringify(DEMO.dividends)), 80); },
        getCashFlowData() { setTimeout(() => successCb(JSON.stringify(DEMO.cashflow)), 80); },
        getAllocationData() { setTimeout(() => successCb(JSON.stringify(DEMO.allocation)), 80); },
        getHistoryData() { setTimeout(() => successCb(JSON.stringify(DEMO.history)), 80); },
        getHallOfFameData() { setTimeout(() => successCb(JSON.stringify(DEMO.hallOfFame)), 80); },
        getMilestonesData() { setTimeout(() => successCb(JSON.stringify(DEMO.milestones)), 80); },
        clearAppCache() { setTimeout(() => successCb('{}'), 50); },
        saveEvent() { setTimeout(() => successCb(JSON.stringify({ success: true, events: DEMO.events })), 50); },
        deleteEvent() { setTimeout(() => successCb(JSON.stringify({ success: true, events: DEMO.events })), 50); },
        changePin() { setTimeout(() => successCb(JSON.stringify({ success: true })), 50); },
        // Chain methods
        withSuccessHandler(cb) { return demoMock(cb); },
        withFailureHandler() { return this; }
    };
}
const google = { script: { run: demoMock(() => { }) } };
// --- END DEMO MOCK ---

/**
     * APP LOGIC
     */

window.fullChartData = {};

// Currency Global State
window.EXCHANGE_RATES = { EUR: 1 };
window.CURRENT_CURRENCY = 'EUR';

// Theme Logic
function initTheme() {
    if (localStorage.theme === 'dark') {
        document.documentElement.classList.add('dark');
        updateThemeIcon('dark');
        updatePWAThemeColor(true);
    } else if (localStorage.theme === 'light') {
        document.documentElement.classList.remove('dark');
        updateThemeIcon('light');
        updatePWAThemeColor(false);
    } else {
        // Auto (System)
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) {
            document.documentElement.classList.add('dark');
            updatePWAThemeColor(true);
        } else {
            document.documentElement.classList.remove('dark');
            updatePWAThemeColor(false);
        }
        updateThemeIcon('auto');
    }
}

function updateThemeIcon(mode) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;

    // Legacy support (booleans)
    if (mode === true) mode = 'dark';
    if (mode === false) mode = 'light';

    if (mode === 'dark') {
        icon.className = 'fas fa-moon text-base sm:text-lg text-blue-400';
    } else if (mode === 'light') {
        icon.className = 'fas fa-sun text-base sm:text-lg text-amber-500';
    } else {
        icon.className = 'fas fa-circle-half-stroke text-base sm:text-lg text-slate-500 dark:text-slate-400';
    }
}

function toggleTheme() {
    const isAuto = !('theme' in localStorage);

    if (isAuto) {
        // Switch to Light
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        updateThemeIcon('light');
        updatePWAThemeColor(false);
    } else if (localStorage.theme === 'light') {
        // Switch to Dark
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        updateThemeIcon('dark');
        updatePWAThemeColor(true);
    } else {
        // Switch to Auto
        localStorage.removeItem('theme');
        initTheme(); // Applies system pref and sets 'auto' icon
    }

    // Redraw charts to update colors
    if (window.fullChartData.main) renderMainChart(window.fullChartData.main);
    if (window.fullChartData.pac) renderPACChart(window.fullChartData.pac);
}

/**
 * Privacy Mode Toggle
 * Blurs all monetary values and sensitive financial data across the app.
 */
function togglePrivacyMode() {
    const body = document.body;
    const icon = document.getElementById('privacy-icon');
    const isPrivate = body.classList.toggle('privacy-mode');

    if (icon) {
        icon.className = isPrivate ? 'fas fa-eye-slash text-base sm:text-lg' : 'fas fa-eye text-base sm:text-lg';
    }

    localStorage.setItem('NW_PRIVACY', isPrivate ? '1' : '0');
}

// Restore privacy mode on load
(function restorePrivacy() {
    if (localStorage.getItem('NW_PRIVACY') === '1') {
        document.body.classList.add('privacy-mode');
        const icon = document.getElementById('privacy-icon');
        if (icon) icon.className = 'fas fa-eye-slash text-base sm:text-lg';
    }
})();



function updatePWAThemeColor(isDark) {
    const metaThemeColor = document.getElementById('meta-theme-color');
    if (metaThemeColor) {
        // #0f172a is slate-900 (Dark background), #f8fafc is slate-50 (Light background)
        metaThemeColor.setAttribute("content", isDark ? "#0f172a" : "#f8fafc");
    }
}

// =============================================
// SETTINGS MODAL
// =============================================
function syncSettingsToggles() {
    const isDark = document.documentElement.classList.contains('dark');
    const isPrivate = document.body.classList.contains('privacy-mode');
    const isAuto = !('theme' in localStorage);

    const themeToggle = document.getElementById('settings-theme-toggle');
    const privacyToggle = document.getElementById('settings-privacy-toggle');
    const themeLabel = document.getElementById('settings-theme-value');

    if (themeToggle) themeToggle.classList.toggle('active', isDark);
    if (privacyToggle) privacyToggle.classList.toggle('active', isPrivate);
    if (themeLabel) {
        if (isAuto) {
            themeLabel.textContent = 'Auto (System)';
        } else {
            themeLabel.textContent = isDark ? 'Scuro' : 'Chiaro';
        }
    }
}

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    syncSettingsToggles();
    renderDemoSettings();

    const currSelect = document.getElementById('settings-currency-select');
    const mainSelect = document.getElementById('currencySelector');
    if (currSelect && mainSelect) currSelect.value = mainSelect.value;

    // Show modal with animation
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.settings-panel').classList.remove('-translate-x-full');
    });
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    modal.classList.add('opacity-0');
    modal.querySelector('.settings-panel').classList.add('-translate-x-full');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}



const router = {
    navigate: (pageId) => {
        // Hide all views
        document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

        // Show selected view
        const view = document.getElementById(`view-${pageId}`);
        if (view) view.classList.remove('hidden');

        // Update nav
        const btn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
        if (btn) btn.classList.add('active');

        // Trigger explicit load if needed
        if (pageId === 'financials') loadFinancialsDetails();
        if (pageId === 'cashflow') loadCashFlowDetails();
        if (pageId === 'allocation') loadAllocationDetails();
        if (pageId === 'history') loadHistoryDetails();
    }
};

// Global State
window.APP_EVENTS = [];
window.CURRENT_SANKEY_FILTER = 'total'; // default
window.__CASHBFLOW_DATA__ = null; // store for re-rending with filters

const app = {
    ui: {
        openEventModal: () => {
            const modal = document.getElementById('event-modal');
            if (modal) {
                app.ui.renderEventList(); // Refresh list before opening
                modal.classList.remove('hidden');
                // Small delay to allow display block to process before opacity transition
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    modal.querySelector('div').classList.remove('scale-95');
                }, 10);
            }
        },
        closeEventModal: () => {
            const modal = document.getElementById('event-modal');
            if (modal) {
                modal.classList.add('opacity-0');
                modal.querySelector('div').classList.add('scale-95');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300); // match transition duration
            }
        },
        saveNewEvent: () => {
            const titleInput = document.getElementById('event-title');
            const dateInput = document.getElementById('event-date');
            const colorInput = document.getElementById('event-color');

            const title = titleInput.value.trim();
            const date = dateInput.value;
            const color = colorInput.value;

            if (!title || !date) {
                alert("Per favore inserisci Titolo e Data dell'evento.");
                return;
            }

            const btnText = document.getElementById('event-save-text');
            const btnSpinner = document.getElementById('event-save-spinner');

            btnText.textContent = "Salvataggio...";
            btnSpinner.classList.remove('hidden');

            const newEvent = { title, date, color };

            google.script.run
                .withSuccessHandler((res) => {
                    btnText.textContent = "Salva Evento";
                    btnSpinner.classList.add('hidden');

                    if (res.success) {
                        window.APP_EVENTS = res.events || [];
                        app.ui.closeEventModal();

                        // Reset inputs
                        titleInput.value = '';
                        dateInput.value = '';

                        // Redraw current view
                        app.fetchDashboardData();

                        // Re-render list if modal stays open (not needed here since modal closes, but good practice)
                        app.ui.renderEventList();
                    } else {
                        alert("Errore nel salvataggio: " + res.error);
                    }
                })
                .withFailureHandler((err) => {
                    btnText.textContent = "Salva Evento";
                    btnSpinner.classList.add('hidden');
                    alert("Errore di rete: " + err.message);
                })
                .saveEvent(newEvent);
        },
        renderEventList: () => {
            const listContainer = document.getElementById('existing-events-list');
            const countBadge = document.getElementById('events-count-badge');
            if (!listContainer || !countBadge) return;

            // Clear existing
            listContainer.innerHTML = '';

            const events = window.APP_EVENTS || [];
            countBadge.textContent = events.length;

            if (events.length === 0) {
                listContainer.innerHTML = '<div class="text-xs text-slate-500 text-center py-4 italic">Nessun evento salvato.</div>';
                return;
            }

            // Sort by date descending for UI display
            const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedEvents.forEach(evt => {
                const evtDate = new Date(evt.date).toLocaleDateString();
                const item = document.createElement('div');
                item.className = "flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700";
                item.innerHTML = `
                        <div class="flex items-center space-x-3 overflow-hidden">
                            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${evt.color || 'var(--color-blue-500)'}"></div>
                            <div class="flex flex-col truncate">
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">${evt.title}</span>
                                <span class="text-xs text-slate-500">${evtDate}</span>
                            </div>
                        </div>
                        <button onclick="app.ui.deleteEvent('${evt.id}')" class="ml-2 text-slate-400 hover:text-red-500 transition-colors p-1" title="Elimina">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    `;
                listContainer.appendChild(item);
            });
        },
        deleteEvent: (eventId) => {
            if (!confirm("Sei sicuro di voler eliminare questo evento?")) return;

            const btn = event.currentTarget;
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
                btn.disabled = true;
            }

            google.script.run
                .withSuccessHandler((res) => {
                    if (res.success) {
                        window.APP_EVENTS = res.events || [];
                        app.ui.renderEventList();
                        app.fetchDashboardData(); // Redraw chart
                    } else {
                        alert("Errore nell'eliminazione: " + res.error);
                        if (btn) {
                            btn.innerHTML = '<i class="fas fa-trash-alt text-sm"></i>';
                            btn.disabled = false;
                        }
                    }
                })
                .withFailureHandler((err) => {
                    alert("Errore di rete: " + err.message);
                    if (btn) {
                        btn.innerHTML = '<i class="fas fa-trash-alt text-sm"></i>';
                        btn.disabled = false;
                    }
                })
                .deleteEvent(eventId);
        }
    },
    liveSync: (btn) => {
        const ping = document.getElementById('sync-ping');
        const dot = document.getElementById('sync-dot');
        const text = document.getElementById('sync-text');

        // UI: Syncing state (Yellow/Orange spinning)
        if (ping) ping.classList.replace('bg-emerald-400', 'bg-amber-400');
        if (dot) dot.classList.replace('bg-emerald-500', 'bg-amber-500');
        if (text) text.textContent = "Syncing...";
        btn.classList.add('animate-pulse', 'pointer-events-none');

        google.script.run
            .withSuccessHandler(() => {
                // UI: Success state
                if (ping) ping.classList.replace('bg-amber-400', 'bg-emerald-400');
                if (dot) dot.classList.replace('bg-amber-500', 'bg-emerald-500');
                if (text) text.textContent = "Live Sync";
                btn.classList.remove('animate-pulse', 'pointer-events-none');

                // Reload the active view's data
                const activeView = document.querySelector('.page-view:not(.hidden)');
                if (activeView && activeView.id === 'view-dashboard') {
                    app.fetchDashboardData();
                } else if (activeView && activeView.id === 'view-financials') {
                    loadFinancialsDetails();
                } else if (activeView && activeView.id === 'view-cashflow') {
                    loadCashFlowDetails();
                } else if (activeView && activeView.id === 'view-history') {
                    loadHistoryDetails();
                }
            })
            .withFailureHandler((err) => {
                console.error("Cache clear failed", err);
                if (ping) ping.classList.replace('bg-amber-400', 'bg-rose-400');
                if (dot) dot.classList.replace('bg-amber-500', 'bg-rose-500');
                if (text) text.textContent = "Error";
                btn.classList.remove('animate-pulse', 'pointer-events-none');

                setTimeout(() => {
                    if (ping) ping.classList.replace('bg-rose-400', 'bg-emerald-400');
                    if (dot) dot.classList.replace('bg-rose-500', 'bg-emerald-500');
                    if (text) text.textContent = "Live Sync";
                }, 3000);
            })
            .clearAppCache();
    },

    setSankeyFilter: (filter) => {
        window.CURRENT_SANKEY_FILTER = filter;

        // Update active button state
        document.querySelectorAll('.sankey-filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-emerald-500', 'text-white', 'border-emerald-500');
            btn.classList.add('bg-white', 'text-slate-900', 'border-slate-200', 'dark:bg-slate-800', 'dark:border-slate-700', 'dark:text-white');
        });
        const activeBtn = document.getElementById(`sankey-btn-${filter}`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-white', 'text-slate-900', 'border-slate-200', 'dark:bg-slate-800', 'dark:border-slate-700', 'dark:text-white');
            activeBtn.classList.add('active', 'bg-emerald-500', 'text-white', 'border-emerald-500');
        }

        if (window.__CASHFLOW_DATA__) {
            renderCashFlowSankey(window.__CASHFLOW_DATA__);
        }
    },

    init: () => {
        initTheme();
        initDashboardGrid(); // INIZIALIZZA GRIDSTACK UI
        app.fetchDashboardData();
    },

    changeCurrency: (newCurrency) => {
        window.CURRENT_CURRENCY = newCurrency;

        // Re-render currently active view
        const activeView = document.querySelector('.page-view:not(.hidden)');
        if (activeView && activeView.id === 'view-dashboard') {
            // If we have full raw data, just re-run the render function with it
            if (window.__LAST_DASHBOARD_DATA__) {
                app.renderDashboard(window.__LAST_DASHBOARD_DATA__, true);
            } else {
                app.fetchDashboardData();
            }
        } else if (activeView && activeView.id === 'view-financials') {
            loadFinancialsDetails();
        } else if (activeView && activeView.id === 'view-cashflow') {
            loadCashFlowDetails();
        }
    },

    // ... (rest of app object matches previous, no change needed here usually, checking context)
    fetchDashboardData: () => {
        // Show loading state, hide content is handled by initial HTML state

        google.script.run
            .withSuccessHandler(app.renderDashboard)
            .withFailureHandler(app.handleError)
            .getDashboardData();
    },

    renderDashboard: (jsonString, skipAnimations = false) => {
        // Check if it's already an object (used during fast re-render for currency switch)
        const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

        if (typeof jsonString === 'string') {
            window.__LAST_DASHBOARD_DATA__ = data;
        }
        console.log("Dashboard Data:", data);

        // Render AI Insights
        const insightsContainer = document.getElementById('smart-insights-container');
        const insightsList = document.getElementById('ai-insights-list');
        if (data.insights && data.insights.length > 0 && insightsContainer && insightsList) {
            insightsList.innerHTML = data.insights.map(insight => {
                let colorClass = "from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800/30";
                if (insight.type === "success") colorClass = "from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800/30";
                if (insight.type === "warning") colorClass = "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800/30";
                if (insight.type === "info") colorClass = "from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800/30";

                return `
                <div class="glass-panel p-4 rounded-xl border bg-gradient-to-br ${colorClass} hover:-translate-y-1 transition-transform duration-300">
                    <div class="flex items-start space-x-3">
                        <div class="text-2xl">${insight.icon || '✨'}</div>
                        <div>
                            <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">${insight.title}</h4>
                            <p class="text-xs text-slate-600 dark:text-slate-400 leading-snug">${insight.message}</p>
                        </div>
                    </div>
                </div>`;
            }).join('');
            insightsContainer.classList.remove('hidden');
        } else if (insightsContainer) {
            insightsContainer.classList.add('hidden');
        }


        // Store for filtering
        window.fullChartData = {
            main: data.nwEvolution,
            pac: data.pacData
        };

        // Store Events and Rates
        window.APP_EVENTS = data.events || [];
        if (data.exchangeRates) {
            window.EXCHANGE_RATES = data.exchangeRates;
        }

        // Hide loader
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('view-dashboard').classList.remove('hidden');

        // Init GridStack now that the container is visible and has dimensions
        DashboardLayout.init();

        // Render KPI
        const { kpi } = data;
        document.getElementById('kpi-total-nw').textContent = formatCurrency(kpi.totalNW);

        const ytdEl = document.getElementById('kpi-ytd-val');
        const ytdPercEl = document.getElementById('kpi-ytd-perc');
        const momEl = document.getElementById('kpi-mom-val');
        const momPercEl = document.getElementById('kpi-mom-perc');

        // YTD
        if (ytdEl) ytdEl.textContent = formatCurrency(kpi.ytdVar, true);
        if (ytdPercEl) ytdPercEl.textContent = `${kpi.ytdPerc > 0 ? '+' : ''}${kpi.ytdPerc.toFixed(1)}%`;

        if (kpi.ytdVar >= 0) {
            if (ytdEl) ytdEl.className = "text-3xl font-bold text-emerald-400 tracking-tight";
            if (ytdPercEl) ytdPercEl.className = "text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300";
        } else {
            if (ytdEl) ytdEl.className = "text-3xl font-bold text-rose-400 tracking-tight";
            if (ytdPercEl) ytdPercEl.className = "text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300";
        }

        // Surplus (Market Return)
        const surplusValEl = document.getElementById('kpi-surplus-val');
        const surplusPercEl = document.getElementById('kpi-surplus-perc');

        if (surplusValEl && surplusPercEl) {
            const sVar = kpi.surplusVar || 0;
            const sPerc = kpi.surplusPerc || 0;

            surplusValEl.textContent = formatCurrency(sVar, true);
            surplusPercEl.textContent = `${sPerc > 0 ? '+' : ''}${sPerc.toFixed(2)}%`;

            if (sVar >= 0) {
                surplusValEl.className = "text-xs font-mono font-bold text-emerald-400";
                surplusPercEl.className = "text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300";
            } else {
                surplusValEl.className = "text-xs font-mono font-bold text-rose-400";
                surplusPercEl.className = "text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300";
            }

            // Debug values
            const surplusDebugEl = document.getElementById('kpi-surplus-debug');
            if (surplusDebugEl) {
                surplusDebugEl.classList.remove('hidden');
                surplusDebugEl.innerHTML = `<strong>Assets:</strong> ${kpi.debugSurplusStr || 'None found'} <br/> <strong>Dietz:</strong> ${kpi.debugDenominator || '0'}`;
            }
        }

        // MoM
        if (momEl && momPercEl) {
            momEl.textContent = formatCurrency(kpi.momVar || 0, true);
            momPercEl.textContent = `${(kpi.momPerc || 0) > 0 ? '+' : ''}${(kpi.momPerc || 0).toFixed(1)}%`;

            if ((kpi.momVar || 0) >= 0) {
                momEl.className = "text-2xl font-bold text-emerald-400 tracking-tight";
                momPercEl.className = "text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300";
            } else {
                momEl.className = "text-2xl font-bold text-rose-400 tracking-tight";
                momPercEl.className = "text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300";
            }
        }

        // Render Main Chart
        renderMainChart(data.nwEvolution);

        // Render PAC Chart
        renderPACChart(data.pacData);

        // Render Portfolio Breakdown (Inside NW Card)
        renderPortfolioBreakdown(data.portfolio, data.kpi.totalNW);

        // Fetch and Render Milestones
        google.script.run
            .withSuccessHandler((json) => {
                const milestonesRes = JSON.parse(json);
                renderMilestones(milestonesRes);
            })
            .withFailureHandler((err) => {
                console.error("Failed to load milestones:", err);
            })
            .getMilestonesData();
    },

    handleError: (error) => {
        console.error("GAS Error:", error);

        // Nascondi il loader se presente
        const loader = document.getElementById('loading-state');
        if (loader) loader.classList.add('hidden');

        // Mostra l'errore nella vista dashboard (o in quella attiva)
        let activeView = document.querySelector('.page-view:not(.hidden)');
        if (!activeView) {
            activeView = document.getElementById('view-dashboard');
            if (activeView) activeView.classList.remove('hidden');
        }

        if (activeView) {
            activeView.innerHTML = `
                <div class="p-6 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/30 text-center">
                    <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
                    <p class="font-bold text-lg mb-1">Errore di comunicazione col server</p>
                    <p class="text-sm font-mono bg-rose-900/20 p-2 rounded">${error.message}</p>
                    <p class="text-sm mt-4 text-slate-400">Controlla la Console per maggiori dettagli o verifica il deployment di Google Apps Script.</p>
                </div>
            `;
        }
    }
};

/**
 * PAGE LOADERS
 */

function loadFinancialsDetails() {
    const container = document.getElementById('financials-content');
    container.innerHTML = '<div class="flex justify-center p-8"><div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>';

    google.script.run
        .withSuccessHandler((json) => {
            const data = JSON.parse(json);
            container.innerHTML = ''; // Clear loader

            // Render Main Assets
            renderFinancialsTable(data.headers, data.rows, container, "Assets & Net Worth");



            // Fetch Dividends Chart Data concurrently
            google.script.run
                .withSuccessHandler((divJson) => {
                    const divData = JSON.parse(divJson);
                    renderDividendsChart(divData);
                })
                .getDividendsData();
        })
        .withFailureHandler((err) => {
            container.innerHTML = `<p class="text-rose-400">Error: ${err.message}</p>`;
        })
        .getNW2026Data();
}

function loadCashFlowDetails() {
    const container = document.getElementById('cashflow-tables');
    if (!container) return;

    container.innerHTML = '<div class="flex justify-center p-8"><div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>';

    google.script.run
        .withSuccessHandler((json) => {
            const data = JSON.parse(json);
            window.__CASHFLOW_DATA__ = data;
            renderCashFlowDashboard(data, container);
        })
        .withFailureHandler((err) => {
            container.innerHTML = `<p class="text-rose-400">Error: ${err.message}</p>`;
        })
        .getCashFlowData();
}

function renderCashFlowDashboard(data, container) {
    if (data.error) {
        container.innerHTML = `<p class="text-rose-400">Database Error: ${data.error}</p>`;
        return;
    }

    // Clear loader
    container.innerHTML = '';

    // 1. Render Charts
    renderCashFlowWaterfall(data);
    renderCashFlowChart(data);
    renderCashFlowSankey(data);

    // 2. Render Tables
    // Income Table
    renderCashFlowSection(data.months, data.income, container, "Income", "text-emerald-500 dark:text-emerald-400", "bg-emerald-500/10");

    // Spending Table
    renderCashFlowSection(data.months, data.spending, container, "Spending", "text-rose-500 dark:text-rose-400", "bg-rose-500/10");
}

function renderCashFlowSection(months, rows, container, title, titleColorClass, bgClass) {
    if (!rows || rows.length === 0) return;

    // Calculate Totals per month
    const monthlyTotals = new Array(12).fill(0);
    rows.forEach(r => {
        r.values.forEach((v, i) => monthlyTotals[i] += v);
    });
    const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);

    let html = `
        <div class="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center ${bgClass}">
                <h3 class="text-xl font-bold ${titleColorClass}">${title}</h3>
                <span class="text-lg font-mono text-slate-800 dark:text-white opacity-80 privacy-sensitive">Total: ${formatCurrency(grandTotal)}</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-center text-slate-600 dark:text-slate-400">
                    <thead class="text-xs text-slate-600 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th class="px-3 py-3 text-left sticky left-0 bg-slate-200 dark:bg-slate-900 z-10 w-32">Category</th>
                            ${months.map(m => `<th class="px-2 py-3 min-w-[60px]">${m}</th>`).join('')}
                            <th class="px-3 py-3 font-bold text-slate-700 dark:text-slate-100 bg-slate-200 dark:bg-slate-800">TOT</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 dark:divide-slate-700/50">
        `;

    rows.forEach(row => {
        html += `<tr class="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">`;
        // Category Name
        html += `<td class="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700/50">${row.category}</td>`;

        // Monthly Values
        row.values.forEach(val => {
            const isZero = val === 0;
            const style = isZero ? 'text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200';
            html += `<td class="px-2 py-2 ${style}"><span class="privacy-sensitive">${isZero ? '-' : formatCurrency(val).replace('€', '').trim()}</span></td>`;
        });

        // Row Total
        html += `<td class="px-3 py-2 font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/30 border-l border-slate-200 dark:border-slate-700/50"><span class="privacy-sensitive">${formatCurrency(row.total)}</span></td>`;

        html += `</tr>`;
    });

    // Footer (Totals)
    html += `
            <tr class="bg-slate-100 dark:bg-slate-800/80 font-bold text-xs uppercase text-slate-700 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600">
                <td class="px-3 py-3 text-left sticky left-0 bg-slate-200 dark:bg-slate-800 z-10">Total</td>
                 ${monthlyTotals.map(t => `<td class="px-2 py-3"><span class="privacy-sensitive">${formatCurrency(t).replace('€', '').trim()}</span></td>`).join('')}
                 <td class="px-3 py-3 text-emerald-600 dark:text-emerald-300"><span class="privacy-sensitive">${formatCurrency(grandTotal)}</span></td>
            </tr>
        `;

    html += `   </tbody>
                </table>
            </div>
        </div>`;

    container.insertAdjacentHTML('beforeend', html);
}

function renderCashFlowChart(data) {
    const ctx = document.getElementById('cashFlowChart');
    if (!ctx) return;

    // Calculate Totals for Chart
    const incomeTotals = new Array(12).fill(0);
    const spendingTotals = new Array(12).fill(0);

    data.income.forEach(row => row.values.forEach((v, i) => incomeTotals[i] += v));
    data.spending.forEach(row => row.values.forEach((v, i) => spendingTotals[i] += v));

    if (window.cashFlowChartInstance) window.cashFlowChartInstance.destroy();

    window.cashFlowChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeTotals,
                    backgroundColor: '#34d399', // emerald-400
                    borderRadius: 4,
                },
                {
                    label: 'Spending',
                    data: spendingTotals,
                    backgroundColor: '#f43f5e', // rose-500
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { labels: { color: '#cbd5e1' } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: { label: (c) => ` ${c.dataset.label}: ${formatCurrency(c.raw)}` }
                }
            }
        }
    });
}

function renderDividendsChart(data) {
    const ctx = document.getElementById('dividendsChart');
    if (!ctx) return;

    if (window.dividendsChartInstance) {
        window.dividendsChartInstance.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textCol = isDark ? '#cbd5e1' : '#475569';
    const gridCol = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    // Array of nice distinct colors for various dividend streams
    const colorPalette = [
        '#10b981', // Emerald
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#0ea5e9', // Sky
        '#14b8a6', // Teal
    ];

    let colorIndex = 0;
    const chartDatasets = [];
    let grandTotal = 0;

    Object.keys(data.datasets).forEach(assetName => {
        const d = data.datasets[assetName];
        grandTotal += d.reduce((a, b) => a + Number(b || 0), 0);
        chartDatasets.push({
            label: assetName,
            data: d,
            backgroundColor: colorPalette[colorIndex % colorPalette.length],
            borderRadius: 2,
            // Optional: remove stack property if you want grouped bars instead of stacked
            stack: 'Stack 0'
        });
        colorIndex++;
    });

    // Update total badge
    const totalEl = document.getElementById('dividends-total');
    if (totalEl) {
        totalEl.textContent = formatCurrency(grandTotal);
    }

    window.dividendsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: chartDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: textCol, maxRotation: 45, minRotation: 45, font: { size: window.innerWidth < 640 ? 9 : 12 } }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: gridCol },
                    ticks: { color: textCol, maxTicksLimit: window.innerWidth < 640 ? 6 : 10, font: { size: window.innerWidth < 640 ? 9 : 12 } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textCol, usePointStyle: true, boxWidth: 8 }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (c) => ` ${c.dataset.label}: ${formatCurrency(c.raw)}`,
                        footer: (tooltipItems) => {
                            let total = 0;
                            tooltipItems.forEach(function (tooltipItem) {
                                total += tooltipItem.raw;
                            });
                            return "Totale: " + formatCurrency(total);
                        }
                    }
                }
            }
        }
    });
}

function renderCashFlowSankey(data) {
    const ctx = document.getElementById('sankeyChart');
    if (!ctx) return;

    // Initialize ECharts instance
    if (window.cashFlowSankeyInstance) {
        window.cashFlowSankeyInstance.dispose();
    }

    const isDark = document.documentElement.classList.contains('dark');
    window.cashFlowSankeyInstance = echarts.init(ctx, isDark ? 'dark' : null, { renderer: 'svg' });

    // DETERMINE TIME FILTER RANGE
    const filter = window.CURRENT_SANKEY_FILTER || 'total';
    const currentMonthIndex = new Date().getMonth();
    let startIdx = 0;
    let endIdx = 11;

    if (filter === 'month') {
        startIdx = currentMonthIndex;
        endIdx = currentMonthIndex;
    } else if (filter === 'ytd') {
        startIdx = 0;
        endIdx = currentMonthIndex;
    }

    // Calculate Category Totals based on Time Filter
    const incomeTotals = {};
    const spendingTotals = {};
    let grandTotalIncome = 0;
    let grandTotalSpending = 0;

    if (filter === 'total' && data.allTime) {
        if (data.allTime.income) {
            Object.keys(data.allTime.income).forEach(cat => {
                const total = data.allTime.income[cat];
                if (total > 0) {
                    incomeTotals[cat] = total;
                    grandTotalIncome += total;
                }
            });
        }
        if (data.allTime.spending) {
            Object.keys(data.allTime.spending).forEach(cat => {
                const total = data.allTime.spending[cat];
                if (total > 0) {
                    spendingTotals[cat] = total;
                    grandTotalSpending += total;
                }
            });
        }
    } else {
        if (data.income) {
            data.income.forEach(row => {
                let total = 0;
                for (let i = startIdx; i <= endIdx; i++) {
                    total += row.values[i] || 0;
                }
                if (total > 0) {
                    incomeTotals[row.category] = total;
                    grandTotalIncome += total;
                }
            });
        }

        if (data.spending) {
            data.spending.forEach(row => {
                let total = 0;
                for (let i = startIdx; i <= endIdx; i++) {
                    total += row.values[i] || 0;
                }
                if (total > 0) {
                    spendingTotals[row.category] = total;
                    grandTotalSpending += total;
                }
            });
        }
    }

    const savings = grandTotalIncome - grandTotalSpending;
    const mainNodeName = "Total Budget";

    // Build Nodes
    const nodes = [];
    const links = [];

    // 1. Central Node
    nodes.push({ name: mainNodeName, itemStyle: { color: isDark ? '#3b82f6' : '#2563eb' } }); // Blue

    // 2. Income Nodes & Links
    Object.keys(incomeTotals).forEach(cat => {
        nodes.push({ name: cat, itemStyle: { color: isDark ? '#10b981' : '#059669' } }); // Emerald
        links.push({
            source: cat,
            target: mainNodeName,
            value: incomeTotals[cat]
        });
    });

    // Extract Real PAC Investments based on Time Filter
    let totalInvestments = 0;
    if (filter === 'total' && data.allTime) {
        totalInvestments = data.allTime.pacTotal || 0;
    } else if (data.pacValues) {
        for (let i = startIdx; i <= endIdx; i++) {
            totalInvestments += data.pacValues[i] || 0;
        }
    }

    // Remove any residual tracking from spending lines just in case, ensuring it's not double-counted or drawn twice
    const investmentCategories = ['Investimenti', 'PAC', 'VWCE', 'Investimenti (PAC)'];
    let foundInvestmentKey = "Investments (PAC)";

    Object.keys(spendingTotals).forEach(cat => {
        if (investmentCategories.some(invCat => cat.toLowerCase().includes(invCat.toLowerCase()))) {
            foundInvestmentKey = cat;
            delete spendingTotals[cat]; // Remove it from normal spending flow
        }
    });

    // 3. Savings & Investment Routing (PUSH FIRST to place at the top)
    // The total generated savings BEFORE subtracting investments
    let grossSavingsForRouting = savings + totalInvestments;

    if (grossSavingsForRouting > 0) {
        nodes.push({ name: "Total Savings", itemStyle: { color: isDark ? '#34d399' : '#10b981' } }); // Green
        links.push({
            source: mainNodeName,
            target: "Total Savings",
            value: grossSavingsForRouting
        });

        // Route from Total Savings -> Investments
        if (totalInvestments > 0) {
            const invNodeName = foundInvestmentKey || "Investments (PAC)";
            nodes.push({ name: invNodeName, itemStyle: { color: isDark ? '#8b5cf6' : '#7c3aed' } }); // Purple
            links.push({
                source: "Total Savings",
                target: invNodeName,
                value: totalInvestments
            });
        }

        // Route the remaining liquid savings
        const uninvestedSavings = grossSavingsForRouting - totalInvestments;
        if (uninvestedSavings > 0) {
            nodes.push({ name: "Liquid Assets", itemStyle: { color: isDark ? '#0ea5e9' : '#0284c7' } }); // Sky Blue
            links.push({
                source: "Total Savings",
                target: "Liquid Assets",
                value: uninvestedSavings
            });
        }

    } else if (savings < 0) {
        // Extreme edge case: Deficit even including investments (or total deficit)
        nodes.push({ name: "From Savings/Deficit", itemStyle: { color: isDark ? '#fbbf24' : '#d97706' } }); // Amber
        links.push({
            source: "From Savings/Deficit",
            target: mainNodeName,
            value: Math.abs(savings)
        });

        if (totalInvestments > 0) {
            // If they still managed to invest during a deficit month, it flowed directly from deficit -> budget -> investments
            const invNodeName = foundInvestmentKey || "Investments (PAC)";
            nodes.push({ name: invNodeName, itemStyle: { color: isDark ? '#8b5cf6' : '#7c3aed' } });
            links.push({
                source: mainNodeName,
                target: invNodeName,
                value: totalInvestments
            });
        }
    }

    // 4. Normal Spending Nodes & Links (PUSHED AFTER so they appear below investments)
    Object.entries(spendingTotals)
        .sort((a, b) => b[1] - a[1]) // Sort largest expenses first
        .forEach(([cat, val]) => {
            nodes.push({ name: cat, itemStyle: { color: isDark ? '#f43f5e' : '#e11d48' } }); // Rose
            links.push({
                source: mainNodeName,
                target: cat,
                value: val
            });
        });

    // Handle completely empty data edge case
    if (nodes.length <= 1) {
        window.cashFlowSankeyInstance.dispose();
        ctx.innerHTML = '<p class="text-slate-500 text-center py-10">No cash flow data to map.</p>';
        return;
    }

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            textStyle: {
                color: isDark ? '#e2e8f0' : '#1e293b'
            },
            formatter: function (params) {
                let val = formatCurrency(params.data.value);
                if (params.dataType === 'node') {
                    return `<strong>${params.data.name}</strong>: ${val}`;
                } else if (params.dataType === 'edge') {
                    return `${params.data.source} → ${params.data.target}<br/><strong>${val}</strong>`;
                }
            }
        },
        series: {
            type: 'sankey',
            layout: 'none',
            layoutIterations: 0, // Forces explicit ordering based on array sequence

            emphasis: {
                focus: 'adjacency'
            },
            nodeAlign: 'justify',
            data: nodes,
            links: links,
            itemStyle: {
                borderWidth: 0,
                borderColor: '#aaa'
            },
            lineStyle: {
                color: 'source', // Color inherits from the source node
                curveness: 0.5,
                opacity: isDark ? 0.3 : 0.4
            },
            label: {
                position: 'right',
                color: isDark ? '#cbd5e1' : '#475569',
                fontFamily: 'Inter, system-ui, sans-serif',
                formatter: '{b}'
            }
        }
    };

    window.cashFlowSankeyInstance.setOption(option);

    // Handle Resize
    window.addEventListener('resize', function () {
        if (window.cashFlowSankeyInstance) {
            window.cashFlowSankeyInstance.resize();
        }
    });
}

function renderCashFlowWaterfall(data) {
    const ctx = document.getElementById('waterfallChart');
    if (!ctx) return;

    if (window.cashFlowWaterfallInstance) {
        window.cashFlowWaterfallInstance.dispose();
    }

    const isDark = document.documentElement.classList.contains('dark');
    window.cashFlowWaterfallInstance = echarts.init(ctx, isDark ? 'dark' : null, { renderer: 'svg' });

    const currentMonthIndex = new Date().getMonth();

    // 1. Gather Data for Current Month
    let totalIncome = 0;
    data.income.forEach(row => { totalIncome += row.values[currentMonthIndex] || 0; });

    const spendingCategories = [];
    const spendingValues = [];
    let totalSpending = 0;

    // Filter out investment rows from standard spending
    const investmentKeywords = ['Investimenti', 'PAC', 'VWCE'];

    data.spending.forEach(row => {
        if (!investmentKeywords.some(k => row.category.toLowerCase().includes(k.toLowerCase()))) {
            const val = row.values[currentMonthIndex] || 0;
            if (val > 0) {
                spendingCategories.push(row.category);
                spendingValues.push(val);
                totalSpending += val;
            }
        }
    });

    const pacInvestment = (data.pacValues && data.pacValues[currentMonthIndex]) ? data.pacValues[currentMonthIndex] : 0;
    const netSavings = totalIncome - totalSpending - pacInvestment;

    // 2. Build Waterfall Data Arrays
    const labels = ['Total Income', ...spendingCategories];
    if (pacInvestment > 0) labels.push('Investments (PAC)');
    labels.push('Net Savings');

    // Waterfall requires a "Base" (invisible bottom block) and "Value" (colored top block)
    const baseData = [];
    const absoluteData = [];
    const colors = [];

    let currentBase = totalIncome;

    // Step 1: Initial Income
    baseData.push(0);
    absoluteData.push(totalIncome);
    colors.push(isDark ? '#34d399' : '#10b981'); // Emerald

    // Step 2: Subtract Expenses
    for (let i = 0; i < spendingValues.length; i++) {
        currentBase -= spendingValues[i];
        baseData.push(currentBase);
        absoluteData.push(spendingValues[i]);
        colors.push(isDark ? '#f43f5e' : '#e11d48'); // Rose
    }

    // Step 3: Subtract Investments (if any)
    if (pacInvestment > 0) {
        currentBase -= pacInvestment;
        baseData.push(currentBase);
        absoluteData.push(pacInvestment);
        colors.push(isDark ? '#8b5cf6' : '#7c3aed'); // Purple
    }

    // Step 4: Final Net Savings
    baseData.push(0); // The final block drops down to zero
    absoluteData.push(currentBase); // The size of the block is the remaining base

    // Color the final block depending on whether it's positive (savings) or negative (debt)
    if (currentBase >= 0) {
        colors.push(isDark ? '#38bdf8' : '#0284c7'); // Sky Blue
    } else {
        colors.push(isDark ? '#fbbf24' : '#d97706'); // Amber/Warning
    }

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
            formatter: function (params) {
                // params[1] is the visible bar
                const dataObj = params[1];
                if (!dataObj) return '';
                let val = formatCurrency(dataObj.value);
                let prefix = dataObj.dataIndex === 0 || dataObj.dataIndex === labels.length - 1 ? '' : '- ';
                return `<strong>${dataObj.name}</strong><br/>${prefix}${val}`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            splitLine: { show: false },
            axisLabel: {
                color: isDark ? '#cbd5e1' : '#475569',
                interval: 0,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }
            },
            axisLabel: {
                color: isDark ? '#94a3b8' : '#64748b',
                formatter: (value) => value >= 1000 ? (value / 1000) + 'k' : value
            }
        },
        series: [
            {
                name: 'Base',
                type: 'bar',
                stack: 'Total',
                itemStyle: {
                    borderColor: 'transparent',
                    color: 'transparent'
                },
                emphasis: {
                    itemStyle: {
                        borderColor: 'transparent',
                        color: 'transparent'
                    }
                },
                data: baseData
            },
            {
                name: 'Amount',
                type: 'bar',
                stack: 'Total',
                label: {
                    show: true,
                    position: 'inside',
                    formatter: (params) => {
                        if (params.value === 0) return '';
                        // Only show labels for blocks big enough to fit them nicely, e.g. > 100
                        return params.value > 50 ? formatCurrency(params.value, false).replace(',00', '') : '';
                    },
                    color: '#fff',
                    fontSize: 10
                },
                data: absoluteData.map((val, idx) => {
                    return {
                        value: val,
                        itemStyle: { color: colors[idx], borderRadius: 4 }
                    };
                })
            }
        ]
    };

    window.cashFlowWaterfallInstance.setOption(option);

    window.addEventListener('resize', function () {
        if (window.cashFlowWaterfallInstance) {
            window.cashFlowWaterfallInstance.resize();
        }
    });
}



/**
 * RENDERERS
 */
function toggleTableCategory(parentId, iconEl) {
    const rows = document.querySelectorAll(`.child-of-${parentId}`);
    rows.forEach(r => r.classList.toggle('hidden'));
    if (iconEl) iconEl.classList.toggle('rotate-90');
}

function renderFinancialsTable(headers, rows, container, title) {
    if (!rows || rows.length === 0) {
        if (container.innerHTML === "") container.innerHTML = '<p class="text-slate-500">No data available.</p>';
        return;
    }

    let colIndicesToRemove = [];
    headers.forEach((h, i) => {
        if (h) {
            const hStr = String(h).toUpperCase();
            if (hStr.includes("INTERESSI") || hStr.includes("DIVIDENDI") || hStr.includes("CUR.") || hStr === "CUR") {
                colIndicesToRemove.push(i);
            }
        }
    });

    if (colIndicesToRemove.length > 0) {
        colIndicesToRemove.sort((a, b) => b - a); // sort descending so splicing doesn't shift indices
        colIndicesToRemove.forEach(idx => {
            headers.splice(idx, 1);
            rows.forEach(r => r.splice(idx, 1));
        });
    }

    // 2. Filter out empty bullet rows and truncate the bottom "Simple" section summary
    let filteredRows = [];
    let skipRest = false;
    rows.forEach(row => {
        if (skipRest) return;
        let label = String(row[0] || "").trim();
        let labelLower = label.toLowerCase();

        // Remove completely empty rows or bullet points
        if (label === "" || label === "-" || label === "•" || label === "·") return;

        // Truncate bottom summary
        if (labelLower === "simple" || labelLower.startsWith("simple")) {
            skipRest = true;
            return;
        }
        filteredRows.push(row);
    });
    rows = filteredRows;

    let html = '';
    if (title) {
        html += `<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <span class="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full inline-block"></span>
                        ${title}
                    </h3>
                    <span class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50 shadow-sm shadow-blue-500/10">Monthly Breakdown</span>
                </div>`;
    }

    // Wrap the table in a rounded container that strictly contains the flow
    html += `
<div class="relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-black/40 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm">
    <div class="overflow-x-auto custom-scrollbar pb-2">
        <table class="w-full text-sm text-left border-separate border-spacing-0">
            <thead>
                <tr>
                    ${headers.map((h, i) => {
        const isSticky = i < 2;
        let thClass = "px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/95 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700/60 backdrop-blur-md";
        if (i === 1) thClass += " hidden sm:table-cell"; // Hide Wallet header on mobile
        if (isSticky) {
            thClass += " sticky left-0 z-30";
            if (i === 0) thClass += " shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_15px_-3px_rgba(0,0,0,0.4)] sm:shadow-none"; // Shadow for col 1 only on mobile
            if (i === 1) thClass += " shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_15px_-3px_rgba(0,0,0,0.4)] sm:left-[140px]"; // Ensure platform column sticks correctly if 1st col width is fixed
        }
        // Minimalist header text styling
        return `<th class="${thClass}">${h}</th>`;
    }).join('')}
                </tr>
            </thead>
            <tbody class="text-slate-600 dark:text-slate-300">
                `;

    let currentParentId = null;
    let parentIndex = 0;

    rows.forEach((row, rowIdx) => {
        const rowLabel = String(row[0]).trim();
        const rowLabelLower = rowLabel.toLowerCase();

        // 1. Remove first row entirely if it's the duplicated Net Worth title row
        if (rowIdx === 0 && rowLabelLower.includes("net worth")) return;

        // Custom highlighting lists
        const purpleCategories = ["Stocks/ETF", "Liquidity", "Other:", "Net Worth EUR"];
        const isPurple = purpleCategories.some(cat => rowLabel.includes(cat));

        const boldCategories = ["MSFT", "VWCE", "S&P 500", "GOLD", "TOT. Asset €", "TOT. Surplus €", "Simple"];
        const isBoldOnly = boldCategories.some(cat => rowLabel.includes(cat));

        const isTotalRow = !isPurple && !isBoldOnly && (rowLabelLower.includes("total") || rowLabelLower.includes("net worth") || rowLabelLower.includes("portafoglio"));
        const isPercentageRow = rowLabel.includes("%");
        const isNetWorth = rowLabel.includes("Net Worth EUR") || (rowLabelLower.includes("net worth") && rowIdx > 0);

        // Grouping Logic for Accordion
        if (isPurple && !isNetWorth) {
            parentIndex++;
            currentParentId = `category-group-${parentIndex}`;
        } else if (isTotalRow || isNetWorth || rowLabel.includes("=")) {
            currentParentId = null; // Totals and separators stop the grouping
        }

        const isChild = !isPurple && !isTotalRow && !isNetWorth && currentParentId !== null;

        // Define row-level backgrounds
        let rowClass = "group transition-all duration-200 hover:bg-white/60 dark:hover:bg-slate-800/40";
        if (isPurple && !isNetWorth) {
            rowClass = "bg-indigo-50/40 dark:bg-indigo-900/10 cursor-pointer";
        } else if (isTotalRow) {
            rowClass = "bg-slate-50/80 dark:bg-slate-800/60";
        } else if (isNetWorth) {
            rowClass = "bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-900/20";
        }

        if (isChild) {
            rowClass += ` child-of-${currentParentId} hidden`;
        }

        let trAttributes = `class="${rowClass}"`;
        if (isPurple && !isNetWorth) {
            trAttributes += ` onclick="toggleTableCategory('${currentParentId}', this.querySelector('.chevron-icon'))"`;
        }

        html += `<tr ${trAttributes}>`;

        // Determine icon based on category for the first column
        let iconHtml = '<span class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block mr-3"></span>';
        let chevronHtml = '';
        if (isPurple && !isNetWorth) {
            chevronHtml = `<i class="fas fa-chevron-right chevron-icon transition-transform duration-200 text-indigo-400 mr-2 text-xs"></i>`;
        }

        if (rowLabel.includes("Stocks/ETF")) iconHtml = `${chevronHtml}<i class="fas fa-chart-line text-indigo-500 w-4 inline-block mr-2 opacity-80"></i>`;
        else if (rowLabel.includes("Liquidity")) iconHtml = `${chevronHtml}<i class="fas fa-wallet text-sky-500 w-4 inline-block mr-2 opacity-80"></i>`;
        else if (rowLabel.includes("Other:")) iconHtml = `${chevronHtml}<i class="fas fa-cubes text-amber-500 w-4 inline-block mr-2 opacity-80"></i>`;
        else if (isNetWorth) iconHtml = '<i class="fas fa-gem text-emerald-500 w-4 inline-block mr-2 animate-pulse"></i>';
        else if (rowLabel.includes("TOT. Asset €") || rowLabel.includes("Total")) iconHtml = '<i class="fas fa-equals text-slate-400 w-4 inline-block mr-2 opacity-70"></i>';
        else if (isChild) iconHtml = '<span class="w-1 h-3 border-l-2 border-b-2 border-slate-300 dark:border-slate-500 inline-block ml-2 mr-3 -translate-y-1"></span>';

        row.forEach((cell, idx) => {
            let content = cell;
            let isNumber = typeof cell === 'number';

            if (isNumber) {
                if (isPercentageRow && idx > 1) {
                    content = (cell * 100).toFixed(2) + '%';
                    if (cell === 0) content = '<span class="text-slate-300 dark:text-slate-600">-</span>';
                    else if (cell > 0) content = '+' + content;
                } else {
                    content = formatCurrency(cell);
                    if (cell === 0) content = '<span class="text-slate-300 dark:text-slate-600">-</span>';
                }
            } else if (cell instanceof Date) {
                content = cell.toLocaleDateString();
            }

            const isSticky = idx < 2;
            let cellClass = "px-3 py-2 sm:px-5 sm:py-3.5 whitespace-nowrap border-b border-slate-100 dark:border-slate-700/40 text-[11px] sm:text-sm";

            // Last row remove border
            if (rowIdx === rows.length - 1) cellClass = cellClass.replace("border-b", "border-b-0");

            if (isSticky) {
                // To keep background consistent while sticky, we must assign a solid/blur background specifically for sticky td
                let stickyBg = "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl";
                if (isPurple && !isNetWorth) stickyBg = "bg-[#f8fafc]/95 dark:bg-[#151c2c]/95"; // simulating indigo-50
                if (isTotalRow) stickyBg = "bg-[#f8fafc]/95 dark:bg-[#1e293b]/95"; // simulating slate-50
                if (isNetWorth) stickyBg = "bg-[#ecfdf5]/95 dark:bg-[#064e3b]/95"; // simulating emerald-50

                cellClass += ` sticky left-0 z-10 ${stickyBg}`;

                if (idx === 1) {
                    cellClass += " hidden sm:table-cell sm:left-[140px]";
                    cellClass += " border-r border-slate-200/60 dark:border-slate-700/60 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_15px_-3px_rgba(0,0,0,0.3)]";
                }

                if (idx === 0) {
                    cellClass += " sm:border-r-0 border-r border-slate-200/60 dark:border-slate-700/60 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_15px_-3px_rgba(0,0,0,0.3)] sm:shadow-none";
                    cellClass += " font-medium w-[120px] sm:w-[140px] max-w-[140px] sm:max-w-[200px]"; // Remove truncate to allow stacking

                    if (isPurple) {
                        cellClass += " font-semibold text-indigo-700 dark:text-indigo-400";
                    } else if (isBoldOnly) {
                        cellClass += " font-semibold text-slate-800 dark:text-slate-100";
                    }
                    if (isNetWorth) {
                        cellClass += " font-bold text-emerald-700 dark:text-emerald-400";
                    }

                    // Mobile Wallet fallback embedded in 1st col
                    let mobileWalletHtml = "";
                    if (row[1] && String(row[1]).trim() !== "-" && String(row[1]).trim() !== "") {
                        let wStr = String(row[1]).trim();
                        mobileWalletHtml = `<div class="sm:hidden text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 ml-6 truncate">${wStr}</div>`;
                    }

                    content = `<div>
                                  <div class="flex items-center">${iconHtml}<span class="truncate" title="${content}">${content}</span></div>
                                  ${mobileWalletHtml}
                               </div>`;
                } else if (idx === 1) {
                    // Platform column shrunk
                    cellClass += " text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest";
                }
            } else {
                // Regular cells
                if (isNumber) {
                    cellClass += " text-right font-mono tabular-nums tracking-tight";

                    if (isNetWorth || isTotalRow) {
                        cellClass += " font-bold text-emerald-700 dark:text-emerald-400";
                    } else if (isPercentageRow) {
                        if (cell > 0) cellClass += " font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-md";
                        if (cell < 0) cellClass += " font-medium text-rose-500 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10 rounded-md";
                    } else {
                        // Standard numbers style slightly faded if lower value, but hard to compute here. Just use standard text
                        cellClass += " text-slate-700 dark:text-slate-300";
                    }
                }
            }

            if (isNumber && idx > 1) {
                html += `<td class="${cellClass}"><span class="privacy-sensitive">${content}</span></td>`;
            } else {
                html += `<td class="${cellClass}">${content}</td>`;
            }
        });
        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
    </div>
</div>`;

    container.insertAdjacentHTML('beforeend', html);
}

function renderCashFlowTable(data, container) {
    if (data.error) {
        container.innerHTML = `<p class="text-rose-400">Database Error: ${data.error}</p>`;
        return;
    }

    if (!data.rows || data.rows.length === 0) {
        container.innerHTML = '<p class="text-slate-500">No cash flow data available. Please verify the "Cash Flow \'26" tab name.</p > ';
        return;
    }

    // Similar table structure to Financials
    let html = `
<div class="overflow-x-auto">
    <table class="w-full text-sm text-left text-slate-600 dark:text-slate-400">
        <thead class="text-xs text-emerald-700 dark:text-emerald-300 uppercase bg-emerald-100/50 dark:bg-emerald-900/20">
            <tr>
                ${data.headers.map(h => `<th class="px-4 py-3 whitespace-nowrap">${h}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            `;

    data.rows.forEach(row => {
        html += `<tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors">`;
        row.forEach((cell, idx) => {
            let content = cell;
            if (typeof cell === 'number') {
                content = `<span class="privacy-sensitive">${formatCurrency(cell)}</span>`;
            }
            html += `<td class="px-4 py-3 whitespace-nowrap">${content}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody>
    </table>
</div>`;
    container.innerHTML = html;
}

function loadAllocationDetails() {
    const container = document.getElementById('view-allocation');
    if (!container) return;

    // Show loading state ? Not strictly needed if fast, but good UX.
    // We'll trust the charts to animate in.

    google.script.run
        .withSuccessHandler((json) => {
            const data = JSON.parse(json);
            if (data.error) {
                console.error(data.error);
                return;
            }
            renderAllocationCharts(data);
        })
        .getAllocationData();
}

function renderAllocationCharts(data) {
    // Render Assets Chart
    renderDoughnutChart('allocationChartAssets', data.assets, true);

    // Render Geo Chart
    renderDoughnutChart('allocationChartGeo', data.geography, false);

    // Render Rebalancing Summary (replaces old strategy table)
    renderRebalancingSummary(data.assets);

    // Render Holdings Detail ("Cosa Comprare?")
    if (data.holdings && data.holdings.length > 0) {
        renderRebalancingHoldings(data.holdings);
    }
}

/**
 * Renders the Rebalancing Overview: one card per asset class
 * with target vs current bars and delta indicator
 */
function renderRebalancingSummary(assets) {
    const container = document.getElementById('rebalancing-summary');
    if (!container || !assets) return;

    const icons = {
        'Stocks': 'fa-chart-line',
        'Bonds': 'fa-university',
        'Gold': 'fa-coins',
        'Cash & Taxes & Others': 'fa-wallet'
    };
    const colors = {
        'Stocks': { bar: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
        'Bonds': { bar: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
        'Gold': { bar: 'bg-yellow-500', light: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', icon: 'text-yellow-500' },
        'Cash & Taxes & Others': { bar: 'bg-slate-400', light: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-500 dark:text-slate-400', icon: 'text-slate-400' }
    };
    const fallbackColor = { bar: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', icon: 'text-indigo-500' };

    let html = '';

    assets.forEach(asset => {
        const delta = Number(asset.delta) || 0;
        const targetP = (Number(asset.targetPerc) * 100);
        const currentP = (Number(asset.currentPerc) * 100);
        const c = colors[asset.label] || fallbackColor;
        const icon = icons[asset.label] || 'fa-circle';

        // Delta classification
        let deltaColor, deltaBg, deltaIcon, deltaLabel;
        if (Math.abs(delta) < 5) {
            deltaColor = 'text-slate-500 dark:text-slate-400';
            deltaBg = 'bg-slate-100 dark:bg-slate-800';
            deltaIcon = 'fa-check-circle';
            deltaLabel = 'Bilanciato';
        } else if (delta > 0) {
            deltaColor = 'text-emerald-600 dark:text-emerald-400';
            deltaBg = 'bg-emerald-50 dark:bg-emerald-900/20';
            deltaIcon = 'fa-arrow-up';
            deltaLabel = 'Comprare';
        } else {
            deltaColor = 'text-rose-500 dark:text-rose-400';
            deltaBg = 'bg-rose-50 dark:bg-rose-900/20';
            deltaIcon = 'fa-arrow-down';
            deltaLabel = 'Ridurre';
        }

        const deltaSign = delta > 0 ? '+' : '';

        html += `
        <div class="bg-white/50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/40 transition-all hover:shadow-md">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 ${c.light} rounded-lg flex items-center justify-center">
                        <i class="fas ${icon} ${c.icon} text-sm"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-slate-800 dark:text-white text-sm">${asset.label}</h4>
                        <span class="text-xs text-slate-500 dark:text-slate-400 privacy-sensitive">${formatCurrency(asset.value)}</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="${deltaBg} ${deltaColor} px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 privacy-sensitive">
                        <i class="fas ${deltaIcon} text-[10px]"></i>
                        ${deltaSign}${formatCurrency(delta)}
                    </div>
                    <span class="text-[10px] ${deltaColor} mt-1 block">${deltaLabel}</span>
                </div>
            </div>

            <!-- Progress Bars -->
            <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-12 shrink-0">Target</span>
                    <div class="flex-1 h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div class="${c.bar} h-full rounded-full transition-all duration-700 ease-out opacity-40" style="width: ${Math.min(targetP, 100)}%"></div>
                    </div>
                    <span class="text-[10px] font-bold ${c.text} w-10 text-right">${targetP.toFixed(0)}%</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-12 shrink-0">Actual</span>
                    <div class="flex-1 h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div class="${c.bar} h-full rounded-full transition-all duration-700 ease-out" style="width: ${Math.min(currentP, 100)}%"></div>
                    </div>
                    <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200 w-10 text-right">${currentP.toFixed(1)}%</span>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

/**
 * Renders the "Cosa Comprare?" section with detailed holdings
 * and action badges
 */
function renderRebalancingHoldings(holdings) {
    const container = document.getElementById('rebalancing-holdings');
    if (!container || !holdings) return;

    // Group by section
    const grouped = {};
    holdings.forEach(h => {
        if (!grouped[h.section]) grouped[h.section] = [];
        grouped[h.section].push(h);
    });

    const sectionIcons = {
        'Stocks': 'fa-chart-line',
        'Bonds': 'fa-university',
        'Gold': 'fa-coins'
    };

    let html = '';

    Object.keys(grouped).forEach(section => {
        const items = grouped[section];
        html += `<div class="mb-1">
            <div class="flex items-center gap-2 mb-2">
                <i class="fas ${sectionIcons[section] || 'fa-layer-group'} text-slate-400 text-xs"></i>
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">${section}</span>
            </div>`;

        items.forEach(h => {
            const delta = Number(h.delta) || 0;
            const deltaSign = delta > 0 ? '+' : '';

            // Delta styling
            let pillBg, pillText, actionIcon;
            if (Math.abs(delta) < 2) {
                pillBg = 'bg-slate-100 dark:bg-slate-700/50';
                pillText = 'text-slate-500 dark:text-slate-400';
                actionIcon = 'fa-check';
            } else if (delta > 0) {
                pillBg = 'bg-emerald-50 dark:bg-emerald-900/20';
                pillText = 'text-emerald-600 dark:text-emerald-400';
                actionIcon = 'fa-plus';
            } else {
                pillBg = 'bg-rose-50 dark:bg-rose-900/20';
                pillText = 'text-rose-500 dark:text-rose-400';
                actionIcon = 'fa-minus';
            }

            const tickerBadge = h.ticker ? `<span class="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">${h.ticker}</span>` : '';
            const actionBadge = h.action ? `<span class="text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">${h.action}</span>` : '';
            const notesBadge = h.notes ? `<span class="text-[10px] text-slate-400 dark:text-slate-500 italic">${h.notes}</span>` : '';

            const currentP = (Number(h.currentPerc) * 100);
            const targetP = (Number(h.targetPerc) * 100);

            html += `
            <div class="flex items-center justify-between bg-white/50 dark:bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-200/50 dark:border-slate-700/30 transition-all hover:shadow-sm mb-2">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-medium text-sm text-slate-800 dark:text-white">${h.label}</span>
                        ${tickerBadge}
                        ${actionBadge}
                    </div>
                    <div class="flex items-center gap-3 mt-1">
                        <span class="text-[10px] text-slate-400">Target: <strong class="text-slate-600 dark:text-slate-300">${targetP.toFixed(0)}%</strong></span>
                        <span class="text-[10px] text-slate-400">Current: <strong class="text-slate-600 dark:text-slate-300">${currentP.toFixed(0)}%</strong></span>
                        <span class="text-[10px] text-slate-400 privacy-sensitive">${formatCurrency(h.value)} → ${formatCurrency(h.targetValue)}</span>
                        ${notesBadge}
                    </div>
                </div>
                <div class="${pillBg} ${pillText} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-3 shrink-0 privacy-sensitive">
                    <i class="fas ${actionIcon} text-[10px]"></i>
                    ${deltaSign}${formatCurrency(delta)}
                </div>
            </div>`;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

function loadHistoryDetails() {
    const container = document.getElementById('view-history');
    if (!container) return;

    google.script.run
        .withSuccessHandler((json) => {
            const data = JSON.parse(json);
            if (data.error) {
                console.error(data.error);
                container.innerHTML = `<p class="text-rose-500 dark:text-rose-400">Error loading history: ${data.error}</p>`;
                return;
            }
            renderHistoryCards(data);
        })
        .getHistoryData();

    // Also load Hall of Fame
    loadHallOfFameDetails();
}

// =============================================
// HALL OF FAME — Frontend Renderer
// =============================================
function loadHallOfFameDetails() {
    const loading = document.getElementById('hof-loading');
    const monthlySection = document.getElementById('hof-monthly');
    const yearlySection = document.getElementById('hof-yearly');

    if (!loading) return;

    google.script.run
        .withSuccessHandler((json) => {
            const data = JSON.parse(json);
            if (data.error) {
                loading.innerHTML = `<p class="text-rose-400 text-sm">${data.error}</p>`;
                return;
            }

            loading.classList.add('hidden');

            // Render monthly leaderboards
            if (data.monthly && monthlySection) {
                monthlySection.classList.remove('hidden');
                const grid = document.getElementById('hof-monthly-grid');
                grid.innerHTML = '';
                Object.values(data.monthly).forEach(board => {
                    grid.innerHTML += renderHofCard(board, false);
                });
            }

            // Render yearly leaderboards
            if (data.yearly && yearlySection) {
                yearlySection.classList.remove('hidden');
                const grid = document.getElementById('hof-yearly-grid');
                grid.innerHTML = '';
                Object.values(data.yearly).forEach(board => {
                    grid.innerHTML += renderHofCard(board, board.title.includes('Saving Rate'));
                });
            }
        })
        .withFailureHandler((err) => {
            loading.innerHTML = `<p class="text-rose-400 text-sm">Failed to load Hall of Fame</p>`;
            console.error('HoF error:', err);
        })
        .getHallOfFameData();
}

function renderHofCard(board, isPercentage) {
    const isDark = document.documentElement.classList.contains('dark');
    const entries = board.entries || [];
    if (entries.length === 0) return '';

    const colorMap = {
        emerald: { icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
        blue: { icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
        amber: { icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
        rose: { icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
        violet: { icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' }
    };
    const cs = colorMap[board.color] || colorMap.blue;

    // Podium top 3
    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    const formatValue = (v) => {
        if (isPercentage) return (v * 100).toFixed(1) + '%';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    };

    const medalClasses = ['hof-medal-gold', 'hof-medal-silver', 'hof-medal-bronze'];
    const medalEmoji = ['🥇', '🥈', '🥉'];

    let podiumHTML = `<div class="flex justify-center items-end gap-3 px-4 py-4">`;
    // Render in order: 2nd, 1st, 3rd for visual podium effect
    const podiumOrder = top3.length >= 3 ? [1, 0, 2] : top3.length >= 2 ? [1, 0] : [0];

    podiumOrder.forEach(idx => {
        if (!top3[idx]) return;
        const e = top3[idx];
        const isFirst = idx === 0;
        const heightClass = isFirst ? 'pb-4' : 'pb-2';
        podiumHTML += `
            <div class="hof-podium-item flex-1 max-w-[8rem] ${heightClass}">
                <div class="hof-medal ${medalClasses[idx]}">${idx + 1}</div>
                <p class="text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} text-center">${e.period}</p>
                <p class="text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'} privacy-sensitive mt-0.5">${formatValue(e.value)}</p>
            </div>
        `;
    });
    podiumHTML += `</div>`;

    // Remaining rows table
    let rowsHTML = '';
    rest.forEach((e, i) => {
        const delay = (i * 0.06).toFixed(2);
        rowsHTML += `
            <div class="hof-row flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? (isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]') : ''} hover:bg-blue-500/5 transition-colors" style="animation-delay: ${delay}s">
                <div class="flex items-center gap-3">
                    <span class="hof-rank-badge ${cs.badge}">${e.rank}</span>
                    <span class="text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}">${e.period}</span>
                </div>
                <span class="text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'} privacy-sensitive">${formatValue(e.value)}</span>
            </div>
        `;
    });

    // Determine icon class (some FA icons need 'fa-solid' prefix)
    const iconClass = board.icon === 'chart-line-down' ? 'fa-solid fa-chart-line' :
        board.icon === 'sack-dollar' ? 'fa-solid fa-sack-dollar' :
            board.icon === 'piggy-bank' ? 'fa-solid fa-piggy-bank' :
                board.icon === 'crown' ? 'fa-solid fa-crown' :
                    `fas fa-${board.icon}`;

    // Unique ID for this card's collapsible section
    const cardId = 'hof-expand-' + board.title.replace(/[^a-zA-Z]/g, '').toLowerCase();

    return `
        <div class="hof-card">
            <div class="hof-card-header ${board.color}">
                <i class="${iconClass} ${cs.icon}"></i>
                <h4 class="font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}">${board.title}</h4>
            </div>
            ${podiumHTML}
            ${rest.length > 0 ? `
                <div id="${cardId}" class="hof-collapsible border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}">
                    ${rowsHTML}
                </div>
                <button onclick="toggleHofCard('${cardId}', this)" class="hof-toggle-btn w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} transition-colors border-t ${isDark ? 'border-slate-700/30' : 'border-slate-200/30'}">
                    <span>Show Full Ranking</span>
                    <i class="fas fa-chevron-down text-[0.6rem] transition-transform duration-300"></i>
                </button>
            ` : ''}
        </div>
    `;
}

function toggleHofCard(cardId, btn) {
    const el = document.getElementById(cardId);
    if (!el) return;

    const isExpanded = el.classList.contains('expanded');
    const label = btn.querySelector('span');
    const icon = btn.querySelector('i');

    if (isExpanded) {
        // Collapse
        el.style.maxHeight = el.scrollHeight + 'px';
        requestAnimationFrame(() => {
            el.style.maxHeight = '0px';
        });
        el.classList.remove('expanded');
        label.textContent = 'Show Full Ranking';
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Expand
        el.classList.add('expanded');
        el.style.maxHeight = el.scrollHeight + 'px';
        label.textContent = 'Hide Ranking';
        icon.style.transform = 'rotate(180deg)';

        // Remove inline max-height after transition so content can resize naturally
        el.addEventListener('transitionend', function handler() {
            if (el.classList.contains('expanded')) {
                el.style.maxHeight = 'none';
            }
            el.removeEventListener('transitionend', handler);
        });
    }
}

function renderMilestones(res) {
    const container = document.getElementById('milestones-container');
    if (!container) return;

    container.innerHTML = '';
    const isDark = document.documentElement.classList.contains('dark');

    if (res.isMissing || !res.data || res.data.length === 0) {
        container.innerHTML = `
                <div class="md:col-span-3 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-slate-300 dark:border-slate-700">
                    <div class="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                        <i class="fas fa-bullseye text-slate-400 text-xl"></i>
                    </div>
                    <div>
                        <h4 class="text-slate-700 dark:text-slate-300 font-bold">Nessun Obiettivo Trovato</h4>
                        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
                            Crea un foglio chiamato <strong>"Obiettivi"</strong> nel tuo Google Spreadsheet con le colonne: <em>Nome | Attuale | Target | Scadenza | Note</em> per tracciare i tuoi traguardi finanziari qui!
                        </p>
                    </div>
                </div>
            `;
        return;
    }

    res.data.forEach((goal) => {
        // Calculate progress, bounded between 0 and 100
        let perc = (goal.current / goal.target) * 100;
        perc = Math.min(Math.max(perc, 0), 100);

        // Format deadline
        let deadlineText = "";
        let remainingText = "";
        let urgencyClass = isDark ? "text-slate-400" : "text-slate-500";

        if (goal.deadline) {
            const deadlineDate = new Date(goal.deadline);
            const today = new Date();
            const diffTime = deadlineDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Format e.g., "15 Ago 2026"
            const formatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
            deadlineText = `Scadenza: ${formatter.format(deadlineDate)}`;

            if (diffDays > 0) {
                remainingText = `${diffDays} giorni`;
                if (diffDays <= 30) urgencyClass = "text-rose-500 font-semibold";
                else if (diffDays <= 90) urgencyClass = "text-amber-500 font-semibold";
            } else if (diffDays === 0) {
                remainingText = "Oggi!";
                urgencyClass = "text-rose-500 font-bold animate-pulse";
            } else {
                remainingText = "Scaduto";
                urgencyClass = "text-rose-600 font-bold";
            }
        }

        // Determine Progress Bar Color
        let barColor = 'bg-blue-500 shadow-blue-500/50';
        if (perc >= 100) barColor = 'bg-emerald-400 shadow-emerald-400/50';
        else if (perc >= 75) barColor = 'bg-teal-400 shadow-teal-400/50';
        else if (perc >= 50) barColor = 'bg-indigo-400 shadow-indigo-400/50';
        else if (perc < 25) barColor = 'bg-rose-400 shadow-rose-400/50';

        const bgPanelClass = isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/60 border-slate-200/60';
        const iconBgClass = isDark ? 'bg-slate-700/50' : 'bg-slate-100';

        // Safe fallback for emoji/icon in Notes column (if it's not a single emoji, just fallback to target)
        const iconStr = (goal.notes && goal.notes.length <= 4) ? goal.notes : '🎯';

        const html = `
                <div class="${bgPanelClass} backdrop-blur-md border rounded-2xl p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    
                    ${perc >= 100 ? `<div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>` : ''}

                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 ${iconBgClass} rounded-xl flex items-center justify-center shadow-inner">
                                <span class="text-xl">${iconStr}</span>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight privacy-sensitive">${goal.name}</h4>
                                ${deadlineText ? `<p class="text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5">${deadlineText}</p>` : ''}
                            </div>
                        </div>
                        ${remainingText ? `<span class="text-xs ${urgencyClass} bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md ml-2 whitespace-nowrap">${remainingText}</span>` : ''}
                    </div>

                    <div class="space-y-2">
                        <div class="flex justify-between items-end">
                            <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white privacy-sensitive">
                                ${formatCurrency(goal.current)}
                            </span>
                            <span class="text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} privacy-sensitive">
                               / ${formatCurrency(goal.target).replace('€', '').trim()}
                            </span>
                        </div>
                        
                        <div class="w-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-2 overflow-hidden shadow-inner">
                            <div class="${barColor} h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor] relative" style="width: ${perc}%">
                            </div>
                        </div>
                        
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-xs font-bold ${perc >= 100 ? 'text-emerald-500' : (isDark ? 'text-slate-300' : 'text-slate-600')}">${perc.toFixed(1)}%</span>
                            ${perc >= 100 ? `<span class="text-xs font-bold text-emerald-500 uppercase tracking-widest"><i class="fas fa-check-circle mr-1"></i></span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function renderHistoryCards(historyData) {
    const container = document.getElementById('history-cards');
    if (!container) return;
    container.innerHTML = '';

    const titleSpan = document.getElementById('history-years-title');

    if (!historyData || historyData.length === 0) {
        if (titleSpan) titleSpan.textContent = '';
        container.innerHTML = '<p class="text-slate-500 dark:text-slate-400">No history data available.</p>';
        return;
    }

    // Dynamic Year Range Calculation
    if (titleSpan) {
        let minYear = Infinity;
        let maxYear = -Infinity;
        historyData.forEach(y => {
            if (y.year < minYear) minYear = y.year;
            if (y.year > maxYear) maxYear = y.year;
        });
        titleSpan.textContent = minYear === maxYear ? `(${minYear})` : `(${minYear}-${maxYear})`;
    }

    // Sort descending by year
    historyData.sort((a, b) => b.year - a.year);

    let html = '';
    historyData.forEach(yearData => {
        const isPositive = yearData.kpi.deltaYTD >= 0;
        const deltaColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
        const deltaSign = isPositive ? '+' : '';

        html += `
            <div class="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-lg transition-all hover:shadow-xl dark:shadow-black/50 overflow-hidden">
                <div class="flex justify-between items-center cursor-pointer select-none" onclick="toggleHistoryDetails(this)">
                    <div class="flex items-center space-x-4">
                        <div class="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">${yearData.year}</span>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Net Worth</p>
                            <p class="text-xl font-bold text-slate-800 dark:text-white privacy-sensitive">${formatCurrency(yearData.kpi.totalNW)}</p>
                        </div>
                    </div>
                     <div class="flex items-center space-x-6">
                        <div class="text-right hidden sm:block">
                            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Delta YTD</p>
                             <p class="text-lg font-bold ${deltaColor} privacy-sensitive">
                                ${deltaSign}${formatCurrency(yearData.kpi.deltaYTD)}
                            </p>
                        </div>
                        <svg class="w-6 h-6 text-slate-400 dark:text-slate-500 transform transition-transform duration-300 chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>

                <!-- Expanded Content -->
                <div class="hidden mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50 space-y-4 history-details">
                     ${renderHistoryDetailsContent(yearData)}
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

function renderHistoryDetailsContent(yearData) {
    let contentHtml = '';

    // 1. Net Worth Details
    if (yearData.details && yearData.details.length > 0) {
        contentHtml += `<div class="mb-6">
                <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Net Worth Details</h4>
                ${renderHistoryInnerTable(yearData.details)}
            </div>`;
    } else {
        let msg = '<p class="text-slate-500 dark:text-slate-400">No Net Worth details available.</p>';
        if (yearData.nw && yearData.nw.error) {
            msg += `<br><span class="text-rose-400 text-xs">${yearData.nw.error}</span>`;
        }
        contentHtml += `<div class="mb-6">${msg}</div>`;
    }

    // 2. Cash Flow Summary
    if (yearData.cashflow && !yearData.cashflow.error) {
        contentHtml += `<div class="mb-4">
                <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Cash Flow Summary</h4>
                ${renderHistoryCashFlowSummary(yearData.cashflow)}
            </div>`;
    }

    // Debug Output removed as requested

    return contentHtml;
}

function toggleHistoryDetails(headerElement) {
    const content = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.chevron-icon');

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
    } else {
        content.classList.add('hidden');
        icon.classList.remove('rotate-0'); // Actually remove rotate-180
        icon.classList.remove('rotate-180');
    }
}

function renderHistoryInnerTable(details) {
    if (!details || details.length === 0) return '<p class="text-sm text-slate-500 dark:text-slate-400">No details available.</p>';

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800/50">
                    <tr>
                        <th class="px-4 py-2">Month</th>
                        <th class="px-4 py-2 text-right">Net Worth</th>
                        <th class="px-4 py-2 text-right">Delta (MbM)</th>
                        <th class="px-4 py-2 text-right">% Change</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700/30">
        `;

    details.forEach(row => {
        const delta = row.delta || 0;
        const deltaClass = delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
        const deltaSign = delta > 0 ? '+' : '';

        const perc = row.percChange || 0;
        const percClass = perc >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
        const percSign = perc > 0 ? '+' : '';

        html += `
                <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td class="px-4 py-2 font-medium">${row.month}</td>
                    <td class="px-4 py-2 text-right font-mono text-slate-700 dark:text-slate-200"><span class="privacy-sensitive">${formatCurrency(row.nw)}</span></td>
                    <td class="px-4 py-2 text-right font-mono ${deltaClass}"><span class="privacy-sensitive">${deltaSign}${formatCurrency(delta)}</span></td>
                    <td class="px-4 py-2 text-right font-mono ${percClass}">${percSign}${(perc * 100).toFixed(2)}%</td>
                </tr>
            `;
    });

    html += `</tbody></table></div>`;
    return html;
}

function renderHistoryCashFlowSummary(cashflowData) {
    if (!cashflowData || (!cashflowData.income && !cashflowData.spending)) {
        return '<p class="text-sm text-slate-500 dark:text-slate-400">No Cash Flow data available for this year.</p>';
    }

    const months = cashflowData.months || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Calculate monthly totals for income and spending
    const incomeTotals = new Array(12).fill(0);
    const spendingTotals = new Array(12).fill(0);

    if (cashflowData.income) {
        cashflowData.income.forEach(row => {
            row.values.forEach((v, i) => incomeTotals[i] += v);
        });
    }

    if (cashflowData.spending) {
        cashflowData.spending.forEach(row => {
            row.values.forEach((v, i) => spendingTotals[i] += v);
        });
    }

    const totalYearIncome = incomeTotals.reduce((a, b) => a + b, 0);
    const totalYearSpending = spendingTotals.reduce((a, b) => a + b, 0);
    const totalYearSavings = totalYearIncome - totalYearSpending;
    const savingsRate = totalYearIncome > 0 ? (totalYearSavings / totalYearIncome) * 100 : 0;

    let html = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p class="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Total Income</p>
                <p class="text-lg font-bold text-emerald-700 dark:text-emerald-300 privacy-sensitive">${formatCurrency(totalYearIncome)}</p>
            </div>
            <div class="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <p class="text-xs text-rose-600 dark:text-rose-400 uppercase font-semibold">Total Spending</p>
                <p class="text-lg font-bold text-rose-700 dark:text-rose-300 privacy-sensitive">${formatCurrency(totalYearSpending)}</p>
            </div>
            <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p class="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold">Savings (${savingsRate.toFixed(1)}%)</p>
                <p class="text-lg font-bold text-blue-700 dark:text-blue-300 privacy-sensitive">${formatCurrency(totalYearSavings)}</p>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-sm text-center text-slate-600 dark:text-slate-300">
                <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800/50">
                    <tr>
                        <th class="px-3 py-2 text-left">Type</th>
                        ${months.map(m => `<th class="px-2 py-2 min-w-[50px]">${m}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700/30">
                    <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td class="px-3 py-2 text-left font-medium text-emerald-600 dark:text-emerald-400">Income</td>
                        ${incomeTotals.map(v => `<td class="px-2 py-2 text-emerald-700 dark:text-emerald-300"><span class="privacy-sensitive">${v === 0 ? '-' : formatCurrency(v).replace('€', '').trim()}</span></td>`).join('')}
                    </tr>
                    <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td class="px-3 py-2 text-left font-medium text-rose-600 dark:text-rose-400">Spending</td>
                        ${spendingTotals.map(v => `<td class="px-2 py-2 text-rose-700 dark:text-rose-300"><span class="privacy-sensitive">${v === 0 ? '-' : formatCurrency(v).replace('€', '').trim()}</span></td>`).join('')}
                    </tr>
                    <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors bg-slate-50 dark:bg-slate-800/20 font-semibold">
                        <td class="px-3 py-2 text-left text-blue-600 dark:text-blue-400 border-t border-slate-300 dark:border-slate-600">Savings</td>
                        ${incomeTotals.map((inc, i) => {
        const sav = inc - spendingTotals[i];
        const savClass = sav >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500 dark:text-rose-400';
        return `<td class="px-2 py-2 ${savClass} border-t border-slate-300 dark:border-slate-600"><span class="privacy-sensitive">${sav === 0 && inc === 0 ? '-' : formatCurrency(sav).replace('€', '').trim()}</span></td>`;
    }).join('')}
                    </tr>
                </tbody>
            </table>
        </div>`;

    return html;
}

function renderDoughnutChart(canvasId, items, isCurrency) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (!items || items.length === 0) return;

    const labels = items.map(i => i.label);
    const values = items.map(i => i.value);

    // Compute percentages
    const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);

    if (window[canvasId + 'Instance']) {
        window[canvasId + 'Instance'].destroy();
    }

    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'
    ];

    const isDark = document.documentElement.classList.contains('dark');

    // Inline plugin to draw % labels on each slice
    const percentLabelPlugin = {
        id: 'percentLabels',
        afterDraw(chart) {
            const { ctx: c, chartArea } = chart;
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data) return;

            c.save();
            meta.data.forEach((arc, i) => {
                const val = Number(chart.data.datasets[0].data[i]) || 0;
                if (total === 0) return;

                let perc;
                if (isCurrency) {
                    perc = ((val / total) * 100).toFixed(0);
                } else {
                    // Geography values may already be percentages (0-1 or 0-100)
                    perc = val > 1 ? val.toFixed(0) : (val * 100).toFixed(0);
                }

                if (Number(perc) < 3) return; // Skip tiny slices

                // Get midpoint of the arc
                const { startAngle, endAngle, innerRadius, outerRadius } = arc.getProps(['startAngle', 'endAngle', 'innerRadius', 'outerRadius']);
                const midAngle = (startAngle + endAngle) / 2;
                const midRadius = (innerRadius + outerRadius) / 2;
                const x = arc.x + Math.cos(midAngle) * midRadius;
                const y = arc.y + Math.sin(midAngle) * midRadius;

                c.fillStyle = '#ffffff';
                c.font = 'bold 11px Inter, sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';

                // Shadow for readability
                c.shadowColor = 'rgba(0,0,0,0.4)';
                c.shadowBlur = 3;
                c.fillText(perc + '%', x, y);
                c.shadowBlur = 0;
            });
            c.restore();
        }
    };

    window[canvasId + 'Instance'] = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: isDark ? '#1e293b' : '#ffffff',
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#cbd5e1' : '#475569',
                        padding: 15,
                        font: { size: 11 },
                        boxWidth: 12,
                        generateLabels: function (chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => {
                                const val = Number(data.datasets[0].data[i]) || 0;
                                let perc;
                                if (isCurrency) {
                                    perc = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                                } else {
                                    perc = val > 1 ? val.toFixed(1) : (val * 100).toFixed(1);
                                }
                                return {
                                    text: `${label}  ${perc}%`,
                                    fillStyle: colors[i % colors.length],
                                    strokeStyle: isDark ? '#1e293b' : '#ffffff',
                                    lineWidth: 2,
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: isDark ? '#e2e8f0' : '#1e293b',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            let val = context.raw;
                            if (isCurrency) val = formatCurrency(val);
                            else val = (val * 100).toFixed(2) + '%';

                            if (!isCurrency && context.raw > 1) val = context.raw.toFixed(2) + '%';

                            return ` ${context.label}: ${val}`;
                        }
                    }
                }
            },
            cutout: '65%',
        },
        plugins: [percentLabelPlugin]
    });
}

/**
 * UTILITIES & MISSING RENDERERS
 */

function formatCurrency(value, showSign = false) {
    if (value === null || value === undefined) return '-';
    // Handle string inputs if necessary, though ideally we get numbers
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) value = parsed;
    }

    // Apply Global Multi-Currency Conversion
    const rate = window.EXCHANGE_RATES[window.CURRENT_CURRENCY] || 1;
    const convertedValue = value * rate;

    const formatter = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: window.CURRENT_CURRENCY,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    let result = formatter.format(convertedValue);
    if (showSign && value > 0) result = '+' + result;
    return result;
}

function filterChart(chartId, range, btn) {
    if (!window.fullChartData || !window.fullChartData[chartId]) return;
    const fullData = window.fullChartData[chartId];

    // Shallow copy specific to chart type
    let filteredData = { labels: [] };

    let sliceCount = 0;

    if (range === 'ALL') {
        filteredData = fullData;
    } else if (range === 'YTD') {
        // Calculate how many items correspond to the current year
        const currentYearStr = new Date().getFullYear().toString().substr(-2);
        let ytdCount = 0;

        // Loop backwards from the newest data (end of array)
        for (let i = fullData.labels.length - 1; i >= 0; i--) {
            if (fullData.labels[i].includes(currentYearStr)) {
                ytdCount++;
            } else {
                break; // Stop when we hit the previous year
            }
        }
        sliceCount = ytdCount;
    } else {
        if (chartId === 'main') {
            // Monthly data
            if (range === '1M') sliceCount = 2;
            else if (range === '6M') sliceCount = 6;
            else if (range === '1Y') sliceCount = 12;
        } else if (chartId === 'pac') {
            // Daily data (~21 trading days per month)
            if (range === '1M') sliceCount = 21;
            else if (range === '6M') sliceCount = 126;
            else if (range === '1Y') sliceCount = 252;
        }
    }

    if (range !== 'ALL') {
        const total = fullData.labels.length;
        const start = Math.max(0, total - sliceCount);

        filteredData.labels = fullData.labels.slice(start);

        if (chartId === 'main') {
            filteredData.values = fullData.values.slice(start);
        } else if (chartId === 'pac') {
            filteredData.prices = fullData.prices.slice(start);
            filteredData.amounts = fullData.amounts.slice(start);
            if (fullData.avgPrices) filteredData.avgPrices = fullData.avgPrices.slice(start);
        }
    }

    // Update Chart
    if (chartId === 'main') renderMainChart(filteredData);
    if (chartId === 'pac') renderPACChart(filteredData);

    // Update UI
    if (btn && btn.parentNode) {
        btn.parentNode.querySelectorAll('button').forEach(b => {
            b.className = "px-2 py-1 text-xs font-medium text-slate-400 hover:text-white rounded transition-colors";
        });
        btn.className = "px-2 py-1 text-xs font-medium rounded bg-slate-700 text-white shadow";
    }
}
function renderMainChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    if (window.mainChartInstance) window.mainChartInstance.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    const tooltipText = isDark ? '#e2e8f0' : '#1e293b';

    // Calculate Inflation Target Line based on first visible point
    const inflationIT = window.fullChartData?.inflationIT || 2.0;
    const monthlyInflation = parseFloat(inflationIT) / 100 / 12;

    const inflationTargetData = [];
    if (data.values && data.values.length > 0) {
        let currentTarget = data.values[0];
        for (let i = 0; i < data.values.length; i++) {
            inflationTargetData.push(currentTarget);
            currentTarget = currentTarget * (1 + monthlyInflation);
        }
    }

    window.mainChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Target (Inflaz. ' + inflationIT + '%)',
                    data: inflationTargetData,
                    borderColor: isDark ? 'rgba(244, 63, 94, 0.6)' : 'rgba(225, 29, 72, 0.6)', // subtle red
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    tension: 0.1,
                    order: 2
                },
                {
                    label: 'Net Worth',
                    data: data.values,
                    borderColor: '#3b82f6', // blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: isDark ? '#1e293b' : '#ffffff',
                    pointBorderColor: '#3b82f6',
                    pointHoverBackgroundColor: '#3b82f6',
                    pointHoverBorderColor: '#fff',
                    order: 1
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: gridColor },
                    ticks: {
                        color: tickColor,
                        callback: (val) => formatCurrency(val),
                        maxTicksLimit: window.innerWidth < 640 ? 6 : 10,
                        font: { size: window.innerWidth < 640 ? 9 : 12 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: tickColor,
                        maxTicksLimit: window.innerWidth < 640 ? 5 : 12,
                        maxRotation: 45
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: tooltipBg,
                    titleColor: tooltipText,
                    bodyColor: '#3b82f6',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                },
                annotation: {
                    annotations: buildChartAnnotations(data.labels, data.values)
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function buildChartAnnotations(chartLabels, chartValues) {
    if (!window.APP_EVENTS || window.APP_EVENTS.length === 0) return {};

    const annotations = {};
    const isDark = document.documentElement.classList.contains('dark');

    window.APP_EVENTS.forEach((evt, i) => {
        // evt.date format: "2024-03-15"
        const evtDate = new Date(evt.date);
        const evtYearStr = evtDate.getFullYear().toString().substr(-2);
        const monthNamesIta = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
        const monthNamesEng = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

        const monthIdx = evtDate.getMonth();
        const targetIta = `${monthNamesIta[monthIdx]} '${evtYearStr}`;
        const targetEng = `${monthNamesEng[monthIdx]} '${evtYearStr}`;

        // Check if this date exists in the current chart labels
        let matchedLabel = null;

        // Exact match (case insensitive)
        const exactMatch = chartLabels.find(l =>
            l.toLowerCase() === targetIta.toLowerCase() ||
            l.toLowerCase() === targetEng.toLowerCase()
        );

        if (exactMatch) {
            matchedLabel = exactMatch;
        } else {
            // Fallback: Check if any label contains the month and year string
            const fallbackMatch = chartLabels.find(l => {
                const lLower = l.toLowerCase();
                return lLower.includes(evtYearStr) &&
                    (lLower.includes(monthNamesIta[monthIdx]) || lLower.includes(monthNamesEng[monthIdx]));
            });

            if (fallbackMatch) matchedLabel = fallbackMatch;
        }

        if (matchedLabel) {
            // Find index to get Y value from the currently filtered chart data array
            const labelIndex = chartLabels.findIndex(l => l === matchedLabel);
            const yValue = chartValues[labelIndex];

            if (yValue !== undefined) {
                // Create a separate label annotation that appears on hover
                annotations['label' + i] = {
                    type: 'label',
                    xValue: matchedLabel,
                    yValue: yValue,
                    backgroundColor: evt.color || (isDark ? 'rgba(59, 130, 246, 0.9)' : 'rgba(37, 99, 235, 0.9)'),
                    color: 'white',
                    content: evt.title,
                    display: false, // Hidden by default, shown on hover
                    yAdjust: -30,   // Lift the label up a bit
                    font: { size: 10, family: 'Inter' },
                    padding: 6,
                    borderRadius: 4,
                    callout: {
                        display: true,
                        borderColor: evt.color || (isDark ? 'rgba(59, 130, 246, 0.9)' : 'rgba(37, 99, 235, 0.9)'),
                        position: 'bottom',
                        margin: 0
                    }
                };

                annotations['point' + i] = {
                    type: 'point',
                    xValue: matchedLabel,
                    yValue: yValue,
                    backgroundColor: evt.color || (isDark ? 'rgba(59, 130, 246, 0.9)' : 'rgba(37, 99, 235, 0.9)'), // Solid center
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.8)', // White border
                    borderWidth: 2,
                    radius: 5, // slightly smaller static dot

                    // Interaction
                    hitRadius: 15,
                    hoverRadius: 8,

                    // Show/Hide label on hover
                    enter: function (ctx) {
                        ctx.element.options.radius = 8;
                        if (ctx.chart.options.plugins.annotation.annotations['label' + i]) {
                            ctx.chart.options.plugins.annotation.annotations['label' + i].display = true;
                        }
                        ctx.chart.update();
                    },
                    leave: function (ctx) {
                        ctx.element.options.radius = 5;
                        if (ctx.chart.options.plugins.annotation.annotations['label' + i]) {
                            ctx.chart.options.plugins.annotation.annotations['label' + i].display = false;
                        }
                        ctx.chart.update();
                    }
                };
            }
        }
    });

    return annotations;
}

function renderPACChart(data) {
    const ctx = document.getElementById('pacChart');
    if (!ctx) return;

    if (window.pacChartInstance) window.pacChartInstance.destroy();

    if (!data || data.labels.length === 0) {
        ctx.parentNode.innerHTML = '<p class="text-slate-500 text-center py-10">No PAC data found. Check "PAC ETF" sheet.</p>';
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const legendColor = isDark ? '#cbd5e1' : '#475569';
    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    const titleColor = isDark ? '#e2e8f0' : '#1e293b';

    window.pacChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'VWCE Price',
                    data: data.prices,
                    yAxisID: 'y',
                    borderColor: '#10b981', // emerald-500 (Green for Price)
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2,
                    fill: true
                },
                {
                    label: 'Average Price (PMC)',
                    data: data.avgPrices || [],
                    yAxisID: 'y',
                    borderColor: '#f59e0b', // amber-500
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                },
                {
                    label: 'PAC Amount',
                    data: data.amounts,
                    yAxisID: 'y1',
                    type: 'bar',
                    backgroundColor: '#8b5cf6', // purple-500 (Purple for Amount)
                    borderRadius: 4,
                    barThickness: 12
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: tickColor,
                        maxTicksLimit: window.innerWidth < 640 ? 5 : 12,
                        maxRotation: 45
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: window.innerWidth >= 640, text: 'Price (€)', color: '#10b981' },
                    grid: { color: gridColor },
                    ticks: { color: '#10b981', callback: (val) => '€' + val, maxTicksLimit: window.innerWidth < 640 ? 6 : 10, font: { size: window.innerWidth < 640 ? 9 : 12 } }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: window.innerWidth >= 640, text: 'Invested (€)', color: '#a78bfa' },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#a78bfa', callback: (val) => '€' + val, maxTicksLimit: window.innerWidth < 640 ? 6 : 10, font: { size: window.innerWidth < 640 ? 9 : 12 } }
                }
            },
            plugins: {
                legend: {
                    display: window.innerWidth >= 640,
                    labels: {
                        color: legendColor,
                        boxWidth: 40,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: tooltipBg,
                    titleColor: titleColor,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                // Custom rule: if it's the price or PMC, show 2 decimals
                                if (context.dataset.yAxisID === 'y') {
                                    label += context.parsed.y.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
                                } else {
                                    // "Invested" amount usually has no decimals needed
                                    label += formatCurrency(context.parsed.y);
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function renderPortfolioBreakdown(portfolio, totalNW) {
    const container = document.getElementById('nw-breakdown');
    if (!container) return;
    container.innerHTML = '';

    if (!portfolio || portfolio.length === 0) {
        container.innerHTML = '<p class="text-slate-500 dark:text-slate-400 text-sm">No portfolio data available.</p>';
        return;
    }

    portfolio.forEach(group => {
        const total = group.items.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0);
        const percentage = totalNW > 0 ? (total / totalNW) * 100 : 0;

        // Colors and Icons logic
        let barColor = "bg-blue-500";
        let textColor = "text-blue-600 dark:text-blue-400";
        let iconClass = "fas fa-folder";

        if (group.category.toLowerCase().includes("stock")) {
            barColor = "bg-purple-500";
            textColor = "text-purple-600 dark:text-purple-400";
            iconClass = "fas fa-chart-line"; // Stocks/ETF
        } else if (group.category.toLowerCase().includes("liquid")) {
            barColor = "bg-emerald-500";
            textColor = "text-emerald-600 dark:text-emerald-400";
            iconClass = "fas fa-landmark"; // Liquidity (Bank)
        } else if (group.category.toLowerCase().includes("other")) {
            barColor = "bg-amber-500";
            textColor = "text-amber-600 dark:text-amber-400";
            iconClass = "fas fa-piggy-bank"; // Other
        }

        // Render details list
        const itemsHtml = group.items.map(item => `
                <div class="flex justify-between items-center text-xs py-1 border-b border-slate-200 dark:border-slate-700/30 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 px-2 rounded">
                    <span class="text-slate-600 dark:text-slate-400">${item.name}</span>
                    <span class="font-mono text-slate-700 dark:text-slate-300 font-medium privacy-sensitive">${formatCurrency(item.value)}</span>
                </div>
            `).join('');

        const html = `
                <details class="group/details">
                    <summary class="cursor-pointer list-none select-none">
                        <div class="group hover:bg-black/5 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                            <div class="flex justify-between items-end mb-1">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-3 h-3 text-slate-400 dark:text-slate-500 transform transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                    <i class="${iconClass} ${textColor}"></i>
                                    <span class="font-medium text-slate-700 dark:text-slate-300 text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">${group.category}</span>
                                    <span class="text-xs text-slate-500 dark:text-slate-500 font-mono">${percentage.toFixed(1)}%</span>
                                </div>
                                <span class="font-bold text-slate-900 dark:text-white text-sm tracking-tight privacy-sensitive">${formatCurrency(total)}</span>
                            </div>
                            <div class="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full ${barColor} transition-all duration-1000 ease-out relative group-hover:brightness-110" style="width: ${percentage}%">
                                    <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                        </div>
                    </summary>
                    <div class="mt-2 pl-4 space-y-1 mb-4 border-l-2 border-slate-300 dark:border-slate-800 ml-3">
                        ${itemsHtml}
                    </div>
                </details>
            `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// INITIALIZATION — Demo auto-starts, no PIN needed
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Velar Demo initializing...");
        // Set dark theme by default for premium look
        if (!('theme' in localStorage)) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        app.init();
        renderDemoSettings();
    } catch (e) {
        console.error("Critical Init Error:", e);
        document.body.innerHTML = `<div style="color:red; padding:20px;"><h1>App Crashed</h1><pre>${e.stack}</pre></div>`;
    }
});
// =============================================
// DASHBOARD LAYOUT MANAGER (GridStack)
// =============================================
var DashboardLayout = (function () {
    'use strict';

    // --- Constants ---
    var STORAGE_KEY = 'NW_DASHBOARD_LAYOUT_V2';
    var SCHEMA_VERSION = 1;
    var MOBILE_BREAKPOINT = 768;
    var DEBOUNCE_MS = 500;

    // Canonical widget registry: defines every valid widget with its default position.
    // This is the single source of truth for what widgets exist and their defaults.
    var WIDGET_DEFAULTS = [
        { id: 'widget-nw', x: 0, y: 0, w: 8, h: 4, minW: 6, minH: 3 },
        { id: 'widget-ytd', x: 8, y: 0, w: 4, h: 4, minW: 6, minH: 3 },
        { id: 'widget-insights', x: 0, y: 4, w: 12, h: 2, minW: 4, minH: 2 },
        { id: 'widget-milestones', x: 0, y: 6, w: 12, h: 3, minW: 4, minH: 2 },
        { id: 'widget-main-chart', x: 0, y: 9, w: 12, h: 5, minW: 6, minH: 3 },
        { id: 'widget-pac-chart', x: 0, y: 14, w: 12, h: 5, minW: 6, minH: 3 }
    ];

    // --- State ---
    var _grid = null;
    var _initialized = false;
    var _editing = false;
    var _saveTimer = null;

    // --- Persistence Layer ---
    function _loadFromStorage() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            // Validate schema
            if (!data || data.version !== SCHEMA_VERSION || !Array.isArray(data.widgets)) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            // Validate each widget entry
            var validIds = WIDGET_DEFAULTS.map(function (w) { return w.id; });
            var widgets = data.widgets.filter(function (w) {
                return w.id && validIds.indexOf(w.id) !== -1 &&
                    typeof w.x === 'number' && typeof w.y === 'number' &&
                    typeof w.w === 'number' && typeof w.h === 'number' &&
                    w.w > 0 && w.h > 0 && w.x >= 0 && w.y >= 0;
            });
            // Must have all widgets (reject partial/corrupt saves)
            if (widgets.length !== WIDGET_DEFAULTS.length) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return widgets;
        } catch (e) {
            console.warn('[LayoutManager] Corrupt storage, clearing:', e);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }

    function _saveToStorage() {
        if (!_grid) return;
        var widgets = [];
        WIDGET_DEFAULTS.forEach(function (def) {
            var el = document.querySelector('.grid-stack-item[gs-id="' + def.id + '"]');
            if (!el) return;
            widgets.push({
                id: def.id,
                x: parseInt(el.getAttribute('gs-x')) || 0,
                y: parseInt(el.getAttribute('gs-y')) || 0,
                w: parseInt(el.getAttribute('gs-w')) || def.w,
                h: parseInt(el.getAttribute('gs-h')) || def.h
            });
        });
        if (widgets.length !== WIDGET_DEFAULTS.length) return; // safety
        var payload = { version: SCHEMA_VERSION, widgets: widgets };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    function _debouncedSave() {
        clearTimeout(_saveTimer);
        _saveTimer = setTimeout(_saveToStorage, DEBOUNCE_MS);
    }

    // --- Core Init ---
    function _initGrid() {
        if (_grid || _initialized) return;
        if (window.innerWidth < MOBILE_BREAKPOINT) return;

        var container = document.getElementById('dashboard-grid');
        if (!container) return;

        // Check that container is visible (has dimensions)
        if (container.offsetWidth === 0) return;

        _initialized = true;

        // Load saved positions (or null for defaults)
        var savedWidgets = _loadFromStorage();

        // If we have saved positions, apply them as HTML attributes BEFORE GridStack.init
        // so GridStack reads the correct initial values from the DOM
        if (savedWidgets) {
            savedWidgets.forEach(function (w) {
                var el = document.querySelector('.grid-stack-item[gs-id="' + w.id + '"]');
                if (!el) return;
                el.setAttribute('gs-x', w.x);
                el.setAttribute('gs-y', w.y);
                el.setAttribute('gs-w', w.w);
                el.setAttribute('gs-h', w.h);
            });
        }

        // Now init GridStack — it will read positions from the DOM attributes we just set
        _grid = GridStack.init({
            column: 12,
            cellHeight: '80px',
            margin: 12,
            disableOneColumnMode: true,
            staticGrid: true,       // Start in view mode
            float: false,
            animate: true,
            resizable: { handles: 'se' }
        }, '#dashboard-grid');

        // Listen for changes (only fires during edit mode)
        _grid.on('change', function () {
            _debouncedSave();
            // Resize charts after widget repositioning
            setTimeout(function () {
                if (window.mainChartInstance) window.mainChartInstance.resize();
                if (window.pacChartInstance) window.pacChartInstance.resize();
            }, 300);
        });

        window.dashboardGrid = _grid; // backward compat
    }

    // --- Public API ---
    return {
        /**
         * Call this when the dashboard tab becomes visible.
         * Safe to call multiple times — will only init once.
         */
        init: function () {
            if (_initialized) return;
            // Use requestAnimationFrame to ensure DOM is painted and has dimensions
            requestAnimationFrame(function () {
                _initGrid();
            });
        },

        /**
         * Toggle between View Mode and Edit Mode.
         */
        toggleEdit: function () {
            if (!_grid) return;

            var btnText = document.getElementById('edit-dashboard-text');
            var toggleBtn = document.getElementById('toggle-dashboard-edit');
            var gridContainer = document.getElementById('dashboard-grid');

            if (!_editing) {
                // → ENTER EDIT MODE
                _editing = true;
                _grid.setStatic(false);
                gridContainer.classList.add('edit-mode-active');
                if (btnText) btnText.textContent = 'Salva Layout';
                if (toggleBtn) toggleBtn.dataset.editing = 'true';
                if (app && app.ui) app.ui.showNotification('Modalità Modifica Layout Attivata', 'success');
            } else {
                // → EXIT EDIT MODE & SAVE
                _editing = false;
                _grid.setStatic(true);
                gridContainer.classList.remove('edit-mode-active');
                if (btnText) btnText.textContent = 'Modifica Layout';
                if (toggleBtn) toggleBtn.dataset.editing = 'false';

                // Flush any pending debounced save, then do an immediate save
                clearTimeout(_saveTimer);
                _saveToStorage();

                // Resize charts
                setTimeout(function () {
                    if (window.mainChartInstance) window.mainChartInstance.resize();
                    if (window.pacChartInstance) window.pacChartInstance.resize();
                }, 200);

                if (app && app.ui) app.ui.showNotification('Layout Salvato', 'success');
            }
        },

        /**
         * Reset layout to defaults and clear storage.
         */
        reset: function () {
            localStorage.removeItem(STORAGE_KEY);
            if (_grid) {
                WIDGET_DEFAULTS.forEach(function (def) {
                    var el = document.querySelector('.grid-stack-item[gs-id="' + def.id + '"]');
                    if (el) {
                        _grid.update(el, { x: def.x, y: def.y, w: def.w, h: def.h });
                    }
                });
            }
        },

        isEditing: function () { return _editing; },
        isInitialized: function () { return _initialized; }
    };
})();

// Global function for onclick handler in HTML
window.toggleDashboardEdit = function () {
    DashboardLayout.toggleEdit();
};

// Legacy wrapper — called from app.init()
function initDashboardGrid() {
    DashboardLayout.init();
}

// =============================================
// DEMO-SPECIFIC FUNCTIONS
// =============================================

/**
 * Asset Command Bar — filter rows in the financials table
 */
function filterAssets(filter, btn) {
    // Update button states
    document.querySelectorAll('.asset-command-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');

    // Get all table rows in financials
    const container = document.getElementById('financials-content');
    if (!container) return;
    const rows = container.querySelectorAll('tr');

    rows.forEach(row => {
        const label = (row.querySelector('td')?.textContent || '').toLowerCase().trim();
        if (!label) return; // skip header rows

        if (filter === 'all') {
            row.style.display = '';
            row.style.opacity = '1';
        } else if (filter === 'stocks') {
            const isStock = label.includes('vwce') || label.includes('msft') || label.includes('s&p') || label.includes('stock') || label.includes('tot. asset') || label.includes('net worth') || label.includes('%');
            row.style.display = isStock ? '' : 'none';
        } else if (filter === 'liquidity') {
            const isLiq = label.includes('conto') || label.includes('cash') || label.includes('liquid') || label.includes('tot. asset') || label.includes('net worth') || label.includes('%');
            row.style.display = isLiq ? '' : 'none';
        } else if (filter === 'other') {
            const isOther = label.includes('gold') || label.includes('crypto') || label.includes('other') || label.includes('tot. asset') || label.includes('net worth') || label.includes('%');
            row.style.display = isOther ? '' : 'none';
        }
    });
}

/**
 * Render advanced settings: allocation targets + budget items
 */
function renderDemoSettings() {
    // Allocation Targets
    const allocContainer = document.getElementById('settings-allocation-targets');
    if (allocContainer && DEMO.settings.allocation) {
        allocContainer.innerHTML = DEMO.settings.allocation.targets.map(t => {
            const diff = t.current - t.target;
            const diffColor = Math.abs(diff) < 2 ? 'text-slate-500' : (diff > 0 ? 'text-amber-500' : 'text-blue-500');
            const diffSign = diff > 0 ? '+' : '';
            return `
            <div class="settings-row">
                <div class="settings-row-left">
                    <div class="settings-icon bg-blue-100 dark:bg-blue-900/40 text-blue-500"><i class="fas fa-bullseye"></i></div>
                    <div>
                        <p class="settings-label">${t.label}</p>
                        <p class="settings-sublabel">Target: ${t.target}% · Attuale: ${t.current}%</p>
                    </div>
                </div>
                <span class="text-xs font-bold ${diffColor}">${diffSign}${diff.toFixed(1)}%</span>
            </div>`;
        }).join('');
    }

    // Budget Items
    const budgetContainer = document.getElementById('settings-budget-items');
    if (budgetContainer && DEMO.settings.expenses) {
        budgetContainer.innerHTML = DEMO.settings.expenses.budgets.map(b => {
            const perc = Math.min((b.current / b.limit) * 100, 100);
            const barColor = perc > 90 ? 'bg-rose-500' : perc > 70 ? 'bg-amber-500' : 'bg-emerald-500';
            return `
            <div class="settings-row" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${b.category}</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400">€${b.current} / €${b.limit}</span>
                </div>
                <div class="budget-progress">
                    <div class="budget-progress-fill ${barColor}" style="width: ${perc}%"></div>
                </div>
            </div>`;
        }).join('');
    }
}

/**
 * Annualization helper — compute annualized growth rate
 */
function computeAnnualizedGrowth(startNW, currentNW, monthsElapsed) {
    if (monthsElapsed < 2 || startNW <= 0) return null;
    return Math.pow(currentNW / startNW, 12 / monthsElapsed) - 1;
}
