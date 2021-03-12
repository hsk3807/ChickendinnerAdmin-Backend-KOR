const { createHashHref } = require("./etlHelper")
const [baId] = process.argv.slice(2)
const Href = createHashHref(baId, 'customer')

console.info(JSON.stringify({baId, Href}, null, 2))