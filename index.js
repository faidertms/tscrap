const Axios = require('axios').default;
const playwright = require('playwright');
const CronJob = require('cron').CronJob;
const db = require('./db');
require('dotenv').config();


const products = [
    {
        code: "001",
        url: 'https://www.frigelar.com.br/ar-condicionado-split-inverter-high-wall-daikin-advance-quente-e-frio-9000-btus-fth09p5vl-kit1263/p',
        discountSelector: 'strong.skuListPrice',
        withoutDiscountSelector: 'strong.skuBestPrice'
    },
    {
        code: "002",
        url: 'https://www.frigelar.com.br/ar-condicionado-split-inverter-fujitsu-quente-e-frio-high-wall-9000-btus-com-sensor-de-presenca-asbg09lmca-kit504/p',
        discountSelector: 'strong.skuListPrice',
        withoutDiscountSelector: 'strong.skuBestPrice'
    },
    {
        code: "003",
        url: 'https://www.leroymerlin.com.br/ar-condicionado-split-inverter-9000btus-frio-advance-daikin_89454981',
        discountSelector: 'div.to-price',
        withoutDiscountSelector: 'div.to-price'
    },
    {
        code: "004",
        url: 'https://www.submarino.com.br/produto/12566302/ar-condicionado-split-daikin-advance-inverter-9000-btus-frio-220v',
        discountSelector: '.main-offer__SalesPrice-sc-1oo1w8r-1',
        withoutDiscountSelector: 'strike.regular-price'
    },
    {
        code: "005",
        url: 'https://www.americanas.com.br/produto/12566302/ar-condicionado-split-daikin-advance-inverter-9000-btus-frio-220v',
        discountSelector: '.price__SalesPrice-ej7lo8-2',
        withoutDiscountSelector: '.price__Strike-ej7lo8-1'
    }


];

const isLeroyMerlinAskingForAddress = async (page) => {
    return await page.$('[data-location-form]');
}

const isLeroyMerlin = async (url, page) => {
    if (url.includes("leroymerlin.com") && await isLeroyMerlinAskingForAddress(page)) {
        await page.fill('input[name="zipcode"]', '60010-450')
        await page.waitForTimeout(2000)
        await page.click('text=Confirmar');
        return true;
    }

    return false;
}

const getPriceFromElements = async (page, withoutDiscountElement, discountElement) => {
    let priceWithoutDiscount = withoutDiscountElement
        ? await page.evaluate((el) => el.textContent, withoutDiscountElement)
        : '';
    let discountPrice = discountElement
        ? await page.evaluate((el) => el.textContent, discountElement)
        : '';

    priceWithoutDiscount = priceWithoutDiscount.replace(/[^0-9\.\,]+/g, "").replace(/[,.]/g, m => (m === ',' ? '.' : ''));
    discountPrice = discountPrice.replace(/[^0-9\.\,]+/g, "").replace(/[,.]/g, m => (m === ',' ? '.' : ''));

    return { priceWithoutDiscount, discountPrice }
}

const sendMessageTelegram = async (text) => {
    const { CHAT_ID, API_TOKEN } = process.env;
    const params = { chat_id: CHAT_ID, text };

    try {
        const url = `https://api.telegram.org/bot${API_TOKEN}/sendMessage`;
        const response = await Axios.get(url, { params });
    } catch (error) {
        console.log("erro no envio");
        console.log(error);
    }
}

const getProductPrice = async (code) => {
    const result = await db.query("SELECT code, price FROM prices WHERE code = $1 LIMIT 1", [code]);
    return result.rows[0] ? result.rows[0] : {};
}

const storeProductPrice = async (code, price) => {
    const result = await db.query("INSERT INTO prices ( code, price ) values ($1, $2)  ON CONFLICT(code) DO UPDATE SET price = EXCLUDED.price", [code, price]);
    return result
}

const getLowestPrice = (priceWithoutDiscount, discountPrice) => {
    console.log([priceWithoutDiscount, discountPrice])
    if (!discountPrice) {
        return priceWithoutDiscount ? Number(priceWithoutDiscount) : 0;
    }

    return discountPrice ? Number(discountPrice) : 0;
}

const handlePrice = async (product, priceWithoutDiscount, discountPrice) => {
    console.log(product.code)
    const productPrice = await getProductPrice(product.code);
    const newPrice = getLowestPrice(priceWithoutDiscount, discountPrice);

    if (!productPrice.code || (productPrice.price == 0 && newPrice != 0) || productPrice.price > newPrice) {
        await storeProductPrice(product.code, newPrice);
        await sendMessageTelegram(`URL: ${product.url} \n Price: ${newPrice}`);
    }
}

async function main() {

    const browser = await playwright.chromium.launch({
        headless: true
    });

    const page = await browser.newPage();

    for (const product of products) {
        const { url, code, discountSelector, withoutDiscountSelector } = product;

        await page.goto(url);

        await page.waitForTimeout(2000)

        await isLeroyMerlin(url, page);

        try {
            const withoutDiscountElement = await page.$(withoutDiscountSelector);
            const discountElement = await page.$(discountSelector);
            const {
                discountPrice,
                priceWithoutDiscount
            } = await getPriceFromElements(page, withoutDiscountElement, discountElement);

            handlePrice(product, priceWithoutDiscount, discountPrice);

        } catch (error) {
            console.log("não encontrado");
            console.log(error);
        }

    }

    await browser.close();
}


const job = new CronJob(
    '0 */5 * * * *',
    main,
    null,
    true,
    'America/Fortaleza',
    null,
    true
);

console.log("Processo id: " + process.pid)
job.start();