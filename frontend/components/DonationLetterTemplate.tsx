import React from "react";
import { DonationFormData } from "./DonateModal";

interface DonationLetterTemplateProps {
  donation: DonationFormData & {
    need: {
      name: string;
      description: string;
      quantity_required: number;
    };
    organization: {
      name: string;
      registration_number: string;
      address: string;
    };
    section: {
      name: string;
    };
  };
  referenceNumber: string;
}

export const DonationLetterTemplate = React.forwardRef<
  HTMLDivElement,
  DonationLetterTemplateProps
>(({ donation, referenceNumber }, ref) => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isOrganization = donation.donorType === "organization";

  return (
    <div
      ref={ref}
      className="w-full bg-white p-12 text-gray-800 letter-template-wrapper"
    >
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">NEEDTRACKER</h1>
        <p className="text-sm text-gray-600">
          Donation Management &amp; Hospital Needs Fulfillment System
        </p>
      </div>

      {/* Document Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          DONATION PLEDGE CONFIRMATION LETTER
        </h2>
        <p className="text-sm text-gray-600">
          Reference Number:{" "}
          <span className="font-semibold">{referenceNumber}</span>
        </p>
        <p className="text-sm text-gray-600">Date: {today}</p>
      </div>

      {/* Organization Details */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-2">
          RECIPIENT ORGANIZATION:
        </h3>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="font-semibold mb-1">{donation.organization.name}</p>
          <p className="text-sm">{donation.organization.address}</p>
          <p className="text-sm">
            Registration: {donation.organization.registration_number}
          </p>
          <p className="text-sm">Section: {donation.section.name}</p>
        </div>
      </div>

      {/* Donation Details */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-2">DONATION COMMITMENT:</h3>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="mb-2">
            <span className="font-semibold">Item Required:</span>{" "}
            {donation.need.name}
          </p>
          <p className="text-sm mb-2 text-gray-700">
            Description: {donation.need.description}
          </p>
          <table className="quantity-table">
            <tbody>
              <tr>
                <td className="quantity-table-label">Quantity Pledged:</td>
                <td className="quantity-table-line"></td>
              </tr>
            </tbody>
          </table>
          <p className="mb-2">
            <span className="font-semibold">Total Required:</span>{" "}
            {donation.need.quantity_required} units
          </p>
          <table className="quantity-table">
            <tbody>
              <tr>
                <td className="quantity-table-label">
                  Estimated Delivery Date (mm/dd/yyyy):
                </td>
                <td className="quantity-table-line"></td>
              </tr>
            </tbody>
          </table>
          {donation.message && (
            <p className="text-sm">
              <span className="font-semibold">Additional Notes:</span>{" "}
              {donation.message}
            </p>
          )}
        </div>
      </div>

      {/* Donor Details */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-2">
          {isOrganization ? "ORGANIZATION SPONSOR DETAILS:" : "DONOR DETAILS:"}
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          {isOrganization ? (
            <>
              <p className="mb-2">
                <span className="font-semibold">Organization Name:</span>{" "}
                {donation.organizationName || donation.governmentDepartment}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Program/Scheme:</span>{" "}
                {donation.organizationProgram || donation.governmentProgram}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Officer&apos;s Name:</span>{" "}
                {donation.organizationOfficerName || donation.governmentOfficerName}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Designation:</span>{" "}
                {donation.organizationOfficerDesignation || donation.governmentOfficerDesignation}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Contact Number:</span>{" "}
                {donation.organizationOfficerContact || donation.governmentOfficerContact}
              </p>
            </>
          ) : (
            <>
              <p className="mb-2">
                <span className="font-semibold">Full Name:</span>{" "}
                {donation.donorName}
              </p>
              {donation.donorOrganization && (
                <p className="mb-2">
                  <span className="font-semibold">Organization:</span>{" "}
                  {donation.donorOrganization}
                </p>
              )}
              <p className="mb-2">
                <span className="font-semibold">Address:</span>{" "}
                {donation.donorAddress}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Email:</span>{" "}
                {donation.donorEmail}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Phone:</span>{" "}
                {donation.donorPhone}
              </p>
              {donation.donorContact && (
                <p className="text-sm">
                  <span className="font-semibold">Additional Contact:</span>{" "}
                  {donation.donorContact}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-2">ACKNOWLEDGEMENT:</h3>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm">
          <p className="mb-2">
            This letter confirms that the above-mentioned donation pledge has
            been recorded in the NeedTracker system. The donor commits to
            providing the specified items by the estimated delivery date.
          </p>
          <p className="mb-2">
            The hospital organization acknowledges this commitment and will
            track the fulfillment of this pledge. Any changes to the commitment
            should be communicated through the NeedTracker system.
          </p>
          <p>
            This confirmation letter serves as official documentation of the
            donation pledge made through NeedTracker.
          </p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-300">
        <div>
          <p className="text-sm text-gray-600 mb-8">
            Donor / Authorized Representative
          </p>
          <div className="border-t border-gray-400 pt-2">
            <p className="text-sm font-semibold">Signature &amp; Date</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-8">Hospital Representative</p>
          <div className="border-t border-gray-400 pt-2">
            <p className="text-sm font-semibold">Signature &amp; Date</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
        <p>This is an automatically generated document from NeedTracker</p>
        <p>Reference Number: {referenceNumber}</p>
      </div>
    </div>
  );
});

DonationLetterTemplate.displayName = "DonationLetterTemplate";
