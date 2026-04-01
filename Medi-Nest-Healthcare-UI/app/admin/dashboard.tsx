import { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
  Alert,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getAllDoctors,
  getAdminStats,
  approveDoctor,
  rejectDoctor,
  getUnrecognizedQueries,
  teachAI,
} from "../../_utils/api";
import { clearAuth } from "../../_utils/storage";
import { router } from "expo-router";

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    approvedDoctors: 0,
    pendingDoctors: 0,
    totalPatients: 0,
    unrecognizedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"Pending" | "Approved" | "All">("Pending");
  const [activeTab, setActiveTab] = useState<"Doctors" | "Train AI">("Doctors");
  
  // AI Training state
  const [unrecognized, setUnrecognized] = useState<any[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [aiForm, setAiForm] = useState({
    keywords: "",
    conditions: "",
    specialist: "",
    tips: ""
  });
  const [submittingAI, setSubmittingAI] = useState(false);

  useEffect(() => {
    if (selectedQuery) {
        setAiForm({
            keywords: "",
            conditions: "",
            specialist: "",
            tips: ""
        });
    }
  }, [selectedQuery]);

  const listRef = useRef<FlatList>(null);

  const fetchData = async () => {
    try {
      const [doctorsData, statsData, aiData] = await Promise.all([
        getAllDoctors(),
        getAdminStats(),
        getUnrecognizedQueries()
      ]);
      setDoctors(doctorsData);
      setStats(statsData);
      setUnrecognized(aiData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    await approveDoctor(id);
    fetchData();
  };

  const handleDeactivate = async (id: string) => {
    await rejectDoctor(id);
    fetchData();
  };

  const filteredDoctors = useMemo(() => {
    if (filter === "All") return doctors;
    if (filter === "Approved") return doctors.filter(d => d.isApproved);
    if (filter === "Pending") return doctors.filter(d => !d.isApproved);
    return doctors;
  }, [doctors, filter]);

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <Image 
          source={require("../../assets/images/logo_premium.png")} 
          style={styles.logoMini} 
        />
        <View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Medinest Healthcare Platform</Text>
        </View>
      </View>
      <TouchableOpacity onPress={async () => { await clearAuth(); router.replace("/login"); }} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  const handleTeachSubmit = async () => {
    if (!aiForm.keywords || !aiForm.conditions || !aiForm.specialist) {
      return Alert.alert("Required", "Please fill all required fields");
    }

    try {
      setSubmittingAI(true);
      console.log("Submitting AI Knowledge:", aiForm);
      await teachAI({
        queryId: selectedQuery?._id,
        keywords: aiForm.keywords.split(",").map(k => k.trim()),
        conditions: aiForm.conditions,
        specialist: aiForm.specialist,
        tips: aiForm.tips
      });
      Alert.alert("Success", "AI Taught Successfully!");
      setSelectedQuery(null);
      setAiForm({ keywords: "", conditions: "", specialist: "", tips: "" });
      fetchData();
    } catch (err: any) {
      console.error("Teach AI Frontend Error:", err);
      Alert.alert("Error", err.message || "Error teaching AI");
    } finally {
      setSubmittingAI(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.substring(0, 2).toUpperCase() || "DR";
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0eb5b5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={activeTab === "Doctors" ? filteredDoctors : unrecognized}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                    <Text style={styles.title}>Admin Panel</Text>
                  <Text style={styles.subtitle}>Manage doctors & platform</Text>
                </View>
                <TouchableOpacity 
                  onPress={async () => {
                    await clearAuth();
                    router.replace("/login");
                  }}
                  style={{
                    backgroundColor: "#fee2e2",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20
                  }}
                >
                  <Text style={{ color: "#dc2626", fontWeight: "bold" }}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* STATS GRID */}
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statBox}
                onPress={() => { setActiveTab("Doctors"); setFilter("All"); }}
              >
                <Ionicons name="person-outline" size={24} color="#0eb5b5" />
                <Text style={[styles.statValue, { color: "#0eb5b5" }]}>{stats.totalDoctors}</Text>
                <Text style={styles.statLabel}>Doctors</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statBox}
                onPress={() => { setActiveTab("Doctors"); setFilter("Approved"); }}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color="#16a34a" />
                <Text style={[styles.statValue, { color: "#16a34a" }]}>{stats.approvedDoctors}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statBox}
                onPress={() => { setActiveTab("Doctors"); setFilter("Pending"); }}
              >
                <Ionicons name="time-outline" size={24} color="#f59e0b" />
                <Text style={[styles.statValue, { color: "#f59e0b" }]}>{stats.pendingDoctors}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </TouchableOpacity>
              <View style={styles.statBox}>
                <Ionicons name="people-outline" size={24} color="#3b82f6" />
                <Text style={[styles.statValue, { color: "#3b82f6" }]}>{stats.totalPatients}</Text>
                <Text style={styles.statLabel}>Patients</Text>
              </View>
              <TouchableOpacity 
                style={[styles.statBox, { width: "100%", backgroundColor: "#e6f9f9", borderColor: "#0eb5b5", borderStyle: "dashed", borderWidth: 1.5, marginTop: 5 }]}
                onPress={() => setActiveTab("Train AI")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Ionicons name="bulb-outline" size={28} color="#0eb5b5" />
                  <View>
                    <Text style={[styles.statValue, { marginTop: 0, color: "#0eb5b5" }]}>{stats.unrecognizedCount || 0}</Text>
                    <Text style={styles.statLabel}>Untaught AI Queries</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#0eb5b5" style={{ marginLeft: "auto" }} />
                </View>
              </TouchableOpacity>
            </View>

            {/* MAIN NAVIGATION TABS */}
            <View style={[styles.tabsContainer, { marginBottom: 30, borderBottomWidth: 1, borderColor: "#e5e7eb", paddingBottom: 10 }]}>
              {["Doctors", "Train AI"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.mainTab,
                    activeTab === tab && styles.mainTabActive
                  ]}
                  onPress={() => setActiveTab(tab as any)}
                >
                  <Text style={[
                    styles.mainTabText,
                    activeTab === tab && styles.mainTabTextActive
                  ]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === "Doctors" ? (
              <>
                <Text style={styles.sectionTitle}>Doctor Applications</Text>
                {/* SEGMENTED TABS */}
                <View style={styles.tabsContainer}>
                  {["Pending", "Approved", "All"].map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tabButton,
                        filter === tab && styles.tabButtonActive
                      ]}
                      onPress={() => setFilter(tab as any)}
                    >
                      <Text style={[
                        styles.tabText,
                        filter === tab && styles.tabTextActive
                      ]}>{tab}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Unrecognized Patient Queries</Text>
                <Text style={styles.subtitle}>Teach MediBot how to respond to these</Text>
                
                {selectedQuery && (
                  <View style={styles.trainingForm}>
                    <Text style={styles.formLabel}>Teaching for: "{selectedQuery.message}"</Text>
                    
                    <TextInput 
                      placeholder="Keywords (comma separated: heart, chest, pulse)"
                      value={aiForm.keywords}
                      onChangeText={(t: string) => setAiForm({...aiForm, keywords: t})}
                      style={styles.input}
                    />
                    <TextInput 
                      placeholder="Possible Conditions"
                      value={aiForm.conditions}
                      onChangeText={(t: string) => setAiForm({...aiForm, conditions: t})}
                      style={styles.input}
                    />
                    <TextInput 
                      placeholder="Specialist Recommendation"
                      value={aiForm.specialist}
                      onChangeText={(t: string) => setAiForm({...aiForm, specialist: t})}
                      style={styles.input}
                    />
                    <TextInput 
                      placeholder="Home Care Tips"
                      value={aiForm.tips}
                      onChangeText={(t: string) => setAiForm({...aiForm, tips: t})}
                      style={[styles.input, { height: 80 }]}
                      multiline
                    />
                    
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                      <TouchableOpacity 
                        style={[styles.approveBtn, { flex: 1, backgroundColor: "#0eb5b5" }]}
                        onPress={handleTeachSubmit}
                        disabled={submittingAI}
                      >
                        {submittingAI ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "bold" }}>Save Knowledge</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.deactivateBtn, { flex: 1 }]}
                        onPress={() => setSelectedQuery(null)}
                      >
                        <Text style={{ color: "#dc2626", fontWeight: "bold" }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        }
        renderItem={({ item }) => {
          if (activeTab === "Doctors") {
            return (
              <View style={styles.card}>
                {/* AVATAR ROW */}
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{item.name}</Text>
                    <Text style={styles.doctorSpec}>{item.specialization || "General"}</Text>
                    <Text style={styles.doctorEmail}>{item.email}</Text>
                  </View>
                  <View style={[
                    styles.badge, 
                    { backgroundColor: item.isApproved ? "#dcfce7" : "#fef3c7" }
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: item.isApproved ? "#16a34a" : "#d97706" }
                    ]}>
                      {item.isApproved ? "Active" : "Pending"}
                    </Text>
                  </View>
                </View>

                {/* LOCATION INFO */}
                <View style={styles.locationContainer}>
                  <View style={styles.infoRow}>
                    <Ionicons name="home-outline" size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.clinicName || "N/A"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.clinicAddress || "N/A"}</Text>
                  </View>
                </View>

                {/* DOCUMENTS */}
                {item.documents && item.documents.length > 0 && (
                  <TouchableOpacity 
                    style={styles.documentBtn}
                    onPress={() => Linking.openURL(item.documents[0])}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#3b82f6" />
                    <Text style={styles.documentBtnText}>Documents submitted</Text>
                  </TouchableOpacity>
                )}

                {/* ACTION BUTTONS */}
                {item.isApproved ? (
                  <TouchableOpacity 
                    style={styles.deactivateBtn}
                    onPress={() => handleDeactivate(item._id)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                    <Text style={styles.deactivateBtnText}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.approveBtn}
                    onPress={() => handleApprove(item._id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          } else {
            return (
              <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 14, color: "#374151", fontWeight: "600" }}>"{item.message}"</Text>
                     <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                       Logged at: {new Date(item.createdAt).toLocaleDateString()}
                     </Text>
                   </View>
                   <TouchableOpacity 
                     style={{ backgroundColor: "#0eb5b5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                     onPress={() => {
                        setSelectedQuery(item);
                        listRef.current?.scrollToOffset({ offset: 0, animated: true });
                     }}
                   >
                     <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Teach AI</Text>
                   </TouchableOpacity>
                </View>
              </View>
            );
          }
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 100 }}>
             <Ionicons name={activeTab === "Doctors" ? "person-outline" : "bulb-outline"} size={48} color="#e5e7eb" />
             <Text style={{ marginTop: 10, color: "#9ca3af", fontWeight: "600" }}>
                {activeTab === "Doctors" ? "No doctors found" : "MediBot is fully trained! No new queries."}
             </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f6",
    paddingHorizontal: 20,
    paddingTop: 10
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoMini: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937"
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25
  },
  statBox: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 15
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff"
  },
  tabButtonActive: {
    backgroundColor: "#0eb5b5",
    borderColor: "#0eb5b5"
  },
  tabText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600"
  },
  tabTextActive: {
    color: "#fff"
  },
  mainTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderColor: "transparent"
  },
  mainTabActive: {
    borderColor: "#0eb5b5"
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9ca3af"
  },
  mainTabTextActive: {
    color: "#0eb5b5"
  },
  trainingForm: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: "#111827"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  avatarText: {
    color: "#0ea5e9",
    fontWeight: "bold",
    fontSize: 16
  },
  doctorInfo: {
    flex: 1
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827"
  },
  doctorSpec: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2
  },
  doctorEmail: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700"
  },
  locationContainer: {
    marginBottom: 15,
    gap: 6
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  infoText: {
    fontSize: 13,
    color: "#6b7280"
  },
  documentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10
  },
  documentBtnText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 14
  },
  deactivateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  deactivateBtnText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 14
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dcfce7",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  approveBtnText: {
    color: "#16a34a",
    fontWeight: "600",
    fontSize: 14
  }
});