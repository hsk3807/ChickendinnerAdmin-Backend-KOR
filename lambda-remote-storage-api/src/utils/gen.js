
const Generator = require("./GenealogyTokenGenerator")
const [baId] = process.argv.slice(2)
const token = Generator.create(baId)

console.log(JSON.stringify({baId, token}, null, 2))