"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUpload, getDocuments, statusColors } from "@/lib/api";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import ManualNeedEntryForm from "@/components/ManualNeedEntryForm";
import { PageLoading } from "@/components/LoadingSpinner";
import { useAdminGuard } from "@/lib/useAuthGuard";

export default function DocumentsPage() {
  const router = useRouter();
  const { authorized, isLoading: authLoading } = useAdminGuard();
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (!authorized) return;

    async function fetchDocuments() {
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, [authorized]);

  if (authLoading || !authorized) {
    return <PageLoading />;
  }

  const handleUpload = async (file: File) => {
    // In a real app, you'd call the API here
    console.log("Uploading file:", file.name);
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Refresh documents list
    const docs = await getDocuments();
    setDocuments(docs);
  };

  const statusLabels = {
    PENDING: "Pending Processing",
    PROCESSED: "Processed by AI",
    APPROVED: "Approved",
    FAILED: "Failed",
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Document Processing
          </h1>
          <p className="text-gray-500 mt-1">
            Upload PDF documents for AI-powered needs extraction
          </p>
        </div>
        <button
          onClick={() => setShowManualForm(true)}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
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
          Add Need Manually
        </button>
      </div>

      {/* Manual Need Entry side panel */}
      {showManualForm && (
        <ManualNeedEntryForm
          onClose={() => setShowManualForm(false)}
          onSuccess={() => router.push("/needs")}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <DocumentUploadForm onUpload={handleUpload} />

          {/* How it works */}
          <div className="mt-6 bg-blue-50 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3">How it works</h4>
            <ol className="space-y-3 text-sm text-blue-800">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-medium">
                  1
                </span>
                <span>
                  Upload a PDF document containing your organization&apos;s
                  needs
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-medium">
                  2
                </span>
                <span>
                  Our AI analyzes and extracts items with quantities and
                  priorities
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-medium">
                  3
                </span>
                <span>
                  Review and approve the extracted data before adding to the
                  system
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Uploaded Documents
              </h3>
            </div>

            {documents.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Document #{doc.id}
                          </p>
                          <p className="text-sm text-gray-500">
                            Uploaded{" "}
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[doc.status]}`}
                        >
                          {statusLabels[doc.status]}
                        </span>

                        {doc.status === "PROCESSED" && (
                          <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Review
                          </button>
                        )}

                        {doc.status === "APPROVED" && (
                          <button className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                            View Items
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI Extracted Preview */}
                    {doc.status === "PROCESSED" && doc.ai_extracted_json && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          AI Extracted Data Preview:
                        </p>
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(doc.ai_extracted_json, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-500">No documents uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload a PDF to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
