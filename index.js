import {clean, range, getRecordNo, sendRequests, writeCSV} from './utils/helpers.js'

const recordNo = getRecordNo()

const scrape = async (recordNo, lastRecord) => {
    return new Promise((resolve, reject) => {
        const records = range(recordNo, lastRecord, 10);
        const area = {"hk": 1, "kl":2, "nt": 3}
    
        records.forEach(async recordNo => {
            try{
                console.log(`Getting 10 records starting with ${recordNo}`)
                const res = await sendRequests(recordNo, area)
                const data = clean(res)
                await writeCSV(data, lastRecord)
                console.log(`Records${recordNo} fetched and saved!`)
                resolve()
            } catch (err) {
                console.log(err)
                reject()
            }
        })
    })
}

const fetch = range(recordNo, 1123500, 50)
for(let no of fetch) {
    console.log(no)
    const lastRecord = no + 50
    const promise = await scrape(no+10, lastRecord)
}
