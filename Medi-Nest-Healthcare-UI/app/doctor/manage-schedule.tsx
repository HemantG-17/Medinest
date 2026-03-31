import { useEffect, useState, useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { getDoctorMe, updateDoctorProfile } from "../../_utils/api";

const PLATFORM_FEE = 30;
const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

// Generate next 14 days
function getNextDays(count = 14) {
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

export default function ManageSchedule() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fees, setFees] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicMapLink, setClinicMapLink] = useState("");

  // Schedule
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);

  const next14Days = useMemo(() => getNextDays(), []);

  // Documents
  const [existingDocs, setExistingDocs] = useState<string[]>([]);
  const [newDocs, setNewDocs] = useState<{ uri: string; name: string; type: string }[]>([]);

  // Load existing profile
  useEffect(() => {
    const load = async () => {
      try {
        const doctor = await getDoctorMe();
        setFees(String(doctor.fees || ""));
        setSpecialization(doctor.specialization || "");
        setClinicAddress(doctor.clinicAddress || "");
        setClinicMapLink(doctor.clinicMapLink || "");
        setSelectedDays(doctor.availability?.workingDays || []);
        setSelectedSlots(doctor.availability?.timeSlots || []);
        setSelectedHolidays(doctor.availability?.holidays || []);
        setExistingDocs(doctor.documents || []);
      } catch (err) {
        console.log("Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleDay = (day: string) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const toggleSlot = (slot: string) =>
    setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);

  const toggleHoliday = (dateString: string) =>
    setSelectedHolidays(prev => prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", multiple: true });
      if (!result.canceled && result.assets) {
        const picked = result.assets.map(a => ({
          uri: a.uri,
          name: a.name,
          type: a.mimeType || "application/octet-stream",
        }));
        setNewDocs(prev => [...prev, ...picked]);
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick document");
    }
  };

  const removeNewDoc = (idx: number) =>
    setNewDocs(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!fees || isNaN(Number(fees))) return Alert.alert("Enter a valid consultation fee");
    if (selectedDays.length === 0) return Alert.alert("Select at least one working day");
    if (selectedSlots.length === 0) return Alert.alert("Select at least one time slot");

    try {
      setSaving(true);
      await updateDoctorProfile({
        specialization,
        fees: Number(fees),
        timeSlots: selectedSlots,
        workingDays: selectedDays,
        holidays: selectedHolidays,
        clinicAddress,
        clinicMapLink,
        documents: newDocs.length > 0 ? newDocs : undefined,
      });
      setNewDocs([]); // clear newly uploaded docs after save
      Alert.alert("✅ Saved!", "Your schedule and profile have been updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const summaryDays = useMemo(
    () => ALL_DAYS.filter(d => selectedDays.includes(d)).join(", ") || "None",
    [selectedDays]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0eb5b5" />
        <Text style={{ color: "#9ca3af", marginTop: 12 }}>Loading your schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── CONSULTATION FEE ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consultation Fee</Text>
          <Text style={styles.cardSub}>Medinest adds ₹{PLATFORM_FEE} platform fee on top.</Text>
          <View style={styles.feeRow}>
            <View style={styles.feeInput}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                value={fees}
                onChangeText={setFees}
                keyboardType="numeric"
                style={styles.feeField}
                placeholder="0"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
          {fees ? (
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={14} color="#0eb5b5" />
              <Text style={styles.infoBannerText}>
                Patient pays: ₹{fees} + ₹{PLATFORM_FEE} = ₹{Number(fees) + PLATFORM_FEE}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── CLINIC LOCATION ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clinic Location</Text>
          <Text style={styles.cardSub}>Update if you've moved or changed location</Text>

          <Text style={styles.inputLabel}>Clinic Address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              value={clinicAddress}
              onChangeText={setClinicAddress}
              placeholder="e.g. 12 Park Street, Delhi"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              multiline
            />
          </View>

          <Text style={styles.inputLabel}>Google Maps Link</Text>
          <View style={styles.inputRow}>
            <Ionicons name="map-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              value={clinicMapLink}
              onChangeText={setClinicMapLink}
              placeholder="https://maps.google.com/..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          {clinicMapLink ? (
            <TouchableOpacity
              style={styles.testMapBtn}
              onPress={() => Linking.openURL(clinicMapLink).catch(() => Alert.alert("Invalid URL"))}
            >
              <Ionicons name="open-outline" size={14} color="#0eb5b5" />
              <Text style={styles.testMapText}>Test Map Link</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── AVAILABLE DAYS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Days</Text>
          <Text style={styles.cardSub}>{selectedDays.length} day{selectedDays.length !== 1 ? "s" : ""} selected</Text>
          <View style={styles.chipsGrid}>
            {ALL_DAYS.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.chip, selectedDays.includes(day) && styles.chipActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.chipText, selectedDays.includes(day) && styles.chipTextActive]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── HOLIDAYS & LEAVE ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mark Holidays / Sick Leave</Text>
          <Text style={styles.cardSub}>Patients won't be able to book appointments on these dates.</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {next14Days.map((day) => {
              const isOff = selectedHolidays.includes(day.fullDate);
              return (
                <TouchableOpacity
                  key={day.fullDate}
                  style={[styles.dateCard, isOff && styles.dateCardActive]}
                  onPress={() => toggleHoliday(day.fullDate)}
                >
                  <Text style={[styles.dateDayName, isOff && styles.dateTextActive]}>
                    {day.dayName}
                  </Text>
                  <Text style={[styles.dateDay, isOff && styles.dateTextActive]}>
                    {day.month} {day.date}
                  </Text>
                  {isOff && (
                    <View style={styles.offBadge}>
                      <Text style={styles.offBadgeText}>OFF</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── TIME SLOTS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Time Slots</Text>
          <Text style={styles.cardSub}>{selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""} selected</Text>
          <View style={styles.slotsGrid}>
            {ALL_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotChip, selectedSlots.includes(slot) && styles.slotChipActive]}
                onPress={() => toggleSlot(slot)}
              >
                <Text style={[styles.slotText, selectedSlots.includes(slot) && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── DOCUMENTS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documents</Text>
          <Text style={styles.cardSub}>Upload renewed license or degree if expired</Text>

          {/* Existing docs */}
          {existingDocs.length > 0 && (
            <View style={styles.existingDocs}>
              <Text style={styles.docsSubLabel}>Previously uploaded</Text>
              {existingDocs.map((url, i) => (
                <View key={i} style={styles.docRow}>
                  <Ionicons name="document-text-outline" size={16} color="#0eb5b5" />
                  <Text style={styles.docName} numberOfLines={1}>Document {i + 1}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(url)}>
                    <Ionicons name="open-outline" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* New docs to upload */}
          {newDocs.length > 0 && (
            <View style={styles.existingDocs}>
              <Text style={styles.docsSubLabel}>To be uploaded</Text>
              {newDocs.map((doc, i) => (
                <View key={i} style={styles.docRow}>
                  <Ionicons name="attach-outline" size={16} color="#f59e0b" />
                  <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                  <TouchableOpacity onPress={() => removeNewDoc(i)}>
                    <Ionicons name="close-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
            <Ionicons name="cloud-upload-outline" size={20} color="#0eb5b5" />
            <Text style={styles.uploadBtnText}>Upload New Document</Text>
          </TouchableOpacity>
        </View>

        {/* ── SCHEDULE SUMMARY ── */}
        {selectedDays.length > 0 && selectedSlots.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Schedule Summary</Text>
            <Text style={styles.summaryText}>📅 {summaryDays}</Text>
            <Text style={styles.summaryText}>⏰ {selectedSlots.length} time slots per day</Text>
            {fees ? <Text style={styles.summaryText}>💰 ₹{Number(fees) + PLATFORM_FEE} per visit (incl. platform fee)</Text> : null}
          </View>
        )}

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save All Changes</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 55, paddingBottom: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#f3f4f6",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  scroll: { padding: 16 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: "#f3f4f6",
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 3 },
  cardSub: { fontSize: 12, color: "#9ca3af", marginBottom: 14 },

  feeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  feeInput: {
    flex: 1, flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  rupee: { fontSize: 18, color: "#374151", fontWeight: "700", marginRight: 6 },
  feeField: { flex: 1, fontSize: 18, color: "#111827", fontWeight: "600" },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#e6f9f9", borderRadius: 10, padding: 12, marginTop: 12,
  },
  infoBannerText: { color: "#0eb5b5", fontSize: 13, fontWeight: "500" },

  inputLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6, marginTop: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 4,
    backgroundColor: "#fafafa",
  },
  input: { flex: 1, fontSize: 14, color: "#111827", lineHeight: 20 },
  testMapBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", marginTop: 8, paddingVertical: 4,
  },
  testMapText: { color: "#0eb5b5", fontSize: 13, fontWeight: "600" },

  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#0eb5b5", borderColor: "#0eb5b5" },
  chipText: { fontWeight: "700", color: "#6b7280", fontSize: 13 },
  chipTextActive: { color: "#fff" },

  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotChip: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  slotChipActive: { backgroundColor: "#0eb5b5", borderColor: "#0eb5b5" },
  slotText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  slotTextActive: { color: "#fff" },

  dateCard: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#e5e7eb",
    alignItems: "center", position: "relative",
  },
  dateCardActive: { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
  dateDayName: { fontSize: 11, fontWeight: "600", color: "#6b7280", marginBottom: 2 },
  dateDay: { fontSize: 15, fontWeight: "800", color: "#111827" },
  dateTextActive: { color: "#b91c1c" },
  offBadge: {
    position: "absolute", top: -8, right: -8,
    backgroundColor: "#ef4444", paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, borderWidth: 2, borderColor: "#fff"
  },
  offBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  existingDocs: { marginBottom: 12 },
  docsSubLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", marginBottom: 8, textTransform: "uppercase" },
  docRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderColor: "#f3f4f6",
  },
  docName: { flex: 1, fontSize: 13, color: "#374151" },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: "#0eb5b5",
    borderStyle: "dashed", borderRadius: 12, paddingVertical: 14, marginTop: 4,
  },
  uploadBtnText: { color: "#0eb5b5", fontWeight: "700", fontSize: 14 },

  summaryCard: {
    backgroundColor: "#e6f9f9", borderRadius: 14,
    padding: 16, marginBottom: 16, gap: 6,
  },
  summaryTitle: { fontSize: 14, fontWeight: "700", color: "#0eb5b5", marginBottom: 4 },
  summaryText: { fontSize: 13, color: "#0d9488", lineHeight: 20 },

  saveBtn: {
    backgroundColor: "#0eb5b5", borderRadius: 14,
    paddingVertical: 18, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
