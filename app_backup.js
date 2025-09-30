class GoalkeeperTracker {
    constructor() {
        this.currentMatch = null;
        this.actions = [];
        this.customGestures = [];
        this.timer = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.currentHalf = 'none';
        this.isPaused = false;
        this.matchPhase = 'not_started'; // not_started, first_half, half_time, second_half, finished
        this.deferredPrompt = null; // Para PWA installation

        this.loadCustomGestures(); // Cargar gestos guardados
        this.initializeApp();
        this.setupEventListeners();
        this.setupPWAInstallation();
        // NO cargar automáticamente para evitar acciones predeterminadas
    }

    initializeApp() {
        this.showWelcomeScreen();
        this.updateDisplay();
    }

    loadCustomGestures() {
        try {
            const savedGestures = localStorage.getItem('customGestures');
            if (savedGestures) {
                this.customGestures = JSON.parse(savedGestures);
                // Mostrar los gestos guardados en el DOM si existen
                if (this.customGestures.length > 0) {
                    setTimeout(() => {
                        document.getElementById('customGesturesGroup').style.display = 'block';
                        this.customGestures.forEach(gesture => {
                            this.renderCustomGesture(gesture);
                        });
                    }, 100); // Pequeño delay para asegurar que el DOM esté listo
                }
            }
        } catch (error) {
            console.log('No se pudieron cargar los gestos guardados');
            this.customGestures = [];
        }
    }

    saveCustomGestures() {
        try {
            localStorage.setItem('customGestures', JSON.stringify(this.customGestures));
        } catch (error) {
            console.log('No se pudieron guardar los gestos');
        }
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('newMatch').addEventListener('click', () => this.showMatchModal());
        document.getElementById('startNewMatch').addEventListener('click', () => this.showMatchModal());
        document.getElementById('loadMatch').addEventListener('click', () => this.loadMatch());
        document.getElementById('saveMatch').addEventListener('click', () => this.saveMatch());
        document.getElementById('exportMatch').addEventListener('click', () => this.exportMatch());

        // Modal de configuración de partido
        document.getElementById('cancelMatch').addEventListener('click', () => this.hideMatchModal());
        document.getElementById('matchForm').addEventListener('submit', (e) => this.startNewMatch(e));

        // Control de fases del partido
        document.getElementById('startFirstHalf').addEventListener('click', () => this.startFirstHalf());
        document.getElementById('endFirstHalf').addEventListener('click', () => this.endFirstHalf());
        document.getElementById('startSecondHalf').addEventListener('click', () => this.startSecondHalf());
        document.getElementById('endMatch').addEventListener('click', () => this.endMatch());
        
        // Control de tiempo
        document.getElementById('pauseTimer').addEventListener('click', () => this.toggleTimer());

        // Cambio de portero
        document.getElementById('goalkeeperChange').addEventListener('click', () => this.showGoalkeeperChangeModal());
        document.getElementById('cancelGoalkeeperChange').addEventListener('click', () => this.hideGoalkeeperChangeModal());
        document.getElementById('goalkeeperChangeForm').addEventListener('submit', (e) => this.processGoalkeeperChange(e));

        // Gesto técnico personalizado
        document.getElementById('addCustomGesture').addEventListener('click', () => this.showCustomGestureModal());
        document.getElementById('cancelCustomGesture').addEventListener('click', () => this.hideCustomGestureModal());
        document.getElementById('customGestureForm').addEventListener('submit', (e) => this.addCustomGesture(e));

        // Tabs de categorías
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchCategory(e.target.dataset.category));
        });

        // Botones de acciones
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                this.recordAction(e.target.dataset.action, e.target.dataset.result);
            }
        });

        // Filtros del log
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterActions(e.target.dataset.filter));
        });

        // Cerrar modales al hacer click fuera
        document.getElementById('matchModal').addEventListener('click', (e) => {
            if (e.target.id === 'matchModal') {
                this.hideMatchModal();
            }
        });

        document.getElementById('goalkeeperChangeModal').addEventListener('click', (e) => {
            if (e.target.id === 'goalkeeperChangeModal') {
                this.hideGoalkeeperChangeModal();
            }
        });

        document.getElementById('customGestureModal').addEventListener('click', (e) => {
            if (e.target.id === 'customGestureModal') {
                this.hideCustomGestureModal();
            }
        });

        document.getElementById('goalAgainstModal').addEventListener('click', (e) => {
            if (e.target.id === 'goalAgainstModal') {
                this.hideGoalAgainstModal();
            }
        });

        // Modal de gol en contra
        document.getElementById('cancelGoalAgainst').addEventListener('click', () => this.hideGoalAgainstModal());
        document.getElementById('goalAgainstForm').addEventListener('submit', (e) => this.processGoalAgainst(e));

        // Teclas de acceso rápido
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Instalación PWA
        document.getElementById('installApp').addEventListener('click', () => this.installPWA());
    }

    setupPWAInstallation() {
        // Escuchar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevenir que Chrome 67 y anteriores muestren automáticamente el prompt
            e.preventDefault();
            // Guardar el evento para poder usarlo después
            this.deferredPrompt = e;
            // Mostrar el botón de instalación
            document.getElementById('installApp').style.display = 'inline-flex';
        });

        // Manejar cuando la app se instale
        window.addEventListener('appinstalled', () => {
            // Ocultar el botón de instalación
            document.getElementById('installApp').style.display = 'none';
            this.showNotification('Aplicación instalada correctamente', 'success');
        });
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            this.showNotification('La instalación no está disponible en este navegador', 'error');
            return;
        }

        // Mostrar el prompt de instalación
        this.deferredPrompt.prompt();
        
        // Esperar a que el usuario responda al prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            this.showNotification('Instalación iniciada...', 'success');
        } else {
            this.showNotification('Instalación cancelada', 'info');
        }
        
        // Limpiar el prompt ya que solo se puede usar una vez
        this.deferredPrompt = null;
        document.getElementById('installApp').style.display = 'none';
    }

    showWelcomeScreen() {
        document.getElementById('welcomeScreen').style.display = 'block';
        document.getElementById('currentMatch').style.display = 'none';
    }

    showMatchModal() {
        document.getElementById('matchModal').classList.add('show');
        // Establecer fecha actual correctamente
        const today = new Date();
        const dateString = today.getFullYear() + '-' + 
            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
            String(today.getDate()).padStart(2, '0');
        document.getElementById('date').value = dateString;
    }

    hideMatchModal() {
        document.getElementById('matchModal').classList.remove('show');
    }

    showGoalkeeperChangeModal() {
        if (!this.currentMatch) {
            this.showNotification('Primero debe iniciar un partido', 'error');
            return;
        }
        
        // Llenar opciones de porteros
        const select = document.getElementById('newGoalkeeper');
        select.innerHTML = '<option value="">Seleccionar portero</option>';
        
        if (this.currentMatch.activeGoalkeeper !== this.currentMatch.goalkeeperTitular) {
            select.innerHTML += `<option value="${this.currentMatch.goalkeeperTitular}">${this.currentMatch.goalkeeperTitular} (Titular)</option>`;
        }
        if (this.currentMatch.activeGoalkeeper !== this.currentMatch.goalkeeperSuplente) {
            select.innerHTML += `<option value="${this.currentMatch.goalkeeperSuplente}">${this.currentMatch.goalkeeperSuplente} (Suplente)</option>`;
        }
        
        document.getElementById('goalkeeperChangeModal').classList.add('show');
    }

    hideGoalkeeperChangeModal() {
        document.getElementById('goalkeeperChangeModal').classList.remove('show');
    }

    showCustomGestureModal() {
        if (!this.currentMatch) {
            this.showNotification('Primero debe iniciar un partido', 'error');
            return;
        }
        document.getElementById('customGestureModal').classList.add('show');
    }

    hideCustomGestureModal() {
        document.getElementById('customGestureModal').classList.remove('show');
    }

    addCustomGesture(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const gestureName = formData.get('gestureName');
        const gestureCategory = formData.get('gestureCategory');
        
        // Crear ID único para el gesto
        const gestureId = 'custom_' + Date.now();
        
        // Añadir a la lista de gestos personalizados
        const customGesture = {
            id: gestureId,
            name: gestureName,
            category: gestureCategory
        };
        
        this.customGestures.push(customGesture);
        
        // Guardar en localStorage
        this.saveCustomGestures();
        
        // Añadir al DOM
        this.renderCustomGesture(customGesture);
        
        this.hideCustomGestureModal();
        this.showNotification(`Gesto técnico "${gestureName}" añadido`, 'success');
        
        // Limpiar formulario
        document.getElementById('customGestureForm').reset();
        
        // Mostrar el grupo de gestos personalizados
        document.getElementById('customGesturesGroup').style.display = 'block';
    }

    renderCustomGesture(gesture) {
        const gesturesList = document.getElementById('customGesturesList');
        
        const gestureElement = document.createElement('div');
        gestureElement.className = 'action-item';
        gestureElement.id = `gesture-${gesture.id}`;
        gestureElement.innerHTML = `
            <div class="action-name">${gesture.name} (${gesture.category})</div>
            <div class="action-buttons">
                <button class="btn btn-error" data-action="${gesture.id}" data-result="error">Error</button>
                <button class="btn btn-success" data-action="${gesture.id}" data-result="correcto">Correcto</button>
                <button class="btn btn-small btn-delete" onclick="app.removeCustomGesture('${gesture.id}')" style="margin-left: 5px; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">×</button>
            </div>
        `;
        
        gesturesList.appendChild(gestureElement);
    }

    removeCustomGesture(gestureId) {
        // Eliminar del array
        this.customGestures = this.customGestures.filter(g => g.id !== gestureId);
        
        // Guardar en localStorage
        this.saveCustomGestures();
        
        // Eliminar del DOM
        const gestureElement = document.getElementById(`gesture-${gestureId}`);
        if (gestureElement) {
            gestureElement.remove();
        }
        
        // Ocultar grupo si no hay más gestos
        if (this.customGestures.length === 0) {
            document.getElementById('customGesturesGroup').style.display = 'none';
        }
        
        this.showNotification('Gesto técnico eliminado', 'success');
    }

    addGoal(team) {
        if (!this.currentMatch) {
            this.showNotification('No hay partido activo', 'error');
            return;
        }

        if (team === 'home') {
            this.currentMatch.homeScore++;
            
            // Registrar el gol a favor como una acción especial
            const goalAction = {
                id: Date.now(),
                action: 'gol_a_favor',
                result: 'gol_anotado',
                time: this.getCurrentTime(),
                half: this.currentHalf,
                timestamp: new Date(),
                matchId: this.currentMatch.id,
                details: {
                    scoreAfter: `${this.currentMatch.homeScore}-${this.currentMatch.awayScore}`,
                    team: 'local'
                }
            };
            
            this.actions.push(goalAction);
            this.updateActionLog();
            this.updateStatistics();
            this.saveToStorage();
            
        } else if (team === 'away') {
            this.currentMatch.awayScore++;
            // Mostrar modal para seleccionar portero que recibió el gol
            this.showGoalAgainstModal();
        }
        
        this.updateMatchDisplay();
        this.showNotification(`Gol añadido`, 'success');
    }

    removeGoal(team) {
        if (!this.currentMatch) {
            this.showNotification('No hay partido activo', 'error');
            return;
        }

        if (team === 'home' && this.currentMatch.homeScore > 0) {
            this.currentMatch.homeScore--;
        } else if (team === 'away' && this.currentMatch.awayScore > 0) {
            this.currentMatch.awayScore--;
        }
        
        this.updateMatchDisplay();
        this.showNotification(`Gol eliminado`, 'success');
    }

    showGoalAgainstModal() {
        const modal = document.getElementById('goalAgainstModal');
        const goalkeeperSelect = document.getElementById('goalAgainstGoalkeeper');
        
        // Limpiar opciones anteriores
        goalkeeperSelect.innerHTML = `
            <option value="">Seleccionar portero...</option>
            <option value="titular">${this.currentMatch.goalkeeperTitular}</option>
            <option value="suplente">${this.currentMatch.goalkeeperSuplente}</option>
        `;
        
        modal.style.display = 'flex';
    }

    hideGoalAgainstModal() {
        document.getElementById('goalAgainstModal').style.display = 'none';
        document.getElementById('goalAgainstForm').reset();
    }

    processGoalAgainst(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const goalAgainstGoalkeeper = formData.get('goalAgainstGoalkeeper');
        
        if (!goalAgainstGoalkeeper) {
            this.showNotification('Debe seleccionar un portero', 'error');
            return;
        }
        
        // Registrar el gol en contra como una acción especial
        const goalAction = {
            id: Date.now(),
            action: 'gol_en_contra',
            result: 'gol_recibido',
            time: this.getCurrentTime(),
            half: this.currentHalf,
            timestamp: new Date(),
            matchId: this.currentMatch.id,
            details: {
                goalkeeper: goalAgainstGoalkeeper,
                goalkeeperName: goalAgainstGoalkeeper === 'titular' 
                    ? this.currentMatch.goalkeeperTitular 
                    : this.currentMatch.goalkeeperSuplente
            }
        };

        this.actions.push(goalAction);
        this.updateActionLog();
        this.hideGoalAgainstModal();
        
        this.showNotification(`Gol en contra registrado para ${goalAction.details.goalkeeperName}`, 'info');
    }

    processGoalkeeperChange(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newGoalkeeper = formData.get('newGoalkeeper');
        const changeReason = formData.get('changeReason');
        
        if (!newGoalkeeper) {
            this.showNotification('Debe seleccionar un portero', 'error');
            return;
        }
        
        // Guardar los minutos actuales antes del cambio
        this.updateGoalkeeperMinutes();
        
        // Registrar el cambio como una acción especial
        const changeAction = {
            id: Date.now(),
            action: 'cambio_portero',
            result: 'cambio',
            time: this.getCurrentTime(),
            half: this.currentHalf,
            timestamp: new Date(),
            matchId: this.currentMatch.id,
            details: {
                previousGoalkeeper: this.currentMatch.activeGoalkeeper,
                newGoalkeeper: newGoalkeeper,
                reason: changeReason
            }
        };

        this.actions.push(changeAction);
        
        // Guardar minutos acumulados antes del cambio
        if (this.currentMatch.activeGoalkeeper === this.currentMatch.goalkeeperTitular) {
            this.currentMatch.titularMinutesBefore = this.currentMatch.titularMinutes || 0;
        } else {
            this.currentMatch.suplenteMinutesBefore = this.currentMatch.suplenteMinutes || 0;
        }
        
        // Actualizar el portero activo y establecer nuevo tiempo de inicio
        this.currentMatch.activeGoalkeeper = newGoalkeeper;
        this.currentMatch.activeGoalkeeperStartTime = Date.now();
        
        this.updateMatchDisplay();
        this.updateActionLog();
        this.saveToStorage();
        this.hideGoalkeeperChangeModal();
        
        this.showNotification(`Cambio de portero registrado: ${newGoalkeeper}`, 'success');
        
        // Limpiar formulario
        document.getElementById('goalkeeperChangeForm').reset();
    }

    startNewMatch(e) {
        e.preventDefault();
        
        const form = document.getElementById('matchForm');
        const formData = new FormData(form);
        
        this.currentMatch = {
            id: Date.now(),
            club: formData.get('club') || 'Atlético de Madrid',
            teamCategory: formData.get('teamCategory') || '',
            matchType: formData.get('matchType') || '',
            team: formData.get('club') || 'Atlético de Madrid',
            matchday: parseInt(formData.get('matchday')) || 1,
            opponent: formData.get('opponent') || '',
            venue: formData.get('venue') || 'local',
            stadium: formData.get('stadium') || '',
            goalkeeperCoach: formData.get('goalkeeperCoach') || '',
            goalkeeperTitular: formData.get('goalkeeperTitular') || '',
            goalkeeperSuplente: formData.get('goalkeeperSuplente') || '',
            activeGoalkeeper: formData.get('goalkeeperTitular') || '', // El titular empieza activo
            date: formData.get('date') || new Date().toISOString().split('T')[0],
            startTime: new Date(),
            endTime: null,
            // Marcador
            homeScore: 0,
            awayScore: 0,
            // Minutos jugados por portero
            titularMinutes: 0,
            suplenteMinutes: 0,
            titularMinutesBefore: 0,
            suplenteMinutesBefore: 0,
            // Control de tiempo por portero
            activeGoalkeeperStartTime: Date.now()
        };

        // IMPORTANTE: Limpiar acciones y gestos para nuevo partido
        this.actions = [];
        this.customGestures = [];
        
        this.matchPhase = 'not_started';
        this.currentHalf = 'none';
        this.resetTimer();
        this.hideMatchModal();
        this.showMatchScreen();
        this.updatePhaseButtons();
        this.saveToStorage();

        this.showNotification('Partido configurado correctamente. Presiona "Iniciar 1º Tiempo" para comenzar.', 'success');
    }

    showMatchScreen() {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('currentMatch').style.display = 'block';
        this.updateMatchDisplay();
        this.updatePhaseDisplay();
        // Limpiar gestos personalizados del DOM
        document.getElementById('customGesturesList').innerHTML = '';
        document.getElementById('customGesturesGroup').style.display = 'none';
    }

    updateMatchDisplay() {
        if (!this.currentMatch) return;

        // Título del partido
        document.getElementById('matchTitle').textContent = 
            `${this.currentMatch.teamCategory} vs ${this.currentMatch.opponent}`;
        
        // Marcador
        document.getElementById('homeTeamName').textContent = this.currentMatch.teamCategory || 'Atlético de Madrid';
        document.getElementById('awayTeamName').textContent = this.currentMatch.opponent;
        document.getElementById('homeScore').textContent = this.currentMatch.homeScore || 0;
        document.getElementById('awayScore').textContent = this.currentMatch.awayScore || 0;
        
        // Fecha y detalles
        const matchDate = new Date(this.currentMatch.date);
        document.getElementById('matchDate').textContent = matchDate.toLocaleDateString('es-ES');
        
        document.getElementById('matchVenue').textContent = 
            this.currentMatch.venue === 'local' ? 'Local' : 'Visitante';
        
        document.getElementById('matchGoalkeeper').textContent = this.currentMatch.activeGoalkeeper;
        
        // Información extra: estadio y entrenador
        document.getElementById('matchStadium').textContent = this.currentMatch.stadium || 'No especificado';
        document.getElementById('matchCoach').textContent = this.currentMatch.goalkeeperCoach || 'No especificado';
        
        // Mostrar información de ambos porteros con minutos jugados
        document.getElementById('goalkeeperTitularDisplay').textContent = this.currentMatch.goalkeeperTitular;
        document.getElementById('goalkeeperSuplenteDisplay').textContent = this.currentMatch.goalkeeperSuplente;
        
        // Actualizar minutos jugados
        this.updateGoalkeeperMinutes();
        document.getElementById('titularMinutes').textContent = `(${this.currentMatch.titularMinutes || 0} min)`;
        document.getElementById('suplenteMinutes').textContent = `(${this.currentMatch.suplenteMinutes || 0} min)`;
    }

    updateGoalkeeperMinutes() {
        if (!this.currentMatch || !this.startTime || this.matchPhase === 'not_started') return;
        
        // Solo actualizar minutos si el partido está en curso (no en descanso o finalizado)
        if (this.matchPhase === 'first_half' || this.matchPhase === 'second_half') {
            // Tiempo transcurrido en el cronómetro del partido (solo tiempo de juego real)
            const currentGameTime = this.isPaused ? this.pausedTime : Date.now() - this.startTime;
            const currentGameMinutes = Math.floor(currentGameTime / 60000);
            
            // Tiempo cuando el portero actual empezó a jugar (referenciado al cronómetro del partido)
            const goalkeeperStartGameTime = this.currentMatch.activeGoalkeeperStartTime - this.startTime;
            const goalkeeperStartMinutes = Math.floor(goalkeeperStartGameTime / 60000);
            
            // Minutos jugados por el portero actual en este período
            const minutesPlayedThisPeriod = Math.max(0, currentGameMinutes - goalkeeperStartMinutes);
            
            if (this.currentMatch.activeGoalkeeper === this.currentMatch.goalkeeperTitular) {
                const baseMinutes = this.currentMatch.titularMinutesBefore || 0;
                this.currentMatch.titularMinutes = baseMinutes + minutesPlayedThisPeriod;
                
            } else if (this.currentMatch.activeGoalkeeper === this.currentMatch.goalkeeperSuplente) {
                const baseMinutes = this.currentMatch.suplenteMinutesBefore || 0;
                this.currentMatch.suplenteMinutes = baseMinutes + minutesPlayedThisPeriod;
            }
        }
        
        // Actualizar la visualización de los minutos en tiempo real
        document.getElementById('titularMinutes').textContent = `(${this.currentMatch.titularMinutes || 0} min)`;
        document.getElementById('suplenteMinutes').textContent = `(${this.currentMatch.suplenteMinutes || 0} min)`;
    }

    updatePhaseDisplay() {
        const phaseElement = document.getElementById('currentPhase');
        switch (this.matchPhase) {
            case 'not_started':
                phaseElement.textContent = 'Partido No Iniciado';
                break;
            case 'first_half':
                phaseElement.textContent = 'Primer Tiempo';
                break;
            case 'half_time':
                phaseElement.textContent = 'Descanso';
                break;
            case 'second_half':
                phaseElement.textContent = 'Segundo Tiempo';
                break;
            case 'finished':
                phaseElement.textContent = 'Partido Finalizado';
                break;
        }
    }

    updatePhaseButtons() {
        const startFirstBtn = document.getElementById('startFirstHalf');
        const endFirstBtn = document.getElementById('endFirstHalf');
        const startSecondBtn = document.getElementById('startSecondHalf');
        const endMatchBtn = document.getElementById('endMatch');
        const saveBtn = document.getElementById('saveMatch');

        // Resetear todos los botones
        [startFirstBtn, endFirstBtn, startSecondBtn, endMatchBtn].forEach(btn => {
            btn.disabled = true;
        });

        switch (this.matchPhase) {
            case 'not_started':
                startFirstBtn.disabled = false;
                break;
            case 'first_half':
                endFirstBtn.disabled = false;
                break;
            case 'half_time':
                startSecondBtn.disabled = false;
                break;
            case 'second_half':
                endMatchBtn.disabled = false;
                break;
            case 'finished':
                saveBtn.disabled = false;
                break;
        }
    }

    startFirstHalf() {
        this.matchPhase = 'first_half';
        this.currentHalf = 'first';
        this.resetTimer();
        this.startTimer();
        
        // Inicializar el tiempo del portero activo
        this.currentMatch.activeGoalkeeperStartTime = Date.now();
        
        this.updatePhaseDisplay();
        this.updatePhaseButtons();
        this.showNotification('Primer tiempo iniciado', 'success');
    }

    endFirstHalf() {
        // Actualizar minutos finales del portero activo antes de pausar
        this.updateGoalkeeperMinutes();
        
        // Guardar los minutos actuales como "base" para el segundo tiempo
        if (this.currentMatch.activeGoalkeeper === this.currentMatch.goalkeeperTitular) {
            this.currentMatch.titularMinutesBefore = this.currentMatch.titularMinutes || 0;
        } else if (this.currentMatch.activeGoalkeeper === this.currentMatch.goalkeeperSuplente) {
            this.currentMatch.suplenteMinutesBefore = this.currentMatch.suplenteMinutes || 0;
        }
        
        this.matchPhase = 'half_time';
        this.pauseTimer();
        this.updatePhaseDisplay();
        this.updatePhaseButtons();
        this.showNotification('Primer tiempo finalizado', 'info');
    }

    startSecondHalf() {
        this.matchPhase = 'second_half';
        this.currentHalf = 'second';
        this.resetTimer();
        this.startTimer();
        
        // Reiniciar el tiempo del portero activo para el segundo tiempo
        this.currentMatch.activeGoalkeeperStartTime = Date.now();
        
        this.updatePhaseDisplay();
        this.updatePhaseButtons();
        this.showNotification('Segundo tiempo iniciado', 'success');
    }

    endMatch() {
        this.matchPhase = 'finished';
        this.currentMatch.endTime = new Date();
        this.pauseTimer();
        this.updatePhaseDisplay();
        this.updatePhaseButtons();
        this.showNotification('Partido finalizado. Ya puede generar el PDF.', 'success');
    }

    resetTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        document.getElementById('currentTime').textContent = '00:00';
        document.getElementById('pauseTimer').textContent = 'Pausar';
        document.getElementById('pauseTimer').disabled = true;
    }

    startTimer() {
        if (!this.startTime) {
            this.startTime = Date.now() - this.pausedTime;
        }

        this.timer = setInterval(() => {
            if (!this.isPaused) {
                const elapsed = Date.now() - this.startTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                document.getElementById('currentTime').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Verificar si se han cumplido 30 minutos y finalizar automáticamente
                if (minutes >= 30) {
                    if (this.matchPhase === 'first_half') {
                        this.endFirstHalf();
                        this.showNotification('¡30 minutos completados! Primer tiempo finalizado automáticamente', 'warning');
                    } else if (this.matchPhase === 'second_half') {
                        this.endMatch();
                        this.showNotification('¡30 minutos completados! Partido finalizado automáticamente', 'warning');
                    }
                    return; // Salir del timer
                }
                
                // Actualizar minutos de porteros automáticamente cada segundo
                this.updateGoalkeeperMinutes();
            }
        }, 1000);

        this.isPaused = false;
        document.getElementById('pauseTimer').textContent = 'Pausar';
        document.getElementById('pauseTimer').disabled = false;
    }

    toggleTimer() {
        if (this.isPaused) {
            this.resumeTimer();
            this.showNotification('Cronómetro reanudado', 'info');
        } else {
            this.pauseTimer();
            this.showNotification('Cronómetro pausado', 'info');
        }
    }

    pauseTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.pausedTime = Date.now() - this.startTime;
        this.isPaused = true;
        document.getElementById('pauseTimer').textContent = 'Reanudar';
    }

    resumeTimer() {
        this.startTime = Date.now() - this.pausedTime;
        this.startTimer();
    }

    getCurrentTime() {
        if (!this.startTime) return '00:00';
        
        const elapsed = this.isPaused ? this.pausedTime : Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    switchCategory(category) {
        // Actualizar tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Mostrar categoría correspondiente
        document.querySelectorAll('.action-category').forEach(cat => cat.classList.remove('active'));
        document.getElementById(category).classList.add('active');
    }

    recordAction(action, result) {
        if (!this.currentMatch) {
            this.showNotification('Primero debe iniciar un partido', 'error');
            return;
        }

        if (this.matchPhase === 'not_started') {
            this.showNotification('Debe iniciar el primer tiempo para registrar acciones', 'error');
            return;
        }

        if (this.matchPhase === 'finished') {
            this.showNotification('El partido ya ha finalizado', 'error');
            return;
        }

        const actionData = {
            id: Date.now(),
            action: action,
            result: result,
            time: this.getCurrentTime(),
            half: this.currentHalf,
            timestamp: new Date(),
            matchId: this.currentMatch.id
        };

        this.actions.push(actionData);
        this.updateActionLog();
        this.updateStatistics();
        this.saveToStorage();

        // Feedback visual
        this.showActionFeedback(action, result);
        
        // Vibración en dispositivos móviles
        if (navigator.vibrate) {
            navigator.vibrate(result === 'correcto' ? 100 : [100, 50, 100]);
        }
    }

    showActionFeedback(action, result) {
        const message = `${this.getActionDisplayName(action)}: ${result.toUpperCase()}`;
        const type = result === 'correcto' ? 'success' : 'error';
        this.showNotification(message, type);
    }

    getActionDisplayName(action) {
        const actionNames = {
            'blocaje_frontal_raso': 'Blocaje Frontal Raso',
            'blocaje_lateral_raso': 'Blocaje Lateral Raso',
            'blocaje_lateral_media': 'Blocaje Lateral Media Altura',
            'blocaje_frontal_media': 'Blocaje Frontal Media Altura',
            'blocaje_aereo': 'Blocaje Aéreo',
            'desvio_mano_natural': 'Desvío Mano Natural',
            'desvio_mano_cambio': 'Desvío Mano Cambio',
            'desvio_2_manos': 'Desvío 2 Manos',
            'rechace': 'Rechace',
            'prolongacion_def': 'Prolongación',
            'despeje_1_puno': 'Despeje 1 Puño',
            'despeje_2_punos': 'Despeje 2 Puños',
            'reduccion_espacios': 'Reducción Espacios',
            'posicion_cruz': 'Posición Cruz',
            'apertura': 'Apertura',
            'reinc_posicion_basica': 'Reincorporación Posición Básica',
            'reinc_mismo_lado': 'Reincorporación Mismo Lado',
            'reinc_lado_contrario': 'Reincorporación Lado Contrario',
            'reinc_tras_blocaje': 'Reincorporación Tras Blocaje',
            'pase_mano_raso': 'Pase Mano Raso',
            'pase_mano_picado': 'Pase Mano Picado',
            'pase_mano_alto': 'Pase Mano Alto',
            'volea': 'Volea',
            'pase_corto': 'Pase Corto',
            'pase_largo': 'Pase Largo',
            'despeje_ofensivo': 'Despeje',
            'liderazgo': 'Liderazgo',
            'comunicacion': 'Comunicación',
            'cambio_portero': 'Cambio de Portero',
            'gol_a_favor': 'GOL A FAVOR',
            'vision_juego': 'Visión de Juego'
        };

        // Si es un gesto personalizado, buscar en la lista
        if (action.startsWith('custom_')) {
            const customGesture = this.customGestures.find(g => g.id === action);
            return customGesture ? customGesture.name : action;
        }

        return actionNames[action] || action.replace(/_/g, ' ');
    }

    updateActionLog() {
        const actionsList = document.getElementById('actionsList');
        actionsList.innerHTML = '';

        if (this.actions.length === 0) {
            actionsList.innerHTML = '<p style="text-align: center; color: #666;">No hay acciones registradas</p>';
            return;
        }

        // Mostrar acciones más recientes primero
        const sortedActions = [...this.actions].reverse();

        sortedActions.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.className = `action-entry ${action.result}`;
            
            let actionDisplay = this.getActionDisplayName(action.action);
            if (action.action === 'cambio_portero' && action.details) {
                actionDisplay = `Cambio: ${action.details.previousGoalkeeper} → ${action.details.newGoalkeeper} (${action.details.reason})`;
            }
            
            actionElement.innerHTML = `
                <div class="action-info">
                    <div class="action-name-log">${actionDisplay}</div>
                    <div class="action-time">${action.time} - ${action.half === 'first' ? '1º' : '2º'} Tiempo</div>
                </div>
                <div class="action-result ${action.result === 'cambio' ? 'change' : action.result}">${action.result === 'cambio' ? 'CAMBIO' : action.result}</div>
            `;
            actionsList.appendChild(actionElement);
        });
    }

    filterActions(filter) {
        // Actualizar botón activo
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        const actionEntries = document.querySelectorAll('.action-entry');
        
        actionEntries.forEach(entry => {
            let show = true;
            
            switch (filter) {
                case 'error':
                    show = entry.classList.contains('error');
                    break;
                case 'correcto':
                    show = entry.classList.contains('correcto');
                    break;
                case 'first':
                    show = entry.querySelector('.action-time').textContent.includes('1º');
                    break;
                case 'second':
                    show = entry.querySelector('.action-time').textContent.includes('2º');
                    break;
                case 'all':
                default:
                    show = true;
                    break;
            }
            
            entry.style.display = show ? 'flex' : 'none';
        });
    }

    updateStatistics() {
        const total = this.actions.filter(a => a.action !== 'cambio_portero').length;
        const correct = this.actions.filter(a => a.result === 'correcto').length;
        const errors = this.actions.filter(a => a.result === 'error').length;
        const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;

        document.getElementById('totalActions').textContent = total;
        document.getElementById('correctActions').textContent = correct;
        document.getElementById('errorActions').textContent = errors;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    saveMatch() {
        if (!this.currentMatch) {
            this.showNotification('No hay partido activo para guardar', 'error');
            return;
        }

        if (this.matchPhase !== 'finished') {
            this.showNotification('Debe finalizar el partido antes de generar el PDF', 'error');
            return;
        }

        this.generatePDF('save');
    }

    exportMatch() {
        if (!this.currentMatch || this.actions.length === 0) {
            this.showNotification('No hay datos para exportar', 'error');
            return;
        }

        this.generatePDF('export');
    }

    generatePDF(type = 'export') {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configuración de la página
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const lineHeight = 8;
            let yPosition = margin;
            
            // Colores del Atlético de Madrid
            const atletiRed = [200, 16, 46];
            const atletiBlue = [11, 83, 148];
            const atletiWhite = [255, 255, 255];
            
            // Función para añadir nueva página si es necesario
            const checkPageBreak = (neededSpace = 15) => {
                if (yPosition + neededSpace > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                    // Repetir cabecera en páginas siguientes
                    addHeaderToPage();
                }
            };
            
            // Función para añadir cabecera a páginas adicionales
            const addHeaderToPage = () => {
                doc.setFillColor(...atletiRed);
                doc.rect(0, 0, pageWidth, 25, 'F');
                doc.setTextColor(...atletiWhite);
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                const headerText = "ATLÉTICO DE MADRID - SEGUIMIENTO DE PORTEROS";
                const headerWidth = doc.getTextWidth(headerText);
                doc.text(headerText, (pageWidth - headerWidth) / 2, 15);
                doc.setTextColor(0, 0, 0);
                yPosition = 35;
            };
            
            // Función para añadir texto centrado con color
            const addCenteredText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
                doc.setTextColor(...color);
                doc.setFontSize(fontSize);
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                const textWidth = doc.getTextWidth(text);
                const x = (pageWidth - textWidth) / 2;
                doc.text(text, x, yPosition);
                yPosition += lineHeight + 2;
                doc.setTextColor(0, 0, 0);
            };
            
            // Función para añadir texto normal con color
            const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
                doc.setTextColor(...color);
                doc.setFontSize(fontSize);
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                doc.text(text, margin, yPosition);
                yPosition += lineHeight;
                doc.setTextColor(0, 0, 0);
            };
            
            // Función para generar todo el contenido del PDF
            const generatePDFContent = () => {
                // Datos del partido con mejor formato
                checkPageBreak(100);
                
                // Cuadro de información del partido
                doc.setFillColor(245, 245, 245);
                doc.rect(margin, yPosition, pageWidth - 2*margin, 80, 'F');
                doc.setDrawColor(...atletiRed);
                doc.rect(margin, yPosition, pageWidth - 2*margin, 80);
                
                yPosition += 10;
                addText("INFORMACIÓN DEL PARTIDO", 14, true, atletiRed);
                yPosition += 5;
                
                addText(`Club: ${this.currentMatch.club || 'Atlético de Madrid'}`, 10, true);
                addText(`Equipo: ${this.currentMatch.teamCategory || 'N/A'}`, 10);
                addText(`Tipo de Partido: ${this.currentMatch.matchType || 'N/A'}`, 10);
                addText(`Jornada: ${this.currentMatch.matchday}`, 10);
                addText(`Rival: ${this.currentMatch.opponent}`, 10, true);
                addText(`Campo: ${this.currentMatch.venue === 'local' ? 'Local' : 'Visitante'} - ${this.currentMatch.stadium || 'N/A'}`, 10);
                
                const matchDate = new Date(this.currentMatch.date);
                addText(`Fecha: ${matchDate.toLocaleDateString('es-ES')}`, 10);
                addText(`Entrenador de Porteros: ${this.currentMatch.goalkeeperCoach || 'N/A'}`, 10);
                
                yPosition += 10;
                
                // Cuadro de resultado y porteros
                doc.setFillColor(240, 248, 255);
                doc.rect(margin, yPosition, pageWidth - 2*margin, 50, 'F');
                doc.setDrawColor(...atletiBlue);
                doc.rect(margin, yPosition, pageWidth - 2*margin, 50);
                
                yPosition += 10;
                addText("RESULTADO Y PORTEROS", 14, true, atletiBlue);
                yPosition += 5;
                
                // Marcador centrado y destacado
                const scoreText = `${this.currentMatch.teamCategory || 'ATM'} ${this.currentMatch.homeScore || 0} - ${this.currentMatch.awayScore || 0} ${this.currentMatch.opponent}`;
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...atletiRed);
                const scoreWidth = doc.getTextWidth(scoreText);
                doc.text(scoreText, (pageWidth - scoreWidth) / 2, yPosition);
                yPosition += 10;
                doc.setTextColor(0, 0, 0);
                
                addText(`Portero Titular: ${this.currentMatch.goalkeeperTitular} (${this.currentMatch.titularMinutes || 0} min)`, 10);
                addText(`Portero Suplente: ${this.currentMatch.goalkeeperSuplente} (${this.currentMatch.suplenteMinutes || 0} min)`, 10);
                
                yPosition += 15;
                
                // Estadísticas generales
                checkPageBreak(70);
                const totalActions = this.actions.filter(a => a.action !== 'cambio_portero' && a.action !== 'gol_en_contra').length;
                const correct = this.actions.filter(a => a.result === 'correcto').length;
                const errors = this.actions.filter(a => a.result === 'error').length;
                const successRate = totalActions > 0 ? Math.round((correct / totalActions) * 100) : 0;
                
                // Cuadro de estadísticas
                doc.setFillColor(240, 255, 240);
                doc.rect(margin, yPosition, pageWidth - 2*margin, 60, 'F');
                doc.setDrawColor(40, 167, 69);
                doc.rect(margin, yPosition, pageWidth - 2*margin, 60);
                
                yPosition += 10;
                addText("ESTADÍSTICAS GENERALES", 14, true, [40, 167, 69]);
                yPosition += 5;
                
                addText(`Total de Acciones Técnicas: ${totalActions}`, 10);
                addText(`Acciones Correctas: ${correct}`, 10, false, [40, 167, 69]);
                addText(`Errores: ${errors}`, 10, false, [220, 53, 69]);
                addText(`Porcentaje de Acierto: ${successRate}%`, 12, true, successRate >= 70 ? [40, 167, 69] : [255, 140, 0]);
                
                yPosition += 15;
                
                // NUEVA SECCIÓN: Acciones por Portero
                if (this.actions.length > 0) {
                    checkPageBreak(50);
                    addText("DETALLE DE ACCIONES POR PORTERO", 14, true, atletiRed);
                    yPosition += 10;
                    
                    // Filtrar acciones por portero (excluyendo cambios y goles)
                    const actionsByGoalkeeper = {};
                    
                    this.actions.forEach(action => {
                        if (action.action !== 'cambio_portero' && action.action !== 'gol_en_contra' && action.action !== 'gol_a_favor') {
                            const goalkeeper = action.goalkeeperName || this.getCurrentGoalkeeperAtTime(action.timestamp);
                            if (!actionsByGoalkeeper[goalkeeper]) {
                                actionsByGoalkeeper[goalkeeper] = {
                                    correcto: [],
                                    error: []
                                };
                            }
                            actionsByGoalkeeper[goalkeeper][action.result] = actionsByGoalkeeper[goalkeeper][action.result] || [];
                            actionsByGoalkeeper[goalkeeper][action.result].push(action);
                        }
                    });
                    
                    // Mostrar estadísticas por portero
                    Object.keys(actionsByGoalkeeper).forEach(goalkeeperName => {
                        checkPageBreak(40);
                        const goalkeeper = actionsByGoalkeeper[goalkeeperName];
                        const correctCount = goalkeeper.correcto ? goalkeeper.correcto.length : 0;
                        const errorCount = goalkeeper.error ? goalkeeper.error.length : 0;
                        const totalCount = correctCount + errorCount;
                        const successRateGK = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
                        
                        // Cuadro del portero
                        doc.setFillColor(252, 252, 255);
                        doc.rect(margin, yPosition, pageWidth - 2*margin, 35 + Math.max(correctCount, errorCount) * 6, 'F');
                        doc.setDrawColor(...atletiBlue);
                        doc.rect(margin, yPosition, pageWidth - 2*margin, 35 + Math.max(correctCount, errorCount) * 6);
                        
                        yPosition += 8;
                        addText(`${goalkeeperName}`, 12, true, atletiBlue);
                        addText(`Total: ${totalCount} acciones | Correctas: ${correctCount} | Errores: ${errorCount} | Acierto: ${successRateGK}%`, 9, false, successRateGK >= 70 ? [40, 167, 69] : [255, 140, 0]);
                        yPosition += 3;
                        
                        // Mostrar acciones correctas
                        if (correctCount > 0) {
                            addText("Acciones Correctas:", 9, true, [40, 167, 69]);
                            goalkeeper.correcto.forEach(action => {
                                const actionName = this.getActionDisplayName(action.action);
                                addText(`  • ${actionName} (${action.time} - ${action.half === 'first' ? '1º' : '2º'} Tiempo)`, 8, false, [40, 167, 69]);
                            });
                            yPosition += 2;
                        }
                        
                        // Mostrar errores
                        if (errorCount > 0) {
                            addText("Errores:", 9, true, [220, 53, 69]);
                            goalkeeper.error.forEach(action => {
                                const actionName = this.getActionDisplayName(action.action);
                                addText(`  • ${actionName} (${action.time} - ${action.half === 'first' ? '1º' : '2º'} Tiempo)`, 8, false, [220, 53, 69]);
                            });
                            yPosition += 2;
                        }
                        
                        yPosition += 10;
                    });
                }
                
                // Registro cronológico
                if (this.actions.length > 0) {
                    checkPageBreak(30);
                    addText("REGISTRO CRONOLÓGICO DE ACCIONES", 14, true, atletiBlue);
                    yPosition += 5;
                    
                    this.actions.forEach(action => {
                        checkPageBreak(8);
                        let actionDisplay = this.getActionDisplayName(action.action);
                        let textColor = [0, 0, 0];
                        
                        if (action.action === 'cambio_portero' && action.details) {
                            actionDisplay = `CAMBIO: ${action.details.previousGoalkeeper} → ${action.details.newGoalkeeper} (${action.details.reason})`;
                            textColor = atletiBlue;
                        } else if (action.action === 'gol_en_contra' && action.details) {
                            actionDisplay = `GOL EN CONTRA recibido por ${action.details.goalkeeperName}`;
                            textColor = [220, 53, 69];
                        } else if (action.action === 'gol_a_favor' && action.details) {
                            actionDisplay = `GOL A FAVOR - Marcador: ${action.details.scoreAfter}`;
                            textColor = [40, 167, 69];
                        }
                        
                        const result = action.result === 'cambio' ? 'CAMBIO' : 
                                     action.result === 'gol_recibido' ? 'GOL EN CONTRA' :
                                     action.result === 'gol_anotado' ? 'GOL A FAVOR' :
                                     (action.result === 'correcto' ? 'CORRECTO' : 'ERROR');
                        const half = action.half === 'first' ? '1º Tiempo' : 
                                    action.half === 'second' ? '2º Tiempo' : 'Descanso';
                        
                        const resultColor = result === 'CORRECTO' ? [40, 167, 69] : 
                                          result === 'ERROR' ? [220, 53, 69] : textColor;
                        
                        addText(`${action.time} | ${actionDisplay}`, 9, false, textColor);
                        addText(`       → ${result} (${half})`, 8, true, resultColor);
                    });
                }
                
                // Pie de página elegante
                const footerY = pageHeight - 25;
                doc.setFillColor(...atletiRed);
                doc.rect(0, footerY, pageWidth, 25, 'F');
                
                doc.setTextColor(...atletiWhite);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                const generatedText = `Informe generado el ${new Date().toLocaleString('es-ES')}`;
                const appText = "NUNCA DEJES DE CREER - Aplicación de Seguimiento de Porteros ATM";
                
                doc.text(generatedText, margin, footerY + 10);
                doc.text(appText, margin, footerY + 18);
                
                // Descargar PDF
                const filename = `Seguimiento_${this.currentMatch.activeGoalkeeper}_${this.currentMatch.opponent}_${this.currentMatch.date}.pdf`;
                doc.save(filename);
                
                this.showNotification(`PDF ${type === 'save' ? 'guardado' : 'exportado'} correctamente`, 'success');
            };
            
            // Función para crear la imagen del escudo y generar el PDF
            const createPDFWithLogo = () => {
                // Cabecera con fondo rojo del Atlético
                doc.setFillColor(...atletiRed);
                doc.rect(0, 0, pageWidth, 40, 'F');
                
                // Cargar e insertar el escudo
                const img = new Image();
                img.onload = () => {
                    try {
                        // Añadir el escudo en la esquina superior izquierda sobre el fondo rojo
                        doc.addImage(img, 'PNG', margin, 5, 30, 30);
                    } catch (e) {
                        console.log('Error añadiendo imagen:', e);
                    }
                    
                    // Título principal en blanco sobre el fondo rojo
                    doc.setTextColor(...atletiWhite);
                    doc.setFontSize(18);
                    doc.setFont("helvetica", "bold");
                    const titleText = "ATLÉTICO DE MADRID";
                    const titleWidth = doc.getTextWidth(titleText);
                    doc.text(titleText, (pageWidth - titleWidth) / 2, 20);
                    
                    doc.setFontSize(14);
                    const subtitleText = "SEGUIMIENTO DE PORTEROS";
                    const subtitleWidth = doc.getTextWidth(subtitleText);
                    doc.text(subtitleText, (pageWidth - subtitleWidth) / 2, 32);
                    
                    // Resetear color a negro para el resto del documento
                    doc.setTextColor(0, 0, 0);
                    yPosition = 50;
                    
                    // Línea separadora en azul
                    doc.setDrawColor(...atletiBlue);
                    doc.setLineWidth(2);
                    doc.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 10;
                    
                    // Generar todo el contenido
                    generatePDFContent();
                    
                    // Cuadro de información del partido
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margin, yPosition, pageWidth - 2*margin, 80, 'F');
                    doc.setDrawColor(...atletiRed);
                    doc.rect(margin, yPosition, pageWidth - 2*margin, 80);
                    
                    yPosition += 10;
                    addText("INFORMACIÓN DEL PARTIDO", 14, true, atletiRed);
                    yPosition += 5;
                    
                    addText(`Club: ${this.currentMatch.club || 'Atlético de Madrid'}`, 10, true);
                    addText(`Equipo: ${this.currentMatch.teamCategory || 'N/A'}`, 10);
                    addText(`Tipo de Partido: ${this.currentMatch.matchType || 'N/A'}`, 10);
                    addText(`Jornada: ${this.currentMatch.matchday}`, 10);
                    addText(`Rival: ${this.currentMatch.opponent}`, 10, true);
                    addText(`Campo: ${this.currentMatch.venue === 'local' ? 'Local' : 'Visitante'} - ${this.currentMatch.stadium || 'N/A'}`, 10);
                    
                    const matchDate = new Date(this.currentMatch.date);
                    addText(`Fecha: ${matchDate.toLocaleDateString('es-ES')}`, 10);
                    addText(`Entrenador de Porteros: ${this.currentMatch.goalkeeperCoach || 'N/A'}`, 10);
                    
                    yPosition += 10;
                    
                    // Cuadro de resultado y porteros
                    doc.setFillColor(240, 248, 255);
                    doc.rect(margin, yPosition, pageWidth - 2*margin, 50, 'F');
                    doc.setDrawColor(...atletiBlue);
                    doc.rect(margin, yPosition, pageWidth - 2*margin, 50);
                    
                    yPosition += 10;
                    addText("RESULTADO Y PORTEROS", 14, true, atletiBlue);
                    yPosition += 5;
                    
                    // Marcador centrado y destacado
                    const scoreText = `${this.currentMatch.teamCategory || 'ATM'} ${this.currentMatch.homeScore || 0} - ${this.currentMatch.awayScore || 0} ${this.currentMatch.opponent}`;
                    doc.setFontSize(16);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(...atletiRed);
                    const scoreWidth = doc.getTextWidth(scoreText);
                    doc.text(scoreText, (pageWidth - scoreWidth) / 2, yPosition);
                    yPosition += 10;
                    doc.setTextColor(0, 0, 0);
                    
                    addText(`Portero Titular: ${this.currentMatch.goalkeeperTitular} (${this.currentMatch.titularMinutes || 0} min)`, 10);
                    addText(`Portero Suplente: ${this.currentMatch.goalkeeperSuplente} (${this.currentMatch.suplenteMinutes || 0} min)`, 10);
                    
                    yPosition += 15;
                    
                    // Estadísticas generales
                    checkPageBreak(70);
                    const totalActions = this.actions.filter(a => a.action !== 'cambio_portero' && a.action !== 'gol_en_contra').length;
                    const correct = this.actions.filter(a => a.result === 'correcto').length;
                    const errors = this.actions.filter(a => a.result === 'error').length;
                    const successRate = totalActions > 0 ? Math.round((correct / totalActions) * 100) : 0;
                    
                    // Cuadro de estadísticas
                    doc.setFillColor(240, 255, 240);
                    doc.rect(margin, yPosition, pageWidth - 2*margin, 60, 'F');
                    doc.setDrawColor(40, 167, 69);
                    doc.rect(margin, yPosition, pageWidth - 2*margin, 60);
                    
                    yPosition += 10;
                    addText("ESTADÍSTICAS GENERALES", 14, true, [40, 167, 69]);
                    yPosition += 5;
                    
                    addText(`Total de Acciones Técnicas: ${totalActions}`, 10);
                    addText(`Acciones Correctas: ${correct}`, 10, false, [40, 167, 69]);
                    addText(`Errores: ${errors}`, 10, false, [220, 53, 69]);
                    addText(`Porcentaje de Acierto: ${successRate}%`, 12, true, successRate >= 70 ? [40, 167, 69] : [255, 140, 0]);
                    
                    yPosition += 15;
                    
                    // Registro cronológico
                    if (this.actions.length > 0) {
                        checkPageBreak(30);
                        addText("REGISTRO CRONOLÓGICO DE ACCIONES", 14, true, atletiBlue);
                        yPosition += 5;
                        
                        this.actions.forEach(action => {
                            checkPageBreak(8);
                            let actionDisplay = this.getActionDisplayName(action.action);
                            let textColor = [0, 0, 0];
                            
                            if (action.action === 'cambio_portero' && action.details) {
                                actionDisplay = `CAMBIO: ${action.details.previousGoalkeeper} → ${action.details.newGoalkeeper} (${action.details.reason})`;
                                textColor = atletiBlue;
                            } else if (action.action === 'gol_en_contra' && action.details) {
                                actionDisplay = `GOL EN CONTRA recibido por ${action.details.goalkeeperName}`;
                                textColor = [220, 53, 69];
                            } else if (action.action === 'gol_a_favor' && action.details) {
                                actionDisplay = `GOL A FAVOR - Marcador: ${action.details.scoreAfter}`;
                                textColor = [40, 167, 69];
                            }
                            
                            const result = action.result === 'cambio' ? 'CAMBIO' : 
                                         action.result === 'gol_recibido' ? 'GOL EN CONTRA' :
                                         action.result === 'gol_anotado' ? 'GOL A FAVOR' :
                                         (action.result === 'correcto' ? 'CORRECTO' : 'ERROR');
                            const half = action.half === 'first' ? '1º Tiempo' : 
                                        action.half === 'second' ? '2º Tiempo' : 'Descanso';
                            
                            const resultColor = result === 'CORRECTO' ? [40, 167, 69] : 
                                              result === 'ERROR' ? [220, 53, 69] : textColor;
                            
                            addText(`${action.time} | ${actionDisplay}`, 9, false, textColor);
                            addText(`       → ${result} (${half})`, 8, true, resultColor);
                        });
                    }
                    
                    // Pie de página elegante
                    const footerY = pageHeight - 25;
                    doc.setFillColor(...atletiRed);
                    doc.rect(0, footerY, pageWidth, 25, 'F');
                    
                    doc.setTextColor(...atletiWhite);
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    const generatedText = `Informe generado el ${new Date().toLocaleString('es-ES')}`;
                    const appText = "NUNCA DEJES DE CREER - Aplicación de Seguimiento de Porteros ATM";
                    
                    doc.text(generatedText, margin, footerY + 10);
                    doc.text(appText, margin, footerY + 18);
                    
                    // Descargar PDF
                    const filename = `Seguimiento_${this.currentMatch.activeGoalkeeper}_${this.currentMatch.opponent}_${this.currentMatch.date}.pdf`;
                    doc.save(filename);
                    
                    this.showNotification(`PDF ${type === 'save' ? 'guardado' : 'exportado'} correctamente`, 'success');
                };
                
                img.onerror = () => {
                    console.log('Error cargando imagen, generando PDF sin escudo');
                    // Generar PDF sin imagen
                    createPDFWithoutLogo();
                };
                
                // Cargar imagen del escudo (ahora favicon.png)
                img.src = 'favicon.png';
            };
            
            // Función para generar PDF sin logo
            const createPDFWithoutLogo = () => {
                // Cabecera simple sin imagen
                doc.setFillColor(...atletiRed);
                doc.rect(0, 0, pageWidth, 40, 'F');
                
                doc.setTextColor(...atletiWhite);
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                const titleText = "ATLÉTICO DE MADRID";
                const titleWidth = doc.getTextWidth(titleText);
                doc.text(titleText, (pageWidth - titleWidth) / 2, 20);
                
                doc.setFontSize(14);
                const subtitleText = "SEGUIMIENTO DE PORTEROS";
                const subtitleWidth = doc.getTextWidth(subtitleText);
                doc.text(subtitleText, (pageWidth - subtitleWidth) / 2, 32);
                
                doc.setTextColor(0, 0, 0);
                yPosition = 50;
                
                // Línea separadora en azul
                doc.setDrawColor(...atletiBlue);
                doc.setLineWidth(2);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 10;
                
                // Generar todo el contenido del PDF
                generatePDFContent();
            };
            
            // Iniciar creación del PDF
            createPDFWithLogo();
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.showNotification('Error al generar el PDF. Verifique que jsPDF esté cargado correctamente.', 'error');
        }
    }

    saveToStorage() {
        try {
            const data = {
                currentMatch: this.currentMatch,
                actions: this.actions,
                customGestures: this.customGestures,
                currentHalf: this.currentHalf,
                matchPhase: this.matchPhase,
                timestamp: new Date()
            };
            localStorage.setItem('goalkeeperTracker', JSON.stringify(data));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            this.showNotification('Error al guardar los datos', 'error');
        }
    }

    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('goalkeeperTracker'));
            if (data && data.currentMatch) {
                this.currentMatch = data.currentMatch;
                this.actions = data.actions || [];
                this.customGestures = data.customGestures || [];
                this.currentHalf = data.currentHalf || 'none';
                this.matchPhase = data.matchPhase || 'not_started';
                
                this.showMatchScreen();
                
                // Renderizar gestos personalizados
                if (this.customGestures.length > 0) {
                    document.getElementById('customGesturesGroup').style.display = 'block';
                    this.customGestures.forEach(gesture => {
                        this.renderCustomGesture(gesture);
                    });
                }
                
                this.updateActionLog();
                this.updateStatistics();
                this.updatePhaseDisplay();
                this.updatePhaseButtons();
                
                this.showNotification('Partido cargado desde almacenamiento local', 'info');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
            return false;
        }
    }

    loadMatch() {
        const loaded = this.loadFromStorage();
        if (!loaded) {
            this.showNotification('No hay partidos guardados', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Remover notificaciones existentes
        const existingNotifications = document.querySelectorAll('.status-indicator');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `status-indicator ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    handleKeyPress(e) {
        // Atajos de teclado para acceso rápido
        if (e.altKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.showMatchModal();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveMatch();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportMatch();
                    break;
                case 'p':
                    e.preventDefault();
                    this.toggleTimer();
                    break;
            }
        }
    }

    updateDisplay() {
        this.updateStatistics();
        this.updateActionLog();
    }

    // Función auxiliar para determinar qué portero estaba activo en un momento dado
    getCurrentGoalkeeperAtTime(timestamp) {
        // Buscar el último cambio de portero antes de este timestamp
        const changes = this.actions.filter(a => 
            a.action === 'cambio_portero' && 
            new Date(a.timestamp) <= new Date(timestamp)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (changes.length > 0) {
            const lastChange = changes[changes.length - 1];
            return lastChange.details ? lastChange.details.newGoalkeeper : this.currentMatch.activeGoalkeeper;
        }
        
        // Si no hay cambios previos, usar el portero inicial (titular)
        return this.currentMatch.goalkeeperTitular || this.currentMatch.activeGoalkeeper;
    }
}

// Service Worker registration para funcionalidad offline (CORREGIDO PARA APK)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Usar ruta relativa para compatibilidad con APK
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ SW registrado exitosamente:', registration);
                console.log('📍 Scope:', registration.scope);
                
                // Verificar estado
                if (registration.active) {
                    console.log('🟢 Service Worker activo y listo para offline');
                } else if (registration.installing) {
                    console.log('🟡 Service Worker instalando...');
                } else if (registration.waiting) {
                    console.log('🟠 Service Worker esperando activación');
                }
            })
            .catch(registrationError => {
                console.error('❌ SW registro falló:', registrationError);
            });
    });
    
    // Verificar cuando esté listo
    navigator.serviceWorker.ready.then(() => {
        console.log('🚀 Service Worker listo - App funciona OFFLINE');
    });
} else {
    console.warn('⚠️ Service Worker no soportado en este navegador');
}

// Debug info para troubleshooting
console.log('🔍 DEBUG - Información del entorno:');
console.log('- Protocol:', window.location.protocol);
console.log('- Host:', window.location.host);
console.log('- ServiceWorker support:', 'serviceWorker' in navigator);
console.log('- LocalStorage support:', 'localStorage' in window);

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.goalkeeperTracker = new GoalkeeperTracker();
    window.app = window.goalkeeperTracker; // Para compatibilidad con funciones onclick
});

// Manejar visibilidad de la página para pausar/reanudar automáticamente
document.addEventListener('visibilitychange', () => {
    if (window.goalkeeperTracker && window.goalkeeperTracker.currentMatch) {
        if (document.hidden) {
            // Guardar automáticamente cuando la página se oculta
            window.goalkeeperTracker.saveToStorage();
        }
    }
});

// Prevenir pérdida de datos
window.addEventListener('beforeunload', (e) => {
    if (window.goalkeeperTracker && window.goalkeeperTracker.currentMatch && window.goalkeeperTracker.actions.length > 0) {
        window.goalkeeperTracker.saveToStorage();
        e.preventDefault();
        e.returnValue = '';
    }
});