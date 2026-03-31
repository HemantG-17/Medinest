import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { clearAuth, getUser, updateUser } from "../../_utils/storage";
import { updateProfilePicApi } from "../../_utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function DoctorProfile() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getUser();
        if (!data) {
          router.replace("/login");
        } else {
          setUser(data);
        }
      } catch (err) {
        console.log("Error loading doctor user:", err);
      } finally {
        setUserLoading(false);
      }
    };
    load();
  }, []);

  const pickImage = async () => {
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
      const updatedUser = await updateUser({ profilePic: data.profilePic });
      setUser(updatedUser);
      Alert.alert("Success", "Profile picture updated!");
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/login");
        }
      }
    ]);
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "DR";
  };

  const MenuItem = ({ icon, label, subtitle, onPress, danger }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && { backgroundColor: "#fee2e2" }]}>
        <Ionicons name={icon} size={20} color={danger ? "#dc2626" : "#0eb5b5"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: "#dc2626" }]}>{label}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={18} color="#d1d5db" />}
    </TouchableOpacity>
  );

  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0eb5b5" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* NAME & SPECIALIZATION HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {loading ? (
              <View style={styles.avatar}>
                <ActivityIndicator color="#0eb5b5" />
              </View>
            ) : user.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={pickImage} disabled={loading}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>{user.name || "Doctor"}</Text>
          <Text style={styles.email}>{user.email || "—"}</Text>
          <View style={styles.specBadge}>
            <Text style={styles.specBadgeText}>{user.specialization || "Doctor"}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Doctor</Text>
          </View>
        </View>

        {/* CONTACT INFO CARD */}
        <View style={styles.infoCard}>
          {user.phone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>{user.phone}</Text>
            </View>
          ) : null}
          {user.clinicName ? (
            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>{user.clinicName}</Text>
            </View>
          ) : null}
          {user.clinicAddress ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>{user.clinicAddress}</Text>
            </View>
          ) : null}
          {!user.phone && !user.clinicName && !user.clinicAddress && (
            <Text style={{ color: "#9ca3af", textAlign: "center", paddingVertical: 8 }}>No contact info available</Text>
          )}
        </View>

        {/* ACCOUNT SECTION */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="calendar-outline"
            label="Manage Schedule"
            subtitle="Set available days & slots"
            onPress={() => router.push("/doctor/manage-schedule")}
          />
        </View>

        {/* APP SECTION */}
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => Alert.alert("Privacy Policy", "Coming soon.")} />
          <View style={styles.divider} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => Alert.alert("Help & Support", "Email us at support@medinest.com")} />
          <View style={styles.divider} />
          <MenuItem icon="information-circle-outline" label="About Medinest" subtitle="Version 1.0.0" onPress={() => {}} />
        </View>

        {/* SIGN OUT */}
        <View style={styles.menuCard}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM TABS */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 6 }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace("/doctor/dashboard")}>
          <Ionicons name="home-outline" size={24} color="#9ca3af" />
          <Text style={[styles.tabLabel, { color: "#9ca3af" }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color="#0eb5b5" />
          <Text style={[styles.tabLabel, { color: "#0eb5b5" }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 55, paddingBottom: 20 },

  profileHeader: { alignItems: "center", marginBottom: 20 },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "#e6f9f9", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  editBtn: {
    position: "absolute",
    bottom: 8,
    right: 0,
    backgroundColor: "#0eb5b5",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: { fontSize: 26, fontWeight: "bold", color: "#0eb5b5" },
  name: { fontSize: 20, fontWeight: "800", color: "#111827" },
  email: { fontSize: 13, color: "#9ca3af", marginTop: 2, marginBottom: 10 },
  specBadge: { backgroundColor: "#e6f9f9", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 6 },
  specBadgeText: { color: "#0eb5b5", fontWeight: "700", fontSize: 13 },
  roleBadge: { backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleBadgeText: { color: "#6b7280", fontWeight: "600", fontSize: 12 },

  infoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, elevation: 1, borderWidth: 1, borderColor: "#f3f4f6" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  infoText: { fontSize: 14, color: "#374151", fontWeight: "500" },

  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  menuCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 16, elevation: 1, borderWidth: 1, borderColor: "#f3f4f6" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16, gap: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e6f9f9", justifyContent: "center", alignItems: "center" },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#111827" },
  menuSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 16 },

  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#f3f4f6", paddingBottom: 20, paddingTop: 10 },
  tabItem: { flex: 1, alignItems: "center", gap: 3 },
  tabLabel: { fontSize: 11, fontWeight: "600" },
});
