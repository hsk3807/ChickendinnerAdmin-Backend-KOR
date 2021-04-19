
const Sequelize = require('sequelize');
const UtilsService = require('../services/utils.service')

const connection = UtilsService.getConnection()
const UnishopPayment = connection.define('UnishopPayment', {

    id: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true
    },
    reference_id: {
        type: Sequelize.STRING
    },
    reference_id_2: {
        type: Sequelize.STRING
    },
    order_id: {
        type: Sequelize.STRING
    },
    payment_status: {
        type: Sequelize.STRING
    },
    approval_code: {
        type: Sequelize.STRING
    },        
    country_code: {
        type: Sequelize.STRING
    },
    warehouse: {
        type: Sequelize.STRING
    },
    source: {
        type: Sequelize.STRING
    },
    type: {
        type: Sequelize.STRING
    },
    period: {
        type: Sequelize.STRING
    },
    enroller_id: {
        type: Sequelize.STRING
    },
    sponsor_id: {
        type: Sequelize.STRING
    },
    referral_id: {
        type: Sequelize.STRING
    },
    login_id: {
        type: Sequelize.STRING
    },
    new_id: {
        type: Sequelize.STRING
    },
    referer_url: {
        type: Sequelize.TEXT
    },
    request_data: {
        type: Sequelize.TEXT
    },
    response_data: {
        type: Sequelize.TEXT
    },
    return_payment_data: {
        type: Sequelize.TEXT
    },
    notes: {
        type: Sequelize.TEXT
    },
    inv_print: {
        type: Sequelize.INTEGER
    },
    success_url: {
        type: Sequelize.TEXT
    },
    error_url: {
        type: Sequelize.TEXT
    },
    token: {
        type: Sequelize.TEXT
    },
    stamp_created: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
    },
    stamp_updated: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
    },
    ic_file: {
        type: Sequelize.TEXT
    },
    bank_name: {
        type: Sequelize.STRING
    },
    secret_key: {
        type: Sequelize.STRING
    },
    order_recreate_result: {
        type: Sequelize.TEXT
    },
    payment_query_result: {
        type: Sequelize.TEXT
    },
    card_holder: {
        type: Sequelize.STRING
    },
    card_no: {
        type: Sequelize.STRING
    },
    bank_ref: {
        type: Sequelize.STRING
    },
    macco_number: {
        type: Sequelize.STRING
    },
    pickup_code: {
        type: Sequelize.STRING
    },
    is_pickup: {
        type: Sequelize.STRING
    },
    employee_created: {
        type: Sequelize.STRING
    }, 
    employee_pickup: {
        type: Sequelize.STRING
    },
    pickup_date: {
        type: Sequelize.DATE
    },
    cronjob_ref: {
        type: Sequelize.STRING
    }
}, {
    tableName: 'unishop_payment',
    timestamps: false
})

module.exports = UnishopPayment