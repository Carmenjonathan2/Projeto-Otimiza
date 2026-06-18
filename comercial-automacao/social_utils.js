/**
 * SOCIAL UTILS - GIO Otimiza
 * Biblioteca de funções para simulação de comportamento humano no navegador.
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = (min = 2000, max = 5000) => {
    const time = Math.floor(Math.random() * (max - min + 1) + min);
    return delay(time);
};

async function smoothScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function typeHumanly(page, selector, text) {
    await page.focus(selector);
    for (const char of text) {
        await page.keyboard.type(char, { delay: Math.floor(Math.random() * 150) + 50 });
    }
}

async function simulateMouseMove(page) {
    const x = Math.floor(Math.random() * 800);
    const y = Math.floor(Math.random() * 600);
    await page.mouse.move(x, y);
}

module.exports = { delay, randomDelay, smoothScroll, typeHumanly, simulateMouseMove };
