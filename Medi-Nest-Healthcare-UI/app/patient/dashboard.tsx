import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";

import QuickAction from "./components/QuickAction";
import DoctorCategories from "./components/DoctorCategories";

export default function PatientDashboard() {
  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome 👋</Text>
        <Text style={styles.name}>Patient</Text>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.actions}>
        <QuickAction
          title="Book Appointment"
          onPress={() => router.push("/patient/book-appointment")}
        />

        <QuickAction
          title="My Appointments"
          onPress={() => router.push("/appointment")}
        />
      </View>

      <DoctorCategories />


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    padding: 20,
    backgroundColor: "#2563eb",
    margin: 10,
    borderRadius: 14,
  },
  welcome: { color: "#fff", fontSize: 16 },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
});