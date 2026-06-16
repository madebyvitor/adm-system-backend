const { get, run, all } = require("../database/connection");

const PUBLIC_FIELDS =
  "id, name, email, cpf, role, created_at";

async function findByEmail(email) {
  return get("SELECT * FROM users WHERE email = ?", [email]);
}

async function findByCpf(cpf) {
  return get("SELECT id FROM users WHERE cpf = ?", [cpf]);
}

async function findAll(limit, offset) {
  return all(
    `SELECT ${PUBLIC_FIELDS} FROM users ORDER BY id DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

async function findById(id) {
  return get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [id]);
}

async function count() {
  const row = await get("SELECT COUNT(*) AS total FROM users");
  return row.total;
}

async function create({ name, email, cpf, passwordHash, role = "admin" }) {
  const result = await run(
    "INSERT INTO users (name, email, cpf, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [name, email, cpf, passwordHash, role]
  );
  return result.lastID;
}

async function update(id, { name, email, cpf, passwordHash }) {
  if (passwordHash) {
    const result = await run(
      "UPDATE users SET name = ?, email = ?, cpf = ?, password_hash = ? WHERE id = ?",
      [name, email, cpf, passwordHash, id]
    );
    return result.changes;
  }

  const result = await run(
    "UPDATE users SET name = ?, email = ?, cpf = ? WHERE id = ?",
    [name, email, cpf, id]
  );
  return result.changes;
}

async function deleteUser(id) {
  const result = await run("DELETE FROM users WHERE id = ?", [id]);
  return result.changes;
}

module.exports = {
  findByEmail,
  findByCpf,
  findAll,
  findById,
  count,
  create,
  update,
  delete: deleteUser,
};
