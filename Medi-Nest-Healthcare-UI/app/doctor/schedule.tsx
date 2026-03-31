import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { getDoctorAppointments, approveAppointment, rejectAppointment, verifyOtp } from "../../_utils/api";

export default function Schedule() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [otp, setOtp] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchAppointments = async () => {
    try {
      const data = await getDoctorAppointments();
      setSchedule(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveAppointment(id);
      fetchAppointments();
    } catch (err) {
      console.log("Error approving", err);
    }
  };

  const handleReject = async () => {
    try {
      await rejectAppointment(selectedId, rejectionReason);
      setRejectModalVisible(false);
      setRejectionReason("");
      fetchAppointments();
    } catch (err) {
      console.log("Error rejecting", err);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp(selectedId, otp);
      setModalVisible(false);
      setOtp("");
      fetchAppointments();
      alert("Visit Completed!");
    } catch (err: any) {
      alert(err.message || "Invalid OTP");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 Doctor Schedule</Text>

      {schedule.map((item, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.left}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.patientId?.name?.charAt(0) || "P"}
              </Text>
            </View>

            <View>
              <Text style={styles.name}>{item.patientId?.name || "Patient"}</Text>
              <Text style={styles.info}>
                {item.date} • {item.time}
              </Text>
            </View>
          </View>

          <View style={styles.right}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "Completed"
                      ? "#e5e7eb"
                      : item.status === "Pending" ? "#fef08a" : "#dcfce7",
                },
              ]}
            >
              <Text
                style={{
                  color:
                    item.status === "Completed"
                      ? "#374151"
                      : item.status === "Pending" ? "#854d0e" :
                      item.status === "Rejected" || item.status === "Cancelled" ? "#991b1b" : "#16a34a",
                  fontWeight: "bold",
                }}
              >
                {item.status}
              </Text>
            </View>

            {item.status === "Pending" && (
              <View style={{ flexDirection: "row", gap: 5, marginTop: 5 }}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: 'green'}]} onPress={() => handleApprove(item._id)}>
                  <Text style={styles.actionText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: 'red'}]} onPress={() => { setSelectedId(item._id); setRejectModalVisible(true); }}>
                  <Text style={styles.actionText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === "Confirmed" && (
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563eb', marginTop: 5}]} onPress={() => { setSelectedId(item._id); setModalVisible(true); }}>
                <Text style={styles.actionText}>Verify OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Verify OTP Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP to Verify Visit</Text>
            <TextInput style={styles.input} placeholder="6-digit OTP" keyboardType="numeric" value={otp} onChangeText={setOtp} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={styles.btnClass} onPress={handleVerifyOtp}><Text style={{color: 'white'}}>Verify</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnClass, {backgroundColor: 'gray'}]} onPress={() => setModalVisible(false)}><Text style={{color: 'white'}}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reason for Rejection</Text>
            <TextInput style={styles.input} placeholder="Reason..." value={rejectionReason} onChangeText={setRejectionReason} />
            <Text style={{fontSize: 12, color: 'gray', marginVertical: 8}}>Payment will be automatically refunded</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.btnClass, {backgroundColor: 'red'}]} onPress={handleReject}><Text style={{color: 'white'}}>Confirm Reject</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnClass, {backgroundColor: 'gray'}]} onPress={() => setRejectModalVisible(false)}><Text style={{color: 'white'}}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 14, marginBottom: 12, elevation: 2, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  name: { fontWeight: "bold", fontSize: 15 },
  info: { color: "gray", fontSize: 13 },
  right: { alignItems: "flex-end", gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  actionText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, margin: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10 },
  btnClass: { backgroundColor: "#2563eb", padding: 10, borderRadius: 5, flex: 1, alignItems: "center" },
});
