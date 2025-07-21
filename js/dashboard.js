// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZE7myNAPADs8yJx8ejr1qnaqV60U-LvU",
    authDomain: "ritmo-44c20.firebaseapp.com",
    databaseURL: "https://ritmo-44c20-default-rtdb.firebaseio.com",
    projectId: "ritmo-44c20",
    storageBucket: "ritmo-44c20.firebasestorage.app",
    messagingSenderId: "784049161032",
    appId: "1:784049161032:web:480bf33cb60e020ca3e97d",
    measurementId: "G-DPYNXD0BNC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global Variables
let currentUser = null;
let currentUserUnit = null;
let charts = {};
let currentFilterPeriod = 'today';
let totalAcumulado = 0;

// DOM Elements
const userEmail = document.getElementById('user-email');
const userUnit = document.getElementById('user-unit');
const currentUnit = document.getElementById('current-unit');
const currentDate = document.getElementById('current-date');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.sidebar-nav li');
const sectionTitle = document.getElementById('section-title');

// Dashboard Elements
const totalPaletesElement = document.getElementById('total-paletes');
const totalAdicionados = document.getElementById('total-adicionados');
const addedDetail = document.getElementById('added-detail');
const totalAvarias = document.getElementById('total-avarias');
const damageRate = document.getElementById('damage-rate');
const totalRetrabalhos = document.getElementById('total-retrabalhos');
const reworkRate = document.getElementById('rework-rate');
const periodButtons = document.querySelectorAll('.period-btn');
const customPeriod = document.getElementById('custom-period');
const dateRange = document.getElementById('date-range');
const filterTurno = document.getElementById('filter-turno');
const filterTipo = document.getElementById('filter-tipo');
const applyFilters = document.getElementById('apply-filters');
const resetFilters = document.getElementById('reset-filters');

// Initialize the App
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '../index.html';
        } else {
            currentUser = user;
            loadUserData(user);
        }
    });
    
    // Initialize date pickers
    initDatePickers();
    
    // Load initial data
    loadTotalPaletes();
    loadInitialDashboardData();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize Date Pickers
function initDatePickers() {
    flatpickr.localize(flatpickr.l10ns.pt);
    
    flatpickr(dateRange, {
        mode: 'range',
        dateFormat: 'd/m/Y',
        locale: 'pt',
        defaultDate: [new Date(), new Date()],
        onChange: function(selectedDates, dateStr) {
            if (selectedDates.length === 2) {
                applyFilters.click();
            }
        }
    });
}

// Load User Data
function loadUserData(user) {
    database.ref('users/' + user.uid).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            
            if (userData && userData.unit) {
                currentUserUnit = userData.unit;
                userEmail.textContent = user.email;
                
                // Load unit information
                const units = {
                    "maracanau_ce": "Unidade Maracanaú",
                    "belem_pa": "Unidade Belém",
                    "imperatriz_ma": "Unidade Imperatriz",
                    "mogi_das_cruzes_sp": "Unidade Mogi das Cruzes",
                    "cariacica_es": "Unidade Cariacica",
                    "aracruz_es": "Unidade Aracruz",
                    "teste_teste": "Unidade Teste"    
                };

                if (units[userData.unit]) {
                    userUnit.textContent = units[userData.unit];
                    currentUnit.textContent = units[userData.unit];
                }
                
                // Update current date
                updateCurrentDate();
            } else {
                window.location.href = '../index.html';
            }
        })
        .catch(error => {
            console.error("Error loading user data:", error);
        });
}

// Update Current Date
function updateCurrentDate() {
    const now = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    currentDate.textContent = now.toLocaleDateString('pt-BR', options);
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            const sectionId = item.dataset.section;
            if (sectionId === 'registro') {
                window.location.href = '../src/home.html';
            } else if (sectionId === 'historico') {
                window.location.href = '../src/historico.html';
            } else if (sectionId === 'Retrabalhos') {
                window.location.href = '../src/Retrabalhos.html';
            }
        });
    });
    
    // Dashboard - Period Buttons
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilterPeriod = btn.dataset.period;
            
            if (btn.dataset.period === 'custom') {
                customPeriod.classList.remove('hidden');
            } else {
                customPeriod.classList.add('hidden');
                applyFilters.click();
            }
        });
    });
    
    // Dashboard - Apply Filters
    applyFilters.addEventListener('click', () => {
        const turno = filterTurno.value;
        const tipo = filterTipo.value;
        
        let startDate, endDate;
        const today = new Date().toISOString().split('T')[0];
        
        if (currentFilterPeriod === 'custom') {
            const dateRangeValue = dateRange.value;
            if (dateRangeValue) {
                const dates = dateRangeValue.split(' a ');
                startDate = formatDateForFirebase(dates[0]);
                endDate = formatDateForFirebase(dates[1]);
            } else {
                startDate = endDate = today;
            }
        } else {
            const dates = getPeriodDates(currentFilterPeriod);
            startDate = dates.startDate;
            endDate = dates.endDate;
        }
        
        loadDashboardData(startDate, endDate, turno, tipo);
    });
    
    // Dashboard - Reset Filters
    resetFilters.addEventListener('click', () => {
        filterTurno.value = 'all';
        filterTipo.value = 'all';
        periodButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filters-card .period-btn[data-period="today"]').classList.add('active');
        customPeriod.classList.add('hidden');
        currentFilterPeriod = 'today';
        
        const today = new Date().toISOString().split('T')[0];
        loadDashboardData(today, today, 'all', 'all');
    });
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                window.location.href = '../index.html';
            })
            .catch(error => {
                console.error("Logout error:", error);
            });
    });
}

// Load Initial Dashboard Data
function loadInitialDashboardData() {
    const today = new Date().toISOString().split('T')[0];
    loadDashboardData(today, today, 'all', 'all');
}

// Get Period Dates
function getPeriodDates(period) {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = endDate;
    
    switch (period) {
        case 'week':
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 6); // 7 days including today
            startDate = lastWeek.toISOString().split('T')[0];
            break;
        case 'month':
            const lastMonth = new Date(today);
            lastMonth.setDate(1); // First day of current month
            startDate = lastMonth.toISOString().split('T')[0];
            break;
    }
    
    return { startDate, endDate };
}

// Format Date for Firebase
function formatDateForFirebase(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Format Date for Display
function formatDateForDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}


function loadTotalPaletes() {
    // Verifica se a variável totalAcumulado já tem um valor
    if (totalAcumulado === 0) { 
        
        // Carregar do Firebase
        database.ref(`totais/${currentUserUnit}`).once('value')
            .then(snapshot => {
                const total = snapshot.exists() ? snapshot.val() : 0;
                
                // Armazena o total carregado na variável
                totalAcumulado = total;
                
                // Exibe o total fixo na UI
                document.getElementById('total-paletes').textContent = totalAcumulado;
            })
            .catch(error => {
                document.getElementById('total-paletes').textContent = '0';
            });
    } else {
        // Se já houver um valor armazenado, só exibe o valor fixo
        document.getElementById('total-paletes').textContent = totalAcumulado;
    }
}

// Chama a função para carregar o total acumulado
setInterval(loadTotalPaletes, 1000); // Atualiza a cada 1 segundo


// Load Dashboard Data
function loadDashboardData(startDate, endDate, turnoFilter, tipoFilter) {
    if (!currentUserUnit) return;

    // Show loading state
    document.querySelectorAll('.stat-card span').forEach(el => el.textContent = '...');
    document.querySelectorAll('.stat-detail span').forEach(el => el.textContent = '...');

    database.ref(`lancamentos/${currentUserUnit}`)
        .orderByKey()
        .startAt(startDate)
        .endAt(endDate)
        .once('value')
        .then(snapshot => {
            const dadosPeriodo = snapshot.val();
            let totais = initializeTotalsObject();

            if (dadosPeriodo) {
                // Process all days in period
                for (const date in dadosPeriodo) {
                    const dadosDia = dadosPeriodo[date];
                    
                    // Initialize daily data
                    const displayDate = formatDateForDisplay(date);
                    totais.dailyData[displayDate] = {
                        adicionados: 0,
                        avarias: 0,
                        retrabalhos: 0
                    };
                    
                    // Process all records for the day
                    for (const lancamentoId in dadosDia) {
                        const lancamento = dadosDia[lancamentoId];
                        
                        // Apply filters
                        if (turnoFilter !== 'all' && lancamento.turno !== turnoFilter) continue;
                        if (tipoFilter !== 'all' && lancamento.tipo !== tipoFilter) continue;
                        
                        processLancamento(lancamento, totais, displayDate);
                    }
                }
                
                updateDashboardUI(totais);
            } else {
                clearDashboardUI();
            }
        })
        .catch(error => {
            console.error("Error loading dashboard data:", error);
            alert('Erro ao carregar dados. Por favor, tente novamente.');
        });
}

// Initialize Totals Object
function initializeTotalsObject() {
    return {
        adicionados: 0,
        avarias: 0,
        retrabalhos: 0,
        tipos: {
            madeirite: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            chapatex: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            palete: { adicionados: 0, avarias: 0, retrabalhos: 0 }
        },
        turnos: {
            A: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            B: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            C: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            D: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            E: { adicionados: 0, avarias: 0, retrabalhos: 0 }
        },
        motivos: {
            tempo: 0,
            empilhadeira: 0,
            manuseio: 0,
            outro: 0
        },
        dailyData: {}
    };
}

// Process Each Lancamento
function processLancamento(lancamento, totais, displayDate) {
    const quantidade = lancamento.quantidade || 0;
    
    // Process by operation type
    if (lancamento.operacao === 'adicionar') {
        totais.adicionados += quantidade;
        totais.tipos[lancamento.tipo].adicionados += quantidade;
        totais.turnos[lancamento.turno].adicionados += quantidade;
        totais.dailyData[displayDate].adicionados += quantidade;
    } 
    else if (lancamento.operacao === 'avaria') {
        totais.avarias += quantidade;
        totais.tipos[lancamento.tipo].avarias += quantidade;
        totais.turnos[lancamento.turno].avarias += quantidade;
        totais.dailyData[displayDate].avarias += quantidade;
        
        // Count damage reasons
        if (lancamento.motivo) {
            totais.motivos[lancamento.motivo] += quantidade;
        }
    } 
    else if (lancamento.operacao === 'retrabalho') {
        totais.retrabalhos += quantidade;
        totais.tipos[lancamento.tipo].retrabalhos += quantidade;
        totais.turnos[lancamento.turno].retrabalhos += quantidade;
        totais.dailyData[displayDate].retrabalhos += quantidade;
    }
}

// Update Dashboard UI
function updateDashboardUI(totais) {
    // Update stats
    totalAdicionados.textContent = totais.adicionados;
    addedDetail.textContent = `${totais.tipos.madeirite.adicionados}M / ${totais.tipos.chapatex.adicionados}C / ${totais.tipos.palete.adicionados}P`;
    
    totalAvarias.textContent = totais.avarias;
    const avariaPercent = totais.adicionados > 0 ? (totais.avarias / totais.adicionados * 100).toFixed(1) : 0;
    damageRate.textContent = `${avariaPercent}%`;
    
    totalRetrabalhos.textContent = totais.retrabalhos;
    const reworkPercent = totais.adicionados > 0 ? (totais.retrabalhos / totais.adicionados * 100).toFixed(1) : 0;
    reworkRate.textContent = `${reworkPercent}%`;
    
    // Update charts with real data
    updateDailyChart(totais.dailyData);
    updateTypeChart(totais.tipos);
    updateDamageChart(totais.motivos);
    updateShiftChart(totais.turnos);
    
    // Update summary table
    updateSummaryTable(totais.tipos);
}

// Update Daily Chart with Real Data
function updateDailyChart(dailyData) {
    const ctx = document.getElementById('daily-chart').getContext('2d');
    
    if (charts.daily) {
        charts.daily.destroy();
    }
    
    // Prepare data from dailyData object
    const labels = Object.keys(dailyData).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('/'));
        const dateB = new Date(b.split('/').reverse().join('/'));
        return dateA - dateB;
    });
    
    const addedData = labels.map(date => dailyData[date].adicionados || 0);
    const damageData = labels.map(date => dailyData[date].avarias || 0);
    const reworkData = labels.map(date => dailyData[date].retrabalhos || 0);
    
    // Format labels to show day/month
    const formattedLabels = labels.map(label => {
        const [day, month] = label.split('/');
        return `${day}/${month}`;
    });
    
    charts.daily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Adicionados',
                    data: addedData,
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Avarias',
                    data: damageData,
                    borderColor: '#f72585',
                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Retrabalhos',
                    data: reworkData,
                    borderColor: '#4895ef',
                    backgroundColor: 'rgba(72, 149, 239, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Update Type Chart
function updateTypeChart(tipos) {
    const ctx = document.getElementById('type-chart').getContext('2d');
    
    if (charts.type) {
        charts.type.destroy();
    }
    
    charts.type = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Madeirite', 'Chapatex', 'Palete'],
            datasets: [
                {
                    label: 'Adicionados',
                    data: [tipos.madeirite.adicionados, tipos.chapatex.adicionados, tipos.palete.adicionados],
                    backgroundColor: '#4cc9f0',
                    borderColor: '#4cc9f0',
                    borderWidth: 1
                },
                {
                    label: 'Avarias',
                    data: [tipos.madeirite.avarias, tipos.chapatex.avarias, tipos.palete.avarias],
                    backgroundColor: '#f72585',
                    borderColor: '#f72585',
                    borderWidth: 1
                },
                {
                    label: 'Retrabalhos',
                    data: [tipos.madeirite.retrabalhos, tipos.chapatex.retrabalhos, tipos.palete.retrabalhos],
                    backgroundColor: '#4895ef',
                    borderColor: '#4895ef',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update Damage Chart
function updateDamageChart(motivos) {
    const ctx = document.getElementById('damage-chart').getContext('2d');
    
    if (charts.damage) {
        charts.damage.destroy();
    }
    
    charts.damage = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pelo tempo', 'Empilhadeira', 'Manuseio', 'Outros'],
            datasets: [{
                data: [motivos.tempo, motivos.empilhadeira, motivos.manuseio, motivos.outro],
                backgroundColor: [
                    '#4361ee',
                    '#3f37c9',
                    '#4895ef',
                    '#4cc9f0'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update Shift Chart
function updateShiftChart(turnos) {
    const ctx = document.getElementById('shift-chart').getContext('2d');
    
    if (charts.shift) {
        charts.shift.destroy();
    }
    
    charts.shift = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Turno A', 'Turno B', 'Turno C', 'Turno D', 'Turno E'],
            datasets: [
                {
                    label: 'Adicionados',
                    data: [
                        turnos.A.adicionados,
                        turnos.B.adicionados,
                        turnos.C.adicionados,
                        turnos.D.adicionados,
                        turnos.E.adicionados
                    ],
                    backgroundColor: 'rgba(76, 201, 240, 0.2)',
                    borderColor: '#4cc9f0',
                    borderWidth: 2
                },
                {
                    label: 'Avarias',
                    data: [
                        turnos.A.avarias,
                        turnos.B.avarias,
                        turnos.C.avarias,
                        turnos.D.avarias,
                        turnos.E.avarias
                    ],
                    backgroundColor: 'rgba(247, 37, 133, 0.2)',
                    borderColor: '#f72585',
                    borderWidth: 2
                },
                {
                    label: 'Retrabalhos',
                    data: [
                        turnos.A.retrabalhos,
                        turnos.B.retrabalhos,
                        turnos.C.retrabalhos,
                        turnos.D.retrabalhos,
                        turnos.E.retrabalhos
                    ],
                    backgroundColor: 'rgba(72, 149, 239, 0.2)',
                    borderColor: '#4895ef',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update Summary Table
function updateSummaryTable(tipos) {
    try {
        const tbody = document.getElementById('summary-body');
        const tfoot = document.querySelector('.summary-table tfoot tr');
        
        if (!tbody || !tfoot) {
            console.error("Summary table elements not found");
            return;
        }
        
        // Calculate totals
        let totalAdicionados = 0;
        let totalAvarias = 0;
        let totalRetrabalhos = 0;
        
        // Update table rows
        const types = ['madeirite', 'chapatex', 'palete'];
        const typeNames = { 
            madeirite: 'Madeirite', 
            chapatex: 'Chapatex', 
            palete: 'Palete' 
        };
        
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const row = tbody.children[i];
            const data = tipos[type];
            
            const total = data.adicionados - data.avarias + data.retrabalhos;
            const avariaPercent = data.adicionados > 0 ? 
                (data.avarias / data.adicionados * 100).toFixed(1) : 0;
            const reworkPercent = data.adicionados > 0 ? 
                (data.retrabalhos / data.adicionados * 100).toFixed(1) : 0;
            
            row.cells[0].textContent = typeNames[type];
            row.cells[1].textContent = total;
            row.cells[2].textContent = data.adicionados;
            row.cells[3].textContent = data.avarias;
            row.cells[4].textContent = `${avariaPercent}%`;
            row.cells[5].textContent = data.retrabalhos;
            row.cells[6].textContent = `${reworkPercent}%`;
            
            totalAdicionados += data.adicionados;
            totalAvarias += data.avarias;
            totalRetrabalhos += data.retrabalhos;
        }
        
        // Update footer
        const totalGeral = totalAdicionados - totalAvarias + totalRetrabalhos;
        const avariaPercentTotal = totalAdicionados > 0 ? 
            (totalAvarias / totalAdicionados * 100).toFixed(1) : 0;
        const reworkPercentTotal = totalAdicionados > 0 ? 
            (totalRetrabalhos / totalAdicionados * 100).toFixed(1) : 0;
        
        tfoot.cells[1].textContent = totalGeral;
        tfoot.cells[2].textContent = totalAdicionados;
        tfoot.cells[3].textContent = totalAvarias;
        tfoot.cells[4].textContent = `${avariaPercentTotal}%`;
        tfoot.cells[5].textContent = totalRetrabalhos;
        tfoot.cells[6].textContent = `${reworkPercentTotal}%`;
    } catch (error) {
        console.error("Error updating summary table:", error);
    }
}

// Clear Dashboard UI
function clearDashboardUI() {
    // Reset stats
    totalAdicionados.textContent = '0';
    addedDetail.textContent = '0M / 0C / 0P';
    totalAvarias.textContent = '0';
    damageRate.textContent = '0%';
    totalRetrabalhos.textContent = '0';
    reworkRate.textContent = '0%';
    
    // Clear summary table
    const tbody = document.getElementById('summary-body');
    const tfoot = document.querySelector('.summary-table tfoot tr');
    
    if (tbody && tbody.children) {
        for (let i = 0; i < tbody.children.length; i++) {
            const row = tbody.children[i];
            for (let j = 1; j < row.cells.length; j++) {
                row.cells[j].textContent = '0';
                if (j === 4 || j === 6) row.cells[j].textContent = '0%';
            }
        }
    }
    
    if (tfoot) {
        for (let i = 1; i < tfoot.cells.length; i++) {
            tfoot.cells[i].textContent = '0';
            if (i === 4 || i === 6) tfoot.cells[i].textContent = '0%';
        }
    }
    
    // Reset charts
    resetAllCharts();
}

// Reset All Charts
function resetAllCharts() {
    // Destroy existing charts
    for (const chart in charts) {
        if (charts[chart]) {
            charts[chart].destroy();
            delete charts[chart];
        }
    }
    
    // Create empty chart data
    const emptyData = {
        adicionados: 0,
        avarias: 0,
        retrabalhos: 0,
        tipos: {
            madeirite: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            chapatex: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            palete: { adicionados: 0, avarias: 0, retrabalhos: 0 }
        },
        motivos: {
            tempo: 0,
            empilhadeira: 0,
            manuseio: 0,
            outro: 0
        },
        turnos: {
            A: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            B: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            C: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            D: { adicionados: 0, avarias: 0, retrabalhos: 0 },
            E: { adicionados: 0, avarias: 0, retrabalhos: 0 }
        },
        dailyData: {
            [new Date().toLocaleDateString('pt-BR')]: {
                adicionados: 0,
                avarias: 0,
                retrabalhos: 0
            }
        }
    };
    
    // Recreate charts with empty data
    updateDailyChart(emptyData.dailyData);
    updateTypeChart(emptyData.tipos);
    updateDamageChart(emptyData.motivos);
    updateShiftChart(emptyData.turnos);
}