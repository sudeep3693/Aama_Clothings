/* eslint-disable no-unused-vars */
import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

/**
 * CartTotal - reusable cart summary.
 * @param {number} [deliveryFee]      – override shipping fee (e.g. from PlaceOrder dynamic calc)
 * @param {string} [shippingLabel]    – human-readable label (e.g. "Inside Kathmandu")
 * @param {number} [loyaltyDiscount]  – active loyalty tier price discount
 * @param {string} [loyaltyLabel]     – badge/description for the loyalty reward
 * @param {object} [loyaltyGift]      – { amount, description, letterIncluded, customPerk }
 */
const CartTotal = ({
  deliveryFee,
  shippingLabel,
  loyaltyDiscount = 0,
  loyaltyLabel,
  loyaltyGift,
}) => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);

  const resolvedFee = deliveryFee !== undefined ? deliveryFee : delivery_fee;
  const subtotal = getCartAmount();
  const grandTotal = Math.max(0, subtotal === 0 ? 0 : subtotal + resolvedFee - loyaltyDiscount);

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTALS"} />
      </div>
      <div className="flex flex-col gap-2 mt-2 text-sm">

        {/* Subtotal */}
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p>{currency} {subtotal}.00</p>
        </div>
        <hr />

        {/* VIP Price Discount */}
        {loyaltyDiscount > 0 && (
          <>
            <div className="flex justify-between items-start text-emerald-600 font-semibold">
              <div>
                <p>VIP Level Discount</p>
                {loyaltyLabel && (
                  <p className="text-[11px] text-emerald-500 font-normal">{loyaltyLabel}</p>
                )}
              </div>
              <p>- {currency} {loyaltyDiscount}.00</p>
            </div>
            <hr />
          </>
        )}

        {/* Gift Voucher / Special Item */}
        {loyaltyGift && (loyaltyGift.amount > 0 || loyaltyGift.description) && (
          <>
            <div className="flex justify-between items-start text-indigo-600 font-semibold">
              <div>
                <p className="flex items-center gap-1">Complimentary Gift</p>
                {loyaltyGift.description && (
                  <p className="text-[11px] text-indigo-500 font-normal">{loyaltyGift.description}</p>
                )}
              </div>
              {loyaltyGift.amount > 0 && (
                <p>Rs. {loyaltyGift.amount} value</p>
              )}
            </div>
            <hr />
          </>
        )}

        {/* Handwritten Letter */}
        {loyaltyGift?.letterIncluded && (
          <>
            <div className="flex justify-between items-center text-violet-600 font-semibold">
              <p className="flex items-center gap-1">Handwritten Thank-You Note</p>
              <p className="text-[11px] font-semibold">Included</p>
            </div>
            <hr />
          </>
        )}

        {/* Custom VIP Perk */}
        {loyaltyGift?.customPerk && (
          <>
            <div className="flex justify-between items-center text-amber-700 font-semibold">
              <p className="flex items-center gap-1">{loyaltyGift.customPerk}</p>
              <p className="text-[11px] font-semibold text-amber-600">VIP Perk</p>
            </div>
            <hr />
          </>
        )}

        {/* Shipping Fee */}
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

        {/* Grand Total */}
        <div className="flex justify-between text-base">
          <b>Total</b>
          <b className="text-gray-900">{currency} {grandTotal}.00</b>
        </div>

      </div>
    </div>
  );
};

export default CartTotal;
