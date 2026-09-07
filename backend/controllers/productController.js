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

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: typeof sizes === "string" ? JSON.parse(sizes) : sizes,
      image: imagesUrl,
      bestseller: bestseller === "true" || bestseller === true ? true : false,
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

    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(category && { category }),
      ...(subCategory && { subCategory }),
      ...(sizes && { sizes: typeof sizes === "string" ? JSON.parse(sizes) : sizes }),
      image: imagesUrl,
      ...(bestseller !== undefined && { bestseller: bestseller === "true" || bestseller === true }),
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

    const rawProducts = await prisma.product.findMany({ where: whereCondition });
    const products = rawProducts.map((item) => ({
      ...item,
      _id: item.id,
      date: Number(item.date),
      image: toImageArray(item.image),
    }));
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
    const product = {
      ...rawProduct,
      _id: rawProduct.id,
      date: Number(rawProduct.date),
      image: toImageArray(rawProduct.image),
    };
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addProduct, updateProduct, togglePublish, listProducts, removeProduct, singleProduct };
