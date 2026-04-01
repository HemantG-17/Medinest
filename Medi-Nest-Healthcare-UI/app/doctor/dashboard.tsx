import { useEffect, useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, RefreshControl,
  Modal, TextInput, Alert, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoctorAppointments, approveAppointment, rejectAppointment, verifyOtp } from "../../_utils/api";

type Filter = "Today" | "All" | "Pending" | "Approved" | "Completed";

export default function DoctorDashboard() {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("Today");
  const [doctorName, setDoctorName] = useState("Doctor");

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  // OTP modal
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState("");

  const fetchAppointments = async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadName = async () => {
      const name = await AsyncStorage.getItem("name");
      if (name) setDoctorName(name);
    };
    loadName();
    fetchAppointments();
  }, []);

  const today = new Date().toDateString();

  const stats = useMemo(() => {
    const todayAppts = appointments.filter(a => new Date(a.date).toDateString() === today);
    return {
      today: todayAppts.length,
      pending: appointments.filter(a => a.status === "Pending").length,
      done: appointments.filter(a => a.status === "Completed").length,
      total: appointments.length,
    };
  }, [appointments]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "Today": return appointments.filter(a => new Date(a.date).toDateString() === today);
      case "Pending": return appointments.filter(a => a.status === "Pending");
      case "Approved": return appointments.filter(a => a.status === "Confirmed");
      case "Completed": return appointments.filter(a => a.status === "Completed");
      default: return appointments;
    }
  }, [appointments, filter]);

  const handleApprove = async (id: string) => {
    await approveAppointment(id);
    fetchAppointments();
  };

  const handleReject = async () => {
    await rejectAppointment(selectedId, reason);
    setRejectModal(false);
    setReason("");
    fetchAppointments();
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp(selectedId, otp);
      setOtpModal(false);
      setOtp("");
      fetchAppointments();
      Alert.alert("✅ Visit Completed!");
    } catch (err: any) {
      Alert.alert("Invalid OTP", err.message);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const d = new Date(date);
      return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${time}`;
    } catch (e) {
      return `${date} • ${time}`;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Pending") return "#f59e0b";
    if (status === "Confirmed") return "#22c55e";
    if (status === "Completed") return "#6b7280";
    if (status === "Cancelled" || status === "Rejected") return "#ef4444";
    return "#9ca3af";
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f6f9" }}>
      <ActivityIndicator size="large" color="#0eb5b5" />
    </View>;
  }

  const FILTERS: Filter[] = ["Today", "All", "Pending", "Approved", "Completed"];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Image 
            source={require("../../assets/images/logo_premium.png")} 
            style={styles.logoMini} 
          />
          <View>
            <Text style={styles.greeting}>Welcome, Dr.</Text>
            <Text style={styles.doctorNameHeader}>{doctorName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.scheduleBtn} onPress={() => router.push("/doctor/manage-schedule")}>
          <Ionicons name="calendar-outline" size={16} color="#0eb5b5" />
          <Text style={styles.scheduleBtnText}>Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {[
          { label: "Today", value: stats.today, color: "#0eb5b5" },
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          { label: "Done", value: stats.done, color: "#22c55e" },
          { label: "Total", value: stats.total, color: "#6b7280" },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* FILTER TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* APPOINTMENT LIST */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} colors={["#0eb5b5"]} />}
      >
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        )}
        {filtered.map((item, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{item.patientId?.name || "Patient"}</Text>
                <Text style={styles.apptTime}>{formatDateTime(item.date, item.time)}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            </View>

            {item.status === "Pending" && (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item._id)}>
                  <Ionicons name="checkmark-outline" size={16} color="#16a34a" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => { setSelectedId(item._id); setRejectModal(true); }}>
                  <Ionicons name="close-outline" size={16} color="#dc2626" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === "Confirmed" && (
              <TouchableOpacity style={styles.otpBtn} onPress={() => { setSelectedId(item._id); setOtpModal(true); }}>
                <Text style={styles.otpBtnText}>Verify OTP to Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* BOTTOM TABS */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 6 }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home-outline" size={24} color="#0eb5b5" />
          <Text style={[styles.tabLabel, { color: "#0eb5b5" }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/doctor/profile")}>
          <Ionicons name="person-outline" size={24} color="#9ca3af" />
          <Text style={[styles.tabLabel, { color: "#9ca3af" }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* REJECT MODAL */}
      <Modal visible={rejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reason for Rejection</Text>
            <TextInput style={styles.modalInput} placeholder="Enter reason..." value={reason} onChangeText={setReason} />
            <Text style={styles.modalNote}>Payment will be automatically refunded</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#dc2626" }]} onPress={handleReject}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Confirm Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#6b7280" }]} onPress={() => setRejectModal(false)}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP MODAL */}
      <Modal visible={otpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter Patient OTP</Text>
            <TextInput style={styles.modalInput} placeholder="6-digit OTP" keyboardType="numeric" value={otp} onChangeText={setOtp} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#0eb5b5" }]} onPress={handleVerifyOtp}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Verify</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#6b7280" }]} onPress={() => setOtpModal(false)}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 55, paddingBottom: 15, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#f3f4f6" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMini: { width: 45, height: 45, borderRadius: 10, backgroundColor: "#fff" },
  greeting: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  doctorNameHeader: { fontSize: 18, fontWeight: "800", color: "#111827" },
  scheduleBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#0eb5b5", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  scheduleBtnText: { color: "#0eb5b5", fontWeight: "600", fontSize: 13 },

  statsRow: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, justifyContent: "space-between", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8 },
  statBox: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#9ca3af", fontWeight: "500", marginTop: 2 },

  filterScroll: { marginTop: 14, maxHeight: 46 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  filterPillActive: { backgroundColor: "#0eb5b5", borderColor: "#0eb5b5" },
  filterText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  filterTextActive: { color: "#fff" },

  list: { flex: 1, marginTop: 8 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#9ca3af", fontSize: 15, marginTop: 12 },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  apptTime: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 12 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, paddingVertical: 12, gap: 6 },
  approveBtnText: { color: "#16a34a", fontWeight: "700", fontSize: 14 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 10, paddingVertical: 12, gap: 6 },
  rejectBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },
  otpBtn: { backgroundColor: "#e6f9f9", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  otpBtnText: { color: "#0eb5b5", fontWeight: "700" },

  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#f3f4f6", paddingTop: 10 },
  tabItem: { flex: 1, alignItems: "center", gap: 3 },
  tabLabel: { fontSize: 11, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 14 },
  modalInput: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 8 },
  modalNote: { color: "#9ca3af", fontSize: 12 },
  modalBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 10 },
});