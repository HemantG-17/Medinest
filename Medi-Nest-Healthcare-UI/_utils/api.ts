import { getToken } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Helper: Auth Fetch
 */
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    Authorization: token ? `Bearer ${token}` : "",
  };

  // Only set Content-Type if body is NOT FormData (fetch sets it automatically)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

/**
 * AI Chat API
 */
export const aiChat = async (message: string, history: any[] = []) => {
  return authFetch(`${API_URL}/ai/chat`, {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
};

/**
 * APPOINTMENTS
 */
export const getMyAppointments = async () => {
  return authFetch(`${API_URL}/appointments/my`);
};

export const cancelAppointment = async (id: string) => {
  return authFetch(`${API_URL}/appointments/${id}/cancel`, {
    method: "PATCH",
  });
};

export const getDoctorAppointments = async () => {
  return authFetch(`${API_URL}/appointments/doctor`);
};

export const createAppointment = async (data: any) => {
  return authFetch(`${API_URL}/appointments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getSlots = async (doctorId: string, date: string) => {
  return authFetch(`${API_URL}/appointments/slots?doctorId=${doctorId}&date=${date}`);
};

export const approveAppointment = async (id: string) => {
  return authFetch(`${API_URL}/appointments/${id}/approve`, {
    method: "PATCH",
  });
};

export const rejectAppointment = async (id: string, rejectionReason?: string) => {
  return authFetch(`${API_URL}/appointments/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
};

export const verifyOtp = async (id: string, otp: string) => {
  return authFetch(`${API_URL}/appointments/${id}/verify-otp`, {
    method: "PATCH",
    body: JSON.stringify({ otp }),
  });
};

/**
 * AUTH
 */
export const registerApi = async (
  name: string,
  email: string,
  password: string,
  role: string,
  specialization: string,
  clinicName: string,
  phone: string,
  clinicAddress: string,
  clinicMapLink: string,
  documents: any[]
) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("password", password);
  formData.append("role", role);
  formData.append("specialization", specialization);
  formData.append("clinicName", clinicName);
  formData.append("phone", phone);
  formData.append("clinicAddress", clinicAddress);
  formData.append("clinicMapLink", clinicMapLink);

  if (documents && documents.length > 0) {
    documents.forEach((doc) => {
      formData.append("documents", {
        uri: doc.uri,
        name: doc.name || "document",
        type: doc.type || "application/octet-stream",
      } as any);
    });
  }

  return authFetch(`${API_URL}/auth/register`, {
    method: "POST",
    body: formData,
  });
};

export const updateProfilePicApi = async (uri: string) => {
  const formData = new FormData();
  formData.append("profilePic", {
    uri,
    name: "profile.jpg",
    type: "image/jpeg",
  } as any);

  return authFetch(`${API_URL}/users/profile-pic`, {
    method: "PATCH",
    body: formData,
  });
};

/**
 * DOCTORS
 */
export const getDoctorMe = async () => {
  return authFetch(`${API_URL}/doctor/me`);
};

export const getDoctorList = async (city?: string) => {
  const url = city ? `${API_URL}/doctor/list?city=${city}` : `${API_URL}/doctor/list`;
  return authFetch(url);
};

export const getDoctorById = async (id: string) => {
  return authFetch(`${API_URL}/doctor/${id}`);
};

export const updateDoctorProfile = async (data: any) => {
  // If data contains documents, use FormData
  if (data.documents) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "documents") {
        data.documents.forEach((doc: any) => {
          formData.append("documents", {
            uri: doc.uri,
            name: doc.name,
            type: doc.type,
          } as any);
        });
      } else if (key === "availability") {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    return authFetch(`${API_URL}/doctor/profile`, {
      method: "PATCH",
      body: formData,
    });
  }

  return authFetch(`${API_URL}/doctor/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};


export const applyAsDoctor = async (formData: FormData) => {
  return authFetch(`${API_URL}/doctor/apply`, {
    method: "POST",
    body: formData,
  });
};

/**
 * REVIEWS
 */
export const getReviews = async (doctorId: string) => {
  return authFetch(`${API_URL}/reviews/${doctorId}`);
};

export const addReview = async (data: { doctorId: string; rating: number; comment: string }) => {
  return authFetch(`${API_URL}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * ADMIN
 */
export const getAllDoctors = async () => {
  return authFetch(`${API_URL}/admin/doctors`);
};

export const getAdminStats = async () => {
  return authFetch(`${API_URL}/admin/stats`);
};

export const approveDoctor = async (id: string) => {
  return authFetch(`${API_URL}/admin/approve/${id}`, {
    method: "PATCH",
  });
};

export const rejectDoctor = async (id: string) => {
  return authFetch(`${API_URL}/admin/reject/${id}`, {
    method: "DELETE",
  });
};

/**
 * AI ADMIN
 */
export const getUnrecognizedQueries = async () => {
  return authFetch(`${API_URL}/ai/unrecognized`);
};

export const teachAI = async (data: {
  queryId: string;
  keywords: string[];
  conditions: string;
  specialist: string;
  tips: string;
}) => {
  return authFetch(`${API_URL}/ai/teach`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};
