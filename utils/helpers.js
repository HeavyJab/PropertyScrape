import ObjectsToCsv from 'objects-to-csv';
import fs from 'fs';
import axios from 'axios';

const clean = (data) => {    
    const clean_data = data.map(record => {
            const temp = {}
            // regex
            const seaview_regex = new RegExp('seaview|SEAVIEW', 'g')
            const price_regex = /([\d.]+M?)/
            const number_regex = /(\-?\d+)/

            if(record['winloss_flag'] != 1) {
                record['winloss'] = "-" + record['winloss']
            }

            if(record['price']) {
                const price = record['price'].match(price_regex) ? record['price'].match(price_regex)[0] : record['price']
                temp['price'] = price;
            }

            if(record['act_area']) {
                const actual_area = record['act_area'].match(number_regex) ? record['act_area'].match(number_regex)[0] : record['act_area']
                temp['act_area'] = actual_area;
            }
            
            const seaview = seaview_regex.test(record["addr"])

            return {
                ...temp,
                'deal_id': record["id"],
                'catid': record['catid'],
                'date': record["date"],
                'year': record['date_y'],
                'month': record['month'],
                'day': record['day'],
                'distric': record['catfathername'],
                'estate': record['catname'],
                'district_url': record['url_father'],
                'estate_url': record['url_cat'],
                'price_value': record['price_value'],
                'change': record['winloss'],
                'area': record['arearaw'],
                'unit_price': record['sq_price_value'],
                'unit_price_actual': record['sq_actprice_value'],
                'block': record['block'],
                'room': record['room'],
                'state': record['state'],
                'seaview': seaview,
                'address': record['addr'],
                'region': record['region'],
                'contract': record['contract'],
                'hold_period': record['holddate'],
                'source': record['source']
            }
        })

    return clean_data
}

const writeCSV = async (data, index) => {
    const csv = new ObjectsToCsv(data);

    fs.writeFileSync('page.txt', index.toString(), {flag:'w'})

    // Save to file:
    await csv.toDisk('./transactions.csv', { append: true });
  };

const getRecordNo = () => {
    if(fs.existsSync('page.txt')) {
        const page_num = fs.readFileSync('page.txt', "utf8")
        return parseInt(page_num)
    } else {
        fs.writeFileSync('page.txt', '0')
        const page_num = fs.readFileSync('page.txt', "utf8")
        return parseInt(page_num)
    }
}

const range = (from, to, step) => {
  return [...Array(Math.floor((to - from) / step) + 1)].map((_, i) => from + i * step);
}

// Object.keys(area).forEach(region => {
const sendRequests = async (recordNo, area) => {
    try {

        let requests = []
        Object.keys(area).forEach(region => {
            const promise = axios({
                method: 'post',
                url: 'https://data.28hse.com/en/webservice', 
                data: `start=${recordNo}&cmd=area_deals&area_id=${area[region]}`,
            })

            requests.push(promise);
           }
        )

        const responses = await axios.all(requests)
        let metadata = await responses.map(res => res.data)
        const data = metadata.map(data => data.data)

        data.forEach((dataRegion, index) => {
            const region_code = area[Object.keys(area)[index]]
            dataRegion = dataRegion.map(transaction => transaction['region'] = region_code)
        })

        console.log(`${data.flat().length} records fetched!`)

        return data.flat()

    } catch(err) {
        console.log(err);
    }
};

export {clean, writeCSV, sendRequests, range, getRecordNo};