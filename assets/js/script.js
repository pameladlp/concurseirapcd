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
