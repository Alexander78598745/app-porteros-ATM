const CACHE_NAME = 'goalkeeper-tracker-v1.0.1'; // Versión incrementada
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './atleti-logo.svg',
    './escudo-atm.png',
    './jspdf.umd.min.js',
    './touch-utils.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando v1.0.1...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Cacheando archivos...');
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.warn(`⚠️ No se pudo cachear ${url}:`, error);
                            // No fallar por un archivo individual
                            return Promise.resolve();
                        });
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Instalación completa');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Error durante la instalación', error);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activando v1.0.1...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: Activación completa');
            return self.clients.claim();
        })
    );
});

// Interceptar solicitudes de red (MEJORADO PARA APK)
self.addEventListener('fetch', event => {
    // Solo manejar solicitudes GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignorar extensiones del navegador y esquemas no HTTP
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el archivo está en caché, devolverlo
                if (response) {
                    console.log('📦 Service Worker: Sirviendo desde caché:', event.request.url);
                    return response;
                }

                // Si no está en caché, intentar obtenerlo de la red
                return fetch(event.request)
                    .then(response => {
                        // Verificar si la respuesta es válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clonar la respuesta
                        const responseToCache = response.clone();

                        // Agregar a caché
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        console.log('🌐 Service Worker: Archivo agregado a caché desde red:', event.request.url);
                        return response;
                    })
                    .catch(error => {
                        console.log('🔄 Service Worker: Sin conexión, sirviendo desde caché:', error);
                        
                        // Si es una solicitud de navegación, devolver la página principal
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        // Para otros recursos, intentar servir algo similar del caché
                        if (event.request.url.includes('.js')) {
                            return caches.match('./app.js');
                        }
                        
                        if (event.request.url.includes('.css')) {
                            return caches.match('./styles.css');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
    console.log('💬 Service Worker: Mensaje recibido:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATS') {
        caches.open(CACHE_NAME).then(cache => {
            cache.keys().then(keys => {
                event.ports[0].postMessage({
                    type: 'CACHE_STATS',
                    data: {
                        cacheSize: keys.length,
                        cachedUrls: keys.map(request => request.url)
                    }
                });
            });
        });
    }
    
    if (event.data && event.data.type === 'CHECK_OFFLINE') {
        event.ports[0].postMessage({
            type: 'OFFLINE_STATUS',
            isOffline: !navigator.onLine
        });
    }
});

// Manejar sincronización en segundo plano
self.addEventListener('sync', event => {
    console.log('🔄 Service Worker: Sincronización en segundo plano:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Aquí podrías sincronizar datos cuando la conexión esté disponible
            Promise.resolve()
        );
    }
});

// Manejar notificaciones push (futuro)
self.addEventListener('push', event => {
    console.log('📱 Service Worker: Notificación push recibida:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación',
        icon: './atleti-logo.svg',
        badge: './atleti-logo.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver',
                icon: './atleti-logo.svg'
            },
            {
                action: 'close',
                title: 'Cerrar'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Seguimiento Porteros ATM', options)
    );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
    console.log('👆 Service Worker: Click en notificación:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./index.html')
        );
    }
});

// Información del Service Worker
console.log('⚽ Service Worker: Goalkeeper Tracker v1.0.1 - Atlético de Madrid');
console.log('🔴⚪ Service Worker: NUNCA DEJES DE CREER - FUNCIONANDO OFFLINE!');

// Notificar cuando esté listo para offline
self.addEventListener('activate', () => {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'SW_READY',
                message: 'Aplicación lista para funcionar offline'
            });
        });
    });
});