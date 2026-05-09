/* ─── MOBILE NAV TOGGLE ─── */
const toggle = document.querySelector('.nav-toggle');
const nav    = document.querySelector('.main-nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    });
  });
}

/* ─── FECHAR NAV AO CLICAR FORA ─── */
document.addEventListener('click', (e) => {
  if (nav && nav.classList.contains('open') &&
      !nav.contains(e.target) && toggle && !toggle.contains(e.target)) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';
  }
});

/* ─── ACTIVE NAV LINK ─── */
(function markActiveLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ─── HEADER SHADOW ON SCROLL ─── */
const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ─── BOTÃO VOLTAR AO TOPO ─── */
const backBtn = document.createElement('button');
backBtn.className = 'back-to-top';
backBtn.setAttribute('aria-label', 'Voltar ao topo');
backBtn.innerHTML = '↑';
document.body.appendChild(backBtn);

backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => {
  backBtn.classList.toggle('visible', window.scrollY > 420);
}, { passive: true });

/* ─── NEWSLETTER / FORMULÁRIO DE INSCRIÇÃO ─── */
const signupForm = document.querySelector('.signup-form');
if (signupForm) {
  const btn = signupForm.querySelector('button');
  if (btn) {
    btn.addEventListener('click', () => {
      const nomeInput  = signupForm.querySelector('#nome');
      const emailInput = signupForm.querySelector('#email');
      const nome  = nomeInput?.value.trim();
      const email = emailInput?.value.trim();

      // Limpeza visual anterior
      [nomeInput, emailInput].forEach(el => el?.classList.remove('input-error'));

      let valid = true;
      if (!nome && nomeInput) { nomeInput.classList.add('input-error'); nomeInput.focus(); valid = false; }
      if ((!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && emailInput) {
        emailInput.classList.add('input-error');
        if (valid) { emailInput.focus(); }
        valid = false;
      }
      if (!valid) return;

      // TODO: Integre aqui com sua plataforma de e-mail:
      // Mailchimp:    https://mailchimp.com/developer/marketing/api/
      // ConvertKit:   https://developers.convertkit.com/
      // Brevo:        https://developers.brevo.com/
      // Formspree:    fetch('https://formspree.io/f/SEU_ID', { method:'POST', body: JSON.stringify({nome, email}), headers:{'Content-Type':'application/json'} })

      signupForm.innerHTML = `
        <div class="form-success">
          <div class="success-icon">✓</div>
          <h3>Obrigada, ${nome}!</h3>
          <p>Em breve você vai receber materiais e novidades no e-mail <strong>${email}</strong>.</p>
        </div>
      `;
    });
  }
}

/* ─── BOTÃO DE ACESSIBILIDADE FLUTUANTE ─── */
(function() {
  const A11Y_KEY = 'cpcd-a11y';
  const defaults = { fontSize: 'base', contrast: false, spacing: false };
  let settings = Object.assign({}, defaults);

  try {
    const saved = JSON.parse(localStorage.getItem(A11Y_KEY) || '{}');
    settings = Object.assign({}, defaults, saved);
  } catch(e) {}

  function applySettings() {
    document.body.classList.remove('a11y-font-lg', 'a11y-font-xl');
    if (settings.fontSize === 'lg') document.body.classList.add('a11y-font-lg');
    if (settings.fontSize === 'xl') document.body.classList.add('a11y-font-xl');
    document.body.classList.toggle('a11y-contrast', settings.contrast);
    document.body.classList.toggle('a11y-spacing',  settings.spacing);
  }

  function save() {
    try { localStorage.setItem(A11Y_KEY, JSON.stringify(settings)); } catch(e) {}
    applySettings();
    renderPanel();
  }

  // criar botão
  const btn = document.createElement('button');
  btn.className = 'a11y-btn';
  btn.setAttribute('aria-label', 'Opções de acessibilidade');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="2" r="1"/><path d="M12 7v5l3 3"/><path d="M4.93 4.93l2.83 2.83M19.07 4.93l-2.83 2.83M4.93 19.07l2.83-2.83M19.07 19.07l-2.83-2.83"/><circle cx="12" cy="16" r="6"/></svg>';

  // criar painel
  const panel = document.createElement('div');
  panel.className = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Opções de acessibilidade');

  function renderPanel() {
    const sizes = [
      { val: 'base', label: 'A' },
      { val: 'lg',   label: 'A+' },
      { val: 'xl',   label: 'A++' },
    ];
    panel.innerHTML = `
      <h3>Acessibilidade</h3>
      <div class="a11y-row">
        <span>Tamanho do texto</span>
        <div class="a11y-font-btns">
          ${sizes.map(s => `<button class="a11y-font-btn${settings.fontSize===s.val?' active':''}" data-size="${s.val}" aria-pressed="${settings.fontSize===s.val}">${s.label}</button>`).join('')}
        </div>
      </div>
      <div class="a11y-row">
        <label><span>🎨</span> Alto contraste</label>
        <button class="a11y-toggle${settings.contrast?' on':''}" data-toggle="contrast" aria-pressed="${settings.contrast}" aria-label="Alternar alto contraste"></button>
      </div>
      <div class="a11y-row">
        <label><span>📖</span> Espaçamento de leitura</label>
        <button class="a11y-toggle${settings.spacing?' on':''}" data-toggle="spacing" aria-pressed="${settings.spacing}" aria-label="Alternar espaçamento de leitura"></button>
      </div>
      <button class="a11y-reset">↺ Restaurar padrão</button>
    `;

    panel.querySelectorAll('.a11y-font-btn').forEach(b => {
      b.addEventListener('click', () => { settings.fontSize = b.dataset.size; save(); });
    });
    panel.querySelectorAll('.a11y-toggle').forEach(b => {
      b.addEventListener('click', () => {
        const key = b.dataset.toggle;
        settings[key] = !settings[key];
        save();
      });
    });
    panel.querySelector('.a11y-reset').addEventListener('click', () => {
      settings = Object.assign({}, defaults);
      save();
    });
  }

  let isOpen = false;
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (isOpen && !panel.contains(e.target) && !btn.contains(e.target)) {
      isOpen = false;
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  document.body.appendChild(panel);
  document.body.appendChild(btn);
  applySettings();
  renderPanel();
})();

/* ─── SCROLL REVEAL ─── */
const revealSelectors = [
  '.card', '.feature-card', '.post-card',
  '.post-list article', '.section-heading',
  '.hero-card', '.quote-box', '.notice',
  '.signup-form', '.contact-form', '.valor-item',
];

const revealEls = document.querySelectorAll(revealSelectors.join(', '));

if ('IntersectionObserver' in window && revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement?.children ?? []);
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 75, 300);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
}
