module.exports = [
    {
        market: 'AE',
        shipToCountry: 'AE',
        warehouseName: '200-Dubai',
        countryCode3letters: 'ARE',
    },
    {
        market: 'HK',
        shipToCountry: 'HK',
        warehouseName: '1-Hong Kong',
        countryCode3letters: 'HKG',
        starterKitItemCode: '23870',
    },
    {
        market: 'ID',
        shipToCountry: 'ID',
        warehouseName: '1-Online',
        countryCode3letters: 'IDN',
        starterKitItemCode: '25656',
        timezone: 'Asia/Jakarta',
        promotions: [
            {
                name: 'Free starter kit if pv >= 70',
                do: 'afterCalculation',
                conditions: [
                    {
                        source: 'postData',
                        fn: 'orOperator',
                        paramType: 'array',
                        values: [
                            {
                                source: 'postData',
                                fn: 'isValidSponsorId',
                                paramType: 'array',
                                values: ['108357166'],
                            },
                            {
                                source: 'postData',
                                fn: 'isValidPeriod',
                                paramType: 'array',
                                values: [
                                    '2021-03-01 00:00:01',
                                    '2021-03-31 23:59:59',
                                ],
                            },
                        ],
                    },
                    {
                        source: 'postData',
                        fn: 'isOrderTypeMemberOf',
                        paramType: 'array',
                        values: ['enroll'],
                    },
                    {
                        source: 'result',
                        fn: 'hasStarterKit',
                        paramType: 'void',
                    },
                    {
                        source: 'result',
                        fn: 'isTotalPvGreaterOrEqual',
                        paramType: 'singleValue',
                        value: 70,
                    },
                ],
                tasks: [
                    // {
                    //     fn: 'deductSubTotalPrice',
                    //     paramType: 'fn',
                    //     value: 'getStarterKitPrice',
                    // },
                    // {
                    //     fn: 'deductTotalPrice',
                    //     paramType: 'fn',
                    //     value: 'getStarterKitPrice',
                    // },
                    {
                        fn: 'removeProductItem',
                        paramType: 'fn',
                        value: 'getStarterKitItemCode',
                    },
                    {
                        fn: 'setFlagReCalculation',
                        paramType: 'void',
                    },
                ],
            },
        ],
    },
    {
        market: 'JP',
        shipToCountry: 'JP',
        warehouseName: '1-JPN MAIN',
        countryCode3letters: 'JPN',
    },
    {
        market: 'LA',
        shipToCountry: 'LA',
        warehouseName: '1-Laos',
        countryCode3letters: 'LAO',
    },
    {
        market: 'MA',
        shipToCountry: 'MA',
        warehouseName: '30-Morocco',
        countryCode3letters: 'MAR',
    },
    {
        market: 'MY',
        shipToCountry: 'MY',
        warehouseName: '1-Online',
        countryCode3letters: 'MYS',
    },
    {
        market: 'PH',
        shipToCountry: 'PH',
        warehouseName: '1-Philippines Warehouse',
        countryCode3letters: 'PHL',
    },
    {
        market: 'SG',
        shipToCountry: 'AU',
        warehouseName: '1-Online',
        countryCode3letters: 'AUS',
    },
    {
        market: 'SG',
        shipToCountry: 'AU',
        warehouseName: '1-Online',
        countryCode3letters: 'XAU',
    },
    {
        market: 'SG',
        shipToCountry: 'HK',
        warehouseName: 'EXPRESS',
        countryCode3letters: 'XHK',
    },
    {
        market: 'SG',
        shipToCountry: 'ID',
        warehouseName: 'EXPRESS',
        countryCode3letters: 'XID',
    },
    {
        market: 'SG',
        shipToCountry: 'JP',
        warehouseName: 'EXPRESS',
        countryCode3letters: 'XJP',
    },
    {
        market: 'SG',
        shipToCountry: 'KR',
        warehouseName: 'EXPRESS',
        countryCode3letters: 'XKR',
    },
    {
        market: 'SG',
        shipToCountry: 'PH',
        warehouseName: 'EXPRESS',
        countryCode3letters: 'XPH',
    },
    {
        market: 'SG',
        shipToCountry: 'MY',
        warehouseName: 'EXPRESS',
        countryCode3letters: 'XMY',
    },
    {
        market: 'SG',
        shipToCountry: 'NZ',
        warehouseName: '1-Online',
        countryCode3letters: 'NZL',
    },
    {
        market: 'SG',
        shipToCountry: 'NZ',
        warehouseName: '1-Online',
        countryCode3letters: 'XNZ',
    },
    {
        market: 'SG',
        shipToCountry: 'SG',
        warehouseName: '3-Online',
        countryCode3letters: 'SGP',
    },
    {
        market: 'TH',
        shipToCountry: 'TH',
        warehouseName: '906-Online',
        countryCode3letters: 'THA',
    },
    {
        market: 'TW',
        shipToCountry: 'TW',
        warehouseName: '2–TWN Sales',
        countryCode3letters: 'TWN',
        starterKitItemCode: '23019',
        promotions: [
            {
                name: 'Free starter kit if pv >= 100',
                do: 'afterCalculation',
                conditions: [
                    {
                        source: 'postData',
                        fn: 'isOrderTypeMemberOf',
                        paramType: 'array',
                        values: ['enroll'],
                    },
                    {
                        source: 'result',
                        fn: 'hasStarterKit',
                        paramType: 'void',
                    },
                    {
                        source: 'result',
                        fn: 'isTotalPvGreaterOrEqual',
                        paramType: 'singleValue',
                        value: 100,
                    },
                ],
                tasks: [
                    {
                        fn: 'deductSubTotalPrice',
                        paramType: 'fn',
                        value: 'getStarterKitPrice',
                    },
                    {
                        fn: 'deductTotalPrice',
                        paramType: 'fn',
                        value: 'getStarterKitPrice',
                    },
                    {
                        fn: 'removeProductItem',
                        paramType: 'fn',
                        value: 'getStarterKitItemCode',
                    },
                ],
            },
        ],
    },
    {
        market: 'VN',
        shipToCountry: 'VN',
        warehouseName: '1-Hanoi',
        countryCode3letters: 'VNM',
    },
]
