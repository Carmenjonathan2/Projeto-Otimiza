/**
 * B2B EXIT INTENT POPUP - PORTAL VETERINÁRIO
 * Versão premium focada em conversão para veterinários aprovados.
 */

(function() {
    'use strict';

    const CONFIG = {
        collectionHandle: 'uso-veterinario',
        maxProducts: 3,
        cooldownHours: 12, // Menor cooldown para ofertas profissionais
        minTimeOnPage: 3,
        interestText: 'Ganhe 5% em desconto pagando no PIX ou boleto!'
    };

    let state = {
        popupShown: false,
        timeOnPage: 0,
        exitIntentFireed: false
    };

    function isVeterinaryPortal() {
        return window.location.pathname.includes('/pages/portal-veterinario');
    }

    function wasRecentlyShown() {
        const lastShown = localStorage.getItem('exitPopupVetLastShown');
        if (!lastShown) return false;
        const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
        return hoursSince < CONFIG.cooldownHours;
    }

    async function getProducts() {
        try {
            const response = await fetch(`/collections/${CONFIG.collectionHandle}/products.json?limit=${CONFIG.maxProducts}`);
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Erro ao buscar produtos B2B:', error);
            return [];
        }
    }

    function formatMoney(cents) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    }

    function createPopupHTML(products) {
        const productGridHTML = products.map(p => {
            const price = p.variants[0].price;
            const cashPrice = price * 0.95;
            const inst3x = price / 3;
            const inst12x = (price * 1.15) / 12;

            return `
                <div class="vet-popup-product-card">
                    <div class="vet-card-badge">Destaque</div>
                    <div class="vet-card-image">
                        <img src="${p.images[0]?.src || ''}" alt="${p.title}">
                    </div>
                    <div class="vet-card-info">
                        <h3>${p.title}</h3>
                        <span class="vet-price-original">${formatMoney(price)}</span>
                        <div class="vet-price-cash">
                            <span class="val">${formatMoney(cashPrice)}</span>
                            <span class="lbl">à vista</span>
                        </div>
                        <p class="vet-installments">
                            com desconto ou <strong>3x de ${formatMoney(inst3x)}</strong> Sem juros ou <strong>12x de ${formatMoney(inst12x)}</strong> com juros
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div id="exit-intent-vet-overlay" class="exit-popup-vet-overlay">
                <div class="exit-popup-vet-container">
                    <button class="exit-popup-vet-close" aria-label="Fechar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    
                    <div class="exit-popup-vet-header">
                        <h2>Não perca essa oportunidade!</h2>
                        <p>${CONFIG.interestText}</p>
                    </div>

                    <div class="exit-popup-vet-body">
                        <div class="exit-popup-vet-grid">
                            ${productGridHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function showPopup() {
        if (state.popupShown || wasRecentlyShown()) return;
        
        const products = await getProducts();
        if (products.length === 0) return;

        state.popupShown = true;
        localStorage.setItem('exitPopupVetLastShown', Date.now().toString());

        document.body.insertAdjacentHTML('beforeend', createPopupHTML(products));
        
        const overlay = document.getElementById('exit-intent-vet-overlay');
        const closeBtn = overlay.querySelector('.exit-popup-vet-close');

        setTimeout(() => overlay.classList.add('active'), 50);

        closeBtn.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 400);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) closeBtn.onclick();
        };
    }

    // Trigger: Exit Intent
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY < 0 && !state.exitIntentFireed && state.timeOnPage >= CONFIG.minTimeOnPage) {
            state.exitIntentFireed = true;
            showPopup();
        }
    });

    // Trigger: Time On Page
    setInterval(() => { state.timeOnPage++; }, 1000);

    // Só ativa no Portal ou se for Veterinário (detectado via global window.Shopify)
    const isVet = window.Shopify?.customer?.tags?.some(t => t.toLowerCase() === 'veterinario');
    
    if (isVeterinaryPortal() || isVet) {
        console.log('[Vet Exit Popup] Ativado.');
    } else {
        // Desativado para público comum
    }

})();
