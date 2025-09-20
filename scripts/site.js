(function(){
  const state = { modalStack: [], lastFocused: null };

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initModals();
    initNewsletterForms();
    enhanceContactLinks();
  });

  function initNav(){
    const toggle = document.getElementById('mobile-menu');
    const menu = document.getElementById('primary-navigation');
    if(toggle && menu){
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        menu.classList.toggle('active');
      });
    }
    const pageKey = document.body.dataset.page;
    if(pageKey){
      document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
        const active = link.dataset.nav === pageKey;
        link.classList.toggle('active', active);
      });
    }
  }

  function initModals(){
    document.querySelectorAll('[data-modal-trigger]').forEach(btn => {
      const targetId = btn.getAttribute('data-modal-trigger');
      const modal = document.getElementById(targetId);
      if(!modal) return;
      btn.addEventListener('click', () => openModal(modal, btn));
    });
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if(modal) closeModal(modal);
      });
    });
    document.addEventListener('click', (ev) => {
      const target = ev.target;
      if(target instanceof Element && target.classList.contains('modal')){
        closeModal(target);
      }
    });
    document.addEventListener('keydown', (ev) => {
      if(ev.key === 'Escape' && state.modalStack.length){
        closeModal(state.modalStack[state.modalStack.length - 1]);
      }
    });
  }

  function openModal(modal, trigger){
    if(modal.hidden === false) return;
    state.lastFocused = trigger || document.activeElement;
    modal.hidden = false;
    modal.classList.add('open');
    state.modalStack.push(modal);
    trapFocus(modal);
  }

  function closeModal(modal){
    modal.hidden = true;
    modal.classList.remove('open');
    state.modalStack = state.modalStack.filter(m => m !== modal);
    if(state.modalStack.length === 0 && state.lastFocused instanceof HTMLElement){
      state.lastFocused.focus();
      state.lastFocused = null;
    }
  }

  function trapFocus(modal){
    const focusable = modal.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if(!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    if(modal.__trapHandler){
      modal.removeEventListener('keydown', modal.__trapHandler);
    }
    modal.__trapHandler = function(ev){
      if(ev.key === 'Escape'){
        closeModal(modal);
        return;
      }
      if(ev.key !== 'Tab') return;
      if(ev.shiftKey && document.activeElement === first){
        ev.preventDefault();
        last.focus();
      } else if(!ev.shiftKey && document.activeElement === last){
        ev.preventDefault();
        first.focus();
      }
    };
    modal.addEventListener('keydown', modal.__trapHandler);
  }
  function initNewsletterForms(){
    document.querySelectorAll('form[id$="newsletter"]').forEach(form => {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if(!input) return;
        const email = input.value.trim();
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
          setStatus(form, 'メールアドレスを確認してください。', true);
          return;
        }
        const list = JSON.parse(localStorage.getItem('careerHorizon:newsletter') || '[]');
        if(!list.includes(email)){
          list.push(email);
          localStorage.setItem('careerHorizon:newsletter', JSON.stringify(list));
        }
        setStatus(form, '登録しました。最新レポートをお送りします。', false);
        input.value = '';
      });
    });
  }

  function setStatus(form, message, isError){
    const status = form.nextElementSibling && form.nextElementSibling.classList.contains('small-text') ? form.nextElementSibling : null;
    if(status){
      status.textContent = message;
      status.classList.toggle('error', Boolean(isError));
    }
  }

  function enhanceContactLinks(){
    const link = document.getElementById('contact-link');
    if(link){
      link.setAttribute('href', 'mailto:community@career-horizon.example');
    }
  }

  window.CareerSite = { openModal, closeModal };
})();



