import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../config/db.js";

// Helper: safely convert Prisma JSON field to plain array
const toImageArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  // Prisma sometimes wraps JSON as a special object
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

// Helper: normalize category input into a clean string array
const normalizeCategories = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
      } catch {}
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      newInStore,
      discount,
      costPrice,
      stockQuantity,
      lowStockThreshold,
      colors,
      variants,
      published,
    } = req.body;

    const image1 = req.files?.image1 && req.files.image1[0];
    const image2 = req.files?.image2 && req.files.image2[0];
    const image3 = req.files?.image3 && req.files.image3[0];
    const image4 = req.files?.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const qty = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : 0;
    const categoriesArray = normalizeCategories(category);
    const isNewInStore = newInStore === "true" || newInStore === true;

    // If marked as new in store, ensure all existing products have newInStore = false
    if (isNewInStore) {
      await prisma.product.updateMany({
        data: { newInStore: false },
      });
    }

    const productData = {
      name,
      description,
      price: Number(price),
      category: JSON.stringify(categoriesArray),
      subCategory,
      sizes: typeof sizes === "string" ? JSON.parse(sizes) : sizes,
      image: imagesUrl,
      bestseller: bestseller === "true" || bestseller === true ? true : false,
      newInStore: isNewInStore,
      discount: discount ? Number(discount) : 0,
      costPrice: costPrice !== undefined && costPrice !== null && costPrice !== "" ? Number(costPrice) : 0,
      stockQuantity: qty,
      lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold, 10) : 5,
      colors: typeof colors === "string" ? JSON.parse(colors) : colors || [],
      variants: typeof variants === "string" ? JSON.parse(variants) : variants || [],
      published: published === "false" || published === false ? false : true,
      date: BigInt(Date.now()),
    };

    const newProduct = await prisma.product.create({ data: productData });

    // Log initial stock
    if (qty > 0) {
      await prisma.stockLog.create({
        data: {
          productId: newProduct.id,
          productName: name,
          previousQty: 0,
          newQty: qty,
          changeQty: qty,
          reason: "INITIAL_STOCK",
          note: "Stock set during product creation",
          source: "admin",
        },
      });
    }

    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for updating product details & images
const updateProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      newInStore,
      discount,
      stockQuantity,
      lowStockThreshold,
      colors,
      variants,
      published,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Convert existing image (Prisma JSON) to a plain JS array
    let imagesUrl = toImageArray(existingProduct.image);

    // Check if new images were uploaded
    if (req.files) {
      const img1 = req.files.image1 && req.files.image1[0];
      const img2 = req.files.image2 && req.files.image2[0];
      const img3 = req.files.image3 && req.files.image3[0];
      const img4 = req.files.image4 && req.files.image4[0];

      const newImages = [img1, img2, img3, img4].filter(
        (item) => item !== undefined && item !== false
      );

      if (newImages.length > 0) {
        imagesUrl = await Promise.all(
          newImages.map(async (item) => {
            const result = await cloudinary.uploader.upload(item.path, {
              resource_type: "image",
            });
            return result.secure_url;
          })
        );
      }
    }

    // Determine stock quantity
    let newQty = existingProduct.stockQuantity;
    if (stockQuantity !== undefined && stockQuantity !== "") {
      newQty = parseInt(stockQuantity, 10);
    }

    const categoryStorage =
      category !== undefined ? JSON.stringify(normalizeCategories(category)) : undefined;

    let isNewInStore = undefined;
    if (newInStore !== undefined) {
      isNewInStore = newInStore === "true" || newInStore === true;
      if (isNewInStore) {
        // Unset any other product that had newInStore = true
        await prisma.product.updateMany({
          where: { id: { not: id } },
          data: { newInStore: false },
        });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(categoryStorage !== undefined && { category: categoryStorage }),
      ...(subCategory && { subCategory }),
      ...(sizes && { sizes: typeof sizes === "string" ? JSON.parse(sizes) : sizes }),
      image: imagesUrl,
      ...(bestseller !== undefined && { bestseller: bestseller === "true" || bestseller === true }),
      ...(isNewInStore !== undefined && { newInStore: isNewInStore }),
      ...(discount !== undefined && { discount: Number(discount) }),
      ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
      stockQuantity: newQty,
      ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold, 10) }),
      ...(colors !== undefined && { colors: typeof colors === "string" ? JSON.parse(colors) : colors }),
      ...(variants !== undefined && { variants: typeof variants === "string" ? JSON.parse(variants) : variants }),
      ...(published !== undefined && { published: published === "true" || published === true }),
    };

    await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, message: "Product Updated Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function to toggle product published/unpublished status
const togglePublish = async (req, res) => {
  try {
    const { id } = req.body;
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { published: !existingProduct.published },
    });

    const statusText = updatedProduct.published ? "Published" : "Unpublished";
    res.json({ success: true, message: `Product is now ${statusText}`, published: updatedProduct.published });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for list products
const listProducts = async (req, res) => {
  try {
    const isAdmin = req.headers.token || req.query.admin === "true";

    // Admin sees all products; Public customers see only published products
    const whereCondition = isAdmin ? {} : { published: true };

    const [rawProducts, allReviews] = await Promise.all([
      prisma.product.findMany({
        where: whereCondition,
        orderBy: { date: "desc" },
      }),
      prisma.review.findMany({
        select: { productId: true, rating: true },
      }),
    ]);

    // Build rating lookup map per product
    const reviewStatsMap = {};
    for (const r of allReviews) {
      if (!reviewStatsMap[r.productId]) {
        reviewStatsMap[r.productId] = { sum: 0, count: 0 };
      }
      reviewStatsMap[r.productId].sum += Number(r.rating) || 5;
      reviewStatsMap[r.productId].count += 1;
    }

    const products = rawProducts.map((item) => {
      const cats = normalizeCategories(item.category);
      const rStats = reviewStatsMap[item.id] || { sum: 0, count: 0 };
      const avgRating = rStats.count > 0 ? Number((rStats.sum / rStats.count).toFixed(1)) : 0;

      return {
        ...item,
        _id: item.id,
        date: Number(item.date),
        image: toImageArray(item.image),
        categories: cats,
        category: cats.join(", "),
        newInStore: Boolean(item.newInStore),
        costPrice: Number(item.costPrice || 0),
        lowStockThreshold: item.lowStockThreshold || 5,
        rating: avgRating,
        reviewCount: rStats.count,
      };
    });

    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
    await prisma.product.delete({
      where: { id: id },
    });
    res.json({ success: true, message: "Product Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const rawProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!rawProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Get review stats
    const productReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });
    let ratingSum = 0;
    for (const r of productReviews) {
      ratingSum += Number(r.rating) || 5;
    }
    const avgRating = productReviews.length > 0 ? Number((ratingSum / productReviews.length).toFixed(1)) : 0;

    const cats = normalizeCategories(rawProduct.category);
    const product = {
      ...rawProduct,
      _id: rawProduct.id,
      date: Number(rawProduct.date),
      image: toImageArray(rawProduct.image),
      categories: cats,
      category: cats.join(", "),
      newInStore: Boolean(rawProduct.newInStore),
      costPrice: Number(rawProduct.costPrice || 0),
      lowStockThreshold: rawProduct.lowStockThreshold || 5,
      rating: avgRating,
      reviewCount: productReviews.length,
    };
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Adjust stock for a product (restock, manual correction, return)
const adjustStock = async (req, res) => {
  try {
    const { productId, adjustments, reason, note, source } = req.body;

    if (!productId || !adjustments || !reason) {
      return res.json({ success: false, message: "productId, adjustments, and reason are required" });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    let parsedVariants = typeof product.variants === "string"
      ? JSON.parse(product.variants || "[]")
      : (product.variants || []);
    const hasVariants = Array.isArray(parsedVariants) && parsedVariants.length > 0;

    const stockLogs = [];

    if (hasVariants && adjustments.length > 0 && adjustments[0].size) {
      // Variant-level adjustments
      for (const adj of adjustments) {
        const vIdx = parsedVariants.findIndex(
          (v) => v.size === adj.size && v.color === adj.color
        );
        if (vIdx !== -1) {
          const previousQty = Number(parsedVariants[vIdx].quantity || 0);
          const changeQty = Number(adj.quantity || 0);
          const newQty = Math.max(0, previousQty + changeQty);
          parsedVariants[vIdx].quantity = newQty;

          stockLogs.push({
            productId,
            productName: product.name,
            variantLabel: `${adj.size} / ${adj.color}`,
            previousQty,
            newQty,
            changeQty,
            reason,
            note: note || null,
            source: source || "admin",
          });
        }
      }

      // Sync total stockQuantity from variants
      const totalVariantStock = parsedVariants.reduce(
        (acc, v) => acc + (Number(v.quantity) || 0), 0
      );

      await prisma.product.update({
        where: { id: productId },
        data: { variants: parsedVariants, stockQuantity: totalVariantStock },
      });
    } else {
      // Simple product-level stock adjustment
      const totalChange = adjustments.reduce((sum, a) => sum + Number(a.quantity || 0), 0);
      const previousQty = product.stockQuantity || 0;
      const newQty = Math.max(0, previousQty + totalChange);

      stockLogs.push({
        productId,
        productName: product.name,
        previousQty,
        newQty,
        changeQty: totalChange,
        reason,
        note: note || null,
        source: source || "admin",
      });

      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newQty },
      });
    }

    // Create stock log entries
    if (stockLogs.length > 0) {
      await prisma.stockLog.createMany({ data: stockLogs });
    }

    res.json({ success: true, message: "Stock adjusted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get stock movement logs (filterable, paginated)
const getStockLogs = async (req, res) => {
  try {
    const { productId, limit, offset } = req.query;
    const take = parseInt(limit) || 50;
    const skip = parseInt(offset) || 0;

    const where = productId ? { productId } : {};

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.stockLog.count({ where }),
    ]);

    res.json({ success: true, logs, total });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addProduct, updateProduct, togglePublish, listProducts, removeProduct, singleProduct, adjustStock, getStockLogs };
