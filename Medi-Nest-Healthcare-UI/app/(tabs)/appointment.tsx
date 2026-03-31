import { useEffect, useState, useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, ScrollView, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMyAppointments, cancelAppointment } from "../../_utils/api";
import ReviewModal from "../../components/ReviewModal";

type Filter = "All" | "Pending" | "Approved" | "Completed" | "Cancelled";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Pending: { color: "#f59e0b", bg: "#fff8e1", label: "Pending" },
  Confirmed: { color: "#0eb5b5", bg: "#e6f9f9", label: "Approved" },
  Completed: { color: "#22c55e", bg: "#dcfce7", label: "Completed" },
  Cancelled: { color: "#ef4444", bg: "#fee2e2", label: "Cancelled" },
  Rejected: { color: "#ef4444", bg: "#fee2e2", label: "Rejected" },
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return dateStr; }
};

export default function MyAppointments() {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [reviewItem, setReviewItem] = useState<any>(null);

  const fetchAppointments = async () => {
    try {
      const data = await getMyAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return appointments;
    return appointments.filter(item => {
      if (filter === "Pending") return item.status === "Pending";
      if (filter === "Approved") return item.status === "Confirmed";
      if (filter === "Completed") return item.status === "Completed";
      if (filter === "Cancelled") return item.status === "Cancelled" || item.status === "Rejected";
      return true;
    });
  }, [appointments, filter]);

  const counts = useMemo(() => ({
    All: appointments.length,
    Pending: appointments.filter(a => a.status === "Pending").length,
    Approved: appointments.filter(a => a.status === "Confirmed").length,
    Completed: appointments.filter(a => a.status === "Completed").length,
    Cancelled: appointments.filter(a => a.status === "Cancelled" || a.status === "Rejected").length,
  }), [appointments]);

  const FILTERS: Filter[] = ["All", "Pending", "Approved", "Completed", "Cancelled"];

  const renderCard = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG["Pending"];
    const doctorName = item.doctorId?.name || item.doctorName || "Doctor";
    const specialization = item.doctorId?.specialization || "Physician";
    const fees = item.doctorId?.fees || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.specialization}>{specialization}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={17} color="#0eb5b5" />
            <Text style={styles.infoText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={17} color="#0eb5b5" />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={17} color="#0eb5b5" />
            <Text style={styles.infoText}>₹{fees}</Text>
          </View>
        </View>

        {(item.status === "Confirmed" || item.status === "Pending") && (
          <View style={styles.otpContainer}>
             <Ionicons name="key-outline" size={16} color="#0d9488" />
             <Text style={styles.otpLabel}>Verification OTP: </Text>
             <Text style={styles.otpValue}>{item.otp || "------"}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => {
            if (item.status === "Completed") {
              setReviewItem(item);
            } else if (item.status === "Confirmed") {
              Alert.alert("Visit OTP", `Your OTP for the visit is: ${item.otp || "N/A"}\nShow this to the doctor at the clinic.`);
            } else {
              Alert.alert("Details", "The doctor will confirm your appointment shortly.");
            }
          }}
        >
          <Text style={styles.detailsBtnText}>{item.status === "Completed" ? "Rate Experience" : "Show Details"}</Text>
          <Ionicons name="chevron-forward" size={16} color="#0eb5b5" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#0eb5b5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>My Appointments</Text>
        <Text style={styles.subtitle}>{appointments.length} total</Text>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[
                styles.filterPillText,
                filter === f && styles.filterPillTextActive
              ]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderCard}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAppointments(); }}
            colors={["#0eb5b5"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color="#e5e7eb" />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        }
      />

      {reviewItem && (
        <ReviewModal
          visible={!!reviewItem}
          onClose={() => setReviewItem(null)}
          doctorId={reviewItem.doctorId?._id}
          doctorName={reviewItem.doctorId?.name || "Doctor"}
          appointmentId={reviewItem._id}
          onSuccess={fetchAppointments}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },

  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterPillActive: {
    backgroundColor: "#0eb5b5",
    borderColor: "#0eb5b5",
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterPillTextActive: {
    color: "#fff",
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  doctorName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },
  specialization: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#5eead4",
    borderStyle: "dashed",
    justifyContent: "center",
  },
  otpLabel: {
    fontSize: 14,
    color: "#0f766e",
    fontWeight: "600",
    marginLeft: 8,
  },
  otpValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0d9488",
    letterSpacing: 2,
  },

  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6f9f9",
    borderRadius: 18,
    paddingVertical: 16,
    gap: 10,
  },
  detailsBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0eb5b5",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 16,
    fontWeight: "500",
  },
});