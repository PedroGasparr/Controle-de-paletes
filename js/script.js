// Configuração do Firebase
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

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Referências aos serviços
const auth = firebase.auth();
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

// Elementos da DOM
const loginContainer = document.getElementById('login-container');
const signupContainer = document.getElementById('signup-container');
const unitSelection = document.getElementById('unit-selection');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const googleLoginBtn = document.getElementById('google-login');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const unitOptions = document.getElementById('unit-options');
const confirmUnitBtn = document.getElementById('confirm-unit');
const messageBox = document.getElementById('message-box');

// Unidades disponíveis (agora com ícones e mais informações)
const units = {
    "maracanau_ce": { 
        name: "Unidade Maracanaú", 
        address: "Maracanaú - CE",
        icon: "fas fa-warehouse",
        description: "Armazém principal"
    },
    "belem_pa": { 
        name: "Unidade Belém", 
        address: "Belém - PA",
        icon: "fas fa-warehouse",
        description: "Distribuição Norte"
    },
    "imperatriz_ma": { 
        name: "Unidade Imperatriz", 
        address: "Imperatriz - MA",
        icon: "fas fa-warehouse",
        description: "Centro logístico"
    },
    "mogi_das_cruzes_sp": { 
        name: "Unidade Mogi das Cruzes", 
        address: "Mogi das Cruzes - SP",
        icon: "fas fa-warehouse",
        description: "Distribuição Sudeste"
    },
    "cariacica_es": { 
        name: "Unidade Cariacica", 
        address: "Cariacica - ES",
        icon: "fas fa-warehouse",
        description: "Centro de distribuição"
    },
    "aracruz_es": { 
        name: "Unidade Aracruz", 
        address: "Aracruz - ES",
        icon: "fas fa-warehouse",
        description: "Armazém regional"
    },
    "teste_teste": { 
        name: "Unidade Teste", 
        address: "Teste - Teste",
        icon: "fas fa-flask",
        description: "Ambiente de testes"
    }
};

// Estado da aplicação
let selectedUnit = null;

/**
 * Mostra mensagem para o usuário
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de mensagem (success, error, warning)
 */
function showMessage(message, type = 'success') {
    messageBox.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 
                          type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
        ${message}
    `;
    messageBox.className = `message-box ${type} show`;
    
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 5000);
}

/**
 * Carrega as opções de unidades na tela
 */
function loadUnitOptions() {
    unitOptions.innerHTML = '';
    
    Object.entries(units).forEach(([id, unit]) => {
        const unitElement = document.createElement('div');
        unitElement.className = 'unit-option';
        unitElement.dataset.unit = id;
        unitElement.innerHTML = `
            <i class="${unit.icon} unit-icon"></i>
            <div class="unit-info">
                <h3>${unit.name}</h3>
                <p>${unit.address}</p>
                <small>${unit.description}</small>
            </div>
        `;
        
        unitElement.addEventListener('click', () => selectUnit(id, unitElement));
        unitOptions.appendChild(unitElement);
    });
}

/**
 * Seleciona uma unidade
 * @param {string} unitId - ID da unidade
 * @param {HTMLElement} element - Elemento HTML da unidade
 */
function selectUnit(unitId, element) {
    document.querySelectorAll('.unit-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedUnit = unitId;
    confirmUnitBtn.disabled = false;
}

/**
 * Mostra uma tela específica (login, cadastro ou seleção de unidade)
 * @param {string} screen - Nome da tela a ser mostrada
 */
function showScreen(screen) {
    loginContainer.classList.add('hidden');
    signupContainer.classList.add('hidden');
    unitSelection.classList.add('hidden');
    
    switch(screen) {
        case 'login':
            loginContainer.classList.remove('hidden');
            break;
        case 'signup':
            signupContainer.classList.remove('hidden');
            break;
        case 'unit':
            loadUnitOptions();
            confirmUnitBtn.disabled = true;
            unitSelection.classList.remove('hidden');
            break;
    }
}

/**
 * Verifica se o usuário tem uma unidade cadastrada
 * @param {string} userId - ID do usuário
 */
async function checkUserUnit(userId) {
    try {
        const snapshot = await database.ref('users/' + userId).once('value');
        const userData = snapshot.val();
        
        if (userData?.unit) {
            // Usuário já tem unidade, redirecionar após 1s
            setTimeout(() => {
                window.location.href = 'src/dashboard.html';
            }, 1000);
        } else {
            // Precisa selecionar unidade
            showScreen('unit');
        }
    } catch (error) {
        console.error("Erro ao verificar unidade:", error);
        showMessage("Erro ao carregar informações da unidade", 'error');
        showScreen('unit');
    }
}

/**
 * Realiza o login com email e senha
 * @param {string} email 
 * @param {string} password 
 */
async function loginWithEmail(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        throw error;
    }
}

/**
 * Cria um novo usuário com email e senha
 * @param {string} email 
 * @param {string} password 
 */
async function signUpWithEmail(email, password) {
    try {
        await auth.createUserWithEmailAndPassword(email, password);
    } catch (error) {
        throw error;
    }
}

/**
 * Realiza login com o Google
 */
async function loginWithGoogle() {
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        throw error;
    }
}

/**
 * Salva a unidade selecionada pelo usuário
 */
async function saveSelectedUnit() {
    if (!selectedUnit) {
        showMessage("Selecione uma unidade antes de continuar", 'warning');
        return;
    }
    
    const user = auth.currentUser;
    if (!user) {
        showMessage("Usuário não autenticado", 'error');
        return;
    }
    
    try {
        await database.ref('users/' + user.uid).set({
            email: user.email,
            unit: selectedUnit,
            lastLogin: firebase.database.ServerValue.TIMESTAMP,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        showMessage("Unidade selecionada com sucesso!", 'success');
        setTimeout(() => {
            window.location.href = 'src/dashboard.html';
        }, 1500);
    } catch (error) {
        showMessage("Erro ao salvar unidade: " + error.message, 'error');
    }
}

/**
 * Traduz códigos de erro do Firebase para mensagens amigáveis
 * @param {object} error - Objeto de erro do Firebase
 * @returns {string} Mensagem de erro traduzida
 */
function getErrorMessage(error) {
    const errorMap = {
        'auth/invalid-email': 'E-mail inválido',
        'auth/user-disabled': 'Esta conta foi desativada',
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/email-already-in-use': 'E-mail já está em uso',
        'auth/operation-not-allowed': 'Operação não permitida',
        'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
        'auth/popup-closed-by-user': 'Login com Google cancelado',
        'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail em outro provedor'
    };
    
    return errorMap[error.code] || error.message || "Ocorreu um erro desconhecido";
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await loginWithEmail(email, password);
    } catch (error) {
        showMessage(getErrorMessage(error), 'error');
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        showMessage("As senhas não coincidem!", 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage("A senha deve ter no mínimo 6 caracteres", 'warning');
        return;
    }
    
    try {
        await signUpWithEmail(email, password);
    } catch (error) {
        showMessage(getErrorMessage(error), 'error');
    }
});

googleLoginBtn.addEventListener('click', async () => {
    try {
        await loginWithGoogle();
    } catch (error) {
        showMessage(getErrorMessage(error), 'error');
    }
});

confirmUnitBtn.addEventListener('click', async () => {
    await saveSelectedUnit();
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('signup');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('login');
});

// Observador de estado de autenticação
auth.onAuthStateChanged(user => {
    if (user) {
        checkUserUnit(user.uid);
    } else {
        showScreen('login');
    }
});

// Inicialização
showScreen('login');