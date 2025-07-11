class FetalMovementTracker {
    constructor() {
        // Authorized users as SHA-256 hashes - cannot be reversed to original usernames
        // To add new users: hash their username with SHA-256 and add the hash here
        this.authorizedUserHashes = [
            'a184675d2ff83f0e0eb1e59d2e732abe124c0ee86e9a8a08befd074bca7dcef7', // xiaoshu
            'cb6c4241a545821f65426c55dcafba973e62f3e8048d055602e7c78ac3e4d665', // tiantianquan
            '2100434549267ea853c6e23e048899fc2b9a9eae90c7d961feaf839a6d60e769', // poaers
            '0a66bb1294be56bfbf38fff7a60b120af8f6864307f32e405d66bc1b9a35f328'  // shu_test
        ];
        
        this.currentUser = null;
        this.isRunning = false;
        this.movements = [];
        this.movementEpisodes = []; // Track individual movement episodes
        this.sessionStartTime = null;
        this.timerInterval = null;
        this.currentPhase = 'initial'; // initial, extended1, extended2
        this.phaseDurations = {
            initial: 20 * 60, // 20 minutes
            extended1: 40 * 60, // 40 minutes
            extended2: 60 * 60  // 60 minutes
        };
        this.phaseNames = {
            initial: 'Initial 20min',
            extended1: 'Extended to 40min',
            extended2: 'Extended to 60min'
        };
        this.minMovements = 3;
        this.clusterWindow = 3 * 60; // 3 minutes in seconds
        
        this.initializeElements();
        this.bindEvents();
        this.checkAuthentication();
    }

    // Hash function using SHA-256
    async hashUsername(username) {
        const encoder = new TextEncoder();
        const data = encoder.encode(username.toLowerCase());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Check if username hash is authorized
    async isUserAuthorized(username) {
        const userHash = await this.hashUsername(username);
        return this.authorizedUserHashes.includes(userHash);
    }

    initializeElements() {
        // Login elements
        this.loginScreen = document.getElementById('loginScreen');
        this.appScreen = document.getElementById('appScreen');
        this.usernameInput = document.getElementById('username');
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.userDisplayName = document.getElementById('userDisplayName');
        
        // App elements
        this.timerElement = document.getElementById('timer');
        this.statusElement = document.getElementById('status');
        this.movementCountElement = document.getElementById('movementCount');
        this.startBtn = document.getElementById('startBtn');
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.sessionInfo = document.getElementById('sessionInfo');
        this.sessionDetails = document.getElementById('sessionDetails');
        this.historyList = document.getElementById('historyList');
        this.exportCsvBtn = document.getElementById('exportCsv');
        this.exportJsonBtn = document.getElementById('exportJson');
    }

    bindEvents() {
        // Login events
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
        
        // App events
        this.startBtn.addEventListener('click', () => this.startSession());
        this.recordBtn.addEventListener('click', () => this.recordMovement());
        this.stopBtn.addEventListener('click', () => this.stopSession());
        this.exportCsvBtn.addEventListener('click', () => this.exportToCSV());
        this.exportJsonBtn.addEventListener('click', () => this.exportToJSON());
    }

    async checkAuthentication() {
        const savedUser = localStorage.getItem('fetalMovementUser');
        if (savedUser && await this.isUserAuthorized(savedUser)) {
            this.currentUser = savedUser;
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    async handleLogin() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            this.showError('Please enter your name');
            return;
        }

        if (await this.isUserAuthorized(username)) {
            this.currentUser = username;
            localStorage.setItem('fetalMovementUser', username);
            this.showApp();
            this.loadHistory();
        } else {
            this.showError('Sorry, this name is not authorized to use this app.');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('fetalMovementUser');
        this.showLogin();
        this.usernameInput.value = '';
    }

    showLogin() {
        this.loginScreen.style.display = 'block';
        this.appScreen.style.display = 'none';
        this.hideError();
    }

    showApp() {
        this.loginScreen.style.display = 'none';
        this.appScreen.style.display = 'block';
        this.userDisplayName.textContent = this.currentUser;
        this.hideError();
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    startSession() {
        this.isRunning = true;
        this.sessionStartTime = new Date();
        this.movements = [];
        this.movementEpisodes = [];
        this.currentPhase = 'initial';
        
        this.startBtn.disabled = true;
        this.recordBtn.disabled = false;
        this.stopBtn.disabled = false;
        
        this.statusElement.textContent = 'Session started - Record movements!';
        this.sessionInfo.style.display = 'block';
        this.updateSessionInfo();
        
        this.startTimer();
    }

    recordMovement() {
        if (!this.isRunning) return;
        
        const currentTime = new Date();
        const movement = {
            timestamp: currentTime,
            phase: this.currentPhase,
            timeFromStart: Math.floor((currentTime - this.sessionStartTime) / 1000),
            user: this.currentUser
        };
        
        this.movements.push(movement);
        
        // Check if this movement should start a new episode or be part of existing one
        this.updateMovementEpisodes(movement);
        
        this.updateMovementCount();
        this.updateSessionInfo();
        
        // Visual feedback
        this.recordBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.recordBtn.style.transform = 'scale(1)';
        }, 100);
    }

    updateMovementEpisodes(newMovement) {
        const currentTime = newMovement.timestamp.getTime();
        
        // Check if there's a recent episode to add to
        let addedToExisting = false;
        
        for (let episode of this.movementEpisodes) {
            const lastMovementInEpisode = episode.movements[episode.movements.length - 1];
            const timeSinceLastMovement = (currentTime - lastMovementInEpisode.timestamp.getTime()) / 1000;
            
            if (timeSinceLastMovement <= this.clusterWindow) {
                // Add to existing episode
                episode.movements.push(newMovement);
                episode.lastMovementTime = currentTime;
                addedToExisting = true;
                break;
            }
        }
        
        if (!addedToExisting) {
            // Start a new episode
            const newEpisode = {
                startTime: currentTime,
                lastMovementTime: currentTime,
                movements: [newMovement],
                phase: this.currentPhase
            };
            this.movementEpisodes.push(newEpisode);
        }
    }

    stopSession() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        this.startBtn.disabled = false;
        this.recordBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.statusElement.textContent = 'Session completed';
        this.sessionInfo.style.display = 'none';
        
        this.saveSession();
        this.loadHistory();
    }

    startTimer() {
        const startTime = Date.now();
        const initialDuration = this.phaseDurations.initial;
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, initialDuration - elapsed);
            
            this.updateTimer(remaining);
            
            // Check if we need to extend the session
            if (remaining === 0) {
                this.checkAndExtendSession();
            }
        }, 1000);
    }

    checkAndExtendSession() {
        // Count episodes in current phase, not total movements
        const currentEpisodes = this.movementEpisodes.filter(e => e.phase === this.currentPhase).length;
        
        if (currentEpisodes < this.minMovements) {
            if (this.currentPhase === 'initial') {
                this.extendSession('extended1');
            } else if (this.currentPhase === 'extended1') {
                this.extendSession('extended2');
            } else {
                // Session completed at 60 minutes
                this.completeSession();
            }
        } else {
            // Enough episodes, complete session
            this.completeSession();
        }
    }

    extendSession(newPhase) {
        this.currentPhase = newPhase;
        const phaseDuration = this.phaseDurations[newPhase];
        const startTime = this.sessionStartTime.getTime();
        
        clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, phaseDuration - elapsed);
            
            this.updateTimer(remaining);
            this.updateSessionInfo();
            
            if (remaining === 0) {
                this.checkAndExtendSession();
            }
        }, 1000);
        
        this.statusElement.textContent = `Extended to ${this.phaseNames[newPhase]} - Continue recording!`;
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.statusElement.textContent = 'Session completed - Sufficient movements recorded';
        this.updateTimer(0);
    }

    updateTimer(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateMovementCount() {
        const totalMovements = this.movements.length;
        const totalEpisodes = this.movementEpisodes.length;
        const phaseEpisodes = this.movementEpisodes.filter(e => e.phase === this.currentPhase).length;
        
        this.movementCountElement.textContent = `Movements: ${totalMovements} | Episodes: ${totalEpisodes} (${phaseEpisodes} in current phase)`;
    }

    updateSessionInfo() {
        if (!this.sessionStartTime) return;
        
        const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const totalMovements = this.movements.length;
        const totalEpisodes = this.movementEpisodes.length;
        const phaseEpisodes = this.movementEpisodes.filter(e => e.phase === this.currentPhase).length;
        
        this.sessionDetails.innerHTML = `
            <strong>Duration:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}<br>
            <strong>Current Phase:</strong> ${this.phaseNames[this.currentPhase]}<br>
            <strong>Total Movements:</strong> ${totalMovements}<br>
            <strong>Movement Episodes:</strong> ${totalEpisodes}<br>
            <strong>Episodes in Current Phase:</strong> ${phaseEpisodes}<br>
            <strong>Started:</strong> ${this.sessionStartTime.toLocaleString()}
        `;
    }

    saveSession() {
        const session = {
            id: Date.now(),
            user: this.currentUser,
            startTime: this.sessionStartTime.toISOString(),
            endTime: new Date().toISOString(),
            movements: this.movements,
            movementEpisodes: this.movementEpisodes,
            totalMovements: this.movements.length,
            totalEpisodes: this.movementEpisodes.length,
            finalPhase: this.currentPhase,
            duration: Math.floor((new Date() - this.sessionStartTime) / 1000)
        };
        
        const history = this.getHistory();
        history.unshift(session);
        
        // Keep only last 50 sessions
        if (history.length > 50) {
            history.splice(50);
        }
        
        localStorage.setItem('fetalMovementHistory', JSON.stringify(history));
    }

    getHistory() {
        const history = localStorage.getItem('fetalMovementHistory');
        return history ? JSON.parse(history) : [];
    }

    loadHistory() {
        const history = this.getHistory();
        this.historyList.innerHTML = '';
        
        // Filter history for current user only
        const userHistory = history.filter(session => session.user === this.currentUser);
        
        userHistory.slice(0, 10).forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'history-item';
            
            const startTime = new Date(session.startTime);
            const duration = Math.floor(session.duration / 60);
            
            // Handle both old format (without episodes) and new format
            const totalMovements = session.totalMovements || 0;
            const totalEpisodes = session.totalEpisodes || totalMovements; // Fallback for old data
            
            sessionElement.innerHTML = `
                <h4>Session ${new Date(session.startTime).toLocaleDateString()}</h4>
                <p>Movements: ${totalMovements} | Episodes: ${totalEpisodes} | Duration: ${duration}min | Phase: ${this.phaseNames[session.finalPhase]}</p>
                <p>Time: ${startTime.toLocaleTimeString()}</p>
            `;
            
            this.historyList.appendChild(sessionElement);
        });
    }

    exportToCSV() {
        const history = this.getHistory();
        const userHistory = history.filter(session => session.user === this.currentUser);
        
        if (userHistory.length === 0) {
            alert('No data to export');
            return;
        }
        
        let csv = 'Session ID,User,Start Time,End Time,Duration (seconds),Total Movements,Total Episodes,Final Phase\n';
        
        userHistory.forEach(session => {
            const totalMovements = session.totalMovements || 0;
            const totalEpisodes = session.totalEpisodes || totalMovements;
            csv += `${session.id},${session.user},${session.startTime},${session.endTime},${session.duration},${totalMovements},${totalEpisodes},${session.finalPhase}\n`;
        });
        
        this.downloadFile(csv, `fetal_movements_${this.currentUser}.csv`, 'text/csv');
    }

    exportToJSON() {
        const history = this.getHistory();
        const userHistory = history.filter(session => session.user === this.currentUser);
        
        if (userHistory.length === 0) {
            alert('No data to export');
            return;
        }
        
        const jsonData = JSON.stringify(userHistory, null, 2);
        this.downloadFile(jsonData, `fetal_movements_${this.currentUser}.json`, 'application/json');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FetalMovementTracker();
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 