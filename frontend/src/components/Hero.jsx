/* eslint-disable no-unused-vars */
import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const Hero = () => {
  const { products, currency } = useContext(ShopContext);

  // Find the designated "New in Store" product, or fallback to the latest added product
  const featuredProduct = products.find((p) => p.newInStore) || (products.length > 0 ? products[0] : null);

  const heroImage =
    featuredProduct && featuredProduct.image && featuredProduct.image.length > 0
      ? featuredProduct.image[0]
      : assets.hero_img;

  const finalPrice = featuredProduct
    ? featuredProduct.discount > 0
      ? Math.round(featuredProduct.price * (1 - featuredProduct.discount / 100))
      : featuredProduct.price
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-100/70 shadow-xs flex flex-col sm:flex-row items-stretch">
      {/* Hero Left Content */}
      <div className="w-full sm:w-1/2 flex flex-col justify-center px-6 py-8 sm:py-12 md:px-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-8 md:w-10 h-[2px] bg-gray-900"></span>
            <span className="font-bold text-xs uppercase tracking-widest text-gray-700">
              {featuredProduct?.newInStore ? "FEATURED ARRIVAL" : "TRENDING NOW"}
            </span>
          </div>

          <div>
            <h1 className="prata-regular text-3xl sm:text-4xl lg:text-5xl text-gray-900 leading-tight">
              NEW IN STORE
            </h1>
            {featuredProduct ? (
              <p className="mt-2 text-base sm:text-lg font-medium text-gray-700 truncate max-w-md">
                {featuredProduct.name}
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Discover the latest arrivals hand-picked for this season.
              </p>
            )}
          </div>

          {featuredProduct && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {currency}{finalPrice}
                </span>
                {featuredProduct.discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    {currency}{featuredProduct.price}
                  </span>
                )}
              </div>
              {featuredProduct.discount > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  {featuredProduct.discount}% OFF
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {featuredProduct ? (
              <Link
                to={`/product/${featuredProduct._id}`}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 shadow-xs hover:shadow-md transform hover:-translate-y-0.5"
              >
                <span>Shop Product</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : null}
            <Link
              to="/collection"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:border-gray-400"
            >
              <span>Explore Collection</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Right Image */}
      <div className="w-full sm:w-1/2 relative bg-gray-100 flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[420px]">
        {featuredProduct ? (
          <Link to={`/product/${featuredProduct._id}`} className="block w-full h-full group relative">
            <img
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              src={heroImage}
              alt={featuredProduct.name || "New In Store"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity"></div>
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg shadow-sm text-xs font-semibold text-gray-900 border border-gray-100">
              Featured Item
            </div>
          </Link>
        ) : (
          <img
            className="w-full h-full object-cover object-center"
            src={heroImage}
            alt="Hero"
          />
        )}
      </div>
    </div>
  );
};

export default Hero;
