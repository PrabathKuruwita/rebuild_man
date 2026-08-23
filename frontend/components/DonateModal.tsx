"use client";

import { useState } from "react";
import Link from "next/link";
import { Donation, NeedItem } from "@/lib/api";
import { Loader2, X } from "lucide-react";

export interface DonationFormData {
  quantity: number;
  message: string;
  estimatedDeliveryDate: string;
  donorType: "private" | "government";
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorOrganization: string;
  donorAddress: string;
  donorContact: string;
  governmentDepartment: string;
  governmentProgram: string;
  governmentOfficerName: string;
  governmentOfficerDesignation: string;
  governmentOfficerContact: string;
  governmentEmail: string;
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
  const [donorType, setDonorType] = useState<"private" | "government">(
    "private",
  );

  // Private donor fields
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorOrganization, setDonorOrganization] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorContact, setDonorContact] = useState("");

  // Government donor fields
  const [governmentDepartment, setGovernmentDepartment] = useState("");
  const [governmentProgram, setGovernmentProgram] = useState("");
  const [governmentOfficerName, setGovernmentOfficerName] = useState("");
  const [governmentOfficerDesignation, setGovernmentOfficerDesignation] =
    useState("");
  const [governmentOfficerContact, setGovernmentOfficerContact] = useState("");
  const [governmentEmail, setGovernmentEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError(
        "Please sign in to make a donation. Redirecting to login page...",
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
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
        donationData.donor_organization = donorOrganization;
        donationData.donor_address = donorAddress;
        donationData.donor_contact = donorContact;
      } else {
        donationData.government_department = governmentDepartment;
        donationData.government_program = governmentProgram;
        donationData.government_officer_name = governmentOfficerName;
        donationData.government_officer_designation =
          governmentOfficerDesignation;
        donationData.government_officer_contact = governmentOfficerContact;
        donationData.government_email = governmentEmail;
      }

      await createDonation(donationData);

      // Show success message for 3 seconds
      setSuccess(true);
      setIsLoading(false);

      // Close modal after 3 seconds
      setTimeout(() => {
        // Reset form
        setQuantity(1);
        setMessage("");
        setEstimatedDeliveryDate("");
        setDonorType("private");
        setDonorName("");
        setDonorEmail("");
        setDonorPhone("");
        setDonorOrganization("");
        setDonorAddress("");
        setDonorContact("");
        setGovernmentDepartment("");
        setGovernmentProgram("");
        setGovernmentOfficerName("");
        setGovernmentOfficerDesignation("");
        setGovernmentOfficerContact("");
        setGovernmentEmail("");
        setSuccess(false);
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: unknown) {
      setIsLoading(false);
      const message =
        err instanceof Error ? err.message : "Failed to create donation";
      if (message.includes("401")) {
        setError("Your session has expired. Please sign in again.");
      } else if (message.includes("credentials")) {
        setError("Authentication failed. Please sign in again.");
      } else {
        setError(message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-transparent flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
            onClick={onClose}
            aria-label="Close donation modal"
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <div className="text-4xl text-green-600">✓</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Donation Submitted Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Thank you for your generous donation. The organization will
                review and confirm your donation shortly. This modal will close
                automatically in a moment.
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div className="w-full bg-green-600 h-1 rounded-full animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  <p>{error}</p>
                  {error.includes("sign in") && (
                    <Link href="/login">
                      <button
                        type="button"
                        className="mt-2 text-blue-600 hover:text-blue-800 font-semibold underline"
                      >
                        Go to Sign In →
                      </button>
                    </Link>
                  )}
                </div>
              )}

              {/* Quantity Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Donate ({needItem.unit})
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max={needItem.quantity_required}
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
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
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
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="private"
                      checked={donorType === "private"}
                      onChange={(e) =>
                        setDonorType(e.target.value as "private" | "government")
                      }
                      className="mr-2"
                    />
                    <span>Private Donor</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="government"
                      checked={donorType === "government"}
                      onChange={(e) =>
                        setDonorType(e.target.value as "private" | "government")
                      }
                      className="mr-2"
                    />
                    <span>Government</span>
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
                      placeholder="Full Name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Contact Person"
                      value={donorContact}
                      onChange={(e) => setDonorContact(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Organization"
                      value={donorOrganization}
                      onChange={(e) => setDonorOrganization(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Address"
                      value={donorAddress}
                      onChange={(e) => setDonorAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">
                    Government Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Department"
                      value={governmentDepartment}
                      onChange={(e) => setGovernmentDepartment(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Program"
                      value={governmentProgram}
                      onChange={(e) => setGovernmentProgram(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Officer Name"
                      value={governmentOfficerName}
                      onChange={(e) => setGovernmentOfficerName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Officer Designation"
                      value={governmentOfficerDesignation}
                      onChange={(e) =>
                        setGovernmentOfficerDesignation(e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Officer Contact"
                      value={governmentOfficerContact}
                      onChange={(e) =>
                        setGovernmentOfficerContact(e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={governmentEmail}
                      onChange={(e) => setGovernmentEmail(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
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
