const Axios = require('axios').default;
const playwright = require('playwright');
const CronJob = require('cron').CronJob;
const db = require('./db');
require('dotenv').config();


const products = [
    {
        id: 1,
        url: 'https://www.frigelar.com.br/ar-condicionado-split-inverter-high-wall-daikin-advance-quente-e-frio-9000-btus-fth09p5vl-kit1263/p',
        discountSelector: 'strong.skuListPrice',
        withoutDiscountSelector: 'strong.skuBestPrice'
    },
    {
        id: 3,
        url: 'https://www.leroymerlin.com.br/ar-condicionado-split-inverter-9000btus-frio-advance-daikin_89454981',
        discountSelector: 'div.to-price',
        withoutDiscountSelector: 'div.to-price'
    },
    {
        id: 5,
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
        await page.fill('input[name="zipcode"]', '60811-900')
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

    return { priceWithoutDiscount, discountPrice };
}

const sendMessageTelegram = async (text) => {
    const { CHAT_ID, API_TOKEN } = process.env;
    const params = { chat_id: CHAT_ID, text };

    try {
        const url = `https://api.telegram.org/bot${API_TOKEN}/sendMessage`;
        const response = await Axios.get(url, { params });
    } catch (error) {
        console.log("Telegram error");
    }
}

const getProductPrice = async (product_id) => {
    const result = await db.query("SELECT product_id, price FROM prices WHERE product_id = $1 AND created_at = now()::date LIMIT 1", [product_id]);
    return result.rows[0] ? result.rows[0] : {};
}

const storeProductPrice = async (product_id, price) => {
    const result = await db.query("INSERT INTO prices ( product_id, price, created_at, updated_at ) values ($1, $2, now(), now()) ON CONFLICT(product_id, created_at) DO UPDATE SET updated_at = now(), price = EXCLUDED.price", [product_id, price]);
    return result
}

const getLowestPrice = (priceWithoutDiscount, discountPrice) => {
    if (!discountPrice) {
        return priceWithoutDiscount ? Number(priceWithoutDiscount) : null;
    }

    return discountPrice ? Number(discountPrice) : null;
}

const isNewPrice = (productPrice, newPrice) => {
    const existNewPrice = (newPrice && (productPrice.price > newPrice || productPrice.price == 0));
    const notExistProduct = productPrice.product_id === undefined
    return notExistProduct || existNewPrice;
}

const handlePrice = async (product, priceWithoutDiscount, discountPrice) => {
    const productPrice = await getProductPrice(product.id);
    const newPrice = getLowestPrice(priceWithoutDiscount, discountPrice);
    console.log([productPrice.product_id, productPrice.price, newPrice])
    if (isNewPrice(productPrice, newPrice)) {
        await storeProductPrice(product.id, newPrice);
        await sendMessageTelegram(`URL: ${product.url} \n Price: ${newPrice}`);
    }
}

async function main() {

    const browser = await playwright.chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    for (const product of products) {
        const { url, discountSelector, withoutDiscountSelector } = product;

        await page.goto(url, { waitUntil: 'networkidle0' });
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
            console.log("not found");
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

console.log("Process id: " + process.pid)
job.start();