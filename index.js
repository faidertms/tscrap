const playwright = require('playwright');

const urls = [
    {
        url: 'https://www.frigelar.com.br/ar-condicionado-split-inverter-high-wall-daikin-advance-quente-e-frio-9000-btus-fth09p5vl-kit1263/p',
        discountSelector: 'strong.skuListPrice',
        withoutDiscountSelector: 'strong.skuBestPrice'
    },
    {
        url: 'https://www.frigelar.com.br/ar-condicionado-split-inverter-fujitsu-quente-e-frio-high-wall-9000-btus-com-sensor-de-presenca-asbg09lmca-kit504/p',
        discountSelector: 'strong.skuListPrice',
        withoutDiscountSelector: 'strong.skuBestPrice'
    },
    {
        url: 'https://www.leroymerlin.com.br/ar-condicionado-split-inverter-9000btus-frio-advance-daikin_89454981',
        discountSelector: 'div.to-price',
        withoutDiscountSelector: 'div.to-price'
    },
];


const isLeroyMerlinAskingForAddress = async (page) => {
    return await page.$('[data-location-form]');
}

const isLeroyMerlin = (url, page) => {
    return url.includes("leroymerlin.com") && isLeroyMerlinAskingForAddress(page);
}

async function main() {

    const browser = await playwright.chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    for (const { url, discountSelector, withoutDiscountSelector } of urls) {
        await page.goto(url);

        await page.waitForTimeout(2000)

        if (isLeroyMerlin(url, page)) {
            await page.fill('input[name="zipcode"]', '60010-450')
            await page.waitForTimeout(2000)
            await page.click('text=Confirmar');
        }

        const withoutDiscount = await page.$eval(withoutDiscountSelector, (el) => el.textContent);
        const withDiscount = await page.$eval(discountSelector, (el) => el.textContent);

        console.log({ withDiscount, withoutDiscount });

    }

    // Turn off the browser to clean up after ourselves.
    await browser.close();
}

main();