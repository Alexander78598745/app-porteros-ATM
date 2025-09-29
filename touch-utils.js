// Utilidades adicionales para mejora de experiencia táctil
class TouchEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupTouchFeedback();
        this.setupGestureSupport();
        this.setupVibrationFeedback();
        this.setupFullscreenSupport();
        this.setupOrientationHandling();
    }

    setupTouchFeedback() {
        // Añadir efecto de feedback táctil a todos los botones
        document.addEventListener('touchstart', (e) => {
            if (e.target.matches('.btn, .action-buttons button, .tab-btn, .filter-btn')) {
                e.target.style.transform = 'scale(0.95)';
                e.target.style.transition = 'transform 0.1s ease';
            }
        });

        document.addEventListener('touchend', (e) => {
            if (e.target.matches('.btn, .action-buttons button, .tab-btn, .filter-btn')) {
                setTimeout(() => {
                    e.target.style.transform = 'scale(1)';
                }, 100);
            }
        });
    }

    setupGestureSupport() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!e.changedTouches[0]) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Gestos horizontales para cambiar categorías
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                const currentTab = document.querySelector('.tab-btn.active');
                const allTabs = Array.from(document.querySelectorAll('.tab-btn'));
                const currentIndex = allTabs.indexOf(currentTab);

                if (deltaX > 0 && currentIndex > 0) {
                    // Swipe derecha - categoría anterior
                    allTabs[currentIndex - 1].click();
                } else if (deltaX < 0 && currentIndex < allTabs.length - 1) {
                    // Swipe izquierda - categoría siguiente
                    allTabs[currentIndex + 1].click();
                }
            }

            // Gesto hacia arriba para guardar
            if (deltaY < -100 && Math.abs(deltaX) < 50) {
                if (window.goalkeeperTracker && window.goalkeeperTracker.currentMatch) {
                    window.goalkeeperTracker.saveMatch();
                }
            }
        });
    }

    setupVibrationFeedback() {
        // Configurar patrones de vibración específicos
        const vibrationPatterns = {
            success: [50],
            error: [100, 50, 100],
            save: [200],
            export: [50, 50, 50],
            timer: [25]
        };

        // Interceptar notificaciones para añadir vibración
        const originalShowNotification = window.goalkeeperTracker?.showNotification;
        if (originalShowNotification) {
            window.goalkeeperTracker.showNotification = function(message, type) {
                originalShowNotification.call(this, message, type);
                
                if ('vibrate' in navigator) {
                    const pattern = vibrationPatterns[type] || [50];
                    navigator.vibrate(pattern);
                }
            };
        }
    }

    setupFullscreenSupport() {
        // Botón para pantalla completa en tablets
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'btn btn-small fullscreen-btn';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.title = 'Pantalla completa';
        fullscreenBtn.style.position = 'fixed';
        fullscreenBtn.style.bottom = '20px';
        fullscreenBtn.style.right = '20px';
        fullscreenBtn.style.zIndex = '1000';
        fullscreenBtn.style.borderRadius = '50%';
        fullscreenBtn.style.width = '50px';
        fullscreenBtn.style.height = '50px';

        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log('Error al entrar en pantalla completa:', err);
                });
            } else {
                document.exitFullscreen();
            }
        });

        document.body.appendChild(fullscreenBtn);

        // Ocultar/mostrar según el estado de pantalla completa
        document.addEventListener('fullscreenchange', () => {
            fullscreenBtn.innerHTML = document.fullscreenElement ? '⛷' : '⛶';
        });
    }

    setupOrientationHandling() {
        // Manejar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Recalcular layouts después del cambio de orientación
                window.dispatchEvent(new Event('resize'));
            }, 100);
        });

        // Sugerir orientación horizontal para tablets
        if (screen.orientation && screen.orientation.lock) {
            try {
                screen.orientation.lock('landscape').catch(() => {
                    // Ignorar errores si no se puede bloquear la orientación
                });
            } catch (e) {
                // Navegador no soporta bloqueo de orientación
            }
        }
    }
}

// Utilidad para detección de dispositivos
class DeviceDetection {
    static isTablet() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isTablet = /(tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
        const hasTouch = 'ontouchstart' in window;
        const screenSize = window.screen.width >= 768 && window.screen.height >= 768;
        
        return isTablet || (hasTouch && screenSize);
    }

    static isMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        return /android|webos|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    }

    static isDesktop() {
        return !this.isTablet() && !this.isMobile();
    }
}

// Mejoras específicas para tablets
class TabletOptimizations {
    constructor() {
        if (DeviceDetection.isTablet()) {
            this.applyTabletStyles();
            this.setupTabletGestures();
        }
    }

    applyTabletStyles() {
        // Aplicar estilos específicos para tablets
        document.documentElement.style.setProperty('--btn-min-size', '48px');
        document.documentElement.style.setProperty('--touch-spacing', '12px');
        
        // Aumentar el tamaño de los botones de acción
        const actionButtons = document.querySelectorAll('.action-buttons .btn');
        actionButtons.forEach(btn => {
            btn.style.minHeight = '48px';
            btn.style.fontSize = '16px';
            btn.style.padding = '12px 16px';
        });
    }

    setupTabletGestures() {
        // Gestos específicos para tablets
        let longPressTimer;
        
        document.addEventListener('touchstart', (e) => {
            if (e.target.matches('.action-item')) {
                longPressTimer = setTimeout(() => {
                    // Mostrar información adicional en pulsación larga
                    this.showActionInfo(e.target);
                }, 800);
            }
        });

        document.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        document.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });
    }

    showActionInfo(actionElement) {
        const actionName = actionElement.querySelector('.action-name').textContent;
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Mostrar tooltip temporal
        const tooltip = document.createElement('div');
        tooltip.textContent = `Acción: ${actionName}`;
        tooltip.style.position = 'fixed';
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '10px 20px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.fontSize = '18px';
        tooltip.style.zIndex = '2000';
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            document.body.removeChild(tooltip);
        }, 2000);
    }
}

// Inicializar mejoras táctiles cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new TouchEnhancements();
    new TabletOptimizations();
    
    // Configurar meta viewport dinámicamente para tablets
    if (DeviceDetection.isTablet()) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
    }
});

// Prevenir zoom accidental en tablets
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
});

// Exportar utilidades
window.TouchEnhancements = TouchEnhancements;
window.DeviceDetection = DeviceDetection;
window.TabletOptimizations = TabletOptimizations;