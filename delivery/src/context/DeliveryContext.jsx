import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const DeliveryContext = createContext();

export const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
export const currency = "Rs ";

export const DeliveryProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("deliveryToken") || "");
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobStats, setJobStats] = useState({
    assigned: 0,
    accepted: 0,
    in_transit: 0,
    delivered: 0,
    total: 0,
    codCashOnHand: 0,
  });

  const logout = () => {
    setToken("");
    setPartner(null);
    localStorage.removeItem("deliveryToken");
    toast.info("Logged out successfully");
  };

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${backendUrl}/api/delivery-partner/profile`, {
        headers: { token },
      });
      if (response.data.success) {
        setPartner(response.data.partner);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Failed to fetch driver profile:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const toggleAvailability = async () => {
    if (!token || !partner) return;
    try {
      const nextState = !partner.isAvailable;
      const res = await axios.put(
        `${backendUrl}/api/delivery-partner/availability`,
        { isAvailable: nextState },
        { headers: { token } }
      );
      if (res.data.success) {
        setPartner((prev) => ({ ...prev, isAvailable: nextState }));
        toast.success(nextState ? "Driver Online: Ready to receive pickup runs" : "Driver Paused: Offline");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update driver availability");
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("deliveryToken", token);
      fetchProfile();
    } else {
      localStorage.removeItem("deliveryToken");
      setLoading(false);
    }
  }, [token, fetchProfile]);

  return (
    <DeliveryContext.Provider
      value={{
        token,
        setToken,
        partner,
        setPartner,
        loading,
        jobStats,
        setJobStats,
        fetchProfile,
        toggleAvailability,
        logout,
        backendUrl,
        currency,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => useContext(DeliveryContext);
