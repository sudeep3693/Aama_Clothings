/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDesription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["Men"]);
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestSeller] = useState(false);
  const [variants, setVariants] = useState([]);
  const [variantSize, setVariantSize] = useState("S");
  const [variantColor, setVariantColor] = useState("");
  const [variantQty, setVariantQty] = useState("");
  const [published, setPublished] = useState(true);

  const [customCategory, setCustomCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);

  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [colorsList, setColorsList] = useState([]);

  const fetchOptions = async () => {
    try {
      const [catRes, subRes, colRes] = await Promise.all([
        axios.get(backendUrl + "/api/category/list"),
        axios.get(backendUrl + "/api/subcategory/list"),
        axios.get(backendUrl + "/api/color/list"),
      ]);
      if (catRes.data.success && catRes.data.categories.length > 0) {
        setCategoriesList(catRes.data.categories);
        setSelectedCategories((prev) => (prev.length > 0 ? prev : [catRes.data.categories[0].name]));
      }
      if (subRes.data.success && subRes.data.subCategories.length > 0) {
        setSubCategoriesList(subRes.data.subCategories);
        if (!isCustomSubCategory) {
          setSubCategory(subRes.data.subCategories[0].name);
        }
      }
      if (colRes.data.success && colRes.data.colors.length > 0) {
        setColorsList(colRes.data.colors);
        setVariantColor(colRes.data.colors[0].name);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const toggleCategorySelection = (catName) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catName)) {
        if (prev.length === 1) {
          toast.warning("Please keep at least 1 category selected.");
          return prev;
        }
        return prev.filter((c) => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const handleAddNewCategoryInline = async (e) => {
    e.preventDefault();
    const trimmed = customCategory.trim();
    if (!trimmed) return;

    try {
      const res = await axios.post(
        backendUrl + "/api/category/add",
        { name: trimmed },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(`Category "${trimmed}" added!`);
        setCategoriesList((prev) =>
          prev.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
            ? prev
            : [...prev, { id: Date.now().toString(), name: trimmed }]
        );
        setSelectedCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
        setCustomCategory("");
        setIsAddingNewCategory(false);
      } else {
        toast.error(res.data.message || "Failed to add category");
      }
    } catch (err) {
      toast.error(err.message || "Failed to add category");
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category for the product.");
      return;
    }

    try {
      let finalSubCategory = subCategory;
      if (isCustomSubCategory && customSubCategory.trim()) {
        finalSubCategory = customSubCategory.trim();
        // Save new subcategory to backend DB
        await axios
          .post(
            backendUrl + "/api/subcategory/add",
            { name: finalSubCategory },
            { headers: { token } }
          )
          .catch(() => {});
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("discount", discount);
      formData.append("category", JSON.stringify(selectedCategories));
      formData.append("subCategory", finalSubCategory);
      formData.append("bestseller", bestseller);
      
      const computedStockQuantity = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
      formData.append("stockQuantity", computedStockQuantity);
      
      const allSizes = [...new Set(variants.map(v => v.size))];
      const allColors = [...new Set(variants.map(v => v.color))];
      formData.append("sizes", JSON.stringify(allSizes));
      formData.append("colors", JSON.stringify(allColors));
      formData.append("variants", JSON.stringify(variants));
      formData.append("published", published);

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(
        backendUrl + "/api/product/add",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setName("");
        setDesription("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setPrice("");
        setDiscount("");
        setVariants([]);
        setVariantSize("S");
        setVariantColor("");
        setSelectedCategories(categoriesList.length > 0 ? [categoriesList[0].name] : ["Men"]);
        setVariantQty("");
        setCustomCategory("");
        setCustomSubCategory("");
        setIsAddingNewCategory(false);
        setIsCustomSubCategory(false);
        fetchOptions();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col w-full items-start gap-3"
    >
      <div>
        <p className="mb-2">Upload Image</p>
        <div className="flex gap-2">
          <label htmlFor="image1">
            <img
              className="w-20"
              src={!image1 ? assets.upload_area : URL.createObjectURL(image1)}
              alt=""
            />
            <input
              onChange={(e) => setImage1(e.target.files[0])}
              type="file"
              id="image1"
              hidden
            />
          </label>
          <label htmlFor="image2">
            <img
              className="w-20"
              src={!image2 ? assets.upload_area : URL.createObjectURL(image2)}
              alt=""
            />
            <input
              onChange={(e) => setImage2(e.target.files[0])}
              type="file"
              id="image2"
              hidden
            />
          </label>
          <label htmlFor="image3">
            <img
              className="w-20"
              src={!image3 ? assets.upload_area : URL.createObjectURL(image3)}
              alt=""
            />
            <input
              onChange={(e) => setImage3(e.target.files[0])}
              type="file"
              id="image3"
              hidden
            />
          </label>
          <label htmlFor="image4">
            <img
              className="w-20"
              src={!image4 ? assets.upload_area : URL.createObjectURL(image4)}
              alt=""
            />
            <input
              onChange={(e) => setImage4(e.target.files[0])}
              type="file"
              id="image4"
              hidden
            />
          </label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Product name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-[500px] px-3 py-2"
          type="text"
          placeholder="Type here"
          required
        />
      </div>
      <div className="w-full">
        <p className="mb-2">Product description</p>
        <textarea
          onChange={(e) => setDesription(e.target.value)}
          value={description}
          className="w-full max-w-[500px] px-3 py-2"
          type="text"
          placeholder="Write content here"
          required
        />
      </div>
      <div className="flex flex-col gap-4 w-full max-w-[650px]">
        {/* Multi-category Selector */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800 text-sm">
              Product Categories (Select 1 or more)
            </p>
            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
              {selectedCategories.length} selected
            </span>
          </div>
          <p className="text-xs text-gray-500">
            A single product can belong to multiple categories simultaneously (e.g. Men &amp; Festival Offer).
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {categoriesList.map((item) => {
              const isSelected = selectedCategories.includes(item.name);
              return (
                <button
                  key={item.id || item.name}
                  type="button"
                  onClick={() => toggleCategorySelection(item.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-[1.02]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span>{isSelected ? "✓" : "+"}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-indigo-400 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
            >
              {isAddingNewCategory ? "✕ Cancel" : "+ Add New Category..."}
            </button>
          </div>

          {isAddingNewCategory && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Type new category name (e.g. Festival Offer)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="border px-3 py-1.5 flex-1 rounded-lg text-xs focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddNewCategoryInline}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Add Category
              </button>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 font-medium text-sm">Sub category (Type)</p>
          <select
            value={isCustomSubCategory ? "ADD_NEW" : subCategory}
            onChange={(e) => {
              if (e.target.value === "ADD_NEW") {
                setIsCustomSubCategory(true);
              } else {
                setIsCustomSubCategory(false);
                setSubCategory(e.target.value);
              }
            }}
            className="w-full max-w-[500px] px-3 py-2 border rounded-lg text-sm"
          >
            {subCategoriesList.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
            <option value="ADD_NEW">+ Add New SubCategory...</option>
          </select>
          {isCustomSubCategory && (
            <input
              type="text"
              placeholder="Type new subcategory name"
              value={customSubCategory}
              onChange={(e) => setCustomSubCategory(e.target.value)}
              className="mt-2 border px-3 py-1.5 w-full rounded text-sm"
              required
            />
          )}
        </div>

        <div>
          <p className="mb-2">Product Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-3 py-2 sm:w-[120px]"
            type="Number"
            placeholder="25"
            required
          />
        </div>
        <div>
          <p className="mb-2">Discount (%)</p>
          <input
            onChange={(e) => setDiscount(e.target.value)}
            value={discount}
            className="w-full px-3 py-2 sm:w-[120px]"
            type="Number"
            placeholder="0"
            min="0"
            max="100"
          />
        </div>
      </div>

      <div>
        <p className="mb-2">Product Variants (Size, Color, Quantity)</p>
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
                setVariants([...variants, { size: variantSize, color: variantColor, quantity: Number(variantQty) }]);
                setVariantColor("");
                setVariantQty("");
              } else {
                toast.error("Please enter a color and quantity");
              }
            }}
            className="bg-black text-white px-3 py-1 rounded text-sm mb-[1px]"
          >
            Add Variant
          </button>
        </div>
        <div className="flex flex-col gap-2 max-w-sm">
          {variants.map((v, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded text-sm border">
              <span>{v.size} / {v.color} - Qty: {v.quantity}</span>
              <button
                type="button"
                onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                className="text-red-500 font-bold hover:text-red-700"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 mt-2">
        <div className="flex gap-2">
          <input
            onChange={() => setBestSeller((prev) => !prev)}
            checked={bestseller}
            type="checkbox"
            id="bestseller"
          />
          <label className="cursor-pointer" htmlFor="bestseller">
            Add to bestseller
          </label>
        </div>
        <div className="flex gap-2">
          <input
            onChange={() => setPublished((prev) => !prev)}
            checked={published}
            type="checkbox"
            id="published"
          />
          <label className="cursor-pointer font-medium text-green-700" htmlFor="published">
            Publish Immediately
          </label>
        </div>
      </div>

      <button type="submit" className="w-28 py-3 mt-4 bg-black text-white">
        ADD
      </button>
    </form>
  );
};

export default Add;
