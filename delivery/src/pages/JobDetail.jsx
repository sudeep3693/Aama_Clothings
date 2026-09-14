import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Upload,
  User,
  ShieldCheck,
  Package,
  Clock,
  X,
} from "lucide-react";
import { useDelivery } from "../context/DeliveryContext";
import JobStatusBadge from "../components/JobStatusBadge";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, backendUrl, currency } = useDelivery();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Delivery Completion Form
  const [isCodCollected, setIsCodCollected] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [proofImage, setProofImage] = useState(null);

  // Failure Modal
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [failureReason, setFailureReason] = useState("");

  const fetchJob = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/delivery-job/my`, {
        headers: { token },
      });
      if (res.data.success) {
        const found = (res.data.jobs || []).find((j) => j.id === id);
        if (found) {
          setJob(found);
          setIsCodCollected(found.isCodCollected || false);
        } else {
          toast.error("Task not found");
          navigate("/jobs");
        }
      }
    } catch (err) {
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  }, [id, token, backendUrl, navigate]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/delivery-job/accept/${id}`,
        {},
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Task accepted! Customer street address is now available.");
        fetchJob();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept task");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${backendUrl}/api/delivery-job/status/${id}`,
        { status },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(`Task updated to ${status}`);
        fetchJob();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDelivery = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("isCodCollected", isCodCollected ? "true" : "false");
      formData.append("recipientName", recipientName || "Customer");
      formData.append("deliveryNotes", deliveryNotes || "Delivered successfully");
      if (proofImage) {
        formData.append("image", proofImage);
      }

      const res = await axios.post(
        `${backendUrl}/api/delivery-job/deliver/${id}`,
        formData,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data.success) {
        toast.success("Delivery completed successfully! Great job.");
        fetchJob();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete delivery");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportFailure = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/delivery-job/fail/${id}`,
        { failureReason: failureReason || "Delivery attempt failed" },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.warn("Delivery attempt recorded as failed.");
        setFailModalOpen(false);
        fetchJob();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report failure");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading delivery task...</p>
      </div>
    );
  }

  const mfg = job.orderAssignment?.manufacturer;
  const order = job.orderAssignment?.order;
  const isCod = order?.paymentMethod === "COD" || !order?.payment;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>
        <JobStatusBadge status={job.status} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pickup & Dropoff Routing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Hub Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  A
                </span>
                Step 1: Manufacturer Pickup Hub
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {job.orderAssignment?.status === "ready_for_pickup"
                  ? "✓ Packed & Ready"
                  : "Packing in progress"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Hub Facility Name</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {mfg?.businessName || "Aama Partner Hub"}
                </span>
                <span className="text-slate-600 mt-1 block">
                  {mfg?.address || `${mfg?.city}, Nepal`}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Hub Phone / Dispatcher</span>
                <a
                  href={`tel:${mfg?.phone}`}
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 text-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {mfg?.phone || "+977-1-4400000"}
                </a>
                <span className="text-slate-500 block text-[11px] mt-1">
                  Contact hub directly for warehouse entry
                </span>
              </div>
            </div>

            {/* Package details */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Weight</span>
                <span className="font-bold text-slate-800">
                  {job.orderAssignment?.packageWeight || "0.5 kg"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Dimensions</span>
                <span className="font-bold text-slate-800">
                  {job.orderAssignment?.packageDimensions || "Standard"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Handling</span>
                <span className="font-bold text-slate-800 truncate block">
                  {job.orderAssignment?.packagingNotes || "Garments / Fragile"}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Dropoff Address Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  B
                </span>
                Step 2: Customer Delivery Destination
              </span>
              {isCod && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                  COD: {currency}{(job.codAmount || order?.amount || 0).toLocaleString()}
                </span>
              )}
            </div>

            {job.status === "assigned" ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-blue-500 mx-auto" />
                <p className="font-bold text-slate-800 text-xs">
                  Customer Destination: {order?.address?.city || "Nepal"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Please accept this run to unlock customer full street address, recipient name, and contact phone number.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {order?.address?.firstName} {order?.address?.lastName || "Customer"}
                  </span>
                  <span className="text-slate-700 mt-1 block font-medium">
                    {order?.address?.street || "Doorstep Delivery"}, {order?.address?.city}
                  </span>
                  <span className="text-slate-400 text-[11px] block">
                    State / Province: {order?.address?.state || "Bagmati"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Customer Contact Phone</span>
                  <a
                    href={`tel:${order?.address?.phone}`}
                    className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1.5 mt-1 text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    {order?.address?.phone || "+977-9800000000"}
                  </a>
                  <span className="text-slate-500 block text-[11px] mt-1">
                    Call before arriving at doorstep
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Completion Form (Visible when in_transit or picked_up) */}
          {["picked_up", "in_transit"].includes(job.status) && (
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Complete Delivery &amp; COD Collection
              </h3>

              <form onSubmit={handleCompleteDelivery} className="space-y-4">
                {/* COD Checkbox */}
                {isCod && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={isCodCollected}
                        onChange={(e) => setIsCodCollected(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-900">
                        I confirm cash collection of {currency}
                        {(job.codAmount || order?.amount || 0).toLocaleString()} from customer
                      </span>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Received By (Name / Relation)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh (Self) / Suman (Brother)"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proof of Delivery Photo (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofImage(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Notes / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handed over at 3rd floor apartment"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setFailModalOpen(true)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Report Unable to Deliver
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Submitting..." : "Confirm Doorstep Delivery"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Col: Task Workflow Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Courier Action Station
            </h3>

            {job.status === "assigned" && (
              <div className="space-y-2">
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Accept Delivery Task
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Accepting unlocks exact customer street address &amp; phone.
                </p>
              </div>
            )}

            {job.status === "accepted" && (
              <div className="space-y-2">
                <button
                  onClick={() => handleUpdateStatus("picked_up")}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Confirm Package Picked Up from Hub
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Click once parcel is safely loaded into your vehicle.
                </p>
              </div>
            )}

            {job.status === "picked_up" && (
              <div className="space-y-2">
                <button
                  onClick={() => handleUpdateStatus("in_transit")}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Start Route (Out for Delivery)
                </button>
              </div>
            )}

            {job.status === "delivered" && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully Delivered
                </div>
                <p className="text-[11px] text-emerald-700">
                  Delivered on {new Date(job.deliveredAt || job.updatedAt).toLocaleString()}
                </p>
                {job.isCodCollected && (
                  <p className="text-[11px] font-semibold text-emerald-800">
                    COD Collected: {currency}{(job.codAmount || 0).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {job.status === "failed" && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Delivery Unsuccessful
                </div>
                <p className="text-[11px] text-rose-700">
                  Reason: {job.failureReason || "Attempt failed"}
                </p>
              </div>
            )}
          </div>

          {/* COD Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Payment &amp; COD Cash
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Order Method:</span>
              <span className="font-bold text-slate-900">{order?.paymentMethod || "COD"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">COD Due:</span>
              <span className="font-black text-slate-900 text-sm">
                {currency}{(job.codAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-500">COD Status:</span>
              <span
                className={`font-bold ${
                  job.isCodCollected ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {job.isCodCollected ? "Collected" : "Pending collection"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Failure Modal */}
      {failModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Report Delivery Failure
              </h3>
              <button
                onClick={() => setFailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please specify why the delivery could not be completed.
            </p>

            <form onSubmit={handleReportFailure} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Failure
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Customer Unreachable by Phone">Customer Unreachable by Phone</option>
                  <option value="Incorrect Delivery Address">Incorrect Delivery Address</option>
                  <option value="Customer Refused Parcel / Payment">Customer Refused Parcel / Payment</option>
                  <option value="Customer Requested Rescheduling">Customer Requested Rescheduling</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
