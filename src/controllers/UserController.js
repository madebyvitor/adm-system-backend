const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const { isValidCpf, formatCpf } = require("../utils/cpfValidator");

function validateUserFields({ name, email, cpf, password, requirePassword }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Nome é obrigatório";
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    return "E-mail é obrigatório";
  }

  if (!email.includes("@")) {
    return "E-mail inválido";
  }

  if (!cpf || typeof cpf !== "string" || !cpf.trim()) {
    return "CPF é obrigatório";
  }

  if (!isValidCpf(cpf)) {
    return "CPF inválido";
  }

  if (requirePassword) {
    if (!password || typeof password !== "string" || !password.trim()) {
      return "Senha é obrigatória";
    }
  } else if (password !== undefined && password !== null && password !== "") {
    if (typeof password !== "string" || !password.trim()) {
      return "Senha inválida";
    }
  }

  return null;
}

async function index(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    UserModel.findAll(limit, offset),
    UserModel.count(),
  ]);

  const lastPage = total === 0 ? 1 : Math.ceil(total / limit);

  return res.json({
    data,
    meta: { total, page, lastPage },
  });
}

async function show(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const user = await UserModel.findById(id);

  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  return res.json(user);
}

async function create(req, res) {
  const { name, email, cpf, password } = req.body;

  const validationError = validateUserFields({
    name,
    email,
    cpf,
    password,
    requirePassword: true,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const formattedCpf = formatCpf(cpf);

  const existingEmail = await UserModel.findByEmail(email.trim());
  if (existingEmail) {
    return res.status(409).json({ message: "E-mail já cadastrado" });
  }

  const existingCpf = await UserModel.findByCpf(formattedCpf);
  if (existingCpf) {
    return res.status(409).json({ message: "CPF já cadastrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const id = await UserModel.create({
    name: name.trim(),
    email: email.trim(),
    cpf: formattedCpf,
    passwordHash,
    role: "employee",
  });

  const user = await UserModel.findById(id);
  return res.status(201).json(user);
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const existing = await UserModel.findById(id);
  if (!existing) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const { name, email, cpf, password } = req.body;

  const validationError = validateUserFields({
    name,
    email,
    cpf,
    password,
    requirePassword: false,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const formattedCpf = formatCpf(cpf);
  const trimmedEmail = email.trim();

  const existingEmail = await UserModel.findByEmail(trimmedEmail);
  if (existingEmail && existingEmail.id !== id) {
    return res.status(409).json({ message: "E-mail já cadastrado" });
  }

  const existingCpf = await UserModel.findByCpf(formattedCpf);
  if (existingCpf && existingCpf.id !== id) {
    return res.status(409).json({ message: "CPF já cadastrado" });
  }

  const updateData = {
    name: name.trim(),
    email: trimmedEmail,
    cpf: formattedCpf,
  };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await UserModel.update(id, updateData);

  const user = await UserModel.findById(id);
  return res.json(user);
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  if (id === req.user.id) {
    return res
      .status(403)
      .json({ message: "Não é possível excluir o próprio usuário" });
  }

  const existing = await UserModel.findById(id);
  if (!existing) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  await UserModel.delete(id);
  return res.json({ message: "Usuário removido com sucesso" });
}

module.exports = { index, show, create, update, delete: remove };
