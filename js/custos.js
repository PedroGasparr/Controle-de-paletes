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
const auth = firebase.auth();
const database = firebase.database();

// Quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verifica autenticação
    auth.onAuthStateChanged(user => {
        if (!user) {
            // Se não estiver autenticado, redireciona
            window.location.href = '../index.html';
        } else {
            // Carrega dados do usuário e valores atuais
            loadUserData(user);
            loadCurrentValues();
        }
    });

    // Configura eventos
    setupEventListeners();
    
    // Atualiza data atual
    updateCurrentDate();
    
    // Configura submit do formulário
    document.getElementById('custos-form').addEventListener('submit', saveValues);
    document.getElementById('cancel-btn').addEventListener('click', resetForm);
});

// Carrega dados do usuário
function loadUserData(user) {
    database.ref('users/' + user.uid).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.unit) {
                // Mapeia unidades para nomes completos
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
                    // Atualiza interface com dados da unidade
                    document.getElementById('user-unit').textContent = units[userData.unit];
                    document.getElementById('current-unit').textContent = units[userData.unit];
                }
                
                // Mostra email do usuário
                document.getElementById('user-email').textContent = user.email;
            }
        })
        .catch(error => {
            console.error("Erro ao carregar dados do usuário:", error);
        });
}

// Carrega valores atuais do banco de dados
async function loadCurrentValues() {
    try {
        const unit = await getUserUnit();
        if (!unit) {
            console.error("Unidade não encontrada");
            return;
        }

        // Referência para os custos da unidade
        const dbRef = database.ref('custos/' + unit);
        const snapshot = await dbRef.once('value');
        
        if (snapshot.exists()) {
            // Preenche os campos com os valores existentes
            const valores = snapshot.val();
            document.getElementById('palete-comum').value = valores.paleteComum || '';
            document.getElementById('madeirite').value = valores.madeirite || '';
            document.getElementById('chapatex').value = valores.chapatex || '';
            document.getElementById('slip-sheet').value = valores.slipSheet || '';
        }
        
    } catch (error) {
        console.error("Erro ao carregar valores:", error);
    } finally {
        // Esconde mensagem de carregamento
        document.getElementById('loading-message').style.display = 'none';
    }
}

// Salva os valores no banco de dados
async function saveValues(e) {
    e.preventDefault();
    
    // Obtém valores dos campos
    const paleteComum = parseFloat(document.getElementById('palete-comum').value);
    const madeirite = parseFloat(document.getElementById('madeirite').value);
    const chapatex = parseFloat(document.getElementById('chapatex').value);
    const slipSheet = parseFloat(document.getElementById('slip-sheet').value);
    
    // Validações
    if (isNaN(paleteComum)) {
        alert("Por favor, insira um valor válido para Palete Comum");
        return;
    }
    
    if (isNaN(madeirite)) {
        alert("Por favor, insira um valor válido para Madeirite");
        return;
    }
    
    if (isNaN(chapatex)) {
        alert("Por favor, insira um valor válido para Chapatex");
        return;
    }
    
    if (isNaN(slipSheet)) {
        alert("Por favor, insira um valor válido para Slip Sheet");
        return;
    }
    
    try {
        const unit = await getUserUnit();
        if (!unit) {
            alert("Unidade não encontrada");
            return;
        }
        
        // Atualiza interface durante o salvamento
        const saveBtn = document.getElementById('save-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        // Salva no Firebase
        await database.ref('custos/' + unit).set({
            paleteComum: paleteComum,
            madeirite: madeirite,
            chapatex: chapatex,
            slipSheet: slipSheet,
            updatedAt: new Date().toISOString()
        });
        
        // Mostra mensagem de sucesso
        showSuccessMessage();
        
    } catch (error) {
        console.error("Erro ao salvar valores:", error);
        alert("Ocorreu um erro ao salvar os valores. Por favor, tente novamente.");
    } finally {
        // Restaura botão de salvar
        const saveBtn = document.getElementById('save-btn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Valores';
    }
}

// Mostra mensagem de sucesso
function showSuccessMessage() {
    const successMsg = document.getElementById('success-message');
    successMsg.style.display = 'flex';
    
    // Esconde após 3 segundos
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
}

// Reseta o formulário
function resetForm() {
    document.getElementById('custos-form').reset();
}

// Obtém a unidade do usuário atual
async function getUserUnit() {
    const user = auth.currentUser;
    if (!user) return null;
    
    const snapshot = await database.ref('users/' + user.uid).once('value');
    return snapshot.val()?.unit || null;
}

// Configura os listeners de eventos
function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;
            if (sectionId === 'dashboard') {
                window.location.href = 'dashboard.html';
            } else if (sectionId === 'registro') {
                window.location.href = 'home.html';
            } else if (sectionId === 'historico') {
                window.location.href = 'historico.html';
            } else if (sectionId === 'Retrabalhos') {
                window.location.href = 'Retrabalhos.html';
            }
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        });
    });
}

// Atualiza a data atual na interface
function updateCurrentDate() {
    const now = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', options);
}