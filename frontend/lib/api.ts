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
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User; // Optional because standard JWT response might only have tokens, but we'll try to include user or fetch it separately
}

export interface RegisterPayload {
  username: string;
  password: string;
  password2: string;
  email?: string;
  phone_number?: string;
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
  org_type?:
    | "HOSPITAL"
    | "CLINIC"
    | "SCHOOL"
    | "NGO"
    | "CHARITY"
    | "GOVERNMENT"
    | "OTHER";
  description?: string;
  phone?: string;
  email_contact?: string;
  website?: string;
  established_year?: number;
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
  // Add bearer token automatically when available.
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as HeadersInit),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      // Optional: Trigger logout or redirect if 401
    }
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.detail) {
        errorMessage = errorJson.detail;
      } else {
        // Django REST Framework returns field-level errors like {"password": ["Too common."]}
        const messages: string[] = [];
        for (const [field, errors] of Object.entries(errorJson)) {
          if (Array.isArray(errors)) {
            messages.push(`${field}: ${(errors as string[]).join(", ")}`);
          } else if (typeof errors === "string") {
            messages.push(`${field}: ${errors}`);
          }
        }
        if (messages.length > 0) {
          errorMessage = messages.join("\n");
        }
      }
    } catch {}
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// --- AUTH FUNCTIONS (Phase 2: Real Backend) ---

export async function loginUser(
  username: string,
  password: string,
): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(
  data: RegisterPayload,
): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<User> {
  return fetchAPI<User>("/auth/me/", {
    method: "GET",
  });
}

export async function updateCurrentUser(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  current_password?: string;
  new_password?: string;
  new_password2?: string;
}): Promise<User> {
  return fetchAPI<User>("/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// --- END AUTH FUNCTIONS ---

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
  fetchAPI<void>(`/organizations/${id}/`, { method: "DELETE" });

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
  fetchAPI<void>(`/sections/${id}/`, { method: "DELETE" });

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
  fetchAPI<void>(`/needs/${id}/`, { method: "DELETE" });

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

  // Get token for authenticated upload
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken");
  }

  const response = await fetch(`${API_BASE_URL}/documents/`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
