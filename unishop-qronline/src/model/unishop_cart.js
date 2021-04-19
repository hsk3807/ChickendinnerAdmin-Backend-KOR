'use strict';

const TABLE = 'unishop_cart';
const TABLE_ITEMS = 'unishop_cart_items';

module.exports.getCartWithItemsByReferenceId = async(db, referenceId) => {
    const sql = `
    SELECT
    c.reference_id, 
    c.type, 
    c.total, 
    c.stamp_created, 
    c.total_pv, 
    c.shipping_method, 
    c.firstName, 
    c.lastName, 
    c.address1, 
    c.address2, 
    c.city, 
    c.country, 
    c.state, 
    c.zip, 
    c.delivery_fee, 
    c.weight, 
    c.password, 
    c.email,
    c.mobile,
    c.login_name,
    c.login_native_name,
    c.referral_name,
    c.referral_native_name,
    c.referral_text,
    c.enroller_name,
    c.enroller_native_name,
    c.sponsor_name,
    c.sponsor_native_name,
    c.email_confirmation,
    c.currency,
    c.sns,
    ct.id AS cart_item_id,
    ct.is_backorder,
    ct.item_code, 
    ct.quantity, 
    ct.stamp_created, 
    ct.item_total_pv, 
    ct.price_per_unit, 
    ct.subtotal,
    p.country_code, 
    p.warehouse, 
    p.item_name_1, 
    p.item_name_2, 
    p.item_desc_1, 
    p.item_desc_2, 
    p.sorted, 
    p.category_name_1, 
    p.category_name_2, 
    p.wholesale_price, 
    p.retail_price, 
    p.preferred_price, 
    p.allow_backorder, 
    p.hot, 
    p.image_url, 
    p.link, 
    p.status
    FROM unishop_cart_items ct 
    INNER JOIN 
        (SELECT MAX(id) AS id FROM unishop_cart c WHERE c.type = 'validated' AND c.reference_id = ?) AS c2 
        ON c2.id = ct.cart_id
    INNER JOIN unishop_cart c ON ct.cart_id = c.id
    INNER JOIN unishop_payment pm ON pm.reference_id = c.reference_id
    INNER JOIN unishop_products p ON p.item_code = ct.item_code 
    AND IF (pm.country_code = 'XAU',p.country_code = 'AUS',p.country_code = pm.country_code)  
    AND IF (p.warehouse = 'Unipower', 1 , p.warehouse = pm.warehouse)
    `;
    return await db.exec(sql, [referenceId]);
};