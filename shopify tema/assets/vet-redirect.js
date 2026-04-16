/**
 * Redirecionamento Automático para Portal Veterinário
 * Quando um cliente com tag "veterinario" faz login, é automaticamente
 * redirecionado para o portal profissional
 */

(function () {
    'use strict';

    // Função para verificar se é veterinário
    function isVeterinarian() {
        if (typeof window.Shopify !== 'undefined' && window.Shopify.customer) {
            const customer = window.Shopify.customer;
            if (customer && customer.tags) {
                return customer.tags.some(tag => tag.toLowerCase() === 'veterinario');
            }
        }
        return false;
    }

    // Função para redirecionar veterinário
    function redirectVeterinarian() {
        // Verifica se é veterinário
        if (!isVeterinarian()) {
            // Se NÃO é veterinário e está na página de login, remove redirecionamentos forçados de checkout se houver
            // Mas só se o usuário estiver vindo de um clique no estetoscópio ou algo assim (opcional)
            return;
        }

        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;

        // Se o veterinário cair em uma URL que força o checkout, mudamos o comportamento
        if (currentPath.includes('/account/login') && currentSearch.includes('return_to=%2Fcheckout')) {
            console.log('Detectado redirecionamento forçado para checkout. Ajustando...');
            const newSearch = currentSearch.replace('return_to=%2Fcheckout', 'return_to=%2Fpages%2Fportal-veterinario');
            window.location.search = newSearch;
            return;
        }

        // Páginas onde NÃO deve fazer redirecionamento automático (para evitar loops)
        const excludedPaths = [
            '/pages/portal-veterinario',
            '/account',
            '/cart',
            '/checkout',
            '/account/logout'
        ];

        // Se já está em uma página excluída, não redireciona
        for (let path of excludedPaths) {
            if (currentPath.includes(path)) {
                return;
            }
        }

        // Verifica se acabou de fazer login
        // 1. Pelo parâmetro padrão do Shopify
        const urlParams = new URLSearchParams(window.location.search);
        const justLoggedInQuery = urlParams.get('customer_posted') === 'true';

        // 2. Pela detecção de sessão (caso o Shopify não coloque o parâmetro)
        const sessionKey = 'vet_just_logged_in';
        const isSessionLogged = sessionStorage.getItem(sessionKey);

        if (justLoggedInQuery || isSessionLogged) {
            console.log('Veterinário detectado! Redirecionando para portal...');
            if (justLoggedInQuery) sessionStorage.setItem(sessionKey, 'true');

            // Se já está no portal, limpa a flag
            if (currentPath.includes('/pages/portal-veterinario')) {
                sessionStorage.removeItem(sessionKey);
                return;
            }

            window.location.href = '/pages/portal-veterinario';
        }
    }

    // Limpa a flag de login quando o veterinário chega no portal
    if (window.location.pathname.includes('/pages/portal-veterinario')) {
        sessionStorage.removeItem('vet_just_logged_in');
    }

    // Executa quando a página carrega
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', redirectVeterinarian);
    } else {
        redirectVeterinarian();
    }

})();
