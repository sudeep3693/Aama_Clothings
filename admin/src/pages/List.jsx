/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  // Edit Modal State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSubCategory, setEditSubCategory] = useState("");
  const [editBestseller, setEditBestseller] = useState(false);
  const [editPublished, setEditPublished] = useState(true);
  const [editVariants, setEditVariants] = useState([]);
  const [variantSize, setVariantSize] = useState("S");
  const [variantColor, setVariantColor] = useState("");
  const [variantQty, setVariantQty] = useState("");
  const [editImage1, setEditImage1] = useState(null);
  const [colorsList, setColorsList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list", {
        headers: { token },
      });
      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const togglePublishHandler = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/toggle-publish",
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditName(product.name || "");
    setEditDescription(product.description || "");
    setEditPrice(product.price || "");
    setEditDiscount(product.discount || 0);
    setEditCategory(product.category || "");
    setEditSubCategory(product.subCategory || "");
    setEditBestseller(product.bestseller || false);
    setEditPublished(product.published !== undefined ? product.published : true);
    setEditVariants(product.variants || []);
    setVariantSize("S");
    setVariantColor("");
    setVariantQty("");
    setEditImage1(null);
  };

  const saveEditHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("id", editingProduct._id);
      formData.append("name", editName);
      formData.append("description", editDescription);
      formData.append("price", editPrice);
      formData.append("discount", editDiscount);
      formData.append("category", editCategory);
      formData.append("subCategory", editSubCategory);
      
      const computedStockQuantity = editVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
      formData.append("stockQuantity", computedStockQuantity);
      
      formData.append("bestseller", editBestseller);
      formData.append("published", editPublished);
      
      const allSizes = [...new Set(editVariants.map(v => v.size))];
      const allColors = [...new Set(editVariants.map(v => v.color))];
      formData.append("sizes", JSON.stringify(allSizes));
      formData.append("colors", JSON.stringify(allColors));
      formData.append("variants", JSON.stringify(editVariants));

      if (editImage1) {
        formData.append("image1", editImage1);
      }

      const response = await axios.post(
        backendUrl + "/api/product/update",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setEditingProduct(null);
        fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/color/list");
      if (response.data.success && response.data.colors.length > 0) {
        setColorsList(response.data.colors);
        setVariantColor(response.data.colors[0].name);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchList();
    fetchColors();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl font-semibold">All Products Inventory</p>
        <button
          onClick={fetchList}
          className="text-xs bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300"
        >
          Refresh List
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {/* --- List Table Title --- */}
        <div className="hidden md:grid grid-cols-[1fr_2.5fr_1fr_1.2fr_1.2fr_1.2fr_1.5fr] items-center py-2 px-3 border bg-gray-100 text-sm font-medium">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Stock Status</b>
          <b>Publishing</b>
          <b className="text-center">Actions</b>
        </div>

        {/* --- Product List --- */}
        {list.map((item, index) => (
          <div
            className={`grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_2.5fr_1fr_1.2fr_1.2fr_1.2fr_1.5fr] items-center gap-2 py-2 px-3 border text-sm rounded ${
              !item.published ? "bg-gray-50 opacity-75" : "bg-white"
            }`}
            key={index}
          >
            <img className="w-12 h-12 object-cover rounded" src={item.image[0]} alt="" />
            <div>
              <p className="font-medium text-gray-800">{item.name}</p>
              {item.bestseller && (
                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-semibold">
                  Bestseller
                </span>
              )}
            </div>
            <p className="text-gray-600">{item.category}</p>
            <div>
              {item.discount > 0 ? (
                <div>
                  <span className="font-semibold text-red-600">
                    {currency}{Math.round(item.price * (1 - item.discount / 100))}
                  </span>{" "}
                  <span className="line-through text-xs text-gray-400">{currency}{item.price}</span>
                </div>
              ) : (
                <span className="font-medium">{currency}{item.price}</span>
              )}
            </div>

            {/* Stock Status Badge */}
            <div>
              {item.stockQuantity <= 0 ? (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                  Out of Stock
                </span>
              ) : (
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                  In Stock
                </span>
              )}
              {item.stockQuantity > 0 && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {item.stockQuantity} left
                </p>
              )}
            </div>

            {/* Publish Toggle Button */}
            <div>
              <button
                onClick={() => togglePublishHandler(item._id)}
                className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                  item.published
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                }`}
              >
                {item.published ? "✓ Published" : "✕ Unpublished"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => openEditModal(item)}
                className="bg-gray-800 text-white text-xs px-2.5 py-1 rounded hover:bg-gray-700"
              >
                Edit
              </button>
              <button
                onClick={() => removeProduct(item._id)}
                className="bg-red-600 text-white text-xs px-2.5 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- EDIT PRODUCT MODAL --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-bold mb-4">Edit Product Details</h3>
            <form onSubmit={saveEditHandler} className="flex flex-col gap-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Product Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border px-3 py-2 rounded h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Price ({currency})</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Discount (%)</label>
                  <input
                    type="number"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <p className="block mb-1 font-medium">Variants</p>
                <div className="flex gap-3 mb-3 items-end">
                  <div>
                    <p className="text-xs mb-1">Size</p>
                    <select
                      value={variantSize}
                      onChange={(e) => setVariantSize(e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      {["S", "M", "L", "XL", "XXL"].map((sz) => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs mb-1">Color</p>
                    {colorsList.length > 0 ? (
                      <select
                        value={variantColor}
                        onChange={(e) => setVariantColor(e.target.value)}
                        className="border px-2 py-1 rounded w-28"
                      >
                        {colorsList.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Red"
                        value={variantColor}
                        onChange={(e) => setVariantColor(e.target.value)}
                        className="border px-2 py-1 rounded w-24"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-xs mb-1">Qty</p>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={variantQty}
                      onChange={(e) => setVariantQty(e.target.value)}
                      className="border px-2 py-1 rounded w-16"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (variantColor && variantQty !== "") {
                        setEditVariants([...editVariants, { size: variantSize, color: variantColor, quantity: Number(variantQty) }]);
                        setVariantColor("");
                        setVariantQty("");
                      }
                    }}
                    className="bg-black text-white px-3 py-1 rounded text-sm mb-[1px]"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-w-sm">
                  {editVariants.map((v, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded text-sm border">
                      <span>{v.size} / {v.color} - Qty: {v.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setEditVariants(editVariants.filter((_, i) => i !== idx))}
                        className="text-red-500 font-bold hover:text-red-700"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Publishing</label>
                <select
                  value={editPublished ? "true" : "false"}
                  onChange={(e) => setEditPublished(e.target.value === "true")}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="true">Published</option>
                  <option value="false">Unpublished</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">Replace Primary Image (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setEditImage1(e.target.files[0])}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="editBestseller"
                  checked={editBestseller}
                  onChange={(e) => setEditBestseller(e.target.checked)}
                />
                <label htmlFor="editBestseller" className="cursor-pointer">
                  Bestseller Product
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default List;
