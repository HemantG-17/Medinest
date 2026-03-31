import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from "react-native";
import { router } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorList } from "../../_utils/api";
import * as Location from "expo-location";

const THEME_COLORS: Record<string, { bg: string; text: string }> = {
  Cardiologist: { bg: "#fee2e2", text: "#ef4444" },
  Dermatologist: { bg: "#f3e8ff", text: "#9333ea" },
  Pediatrician: { bg: "#fef3c7", text: "#d97706" },
  Neurologist: { bg: "#dbeafe", text: "#3b82f6" },
  Dentist: { bg: "#ccfbf1", text: "#14b8a6" },
  default: { bg: "#e6f9f9", text: "#0eb5b5" }
};

export default function PatientDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientName, setPatientName] = useState("Patient");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [locationCity, setLocationCity] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        
        let location = await Location.getCurrentPositionAsync({});
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        if (geocode.length > 0) {
          const city = geocode[0].city || geocode[0].subregion || geocode[0].district;
          if (city) {
            setLocationCity(city.toLowerCase());
          }
        }
      } catch (err) {
        console.log("Location access error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const name = await AsyncStorage.getItem("name");
      const pic = await AsyncStorage.getItem("profilePic");
      if (name) setPatientName(name);
      if (pic) setPatientPic(pic);
    };
    fetchProfile();
  }, []);

  const [patientPic, setPatientPic] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorsData = async () => {
      try {
        const data = await getDoctorList();
        setDoctors(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorsData();
  }, []);

  const filteredDoctors = useMemo(() => {
    let result = doctors;
    if (category !== "All") {
      result = result.filter((doc) => doc.specialization === category);
    }
    if (search) {
      const text = search.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(text) ||
          doc.specialization?.toLowerCase().includes(text) ||
          doc.clinicName?.toLowerCase().includes(text) ||
          doc.clinicAddress?.toLowerCase().includes(text) ||
          doc.city?.toLowerCase().includes(text)
      );
    }

    if (locationCity) {
      result = [...result].sort((a, b) => {
        const isALocal = a.city?.toLowerCase().includes(locationCity) || a.clinicAddress?.toLowerCase().includes(locationCity);
        const isBLocal = b.city?.toLowerCase().includes(locationCity) || b.clinicAddress?.toLowerCase().includes(locationCity);
        if (isALocal && !isBLocal) return -1;
        if (!isALocal && isBLocal) return 1;
        return 0;
      });
    }

    return result;
  }, [search, category, doctors, locationCity]);

  const categories = ["All", ...Array.from(new Set(doctors.map(d => d.specialization || "General").filter(Boolean)))];

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "DR";
  };

  const getColorTheme = (spec: string) => {
    return THEME_COLORS[spec] || THEME_COLORS.default;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
        <ActivityIndicator size="large" color="#0eb5b5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Image 
              source={require("../../assets/images/logo-premium.png")} 
              style={styles.logoMini} 
            />
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.patientName}>{patientName}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileBadge}
            onPress={() => router.push("/profile")}
          >
            {patientPic ? (
              <Image source={{ uri: patientPic }} style={styles.profileBadgeImage} />
            ) : (
              <Text style={styles.profileBadgeText}>{patientName.charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            placeholder="Search doctors, specializations, locations..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* CATEGORY PILLS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingRight: 20 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.categoryPill,
                category === cat && styles.categoryPillActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  category === cat && styles.categoryPillTextActive
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* RESULTS COUNT */}
        <Text style={styles.resultsCount}>{filteredDoctors.length} doctors available</Text>

        {/* DOCTOR LIST CARDS */}
        <View style={styles.listContainer}>
          {filteredDoctors.map((doc) => {
            const spec = doc.specialization || "General";
            const theme = getColorTheme(spec);
            const isLocal = locationCity && (doc.city?.toLowerCase().includes(locationCity) || doc.clinicAddress?.toLowerCase().includes(locationCity));

            return (
              <TouchableOpacity
                key={doc._id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/patient/doctor-details", params: { doctorId: doc._id } })}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: theme.bg }]}>
                  {doc.profilePic ? (
                    <Image source={{ uri: doc.profilePic }} style={styles.avatarImage} />
                  ) : (
                    <Text style={[styles.avatarText, { color: theme.text }]}>
                      {getInitials(doc.name)}
                    </Text>
                  )}
                </View>

                {/* Details */}
                <View style={styles.cardContent}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    {isLocal && (
                      <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, color: "#166534", fontWeight: "bold" }}>📍 Nearest</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.specRow}>
                    <View style={[styles.specDot, { backgroundColor: theme.text }]} />
                    <Text style={[styles.docSpec, { color: "#6b7280" }]}>{spec}</Text>
                  </View>

                  <Text style={styles.clinicName}>{doc.clinicName || "Private Practice"}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.fees}>₹ {doc.fees || 0} / visit</Text>
                    <View style={styles.locationGroup}>
                      <Ionicons name="location-outline" size={12} color="#9ca3af" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {doc.clinicAddress || doc.city || "Various Locations"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Arrow */}
                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoMini: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  patientName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f9f9",
    justifyContent: "center",
    alignItems: "center",
  },
  profileBadgeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0eb5b5",
  },
  profileBadgeImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  searchContainer: {
    position: "relative",
    marginBottom: 20,
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 14,
    paddingVertical: 14,
    paddingLeft: 46,
    paddingRight: 20,
    fontSize: 15,
    color: "#111827",
  },
  categoryScroll: {
    marginBottom: 20,
    maxHeight: 45,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    marginRight: 10,
    alignSelf: "flex-start",
  },
  categoryPillActive: {
    backgroundColor: "#0eb5b5",
    borderColor: "#0eb5b5",
  },
  categoryPillText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 14,
  },
  categoryPillTextActive: {
    color: "#fff",
  },
  resultsCount: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  docName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  specDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  docSpec: {
    fontSize: 13,
    fontWeight: "600",
  },
  clinicName: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#f3f4f6"
  },
  fees: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
  },
  locationGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 120
  },
  locationText: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500"
  },
  arrowContainer: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "flex-end"
  }
});