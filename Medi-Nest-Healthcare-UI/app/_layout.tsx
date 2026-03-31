import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin/dashboard" />
      <Stack.Screen name="doctor/dashboard" />
      <Stack.Screen name="doctor/profile" />
      <Stack.Screen name="doctor/manage-schedule" />
      <Stack.Screen name="patient/doctor-details" />
      <Stack.Screen name="patient/my-appointments" />
      <Stack.Screen name="patient/book-appointment" />
    </Stack>
  );
}
