/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import NepalMapModal from "../components/NepalMapModal";
import {
  NEPAL_CITIES,
  NEPAL_PROVINCES,
  getCityInfo,
} from "../data/nepalLocations";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
    getMaxStock,
    getProductsData,
  } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    landmark: "",
    city: "Kathmandu",
    state: "Bagmati Province",
    zipcode: "44600",
    country: "Nepal",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch logged-in user profile & saved addresses
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      setLoadingProfile(true);
      const res = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { token },
      });

      if (res.data.success && res.data.user) {
        const u = res.data.user;
        const addresses = u.addresses || [];
        setSavedAddresses(addresses);

        // If user has saved addresses, pre-fill with the first/most recent
        if (addresses.length > 0) {
          const firstAddr = addresses[0];
          setSelectedSavedId(firstAddr.id);
          setFormData((prev) => ({
            ...prev,
            firstName: firstAddr.firstName || u.firstName || "",
            lastName: firstAddr.lastName || u.lastName || "",
            email: firstAddr.email || u.email || "",
            phone: firstAddr.phone || u.phone || "",
            street: firstAddr.street || "",
            landmark: firstAddr.landmark || "",
            city: firstAddr.city || "Kathmandu",
            state: firstAddr.state || "Bagmati Province",
            zipcode: firstAddr.zipcode || "44600",
            country: "Nepal",
          }));
        } else {
          // Pre-fill user name, email, phone from registration
          setFormData((prev) => ({
            ...prev,
            firstName: u.firstName || (u.name ? u.name.split(" ")[0] : ""),
            lastName: u.lastName || (u.name ? u.name.split(" ").slice(1).join(" ") : ""),
            email: u.email || "",
            phone: u.phone || "",
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    // If city is changed, automatically update state and zipcode if known
    if (name === "city") {
      const cityInfo = getCityInfo(value);
      if (cityInfo) {
        setFormData((data) => ({
          ...data,
          city: value,
          state: cityInfo.province,
          zipcode: cityInfo.zipcode,
        }));
        return;
      }
    }

    setFormData((data) => ({
      ...data,
      [name]: value,
    }));
  };

  // Handle map location selected
  const handleMapLocationSelect = (loc) => {
    setSelectedSavedId(null);
    setFormData((prev) => ({
      ...prev,
      city: loc.city,
      state: loc.state,
      zipcode: loc.zipcode,
      street: loc.addressSnippet ? loc.addressSnippet : prev.street,
    }));
    toast.success(`Location set: ${loc.city}, ${loc.state}`);
  };

  // Select a saved address
  const handleSelectSavedAddress = (addr) => {
    setSelectedSavedId(addr.id);
    setFormData((prev) => ({
      ...prev,
      firstName: addr.firstName || prev.firstName,
      lastName: addr.lastName || prev.lastName,
      email: addr.email || prev.email,
      phone: addr.phone || prev.phone,
      street: addr.street || "",
      landmark: addr.landmark || "",
      city: addr.city || "Kathmandu",
      state: addr.state || "Bagmati Province",
      zipcode: addr.zipcode || "44600",
      country: "Nepal",
    }));
  };

  // Delete a saved address
  const handleDeleteSavedAddress = async (e, addressId) => {
    e.stopPropagation();
    try {
      const res = await axios.post(
        `${backendUrl}/api/user/address/delete`,
        { addressId },
        { headers: { token } }
      );
      if (res.data.success) {
        setSavedAddresses(res.data.addresses || []);
        if (selectedSavedId === addressId) {
          setSelectedSavedId(null);
        }
        toast.info("Saved address removed");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error("Please login to place your order");
      navigate("/login");
      return;
    }

    // Validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Please provide first and last name");
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      toast.error("Please provide a valid contact phone number");
      return;
    }
    if (!formData.street.trim()) {
      toast.error("Please provide your street / area / ward address");
      return;
    }
    if (!formData.landmark.trim()) {
      toast.error("Please provide a nearest landmark for delivery");
      return;
    }

    try {
      setSubmitting(true);
      let orderItems = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items)
            );
            if (itemInfo) {
              const [size, color] = item.split("-");
              itemInfo.size = size;
              itemInfo.color = color || "";
              itemInfo.quantity = cartItems[items][item];

              const maxStock = getMaxStock(itemInfo, size, color);
              if (maxStock <= 0) {
                toast.error(`"${itemInfo.name}" (${size}/${color || 'Default'}) is out of stock.`);
                return;
              }
              if (itemInfo.quantity > maxStock) {
                toast.error(`"${itemInfo.name}" (${size}/${color || 'Default'}) exceeds available stock (${maxStock}). Please adjust your cart.`);
                return;
              }

              orderItems.push(itemInfo);
            }
          }
        }
      }

      if (orderItems.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      let orderData = {
        address: {
          ...formData,
          country: "Nepal",
        },
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
      };

      switch (method) {
        case "cod": {
          const response = await axios.post(
            backendUrl + "/api/order/place",
            orderData,
            { headers: { token } }
          );

          if (response.data.success) {
            setCartItems({});
            localStorage.removeItem("cartItems");
            if (getProductsData) {
              await getProductsData();
            }
            toast.success("Order Placed Successfully!");
            navigate("/orders");
          } else {
            toast.error(response.data.message);
          }
          break;
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={onSubmitHandler}
        className="flex flex-col lg:flex-row justify-between gap-8 pt-5 sm:pt-10 min-h-[80vh] border-t"
      >
        {/* --- Left Side: Delivery Address --- */}
        <div className="flex flex-col gap-4 w-full lg:max-w-[560px]">
          <div className="flex items-center justify-between flex-wrap gap-2 my-2">
            <div className="text-xl sm:text-2xl">
              <Title text1={"DELIVERY"} text2={"INFORMATION"} />
            </div>
            {/* Map / GPS Picker Button */}
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Choose on Map / GPS</span>
            </button>
          </div>

          {/* Saved Addresses Quick Selector */}
          {savedAddresses.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Saved Addresses ({savedAddresses.length})
                </span>
                <span className="text-[10px] text-gray-400">Click to auto-fill</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedSavedId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`relative p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className={`font-semibold text-xs ${isSelected ? "text-white" : "text-gray-900"}`}>
                          {addr.city}, {addr.state?.split(" ")[0]}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedAddress(e, addr.id)}
                          className={`p-0.5 rounded hover:bg-red-100 ${
                            isSelected ? "text-gray-300 hover:text-red-300" : "text-gray-400 hover:text-red-600"
                          }`}
                          title="Remove saved address"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-gray-200" : "text-gray-500"}`}>
                        {addr.street}
                      </p>
                      {addr.landmark && (
                        <p className={`text-[10px] truncate ${isSelected ? "text-amber-200" : "text-amber-700"}`}>
                          Landmark: {addr.landmark}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Name */}
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
              <input
                required
                onChange={onChangeHandler}
                name="firstName"
                value={formData.firstName}
                className="border border-gray-300 rounded-lg py-2 px-3.5 w-full text-sm focus:outline-none focus:border-black"
                type="text"
                placeholder="First name"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
              <input
                required
                onChange={onChangeHandler}
                name="lastName"
                value={formData.lastName}
                className="border border-gray-300 rounded-lg py-2 px-3.5 w-full text-sm focus:outline-none focus:border-black"
                type="text"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Contact Email & Phone */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
              <input
                required
                onChange={onChangeHandler}
                name="email"
                value={formData.email}
                className="border border-gray-300 rounded-lg py-2 px-3.5 w-full text-sm focus:outline-none focus:border-black"
                type="email"
                placeholder="Email address"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Phone *</label>
              <input
                required
                onChange={onChangeHandler}
                name="phone"
                value={formData.phone}
                className="border border-gray-300 rounded-lg py-2 px-3.5 w-full text-sm focus:outline-none focus:border-black"
                type="tel"
                placeholder="Phone (e.g. 9841234567)"
              />
            </div>
          </div>

          {/* Street / Area / Ward Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Street / Area / Ward Address *
            </label>
            <input
              required
              onChange={onChangeHandler}
              name="street"
              value={formData.street}
              className="border border-gray-300 rounded-lg py-2 px-3.5 w-full text-sm focus:outline-none focus:border-black"
              type="text"
              placeholder="e.g. New Baneshwor, House No. 24, Ward 10"
            />
          </div>

          {/* Nearest Landmark Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nearest Landmark *
            </label>
            <input
              required
              onChange={onChangeHandler}
              name="landmark"
              value={formData.landmark}
              className="border border-gray-300 rounded-lg py-2 px-3.5 w-full text-sm focus:outline-none focus:border-black"
              type="text"
              placeholder="e.g. Opposite Bhatbhateni Supermarket / Near Civil Hospital"
            />
            <p className="text-[11px] text-gray-400 mt-0.5">
              Helps delivery rider locate your address quickly.
            </p>
          </div>

          {/* City & State / Province Dropdowns */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                City / Town (Nepal) *
              </label>
              <select
                required
                name="city"
                value={formData.city}
                onChange={onChangeHandler}
                className="border border-gray-300 rounded-lg py-2 px-3 w-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {NEPAL_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.province.split(" ")[0]})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Province / State *
              </label>
              <select
                required
                name="state"
                value={formData.state}
                onChange={onChangeHandler}
                className="border border-gray-300 rounded-lg py-2 px-3 w-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {NEPAL_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Zipcode & Country */}
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Postal / Zip Code *</label>
              <input
                required
                onChange={onChangeHandler}
                name="zipcode"
                value={formData.zipcode}
                className="border border-gray-300 rounded-lg py-2 px-3.5 w-full text-sm focus:outline-none focus:border-black"
                type="text"
                placeholder="Zipcode (e.g. 44600)"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
              <input
                readOnly
                disabled
                name="country"
                value="Nepal 🇳🇵"
                className="border border-gray-200 bg-gray-100 rounded-lg py-2 px-3.5 w-full text-sm text-gray-700 cursor-not-allowed font-medium"
                type="text"
              />
            </div>
          </div>
        </div>

        {/* --- Right Side: Summary & Payment --- */}
        <div className="flex-1 lg:max-w-[420px] flex flex-col justify-between">
          <div>
            <div className="min-w-full">
              <CartTotal />
            </div>

            {/* Delivery Destination Badge */}
            <div className="mt-6 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Delivery To: {formData.city}, {formData.state}</span>
              </div>
              <p className="text-[11px] text-gray-500 pl-5">
                {formData.street ? formData.street : "Street address pending"} {formData.landmark && `(Near ${formData.landmark})`}
              </p>
            </div>

            <div className="mt-8">
              <Title text1={"PAYMENT"} text2={"METHOD"} />

              {/* Payment Method Selection */}
              <div className="flex gap-3 flex-col mt-3">
                <div
                  onClick={() => setMethod("cod")}
                  className="flex items-center gap-3 border p-3 rounded-xl cursor-pointer bg-white hover:border-black transition-colors"
                >
                  <p
                    className={`min-w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                      method === "cod" ? "border-black bg-black" : "border-gray-300"
                    }`}
                  >
                    {method === "cod" && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                  </p>
                  <div>
                    <p className="text-gray-900 text-sm font-semibold">
                      CASH ON DELIVERY (COD)
                    </p>
                    <p className="text-[11px] text-gray-500">Pay safely upon delivery at your doorstep</p>
                  </div>
                </div>
              </div>

              <div className="w-full text-end mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-black text-white px-12 py-3.5 text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-95 transition-all w-full sm:w-auto shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>PLACE ORDER NOW</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Nepal Location Map Modal */}
      <NepalMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSelect={handleMapLocationSelect}
        initialCity={formData.city}
      />
    </>
  );
};

export default PlaceOrder;
