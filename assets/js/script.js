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
  const normaliza = p => (p || '').replace(/\.html$/, '').replace(/^\//, '') || 'index';
  const atual = normaliza(location.pathname.split('/').pop());
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('http')) return;
    const alvo = normaliza(href.split('/').pop());
    if (alvo === atual) {
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

  /* ─── WIDGET DE ACESSIBILIDADE (fixo à esquerda) ─── */
  if (!document.querySelector('.a11y-side')) {
    const savedContrast = localStorage.getItem('a11y-contrast') === 'true';
    const savedSpacing  = localStorage.getItem('a11y-spacing') === 'true';
    const savedSize     = localStorage.getItem('a11y-font') || 'normal';
    if (savedContrast) document.documentElement.classList.add('high-contrast');
    if (savedSpacing)  document.body.classList.add('reading-spacing');

    const side = document.createElement('div');
    side.className = 'a11y-side';
    side.setAttribute('role', 'region');
    side.setAttribute('aria-label', 'Configurações de acessibilidade');
    side.innerHTML = `
      <button class="a11y-side-toggle" aria-expanded="false" aria-controls="a11y-side-panel" title="Acessibilidade">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M5 9.5l5.5 1v3l-2 6M19 9.5l-5.5 1v3l2 6M12 10.5v3"/></svg>
        <span class="sr-only">Abrir opções de acessibilidade</span>
      </button>
      <div class="a11y-side-panel" id="a11y-side-panel" hidden>
        <span class="a11y-side-title">Acessibilidade</span>
        <button class="a11y-side-btn" id="a11y-contrast-btn" aria-pressed="false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z"/></svg>
          <span>Contraste</span>
        </button>
        <button class="a11y-side-btn" id="a11y-spacing-btn" aria-pressed="false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <span>Espaçamento</span>
        </button>
        <div class="a11y-side-fonts" role="group" aria-label="Tamanho da fonte">
          <button class="a11y-font-btn" data-size="normal" title="Fonte normal">A</button>
          <button class="a11y-font-btn" data-size="lg" title="Fonte grande">A+</button>
          <button class="a11y-font-btn" data-size="xl" title="Fonte muito grande">A++</button>
        </div>
      </div>
    `;
    document.body.appendChild(side);

    // Abre e fecha o painel
    const toggleBtn = side.querySelector('.a11y-side-toggle');
    const panel = side.querySelector('.a11y-side-panel');
    toggleBtn.addEventListener('click', () => {
      const open = panel.hasAttribute('hidden');
      if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      toggleBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => {
      if (!side.contains(e.target) && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.focus();
      }
    });

    // Alto contraste
    const contrastBtn = side.querySelector('#a11y-contrast-btn');
    if (savedContrast) {
      contrastBtn.setAttribute('aria-pressed', 'true');
      contrastBtn.classList.add('active');
    }
    contrastBtn.addEventListener('click', () => {
      const on = document.documentElement.classList.toggle('high-contrast');
      contrastBtn.setAttribute('aria-pressed', String(on));
      contrastBtn.classList.toggle('active', on);
      localStorage.setItem('a11y-contrast', on);
    });

    // Espaçamento de leitura
    const spacingBtn = side.querySelector('#a11y-spacing-btn');
    if (savedSpacing) {
      spacingBtn.setAttribute('aria-pressed', 'true');
      spacingBtn.classList.add('active');
    }
    spacingBtn.addEventListener('click', () => {
      const on = document.body.classList.toggle('reading-spacing');
      spacingBtn.setAttribute('aria-pressed', String(on));
      spacingBtn.classList.toggle('active', on);
      localStorage.setItem('a11y-spacing', on);
    });

    // Tamanho de fonte
    const fontBtns = side.querySelectorAll('.a11y-font-btn');
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
      { title: 'Direitos PCD', url: '/direitos-pcd', cat: 'Direitos PCD', excerpt: 'Informações sobre direitos das pessoas com deficiência: benefícios, acessibilidade, trabalho, educação e saúde.' },
      { title: 'Blog da Concurseira', url: '/blog', cat: 'Blog', excerpt: 'Métodos de estudo, organização, dicas de rotina e reflexões para concurseiros.' },
      { title: 'Notícias de Concursos', url: '/noticias', cat: 'Notícias', excerpt: 'Editais abertos, concursos previstos e oportunidades para candidatos PCD.' },
      { title: 'Materiais Gratuitos', url: '/materiais-gratuitos', cat: 'Materiais', excerpt: 'Checklists, planners e guias práticos para organizar seus estudos.' },
      { title: 'Produtos Digitais', url: '/produtos-digitais', cat: 'Produtos', excerpt: 'Kits, planilhas e ferramentas para uma preparação mais estruturada.' },
      { title: 'Sobre Pâmela Dayane', url: '/sobre', cat: 'Sobre', excerpt: 'Conheça a trajetória de Pâmela Dayane, servidora pública, PCD e criadora do projeto.' },
      { title: 'Contato', url: '/contato', cat: 'Institucional', excerpt: 'Entre em contato com a Concurseira PCD.' },
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
