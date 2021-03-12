

const MAP_LANGUAGE_USAGE = {
    "AUS": [
        "EN"
    ],
    "HKG": [
        "EN",
        "HK"
    ],
    "IDN": [
        "EN",
        "ID"
    ],
    "JPN": [
        "EN",
        "JP"
    ],
    "KHM": [
        "EN",
        "KH"
    ],
    "KOR": [
        "EN"
    ],
    "LAO": [
        "EN",
        "LA"
    ],
    "MMR": [
        "EN",
        "MM"
    ],
    "MYS": [
        "EN"
    ],
    "NZL": [
        "EN"
    ],
    "PHL": [
        "EN",
        "PH"
    ],
    "SGP": [
        "EN"
    ],
    "THA": [
        "EN",
        "TH"
    ],
    "TWN": [
        "EN"
    ],
    "VNM": [
        "EN",
        "VN"
    ],
    "XAU": [
        "EN"
    ],
    "XHK": [
        "EN",
        "CN"
    ],
    "XID": [
        "EN",
        "ID"
    ],
    "XJP": [
        "EN",
        "JP"
    ],
    "XKR": [
        "EN"
    ],
    "XME": [
        "EN",
        "AR"
    ],
    "XMY": [
        "EN"
    ],
    "XNZ": [
        "EN"
    ],
    "XPH": [
        "EN",
        "PH"
    ]
}

module.exports.getLanguagesListByCountry = countryCode => MAP_LANGUAGE_USAGE[countryCode] 
