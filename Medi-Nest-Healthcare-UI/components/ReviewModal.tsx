import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getReviews, addReview } from "../_utils/api";

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
  onSuccess: () => void;
}

/**
 * ReviewModal - Submit a review for a completed appointment
 */
const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  doctorId,
  doctorName,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      return Alert.alert("Required", "Please select a rating");
    }

    try {
      setSubmitting(true);
      await addReview({ doctorId, rating, comment });
      Alert.alert("Success", "Thank you for your feedback!");
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          <Text style={styles.title}>Rate your visit</Text>
          <Text style={styles.subtitle}>with Dr. {doctorName}</Text>

          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={40}
                  color={star <= rating ? "#f59e0b" : "#d1d5db"}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Write your experience (optional)"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            placeholderTextColor="#9ca3af"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewModal;

/**
 * ReviewsList - Display reviews for a specific doctor
 */
export const ReviewsList: React.FC<{ doctorId: string }> = ({ doctorId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getReviews(doctorId);
        setReviews(data);
      } catch (err) {
        console.log("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [doctorId]);

  if (loading) return <ActivityIndicator color="#0eb5b5" style={{ marginVertical: 20 }} />;

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No reviews yet. Be the first to review!</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 10 }}>
      {reviews.map((item) => (
        <View key={item._id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.patientName}>{item.patientId?.name || "Patient"}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={12}
                  color={star <= item.rating ? "#f59e0b" : "#e5e7eb"}
                />
              ))}
            </View>
          </View>
          {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 20,
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    height: 120,
    textAlignVertical: "top",
    fontSize: 15,
    color: "#111827",
    marginBottom: 24,
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#0eb5b5",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // ReviewsList Styles
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontStyle: "italic",
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
  },
});
