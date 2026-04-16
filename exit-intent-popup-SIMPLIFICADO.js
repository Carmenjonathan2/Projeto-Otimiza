/**
 * EXIT INTENT POPUP - OTIMIZA FARMAVET
 * Versão Simplificada e Testada
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURAÇÕES
    // ============================================
    var CONFIG = {
        showOnlyIfCartEmpty: false, // Desativado para testes
        cooldownHours: 24,
        minTimeOnPage: 5,
        inactivityTimeout: 30,
        couponCode: 'FIQUECONOSCO10',
        discountPercent: 10,
        collections: {
            dogs: '/collections/racoes-secas-caes',
            cats: '/collections/racoes-secas-gatos',
            deals: '/collections/mimostudoabaixode20',
            bestsellers: '/collections/mais-vendidos-no-mes'
        }
    };

    // ============================================
    // ESTADO
    // ============================================
    var state = {
        popupShown: false,
        timeOnPage: 0,
        exitIntentEnabled: false
    };

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    function wasRecentlyShown() {
        try {
            var lastShown = localStorage.getItem('exitPopupLastShown');
            if (!lastShown) return false;

            var hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
            return hoursSince < CONFIG.cooldownHours;
        } catch (e) {
            console.log('[Exit Popup] localStorage não disponível');
            return false;
        }
    }

    function shouldShowPopup() {
        if (state.popupShown) return false;
        if (wasRecentlyShown()) return false;
        if (state.timeOnPage < CONFIG.minTimeOnPage) return false;
        return true;
    }

    // ============================================
    // CRIAÇÃO DO POPUP
    // ============================================

    function createPopupHTML() {
        return '\
      <div id="exit-intent-overlay" class="exit-popup-overlay">\
        <div class="exit-popup-container">\
          <button class="exit-popup-close" aria-label="Fechar">\
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
              <line x1="18" y1="6" x2="6" y2="18"></line>\
              <line x1="6" y1="6" x2="18" y2="18"></line>\
            </svg>\
          </button>\
          \
          <div class="exit-popup-content">\
            <div class="exit-popup-icon">🎁</div>\
            \
            <h2 class="exit-popup-title">Espera! Não vá embora ainda...</h2>\
            \
            <p class="exit-popup-subtitle">\
              Aproveite <strong>' + CONFIG.discountPercent + '% de desconto</strong> na sua primeira compra!\
            </p>\
            \
            <div class="exit-popup-coupon">\
              <div class="coupon-label">Use o cupom:</div>\
              <div class="coupon-code" id="exit-coupon-code">' + CONFIG.couponCode + '</div>\
              <button class="coupon-copy-btn" id="exit-copy-coupon">\
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>\
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>\
                </svg>\
                Copiar\
              </button>\
            </div>\
            \
            <div class="exit-popup-divider">\
              <span>ou escolha por onde começar</span>\
            </div>\
            \
            <div class="exit-popup-ctas">\
              <a href="' + CONFIG.collections.dogs + '" class="exit-cta exit-cta-primary">\
                <span class="exit-cta-icon">🐕</span>\
                <span class="exit-cta-text">Rações para Cães</span>\
              </a>\
              \
              <a href="' + CONFIG.collections.cats + '" class="exit-cta exit-cta-primary">\
                <span class="exit-cta-icon">🐱</span>\
                <span class="exit-cta-text">Rações para Gatos</span>\
              </a>\
              \
              <div class="exit-cta-grid">\
                <a href="' + CONFIG.collections.deals + '" class="exit-cta exit-cta-secondary">\
                  <span class="exit-cta-icon">💰</span>\
                  <span class="exit-cta-text">Abaixo de<br>R$20</span>\
                </a>\
                \
                <a href="' + CONFIG.collections.bestsellers + '" class="exit-cta exit-cta-secondary">\
                  <span class="exit-cta-icon">⭐</span>\
                  <span class="exit-cta-text">Mais<br>Vendidos</span>\
                </a>\
              </div>\
            </div>\
            \
            <p class="exit-popup-footer">\
              Válido apenas para esta sessão. Não perca! ⏰\
            </p>\
          </div>\
        </div>\
      </div>\
    ';
    }

    function injectPopup() {
        document.body.insertAdjacentHTML('beforeend', createPopupHTML());
        setupPopupEvents();

        setTimeout(function () {
            document.getElementById('exit-intent-overlay').classList.add('active');
        }, 50);
    }

    function setupPopupEvents() {
        var overlay = document.getElementById('exit-intent-overlay');
        var closeBtn = overlay.querySelector('.exit-popup-close');
        var copyBtn = document.getElementById('exit-copy-coupon');

        closeBtn.addEventListener('click', closePopup);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                closePopup();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closePopup();
            }
        });

        copyBtn.addEventListener('click', copyCoupon);
    }

    function closePopup() {
        var overlay = document.getElementById('exit-intent-overlay');
        overlay.classList.remove('active');

        setTimeout(function () {
            overlay.remove();
        }, 300);

        console.log('[Exit Popup] Popup fechado');
    }

    function copyCoupon() {
        var couponCode = CONFIG.couponCode;
        var copyBtn = document.getElementById('exit-copy-coupon');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(couponCode).then(function () {
                copyBtn.innerHTML = '\
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
            <polyline points="20 6 9 17 4 12"></polyline>\
          </svg>\
          Copiado!\
        ';
                copyBtn.classList.add('copied');

                setTimeout(function () {
                    copyBtn.innerHTML = '\
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>\
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>\
            </svg>\
            Copiar\
          ';
                    copyBtn.classList.remove('copied');
                }, 2000);

                console.log('[Exit Popup] Cupom copiado');
            });
        }
    }

    // ============================================
    // GATILHOS
    // ============================================

    function showPopup() {
        if (!shouldShowPopup()) return;

        state.popupShown = true;

        try {
            localStorage.setItem('exitPopupLastShown', Date.now().toString());
        } catch (e) {
            console.log('[Exit Popup] Não foi possível salvar no localStorage');
        }

        injectPopup();
        console.log('[Exit Popup] Popup exibido');
    }

    function setupExitIntent() {
        var exitIntentFired = false;

        document.addEventListener('mouseleave', function (e) {
            if (e.clientY < 0 && !exitIntentFired) {
                exitIntentFired = true;
                showPopup();
                console.log('[Exit Popup] Trigger: Exit Intent');
            }
        });
    }

    function setupBackButtonDetection() {
        history.pushState({ exitPopup: true }, '');

        window.addEventListener('popstate', function (e) {
            if (e.state && e.state.exitPopup) {
                showPopup();
                console.log('[Exit Popup] Trigger: Back Button');
                history.pushState({ exitPopup: true }, '');
            }
        });
    }

    function setupInactivityDetection() {
        var inactivityTimer;

        function resetTimer() {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(function () {
                showPopup();
                console.log('[Exit Popup] Trigger: Inatividade');
            }, CONFIG.inactivityTimeout * 1000);
        }

        var events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(function (event) {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer();
    }

    // ============================================
    // INICIALIZAÇÃO
    // ============================================

    function startTimeCounter() {
        setInterval(function () {
            state.timeOnPage++;

            if (state.timeOnPage >= CONFIG.minTimeOnPage && !state.exitIntentEnabled) {
                state.exitIntentEnabled = true;
                setupExitIntent();
                console.log('[Exit Popup] Exit Intent ativado');
            }
        }, 1000);
    }

    function init() {
        if (wasRecentlyShown()) {
            console.log('[Exit Popup] Cooldown ativo');
            return;
        }

        startTimeCounter();
        setupBackButtonDetection();
        setupInactivityDetection();

        console.log('[Exit Popup] Sistema ativado');
    }

    // Aguarda DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
