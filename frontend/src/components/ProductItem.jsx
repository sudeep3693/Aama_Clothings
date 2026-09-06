/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price, discount }) => {
  const { currency } = useContext(ShopContext);
  const finalPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

  return (
    <Link className="text-gray-700 cursor-pointer block relative group" to={`/product/${id}`}>
      <div className="overflow-hidden relative rounded">
        <img
          className="hover:scale-110 transition ease-in-out duration-300 w-full"
          src={image[0]}
          alt={name}
        />
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
            {discount}% OFF
          </span>
        )}
      </div>
      <p className="pt-3 pb-1 text-sm font-medium truncate">{name}</p>
      {discount > 0 ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-red-600">
            {currency}{finalPrice}
          </span>
          <span className="text-xs text-gray-400 line-through">
            {currency}{price}
          </span>
        </div>
      ) : (
        <p className="text-sm font-medium">
          {currency}{price}
        </p>
      )}
    </Link>
  );
};

export default ProductItem;
