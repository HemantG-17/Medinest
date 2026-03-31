import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function DoctorCard({
  name,
  specialty,
  onBook,
}: {
  name: string;
  specialty: string;
  onBook: () => void;
}) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.specialty}>{specialty}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onBook}>
        <Text style={styles.buttonText}>Book</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  name: { fontSize: 16, fontWeight: "bold" },
  specialty: { color: "#6b7280" },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
