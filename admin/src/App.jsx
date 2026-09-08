import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Categories from "./pages/Categories";
import Reviews from "./pages/Reviews";
import ShippingSettings from "./pages/ShippingSettings";
import Customers from "./pages/Customers";
import LoyaltyLevels from "./pages/LoyaltyLevels";
import CreateOrder from "./pages/CreateOrder";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "Rs ";

const App = () => {
  // Retrieve the token from localStorage only on the initial render
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  // Store token in localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token"); // Optionally, clear the token if it's removed
    }
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />
          <hr />
          <div className="flex w-full">
            <Sidebar />
            <div className="w-[70%] mx-auto ml-[max(5vw, 25px)] my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/create-order" element={<CreateOrder token={token} />} />
                <Route path="/add-order" element={<CreateOrder token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
                <Route path="/customers" element={<Customers token={token} />} />
                <Route path="/loyalty-levels" element={<LoyaltyLevels token={token} />} />
                <Route path="/categories" element={<Categories token={token} />} />
                <Route path="/reviews" element={<Reviews token={token} />} />
                <Route path="/shipping" element={<ShippingSettings token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
