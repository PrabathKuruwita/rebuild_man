"use client";

import { useState } from "react";
import { Section } from "@/lib/api";
import NeedCard from "./NeedCard";

interface SectionAccordionProps {
  section: Section;
  defaultOpen?: boolean;
  onAddNeed?: () => void;
  onEditNeed?: (needId: number) => void;
  onDeleteNeed?: (needId: number) => void;
  onEditSection?: () => void;
  onDeleteSection?: () => void;
}

export default function SectionAccordion({
  section,
  defaultOpen = false,
  onAddNeed,
  onEditNeed,
  onDeleteNeed,
  onEditSection,
  onDeleteSection,
}: SectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const criticalCount =
    section.needs?.filter((n) => n.priority === "CRITICAL").length || 0;
  const essentialCount =
    section.needs?.filter((n) => n.priority === "ESSENTIAL").length || 0;
  const niceCount =
    section.needs?.filter((n) => n.priority === "NICE").length || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
        <div
          className="flex items-center gap-4 flex-1 min-w-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{section.name}</h3>
            {section.head_of_section && (
              <p className="text-sm text-gray-500">
                Head: {section.head_of_section}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Priority badges */}
          <div className="hidden sm:flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {criticalCount} Critical
              </span>
            )}
            {essentialCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                {essentialCount} Essential
              </span>
            )}
            {niceCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {niceCount} Nice
              </span>
            )}
          </div>

          <span
            className="text-sm text-gray-500"
            onClick={() => setIsOpen(!isOpen)}
          >
            {section.needs?.length || 0} items
          </span>

          {/* Edit section button */}
          {onEditSection && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditSection();
              }}
              title="Edit section"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {/* Delete section button */}
          {onDeleteSection && (
            <div onClick={(e) => e.stopPropagation()}>
              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Delete section?</span>
                  <button
                    onClick={onDeleteSection}
                    className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Delete section"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          <svg
            onClick={() => setIsOpen(!isOpen)}
            className={`w-5 h-5 text-gray-400 transition-transform cursor-pointer ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Add Need button */}
          {onAddNeed && (
            <div className="flex justify-end mt-4 mb-3">
              <button
                onClick={onAddNeed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Need
              </button>
            </div>
          )}

          {section.needs && section.needs.length > 0 ? (
            <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.needs.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  onEdit={onEditNeed ? () => onEditNeed(need.id) : undefined}
                  onDelete={
                    onDeleteNeed ? () => onDeleteNeed(need.id) : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p>No needs registered for this section</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
