// API Configuration and Helper Functions

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types based on Django models
export interface User {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "ORG_ADMIN" | "DONOR";
  phone_number: string;
}

export interface NeedItem {
  id: number;
  section: number;
  name: string;
  priority: "CRITICAL" | "ESSENTIAL" | "NICE";
  quantity_required: number;
  quantity_received: number;
  unit: "UNIT" | "BOX" | "KG" | "LITER";
  description: string;
  created_at: string;
}

export interface Section {
  id: number;
  organization: number;
  name: string;
  head_of_section: string;
  needs: NeedItem[];
}

export interface Organization {
  id: number;
  name: string;
  registration_number: string;
  address?: string;
  district: string;
  sections: Section[];
}

export interface DocumentUpload {
  id: number;
  uploaded_by: number;
  organization: number;
  file: string;
  uploaded_at: string;
  status: "PENDING" | "PROCESSED" | "APPROVED" | "FAILED";
  ai_extracted_json: Record<string, unknown> | null;
}

// API Functions
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Organizations
export const getOrganizations = () =>
  fetchAPI<Organization[]>("/organizations/");
export const getOrganization = (id: number) =>
  fetchAPI<Organization>(`/organizations/${id}/`);
export const getOrganizationHierarchy = (id: number) =>
  fetchAPI<Organization>(`/organizations/${id}/hierarchy/`);
export const createOrganization = (data: Partial<Organization>) =>
  fetchAPI<Organization>("/organizations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateOrganization = (id: number, data: Partial<Organization>) =>
  fetchAPI<Organization>(`/organizations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteOrganization = (id: number) =>
  fetch(`${API_BASE_URL}/organizations/${id}/`, { method: "DELETE" });

// Sections
export const getSections = () => fetchAPI<Section[]>("/sections/");
export const getSection = (id: number) => fetchAPI<Section>(`/sections/${id}/`);
export const createSection = (data: Partial<Section>) =>
  fetchAPI<Section>("/sections/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateSection = (id: number, data: Partial<Section>) =>
  fetchAPI<Section>(`/sections/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteSection = (id: number) =>
  fetch(`${API_BASE_URL}/sections/${id}/`, { method: "DELETE" });

// Needs
export const getNeeds = (priority?: string) => {
  const query = priority ? `?priority=${priority}` : "";
  return fetchAPI<NeedItem[]>(`/needs/${query}`);
};
export const getNeed = (id: number) => fetchAPI<NeedItem>(`/needs/${id}/`);
export const createNeed = (data: Partial<NeedItem>) =>
  fetchAPI<NeedItem>("/needs/", { method: "POST", body: JSON.stringify(data) });
export const updateNeed = (id: number, data: Partial<NeedItem>) =>
  fetchAPI<NeedItem>(`/needs/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteNeed = (id: number) =>
  fetch(`${API_BASE_URL}/needs/${id}/`, { method: "DELETE" });

// Documents
export const getDocuments = () => fetchAPI<DocumentUpload[]>("/documents/");
export const uploadDocument = async (
  file: File,
  organizationId: number,
  userId: number,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("organization", organizationId.toString());
  formData.append("uploaded_by", userId.toString());

  const response = await fetch(`${API_BASE_URL}/documents/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload Error: ${response.status}`);
  }

  return response.json();
};

// Priority helpers
export const priorityColors = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  ESSENTIAL: "bg-yellow-100 text-yellow-800 border-yellow-300",
  NICE: "bg-green-100 text-green-800 border-green-300",
};

export const priorityLabels = {
  CRITICAL: "Critical",
  ESSENTIAL: "Essential",
  NICE: "Nice to Have",
};

export const unitLabels = {
  UNIT: "Units",
  BOX: "Boxes",
  KG: "Kilograms",
  LITER: "Liters",
};

export const statusColors = {
  PENDING: "bg-gray-100 text-gray-800",
  PROCESSED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};
