import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import axiosPrivate from "../../services/axiosPrivate";

// Componente de estrella personalizada con relleno parcial
const PartialStar = ({ fillPercentage, size = 46 }) => {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Estrella gris de fondo (vacía) */}
      <Ionicons
        name="star"
        size={size}
        color="#e0e0e072"
        style={{ position: "absolute" }}
      />
      {/* Estrella amarilla (recortada según el porcentaje) */}
      <View
        style={{
          position: "absolute",
          overflow: "hidden",
          width: size * fillPercentage,
        }}
      >
        <Ionicons name="star" size={size} color="#FFC107" />
      </View>
    </View>
  );
};

export default function CreateReviewScreen() {
  const router = useRouter();
  const { locationId } = useLocalSearchParams();
  const { userId } = useSession();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------------------------
  // RATING CON GESTO
  // ------------------------
  const totalStars = 5;
  const starSize = 46;
  const starSpacing = 12;
  const starWidth = starSize + starSpacing;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const totalWidth = totalStars * starWidth;
        const relativeX = Math.max(0, Math.min(gesture.moveX, totalWidth));
        const value = (relativeX / totalWidth) * totalStars;
        const rounded = Math.round(value * 2) / 2;
        setRating(rounded);
      },
    })
  ).current;

  // ------------------------
  // IMÁGENES
  // ------------------------
  const pickImage = async () => {
    if (selectedImages.length >= 5) {
      Alert.alert("Límite alcanzado", "Solo puedes subir hasta 5 imágenes");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - selectedImages.length,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, ...result.assets]);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  // ------------------------
  // ENVIAR
  // ------------------------
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Por favor selecciona una calificación");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "No se encontró el ID de usuario");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("user_id", parseInt(userId));
      formData.append("location_id", parseInt(locationId));
      formData.append("rating", parseFloat(rating));

      if (reviewText.trim()) {
        formData.append("review_text", reviewText.trim());
      }

      selectedImages.forEach((image, index) => {
        const uriParts = image.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("files", {
          uri: image.uri,
          name: `photo_${index}.${fileType}`,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        });
      });

      await axiosPrivate.post("/review/reviews/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert("¡Éxito!", "Tu reseña ha sido publicada", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error al publicar reseña:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.response?.data?.detail?.[0]?.msg ||
          "No se pudo publicar la reseña"
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------
  // UI PRINCIPAL
  // ------------------------
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* 🔹 Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva reseña</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/*  Calificación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu calificación</Text>

            {/*  Estrellas con gesto y relleno parcial */}
            <View
              {...panResponder.panHandlers}
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginVertical: 12,
                gap: starSpacing,
              }}
            >
              {Array.from({ length: totalStars }).map((_, i) => {
                const fill = Math.min(Math.max(rating - i, 0), 1);
                return (
                  <PartialStar key={i} fillPercentage={fill} size={starSize} />
                );
              })}
            </View>

            {rating > 0 && (
              <View style={styles.ratingTextContainer}>
                <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
                <Text style={styles.ratingLabel}>
                  {rating < 2 && "Malo"}
                  {rating >= 2 && rating < 3 && "Regular"}
                  {rating >= 3 && rating < 4 && "Bueno"}
                  {rating >= 4 && rating < 4.5 && "Muy bueno"}
                  {rating >= 4.5 && "Excelente"}
                </Text>
              </View>
            )}
          </View>

          {/*  Texto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Cuéntanos tu experiencia{" "}
              <Text style={styles.optional}>(opcional)</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="¿Qué te pareció el lugar? ¿Cómo estuvo la comida y el servicio?"
              placeholderTextColor={colors.textSec}
              multiline
              numberOfLines={6}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{reviewText.length} / 500</Text>
          </View>

          {/* Fotos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Agrega fotos <Text style={styles.optional}>(opcional)</Text>
            </Text>
            <Text style={styles.sectionSubtitle}>
              Las fotos ayudan a otros a conocer mejor el lugar
            </Text>

            <View style={styles.imagesContainer}>
              {selectedImages.length < 5 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={32} color={colors.primary} />
                  <Text style={styles.addImageText}>Agregar foto</Text>
                </TouchableOpacity>
              )}

              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {selectedImages.length > 0 && (
              <Text style={styles.imageCount}>
                {selectedImages.length} / 5 fotos
              </Text>
            )}
          </View>

          {/*  Botón */}
          <View style={styles.submitButtonContainer}>
            <CustomButton
              text={loading ? "Publicando..." : "Publicar reseña"}
              onPress={handleSubmit}
              variant="primary"
              fullWidth
              disabled={loading || rating === 0}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { ...typography.bold.big, color: colors.text },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: {
    ...typography.bold.large,
    color: colors.text,
    marginBottom: 12,
  },
  optional: { ...typography.regular.medium, color: colors.textSec },
  sectionSubtitle: {
    ...typography.regular.small,
    color: colors.textSec,
    marginBottom: 16,
  },
  ratingTextContainer: { alignItems: "center", marginTop: 8, gap: 4 },
  ratingNumber: { ...typography.bold.big, fontSize: 32, color: colors.primary },
  ratingLabel: { ...typography.semibold.medium, color: colors.text },
  textArea: {
    ...typography.regular.medium,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    ...typography.regular.small,
    color: colors.textSec,
    textAlign: "right",
    marginTop: 8,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  addImageButton: {
    flex: 1,
    minWidth: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  addImageText: {
    ...typography.regular.small,
    color: colors.primary,
    marginTop: 8,
  },
  imagePreviewContainer: { position: "relative", width: 100, height: 100 },
  imagePreview: { width: "100%", height: "100%", borderRadius: 12 },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
  },
  imageCount: {
    ...typography.regular.small,
    color: colors.textSec,
    marginTop: 12,
  },
  submitButtonContainer: { marginTop: 40, marginBottom: 20 },
});
