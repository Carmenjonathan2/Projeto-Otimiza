function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utms = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const val = urlParams.get(param);
        if (val) utms.push(`- ${param}: ${val}`);
    });
    return utms.length > 0 ? "\n\n*Rastreamento UTM:*\n" + utms.join('\n') : "";
}

function generateWhatsappLink(formData) {
    const { clientName, petName, petType, address, reason, urgency } = formData;

    // Fallback if global whatsappPhone is not defined
    const phone = typeof whatsappPhone !== 'undefined' ? whatsappPhone : "553135649606";

    // Strict urgency text logic to prevent typos like "Baixasa"
    const urgencyClean = String(urgency).trim();
    const isAlta = urgencyClean === 'Alta';
    const urgencyText = isAlta ? 'Alta' : 'Baixa';
    const priorityMarker = isAlta ? '[URGENTE]' : '[Normal]';

    const utmTracking = getUTMParams();

    const message = `
*Olá, Otimiza FarmaVet!* 
Gostaria de *solicitar um orçamento* para atendimento domiciliar.

- Tutor: ${clientName}
- Pet: ${petName} (${petType})
- Endereço: ${address}
- Motivo: ${reason}
- Urgência: ${urgencyText} ${priorityMarker}${utmTracking}

Aguardo retorno com o valor para minha região.
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}
