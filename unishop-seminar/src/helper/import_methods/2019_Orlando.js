
const _ = require('lodash')
const XLSX = require('xlsx')
const TEMPLATE = '2019_Orlando'

module.exports = function (event, context) {
    const seminarDB = require('../../model/seminar')(event, context)
    const importHelper = require('./share')(event, context)
    return {
        exec: exec,
        updateData: updateData
    }
    // ====================================
    async function exec (data) {
        const month = [
            { column: 'E', month: 'oct'},
            { column: 'F', month: 'nov'},
            { column: 'G', month: 'dec'},
            { column: 'H', month: 'jan'},
            { column: 'I', month: 'feb'},
            { column: 'J', month: 'mar'}
        ]
        const rankList = {
            'M': 'Mgr',
            'SM': 'SrM',                                                
            'EM': 'ExM',
            'D': 'Dir',
            'SD': 'SrD',
            'ED': 'ExD',
            'PD': 'PrD',
            'PS': 'PrS',
            'PR': 'PrR',
            'PDIA': 'DIA'
        }
        const workbook = XLSX.read(data)
        const cells = workbook.Sheets[workbook.SheetNames[0]]
        const excelRows = compileToExcelRow(cells)
        const { seminar: seminarRows, countryCode: countryCodeRows } = extractDataRow(excelRows)

        const MAX_TIMES = Math.ceil(seminarRows.length / 25)
        console.log('MAX_TIMES', MAX_TIMES)
        for (let i = 0; i < MAX_TIMES; i++) {
            console.log(i*25, (i+1)*25)
            await seminarDB.batchCreate(seminarRows.slice(i*25, (i+1)*25))
        }
        await importHelper.importCountryCode(countryCodeRows, TEMPLATE);
        return { template: TEMPLATE, data: seminarRows }
     
        // ===================================
        function compileToExcelRow (cells) {
            const keys = Object.keys(cells)
            return keys.reduce((carry, each) => {
                const matches = each.match(/^(\w)(\d+)$/)
                if (matches) {
                    const colAlphabet = matches[1]
                    const rowNo = matches[2]
                    if (carry[rowNo]) {
                        carry[rowNo]['row_id'] = rowNo
                        carry[rowNo][colAlphabet] = cells[each]
                    } else {
                        carry[rowNo] = { [colAlphabet]: cells[each] }
                    }
                    
                }
                return carry
            }, []);            
        }
        function extractDataRow (excelRows) {
            return excelRows.reduce((carry, each) => {
                if (Object.keys(each).length >= 11) {
                    const newRow = createNewRow(each)
                    const countryCode = newRow.country_code
                    carry.seminar.push(newRow)
                    carry.countryCode.push(countryCode)
                }
                return carry
            }, {seminar: [], countryCode: []})
        }
        function createNewRow (data) {
            const newRow = {
                row_id: data['row_id'],
                template: TEMPLATE,                        
                country_code: data['A'].v.trim().toUpperCase(),
                ba_id: data['B'].w.trim(),
                highest_rank: getRank(data['C'].v.trim()),
                months: [],
                remark: _.isEmpty(data['K']) || _.isEmpty(data['K'].v)? null: data['K'].v.trim()
            }
            attachMonthData(newRow, data)
            return newRow

            // ===================================     
            function attachMonthData(row, data) {
                month.forEach(each => {
                    const [rank, highlight] = splitRankAndHighlight(data[each.column].v)
                    row['months'].push({
                        name: each.month,
                        rank: getRank(rank),
                        highlight
                    })
                })
            }
            function splitRankAndHighlight(data) {
                if (_.isEmpty(data) || data === '-') return [data, false]
                const token = data.split('-')
                return [token[0], token[1] === 'G']
            }
            function getRank (data) {
                if (data === '-') return '-'
                return rankList[data]
            }                     
        }
    }
    function updateData(data) {
        data.link = 'http://uni.im/VhJhghG'
        data.link_native = 'http://uni.im/VhJhghG'
        data.video = null
        data.remarks = null
        if (data.months) {
            const found = data.months.filter((each)=> {
                return each.highlight
            })
            if (found.length > 0) {
                data.qualified = true
            } else {
                data.qualified = false
            }
        }
    }
}