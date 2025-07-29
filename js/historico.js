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

// DOM Elements
const userEmail = document.getElementById('user-email');
const userUnit = document.getElementById('user-unit');
const currentUnit = document.getElementById('current-unit');
const currentDate = document.getElementById('current-date');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.sidebar-nav li');
const sectionTitle = document.getElementById('section-title');



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
    
    // Set current date in forms
    const today = new Date().toISOString().split('T')[0];
    regDate.value = today;
    
    // Setup event listeners
    setupEventListeners();
});

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

function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Atualiza o título da seção, se existir esse elemento
            if (sectionTitle) {
                sectionTitle.textContent = item.querySelector('span').textContent;
            }

            // Redireciona
            const sectionId = item.dataset.section;
            if (sectionId === 'dashboard') {
                window.location.href = 'dashboard.html';
            } else if (sectionId === 'registro') {
                window.location.href = 'home.html';
            } else if (sectionId === 'Retrabalhos') {
                window.location.href = '../src/Retrabalhos.html';
            } else if (sectionId === 'Custos') {
                window.location.href = '../src/custos.html';
            }
        });
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut()
                .then(() => window.location.href = '../index.html')
                .catch(error => console.error("Logout error:", error));
        });
    }
}

// Só inicia quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function updateCurrentDate() {
    const now = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    currentDate.textContent = now.toLocaleDateString('pt-BR', options);
}
// ... (mantenha todo o código existente até o final)

// Adicione estas novas funções após as existentes:

// Load History Data
function loadHistoryData(startDate = null, endDate = null) {
    const historyRef = database.ref('lancamentos/' + currentUserUnit);
    const tableBody = document.getElementById('history-table-body');
    
    tableBody.innerHTML = '<tr><td colspan="6">Carregando dados...</td></tr>';
    
    historyRef.once('value')
        .then(snapshot => {
            const data = snapshot.val();
            tableBody.innerHTML = '';
            
            if (!data) {
                tableBody.innerHTML = '<tr><td colspan="6">Nenhum registro encontrado</td></tr>';
                return;
            }
            
            let entries = [];
            
            // Process each date
            Object.keys(data).forEach(date => {
                // Check if date is within filter range
                if (startDate && endDate) {
                    const entryDate = new Date(date);
                    if (entryDate < new Date(startDate) || entryDate > new Date(endDate)) {
                        return; // skip if outside date range
                    }
                }
                
                // Process each entry for the date
                const dateEntries = data[date];
                Object.keys(dateEntries).forEach(entryId => {
                    const entry = dateEntries[entryId];
                    entries.push({
                        date: entry.data,
                        ...entry
                    });
                });
            });
            
            // Sort by timestamp (newest first)
            entries.sort((a, b) => b.timestamp - a.timestamp);
            
            // Display in table
            if (entries.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6">Nenhum registro encontrado para o período selecionado</td></tr>';
                return;
            }
            
            entries.forEach(entry => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${formatDate(entry.data)}</td>
                    <td>${capitalizeFirstLetter(entry.tipo)}</td>
                    <td>${capitalizeFirstLetter(entry.operacao)}</td>
                    <td>${entry.quantidade}</td>
                    <td>${entry.turno}</td>
                    <td>${entry.responsavel}</td>
                `;
                
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error loading history data:", error);
            tableBody.innerHTML = '<tr><td colspan="6">Erro ao carregar dados</td></tr>';
        });
}

// Format date to dd/mm/yyyy
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Export to CSV
function exportToCSV() {
    const historyRef = database.ref('lancamentos/' + currentUserUnit);
    
    historyRef.once('value')
        .then(snapshot => {
            const data = snapshot.val();
            let csvContent = "Data,Tipo,Operação,Quantidade,Turno,Responsável,Motivo,Detalhes,Retrabalhos\n";
            
            if (!data) {
                alert('Nenhum dado disponível para exportar');
                return;
            }
            
            // Process each date
            Object.keys(data).forEach(date => {
                const dateEntries = data[date];
                
                // Process each entry for the date
                Object.keys(dateEntries).forEach(entryId => {
                    const entry = dateEntries[entryId];
                    
                    // Format retrabalhos if exists
                    let retrabalhos = '';
                    if (entry.retrabalhos) {
                        retrabalhos = Object.values(entry.retrabalhos).join('|');
                    }
                    
                    // Add row to CSV
                    csvContent += `"${entry.data}",` +
                                 `"${entry.tipo}",` +
                                 `"${entry.operacao}",` +
                                 `"${entry.quantidade}",` +
                                 `"${entry.turno}",` +
                                 `"${entry.responsavel}",` +
                                 `"${entry.motivo || ''}",` +
                                 `"${entry.detalhes || ''}",` +
                                 `"${retrabalhos}"\n`;
                });
            });
            
            // Create download link
            const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `historico_paletes_${currentUserUnit}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => {
            console.error("Error exporting data:", error);
            alert('Erro ao exportar dados');
        });
}

// Setup History Event Listeners
function setupHistoryEventListeners() {
    // Set default dates (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    document.getElementById('start-date').valueAsDate = startDate;
    document.getElementById('end-date').valueAsDate = endDate;
    
    // Filter button
    document.getElementById('filter-btn').addEventListener('click', () => {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            alert('Selecione ambas as datas para filtrar');
            return;
        }
        
        loadHistoryData(startDate, endDate);
    });
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', exportToCSV);
    
    // Load initial data
    loadHistoryData();
}

// Update the DOMContentLoaded event listener to include history setup
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '../index.html';
        } else {
            currentUser = user;
            loadUserData(user);
            setupHistoryEventListeners(); // Add this line
        }
    });
    
    // Setup event listeners
    setupEventListeners();
});
