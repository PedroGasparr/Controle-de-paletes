// Configuração do Firebase (substitua com suas credenciais)
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

// Unidades disponíveis
const units = {
    "maracanau_ce": { name: "Unidade Maracanaú", address: "Maracanaú - CE" },
    "belem_pa": { name: "Unidade Belém", address: "Belém - PA" },
    "imperatriz_ma": { name: "Unidade Imperatriz", address: "Imperatriz - MA" },
    "mogi_das_cruzes_sp": { name: "Unidade Mogi das Cruzes", address: "Mogi das Cruzes - SP" },
    "cariacica_es": { name: "Unidade Cariacica", address: "Cariacica - ES" },
    "aracruz_es": { name: "Unidade Aracruz", address: "Aracruz - ES" },
    "teste_teste": { name: "Unidade Teste", address: "Teste - Teste" }
};




// Variável para armazenar a unidade selecionada
let selectedUnit = null;

// Mostrar mensagem
function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.className = isError ? 'message-box error' : 'message-box success';
    messageBox.classList.remove('hidden');
    
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

// Carregar opções de unidades
function loadUnitOptions() {
    unitOptions.innerHTML = '';
    
    for (const [id, unit] of Object.entries(units)) {
        const unitElement = document.createElement('div');
        unitElement.className = 'unit-option';
        unitElement.dataset.unit = id;
        unitElement.innerHTML = `
            <h3>${unit.name}</h3>
            <p>${unit.address}</p>
        `;
        
        unitElement.addEventListener('click', () => {
            document.querySelectorAll('.unit-option').forEach(el => el.classList.remove('selected'));
            unitElement.classList.add('selected');
            selectedUnit = id;
            confirmUnitBtn.disabled = false;
        });
        
        unitOptions.appendChild(unitElement);
    }
}

// Alternar entre telas
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
            unitSelection.classList.remove('hidden');
            break;
    }
}

// Verificar se o usuário já está logado
auth.onAuthStateChanged(user => {
    if (user) {
        // Verificar se o usuário já tem unidade cadastrada
        database.ref('users/' + user.uid).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.unit) {
                    // Já tem unidade, redirecionar para dashboard
                    window.location.href = 'src/dashboard.html';
                } else {
                    // Precisa selecionar unidade
                    showScreen('unit');
                }
            })
            .catch(error => {
                console.error("Erro ao verificar unidade:", error);
                showScreen('unit');
            });
    } else {
        showScreen('login');
    }
});

// Login com email e senha
loginForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Redirecionamento acontece no onAuthStateChanged
        })
        .catch(error => {
            showMessage(getErrorMessage(error), true);
        });
});

// Cadastro com email e senha
signupForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        showMessage("As senhas não coincidem!", true);
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            // Redirecionamento acontece no onAuthStateChanged
        })
        .catch(error => {
            showMessage(getErrorMessage(error), true);
        });
});

// Login com Google
googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then(() => {
            // Redirecionamento acontece no onAuthStateChanged
        })
        .catch(error => {
            showMessage(getErrorMessage(error), true);
        });
});

// Confirmar seleção de unidade
confirmUnitBtn.addEventListener('click', () => {
    if (!selectedUnit) return;
    
    const user = auth.currentUser;
    if (!user) {
        showMessage("Usuário não autenticado!", true);
        return;
    }
    
    // Salvar a unidade no Realtime Database
    database.ref('users/' + user.uid).set({
        email: user.email,
        unit: selectedUnit,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    })
    .then(() => {
        window.location.href = 'src/dashboard.html';
    })
    .catch(error => {
        showMessage("Erro ao salvar unidade: " + error.message, true);
    });
});

// Alternar entre login e cadastro
showSignup.addEventListener('click', e => {
    e.preventDefault();
    showScreen('signup');
});

showLogin.addEventListener('click', e => {
    e.preventDefault();
    showScreen('login');
});

// Traduzir mensagens de erro do Firebase
function getErrorMessage(error) {
    switch(error.code) {
        case 'auth/invalid-email':
            return "E-mail inválido!";
        case 'auth/user-disabled':
            return "Usuário desativado!";
        case 'auth/user-not-found':
            return "Usuário não encontrado!";
        case 'auth/wrong-password':
            return "Senha incorreta!";
        case 'auth/email-already-in-use':
            return "E-mail já está em uso!";
        case 'auth/operation-not-allowed':
            return "Operação não permitida!";
        case 'auth/weak-password':
            return "Senha fraca (mínimo 6 caracteres)!";
        case 'auth/popup-closed-by-user':
            return "Login com Google cancelado!";
        default:
            return "Erro: " + error.message;
    }
}

// Inicializar mostrando a tela de login
showScreen('login');