const process = require('process');
require('dotenv').config();

async function getPlaceData(empresaName, address) {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.log("⚠️ Chave GOOGLE_MAPS_API_KEY não encontrada no .env. Ignorando pesquisa.");
            return null;
        }

        const query = `${empresaName} ${address || ''}`.trim();
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=pt-BR`;
        
        console.log(`🌐 Buscando no Google Maps: '${query}'...`);
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (!searchData.results || searchData.results.length === 0) {
            if (searchData.error_message) console.error("⚠️ Erro da API Google Places:", searchData.error_message);
            console.log(`📍 Nenhum local ou estabelecimento encontrado pelo Google Maps.`);
            return null;
        }

        const place = searchData.results[0];
        const placeId = place.place_id;

        // Buscar detalhes para pegar as reviews
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews&key=${apiKey}&language=pt-BR`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        
        const result = detailsData.result;
        if (!result) return null;

        let bestReview = null;
        let reviewerName = null;
        if (result.reviews && result.reviews.length > 0) {
            // Pegar uma avaliação positiva (>= 4 estrelas) se possível
            const goodReviews = result.reviews.filter(r => r.rating >= 4 && r.text && r.text.length > 10);
            if (goodReviews.length > 0) {
                bestReview = goodReviews[0].text;
                reviewerName = goodReviews[0].author_name;
            } else if (result.reviews[0].text) {
                bestReview = result.reviews[0].text;
                reviewerName = result.reviews[0].author_name;
            }
        }

        if (bestReview) console.log(`⭐ Avaliação Encontrada (${result.rating}): "${bestReview.slice(0, 40)}..."`);
        else if (result.rating) console.log(`⭐ Nota Local Localizada: ${result.rating}`);
        
        return {
            name: result.name,
            rating: result.rating || null,
            review: bestReview,
            reviewerName: reviewerName
        };

    } catch(err) {
        console.error("❌ Erro na busca do Places API:", err.message);
        return null;
    }
}

module.exports = { getPlaceData };
