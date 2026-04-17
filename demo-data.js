/**
 * VELAR DEMO — Preset Financial Data
 * European retail investor, male, 28yo, building wealth through salary + PAC in VWCE
 * All values in EUR. Internally coherent across all tabs.
 */

const DEMO = {
    // =============================================
    // DASHBOARD KPI
    // =============================================
    kpi: {
        totalNW: 89240,
        ytdVar: 11240,
        ytdPerc: 14.4,
        surplusVar: 3420,
        surplusPerc: 4.4,
        momVar: 2180,
        momPerc: 2.5,
        debugSurplusStr: 'VWCE +2.8k, MSFT +0.6k',
        debugDenominator: '77,200'
    },

    // =============================================
    // PORTFOLIO BREAKDOWN (Dashboard NW card)
    // =============================================
    portfolio: [
        {
            category: 'Stocks/ETF',
            items: [
                { name: 'VWCE (Vanguard FTSE All-World)', value: 38200 },
                { name: 'MSFT (Microsoft)', value: 8400 },
                { name: 'S&P 500 ETF', value: 6200 }
            ]
        },
        {
            category: 'Liquidity',
            items: [
                { name: 'Conto Principale (Intesa)', value: 14800 },
                { name: 'Conto Deposito (Illimity)', value: 12500 },
                { name: 'Cash Wallet', value: 4140 }
            ]
        },
        {
            category: 'Other',
            items: [
                { name: 'Gold (ETC)', value: 3200 },
                { name: 'Crypto (BTC/ETH)', value: 1800 }
            ]
        }
    ],

    // =============================================
    // INSIGHTS
    // =============================================
    insights: [
        {
            type: 'success',
            icon: '📈',
            title: 'Net Worth in crescita',
            message: 'Il tuo patrimonio è cresciuto del +14.4% da inizio anno, superando il target di inflazione del 2%.'
        },
        {
            type: 'info',
            icon: '💡',
            title: 'Savings Rate eccellente',
            message: 'Con un tasso di risparmio del 45%, stai accumulando capitale più velocemente della media europea (12%).'
        },
        {
            type: 'warning',
            icon: '⚖️',
            title: 'Ribilanciamento consigliato',
            message: 'La componente azionaria (59.2%) supera il target del 55%. Considera di ribilanciare verso obbligazioni o liquidità.'
        }
    ],

    // =============================================
    // MILESTONES
    // =============================================
    milestones: {
        data: [
            { name: 'Emergency Fund (6 mesi)', current: 14800, target: 9000, deadline: '2026-06-30', notes: '🛡️' },
            { name: '€100k Net Worth', current: 89240, target: 100000, deadline: '2026-12-31', notes: '💎' },
            { name: 'VWCE €50k Invested', current: 38200, target: 50000, deadline: '2027-06-30', notes: '📊' }
        ]
    },

    // =============================================
    // EVENTS (Chart markers)
    // =============================================
    events: [
        { id: '1', title: 'Primo PAC VWCE', date: '2024-03-15', color: 'rgba(16, 185, 129, 0.8)' },
        { id: '2', title: 'Aumento stipendio', date: '2025-06-01', color: 'rgba(59, 130, 246, 0.8)' }
    ],

    // =============================================
    // NET WORTH EVOLUTION (monthly, Jan '24 → Apr '26)
    // =============================================
    nwEvolution: {
        labels: [
            "gen '24", "feb '24", "mar '24", "apr '24", "mag '24", "giu '24",
            "lug '24", "ago '24", "set '24", "ott '24", "nov '24", "dic '24",
            "gen '25", "feb '25", "mar '25", "apr '25", "mag '25", "giu '25",
            "lug '25", "ago '25", "set '25", "ott '25", "nov '25", "dic '25",
            "gen '26", "feb '26", "mar '26", "apr '26"
        ],
        values: [
            38200, 39100, 40500, 41200, 42800, 43500,
            44900, 45600, 47100, 48300, 50200, 52100,
            53800, 55200, 57400, 58900, 60800, 63200,
            65100, 66800, 69500, 72100, 75400, 78000,
            80200, 83400, 87060, 89240
        ]
    },

    // =============================================
    // PAC DATA (VWCE daily prices + monthly buy amounts)
    // =============================================
    pacData: (function () {
        const labels = [];
        const prices = [];
        const amounts = [];
        const avgPrices = [];
        let totalShares = 0;
        let totalInvested = 0;
        const startDate = new Date(2024, 0, 2);
        const endDate = new Date(2026, 3, 15);
        let basePrice = 98.50;
        let day = new Date(startDate);

        while (day <= endDate) {
            if (day.getDay() !== 0 && day.getDay() !== 6) {
                const dateStr = day.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });
                labels.push(dateStr);

                // Simulate price movement with upward trend
                const trend = 0.03 / 252; // ~3% annual drift
                const noise = (Math.random() - 0.48) * 1.8;
                basePrice = basePrice * (1 + trend) + noise;
                basePrice = Math.max(basePrice, 85);
                prices.push(Math.round(basePrice * 100) / 100);

                // PAC buy on ~15th of each month
                const isPayday = day.getDate() >= 14 && day.getDate() <= 16;
                let pacAmount = 0;
                if (isPayday && amounts.filter(a => a > 0).length < labels.length) {
                    // Check if we already bought this month
                    const monthKey = `${day.getFullYear()}-${day.getMonth()}`;
                    const lastBuyIdx = amounts.lastIndexOf(amounts.filter(a => a > 0).slice(-1)[0]);
                    if (lastBuyIdx === -1 || labels[lastBuyIdx]?.indexOf(day.toLocaleDateString('it-IT', { month: 'short' })) === -1) {
                        pacAmount = day.getFullYear() === 2024 ? 200 : (day.getFullYear() === 2025 ? 300 : 350);
                        totalInvested += pacAmount;
                        totalShares += pacAmount / basePrice;
                    }
                }
                amounts.push(pacAmount);
                avgPrices.push(totalShares > 0 ? Math.round((totalInvested / totalShares) * 100) / 100 : basePrice);
            }
            day.setDate(day.getDate() + 1);
        }
        return { labels, prices, amounts, avgPrices };
    })(),

    // =============================================
    // FINANCIALS — NW 2026 Monthly Breakdown
    // =============================================
    financials: {
        headers: ['Asset', 'Wallet', 'Jan', 'Feb', 'Mar', 'Apr'],
        rows: [
            ['Stocks/ETF', '', '', '', '', ''],
            ['VWCE', 'Directa', 33800, 35200, 36900, 38200],
            ['MSFT', 'Directa', 7200, 7600, 8100, 8400],
            ['S&P 500 ETF', 'Directa', 5400, 5700, 5900, 6200],
            ['TOT. Asset €', '', 46400, 48500, 50900, 52800],
            ['Liquidity', '', '', '', '', ''],
            ['Conto Principale', 'Intesa', 13200, 13800, 14200, 14800],
            ['Conto Deposito', 'Illimity', 12000, 12100, 12300, 12500],
            ['Cash Wallet', 'Revolut', 3600, 3800, 3960, 4140],
            ['TOT. Asset €', '', 28800, 29700, 30460, 31440],
            ['Other:', '', '', '', '', ''],
            ['Gold ETC', 'Directa', 2800, 2900, 3050, 3200],
            ['Crypto', 'Ledger', 2200, 2300, 2650, 1800],
            ['TOT. Asset €', '', 5000, 5200, 5700, 5000],
            ['Net Worth EUR', '', 80200, 83400, 87060, 89240],
            ['% MoM', '', 0.028, 0.040, 0.044, 0.025]
        ]
    },

    // =============================================
    // DIVIDENDS
    // =============================================
    dividends: {
        labels: ["Q1 '24", "Q2 '24", "Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26"],
        datasets: {
            'VWCE': [0, 28, 0, 32, 0, 45, 0, 52, 0],
            'MSFT': [12, 12, 14, 14, 16, 16, 18, 18, 20],
            'Conto Deposito': [0, 38, 0, 42, 0, 55, 0, 62, 0],
            'S&P 500 ETF': [0, 8, 0, 10, 0, 12, 0, 14, 0]
        }
    },

    // =============================================
    // CASH FLOW
    // =============================================
    cashflow: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        income: [
            { category: 'Stipendio', values: [2600, 2600, 2600, 2600, 2600, 2600, 2600, 2600, 2600, 2600, 2600, 2600], total: 31200 },
            { category: 'Freelance', values: [0, 200, 0, 150, 0, 0, 200, 0, 0, 150, 0, 0], total: 700 },
            { category: 'Dividendi', values: [32, 0, 0, 20, 0, 57, 0, 0, 66, 0, 0, 0], total: 175 },
            { category: 'Interessi CD', values: [0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 62], total: 117 }
        ],
        spending: [
            { category: 'Affitto', values: [650, 650, 650, 650, 650, 650, 650, 650, 650, 650, 650, 650], total: 7800 },
            { category: 'Spesa Alimentare', values: [280, 260, 290, 275, 270, 285, 290, 310, 270, 280, 290, 300], total: 3400 },
            { category: 'Trasporti', values: [85, 90, 80, 95, 85, 90, 100, 80, 85, 90, 95, 85], total: 1060 },
            { category: 'Utenze', values: [120, 115, 110, 95, 85, 80, 75, 75, 80, 95, 110, 125], total: 1165 },
            { category: 'Svago & Uscite', values: [150, 120, 180, 160, 200, 220, 250, 280, 200, 170, 140, 180], total: 2250 },
            { category: 'Abbonamenti', values: [45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45], total: 540 },
            { category: 'Salute', values: [0, 80, 0, 0, 40, 0, 0, 0, 60, 0, 0, 0], total: 180 },
            { category: 'Altro', values: [50, 30, 60, 40, 50, 70, 80, 40, 50, 60, 40, 50], total: 620 }
        ],
        pacValues: [350, 350, 350, 350, 350, 350, 350, 350, 350, 350, 350, 350],
        allTime: {
            income: { 'Stipendio': 85400, 'Freelance': 2100, 'Dividendi': 585, 'Interessi CD': 312 },
            spending: { 'Affitto': 22100, 'Spesa Alimentare': 9800, 'Trasporti': 3100, 'Utenze': 3400, 'Svago & Uscite': 6200, 'Abbonamenti': 1560, 'Salute': 620, 'Altro': 1850 },
            pacTotal: 8050
        }
    },

    // =============================================
    // ALLOCATION
    // =============================================
    allocation: {
        assets: [
            { label: 'Stocks', value: 52800, currentPerc: 0.592, targetPerc: 0.55, delta: -3680 },
            { label: 'Bonds', value: 0, currentPerc: 0, targetPerc: 0.10, delta: 8924 },
            { label: 'Gold', value: 3200, currentPerc: 0.036, targetPerc: 0.05, delta: 1262 },
            { label: 'Cash & Taxes & Others', value: 33240, currentPerc: 0.373, targetPerc: 0.30, delta: -6468 }
        ],
        geography: [
            { label: 'Global (VWCE)', value: 48.5 },
            { label: 'USA', value: 28.2 },
            { label: 'Europe', value: 12.8 },
            { label: 'Emerging Markets', value: 6.3 },
            { label: 'Italy', value: 4.2 }
        ],
        holdings: [
            { section: 'Stocks', label: 'VWCE', ticker: 'VWCE.MI', value: 38200, targetValue: 32000, currentPerc: 0.428, targetPerc: 0.36, delta: -6200, action: 'Hold', notes: 'Sovrapesato' },
            { section: 'Stocks', label: 'Microsoft', ticker: 'MSFT', value: 8400, targetValue: 8000, currentPerc: 0.094, targetPerc: 0.09, delta: -400, action: 'Hold' },
            { section: 'Stocks', label: 'S&P 500 ETF', ticker: 'CSSPX', value: 6200, targetValue: 8920, currentPerc: 0.069, targetPerc: 0.10, delta: 2720, action: 'Comprare' },
            { section: 'Bonds', label: 'BTP Italia', ticker: 'BTP-1MR28', value: 0, targetValue: 8924, currentPerc: 0, targetPerc: 0.10, delta: 8924, action: 'Comprare', notes: 'Non presente' },
            { section: 'Gold', label: 'Gold ETC', ticker: 'SGLD', value: 3200, targetValue: 4462, currentPerc: 0.036, targetPerc: 0.05, delta: 1262, action: 'Comprare' }
        ]
    },

    // =============================================
    // HISTORY
    // =============================================
    history: [
        {
            year: 2025,
            kpi: { totalNW: 78000, deltaYTD: 25900 },
            details: [
                { month: 'Jan', nw: 53800, delta: 1700, percChange: 0.033 },
                { month: 'Feb', nw: 55200, delta: 1400, percChange: 0.026 },
                { month: 'Mar', nw: 57400, delta: 2200, percChange: 0.040 },
                { month: 'Apr', nw: 58900, delta: 1500, percChange: 0.026 },
                { month: 'May', nw: 60800, delta: 1900, percChange: 0.032 },
                { month: 'Jun', nw: 63200, delta: 2400, percChange: 0.039 },
                { month: 'Jul', nw: 65100, delta: 1900, percChange: 0.030 },
                { month: 'Aug', nw: 66800, delta: 1700, percChange: 0.026 },
                { month: 'Sep', nw: 69500, delta: 2700, percChange: 0.040 },
                { month: 'Oct', nw: 72100, delta: 2600, percChange: 0.037 },
                { month: 'Nov', nw: 75400, delta: 3300, percChange: 0.046 },
                { month: 'Dec', nw: 78000, delta: 2600, percChange: 0.034 }
            ],
            cashflow: {
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                income: [
                    { category: 'Stipendio', values: [2400, 2400, 2400, 2400, 2400, 2600, 2600, 2600, 2600, 2600, 2600, 2600] },
                    { category: 'Freelance', values: [0, 150, 0, 0, 100, 0, 200, 0, 0, 100, 0, 150] }
                ],
                spending: [
                    { category: 'Affitto', values: [600, 600, 600, 600, 600, 650, 650, 650, 650, 650, 650, 650] },
                    { category: 'Spese Varie', values: [520, 480, 530, 510, 540, 560, 580, 620, 540, 520, 510, 530] }
                ]
            }
        },
        {
            year: 2024,
            kpi: { totalNW: 52100, deltaYTD: 13900 },
            details: [
                { month: 'Jan', nw: 38200, delta: 0, percChange: 0 },
                { month: 'Feb', nw: 39100, delta: 900, percChange: 0.024 },
                { month: 'Mar', nw: 40500, delta: 1400, percChange: 0.036 },
                { month: 'Apr', nw: 41200, delta: 700, percChange: 0.017 },
                { month: 'May', nw: 42800, delta: 1600, percChange: 0.039 },
                { month: 'Jun', nw: 43500, delta: 700, percChange: 0.016 },
                { month: 'Jul', nw: 44900, delta: 1400, percChange: 0.032 },
                { month: 'Aug', nw: 45600, delta: 700, percChange: 0.016 },
                { month: 'Sep', nw: 47100, delta: 1500, percChange: 0.033 },
                { month: 'Oct', nw: 48300, delta: 1200, percChange: 0.025 },
                { month: 'Nov', nw: 50200, delta: 1900, percChange: 0.039 },
                { month: 'Dec', nw: 52100, delta: 1900, percChange: 0.038 }
            ],
            cashflow: {
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                income: [
                    { category: 'Stipendio', values: [2200, 2200, 2200, 2200, 2200, 2200, 2400, 2400, 2400, 2400, 2400, 2400] },
                    { category: 'Freelance', values: [0, 0, 100, 0, 0, 150, 0, 0, 0, 100, 0, 0] }
                ],
                spending: [
                    { category: 'Affitto', values: [550, 550, 550, 550, 550, 550, 600, 600, 600, 600, 600, 600] },
                    { category: 'Spese Varie', values: [450, 430, 470, 460, 480, 490, 500, 520, 480, 470, 460, 480] }
                ]
            }
        }
    ],

    // =============================================
    // HALL OF FAME
    // =============================================
    hallOfFame: {
        monthly: {
            bestGrowth: {
                title: 'Best Monthly Growth',
                icon: 'arrow-trend-up',
                color: 'emerald',
                entries: [
                    { rank: 1, period: 'Nov 2025', value: 3300 },
                    { rank: 2, period: 'Sep 2025', value: 2700 },
                    { rank: 3, period: 'Oct 2025', value: 2600 },
                    { rank: 4, period: 'Jun 2025', value: 2400 },
                    { rank: 5, period: 'Mar 2026', value: 2180 }
                ]
            },
            bestPercGrowth: {
                title: 'Best % Growth',
                icon: 'chart-line',
                color: 'blue',
                entries: [
                    { rank: 1, period: 'Nov 2025', value: 0.046 },
                    { rank: 2, period: 'Mar 2026', value: 0.044 },
                    { rank: 3, period: 'Mar 2025', value: 0.040 },
                    { rank: 4, period: 'Sep 2025', value: 0.040 },
                    { rank: 5, period: 'Feb 2026', value: 0.040 }
                ]
            }
        },
        yearly: {
            bestNW: {
                title: 'Highest Net Worth',
                icon: 'crown',
                color: 'amber',
                entries: [
                    { rank: 1, period: '2026 (YTD)', value: 89240 },
                    { rank: 2, period: '2025', value: 78000 },
                    { rank: 3, period: '2024', value: 52100 }
                ]
            },
            bestGrowth: {
                title: 'Best Yearly Growth',
                icon: 'sack-dollar',
                color: 'emerald',
                entries: [
                    { rank: 1, period: '2025', value: 25900 },
                    { rank: 2, period: '2024', value: 13900 },
                    { rank: 3, period: '2026 (YTD)', value: 11240 }
                ]
            },
            savingRate: {
                title: 'Best Saving Rate',
                icon: 'piggy-bank',
                color: 'violet',
                entries: [
                    { rank: 1, period: '2026 (YTD)', value: 0.452 },
                    { rank: 2, period: '2025', value: 0.418 },
                    { rank: 3, period: '2024', value: 0.385 }
                ]
            }
        }
    },

    // =============================================
    // ADVANCED SETTINGS (read-only display data)
    // =============================================
    settings: {
        allocation: {
            targets: [
                { label: 'Stocks/ETF', target: 55, current: 59.2 },
                { label: 'Bonds', target: 10, current: 0 },
                { label: 'Gold', target: 5, current: 3.6 },
                { label: 'Cash', target: 30, current: 37.3 }
            ]
        },
        preferences: {
            language: 'Italiano',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: '1.234,56',
            startOfWeek: 'Lunedì'
        },
        expenses: {
            budgets: [
                { category: 'Affitto', limit: 700, current: 650 },
                { category: 'Spesa Alimentare', limit: 300, current: 275 },
                { category: 'Trasporti', limit: 100, current: 95 },
                { category: 'Svago & Uscite', limit: 200, current: 160 },
                { category: 'Abbonamenti', limit: 50, current: 45 }
            ]
        },
        dividends: {
            trackingEnabled: true,
            reinvestEnabled: false,
            taxRate: 26,
            alertThreshold: 50
        },
        appearance: {
            theme: 'dark',
            accentColor: 'Sapphire Blue',
            compactMode: false,
            animations: true
        }
    },

    // Exchange rates for currency selector
    exchangeRates: { EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.97, JPY: 163.5 }
};
