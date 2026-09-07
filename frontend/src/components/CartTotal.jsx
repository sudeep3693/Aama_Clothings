/* eslint-disable no-unused-vars */
import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

/**
 * CartTotal - reusable cart summary.
 * @param {number} [deliveryFee]   – override shipping fee (e.g. from PlaceOrder dynamic calc)
 * @param {string} [shippingLabel] – human-readable label (e.g. "Inside Kathmandu")
 */
const CartTotal = ({ deliveryFee, shippingLabel }) => {
  const { currency, delivery_fee, getCartAmount, shippingConfig } = useContext(ShopContext);

  // Resolve the shipping fee to display
  const resolvedFee = deliveryFee !== undefined ? deliveryFee : delivery_fee;
  const subtotal = getCartAmount();

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTALS"} />
      </div>
      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p>
            {currency} {subtotal}.00
          </p>
        </div>
        <hr />
        <div className="flex justify-between items-start">
          <div>
            <p>Shipping Fee</p>
            {shippingLabel && (
              <p className="text-[11px] text-gray-400">{shippingLabel}</p>
            )}
          </div>
          <p className={resolvedFee === 0 ? "text-green-600 font-semibold" : ""}>
            {resolvedFee === 0 ? "FREE" : `${currency} ${resolvedFee}.00`}
          </p>
        </div>
        <hr />
        <div className="flex justify-between">
          <b>Total</b>
          <b>
            {currency}
            {subtotal === 0 ? 0 : subtotal + resolvedFee}.00
          </b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;

