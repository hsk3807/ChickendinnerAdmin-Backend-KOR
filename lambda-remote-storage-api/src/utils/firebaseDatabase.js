const admin = require("firebase-admin");
const serviceAccountDev = require("../configs/serviceAccountKey.dev.json");
const serviceAccountProd = require("../configs/serviceAccountKey.prod.json");
const { STAGE } = process.env

const initConfigs = {
  dev: {
    credential: admin.credential.cert(serviceAccountDev),
    databaseURL: "https://ushop-dev-78eba.firebaseio.com"
  },
  prod: {
    credential: admin.credential.cert(serviceAccountProd),
    databaseURL: "https://ushop-prod-19369.firebaseio.com"
  }
}

const usageConfig = initConfigs[STAGE]

admin.initializeApp(usageConfig)

module.exports = admin.database()