import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function QuickAction({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.box} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },
  text: { fontWeight: "600", fontSize: 14 },
});
