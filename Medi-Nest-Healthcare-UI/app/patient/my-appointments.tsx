import { useEffect, useState } from "react";
import { View, Text, FlatList, ToastAndroid } from "react-native";
import { useFocusEffect } from "expo-router";
import { getMyAppointments } from "../../_utils/api";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prevAppointments, setPrevAppointments] = useState<any[]>([]);

  const fetchAppointments = async () => {
    try {
      const data = await getMyAppointments();

      // 🔥 STATUS CHANGE DETECT
      data.forEach((newItem: any) => {
        const oldItem = prevAppointments.find(
          (a) => a._id === newItem._id
        );

        if (oldItem && oldItem.status !== newItem.status) {
          ToastAndroid.show(
            `Appointment ${newItem.status}`,
            ToastAndroid.SHORT
          );
        }
      });

      setAppointments(data);
      setPrevAppointments(data);
    } catch (err) {
      console.log(err);
    }
  };

  useFocusEffect(() => {
    fetchAppointments();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAppointments();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        My Appointments
      </Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }: any) => (
          <View
            style={{
              padding: 15,
              marginTop: 10,
              backgroundColor: "#fff",
              borderRadius: 10,
            }}
          >
            {/* 🔥 FIXED DOCTOR NAME */}
            <Text style={{ fontWeight: "bold" }}>
              {item.doctorId?.name || "Doctor"}
            </Text>

            {/* 🔥 EXTRA (bonus UX) */}
            <Text>
              Specialization:{" "}
              {item.doctorId?.specialization || "N/A"}
            </Text>

            <Text>Date: {item.date}</Text>
            <Text>Time: {item.time}</Text>

            {/* 🔥 STATUS COLOR */}
            <Text
              style={{
                color:
                  item.status === "Confirmed"
                    ? "green"
                    : item.status === "Rejected"
                    ? "red"
                    : item.status === "Cancelled"
                    ? "gray"
                    : "orange",
                fontWeight: "bold",
              }}
            >
              {item.status}
            </Text>

            {item.status === "Confirmed" && item.otp && (
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#2563eb",
                  backgroundColor: "#eff6ff",
                  padding: 8,
                  borderRadius: 6,
                  textAlign: "center"
                }}
              >
                OTP to verify Visit: {item.otp}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}