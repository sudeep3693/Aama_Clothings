/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { Package, Eye, Edit3, Trash2, Layers, DollarSign, ShieldAlert, Check } from "lucide-react";

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  // Edit Modal State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editCategories, setEditCategories] = useState([]);
  const [editSubCategory, setEditSubCategory] = useState("");
  const [editBestseller, setEditBestseller] = useState(false);
  const [editNewInStore, setEditNewInStore] = useState(false);
  const [editPublished, setEditPublished] = useState(true);
  const [editSizes, setEditSizes] = useState([]);
  const [editColors, setEditColors] = useState([]);
  const [editImage1, setEditImage1] = useState(null);

  // Color options
  const [colorsList, setColorsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [newColorInput, setNewColorInput] = useState("");

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
    if (!window.confirm("Are you sure you want to delete this product? All hub inventories for this product will also be archived.")) return;
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

  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {}
      }
      return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditName(product.name || "");
    setEditDescription(product.description || "");
    setEditPrice(product.price || "");
    setEditDiscount(product.discount || 0);

    const cats =
      product.categories && product.categories.length > 0
        ? product.categories
        : parseArray(product.category);
    setEditCategories(cats.length > 0 ? cats : ["Men"]);

    setEditSubCategory(product.subCategory || "");
    setEditBestseller(product.bestseller || false);
    setEditNewInStore(product.newInStore || false);
    setEditPublished(product.published !== undefined ? product.published : true);

    const szs = parseArray(product.sizes);
    setEditSizes(szs.length > 0 ? szs : ["S", "M", "L"]);

    const cols = parseArray(product.colors).map((c) => (typeof c === "object" ? c.name : c));
    setEditColors(cols);

    setEditImage1(null);
  };

  const handleToggleSize = (size) => {
    setEditSizes((prev) =>
      prev.includes(size) ? (prev.length > 1 ? prev.filter((s) => s !== size) : prev) : [...prev, size]
    );
  };

  const handleAddColor = (colorName) => {
    if (!colorName) return;
    if (!editColors.includes(colorName)) {
      setEditColors([...editColors, colorName]);
    }
    setNewColorInput("");
  };

  const handleRemoveColor = (colorName) => {
    setEditColors(editColors.filter((c) => c !== colorName));
  };

  const saveEditHandler = async (e) => {
    e.preventDefault();
    if (editCategories.length === 0) {
      toast.error("Please select at least 1 category");
      return;
    }
    if (editSizes.length === 0) {
      toast.error("Please select at least 1 size");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("id", editingProduct._id || editingProduct.id);
      formData.append("name", editName);
      formData.append("description", editDescription);
      formData.append("price", editPrice);
      formData.append("discount", editDiscount);
      formData.append("category", JSON.stringify(editCategories));
      formData.append("subCategory", editSubCategory);
      formData.append("bestseller", editBestseller);
      formData.append("newInStore", editNewInStore);
      formData.append("published", editPublished);

      // Sizes & Colors variant templates
      formData.append("sizes", JSON.stringify(editSizes));
      formData.append("colors", JSON.stringify(editColors));

      // Build initial variant template combinations for manufacturers
      const variantTemplates = [];
      if (editColors.length > 0) {
        editSizes.forEach((sz) => {
          editColors.forEach((cl) => {
            variantTemplates.push({ size: sz, color: cl });
          });
        });
      } else {
        editSizes.forEach((sz) => {
          variantTemplates.push({ size: sz, color: "Standard" });
        });
      }
      formData.append("variants", JSON.stringify(variantTemplates));

      if (editImage1) {
        formData.append("image1", editImage1);
      }

      const response = await axios.post(
        backendUrl + "/api/product/update",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Product varieties updated!");
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

  const fetchColorsAndCategories = async () => {
    try {
      const [colRes, catRes] = await Promise.all([
        axios.get(backendUrl + "/api/color/list"),
        axios.get(backendUrl + "/api/category/list"),
      ]);
      if (colRes.data.success && colRes.data.colors.length > 0) {
        setColorsList(colRes.data.colors);
      }
      if (catRes.data.success && catRes.data.categories.length > 0) {
        setCategoriesList(catRes.data.categories);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchList();
    fetchColorsAndCategories();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Product Catalog Management</h1>
          <p className="text-xs text-slate-500">
            Define garment styles, retail pricing, and size/color varieties. Stock quantities are submitted by licensed manufacturer hubs.
          </p>
        </div>
        <button
          onClick={fetchList}
          className="text-xs font-semibold bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          Refresh Catalog
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Garment</th>
                <th className="py-3 px-4">Categories</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Varieties (Admin Locked)</th>
                <th className="py-3 px-4 text-center">Hub Network Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {list.map((item, index) => {
                const sizes = parseArray(item.sizes);
                const colors = parseArray(item.colors);
                const isOutOfStock = (item.stockQuantity || 0) <= 0;
                const isLowStock = (item.stockQuantity || 0) <= 5 && !isOutOfStock;

                return (
                  <tr key={index} className={`hover:bg-slate-50/80 transition-colors ${!item.published ? "bg-slate-50/50" : ""}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-11 h-11 object-cover rounded-xl border border-slate-200"
                          src={Array.isArray(item.image) ? item.image[0] : item.image}
                          alt=""
                        />
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <span className="text-[10px] text-slate-400">Sub: {item.subCategory || "General"}</span>
                          <div className="flex gap-1 mt-0.5">
                            {item.newInStore && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold">
                                New In Store
                              </span>
                            )}
                            {item.bestseller && (
                              <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 py-0.2 rounded font-bold">
                                Bestseller
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {(item.categories && item.categories.length > 0
                          ? item.categories
                          : parseArray(item.category)
                        ).map((cat, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {item.discount > 0 ? (
                        <div>
                          <span className="font-bold text-rose-600">
                            {currency}{Math.round(item.price * (1 - item.discount / 100))}
                          </span>{" "}
                          <span className="line-through text-[10px] text-slate-400">{currency}{item.price}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900">{currency}{item.price}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <p><strong className="text-slate-800">Sizes:</strong> {sizes.join(", ") || "None"}</p>
                        {colors.length > 0 && (
                          <p className="text-slate-500">
                            <strong>Colors:</strong> {colors.map(c => typeof c === 'object' ? c.name : c).join(", ")}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Network Hub Stock (Decentralized, read-only) */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-800"
                            : isLowStock
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.stockQuantity || 0} units
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">Managed by Hubs</p>
                    </td>

                    {/* Publishing Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePublishHandler(item._id || item.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-bold cursor-pointer transition-colors ${
                          item.published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {item.published ? "Live" : "Draft"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer shadow-2xs"
                        >
                          Edit Varieties
                        </button>
                        <button
                          onClick={() => removeProduct(item._id || item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- EDIT PRODUCT MODAL (Admin defines varieties & pricing) --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Garment Varieties &amp; Selling Details</h3>
                <p className="text-xs text-slate-500">Configure size &amp; color specifications. Physical inventory count is updated by manufacturers.</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={saveEditHandler} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-700">Garment / Product Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-medium h-20 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Store Selling Price ({currency})</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Discount Percentage (%)</label>
                  <input
                    type="number"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Multi-category Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Categories (Target Segments)</label>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                    {editCategories.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categoriesList.map((c) => {
                    const isSelected = editCategories.includes(c.name);
                    return (
                      <button
                        key={c.id || c.name}
                        type="button"
                        onClick={() => {
                          setEditCategories((prev) =>
                            prev.includes(c.name)
                              ? prev.length === 1
                                ? prev
                                : prev.filter((x) => x !== c.name)
                              : [...prev, c.name]
                          );
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">Sub Category (Garment Type)</label>
                <input
                  type="text"
                  value={editSubCategory}
                  onChange={(e) => setEditSubCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* SIZES CONFIGURATION */}
              <div>
                <label className="block mb-1 font-bold text-slate-700">
                  Allowed Sizes (Manufacturers will maintain stock for these)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((sz) => {
                    const active = editSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3 py-1.5 rounded-xl font-bold border cursor-pointer transition-all ${
                          active
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COLORS CONFIGURATION */}
              <div>
                <label className="block mb-1 font-bold text-slate-700">
                  Allowed Color Varieties
                </label>
                <div className="flex gap-2 mb-2">
                  {colorsList.length > 0 ? (
                    <select
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex-1 focus:outline-none"
                    >
                      <option value="">Select a color to add...</option>
                      {colorsList.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Navy Blue"
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex-1 focus:outline-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddColor(newColorInput)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                  >
                    + Add Color
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editColors.map((colorName, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
                    >
                      {colorName}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(colorName)}
                        className="text-rose-500 font-black hover:text-rose-700 cursor-pointer ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Publishing & Feature toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editBestseller"
                    checked={editBestseller}
                    onChange={(e) => setEditBestseller(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="editBestseller" className="cursor-pointer font-bold text-slate-700">
                    Bestseller
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editNewInStore"
                    checked={editNewInStore}
                    onChange={(e) => setEditNewInStore(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="editNewInStore" className="cursor-pointer font-bold text-amber-800">
                    New in Store Flag
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">Replace Primary Image (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setEditImage1(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Save Varieties &amp; Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
