const { cpf } = require("cpf-cnpj-validator");

function isValidCpf(value) {
  return cpf.isValid(value);
}

function formatCpf(value) {
  return cpf.strip(value);
}

module.exports = { isValidCpf, formatCpf };
