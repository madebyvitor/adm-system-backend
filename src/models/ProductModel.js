const { get, run, all } = require("../database/connection");

async function findAll(limit, offset) {
  return all(
    "SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
}

async function count() {
  const row = await get("SELECT COUNT(*) AS total FROM products");
  return row.total;
}

async function findById(id) {
  return get("SELECT * FROM products WHERE id = ?", [id]);
}

async function create({ name, price, quantity, userId }) {
  const result = await run(
    "INSERT INTO products (name, price, quantity, user_id) VALUES (?, ?, ?, ?)",
    [name, price, quantity, userId]
  );
  return result.lastID;
}

async function update(id, { name, price, quantity }) {
  const result = await run(
    "UPDATE products SET name = ?, price = ?, quantity = ? WHERE id = ?",
    [name, price, quantity, id]
  );
  return result.changes;
}

async function deleteProduct(id) {
  const result = await run("DELETE FROM products WHERE id = ?", [id]);
  return result.changes;
}

module.exports = {
  findAll,
  count,
  findById,
  create,
  update,
  delete: deleteProduct,
};
