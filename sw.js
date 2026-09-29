// Biblioteca Loghus - funcionamento offline
// Ao mudar este número, os celulares baixam os arquivos de novo.
const CACHE = 'loghus-v1';
const ARQUIVOS = ['./', 'index.html', 'materiais.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'mapa-recorrencia.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ARQUIVOS.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Página e lista de materiais: sempre tenta a versão nova da internet; sem internet, usa a guardada.
// Ícones e demais arquivos: usa o guardado e atualiza em segundo plano.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const primeiroRede = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname.endsWith('/');
  if (primeiroRede) {
    e.respondWith(fetch(req).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req).then(guardado => {
      const rede = fetch(req).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return r; }).catch(() => guardado);
      return guardado || rede;
    }));
  }
});
