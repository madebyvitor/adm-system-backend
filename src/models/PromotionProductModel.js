const { get, run, all } = require("../database/connection");

async function findProductsByPromotionId(promotionId) {
  return all(
    `SELECT p.id, p.name, p.price, p.quantity, p.user_id, p.created_at
     FROM products p
     INNER JOIN promotion_products pp ON pp.product_id = p.id
     WHERE pp.promotion_id = ?
     ORDER BY p.id ASC`,
    [promotionId]
  );
}

async function countByPromotionId(promotionId) {
  const row = await get(
    "SELECT COUNT(*) AS total FROM promotion_products WHERE promotion_id = ?",
    [promotionId]
  );
  return row.total;
}

async function linkProducts(promotionId, productIds) {
  for (const productId of productIds) {
    await run(
      "INSERT OR IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)",
      [promotionId, productId]
    );
  }
}

async function unlinkProduct(promotionId, productId) {
  const result = await run(
    "DELETE FROM promotion_products WHERE promotion_id = ? AND product_id = ?",
    [promotionId, productId]
  );
  return result.changes;
}

async function findLink(promotionId, productId) {
  return get(
    "SELECT * FROM promotion_products WHERE promotion_id = ? AND product_id = ?",
    [promotionId, productId]
  );
}

module.exports = {
  findProductsByPromotionId,
  countByPromotionId,
  linkProducts,
  unlinkProduct,
  findLink,
};
