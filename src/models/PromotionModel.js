const { get, run, all } = require("../database/connection");

async function findAll(limit, offset) {
  return all(
    "SELECT * FROM promotions ORDER BY id DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
}

async function count() {
  const row = await get("SELECT COUNT(*) AS total FROM promotions");
  return row.total;
}

async function findById(id) {
  return get("SELECT * FROM promotions WHERE id = ?", [id]);
}

async function create({
  title,
  description,
  discountType,
  discountValue,
  startDate,
  endDate,
  isActive,
}) {
  const result = await run(
    `INSERT INTO promotions (
      title, description, discount_type, discount_value,
      start_date, end_date, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description ?? null,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive ? 1 : 0,
    ]
  );
  return result.lastID;
}

async function update(
  id,
  {
    title,
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    isActive,
  }
) {
  const result = await run(
    `UPDATE promotions SET
      title = ?, description = ?, discount_type = ?, discount_value = ?,
      start_date = ?, end_date = ?, is_active = ?
    WHERE id = ?`,
    [
      title,
      description ?? null,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive ? 1 : 0,
      id,
    ]
  );
  return result.changes;
}

async function deletePromotion(id) {
  const result = await run("DELETE FROM promotions WHERE id = ?", [id]);
  return result.changes;
}

module.exports = {
  findAll,
  count,
  findById,
  create,
  update,
  delete: deletePromotion,
};
