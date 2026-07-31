/**
 * Utilitaire pour jouer des sons de notification
 * Utilise l'API Web Audio pour générer des sons synthétiques
 */

class SoundNotification {
    constructor() {
        // Initialiser le contexte audio une seule fois
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            // Créer le contexte audio seulement si nécessaire
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        } catch (error) {
            console.warn('Web Audio API non supportée:', error);
        }
    }

    /**
     * Joue un son de bip de confirmation
     * @param {string} type - Type de notification: 'success', 'error', 'warning', 'info'
     */
    playBeep(type = 'success') {
        if (!this.audioContext) {
            console.warn('Audio context non disponible');
            return;
        }

        // S'assurer que le contexte audio est actif
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        try {
            // Créer un oscillateur pour générer le son
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Connecter les noeuds
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configurer le son selon le type
            const soundConfig = this.getSoundConfig(type);
            oscillator.type = soundConfig.waveType;
            oscillator.frequency.setValueAtTime(soundConfig.frequency, this.audioContext.currentTime);

            // Configuration du volume (envelope)
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(soundConfig.volume, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + soundConfig.duration);

            // Démarrer et arrêter l'oscillateur
            oscillator.start(now);
            oscillator.stop(now + soundConfig.duration);

            // Si c'est un son de succès, jouer une deuxième note
            if (type === 'success') {
                this.playSecondNote(now + 0.1);
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du son:', error);
        }
    }

    /**
     * Joue une deuxième note pour le son de succès
     */
    playSecondNote(startTime) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, startTime);

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
        } catch (error) {
            console.error('Erreur lors de la lecture de la deuxième note:', error);
        }
    }

    /**
     * Obtient la configuration du son selon le type
     */
    getSoundConfig(type) {
        const configs = {
            success: {
                frequency: 600,   // Note agréable (D5)
                volume: 0.3,
                duration: 0.15,
                waveType: 'sine'
            },
            error: {
                frequency: 200,   // Note grave pour l'erreur
                volume: 0.4,
                duration: 0.3,
                waveType: 'sawtooth'
            },
            warning: {
                frequency: 400,   // Note moyenne
                volume: 0.3,
                duration: 0.2,
                waveType: 'triangle'
            },
            info: {
                frequency: 500,
                volume: 0.2,
                duration: 0.1,
                waveType: 'sine'
            }
        };

        return configs[type] || configs.info;
    }

    /**
     * Joue un son de scan de code-barres/QR
     */
    playScanSound() {
        this.playBeep('success');
    }

    /**
     * Joue un son de succès générique
     */
    playSuccess() {
        this.playBeep('success');
    }

    /**
     * Joue un son d'alerte générique
     */
    playAlert() {
        this.playBeep('warning');
    }

    /**
     * Joue un son d'erreur
     */
    playErrorSound() {
        this.playBeep('error');
    }

    /**
     * Joue un son d'avertissement
     */
    playWarningSound() {
        this.playBeep('warning');
    }
}

// Créer une instance singleton
const soundNotification = new SoundNotification();

export default soundNotification;
