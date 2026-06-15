const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const { isValidCpf, formatCpf } = require("../utils/cpfValidator");

async function seed() {
  const total = await UserModel.count();

  if (total > 0) {
    return;
  }

  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_CPF } =
    process.env;

  if (!SEED_ADMIN_NAME || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_CPF) {
    throw new Error(
      "Variáveis de seed não configuradas. Verifique SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD e SEED_ADMIN_CPF no .env"
    );
  }

  if (!isValidCpf(SEED_ADMIN_CPF)) {
    throw new Error("SEED_ADMIN_CPF inválido no .env");
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

  await UserModel.create({
    name: SEED_ADMIN_NAME,
    email: SEED_ADMIN_EMAIL,
    cpf: formatCpf(SEED_ADMIN_CPF),
    passwordHash,
    role: "admin",
  });

  console.log(`Seed aplicado: usuário admin criado (${SEED_ADMIN_EMAIL})`);
}

module.exports = { seed };
