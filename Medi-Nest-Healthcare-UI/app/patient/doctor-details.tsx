import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorById, createAppointment, getSlots } from "../../_utils/api";
import { ReviewsList } from "../../components/ReviewModal";

const PLATFORM_FEE = 30;
const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Generate next 7 days from today
function getNextDays(count = 7) {
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dayName: dayNames[d.getDay()],
      date: d.getDate(),
      month: monthNames[d.getMonth()],
      fullDate: d.toISOString().split("T")[0],
    });
  }
  return days;
}

export default function DoctorDetails() {
  const params = useLocalSearchParams();
  const doctorId = params?.doctorId as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [slotStatus, setSlotStatus] = useState<{time: string, isAvailable: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const nextDays = useMemo(() => getNextDays(7), []);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await getDoctorById(doctorId);
        setDoctor(data);
        setSelectedDate(nextDays[0]?.fullDate || "");
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !doctorId) return;
      try {
        setLoadingSlots(true);
        const data = await getSlots(doctorId, selectedDate);
        setSlotStatus(data);
      } catch (err) {
        console.log("Error fetching slots:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, doctorId]);

  const availableSlots: string[] = useMemo(() => {
    return doctor?.availability?.timeSlots || ["10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "05:00 PM"];
  }, [doctor]);

  const availableDays: string[] = useMemo(() => {
    return doctor?.availability?.workingDays || DAYS_ORDER;
  }, [doctor]);

  const consultFee = doctor?.fees || 0;
  const totalPayable = consultFee + PLATFORM_FEE;

  const getInitials = (name: string) => {
    return name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "DR";
  };

  const handleBook = async () => {
    if (!selectedDate) return Alert.alert("Select a date");
    if (!selectedSlot) return Alert.alert("Select a time slot");

    try {
      setBooking(true);
      await createAppointment({ doctorId, date: selectedDate, time: selectedSlot });
      Alert.alert(
        "✅ Appointment Booked!",
        "Your appointment has been successfully booked. The doctor will confirm shortly.",
        [{ text: "OK", onPress: () => router.replace("/appointment") }]
      );
    } catch (err: any) {
      Alert.alert("Booking Failed", err.message || "Please try again");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0eb5b5" />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Doctor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* BACK BUTTON */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
          <Text style={styles.backText}>Doctor Profile</Text>
        </TouchableOpacity>

        {/* DOCTOR BASIC INFO */}
        <View style={styles.avatarContainer}>
          {doctor.profilePic ? (
            <Image source={{ uri: doctor.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(doctor.name)}</Text>
            </View>
          )}
        </View>

        {/* NAME & SPECIALTY */}
        <Text style={styles.doctorName}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialization || "General Physician"}</Text>
        <Text style={styles.clinicName}>{doctor.clinicName || "Private Clinic"}</Text>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{doctor.fees || 0}</Text>
            <Text style={styles.statLabel}>Consult Fee</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{availableSlots.length}</Text>
            <Text style={styles.statLabel}>Daily Slots</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{availableDays.length}</Text>
            <Text style={styles.statLabel}>Days/Week</Text>
          </View>
        </View>

        {/* CONTACT & LOCATION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact & Location</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#0eb5b5" />
            <Text style={styles.infoText}>{doctor.phone || "Not provided"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#0eb5b5" />
            <Text style={styles.infoText}>{doctor.clinicAddress || "Address not set"}</Text>
          </View>

          {doctor.clinicMapLink ? (
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={async () => {
                const mapUrl = doctor.clinicMapLink?.startsWith("http")
                  ? doctor.clinicMapLink
                  : `https://maps.google.com/?q=${encodeURIComponent(doctor.clinicAddress || "")}`;
                const canOpen = await Linking.canOpenURL(mapUrl);
                if (canOpen) {
                  Linking.openURL(mapUrl);
                } else {
                  Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(doctor.clinicAddress || "")}`);
                }
              }}
            >
              <Ionicons name="map-outline" size={16} color="#0eb5b5" />
              <Text style={styles.mapBtnText}>View on Map</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* PATIENT REVIEWS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Reviews</Text>
          <ReviewsList doctorId={doctorId} />
        </View>

        {/* AVAILABILITY DAYS */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Availability</Text>
          <View style={styles.daysRow}>
            {DAYS_ORDER.map((day) => {
              const isAvail = availableDays.includes(day);
              return (
                <View key={day} style={[styles.dayPill, isAvail && styles.dayPillActive]}>
                  <Text style={[styles.dayPillText, isAvail && styles.dayPillTextActive]}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* SELECT DATE */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {nextDays.map((day) => {
              const isOff = doctor.availability?.holidays?.includes(day.fullDate);
              return (
                <TouchableOpacity
                  key={day.fullDate}
                  style={[
                    styles.dateCard, 
                    selectedDate === day.fullDate && styles.dateCardActive,
                    isOff && { opacity: 0.5, borderColor: "#ffe4e6", backgroundColor: "#fff1f2" }
                  ]}
                  onPress={() => {
                    if (isOff) return;
                    setSelectedDate(day.fullDate);
                    setSelectedSlot("");
                  }}
                  activeOpacity={isOff ? 1 : 0.7}
                >
                  <Text style={[styles.dateDayName, selectedDate === day.fullDate && styles.dateTextActive]}>
                    {day.dayName}
                  </Text>
                  <Text style={[styles.dateDay, selectedDate === day.fullDate && styles.dateTextActive, isOff && { color: "#e11d48" }]}>
                    {day.month} {day.date}
                  </Text>
                  {isOff && (
                    <View style={{ position: "absolute", bottom: -8, backgroundColor: "#e11d48", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#fff" }}>
                      <Text style={{ fontSize: 8, fontWeight: "800", color: "#fff" }}>ON LEAVE</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SELECT TIME SLOT */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Select Time</Text>
          {loadingSlots ? (
            <ActivityIndicator color="#0eb5b5" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.slotsGrid}>
              {slotStatus
                .filter(item => item.isAvailable) // 🔥 Instantly hide past/booked slots
                .map((item) => (
                <TouchableOpacity
                  key={item.time}
                  style={[
                    styles.slotPill, 
                    selectedSlot === item.time && styles.slotPillActive,
                  ]}
                  onPress={() => setSelectedSlot(item.time)}
                >
                  <Text style={[
                    styles.slotText, 
                    selectedSlot === item.time && styles.slotTextActive,
                  ]}>
                    {item.time}
                  </Text>
                </TouchableOpacity>
              ))}
              {slotStatus.filter(item => item.isAvailable).length === 0 && (
                <Text style={{ color: "#9ca3af", fontStyle: "italic" }}>No slots available for this date.</Text>
              )}
            </View>
          )}
        </View>

        {/* FEE SUMMARY */}
        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeValue}>₹{consultFee}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Platform Fee</Text>
            <Text style={[styles.feeValue, { color: "#f59e0b" }]}>₹{PLATFORM_FEE}</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeTotalLabel}>Total Payable</Text>
            <Text style={styles.feeTotalValue}>₹{totalPayable}</Text>
          </View>
        </View>

        {/* SPACER for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOOK BUTTON — FIXED AT BOTTOM */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bookBtn, booking && { opacity: 0.7 }]}
          onPress={handleBook}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>Book Appointment — ₹{totalPayable}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20 },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  backText: { fontSize: 18, fontWeight: "600", color: "#111827" },

  avatarContainer: { alignItems: "center", marginBottom: 14 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#e6f9f9",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#0eb5b5" },

  doctorName: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center" },
  specialty: { fontSize: 15, fontWeight: "600", color: "#0eb5b5", textAlign: "center", marginTop: 4 },
  clinicName: { fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 2, marginBottom: 20 },

  statsRow: {
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    backgroundColor: "#f9fafb", borderRadius: 16, paddingVertical: 16,
    marginBottom: 20, borderWidth: 1, borderColor: "#f3f4f6",
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500", marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: "#e5e7eb" },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: "#f3f4f6",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  section: { marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 14 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  infoText: { fontSize: 14, color: "#374151", fontWeight: "500" },

  mapBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#0eb5b5", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start", marginTop: 6,
  },
  mapBtnText: { color: "#0eb5b5", fontWeight: "600", fontSize: 14 },

  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dayPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb",
  },
  dayPillActive: { backgroundColor: "#e6f9f9", borderColor: "#0eb5b5" },
  dayPillText: { color: "#9ca3af", fontWeight: "600", fontSize: 13 },
  dayPillTextActive: { color: "#0eb5b5" },

  dateCard: {
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff",
  },
  dateCardActive: { backgroundColor: "#0eb5b5", borderColor: "#0eb5b5" },
  dateDayName: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },
  dateDay: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 4 },
  dateTextActive: { color: "#fff" },

  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotPill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff",
    alignItems: "center",
  },
  slotPillActive: { backgroundColor: "#0eb5b5", borderColor: "#0eb5b5" },
  slotText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  slotTextActive: { color: "#fff" },
  slotDisabled: {
    backgroundColor: "#f9fafb",
    borderColor: "#f3f4f6",
    opacity: 0.6,
  },
  slotDisabledText: {
    color: "#9ca3af",
  },
  slotUnavailableLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#9ca3af",
    marginTop: 2,
    textTransform: "uppercase",
  },

  feeCard: {
    backgroundColor: "#f9fafb", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#f3f4f6",
  },
  feeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  feeLabel: { fontSize: 14, color: "#6b7280" },
  feeValue: { fontSize: 14, color: "#374151", fontWeight: "600" },
  feeDivider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 },
  feeTotalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  feeTotalValue: { fontSize: 16, fontWeight: "800", color: "#0eb5b5" },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", paddingHorizontal: 20, paddingBottom: 30, paddingTop: 12,
    borderTopWidth: 1, borderColor: "#f3f4f6",
  },
  bookBtn: {
    backgroundColor: "#0eb5b5", borderRadius: 16,
    paddingVertical: 18, alignItems: "center",
  },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});