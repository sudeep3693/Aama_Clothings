/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "Rs ";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const getMaxStock = (product, size, color) => {
    if (!product) return 0;
    let variants = product.variants;
    if (typeof variants === "string") {
      try {
        variants = JSON.parse(variants);
      } catch (e) {
        variants = [];
      }
    }
    if (Array.isArray(variants) && variants.length > 0) {
      const matched = variants.find(
        (v) => (!size || v.size === size) && (!color || v.color === color)
      );
      if (matched && matched.quantity !== undefined && matched.quantity !== null) {
        return Number(matched.quantity);
      }
    }
    return Number(product.stockQuantity ?? 0);
  };

  const addToCart = async (itemId, size, color) => {
    if (!size) {
      toast.error("Select Product Size");
      return;
    }
    if (!color) {
      toast.error("Select Product Color");
      return;
    }

    const itemInfo = products.find((product) => product._id === itemId);
    const maxStock = getMaxStock(itemInfo, size, color);
    const variantKey = `${size}-${color}`;
    const currentQty = (cartItems[itemId] && cartItems[itemId][variantKey]) || 0;

    if (maxStock <= 0) {
      toast.error("This product/variant is out of stock");
      return;
    }

    if (currentQty + 1 > maxStock) {
      toast.error(`Cannot add more. Only ${maxStock} item${maxStock > 1 ? "s" : ""} available in stock.`);
      return;
    }

    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      if (cartData[itemId][variantKey]) {
        cartData[itemId][variantKey] += 1;
      } else {
        cartData[itemId][variantKey] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][variantKey] = 1;
    }
    setCartItems(cartData);

    if (!token) {
      localStorage.setItem("cartItems", JSON.stringify(cartData));
    }

    toast.success(`Added to cart — ${size} / ${color}`, {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: true,
    });

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size, color },
          { headers: { token } }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          /* empty */
        }
      }
    }
    return totalCount;
  };

  const updateQuantity = async (itemId, size, color, quantity) => {
    let cartData = structuredClone(cartItems);
    const variantKey = `${size}-${color}`;

    if (quantity > 0) {
      const itemInfo = products.find((product) => product._id === itemId);
      const maxStock = getMaxStock(itemInfo, size, color);
      if (quantity > maxStock) {
        toast.error(`Only ${maxStock} item${maxStock > 1 ? "s" : ""} available in stock`);
        quantity = maxStock;
      }
    }

    if (quantity <= 0) {
      if (cartData[itemId]) {
        delete cartData[itemId][variantKey];
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      }
    } else {
      if (!cartData[itemId]) {
        cartData[itemId] = {};
      }
      cartData[itemId][variantKey] = quantity;
    }

    setCartItems(cartData);

    if (!token) {
      localStorage.setItem("cartItems", JSON.stringify(cartData));
    }

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size, color, quantity },
          { headers: { token } }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemsInfo = products.find((product) => product._id === items);
      if (!itemsInfo) continue;
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            const effectivePrice = itemsInfo.discount > 0
              ? Math.round(itemsInfo.price * (1 - itemsInfo.discount / 100))
              : itemsInfo.price;
            totalAmount += effectivePrice * cartItems[items][item];
          }
        } catch (error) {
          // empty
        }
      }
    }
    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const getUserCart = async (userToken) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token: userToken } }
      );
      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      }
    } catch (error) {
      console.error("Error fetching user cart:", error);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      getUserCart(storedToken);
    } else {
      const storedCart = localStorage.getItem("cartItems");
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      getUserCart(token);
    }
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    setCartItems,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    setToken,
    token,
    getMaxStock,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
