import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Medi-Nest | Healthcare Platform" }} />
      <Stack.Screen name="login" options={{ title: "Log In | Medi-Nest" }} />
      <Stack.Screen name="register" options={{ title: "Join Medi-Nest" }} />
      <Stack.Screen name="(tabs)" options={{ title: "Dashboard | Medi-Nest" }} />
      <Stack.Screen name="admin/dashboard" options={{ title: "Admin Portal" }} />
      <Stack.Screen name="doctor/dashboard" options={{ title: "Doctor Dashboard" }} />
      <Stack.Screen name="doctor/profile" options={{ title: "Edit Profile" }} />
      <Stack.Screen name="doctor/manage-schedule" options={{ title: "Schedule Management" }} />
      <Stack.Screen name="patient/doctor-details" options={{ title: "Doctor Details" }} />
      <Stack.Screen name="patient/my-appointments" options={{ title: "My Appointments" }} />
      <Stack.Screen name="patient/book-appointment" options={{ title: "Book Appointment" }} />
    </Stack>
  );
}
