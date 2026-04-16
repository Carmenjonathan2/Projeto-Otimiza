/**
 * Bloqueador de Checkout para Produtos de Prescrição
 * Impede que produtos com a tag "prescrição" sejam finalizados no checkout
 * Força o cliente a comprar via WhatsApp
 */

(function () {
    'use strict';

    // Função para verificar se o cliente é veterinário
    function isVeterinarian() {
        // Verifica se existe o objeto customer do Shopify
        if (typeof window.Shopify !== 'undefined' && window.Shopify.customer) {
            const customer = window.Shopify.customer;
            if (customer && customer.tags) {
                return customer.tags.some(tag => tag.toLowerCase() === 'veterinario');
            }
        }

        // Alternativa: verificar via DOM se há indicação de veterinário
        const vetBadge = document.querySelector('.vet-badge');
        const vetPortal = document.querySelector('.vet-portal-wrapper');
        return (vetBadge !== null || vetPortal !== null);
    }

    // Função para verificar se há produtos de prescrição no carrinho
    function checkPrescriptionProducts() {
        // Se é veterinário, não precisa verificar - pode comprar tudo
        if (isVeterinarian()) {
            return Promise.resolve({
                hasPrescription: false, // Finge que não tem prescrição
                prescriptionItems: [],
                totalItems: 0,
                isVeterinarian: true
            });
        }

        return fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
                const prescriptionItems = cart.items.filter(item => {
                    // Verifica se o produto tem a tag prescrição (em várias variações)
                    return item.product_tags && (
                        item.product_tags.includes('prescricao') ||
                        item.product_tags.includes('prescrição') ||
                        item.product_tags.includes('Prescrição') ||
                        item.product_tags.includes('prescriçao')
                    );
                });

                return {
                    hasPrescription: prescriptionItems.length > 0,
                    prescriptionItems: prescriptionItems,
                    totalItems: cart.items.length,
                    isVeterinarian: false
                };
            })
            .catch(error => {
                console.error('Erro ao verificar produtos de prescrição:', error);
                return {
                    hasPrescription: false,
                    prescriptionItems: [],
                    totalItems: 0,
                    isVeterinarian: isVeterinarian()
                };
            });
    }

    // Bloqueia o botão de checkout
    function blockCheckoutButton() {
        checkPrescriptionProducts().then(result => {
            if (result.hasPrescription) {
                // Bloqueia todos os botões de checkout
                const checkoutButtons = document.querySelectorAll(
                    'button[name="checkout"], ' +
                    'a[href*="/checkout"], ' +
                    '.cart__checkout-button, ' +
                    '#CartDrawer-Checkout, ' +
                    'button[type="submit"][name="checkout"]'
                );

                checkoutButtons.forEach(button => {
                    // Desabilita o botão
                    button.disabled = true;
                    button.setAttribute('aria-disabled', 'true');

                    // Adiciona estilo visual de desabilitado
                    button.style.opacity = '0.5';
                    button.style.cursor = 'not-allowed';

                    // Remove event listeners de clique
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);

                    // Adiciona evento de clique que mostra alerta
                    newButton.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        const productNames = result.prescriptionItems
                            .map(item => item.product_title)
                            .join(', ');

                        alert(
                            '⚠️ SEU CARRINHO CONTÉM PRODUTOS SOB PRESCRIÇÃO\n\n' +
                            'Produtos: ' + productNames + '\n\n' +
                            'Estes produtos requerem prescrição veterinária e não podem ' +
                            'ser comprados diretamente pelo site.\n\n' +
                            'Por favor, entre em contato conosco pelo WhatsApp para finalizar sua compra.\n\n' +
                            '📱 WhatsApp: (31) 98793-6822'
                        );

                        return false;
                    }, true);
                });

                // Adiciona aviso visual no carrinho
                addPrescriptionWarning(result.prescriptionItems);
            }
        });
    }

    // Adiciona aviso visual de prescrição no carrinho
    function addPrescriptionWarning(prescriptionItems) {
        // Remove avisos anteriores
        const existingWarnings = document.querySelectorAll('.prescription-warning');
        existingWarnings.forEach(warning => warning.remove());

        const productNames = prescriptionItems.map(item => item.product_title).join(', ');

        // Cria o aviso
        const warning = document.createElement('div');
        warning.className = 'prescription-warning';
        warning.style.cssText = `
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      font-size: 0.9rem;
      line-height: 1.5;
    `;

        warning.innerHTML = `
      <div style="display: flex; align-items: start; gap: 0.75rem;">
        <span style="font-size: 1.5rem; flex-shrink: 0;">⚠️</span>
        <div>
          <strong style="display: block; margin-bottom: 0.5rem; color: #856404;">
            Atenção: Produtos sob Prescrição
          </strong>
          <p style="margin: 0 0 0.5rem 0; color: #856404;">
            Seu carrinho contém: <strong>${productNames}</strong>
          </p>
          <p style="margin: 0 0 0.75rem 0; color: #856404;">
            Estes produtos necessitam de prescrição veterinária e devem ser adquiridos via WhatsApp.
          </p>
          <a href="https://wa.me/5531987936822?text=Olá! Gostaria de comprar produtos sob prescrição do meu carrinho" 
             target="_blank"
             style="
               display: inline-block;
               background-color: #25D366;
               color: white;
               padding: 0.5rem 1rem;
               border-radius: 5px;
               text-decoration: none;
               font-weight: bold;
             ">
            🩺 Finalizar Compra via WhatsApp
          </a>
        </div>
      </div>
    `;

        // Adiciona o aviso antes dos botões de checkout
        const checkoutContainer = document.querySelector('.cart__ctas') ||
            document.querySelector('.cart-drawer__footer') ||
            document.querySelector('#CartDrawer-Checkout')?.parentElement;

        if (checkoutContainer) {
            checkoutContainer.insertBefore(warning, checkoutContainer.firstChild);
        }
    }

    // Monitora mudanças no carrinho
    function observeCartChanges() {
        // Observer para mudanças no DOM do carrinho
        const observer = new MutationObserver(function () {
            blockCheckoutButton();
        });

        // Observa o carrinho drawer e a página do carrinho
        const cartDrawer = document.querySelector('cart-drawer');
        const cartItems = document.querySelector('cart-items');

        if (cartDrawer) {
            observer.observe(cartDrawer, {
                childList: true,
                subtree: true
            });
        }

        if (cartItems) {
            observer.observe(cartItems, {
                childList: true,
                subtree: true
            });
        }

        // Também monitora eventos personalizados do carrinho
        document.addEventListener('cart:updated', blockCheckoutButton);
        document.addEventListener('cart:refresh', blockCheckoutButton);
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            blockCheckoutButton();
            observeCartChanges();
        });
    } else {
        blockCheckoutButton();
        observeCartChanges();
    }

    // Re-executa quando o carrinho é aberto
    document.addEventListener('click', function (e) {
        // Se clicou num elemento que abre o carrinho
        if (e.target.closest('[href*="cart"]') ||
            e.target.closest('.cart-icon-bubble') ||
            e.target.closest('[data-cart-drawer]')) {
            setTimeout(blockCheckoutButton, 500);
        }
    });

    // Intercepta tentativas de ir direto para o checkout via URL
    const originalPushState = history.pushState;
    history.pushState = function () {
        const result = originalPushState.apply(this, arguments);
        const url = arguments[2];

        if (url && url.includes('/checkout')) {
            checkPrescriptionProducts().then(result => {
                if (result.hasPrescription) {
                    alert(
                        '⚠️ NÃO É POSSÍVEL FINALIZAR A COMPRA\n\n' +
                        'Seu carrinho contém produtos sob prescrição que devem ser ' +
                        'adquiridos via WhatsApp.\n\n' +
                        'Entre em contato: (31) 98793-6822'
                    );
                    history.back();
                }
            });
        }

        return result;
    };

})();
