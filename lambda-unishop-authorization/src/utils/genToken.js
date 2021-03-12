const { generateToken, getDecodeToken } = require("./helpers")


const main = () => {
    const payload = { username: "mobile-app" }
    const token = generateToken(payload, {})
    const decode = getDecodeToken(token)
    console.info({ token, decode })
}

main()