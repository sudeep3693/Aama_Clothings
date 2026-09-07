/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  NEPAL_CITIES,
  findNearestNepalCity,
  getCityInfo,
} from "../data/nepalLocations";
import { toast } from "react-toastify";

// Custom pin marker icon using Leaflet DivIcon with inline SVG
const createPinIcon = () =>
  L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="position: relative; width: 32px; height: 32px; transform: translate(-16px, -32px);">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="#e11d48" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

const NepalMapModal = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialCity = "Kathmandu",
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultCityInfo = getCityInfo(initialCity) || NEPAL_CITIES[0];

  const [selectedLocation, setSelectedLocation] = useState({
    city: defaultCityInfo.name,
    state: defaultCityInfo.province,
    zipcode: defaultCityInfo.zipcode,
    lat: defaultCityInfo.lat,
    lng: defaultCityInfo.lng,
    addressSnippet: "",
  });

  const [locating, setLocating] = useState(false);

  // Initialize and mount Leaflet map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Nepal bounds
      const southWest = L.latLng(26.3, 80.0);
      const northEast = L.latLng(30.5, 88.3);
      const nepalBounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapContainerRef.current, {
        center: [selectedLocation.lat, selectedLocation.lng],
        zoom: 12,
        minZoom: 6,
        maxZoom: 18,
        maxBounds: nepalBounds,
        maxBoundsViscosity: 0.8,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add pin marker
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on("dragend", async (e) => {
        const { lat, lng } = e.target.getLatLng();
        handleCoordinatesSelected(lat, lng, map);
      });

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        handleCoordinatesSelected(lat, lng, map);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle coordinates clicked/dragged on map
  const handleCoordinatesSelected = async (lat, lng, map) => {
    const matched = findNearestNepalCity(lat, lng);

    let addressSnippet = "";
    try {
      // Reverse geocoding via OpenStreetMap Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const road = data.address.road || data.address.suburb || data.address.neighbourhood || "";
          addressSnippet = road;
        }
      }
    } catch {
      // Fallback
    }

    setSelectedLocation({
      city: matched.name,
      state: matched.province,
      zipcode: matched.zipcode,
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      addressSnippet,
    });

    if (map) {
      map.panTo([lat, lng]);
    }
  };

  // Quick select a predefined Nepal city
  const handleSelectCityChip = (cityObj) => {
    setSelectedLocation({
      city: cityObj.name,
      state: cityObj.province,
      zipcode: cityObj.zipcode,
      lat: cityObj.lat,
      lng: cityObj.lng,
      addressSnippet: "",
    });

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([cityObj.lat, cityObj.lng]);
      mapInstanceRef.current.flyTo([cityObj.lat, cityObj.lng], 13);
    }
  };

  // Browser Geolocation / GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;

        // Check if within Nepal geographic limits (~26.3 to 30.5 N, ~80.0 to 88.3 E)
        if (
          latitude < 26.0 ||
          latitude > 31.0 ||
          longitude < 79.5 ||
          longitude > 89.0
        ) {
          toast.info(
            "Your current GPS is outside Nepal. Defaulting to Kathmandu."
          );
          handleSelectCityChip(NEPAL_CITIES[0]);
          return;
        }

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          mapInstanceRef.current.flyTo([latitude, longitude], 15);
        }

        await handleCoordinatesSelected(
          latitude,
          longitude,
          mapInstanceRef.current
        );
        toast.success("Location identified!");
      },
      (err) => {
        setLocating(false);
        console.error("GPS error:", err);
        toast.error("Unable to retrieve your location. Please select on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Confirm selection and pass back to PlaceOrder
  const handleConfirm = () => {
    onLocationSelect(selectedLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">Choose Delivery Location (Nepal 🇳🇵)</span>
            </div>
            <p className="text-xs text-gray-300">
              Click anywhere on the map, use GPS, or pick a city to auto-fill your delivery address
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Toolbar & Popular Cities */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          {/* GPS Auto-Detect Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {locating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span>Use My GPS Location</span>
          </button>

          {/* Quick City Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Quick Pick:</span>
            {NEPAL_CITIES.slice(0, 7).map((c) => (
              <button
                type="button"
                key={c.name}
                onClick={() => handleSelectCityChip(c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                  selectedLocation.city === c.name
                    ? "bg-black text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {c.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Leaflet Map Container */}
        <div className="relative flex-1 min-h-[320px] sm:min-h-[380px] w-full bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "340px" }} />
          <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] text-gray-600 shadow-sm pointer-events-none">
            📍 Drag pin or click map to move
          </div>
        </div>

        {/* Selected Location Summary Bar */}
        <div className="bg-white border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="w-full sm:w-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Selected Nepal Location
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="font-bold text-sm text-gray-900">
                {selectedLocation.city}
              </span>
              <span className="text-xs text-gray-500">• {selectedLocation.state}</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                Postal Code: {selectedLocation.zipcode}
              </span>
              <span className="text-[11px] text-gray-400">
                ({selectedLocation.lat}, {selectedLocation.lng})
              </span>
            </div>
            {selectedLocation.addressSnippet && (
              <p className="text-xs text-emerald-600 mt-0.5">
                Area: {selectedLocation.addressSnippet}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-black hover:bg-gray-800 active:scale-95 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Apply This Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NepalMapModal;
