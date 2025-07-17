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
let historicoPage = 1;
const historicoPageSize = 10;
let historicoTotalPages = 1;

// DOM Elements
const userEmail = document.getElementById('user-email');
const userUnit = document.getElementById('user-unit');
const currentUnit = document.getElementById('current-unit');
const currentDate = document.getElementById('current-date');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.sidebar-nav li');
const sectionContents = document.querySelectorAll('.content-section');
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

// Register Elements
const registerForm = document.getElementById('register-form');
const regDate = document.getElementById('reg-date');
const regShift = document.getElementById('reg-shift');
const regType = document.getElementById('reg-type');
const regOperation = document.getElementById('reg-operation');
const regQuantity = document.getElementById('reg-quantity');
const damageFields = document.getElementById('damage-fields');
const damageReason = document.getElementById('damage-reason');
const damageDetails = document.getElementById('damage-details');
const reworkFields = document.getElementById('rework-fields');
const clearForm = document.getElementById('clear-form');

// History Elements
const historyPeriodButtons = document.querySelectorAll('#historico-section .period-btn');
const historyCustomPeriod = document.getElementById('history-custom-period');
const historyDateRange = document.getElementById('history-date-range');
const historyShift = document.getElementById('history-shift');
const historyType = document.getElementById('history-type');
const historyOperation = document.getElementById('history-operation');
const applyHistoryFilters = document.getElementById('apply-history-filters');
const exportHistory = document.getElementById('export-history');
const historyBody = document.getElementById('history-body');
const prevPage = document.getElementById('prev-page');
const nextPage = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// Initialize the App
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            currentUser = user;
            loadUserData(user);
        }
    });
    
    // Set current date in forms
    const today = new Date().toISOString().split('T')[0];
    regDate.value = today;
    
    // Initialize date pickers
    initDatePickers();
    
    // Load initial data
    loadTotalPaletes();
    loadDashboardData(today, 'all', 'all');
    
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
        defaultDate: [new Date(), new Date()]
    });
    
    flatpickr(historyDateRange, {
        mode: 'range',
        dateFormat: 'd/m/Y',
        locale: 'pt',
        defaultDate: [new Date(), new Date()]
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
                window.location.href = 'index.html';
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
            
            sectionContents.forEach(content => content.classList.add('hidden'));
            
            const sectionId = item.dataset.section + '-section';
            document.getElementById(sectionId).classList.remove('hidden');
            
            sectionTitle.textContent = item.querySelector('span').textContent;
            
            // Load section specific data
            if (sectionId === 'dashboard-section') {
                const today = new Date().toISOString().split('T')[0];
                loadDashboardData(today, 'all', 'all');
            } else if (sectionId === 'historico-section') {
                loadHistoryData();
            }
        });
    });
    
    // Dashboard - Period Buttons
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            customPeriod.classList.add('hidden');
            
            if (btn.dataset.period === 'custom') {
                customPeriod.classList.remove('hidden');
            }
        });
    });
    
    // Dashboard - Apply Filters
    applyFilters.addEventListener('click', () => {
        const activePeriodBtn = document.querySelector('.filters-card .period-btn.active');
        const turno = filterTurno.value;
        const tipo = filterTipo.value;
        
        let startDate, endDate;
        
        if (activePeriodBtn.dataset.period === 'custom') {
            const dateRangeValue = dateRange.value;
            if (dateRangeValue) {
                const dates = dateRangeValue.split(' a ');
                startDate = formatDateForFirebase(dates[0]);
                endDate = formatDateForFirebase(dates[1]);
            } else {
                startDate = endDate = new Date().toISOString().split('T')[0];
            }
        } else {
            const dates = getPeriodDates(activePeriodBtn.dataset.period);
            startDate = dates.startDate;
            endDate = dates.endDate;
        }
        
        loadDashboardData(endDate, turno, tipo);
    });
    
    // Dashboard - Reset Filters
    resetFilters.addEventListener('click', () => {
        filterTurno.value = 'all';
        filterTipo.value = 'all';
        periodButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filters-card .period-btn[data-period="today"]').classList.add('active');
        customPeriod.classList.add('hidden');
        
        const today = new Date().toISOString().split('T')[0];
        loadDashboardData(today, 'all', 'all');
    });
    
    // Register - Operation Change
    regOperation.addEventListener('change', () => {
        const operation = regOperation.value;
        
        // Hide all dynamic fields
        damageFields.classList.add('hidden');
        reworkFields.classList.add('hidden');
        
        // Show relevant fields
        if (operation === 'avaria') {
            damageFields.classList.remove('hidden');
        } else if (operation === 'retrabalho') {
            reworkFields.classList.remove('hidden');
        }
    });
    
    // Register - Form Submit
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveRegister();
    });
    
    // Register - Clear Form
    clearForm.addEventListener('click', () => {
        registerForm.reset();
        damageFields.classList.add('hidden');
        reworkFields.classList.add('hidden');
    });
    
    // History - Period Buttons
    historyPeriodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            historyPeriodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            historyCustomPeriod.classList.add('hidden');
            
            if (btn.dataset.period === 'custom') {
                historyCustomPeriod.classList.remove('hidden');
            }
        });
    });
    
    // History - Apply Filters
    applyHistoryFilters.addEventListener('click', loadHistoryData);
    
    // History - Export
    exportHistory.addEventListener('click', exportHistoryToCSV);
    
    // History - Pagination
    prevPage.addEventListener('click', () => {
        if (historicoPage > 1) {
            historicoPage--;
            loadHistoryData();
        }
    });
    
    nextPage.addEventListener('click', () => {
        if (historicoPage < historicoTotalPages) {
            historicoPage++;
            loadHistoryData();
        }
    });
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error("Logout error:", error);
            });
    });
}

// Get Period Dates
function getPeriodDates(period) {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = endDate;
    
    switch (period) {
        case 'week':
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            startDate = lastWeek.toISOString().split('T')[0];
            break;
        case 'month':
            const lastMonth = new Date(today);
            lastMonth.setMonth(today.getMonth() - 1);
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

// Load Total Paletes
function loadTotalPaletes() {
    database.ref(`totais/${currentUserUnit}`).once('value')
        .then(snapshot => {
            const total = snapshot.val();
            totalPaletesElement.textContent = total || 0;
        })
        .catch(error => {
            console.error("Error loading total paletes:", error);
        });
}

// Load Dashboard Data
function loadDashboardData(date, turnoFilter, tipoFilter) {
    database.ref(`lancamentos/${currentUserUnit}/${date}`).once('value')
        .then(snapshot => {
            const dadosDia = snapshot.val();
            
            if (dadosDia) {
                // Calculate totals
                let totais = {
                    adicionados: 0,
                    avarias: 0,
                    retrabalhos: 0,
                    tipos: {
                        madeirite: { adicionados: 0, avarias: 0, retrabalhos: 0 },
                        chapatex: { adicionados: 0, avarias: 0, retrabalhos: 0 },
                        plastico: { adicionados: 0, avarias: 0, retrabalhos: 0 }
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
                    }
                };
                
                // Process all records
                for (const lancamentoId in dadosDia) {
                    const lancamento = dadosDia[lancamentoId];
                    
                    // Apply filters
                    if (turnoFilter !== 'all' && lancamento.turno !== turnoFilter) continue;
                    if (tipoFilter !== 'all' && lancamento.tipo !== tipoFilter) continue;
                    
                    // Sum by operation type
                    if (lancamento.operacao === 'adicionar') {
                        totais.adicionados += lancamento.quantidade;
                        totais.tipos[lancamento.tipo].adicionados += lancamento.quantidade;
                        totais.turnos[lancamento.turno].adicionados += lancamento.quantidade;
                    } 
                    else if (lancamento.operacao === 'avaria') {
                        totais.avarias += lancamento.quantidade;
                        totais.tipos[lancamento.tipo].avarias += lancamento.quantidade;
                        totais.turnos[lancamento.turno].avarias += lancamento.quantidade;
                        
                        // Count damage reasons
                        if (lancamento.motivo) {
                            totais.motivos[lancamento.motivo] += lancamento.quantidade;
                        }
                    } 
                    else if (lancamento.operacao === 'retrabalho') {
                        totais.retrabalhos += lancamento.quantidade;
                        totais.tipos[lancamento.tipo].retrabalhos += lancamento.quantidade;
                        totais.turnos[lancamento.turno].retrabalhos += lancamento.quantidade;
                    }
                }
                
                // Update UI
                updateDashboardUI(totais);
            } else {
                // Clear data if no records
                clearDashboardUI();
            }
        })
        .catch(error => {
            console.error("Error loading dashboard data:", error);
            alert('Erro ao carregar dados. Por favor, tente novamente.');
        });
}

// Update Dashboard UI
function updateDashboardUI(totais) {
    // Update stats
    totalAdicionados.textContent = totais.adicionados;
    addedDetail.textContent = `${totais.tipos.madeirite.adicionados}M / ${totais.tipos.chapatex.adicionados}C / ${totais.tipos.plastico.adicionados}P`;
    
    totalAvarias.textContent = totais.avarias;
    const avariaPercent = totais.adicionados > 0 ? (totais.avarias / totais.adicionados * 100).toFixed(1) : 0;
    damageRate.textContent = `${avariaPercent}%`;
    
    totalRetrabalhos.textContent = totais.retrabalhos;
    const reworkPercent = totais.adicionados > 0 ? (totais.retrabalhos / totais.adicionados * 100).toFixed(1) : 0;
    reworkRate.textContent = `${reworkPercent}%`;
    
    // Update charts
    updateDailyChart(totais);
    updateTypeChart(totais.tipos);
    updateDamageChart(totais.motivos);
    updateShiftChart(totais.turnos);
    
    // Update summary table
    updateSummaryTable(totais.tipos);
}

// Update Daily Chart
function updateDailyChart(totais) {
    const ctx = document.getElementById('daily-chart').getContext('2d');
    
    if (charts.daily) {
        charts.daily.destroy();
    }
    
    // Generate labels for the last 7 days
    const labels = [];
    const addedData = [];
    const damageData = [];
    const reworkData = [];
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        labels.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));
        
        // Simulate data - in a real app, you would fetch this from the database
        addedData.push(Math.round(totais.adicionados * (0.7 + Math.random() * 0.6)));
        damageData.push(Math.round(totais.avarias * (0.7 + Math.random() * 0.6)));
        reworkData.push(Math.round(totais.retrabalhos * (0.7 + Math.random() * 0.6)));
    }
    
    charts.daily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
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
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
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
            labels: ['Madeirite', 'Chapatex', 'Plástico'],
            datasets: [
                {
                    label: 'Adicionados',
                    data: [tipos.madeirite.adicionados, tipos.chapatex.adicionados, tipos.plastico.adicionados],
                    backgroundColor: '#4cc9f0',
                    borderColor: '#4cc9f0',
                    borderWidth: 1
                },
                {
                    label: 'Avarias',
                    data: [tipos.madeirite.avarias, tipos.chapatex.avarias, tipos.plastico.avarias],
                    backgroundColor: '#f72585',
                    borderColor: '#f72585',
                    borderWidth: 1
                },
                {
                    label: 'Retrabalhos',
                    data: [tipos.madeirite.retrabalhos, tipos.chapatex.retrabalhos, tipos.plastico.retrabalhos],
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
                    beginAtZero: true
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
                    suggestedMin: 0
                }
            }
        }
    });
}

// Update Summary Table
function updateSummaryTable(tipos) {
    const tbody = document.getElementById('summary-body');
    const tfoot = document.querySelector('.summary-table tfoot');
    
    // Calculate totals
    let totalAdicionados = 0;
    let totalAvarias = 0;
    let totalRetrabalhos = 0;
    
    // Update table rows
    const types = ['madeirite', 'chapatex', 'plastico'];
    const typeNames = { madeirite: 'Madeirite', chapatex: 'Chapatex', plastico: 'Plástico' };
    
    types.forEach((type, index) => {
        const row = tbody.children[index];
        const data = tipos[type];
        
        const total = data.adicionados - data.avarias + data.retrabalhos;
        const avariaPercent = data.adicionados > 0 ? (data.avarias / data.adicionados * 100).toFixed(1) : 0;
        const reworkPercent = data.adicionados > 0 ? (data.retrabalhos / data.adicionados * 100).toFixed(1) : 0;
        
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
    });
    
    // Update footer
    const totalGeral = totalAdicionados - totalAvarias + totalRetrabalhos;
    const avariaPercentTotal = totalAdicionados > 0 ? (totalAvarias / totalAdicionados * 100).toFixed(1) : 0;
    const reworkPercentTotal = totalAdicionados > 0 ? (totalRetrabalhos / totalAdicionados * 100).toFixed(1) : 0;
    
    tfoot.cells[1].textContent = totalGeral;
    tfoot.cells[2].textContent = totalAdicionados;
    tfoot.cells[3].textContent = totalAvarias;
    tfoot.cells[4].textContent = `${avariaPercentTotal}%`;
    tfoot.cells[5].textContent = totalRetrabalhos;
    tfoot.cells[6].textContent = `${reworkPercentTotal}%`;
}

// Clear Dashboard UI
function clearDashboardUI() {
    totalAdicionados.textContent = '0';
    addedDetail.textContent = '0M / 0C / 0P';
    totalAvarias.textContent = '0';
    damageRate.textContent = '0%';
    totalRetrabalhos.textContent = '0';
    reworkRate.textContent = '0%';
    
    // Clear summary table
    const tbody = document.getElementById('summary-body');
    const tfoot = document.querySelector('.summary-table tfoot');
    
    for (let i = 0; i < tbody.children.length; i++) {
        const row = tbody.children[i];
        for (let j = 1; j < row.cells.length; j++) {
            row.cells[j].textContent = '0';
            if (j === 4 || j === 6) row.cells[j].textContent = '0%';
        }
    }
    
    for (let i = 1; i < tfoot.cells.length; i++) {
        tfoot.cells[i].textContent = '0';
        if (i === 4 || i === 6) tfoot.cells[i].textContent = '0%';
    }
    
    // Destroy charts
    for (const chart in charts) {
        if (charts[chart]) {
            charts[chart].destroy();
            delete charts[chart];
        }
    }
}

// Save Register
function saveRegister() {
    const date = regDate.value;
    const turno = regShift.value;
    const tipo = regType.value;
    const operacao = regOperation.value;
    const quantidade = parseInt(regQuantity.value) || 0;
    
    if (quantidade <= 0) {
        alert('A quantidade deve ser maior que zero!');
        return;
    }
    
    const registro = {
        tipo: tipo,
        operacao: operacao,
        quantidade: quantidade,
        turno: turno,
        data: date,
        unidade: currentUserUnit,
        responsavel: currentUser.email,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Add operation specific fields
    if (operacao === 'avaria') {
        registro.motivo = damageReason.value;
        registro.detalhes = damageDetails.value || '';
    } 
    else if (operacao === 'retrabalho') {
        registro.retrabalhos = {};
        let totalRetrabalhos = 0;
        
        for (let i = 1; i <= 8; i++) {
            const qtd = parseInt(document.getElementById(`rework-${i}`).value) || 0;
            registro.retrabalhos[`vez_${i}`] = qtd;
            totalRetrabalhos += qtd;
        }
        
        if (totalRetrabalhos !== quantidade) {
            alert(`A soma dos retrabalhos (${totalRetrabalhos}) deve ser igual à quantidade informada (${quantidade})!`);
            return;
        }
    }
    
    // Save to Firebase
    const newRegistroRef = database.ref(`lancamentos/${currentUserUnit}/${date}`).push();
    newRegistroRef.set(registro)
        .then(() => {
            // Update total count
            return updateTotalPaletes(operacao, quantidade);
        })
        .then(() => {
            alert('Registro salvo com sucesso!');
            registerForm.reset();
            damageFields.classList.add('hidden');
            reworkFields.classList.add('hidden');
            
            // Reload dashboard if on the same date
            if (date === new Date().toISOString().split('T')[0]) {
                loadDashboardData(date, 'all', 'all');
            }
        })
        .catch(error => {
            console.error("Error saving register:", error);
            alert('Erro ao salvar registro. Por favor, tente novamente.');
        });
}

// Update Total Paletes
function updateTotalPaletes(operacao, quantidade) {
    return database.ref(`totais/${currentUserUnit}`).once('value')
        .then(snapshot => {
            let currentTotal = snapshot.val() || 0;
            let newTotal = currentTotal;
            
            if (operacao === 'adicionar') {
                newTotal += quantidade;
            } else if (operacao === 'avaria') {
                newTotal -= quantidade;
            } else if (operacao === 'retrabalho') {
                newTotal += quantidade;
            }
            
            // Update in Firebase
            return database.ref(`totais/${currentUserUnit}`).set(newTotal)
                .then(() => {
                    totalPaletesElement.textContent = newTotal;
                });
        });
}

// Load History Data
function loadHistoryData() {
    const activePeriodBtn = document.querySelector('#historico-section .period-btn.active');
    let startDate, endDate;
    
    if (activePeriodBtn.dataset.period === 'custom') {
        const dateRangeValue = historyDateRange.value;
        if (dateRangeValue) {
            const dates = dateRangeValue.split(' a ');
            startDate = formatDateForFirebase(dates[0]);
            endDate = formatDateForFirebase(dates[1]);
        } else {
            startDate = endDate = new Date().toISOString().split('T')[0];
        }
    } else {
        const dates = getPeriodDates(activePeriodBtn.dataset.period);
        startDate = dates.startDate;
        endDate = dates.endDate;
    }
    
    const turno = historyShift.value;
    const tipo = historyType.value;
    const operacao = historyOperation.value;
    
    // For simplicity, we'll just load data for the end date
    // In a real app, you would load data for each day in the range
    database.ref(`lancamentos/${currentUserUnit}/${endDate}`).once('value')
        .then(snapshot => {
            const dados = snapshot.val();
            historyBody.innerHTML = '';
            
            if (dados) {
                let allData = [];
                
                for (const lancamentoId in dados) {
                    const lancamento = dados[lancamentoId];
                    
                    // Apply filters
                    if (turno !== 'all' && lancamento.turno !== turno) continue;
                    if (tipo !== 'all' && lancamento.tipo !== tipo) continue;
                    if (operacao !== 'all' && lancamento.operacao !== operacao) continue;
                    
                    allData.push(lancamento);
                }
                
                // Sort by timestamp (newest first)
                allData.sort((a, b) => b.timestamp - a.timestamp);
                
                // Pagination
                historicoTotalPages = Math.ceil(allData.length / historicoPageSize);
                const startIndex = (historicoPage - 1) * historicoPageSize;
                const endIndex = Math.min(startIndex + historicoPageSize, allData.length);
                const pageData = allData.slice(startIndex, endIndex);
                
                if (pageData.length > 0) {
                    pageData.forEach(lancamento => {
                        addHistoryRow(lancamento);
                    });
                } else {
                    historyBody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhum registro encontrado</td></tr>';
                }
                
                // Update pagination controls
                updatePaginationControls();
            } else {
                historyBody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhum registro encontrado</td></tr>';
                updatePaginationControls();
            }
        })
        .catch(error => {
            console.error("Error loading history data:", error);
            alert('Erro ao carregar histórico. Por favor, tente novamente.');
        });
}

// Add History Row
function addHistoryRow(lancamento) {
    const row = document.createElement('tr');
    const formattedDate = formatDateBr(lancamento.data);
    
    let detalhes = '';
    if (lancamento.operacao === 'avaria') {
        detalhes = `${formatMotivo(lancamento.motivo)}${lancamento.detalhes ? ': ' + lancamento.detalhes : ''}`;
    } else if (lancamento.operacao === 'retrabalho') {
        detalhes = 'Retrabalhos: ' + 
            Object.entries(lancamento.retrabalhos)
                .filter(([_, qtd]) => qtd > 0)
                .map(([vez, qtd]) => `${vez.replace('vez_', '')}ª vez: ${qtd}`)
                .join(', ');
    }
    
    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>Turno ${lancamento.turno}</td>
        <td>${formatTipo(lancamento.tipo)}</td>
        <td>${formatOperacao(lancamento.operacao)}</td>
        <td>${lancamento.quantidade}</td>
        <td>${detalhes}</td>
        <td>${lancamento.responsavel}</td>
    `;
    
    historyBody.appendChild(row);
}

// Update Pagination Controls
function updatePaginationControls() {
    pageInfo.textContent = `Página ${historicoPage} de ${historicoTotalPages}`;
    prevPage.disabled = historicoPage <= 1;
    nextPage.disabled = historicoPage >= historicoTotalPages;
}

// Export History to CSV
function exportHistoryToCSV() {
    const activePeriodBtn = document.querySelector('#historico-section .period-btn.active');
    let startDate, endDate;
    
    if (activePeriodBtn.dataset.period === 'custom') {
        const dateRangeValue = historyDateRange.value;
        if (dateRangeValue) {
            const dates = dateRangeValue.split(' a ');
            startDate = formatDateForFirebase(dates[0]);
            endDate = formatDateForFirebase(dates[1]);
        } else {
            startDate = endDate = new Date().toISOString().split('T')[0];
        }
    } else {
        const dates = getPeriodDates(activePeriodBtn.dataset.period);
        startDate = dates.startDate;
        endDate = dates.endDate;
    }
    
    const turno = historyShift.value;
    const tipo = historyType.value;
    const operacao = historyOperation.value;
    
    // For simplicity, we'll just export data for the end date
    database.ref(`lancamentos/${currentUserUnit}/${endDate}`).once('value')
        .then(snapshot => {
            const dados = snapshot.val();
            let csvContent = "Data,Turno,Tipo,Operação,Quantidade,Detalhes,Responsável\n";
            
            if (dados) {
                for (const lancamentoId in dados) {
                    const lancamento = dados[lancamentoId];
                    
                    // Apply filters
                    if (turno !== 'all' && lancamento.turno !== turno) continue;
                    if (tipo !== 'all' && lancamento.tipo !== tipo) continue;
                    if (operacao !== 'all' && lancamento.operacao !== operacao) continue;
                    
                    let detalhes = '';
                    if (lancamento.operacao === 'avaria') {
                        detalhes = `${formatMotivo(lancamento.motivo)}${lancamento.detalhes ? ': ' + lancamento.detalhes : ''}`;
                    } else if (lancamento.operacao === 'retrabalho') {
                        detalhes = 'Retrabalhos: ' + 
                            Object.entries(lancamento.retrabalhos)
                                .filter(([_, qtd]) => qtd > 0)
                                .map(([vez, qtd]) => `${vez.replace('vez_', '')}ª vez: ${qtd}`)
                                .join(', ');
                    }
                    
                    csvContent += `"${formatDateBr(lancamento.data)}","Turno ${lancamento.turno}","${formatTipo(lancamento.tipo)}","${formatOperacao(lancamento.operacao)}","${lancamento.quantidade}","${detalhes}","${lancamento.responsavel}"\n`;
                }
            }
            
            // Create and download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `historico_paletes_${startDate}_${endDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => {
            console.error("Error exporting history:", error);
            alert('Erro ao exportar histórico. Por favor, tente novamente.');
        });
}

// Format Date to BR
function formatDateBr(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Format Operation
function formatOperacao(operacao) {
    const operacoes = {
        "adicionar": "Adicionar",
        "avaria": "Avaria",
        "retrabalho": "Retrabalho"
    };
    return operacoes[operacao] || operacao;
}

// Format Type
function formatTipo(tipo) {
    const tipos = {
        "madeirite": "Madeirite",
        "chapatex": "Chapatex",
        "plastico": "Plástico"
    };
    return tipos[tipo] || tipo;
}

// Format Damage Reason
function formatMotivo(motivo) {
    const motivos = {
        "tempo": "Danificado pelo tempo",
        "empilhadeira": "Danificado por empilhadeira",
        "manuseio": "Danificado no manuseio",
        "outro": "Outro motivo"
    };
    return motivos[motivo] || motivo;
}