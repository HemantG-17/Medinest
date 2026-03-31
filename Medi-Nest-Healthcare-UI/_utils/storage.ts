import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "medinest_auth_token";
export const USER_KEY = "medinest_user_data";

/**
 * Save authentication token and user data
 */
export const saveAuth = async (token: string, user: any) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error: any) {
    console.error("Error saving auth:", error.message);
  }
};

/**
 * Get authentication token
 */
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error: any) {
    console.error("Error getting token:", error.message);
    return null;
  }
};

/**
 * Get user data
 */
export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error: any) {
    console.error("Error getting user data:", error.message);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const removeAuth = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error: any) {
    console.error("Error removing auth:", error.message);
  }
};

export const clearAuth = removeAuth;

export const updateUser = async (data: any) => {
  try {
    const user = await getUser();
    if (user) {
      const updatedUser = { ...user, ...data };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      
      // Also update standalone items for easy access
      if (data.name) await AsyncStorage.setItem("name", data.name);
      if (data.profilePic) await AsyncStorage.setItem("profilePic", data.profilePic);
      
      return updatedUser;
    }
  } catch (error: any) {
    console.error("Error updating user data:", error.message);
  }
  return null;
};
