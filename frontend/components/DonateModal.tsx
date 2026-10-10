"use client";

import { useState } from "react";
import { Donation, NeedItem } from "@/lib/api";
import { Loader2, AlertCircle, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import SuccessCheckmark from "@/components/SuccessCheckmark";

export interface DonationFormData {
  quantity: number;
  message: string;
  estimatedDeliveryDate: string;
  donorType: "private" | "organization";
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorOrganization?: string;
  donorAddress: string;
  donorContact?: string;
  organizationName?: string;
  organizationProgram?: string;
  organizationOfficerName?: string;
  organizationOfficerDesignation?: string;
  organizationOfficerContact?: string;
  organizationEmail?: string;
  governmentDepartment?: string;
  governmentProgram?: string;
  governmentOfficerName?: string;
  governmentOfficerDesignation?: string;
  governmentOfficerContact?: string;
  governmentEmail?: string;
}

interface DonateModalProps {
  needItem: NeedItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DonateModal({
  needItem,
  isOpen,
  onClose,
  onSuccess,
}: DonateModalProps) {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [message, setMessage] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [donorType, setDonorType] = useState<"private" | "organization">(
    "private",
  );

  // Private donor fields
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorAddress, setDonorAddress] = useState("");

  // Organization donor fields
  const [organizationName, setOrganizationName] = useState("");
  const [organizationProgram, setOrganizationProgram] = useState("");
  const [organizationOfficerName, setOrganizationOfficerName] = useState("");
  const [organizationOfficerDesignation, setOrganizationOfficerDesignation] =
    useState("");
  const [organizationOfficerContact, setOrganizationOfficerContact] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"donate" | "cancel" | null>(null);

  if (!isOpen) return null;

  const handleDonorTypeChange = (newType: "private" | "organization") => {
    setDonorType(newType);
    if (newType === "private") {
      setOrganizationName("");
      setOrganizationProgram("");
      setOrganizationOfficerName("");
      setOrganizationOfficerDesignation("");
      setOrganizationOfficerContact("");
      setOrganizationEmail("");
    } else {
      setDonorName("");
      setDonorEmail("");
      setDonorPhone("");
      setDonorAddress("");
    }
  };

  const hasEnteredData =
    (typeof quantity === "number" ? quantity > 1 : (parseInt(String(quantity), 10) || 0) > 1) ||
    message.trim() !== "" ||
    estimatedDeliveryDate !== "" ||
    donorName.trim() !== "" ||
    donorEmail.trim() !== "" ||
    donorPhone.trim() !== "" ||
    donorAddress.trim() !== "" ||
    organizationName.trim() !== "" ||
    organizationProgram.trim() !== "" ||
    organizationOfficerName.trim() !== "" ||
    organizationOfficerDesignation.trim() !== "" ||
    organizationOfficerContact.trim() !== "" ||
    organizationEmail.trim() !== "";

  const handleDismiss = () => {
    setQuantity(1);
    setMessage("");
    setEstimatedDeliveryDate("");
    setDonorType("private");
    setDonorName("");
    setDonorEmail("");
    setDonorPhone("");
    setDonorAddress("");
    setOrganizationName("");
    setOrganizationProgram("");
    setOrganizationOfficerName("");
    setOrganizationOfficerDesignation("");
    setOrganizationOfficerContact("");
    setOrganizationEmail("");
    setSuccess(false);
    setConfirmAction(null);
    onClose();
  };

  const handleHeaderClose = () => {
    if (confirmAction !== null) {
      setConfirmAction(null);
    } else if (hasEnteredData) {
      setConfirmAction("cancel");
    } else {
      handleDismiss();
    }
  };

  const handlePromptDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const maxVal = needItem.quantity_required - needItem.quantity_confirmed;
    const num = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10);
    const validQty = isNaN(num) || num < 1 ? 1 : Math.min(maxVal, num);
    setQuantity(validQty);
    setConfirmAction("donate");
  };

  const handleActualSubmit = async () => {
    setIsLoading(true);

    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/login";
      setIsLoading(false);
      return;
    }

    try {
      const { createDonation } = await import("@/lib/api");

      const maxVal = needItem.quantity_required - needItem.quantity_confirmed;
      const num = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10);
      const finalQuantity = isNaN(num) || num < 1 ? 1 : Math.min(maxVal, num);

      const donationData: Partial<Donation> = {
        need_item: needItem.id,
        quantity: finalQuantity,
        status: "PENDING",
        message: message,
        estimated_delivery_date: estimatedDeliveryDate || null,
        donor_type: donorType,
      };

      if (donorType === "private") {
        donationData.donor_name = donorName;
        donationData.donor_email = donorEmail;
        donationData.donor_phone = donorPhone;
        donationData.donor_address = donorAddress;
        donationData.organization_name = "";
        donationData.organization_program = "";
        donationData.organization_officer_name = "";
        donationData.organization_officer_designation = "";
        donationData.organization_officer_contact = "";
        donationData.organization_email = "";
      } else {
        donationData.organization_name = organizationName;
        donationData.organization_program = organizationProgram;
        donationData.organization_officer_name = organizationOfficerName;
        donationData.organization_officer_designation =
          organizationOfficerDesignation;
        donationData.organization_officer_contact = organizationOfficerContact;
        donationData.organization_email = organizationEmail;
        donationData.donor_name = "";
        donationData.donor_email = "";
        donationData.donor_phone = "";
        donationData.donor_address = "";
      }

      await createDonation(donationData);

      setSuccess(true);
      setConfirmAction(null);
      setIsLoading(false);
      onSuccess();
    } catch (err: unknown) {
      setIsLoading(false);
      console.error("Donation creation error:", err);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleHeaderClose();
        }
      }}
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-all duration-200"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-scale-up">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in my-auto">
            <div className="mb-5 flex items-center justify-center">
              <SuccessCheckmark size="xl" />
            </div>
            <div className="animate-success-content space-y-2 max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                Donation Submitted Successfully!
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Thank you for your generous donation. The organization will
                review and confirm your pledge shortly.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : confirmAction === "cancel" ? (
          /* Cancel Confirmation View */
          <div className="flex flex-col flex-1 overflow-hidden animate-fade-in">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 sm:p-6 shrink-0 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Cancel Donation?
              </h2>
              <p className="text-gray-800 font-semibold mt-0.5">{needItem.name}</p>
              {needItem.section_detail && (
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                  {needItem.section_detail.organization_name}{" "}
                  {needItem.section_detail.name
                    ? `• ${needItem.section_detail.name}`
                    : ""}
                </p>
              )}
            </div>

            {/* Middle Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Are you sure you want to cancel?
              </h4>
              <p className="text-sm text-gray-600 max-w-md leading-relaxed mb-2">
                Any information you have filled in this donation form will be lost and your pledge will not be submitted.
              </p>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-slate-50/80 sm:bg-white flex gap-3 z-10">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition active:scale-95 cursor-pointer text-sm"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm active:scale-95 cursor-pointer text-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        ) : confirmAction === "donate" ? (
          /* Donate Confirmation View */
          <div className="flex flex-col flex-1 overflow-hidden animate-fade-in">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 sm:p-6 shrink-0 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Confirm Donation Pledge
              </h2>
              <p className="text-gray-800 font-semibold mt-0.5">{needItem.name}</p>
              {needItem.section_detail && (
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                  {needItem.section_detail.organization_name}{" "}
                  {needItem.section_detail.name
                    ? `• ${needItem.section_detail.name}`
                    : ""}
                </p>
              )}
            </div>

            {/* Middle Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-4">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <CheckCircle2 size={30} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-1">
                  Ready to confirm your donation?
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  Please review your pledge details before final submission. The recipient hospital will be notified immediately.
                </p>
              </div>

              {/* Summary Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 text-left w-full space-y-2.5 border border-slate-200/80 text-xs sm:text-sm shadow-xs">
                <div className="flex justify-between items-start py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Need Item:</span>
                  <span className="font-bold text-slate-900 text-right">{needItem.name}</span>
                </div>
                <div className="flex justify-between items-start py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Recipient Organization:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {needItem.section_detail?.organization_name || "Hospital"}
                    {needItem.section_detail?.name ? ` • ${needItem.section_detail.name}` : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Pledged Quantity:</span>
                  <span className="font-bold text-blue-700 text-right">
                    {quantity} {needItem.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Estimated Delivery:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {estimatedDeliveryDate ? new Date(estimatedDeliveryDate).toLocaleDateString() : "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Donor Type:</span>
                  <span className="font-semibold text-slate-800 text-right capitalize">
                    {donorType === "private" ? "Private Donor" : "Organization"}
                  </span>
                </div>
                <div className="flex justify-between items-start py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">
                    {donorType === "private" ? "Donor Name:" : "Organization Name:"}
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {donorType === "private" ? donorName : organizationName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Contact Number:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {donorType === "private" ? donorPhone : organizationOfficerContact}
                  </span>
                </div>
                <div className="flex justify-between items-start py-1 border-b border-slate-200/50 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Email Address:</span>
                  <span className="font-semibold text-slate-800 text-right break-all">
                    {donorType === "private" ? donorEmail : organizationEmail}
                  </span>
                </div>
                {donorType === "private" && donorAddress && (
                  <div className="flex justify-between items-start py-1 border-b border-slate-200/50 gap-3">
                    <span className="text-slate-500 font-medium shrink-0">Address:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {donorAddress}
                    </span>
                  </div>
                )}
                {donorType === "organization" && organizationProgram && (
                  <div className="flex justify-between items-start py-1 border-b border-slate-200/50 gap-3">
                    <span className="text-slate-500 font-medium shrink-0">Program:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {organizationProgram}
                    </span>
                  </div>
                )}
                {message && (
                  <div className="flex justify-between items-start pt-1 gap-3">
                    <span className="text-slate-500 font-medium shrink-0">Message:</span>
                    <span className="text-slate-700 text-right italic">
                      &ldquo;{message}&rdquo;
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-slate-50/80 sm:bg-white flex gap-3 z-10">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition active:scale-95 cursor-pointer text-sm"
              >
                Review & Edit
              </button>
              <button
                type="button"
                onClick={handleActualSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                {isLoading ? "Submitting..." : "Yes, Confirm Donation"}
              </button>
            </div>
          </div>
        ) : (
          /* Main Donation Form View */
          <>
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 sm:p-6 shrink-0 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Make a Donation
              </h2>
              <p className="text-gray-800 font-semibold mt-0.5">{needItem.name}</p>
              {needItem.section_detail && (
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                  {needItem.section_detail.organization_name}{" "}
                  {needItem.section_detail.name
                    ? `• ${needItem.section_detail.name}`
                    : ""}
                </p>
              )}
            </div>

            {/* Form wrapping scrollable middle content & sticky footer */}
            <form onSubmit={handlePromptDonate} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 overscroll-contain">
                {/* Quantity Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity to Donate ({needItem.unit}) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex-1">
                      <input
                        id="donate-quantity"
                        name="quantity"
                        autoComplete="off"
                        type="number"
                        min="1"
                        max={needItem.quantity_required - needItem.quantity_confirmed}
                        required
                        value={quantity}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setQuantity("");
                            return;
                          }
                          const parsed = parseInt(raw, 10);
                          if (!isNaN(parsed)) {
                            const maxVal = needItem.quantity_required - needItem.quantity_confirmed;
                            if (parsed > maxVal) {
                              setQuantity(maxVal);
                            } else {
                              setQuantity(parsed);
                            }
                          }
                        }}
                        onBlur={() => {
                          const maxVal = needItem.quantity_required - needItem.quantity_confirmed;
                          const num = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10);
                          if (isNaN(num) || num < 1) {
                            setQuantity(1);
                          } else if (num > maxVal) {
                            setQuantity(maxVal);
                          } else {
                            setQuantity(num);
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        aria-label="Quantity to donate"
                        className="w-full pl-3.5 pr-8 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {/* Embedded Stepper Arrows - always visible on all devices (Mobile, Foldables, Tablets, Smart Displays, Desktop) */}
                      <div className="absolute right-1.5 top-1 bottom-1 flex flex-col justify-center select-none pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const maxVal = needItem.quantity_required - needItem.quantity_confirmed;
                            const current = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10) || 0;
                            setQuantity(Math.min(maxVal, Math.max(1, current + 1)));
                          }}
                          className="h-4 w-5 flex items-center justify-center text-gray-500 hover:text-blue-600 active:text-blue-700 active:scale-90 transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <ChevronUp size={13} strokeWidth={2.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10) || 1;
                            setQuantity(Math.max(1, current - 1));
                          }}
                          className="h-4 w-5 flex items-center justify-center text-gray-500 hover:text-blue-600 active:text-blue-700 active:scale-90 transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <ChevronDown size={13} strokeWidth={2.8} />
                        </button>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200 shrink-0">
                      Required: {needItem.quantity_required - needItem.quantity_confirmed} {needItem.unit}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="donate-message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="donate-message"
                    name="message"
                    autoComplete="off"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a message with your donation..."
                    aria-label="Donation message"
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium resize-y"
                  />
                </div>

                {/* Delivery Date */}
                <div>
                  <label htmlFor="donate-delivery-date" className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donate-delivery-date"
                    name="delivery_date"
                    autoComplete="off"
                    type="date"
                    required
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    aria-label="Estimated delivery date"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                  />
                </div>

                {/* Donor Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Donor Type
                  </label>
                  <div className="flex gap-6">
                    <label htmlFor="donate-type-private" className="flex items-center cursor-pointer select-none">
                      <input
                        id="donate-type-private"
                        name="donor_type"
                        type="radio"
                        value="private"
                        checked={donorType === "private"}
                        onChange={() => handleDonorTypeChange("private")}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-800">Private Donor</span>
                    </label>
                    <label htmlFor="donate-type-org" className="flex items-center cursor-pointer select-none">
                      <input
                        id="donate-type-org"
                        name="donor_type"
                        type="radio"
                        value="organization"
                        checked={donorType === "organization"}
                        onChange={() => handleDonorTypeChange("organization")}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-800">Organization</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Donor Fields */}
                {donorType === "private" ? (
                  <div className="space-y-4 bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-gray-900 text-sm">
                      Donor Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <input
                          id="donate-donor-name"
                          name="donor_name"
                          autoComplete="name"
                          type="text"
                          required
                          placeholder="Full Name (e.g., John Doe) *"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          id="donate-donor-email"
                          name="donor_email"
                          autoComplete="email"
                          type="email"
                          required
                          placeholder="Email Address *"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <input
                        id="donate-donor-phone"
                        name="donor_phone"
                        autoComplete="tel"
                        type="tel"
                        required
                        placeholder="Contact Number *"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <textarea
                        id="donate-donor-address"
                        name="donor_address"
                        autoComplete="street-address"
                        required
                        placeholder="Address *"
                        value={donorAddress}
                        onChange={(e) => setDonorAddress(e.target.value)}
                        rows={2}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm resize-y"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-100">
                    <h3 className="font-bold text-gray-900 text-sm">
                      Organization Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <input
                          id="donate-org-name"
                          name="organization_name"
                          autoComplete="organization"
                          type="text"
                          required
                          placeholder="Organization Name *"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          id="donate-org-program"
                          name="organization_program"
                          autoComplete="off"
                          type="text"
                          placeholder="Program Name"
                          value={organizationProgram}
                          onChange={(e) => setOrganizationProgram(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          id="donate-officer-name"
                          name="officer_name"
                          autoComplete="name"
                          type="text"
                          required
                          placeholder="Officer Name *"
                          value={organizationOfficerName}
                          onChange={(e) => setOrganizationOfficerName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          id="donate-officer-designation"
                          name="officer_designation"
                          autoComplete="organization-title"
                          type="text"
                          required
                          placeholder="Officer Designation *"
                          value={organizationOfficerDesignation}
                          onChange={(e) =>
                            setOrganizationOfficerDesignation(e.target.value)
                          }
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          id="donate-officer-phone"
                          name="officer_phone"
                          autoComplete="tel"
                          type="tel"
                          required
                          placeholder="Officer Contact Number *"
                          value={organizationOfficerContact}
                          onChange={(e) =>
                            setOrganizationOfficerContact(e.target.value)
                          }
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          id="donate-org-email"
                          name="organization_email"
                          autoComplete="email"
                          type="email"
                          required
                          placeholder="Email Address *"
                          value={organizationEmail}
                          onChange={(e) => setOrganizationEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer buttons */}
              <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 shrink-0 bg-slate-50/80 sm:bg-white z-10">
                <button
                  type="button"
                  onClick={() => setConfirmAction("cancel")}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-semibold transition active:scale-95 cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  Donate
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
