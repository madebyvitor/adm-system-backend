const { get, run } = require("../database/connection");

async function findByEmail(email) {
  return get("SELECT * FROM users WHERE email = ?", [email]);
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

module.exports = { findByEmail, count, create };
