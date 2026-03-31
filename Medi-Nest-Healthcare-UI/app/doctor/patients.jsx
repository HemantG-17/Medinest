import { View, Text, FlatList, StyleSheet } from "react-native";

export default function Patients() {
  const patients = [
    { id: "1", name: "Rahul Sharma", age: 32 },
    { id: "2", name: "Neha Gupta", age: 27 },
    { id: "3", name: "Amit Verma", age: 41 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patients List</Text>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Age: {item.age}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontWeight: "bold" },
});
