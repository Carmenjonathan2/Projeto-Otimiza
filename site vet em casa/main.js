// All data is now loaded from data_store.js and whatsapp_link.js as global variables


document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderContent();
    setupInteractions();
    setupScrollReveal();
});

function renderContent() {

    const benefitsContainer = document.getElementById('benefits-container');
    if (benefitsContainer) {
        benefitsContainer.innerHTML = benefits.map(b => `
            <div class="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all group reveal">
                <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                    <i data-lucide="${b.icon}"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3">${b.title}</h3>
                <p class="text-slate-600 leading-relaxed">${b.desc}</p>
            </div>
        `).join('');
    }


    const servicesContainer = document.getElementById('services-list');
    if (servicesContainer) {
        servicesContainer.innerHTML = services.map(s => `
            <div class="flex gap-4 reveal">
                <div class="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                    <i data-lucide="${s.icon}"></i>
                </div>
                <div>
                    <h4 class="text-lg font-bold text-slate-900">${s.title}</h4>
                    <p class="text-slate-600 text-sm mt-1">${s.desc}</p>
                </div>
            </div>
        `).join('');
    }

    // NOVA LÓGICA PARA ÁREA DE COBERTURA
    const coverageContainer = document.getElementById('coverage-container');
    if (coverageContainer) {
        coverageContainer.innerHTML = coverageAreas.map(area => `
            <div class="bg-white p-6 rounded-2xl border border-slate-100 flex items-start gap-4 hover:border-purple-200 transition-colors reveal">
                <div class="bg-purple-50 p-3 rounded-full text-purple-600 flex-shrink-0">
                    <i data-lucide="${area.icon}"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-slate-900">${area.region}</h3>
                    <p class="text-slate-600 text-sm mt-1">${area.description}</p>
                </div>
            </div>
        `).join('');
    }

    const testimonialsContainer = document.getElementById('testimonials-container');
    if (testimonialsContainer) {
        testimonialsContainer.innerHTML = testimonials.map(t => `
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 transition-colors reveal">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-xl">
                        ${t.initial}
                    </div>
                    <div>
                        <p class="font-bold text-slate-900">${t.name}</p>
                        <p class="text-xs text-slate-500 uppercase tracking-wide">${t.role}</p>
                    </div>
                </div>
                <p class="text-slate-600 italic">"${t.text}"</p>
                <div class="mt-4 flex text-yellow-400">
                    ${Array(5).fill('<i data-lucide="star" class="w-4 h-4 fill-current"></i>').join('')}
                </div>
            </div>
        `).join('');
    }


    lucide.createIcons();
}

function setupInteractions() {

    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }


    // Link tracking for UTMs on direct WhatsApp links
    const utmTracking = typeof getUTMParams === 'function' ? getUTMParams() : "";
    if (utmTracking) {
        document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
            let href = link.getAttribute('href');
            const url = new URL(href);
            let text = url.searchParams.get('text') || "Olá! Vim pelo site.";

            // Append UTM info to the text if not already present
            if (!text.includes('*Rastreamento UTM:*')) {
                text += utmTracking;
                url.searchParams.set('text', text);
                link.setAttribute('href', url.toString());
            }
        });
    }

    const form = document.getElementById('schedule-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Solicitar Atendimento';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Redirecionando...';
            }

            const clientName = document.getElementById('clientName')?.value.trim() || "";
            const petName = document.getElementById('petName')?.value.trim() || "";
            const petType = document.getElementById('petType')?.value.trim() || "";
            const address = document.getElementById('address')?.value.trim() || "";
            const reason = document.getElementById('reason')?.value.trim() || "";
            const urgencyEl = document.querySelector('input[name="urgency"]:checked');
            const urgency = urgencyEl ? urgencyEl.value : "Baixa";

            const formData = { clientName, petName, petType, address, reason, urgency };

            // ==========================================
            // COLE A URL DO SEU GOOGLE APPS SCRIPT AQUI
            // ==========================================
            const scriptURL = 'https://script.google.com/macros/s/AKfycbxjtu3z1Uj_2PFI3nvc5GzGFTyeJ6ARq907Q_hdGP3fV8vqHa6uZ1bDrwKJr708AYM/exec';

            if (scriptURL) {
                try {
                    await fetch(scriptURL, {
                        method: 'POST',
                        mode: 'no-cors', // Importante para evitar erros de CORS no navegador
                        headers: {
                            'Content-Type': 'text/plain;charset=utf-8' // Disfarça o JSON para evitar pré-flight request
                        },
                        body: JSON.stringify(formData)
                    });
                } catch (error) {
                    console.error('Erro ao enviar dados para a planilha:', error);
                }
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }

            const link = generateWhatsappLink(formData);

            // Redirection using location.href is most reliable for mobile and pop-up blockers
            window.location.href = link;
        });
    }
}


function setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ======================================
// Service Card Accordion Functionality
// ======================================

window.toggleService = function (button) {
    const serviceCard = button.closest('.service-card');
    const allServiceCards = document.querySelectorAll('.service-card');

    // Check if the clicked card is already active
    const isActive = serviceCard.classList.contains('active');

    // Close all cards
    allServiceCards.forEach(card => {
        card.classList.remove('active');
    });

    // If it wasn't active, open the clicked card
    if (!isActive) {
        serviceCard.classList.add('active');
    }
};

// Optional: Close accordion when clicking outside
document.addEventListener('click', function (event) {
    const servicesContainer = document.querySelector('#servicos .max-w-4xl');

    if (servicesContainer && !servicesContainer.contains(event.target)) {
        const allServiceCards = document.querySelectorAll('.service-card');
        allServiceCards.forEach(card => {
            card.classList.remove('active');
        });
    }
});

