import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";

const initialMessages = [
  { id: "1", sender: "bot", text: "👋 ¡Hola! Soy tu asistente virtual." },
  { id: "2", sender: "bot", text: "¿En qué puedo ayudarte hoy?" },
  { id: "3", sender: "user", text: "Recomiéndame un lugar romántico" },
  {
    id: "4",
    sender: "bot",
    text: "Te recomiendo estos lugares perfectos para una cita:\n\nEl Jardín Secreto - Música en vivo",
  },
];

const ChatBot = () => {
  const { username } = useSession();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newUserMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");

    // Simulación de respuesta del bot
    setTimeout(() => {
      const botReply = {
        id: Date.now().toString() + "_bot",
        sender: "bot",
        text: "🤖 Estoy procesando tu solicitud...",
      };
      setMessages((prev) => [...prev, botReply]);
    }, 800);
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageRow,
        item.sender === "user" ? styles.rowUser : styles.rowBot,
      ]}
    >
      {item.sender === "bot" && (
        <View style={styles.botAvatar}>
          <Ionicons name="person" size={16} color={colors.primary} />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          item.sender === "user" ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            typography.regular.medium,
            item.sender === "user" ? styles.userText : styles.botText,
          ]}
        >
          {item.text}
        </Text>
      </View>

      {item.sender === "user" && (
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {username ? username.substring(0, 2).toUpperCase() : "US"}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={[typography.semibold.big, styles.headerTitle]}>
          Asistente Virtual
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContainer}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[typography.regular.medium, styles.input]}
            placeholder="Escribe un mensaje..."
            value={input}
            onChangeText={setInput}
            placeholderTextColor={colors.textSec}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    marginLeft: 10,
    color: colors.text,
  },
  chatContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 6,
  },
  rowBot: {
    justifyContent: "flex-start",
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.white,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  botBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.lightGray,
    borderBottomRightRadius: 4,
  },
  botText: {
    color: colors.text,
  },
  userText: {
    color: colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 24,
    paddingHorizontal: 18,
    height: 44,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});

export default ChatBot;
