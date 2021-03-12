
const TokenGenerator = require("./TokenGenerator")
const [baId] = process.argv.slice(2)
const token = TokenGenerator.create(baId)

console.info(JSON.stringify({baId, token}, null, 2))