/* Concurseira PCD — script.js */

(function () {
  'use strict';

  /* ─── MENU MOBILE ─── */
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? '✕' : '☰';
    });

    // Fecha ao clicar em link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
        toggle.textContent = '☰';
      });
    });

    // Fecha ao clicar fora
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
        toggle.textContent = '☰';
      }
    });
  }

  /* ─── MARCA LINK ATIVO ─── */
  const currentPath = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ─── ANIMAÇÃO DE ENTRADA (fade-in) ─── */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll(
    '.card, .feature-card, .pub-card, .news-card, .timeline-item, .section-heading, .split > div'
  ).forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = (i % 4) * 0.07 + 's';
    observer.observe(el);
  });

  /* ─── PAINEL DE ACESSIBILIDADE ─── */
  // Cria botão e painel se não existirem no HTML
  if (!document.querySelector('.a11y-btn')) {
    const btn = document.createElement('button');
    btn.className = 'a11y-btn';
    btn.setAttribute('aria-label', 'Opções de acessibilidade');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M7 9h10M12 11v7"/><path d="M9 21l3-4 3 4"/></svg>';
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Configurações de acessibilidade');
    panel.innerHTML = `
      <p class="a11y-panel-title">Acessibilidade</p>

      <div class="a11y-row">
        <span>Alto contraste</span>
        <label class="a11y-toggle">
          <input type="checkbox" id="a11y-contrast"/>
          <span class="a11y-toggle-slider"></span>
        </label>
      </div>

      <div class="a11y-row">
        <span>Espaçamento de leitura</span>
        <label class="a11y-toggle">
          <input type="checkbox" id="a11y-spacing"/>
          <span class="a11y-toggle-slider"></span>
        </label>
      </div>

      <div class="a11y-row" style="flex-direction:column;align-items:flex-start;gap:0.5rem">
        <span>Tamanho da fonte</span>
        <div class="a11y-font-btns">
          <button class="a11y-font-btn active" data-size="normal">A</button>
          <button class="a11y-font-btn" data-size="lg">A+</button>
          <button class="a11y-font-btn" data-size="xl">A++</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Toggle painel
    btn.addEventListener('click', () => panel.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && !btn.contains(e.target))
        panel.classList.remove('open');
    });

    // Alto contraste
    const contrastChk = panel.querySelector('#a11y-contrast');
    const savedContrast = localStorage.getItem('a11y-contrast') === 'true';
    if (savedContrast) { document.documentElement.classList.add('high-contrast'); contrastChk.checked = true; }
    contrastChk.addEventListener('change', () => {
      document.documentElement.classList.toggle('high-contrast', contrastChk.checked);
      localStorage.setItem('a11y-contrast', contrastChk.checked);
    });

    // Espaçamento de leitura
    const spacingChk = panel.querySelector('#a11y-spacing');
    const savedSpacing = localStorage.getItem('a11y-spacing') === 'true';
    if (savedSpacing) { document.body.classList.add('reading-spacing'); spacingChk.checked = true; }
    spacingChk.addEventListener('change', () => {
      document.body.classList.toggle('reading-spacing', spacingChk.checked);
      localStorage.setItem('a11y-spacing', spacingChk.checked);
    });

    // Tamanho de fonte
    const fontBtns = panel.querySelectorAll('.a11y-font-btn');
    const savedSize = localStorage.getItem('a11y-font') || 'normal';
    applyFontSize(savedSize, fontBtns);

    fontBtns.forEach(b => {
      b.addEventListener('click', () => {
        const size = b.dataset.size;
        applyFontSize(size, fontBtns);
        localStorage.setItem('a11y-font', size);
      });
    });
  }

  function applyFontSize(size, btns) {
    document.documentElement.classList.remove('text-size-lg', 'text-size-xl');
    if (size === 'lg') document.documentElement.classList.add('text-size-lg');
    if (size === 'xl') document.documentElement.classList.add('text-size-xl');
    btns.forEach(b => b.classList.toggle('active', b.dataset.size === size));
  }

  /* ─── VER MAIS (limita cards visíveis) ─── */
  function setupVerMais(containerSel, itemSel, max) {
    const container = document.querySelector(containerSel);
    if (!container) return;
    const allItems = Array.from(container.querySelectorAll(itemSel));
    if (allItems.length <= max) return;

    // Esconde os que passam do limite
    allItems.slice(max).forEach(el => el.classList.add('card-oculto'));

    // Cria wrapper e botão
    const wrap = document.createElement('div');
    wrap.className = 'ver-mais-wrap';
    wrap.innerHTML = `
      <button class="btn ver-mais-btn">
        Ver mais
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </button>`;
    container.after(wrap);

    wrap.querySelector('button').addEventListener('click', () => {
      container.querySelectorAll('.card-oculto').forEach(el => el.classList.remove('card-oculto'));
      wrap.remove();
    });
  }

  // Home: notícias (máx 6)
  setupVerMais('.news-grid', '.news-card-v2', 6);
  // Artigos de direitos-pcd (máx 6; ignora cards já ocultos pelo filtro)
  setupVerMais('#artigos-grid', '.artigo-card', 6);

  /* ─── BUSCA (search.html) ─── */
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchCount = document.getElementById('search-count');

  if (searchInput && searchResults) {
    // Índice de busca simples baseado nas páginas do site
    const pages = [
      { title: 'Direitos PCD', url: 'direitos-pcd.html', cat: 'Direitos PCD', excerpt: 'Informações sobre direitos das pessoas com deficiência: benefícios, acessibilidade, trabalho, educação e saúde.' },
      { title: 'Blog da Concurseira', url: 'blog.html', cat: 'Blog', excerpt: 'Métodos de estudo, organização, dicas de rotina e reflexões para concurseiros.' },
      { title: 'Notícias de Concursos', url: 'noticias.html', cat: 'Notícias', excerpt: 'Editais abertos, concursos previstos e oportunidades para candidatos PCD.' },
      { title: 'Materiais Gratuitos', url: 'materiais-gratuitos.html', cat: 'Materiais', excerpt: 'Checklists, planners e guias práticos para organizar seus estudos.' },
      { title: 'Produtos Digitais', url: 'produtos-digitais.html', cat: 'Produtos', excerpt: 'Kits, planilhas e ferramentas para uma preparação mais estruturada.' },
      { title: 'Achadinhos de Estudo', url: 'achadinhos.html', cat: 'Achadinhos', excerpt: 'Recursos e indicações para conforto, organização e tecnologia nos estudos.' },
      { title: 'Sobre Pâmela Dayane', url: 'sobre.html', cat: 'Sobre', excerpt: 'Conheça a trajetória de Pâmela Dayane, servidora pública, PCD e criadora do projeto.' },
      { title: 'Contato', url: 'contato.html', cat: 'Institucional', excerpt: 'Entre em contato com a Concurseira PCD.' },
    ];

    // Pré-popula com todos se vier query na URL
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (q) { searchInput.value = q; doSearch(q); }

    searchInput.addEventListener('input', () => doSearch(searchInput.value));

    function doSearch(query) {
      const q = query.trim().toLowerCase();
      if (!q) { searchResults.innerHTML = ''; if (searchCount) searchCount.textContent = ''; return; }

      const hits = pages.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q)
      );

      if (searchCount) searchCount.textContent = `${hits.length} resultado${hits.length !== 1 ? 's' : ''} para "${query}"`;

      if (!hits.length) {
        searchResults.innerHTML = `<div class="search-empty"><div class="empty-icon">🔍</div><p>Nenhum resultado encontrado. Tente outros termos.</p></div>`;
        return;
      }

      searchResults.innerHTML = hits.map(p => `
        <a class="search-result-item" href="${p.url}">
          <span class="result-cat">${p.cat}</span>
          <strong>${p.title}</strong>
          <span style="font-size:0.85rem;color:var(--muted-fg)">${p.excerpt}</span>
        </a>
      `).join('');
    }
  }

})();
