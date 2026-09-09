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
      stockQuantity,
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
      stockQuantity: qty,
      colors: typeof colors === "string" ? JSON.parse(colors) : colors || [],
      variants: typeof variants === "string" ? JSON.parse(variants) : variants || [],
      published: published === "false" || published === false ? false : true,
      date: BigInt(Date.now()),
    };

    await prisma.product.create({ data: productData });

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
      stockQuantity: newQty,
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
      rating: avgRating,
      reviewCount: productReviews.length,
    };
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addProduct, updateProduct, togglePublish, listProducts, removeProduct, singleProduct };
