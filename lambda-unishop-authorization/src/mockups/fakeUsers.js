const UserRoles = require("../helpers/userRoles")
module.exports.getUser = username => {
    const fakersUsers = [
        {
            username: process.env.SUPERUSER_USERNAME,
            password: process.env.SUPERUSER_PASSWORD,
            permissionsAD: ["USHOP::ALL"],
            permissions: UserRoles.getAll(),
        },
        {
            username: "fakerTH",
            password: "THfaker",
            permissionsAD: ["USHOP::THA::ALL"],
            permissions: {
                THA: UserRoles.getByCountryAll()
            }
        },
        {
            username: "fakerJP",
            password: "JPfaker",
            permissionsAD: ["USHOP::JPN::ALL"],
            permissions: {
                JPN: UserRoles.getByCountryAll()
            }
        },
        {
            username: "fakerTW",
            password: "TWfaker",
            permissionsAD: ["USHOP::TWN::ALL"],
            permissions: {
                TWN: UserRoles.getByCountryAll()
            }
        },
        {
            username: "tanapat",
            password: "1234",
            permissionsAD: ["USHOP::ALL"],
            permissions: UserRoles.getAll(),
        },
        {
            username: "id_verification",
            password: "verification_id",
            permissionsAD: [
                "USHOP::THA::idVerification",
                "USHOP::TWN::idVerification"
            ],
            permissions: {
                THA: { idVerification: { write: true }},
                TWN: { idVerification: { write: true }}
            },
        },
    ]

    return fakersUsers.find(r => r.username === username)
}