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

        document.addEventListener('DOMContentLoaded', function() {
            // Check authentication
            auth.onAuthStateChanged(user => {
                if (!user) {
                    window.location.href = '../index.html';
                } else {
                    loadUserData(user);
                    loadRetrabalhosData();
                }
            });

            // Setup navigation and logout
            setupEventListeners();
            
            // Update current date
            updateCurrentDate();
        });

        function loadUserData(user) {
            database.ref('users/' + user.uid).once('value')
                .then(snapshot => {
                    const userData = snapshot.val();
                    if (userData && userData.unit) {
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
                            document.getElementById('user-unit').textContent = units[userData.unit];
                            document.getElementById('current-unit').textContent = units[userData.unit];
                        }
                        
                        document.getElementById('user-email').textContent = user.email;
                    }
                })
                .catch(error => {
                    console.error("Error loading user data:", error);
                });
        }

        async function loadRetrabalhosData() {
            try {
                const unit = await getUserUnit();
                if (!unit) {
                    console.error("Unidade não encontrada");
                    return;
                }

                const dbRef = database.ref('lancamentos/' + unit);
                const snapshot = await dbRef.once('value');
                
                // Inicializa contagem de paletes por número de retrabalhos (1x a 8x)
                const paletesPorRetrabalho = Array(8).fill(0);
                
                // Processa todos os lançamentos
                snapshot.forEach(dateSnapshot => {
                    dateSnapshot.forEach(lancamentoSnapshot => {
                        const lancamento = lancamentoSnapshot.val();
                        
                        if (lancamento.operacao === 'retrabalho' && lancamento.retrabalhos) {
                            // Processa cada vez de retrabalho
                            for (let vez = 1; vez <= 8; vez++) {
                                const qtd = parseInt(lancamento.retrabalhos[`vez_${vez}`]) || 0;
                                
                                if (qtd > 0) {
                                    // Adiciona a quantidade diretamente ao array de contagem
                                    // Considerando que vez_1 = 1x retrabalho, vez_2 = 2x, etc.
                                    paletesPorRetrabalho[vez-1] += qtd;
                                }
                            }
                        }
                    });
                });
                
                // Agora processamos a lógica de avanço dos retrabalhos
                const resultadoFinal = Array(8).fill(0);
                
                // Começamos pelos retrabalhos mais altos (8x) e vamos descendo
                for (let i = 7; i >= 0; i--) {
                    if (i === 0) {
                        // Para 1x retrabalho, simplesmente adicionamos
                        resultadoFinal[i] = paletesPorRetrabalho[i];
                    } else {
                        // Para retrabalhos >1x, subtraímos dos anteriores
                        resultadoFinal[i] = paletesPorRetrabalho[i];
                        
                        // Subtraímos esta quantidade do nível anterior
                        if (resultadoFinal[i] > 0 && i > 0) {
                            paletesPorRetrabalho[i-1] = Math.max(0, paletesPorRetrabalho[i-1] - resultadoFinal[i]);
                        }
                    }
                }
                
                // Renderiza a tabela com o resultado final
                renderRetrabalhosTable(resultadoFinal);
                
            } catch (error) {
                console.error("Erro ao carregar retrabalhos:", error);
                renderRetrabalhosTable([]);
            } finally {
                document.getElementById('loading-message').style.display = 'none';
            }
        }

        function renderRetrabalhosTable(data) {
            const tbody = document.getElementById('retrabalhos-tbody');
            tbody.innerHTML = '';
            
            let hasData = false;
            let totalPaletes = 0;
            
            for (let i = 0; i < data.length; i++) {
                if (data[i] > 0) {
                    hasData = true;
                    totalPaletes += data[i];
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${i+1}x</td>
                        <td>${data[i]}</td>
                    `;
                    tbody.appendChild(tr);
                }
            }
            
            if (!hasData) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="2">Nenhum registro de retrabalhos encontrado</td>';
                tbody.appendChild(tr);
            } else {
                // Adiciona linha de total
                const trTotal = document.createElement('tr');
                trTotal.style.fontWeight = 'bold';
                trTotal.innerHTML = `
                    <td>Total</td>
                    <td>${totalPaletes}</td>
                `;
                tbody.appendChild(trTotal);
            }
        }

        async function getUserUnit() {
            const user = auth.currentUser;
            if (!user) return null;
            
            const snapshot = await database.ref('users/' + user.uid).once('value');
            return snapshot.val()?.unit || null;
        }

        function setupEventListeners() {
            // Navigation
            document.querySelectorAll('.sidebar-nav li').forEach(item => {
                item.addEventListener('click', () => {
                    const sectionId = item.dataset.section;
                    if (sectionId === 'dashboard') {
                        window.location.href = 'dashboard.html';
                    } else if (sectionId === 'registro') {
                        window.location.href = 'home.html';
                    } else if (sectionId === 'historico') {
                        window.location.href = 'historico.html';
                    } else if (sectionId === 'Custos') {
                        window.location.href = '../src/custos.html';
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

        function updateCurrentDate() {
            const now = new Date();
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', options);
        }