const { firstNameList, lastNameList } = require("../mockUps/mockupName")

const checkUsageByBaId = baId => {
    if ([`2970466`].includes(baId)) return true
    return false
}

const getRandomMockupBa = () => {
    const baId = parseInt(Math.random() * (99999999 - 10000000) + 10000000)
    const firstName = firstNameList[parseInt(Math.random() * firstNameList.length - 1)]
    const lastName = lastNameList[parseInt(Math.random() * lastNameList.length - 1)]
    return {
        baId,
        firstName: firstName.english,
        lastName: lastName.english,
        "firstName@": firstName.native,
        "lastName@": lastName.native
    }

}

const getBlendData = (obj, options) => {
    const {
        replaceBaId,
        listOfProfilePictureUrls = [],
    } = options || {}

    return Object.keys(obj).reduce((temp, key) => {
        if (key === "unicity") {
            const { baId } = getRandomMockupBa()
            temp[key] = baId.toString()

        } else if (key === "humanName") {
            const mockBa = getRandomMockupBa()
            temp[key] = Object
                .keys(obj[key])
                .reduce((mock, nameKey) => {
                    const nameValue = nameKey === 'firstName' ? mockBa[`firstName`]
                        : nameKey === 'lastName' ? mockBa[`lastName`]
                            : nameKey === 'fullName' ? `${mockBa[`firstName`]} ${mockBa[`lastName`]}`
                                : /^firstName@/.test(nameKey) ? mockBa[`firstName@`]
                                    : /^lastName@/.test(nameKey) ? mockBa[`lastName@`]
                                        : /^fullName@/.test(nameKey) ? `${mockBa[`firstName@`]} ${mockBa[`lastName@`]}`
                                            : obj[key][nameKey]

                    return {
                        ...mock,
                        [nameKey]: nameValue
                    }
                }, {})
        } else if (key === "profilePicture") {
            const profilePictureUrl = listOfProfilePictureUrls[Math.floor(Math.random() * listOfProfilePictureUrls.length)]

            temp[key] = {
                ...obj[key],
                sizes: [{ media: profilePictureUrl }]
            }
        } else if (key === "email") {
            const { firstName, lastName } = getRandomMockupBa()
            const mockEmail = `${firstName.toLowerCase()}.${lastName.substring(0, 1).toLowerCase()}@unicity.mockup`
            temp[key] = mockEmail
        }
        else if ([`homePhone`, `mobilePhone`, `workPhone`].includes(key)) {
            temp[key] = [0, ...Array(8).fill(1).reduce((nums) => [...nums, Math.round(Math.random() * 10)], []),].join("")
        }
        else if ([`metricsProfileHistory`, `achievementsHistory`].includes(key)) {
            const { items: originItems = [] } = obj[key]
            const items = originItems
                .map((r, index) => {
                    const now = new Date()
                    const period = new Date(now.setMonth(now.getMonth() - index)).toISOString().substring(0, 7)
                    return { ...r, period }
                })

            temp[key] = getBlendData({
                ...obj[key],
                items,
            })
        }
        else if (replaceBaId && key === "ba_id") {
            temp[key] = replaceBaId
        }
        else if (obj[key] && typeof obj[key] === 'object' && Object.keys(obj[key]).length > 0) {
            temp[key] = getBlendData(obj[key], options)
        }
        else {
            temp[key] = obj[key]
        }
        return temp
    }, Array.isArray(obj) ? [] : {})
}


module.exports = {
    checkUsageByBaId,
    getBlendData,
}