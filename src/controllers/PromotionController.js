const PromotionModel = require("../models/PromotionModel");
const PromotionProductModel = require("../models/PromotionProductModel");
const ProductModel = require("../models/ProductModel");

const VALID_DISCOUNT_TYPES = ["percentage", "fixed"];

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function getTodayDateOnly() {
  return toDateOnlyString(new Date());
}

function validatePromotionFields(
  {
    title,
    description,
    discount_type,
    discount_value,
    start_date,
    end_date,
    is_active,
  },
  { isCreate, existingStartDate }
) {
  if (!title || typeof title !== "string" || !title.trim()) {
    return "Título é obrigatório";
  }

  if (
    !discount_type ||
    typeof discount_type !== "string" ||
    !VALID_DISCOUNT_TYPES.includes(discount_type)
  ) {
    return "Tipo de desconto inválido";
  }

  if (
    discount_value === undefined ||
    discount_value === null ||
    discount_value === ""
  ) {
    return "Valor do desconto é obrigatório";
  }

  const parsedDiscountValue = Number(discount_value);
  if (Number.isNaN(parsedDiscountValue)) {
    return "Valor do desconto deve ser um número";
  }

  if (discount_type === "percentage") {
    if (parsedDiscountValue <= 0 || parsedDiscountValue > 100) {
      return "Desconto percentual deve ser maior que 0 e menor ou igual a 100";
    }
  } else if (parsedDiscountValue <= 0) {
    return "Desconto fixo deve ser maior que zero";
  }

  if (!start_date) {
    return "Data de início é obrigatória";
  }

  const parsedStartDate = parseDate(start_date);
  if (!parsedStartDate) {
    return "Data de início inválida";
  }

  if (!end_date) {
    return "Data de término é obrigatória";
  }

  const parsedEndDate = parseDate(end_date);
  if (!parsedEndDate) {
    return "Data de término inválida";
  }

  if (parsedEndDate <= parsedStartDate) {
    return "Data de término deve ser posterior à data de início";
  }

  const startDateOnly = toDateOnlyString(parsedStartDate);
  const today = getTodayDateOnly();

  if (isCreate && startDateOnly < today) {
    return "Data de início não pode ser no passado";
  }

  if (!isCreate && startDateOnly < today) {
    const existingDateOnly = existingStartDate
      ? toDateOnlyString(new Date(existingStartDate))
      : null;

    if (startDateOnly !== existingDateOnly) {
      return "Data de início não pode ser no passado";
    }
  }

  if (is_active !== undefined && is_active !== null && typeof is_active !== "boolean") {
    return "Status ativo inválido";
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "Descrição inválida";
  }

  return null;
}

function normalizePromotionInput(body, existing) {
  return {
    title: body.title !== undefined ? body.title : existing.title,
    description:
      body.description !== undefined ? body.description : existing.description,
    discount_type:
      body.discount_type !== undefined
        ? body.discount_type
        : existing.discount_type,
    discount_value:
      body.discount_value !== undefined
        ? body.discount_value
        : existing.discount_value,
    start_date:
      body.start_date !== undefined ? body.start_date : existing.start_date,
    end_date: body.end_date !== undefined ? body.end_date : existing.end_date,
    is_active:
      body.is_active !== undefined
        ? body.is_active
        : existing.is_active === 1 || existing.is_active === true,
  };
}

async function buildPromotionWithProducts(promotion) {
  const products = await PromotionProductModel.findProductsByPromotionId(
    promotion.id
  );
  return { ...promotion, products };
}

async function validateProductIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { error: "Lista de produtos é obrigatória" };
  }

  const uniqueIds = [...new Set(productIds.map((id) => parseInt(id, 10)))];

  if (uniqueIds.some((id) => Number.isNaN(id))) {
    return { error: "ID de produto inválido" };
  }

  for (const productId of uniqueIds) {
    const product = await ProductModel.findById(productId);
    if (!product) {
      return { error: `Produto com ID ${productId} não encontrado` };
    }
  }

  return { productIds: uniqueIds };
}

async function index(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const offset = (page - 1) * limit;

  const [promotions, total] = await Promise.all([
    PromotionModel.findAll(limit, offset),
    PromotionModel.count(),
  ]);

  const data = await Promise.all(
    promotions.map(async (promotion) => {
      const product_count = await PromotionProductModel.countByPromotionId(
        promotion.id
      );
      return { ...promotion, product_count };
    })
  );

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

  const promotion = await PromotionModel.findById(id);
  if (!promotion) {
    return res.status(404).json({ message: "Promoção não encontrada" });
  }

  const result = await buildPromotionWithProducts(promotion);
  return res.json(result);
}

async function create(req, res) {
  const {
    title,
    description,
    discount_type,
    discount_value,
    start_date,
    end_date,
    is_active,
    product_ids,
  } = req.body;

  const validationError = validatePromotionFields(
    {
      title,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      is_active: is_active !== undefined ? is_active : true,
    },
    { isCreate: true }
  );

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const id = await PromotionModel.create({
    title: title.trim(),
    description: description?.trim() || null,
    discountType: discount_type,
    discountValue: Number(discount_value),
    startDate: start_date,
    endDate: end_date,
    isActive: is_active !== undefined ? is_active : true,
  });

  if (product_ids !== undefined) {
    const productValidation = await validateProductIds(product_ids);
    if (productValidation.error) {
      await PromotionModel.delete(id);
      return res.status(400).json({ message: productValidation.error });
    }

    await PromotionProductModel.linkProducts(id, productValidation.productIds);
  }

  const promotion = await PromotionModel.findById(id);
  const result = await buildPromotionWithProducts(promotion);
  return res.status(201).json(result);
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const existing = await PromotionModel.findById(id);
  if (!existing) {
    return res.status(404).json({ message: "Promoção não encontrada" });
  }

  const normalized = normalizePromotionInput(req.body, existing);

  const validationError = validatePromotionFields(normalized, {
    isCreate: false,
    existingStartDate: existing.start_date,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  await PromotionModel.update(id, {
    title: normalized.title.trim(),
    description: normalized.description?.trim() || null,
    discountType: normalized.discount_type,
    discountValue: Number(normalized.discount_value),
    startDate: normalized.start_date,
    endDate: normalized.end_date,
    isActive: normalized.is_active,
  });

  const promotion = await PromotionModel.findById(id);
  const result = await buildPromotionWithProducts(promotion);
  return res.json(result);
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const existing = await PromotionModel.findById(id);
  if (!existing) {
    return res.status(404).json({ message: "Promoção não encontrada" });
  }

  await PromotionModel.delete(id);
  return res.json({ message: "Promoção removida com sucesso" });
}

async function linkProducts(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const promotion = await PromotionModel.findById(id);
  if (!promotion) {
    return res.status(404).json({ message: "Promoção não encontrada" });
  }

  const { product_ids } = req.body;
  const productValidation = await validateProductIds(product_ids);

  if (productValidation.error) {
    return res.status(400).json({ message: productValidation.error });
  }

  await PromotionProductModel.linkProducts(id, productValidation.productIds);

  const result = await buildPromotionWithProducts(promotion);
  return res.json(result);
}

async function unlinkProduct(req, res) {
  const id = parseInt(req.params.id, 10);
  const productId = parseInt(req.params.productId, 10);

  if (Number.isNaN(id) || Number.isNaN(productId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const promotion = await PromotionModel.findById(id);
  if (!promotion) {
    return res.status(404).json({ message: "Promoção não encontrada" });
  }

  const link = await PromotionProductModel.findLink(id, productId);
  if (!link) {
    return res.status(404).json({ message: "Vínculo não encontrado" });
  }

  await PromotionProductModel.unlinkProduct(id, productId);

  const result = await buildPromotionWithProducts(promotion);
  return res.json(result);
}

module.exports = {
  index,
  show,
  create,
  update,
  delete: remove,
  linkProducts,
  unlinkProduct,
};
