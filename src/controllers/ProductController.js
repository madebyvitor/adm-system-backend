const ProductModel = require("../models/ProductModel");

function validateProductFields({ name, price, quantity }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Nome é obrigatório";
  }

  if (price === undefined || price === null || price === "") {
    return "Preço é obrigatório";
  }

  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return "Preço deve ser um número maior ou igual a zero";
  }

  if (quantity === undefined || quantity === null || quantity === "") {
    return "Quantidade é obrigatória";
  }

  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    return "Quantidade deve ser um número inteiro maior ou igual a zero";
  }

  return null;
}

async function index(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    ProductModel.findAll(limit, offset),
    ProductModel.count(),
  ]);

  const lastPage = total === 0 ? 1 : Math.ceil(total / limit);

  return res.json({
    data,
    meta: { total, page, lastPage },
  });
}

async function create(req, res) {
  const { name, price, quantity } = req.body;

  const validationError = validateProductFields({ name, price, quantity });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const id = await ProductModel.create({
    name: name.trim(),
    price: Number(price),
    quantity: Number(quantity),
    userId: req.user.id,
  });

  const product = await ProductModel.findById(id);
  return res.status(201).json(product);
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const existing = await ProductModel.findById(id);
  if (!existing) {
    return res.status(404).json({ message: "Produto não encontrado" });
  }

  const { name, price, quantity } = req.body;

  const validationError = validateProductFields({ name, price, quantity });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  await ProductModel.update(id, {
    name: name.trim(),
    price: Number(price),
    quantity: Number(quantity),
  });

  const product = await ProductModel.findById(id);
  return res.json(product);
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const existing = await ProductModel.findById(id);
  if (!existing) {
    return res.status(404).json({ message: "Produto não encontrado" });
  }

  await ProductModel.delete(id);
  return res.json({ message: "Produto removido com sucesso" });
}

module.exports = { index, create, update, delete: remove };
