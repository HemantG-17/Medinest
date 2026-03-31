import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, router } from "expo-router";
import RazorpayCheckout from "react-native-razorpay";

import {
  getAvailableSlots,
  bookAppointment,
  createOrder,
  verifyPayment,
} from "../../_utils/api";

export default function BookAppointment() {
  const params = useLocalSearchParams();

  // 🔥 FIXED → doctorId
  const doctorId = params?.doctorId as string;

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [slots, setSlots] = useState<string[]>([]);
  const [selected, setSelected] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const allSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "5:00 PM"];

  const formatDate = (d: Date) => d.toDateString();

  const fetchSlots = async () => {
    try {
      setLoadingSlots(true);

      // 🔥 FIXED
      const data = await getAvailableSlots(
        doctorId,
        formatDate(date)
      );

      setSlots(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (doctorId) fetchSlots();
  }, [date, doctorId]);

  // 🔥 PAYMENT + BOOKING
  const handleBook = async () => {
    if (!selected) return alert("Select a slot");

    try {
      setBooking(true);

      // 1️⃣ Create order
      const order = await createOrder();

      const options = {
        key: "YOUR_RAZORPAY_KEY", // 🔥 replace later
        amount: order.amount,
        currency: "INR",
        name: "MediNest",
        description: "Doctor Appointment",
        order_id: order.id,
      };

      // 2️⃣ Payment
      const payment = await RazorpayCheckout.open(options);

      // 3️⃣ Verify
      const verify = await verifyPayment(payment);

      if (!verify.success) {
        return alert("Payment verification failed");
      }

      // 4️⃣ BOOK (🔥 FIXED)
      await bookAppointment(
        doctorId,
        formatDate(date),
        selected,
        {
          paymentId: payment.razorpay_payment_id,
          orderId: payment.razorpay_order_id,
          signature: payment.razorpay_signature,
        }
      );

      alert("✅ Payment Verified & Booking Done");

      router.replace("/patient/my-appointments");
    } catch (err: any) {
      alert(err.message || "Payment failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        Book Appointment
      </Text>

      {/* Date */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={{
          marginTop: 15,
          padding: 10,
          backgroundColor: "#e5e7eb",
          borderRadius: 8,
        }}
      >
        <Text>Select Date: {formatDate(date)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              setDate(selectedDate);
              setSelected("");
            }
          }}
        />
      )}

      {/* Slots */}
      {loadingSlots ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <View
          style={{
            marginTop: 20,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {allSlots.map((slot) => {
            const isAvailable = slots.includes(slot);

            return (
              <TouchableOpacity
                key={slot}
                disabled={!isAvailable}
                onPress={() => setSelected(slot)}
                style={{
                  padding: 10,
                  backgroundColor: !isAvailable
                    ? "#ccc"
                    : selected === slot
                    ? "#2563eb"
                    : "#e5e7eb",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: !isAvailable
                      ? "#666"
                      : selected === slot
                      ? "#fff"
                      : "#000",
                  }}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Button */}
      <TouchableOpacity
        onPress={handleBook}
        disabled={booking}
        style={{
          marginTop: 20,
          backgroundColor: booking ? "#93c5fd" : "#2563eb",
          padding: 12,
          borderRadius: 10,
        }}
      >
        {booking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Pay & Confirm Booking
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}