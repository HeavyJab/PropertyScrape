const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');
const axios = require('axios');

const clean = (data, region, gain) => {
    data = data.slice(0, data.length - 1)

    let transaction = [];

    const schema = ["date", "district", "estate", "price", "change", "area_gfa", "area_sfa", "unit_price_gfa", "unit_price_sfa", "block", "floor", "room", "seaview", "address", "region", "contract"]

    data.forEach(elm => {
        const regex = new RegExp('\\d+[-]\\d+[-]\\d+', 'g')

        if(regex.test(elm)){
            transaction.push([])
        }

        transaction[transaction.length - 1].push(elm)
    })

    transaction = transaction.map((row, index) => {
            area = row[5].split("\n")
            unitPrice = row[6].split("\n")

            // checking winning or losing
            if(!gain[index].includes('data-txn-winloss-win')) {
                row[4] = "-" + row[4]
            }

            // regex
            regex = /(.+\s)?(\w{1,3})[\/#]{0,2}F(?:\s?\b[rR][oO]+[mM]\b\s?(\w{1,3}))?/
            seaview = new RegExp('seaview|SEAVIEW', 'g')
            price_regex = /([\d.]+M?)/
            number = /(\d+)/

            // substring
            matches = row[7].match(regex)

            if(matches) {
                block = matches[1] 
                floor = matches[2]
                room = matches[3]
            }
            
            seaview = seaview.test(row[7])
            area_gfa = area[0].match(number)
            area_sfa = area[1].match(number)
            unit_price_gfa = unitPrice[0].match(price_regex)
            unit_price_sfa = unitPrice[1].match(price_regex)
            price = row[3].match(price_regex)[0]

            return {
                [schema[0]]: row[0],
                [schema[1]]: row[1],
                [schema[2]]: row[2],
                [schema[3]]: price,
                [schema[4]]: row[4],
                [schema[5]]: area_gfa ? area_gfa[0] : null,
                [schema[6]]: area_sfa ? area_sfa[0] : null,
                [schema[7]]: unit_price_gfa ? unit_price_gfa[0] : null,
                [schema[8]]: unit_price_sfa ? unit_price_sfa[0] : null,
                [schema[9]]: block,
                [schema[10]]: floor,
                [schema[11]]: room,
                [schema[12]]: seaview,
                [schema[13]]: row[7],
                [schema[14]]: region,
                [schema[15]]: row[8]
            }
        })

    return transaction
}

const extractEvaluateCall = async(page) => {
    const region = await page.$eval('ul[class="data-txn-nav clearfix"] > li[class="active"] > a', el => el.text)
    const gain = await page.$$eval('tbody[class="data-txn-table-body"] tr', el => el.map(tr => tr.children[4].innerHTML))

    let data = await page.evaluate(() => {
        const tds = Array.from(document.querySelectorAll('table[class="data-txn-table table table-condensed dataTable"] tr td'))

        return tds.map(td => td.innerText)

    })

    data = clean(data, region, gain);

    console.log(data)

    return data;
}

const writeCSV = async (data, index) => {
    const csv = new ObjectsToCsv(data);

    fs.writeFileSync('page.txt', index.toString(), {flag:'w'})

    // Save to file:
    await csv.toDisk('./test.csv', { append: true });
  };

const getPageNo = () => {
    if(fs.existsSync('page.txt')) {
        page_num = fs.readFileSync('page.txt', "utf8")
        return parseInt(page_num)
    } else {
        fs.writeFileSync('page.txt', '0')
        page_num = fs.readFileSync('page.txt', "utf8")
        return parseInt(page_num)
    }
    console.log(page_num)
}

const range = (from, to, step) =>
  [...Array(Math.floor((to - from) / step) + 1)].map((_, i) => from + i * step);

page_num = getPageNo()
records = range(page_num, 400000, 10)
area = {"hk": 1, "kl": 2, "nt": 3}

// Object.keys(area).forEach(region => {
const send = async () => {
    console.log(page_num)
    try {
        const res = await axios({
            method: 'post',
            url: 'https://data.28hse.com/en/webservice', 
            data: `start=${records[0]}&cmd=area_deals&area_id=${area['hk']}`,
        })

        console.log(res.data)
    } catch(err) {
        console.log(err);
    }
};
    
send()
// })

// (async () => {
//     try {
//         const browser = await puppeteer.launch({headless: false});
//         const tab = await browser.newPage();
//         await tab.goto("https://data.28hse.com/en/",{waitUntil: 'networkidle2'});
//         let transactions = []

//         const page_num = getPageNo()
//         console.log(page_num)

//         const regions = await tab.$$('ul[class="data-txn-nav clearfix"] > li > a')
//         for (let region of regions) {
//             await region.click()

//             last = 20000
//             const pages = range(page_num, last, 1)

//             let temp = 1
            
//             for await (const pageNo of pages) {                
//                 console.log(`Page no ${pageNo}`)
//                 for(click = temp; click < pageNo; click++) {
//                     console.log('In quick Click')
//                     console.log(click)

//                     temp += 1
//                     await tab.waitForTimeout(1000);
//                     await tab.click('li[id="DataTables_Table_1_next"] > a')
//                 }
//                 temp += 1

//                 await tab.waitForSelector('li[id="DataTables_Table_1_next"] > a');
//                 transactions = transactions.concat(await extractEvaluateCall(tab));
                
//                 // write csv to disk
//                 await writeCSV(transactions, pageNo)

//                 await tab.waitForTimeout(1000);
//                 await tab.click('li[id="DataTables_Table_1_next"] > a')
//             }
//         }

        
//         await browser.close()

//     } catch (err) {
//         console.log(err);
//     }
// })()

