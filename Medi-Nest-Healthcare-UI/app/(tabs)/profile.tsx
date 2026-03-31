import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearAuth, getUser, updateUser } from "../../_utils/storage";
import { updateProfilePicApi } from "../../_utils/api";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getUser();
        if (!data) {
          router.replace("/login");
        } else {
          setUser(data);
        }
      } catch (err) {
        console.log("Error loading user:", err);
      } finally {
        setUserLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await clearAuth();
    router.replace("/login");
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert("Permission Denied", "We need access to your photos to upload a profile picture.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      const data = await updateProfilePicApi(uri);

      // Update local storage and state
      const updatedUser = await updateUser({ profilePic: data.profilePic });
      setUser(updatedUser);
      Alert.alert("Success", "Profile picture updated!");
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "ME";
  };

  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0eb5b5" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.headerTitle}>My Profile</Text>

      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {loading ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator color="#0eb5b5" />
            </View>
          ) : user.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editBtn}
            onPress={pickImage}
            disabled={loading}
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/appointment")}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#e6f9f9" }]}>
            <Ionicons name="calendar" size={20} color="#0eb5b5" />
          </View>
          <Text style={styles.menuText}>My Appointments</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="settings" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: "#fee2e2" }]}>
            <Ionicons name="help-circle" size={20} color="#ef4444" />
          </View>
          <Text style={styles.menuText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutBtn}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 24 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 32,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#e6f9f9",
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#e6f9f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0eb5b5",
  },
  editBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0eb5b5",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  userEmail: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6b7280",
    letterSpacing: 1,
  },

  menuSection: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fff",
    gap: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },
});