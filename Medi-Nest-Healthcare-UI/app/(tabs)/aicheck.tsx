import { useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { aiChat } from "../../_utils/api";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "I have a fever and headache",
  "I have chest pain",
  "My skin is itchy with rashes",
  "I'm feeling anxious and stressed",
  "I have stomach pain and nausea",
];

const TypingDots = () => (
  <View style={styles.typingBubble}>
    <View style={[styles.dot, { animationDelay: "0ms" }]} />
    <View style={[styles.dot, { animationDelay: "200ms" }]} />
    <View style={[styles.dot, { animationDelay: "400ms" }]} />
  </View>
);

export default function AICheck() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm MediBot 🩺\n\nDescribe your symptoms and I'll help you understand what might be going on and which doctor to see.\n\n⚠️ I'm an AI assistant — not a replacement for a real doctor.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setInput("");
    Keyboard.dismiss();

    const userMsg: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Build history for context (last 6 messages)
      const history = newMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await aiChat(msg, history.slice(0, -1)); // exclude latest user msg
      const botMsg: Message = { role: "assistant", content: res.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Text style={{ fontSize: 14 }}>🩺</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
    >
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.botCircle}>
            <Text style={{ fontSize: 20 }}>🩺</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>MediBot</Text>
            <Text style={styles.headerSub}>AI Symptom Checker</Text>
          </View>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={loading ? (
          <View style={styles.msgRow}>
            <View style={styles.botAvatar}><Text style={{ fontSize: 14 }}>🩺</Text></View>
            <View style={[styles.bubble, styles.botBubble, { paddingVertical: 14, paddingHorizontal: 18 }]}>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, { opacity: 1 }]} />
                <View style={[styles.dot, { opacity: 0.6 }]} />
                <View style={[styles.dot, { opacity: 0.3 }]} />
              </View>
            </View>
          </View>
        ) : null}
      />

      {/* QUICK PROMPTS — only if no user message yet */}
      {messages.length === 1 && (
        <View style={styles.quickPrompts}>
          <Text style={styles.quickLabel}>Try asking:</Text>
          <View style={styles.quickRow}>
            {QUICK_PROMPTS.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickChip} onPress={() => send(q)}>
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* INPUT BAR */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Describe your symptoms..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: "#f3f4f6",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  botCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#e6f9f9", justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 12, color: "#0eb5b5", fontWeight: "500" },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" },

  listContent: { padding: 16, paddingBottom: 8 },

  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  msgRowUser: { flexDirection: "row-reverse" },
  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#e6f9f9", justifyContent: "center", alignItems: "center",
  },
  bubble: {
    maxWidth: "78%", borderRadius: 18, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  botBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: "#0eb5b5", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: "#374151", lineHeight: 21 },
  userBubbleText: { color: "#fff" },

  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0eb5b5" },
  typingBubble: { flexDirection: "row", gap: 5 },

  quickPrompts: { paddingHorizontal: 16, paddingBottom: 8 },
  quickLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 8, fontWeight: "600" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
  },
  quickChipText: { fontSize: 12, color: "#374151", fontWeight: "500" },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderColor: "#f3f4f6",
  },
  input: {
    flex: 1, backgroundColor: "#f4f6f9", borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12, fontSize: 14,
    color: "#111827", maxHeight: 100, borderWidth: 1, borderColor: "#e5e7eb",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#0eb5b5", justifyContent: "center", alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#b2e0e0" },
});
