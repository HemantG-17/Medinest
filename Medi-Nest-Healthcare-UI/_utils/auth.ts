import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export type Role = "patient" | "doctor" | "admin";

/**
 * Login user
 */
export const loginUser = async (email: string, password: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Invalid credentials");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Login Error:", error.message);
    throw error;
  }
};

/**
 * Register user
 */
export const registerUser = async (formData: FormData): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        // Fetch will automatically set the Content-Type for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Register Error:", error.message);
    throw error;
  }
};
