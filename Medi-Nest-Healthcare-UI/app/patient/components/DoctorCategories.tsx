import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "cardio", label: "Cardiology" },
  { id: "dental", label: "Dental" },
  { id: "ortho", label: "Orthopedic" },
  { id: "neuro", label: "Neurology" },
  { id: "pediatric", label: "Pediatric" },
];

export default function DoctorCategories({ onSelect }: { onSelect?: (id: string) => void }) {
  const [active, setActive] = useState("general");

  const handlePress = (id: string) => {
    setActive(id);
    onSelect?.(id); // future filtering
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Categories</Text>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              active === item.id && styles.activeCard,
            ]}
            onPress={() => handlePress(item.id)}
          >
            <Text
              style={[
                styles.text,
                active === item.id && styles.activeText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 16,
    margin:20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  card: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 10,
  },
  activeCard: {
    backgroundColor: "#2563eb",
  },
  text: {
    color: "#1f2937",
    fontWeight: "500",
  },
  activeText: {
    color: "#fff",
  },
});
