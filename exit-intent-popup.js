/**
 * EXIT INTENT POPUP - OTIMIZA FARMAVET
 * 
 * Sistema inteligente de retenção que detecta quando o usuário
 * está prestes a abandonar o site e oferece incentivos personalizados.
 * 
 * GATILHOS:
 * 1. Exit Intent - Mouse saindo da janela (desktop)
 * 2. Back Button - Tentativa de voltar (mobile)
 * 3. Inatividade - 30 segundos sem interação
 * 
 * FUNCIONALIDADES:
 * - Mostra apenas 1x por sessão (não irrita o usuário)
 * - Oferece cupom de desconto
 * - CTAs direcionados para categorias principais
 * - Totalmente responsivo
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÕES
  // ============================================
  const CONFIG = {
    // Mostrar popup apenas se carrinho estiver vazio
    showOnlyIfCartEmpty: true,
    
    // Cooldown: mostrar apenas 1x a cada X horas
    cooldownHours: 24,
    
    // Delay mínimo na página antes de ativar (segundos)
    minTimeOnPage: 5,
    
    // Tempo de inatividade para trigger (segundos)
    inactivityTimeout: 30,
    
    // Cupom de desconto a oferecer
    couponCode: 'FIQUECONOSCO10',
    discountPercent: 10,
    
    // Coleções para CTAs
    collections: {
      dogs: '/collections/racoes-secas-caes',
      cats: '/collections/racoes-secas-gatos',
      deals: '/collections/mimostudoabaixode20',
      bestsellers: '/collections/mais-vendidos-no-mes'
    }
  };

  // ============================================
  // ESTADO DA APLICAÇÃO
  // ============================================
  let state = {
    popupShown: false,
    timeOnPage: 0,
    inactivityTimer: null,
    exitIntentEnabled: false
  };

  // ============================================
  // VERIFICAÇÕES INICIAIS
  // ============================================
  
  /**
   * Verifica se o popup já foi mostrado recentemente
   */
  function wasRecentlyShown() {
    const lastShown = localStorage.getItem('exitPopupLastShown');
    if (!lastShown) return false;
    
    const hoursSinceLastShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
    return hoursSinceLastShown < CONFIG.cooldownHours;
  }

  /**
   * Verifica se o carrinho está vazio
   */
  function isCartEmpty() {
    // Shopify: verifica objeto global do carrinho
    if (typeof window.Shopify !== 'undefined' && window.Shopify.cart) {
      return window.Shopify.cart.item_count === 0;
    }
    
    // Fallback: verifica via fetch
    return fetch('/cart.js')
      .then(res => res.json())
      .then(cart => cart.item_count === 0)
      .catch(() => true); // Em caso de erro, assume vazio
  }

  /**
   * Verifica se deve mostrar o popup
   */
  async function shouldShowPopup() {
    if (state.popupShown) return false;
    if (wasRecentlyShown()) return false;
    if (state.timeOnPage < CONFIG.minTimeOnPage) return false;
    
    if (CONFIG.showOnlyIfCartEmpty) {
      const isEmpty = await isCartEmpty();
      if (!isEmpty) return false;
    }
    
    return true;
  }

  // ============================================
  // CRIAÇÃO DO POPUP
  // ============================================
  
  /**
   * Cria o HTML do popup
   */
  function createPopupHTML() {
    return `
      <div id="exit-intent-overlay" class="exit-popup-overlay">
        <div class="exit-popup-container">
          <button class="exit-popup-close" aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div class="exit-popup-content">
            <div class="exit-popup-icon">🎁</div>
            
            <h2 class="exit-popup-title">Espera! Não vá embora ainda...</h2>
            
            <p class="exit-popup-subtitle">
              Aproveite <strong>${CONFIG.discountPercent}% de desconto</strong> na sua primeira compra!
            </p>
            
            <div class="exit-popup-coupon">
              <div class="coupon-label">Use o cupom:</div>
              <div class="coupon-code" id="exit-coupon-code">${CONFIG.couponCode}</div>
              <button class="coupon-copy-btn" id="exit-copy-coupon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copiar
              </button>
            </div>
            
            <div class="exit-popup-divider">
              <span>ou escolha por onde começar</span>
            </div>
            
            <div class="exit-popup-ctas">
              <a href="${CONFIG.collections.dogs}" class="exit-cta exit-cta-primary">
                <span class="exit-cta-icon">🐕</span>
                <span class="exit-cta-text">Rações para Cães</span>
              </a>
              
              <a href="${CONFIG.collections.cats}" class="exit-cta exit-cta-primary">
                <span class="exit-cta-icon">🐱</span>
                <span class="exit-cta-text">Rações para Gatos</span>
              </a>
              
              <div class="exit-cta-grid">
                <a href="${CONFIG.collections.deals}" class="exit-cta exit-cta-secondary">
                  <span class="exit-cta-icon">💰</span>
                  <span class="exit-cta-text">Abaixo de R$20</span>
                </a>
                
                <a href="${CONFIG.collections.bestsellers}" class="exit-cta exit-cta-secondary">
                  <span class="exit-cta-icon">⭐</span>
                  <span class="exit-cta-text">Mais Vendidos</span>
                </a>
              </div>
            </div>
            
            <p class="exit-popup-footer">
              Válido apenas para esta sessão. Não perca! ⏰
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Injeta o popup no DOM
   */
  function injectPopup() {
    const popupHTML = createPopupHTML();
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Adiciona event listeners
    setupPopupEvents();
    
    // Mostra o popup com animação
    setTimeout(() => {
      document.getElementById('exit-intent-overlay').classList.add('active');
    }, 50);
  }

  /**
   * Configura eventos do popup
   */
  function setupPopupEvents() {
    const overlay = document.getElementById('exit-intent-overlay');
    const closeBtn = overlay.querySelector('.exit-popup-close');
    const copyBtn = document.getElementById('exit-copy-coupon');
    
    // Fechar ao clicar no X
    closeBtn.addEventListener('click', closePopup);
    
    // Fechar ao clicar fora do popup
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePopup();
      }
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePopup();
      }
    });
    
    // Copiar cupom
    copyBtn.addEventListener('click', copyCoupon);
    
    // Track clicks nos CTAs
    overlay.querySelectorAll('.exit-cta').forEach(cta => {
      cta.addEventListener('click', () => {
        trackEvent('exit_popup_cta_click', {
          cta: cta.querySelector('.exit-cta-text').textContent
        });
      });
    });
  }

  /**
   * Fecha o popup
   */
  function closePopup() {
    const overlay = document.getElementById('exit-intent-overlay');
    overlay.classList.remove('active');
    
    setTimeout(() => {
      overlay.remove();
    }, 300);
    
    trackEvent('exit_popup_closed');
  }

  /**
   * Copia o cupom para a área de transferência
   */
  function copyCoupon() {
    const couponCode = CONFIG.couponCode;
    const copyBtn = document.getElementById('exit-copy-coupon');
    
    navigator.clipboard.writeText(couponCode).then(() => {
      // Feedback visual
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copiado!
      `;
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copiar
        `;
        copyBtn.classList.remove('copied');
      }, 2000);
      
      trackEvent('exit_popup_coupon_copied');
    });
  }

  // ============================================
  // GATILHOS DE ATIVAÇÃO
  // ============================================
  
  /**
   * Mostra o popup
   */
  async function showPopup() {
    const should = await shouldShowPopup();
    if (!should) return;
    
    state.popupShown = true;
    localStorage.setItem('exitPopupLastShown', Date.now().toString());
    
    injectPopup();
    trackEvent('exit_popup_shown');
  }

  /**
   * GATILHO 1: Exit Intent (mouse saindo da janela)
   */
  function setupExitIntent() {
    let exitIntentFired = false;
    
    document.addEventListener('mouseleave', async (e) => {
      // Detecta apenas quando o mouse sai pelo topo
      if (e.clientY < 0 && !exitIntentFired) {
        exitIntentFired = true;
        await showPopup();
        trackEvent('exit_popup_trigger', { trigger: 'exit_intent' });
      }
    });
  }

  /**
   * GATILHO 2: Back Button (mobile)
   */
  function setupBackButtonDetection() {
    // Adiciona um estado no histórico
    history.pushState({ exitPopup: true }, '');
    
    window.addEventListener('popstate', async (e) => {
      if (e.state && e.state.exitPopup) {
        await showPopup();
        trackEvent('exit_popup_trigger', { trigger: 'back_button' });
        
        // Restaura o estado
        history.pushState({ exitPopup: true }, '');
      }
    });
  }

  /**
   * GATILHO 3: Inatividade
   */
  function setupInactivityDetection() {
    function resetInactivityTimer() {
      clearTimeout(state.inactivityTimer);
      
      state.inactivityTimer = setTimeout(async () => {
        await showPopup();
        trackEvent('exit_popup_trigger', { trigger: 'inactivity' });
      }, CONFIG.inactivityTimeout * 1000);
    }
    
    // Eventos que resetam o timer
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Inicia o timer
    resetInactivityTimer();
  }

  // ============================================
  // ANALYTICS
  // ============================================
  
  /**
   * Envia evento para Google Analytics
   */
  function trackEvent(eventName, params = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'exit_popup',
        ...params
      });
    }
    
    // Google Analytics Universal
    if (typeof ga !== 'undefined') {
      ga('send', 'event', 'exit_popup', eventName, JSON.stringify(params));
    }
    
    // Console log para debug
    console.log('[Exit Popup]', eventName, params);
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  /**
   * Contador de tempo na página
   */
  function startTimeCounter() {
    setInterval(() => {
      state.timeOnPage++;
      
      // Habilita exit intent após tempo mínimo
      if (state.timeOnPage >= CONFIG.minTimeOnPage && !state.exitIntentEnabled) {
        state.exitIntentEnabled = true;
        setupExitIntent();
      }
    }, 1000);
  }

  /**
   * Inicializa o sistema
   */
  function init() {
    // Verifica se já foi mostrado recentemente
    if (wasRecentlyShown()) {
      console.log('[Exit Popup] Cooldown ativo. Não será mostrado.');
      return;
    }
    
    // Inicia contador de tempo
    startTimeCounter();
    
    // Configura gatilhos
    setupBackButtonDetection();
    setupInactivityDetection();
    
    console.log('[Exit Popup] Sistema ativado.');
  }

  // Aguarda DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
