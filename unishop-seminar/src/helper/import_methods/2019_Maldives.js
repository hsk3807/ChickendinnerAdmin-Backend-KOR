
const _ = require('lodash')
const XLSX = require('xlsx')

const TEMPLATE = '2019_Maldives'

module.exports = function (event, context) {
    const seminarDB = require('../../model/seminar')(event, context)
    const importHelper = require('./share')(event, context)
    return {
        exec: exec,
        updateData: updateData        
    }
    // ====================================
    async function exec(data) {
        const workbook = XLSX.read(data)
        const cells = workbook.Sheets[workbook.SheetNames[0]]
        const keys = Object.keys(cells)
    
        const MAX_COLS = 14
        const MAX_HEADER_POSITION = 18
        const rows = []
        const countryCodeRows = []
        let cols = []
        let i = 0
        let j = -1;
        keys.forEach(each => {
            i++
            if (i === MAX_HEADER_POSITION) j=0
            if (j >= 0) {
                j++;
                if (j % MAX_COLS === 1) {
                    cols = []
                }
                cols.push(_.isString(cells[each].w)? cells[each].w.trim(): cells[each].w)
                if (j % MAX_COLS === 0) {
                    // console.log('cols', cols)
                    const month = ['nov', 'dec', 'jan', 'feb']
                    const rankList = ['-','-','-', 'Mgr', 'SrM','ExM', 'Dir', 'SrD', 'ExD', 'PrD', 'PrS', 'PrR', 'DIA']
                    const newRow = {
                        row_id: each.replace(/[^0-9]/g, ''),
                        template: TEMPLATE,
                        country_code: cols[0],
                        ba_id: cols[1],
                        base_rank: rankList[cols[2]],
                        months: [],
                        seat: cols[12]
                    }
                    let totalPoint = 0
                    for (let k = 0; k < month.length; k++) {
                        const num = _.isNaN(_.toNumber(cols[k+7]))? cols[k+7]: _.toNumber(cols[k+7])
                        newRow['months'].push({
                            name: month[k],
                            rank: rankList[cols[k+3]],
                            score: num
                        })
                        if (_.isNumber(num)) totalPoint += num
                    }
                    newRow['total_point'] = totalPoint === 0? '-': totalPoint
                    countryCodeRows.push(cols[0].toUpperCase())
                    rows.push(newRow)
                }
            }
        })

        const MAX_TIMES = Math.ceil(rows.length / 25)
        console.log('MAX_TIMES', MAX_TIMES)
        for (let i = 0; i < MAX_TIMES; i++) {
            console.log(i*25, (i+1)*25)
            await seminarDB.batchCreate(rows.slice(i*25, (i+1)*25))
        }
        await importHelper.importCountryCode(countryCodeRows, TEMPLATE);
        return { template: TEMPLATE, data: rows }
    
    }
    function updateData(data) {
        data.link = 'http://uni.im/jMOTqky'
        data.link_native = 'http://uni.im/jMOTqky'
        data.video = 'https://www.youtube.com/watch?v=EJYl5zqWM5A'
        data.remarks = null
    }    
}