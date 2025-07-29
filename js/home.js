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

window.addEventListener('DOMContentLoaded', () => {
    const inputDate = document.getElementById('reg-date');
    const today = new Date();

    // Formata para "YYYY-MM-DD"
    const formattedDate = today.toISOString().split('T')[0];
    
    inputDate.value = formattedDate;
  });

function controlevisibilidade() {
    const selecao = document.getElementById('reg-operation').value;
    const avariaFields = document.getElementById('damage-fields');
    const reworkFields = document.getElementById('rework-fields');

    avariaFields.classList.add('hidden');
    reworkFields.classList.add('hidden');

    if (selecao === 'avaria') {
        avariaFields.classList.remove('hidden');
    } else if (selecao === 'retrabalho') {
        reworkFields.classList.remove('hidden');
    } else if (selecao === 'Custos') {
                window.location.href = '../src/custos.html';
            }
}

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
            
            // Update section title
            sectionTitle.textContent = item.querySelector('span').textContent;
            
            // Redirect to other pages
            const sectionId = item.dataset.section;
            if (sectionId === 'dashboard') {
                window.location.href = 'dashboard.html';
            } else if (sectionId === 'historico') {
                window.location.href = 'historico.html';
            } else if (sectionId === 'Retrabalhos') {
                window.location.href = '../src/Retrabalhos.html';
            }
            // Register section is already active by default
        });
    });
    
    // Register - Operation Change
    regOperation.addEventListener('change', controlevisibilidade);
    
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
            return database.ref(`totais/${currentUserUnit}`).set(newTotal);
        });
}

// Format Date to BR
function formatDateBr(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}