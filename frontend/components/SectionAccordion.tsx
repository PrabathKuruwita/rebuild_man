"use client";

import { useState } from "react";
import { Section } from "@/lib/api";
import NeedCard from "./NeedCard";

interface SectionAccordionProps {
  section: Section;
  organizationName?: string;
  defaultOpen?: boolean;
  onAddNeed?: () => void;
  onEditNeed?: (needId: number) => void;
  onDeleteNeed?: (needId: number) => void;
  onEditSection?: () => void;
  onDeleteSection?: () => Promise<void>;
}

export default function SectionAccordion({
  section,
  organizationName,
  defaultOpen = false,
  onAddNeed,
  onEditNeed,
  onDeleteNeed,
  onEditSection,
  onDeleteSection,
}: SectionAccordionProps) {
  const [prevDefaultOpen, setPrevDefaultOpen] = useState(defaultOpen);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (defaultOpen !== prevDefaultOpen) {
    setPrevDefaultOpen(defaultOpen);
    setIsOpen(defaultOpen);
  }

  const criticalCount =
    section.needs?.filter((n) => n.priority === "CRITICAL").length || 0;
  const essentialCount =
    section.needs?.filter((n) => n.priority === "ESSENTIAL").length || 0;
  const niceCount =
    section.needs?.filter((n) => n.priority === "NICE").length || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
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

          <span className="text-sm text-gray-500">
            {section.needs?.length || 0} items
          </span>

          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4 pt-4">
            {onAddNeed && (
              <button
                onClick={onAddNeed}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Need
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {onEditSection && (
                <button
                  onClick={onEditSection}
                  title="Edit section"
                  aria-label="Edit section"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
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
              {onDeleteSection && (
                <button
                  onClick={onDeleteSection}
                  title="Delete section"
                  aria-label="Delete section"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
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
          </div>

          {section.needs && section.needs.length > 0 ? (
            <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.needs.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  sectionName={section.name}
                  organizationName={organizationName}
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
