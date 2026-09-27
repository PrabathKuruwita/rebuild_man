"use client";

import { useState } from "react";
import { Donation, NeedItem } from "@/lib/api";
import { Loader2, X } from "lucide-react";
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
  const [quantity, setQuantity] = useState<number>(1);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const donationData: Partial<Donation> = {
        need_item: needItem.id,
        quantity: quantity,
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
      setIsLoading(false);
      onSuccess();
    } catch (err: unknown) {
      setIsLoading(false);
      console.error("Donation creation error:", err);
    }
  };

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
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Make a Donation
            </h2>
            <p className="text-gray-800 font-medium mt-1">{needItem.name}</p>
            {needItem.section_detail && (
              <p className="text-gray-500 text-sm mt-0.5">
                {needItem.section_detail.organization_name}{" "}
                {needItem.section_detail.name
                  ? `• ${needItem.section_detail.name}`
                  : ""}
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close donation modal"
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="mb-5 flex items-center justify-center">
                <SuccessCheckmark size="xl" />
              </div>
              <div className="animate-success-content space-y-2 max-w-md">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Donation Submitted Successfully!
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  Thank you for your generous donation. The organization will
                  review and confirm your donation shortly.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Quantity Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Donate ({needItem.unit}) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max={needItem.quantity_required}
                    required
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    aria-label="Quantity to donate"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Max:{" "}
                    {needItem.quantity_required - needItem.quantity_received}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message with your donation..."
                  aria-label="Donation message"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  aria-label="Estimated delivery date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Donor Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Donor Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="private"
                      checked={donorType === "private"}
                      onChange={() => handleDonorTypeChange("private")}
                      className="mr-2"
                    />
                    <span>Private Donor</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="organization"
                      checked={donorType === "organization"}
                      onChange={() => handleDonorTypeChange("organization")}
                      className="mr-2"
                    />
                    <span>Organization</span>
                  </label>
                </div>
              </div>

              {/* Conditional Donor Fields */}
              {donorType === "private" ? (
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">
                    Donor Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Full Name (e.g., John Doe) *"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address *"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Contact Number *"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <textarea
                      required
                      placeholder="Address *"
                      value={donorAddress}
                      onChange={(e) => setDonorAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">
                    Organization Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Organization Name *"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Program Name"
                      value={organizationProgram}
                      onChange={(e) => setOrganizationProgram(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Officer Name *"
                      value={organizationOfficerName}
                      onChange={(e) => setOrganizationOfficerName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Officer Designation *"
                      value={organizationOfficerDesignation}
                      onChange={(e) =>
                        setOrganizationOfficerDesignation(e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Officer Contact Number *"
                      value={organizationOfficerContact}
                      onChange={(e) =>
                        setOrganizationOfficerContact(e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address *"
                      value={organizationEmail}
                      onChange={(e) => setOrganizationEmail(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={18} className="animate-spin" />}
                  {isLoading ? "Creating..." : "Donate"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
