import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#0eb5b5",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: "Doctors",
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="appointment" 
        options={{ 
          title: "Appointments",
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="aicheck" 
        options={{ 
          title: "AI Check",
          tabBarIcon: ({ color }) => <Ionicons name="pulse-outline" size={26} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}