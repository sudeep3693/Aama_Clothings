/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import { toast } from "react-toastify";

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);

  const loadOrderData = async () => {
    try {
      if (!token) {
        return null;
      }

      const response = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        let allOrdersItem = [];
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item["status"] = order.status;
            item["payment"] = order.payment;
            item["paymentMethod"] = order.paymentMethod;
            item["date"] = order.date;
            item["orderAmount"] = order.amount;
            allOrdersItem.push(item);
          });
        });
        setOrderData(allOrdersItem.reverse());
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>
      <div>
        {orderData.map((item, index) => {
          const unitPrice = Number(item.purchasedUnitPrice ?? item.price ?? 0);
          const qty = Number(item.quantity || 1);
          const lineTotal = unitPrice * qty;

          return (
            <div
              key={index}
              className="py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-start gap-6 text-sm">
                <img className="w-16 sm:w-20" src={item.image[0]} alt="" />
                <div>
                  <p className="sm:text-base font-medium">{item.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-700 flex-wrap">
                    <p className="font-bold text-gray-900">
                      {currency}{lineTotal}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({currency}{unitPrice} x {qty})
                    </p>
                    {item.size && (
                      <span className="px-2 py-0.5 border bg-slate-50 text-xs">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="px-2 py-0.5 border bg-slate-50 text-xs">
                        Color: {item.color}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs">
                    Order Total:{" "}
                    <strong className="text-gray-900">
                      {currency}{item.orderAmount}
                    </strong>
                  </p>
                  <p className="mt-0.5 text-xs">
                    Date:{" "}
                    <span className="text-gray-500">
                      {new Date(item.date).toDateString()}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs">
                    Payment:{" "}
                    <span className="text-gray-500">
                      {item.paymentMethod} ({item.payment ? "Paid" : "Pending"})
                    </span>
                  </p>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-between">
                <div className="flex items-center gap-2">
                  <p className="min-w-2 h-2 rounded-full bg-green-500"></p>
                  <p className="text-sm md:text-base">{item.status}</p>
                </div>
                <button
                  onClick={loadOrderData}
                  className="border px-4 py-2 text-sm font-medium rounded-sm"
                >
                  Track Order
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
