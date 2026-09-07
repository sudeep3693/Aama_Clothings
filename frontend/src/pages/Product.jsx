import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import ReviewSection from "../components/ReviewSection";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [activeTab, setActiveTab] = useState("reviews"); // "description" | "reviews"
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0 });

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.image[0]);
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  const renderTopStars = (score) => {
    const rounded = Math.round(score || 0);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <img
          key={i}
          className="w-3.5 h-3.5"
          src={i <= rounded ? assets.star_icon : assets.star_dull_icon}
          alt=""
        />
      );
    }
    return stars;
  };

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* --- Product Data --- */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* --- Product Images --- */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>
        {/* --- Product Info --- */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {renderTopStars(reviewStats.averageRating)}
            </div>
            <span className="text-xs font-semibold text-amber-600 pl-1">
              {reviewStats.averageRating > 0 ? reviewStats.averageRating : ""}
            </span>
            <p className="text-xs text-gray-500 pl-1">
              ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? "review" : "reviews"})
            </p>
          </div>
          {productData.discount > 0 ? (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-bold text-red-600">
                {currency}{Math.round(productData.price * (1 - productData.discount / 100))}
              </span>
              <span className="text-xl text-gray-400 line-through">
                {currency}{productData.price}
              </span>
              <span className="bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-1 rounded">
                {productData.discount}% OFF
              </span>
            </div>
          ) : (
            <p className="mt-4 text-3xl font-medium">
              {currency}
              {productData.price}
            </p>
          )}

          {/* Stock Status Badge */}
          <div className="mt-3">
            {productData.stockQuantity <= 0 ? (
              <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded">
                Currently Out of Stock
              </span>
            ) : (
              <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded">
                In Stock & Ready to Ship
              </span>
            )}
          </div>

          <p className="mt-4 text-gray-500 md:w-4/5">
            {productData.description}
          </p>
          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
              {productData.sizes?.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 bg-gray-100 ${
                    item === size ? "border-orange-500" : ""
                  }`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {productData.colors && productData.colors.length > 0 && (
            <div className="flex flex-col gap-4 my-8">
              <p>Select Color</p>
              <div className="flex gap-2">
                {productData.colors.map((item, index) => (
                  <button
                    onClick={() => setColor(item)}
                    className={`border py-2 px-4 bg-gray-100 ${
                      item === color ? "border-orange-500" : ""
                    }`}
                    key={index}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(() => {
            const parsedVariants = typeof productData.variants === "string"
              ? JSON.parse(productData.variants || "[]")
              : (productData.variants || []);
            const hasVariants = Array.isArray(parsedVariants) && parsedVariants.length > 0;
            let currentVariant = null;

            if (hasVariants) {
              currentVariant = parsedVariants.find(
                (v) => v.size === size && v.color === color
              );
            }

            const isOutOfStock = hasVariants
              ? (size && color ? (currentVariant ? currentVariant.quantity <= 0 : true) : false)
              : productData.stockQuantity <= 0;

            const currentQty = hasVariants && currentVariant ? currentVariant.quantity : productData.stockQuantity;
            const showLowStock = (size && color && hasVariants) || !hasVariants
              ? currentQty > 0 && currentQty < 10
              : false;

            if (productData.stockQuantity <= 0 || isOutOfStock) {
              return (
                <button
                  disabled
                  className="bg-gray-400 text-white px-8 py-3 text-sm cursor-not-allowed rounded"
                >
                  OUT OF STOCK
                </button>
              );
            }

            return (
              <>
                {showLowStock && (
                  <p className="text-amber-600 font-semibold text-sm mb-3 animate-pulse">
                    ⚠️ Only {currentQty} left in stock — order soon!
                  </p>
                )}
                <button
                  onClick={() => addToCart(productData._id, size, color)}
                  className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700 hover:bg-gray-800 transition-colors rounded"
                >
                  ADD TO CART
                </button>
              </>
            );
          })()}
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100 Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>
      {/* --- Description & Review Section */}
      <div className="mt-20">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("description")}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "description"
                ? "border-black text-black bg-white"
                : "border-transparent text-gray-500 hover:text-black bg-gray-50"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "reviews"
                ? "border-black text-black bg-white"
                : "border-transparent text-gray-500 hover:text-black bg-gray-50"
            }`}
          >
            <span>Customer Reviews</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "reviews" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
            }`}>
              {reviewStats.totalReviews}
            </span>
          </button>
        </div>

        {activeTab === "description" ? (
          <div className="flex flex-col gap-4 border border-t-0 px-6 py-6 text-sm text-gray-600 bg-white rounded-b-xl leading-relaxed">
            <p>
              {productData.description || "An authentic premium quality product crafted with attention to details and comfortable fabrics."}
            </p>
            <p>
              E-commerce websites typically display products or services along
              with detailed descriptions, images, prices, and any available
              variations (e.g., sizes, colors). Each product usually has its own
              dedicated page with relevant information.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-t-0 px-6 py-6 rounded-b-xl">
            <ReviewSection
              productId={productData._id}
              productName={productData.name}
              onStatsUpdate={(newStats) => setReviewStats(newStats)}
            />
          </div>
        )}
      </div>
      {/* --- Display related products --- */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;
