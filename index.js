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
    {
        url: 'https://www.submarino.com.br/produto/12566302/ar-condicionado-split-daikin-advance-inverter-9000-btus-frio-220v',
        discountSelector: '.main-offer__SalesPrice-sc-1oo1w8r-1',
        withoutDiscountSelector: 'strike.regular-price'
    },
    {
        url: 'https://www.americanas.com.br/produto/12566302/ar-condicionado-split-daikin-advance-inverter-9000-btus-frio-220v',
        discountSelector: '.price__SalesPrice-ej7lo8-2',
        withoutDiscountSelector: '.price__Strike-ej7lo8-1'
    }

    
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

            try {
                const withoutDiscountElement = await page.$(withoutDiscountSelector);
                const discountElement = await page.$(discountSelector);

                //transformar para funcao
                let withoutDiscount = withoutDiscountElement ? await page.evaluate((el) => el.textContent, withoutDiscountElement) : '';
                let withDiscount = discountElement ? await page.evaluate((el) => el.textContent, discountElement) : '';

                withoutDiscount = withoutDiscount.replace(/[^0-9\.\,]+/g, "");
                withDiscount = withDiscount.replace(/[^0-9\.\,]+/g, "");

                console.log({ withDiscount, withoutDiscount });
            } catch (error) {
                console.log("não encontrado");
                console.log(error);
            }








    }

    // Turn off the browser to clean up after ourselves.
    await browser.close();
}

main();


// function sendMessageTelegram($text)
// {
//     $apiToken = "";
//     $data = [
//         'chat_id'   => '',
//         'text'      => $text
//     ];


//     return "https://api.telegram.org/bot{$apiToken}/sendMessage?" . http_build_query($data);
// }


// function storeHistProduto(&$conn, $codigo, $valor)
// {
//     $sth = $conn->prepare("INSERT INTO persistencia ( codigo, preco ) values (?, ?) ON CONFLICT(codigo) DO UPDATE SET preco = EXCLUDED.preco");
//     $sth->execute([$codigo, $valor]);
// }

// function getHistProduto(&$conn, $codigo)
// {
//     $query = $conn->prepare("SELECT codigo, preco FROM persistencia WHERE codigo = :codigo LIMIT 1");
//     $query->bindParam(':codigo', $codigo);
//     $query->execute();

//     $resultado = $query->fetch(PDO::FETCH_ASSOC);
//     return $resultado !== false ? $resultado : [];
// }