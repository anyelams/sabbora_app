// app/profile/editProfile.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import axiosPrivate from "../../services/axiosPrivate";

const DOCUMENT_TYPES = [
  { id: 1, name: "Cédula de Ciudadanía" },
  { id: 2, name: "Cédula de Extranjería" },
  { id: 3, name: "Pasaporte" },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { userId, fetchUserData } = useSession();

  const [formData, setFormData] = useState({
    first_name: "",
    second_name: "",
    first_last_name: "",
    second_last_name: "",
    document_number: "",
  });

  const [selectedDocumentType, setSelectedDocumentType] = useState(
    DOCUMENT_TYPES[0]
  );
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsFetchingData(true);
    try {
      const response = await axiosPrivate.get(`/users/users/${userId}`);
      const userData = response.data;

      setFormData({
        first_name: userData.first_name || "",
        second_name: userData.second_name || "",
        first_last_name: userData.first_last_name || "",
        second_last_name: userData.second_last_name || "",
        document_number: userData.document_number || "",
      });

      const docType = DOCUMENT_TYPES.find(
        (type) => type.id === userData.document_type_id
      );
      if (docType) {
        setSelectedDocumentType(docType);
      }
    } catch (error) {
      console.error("Error cargando datos del usuario:", error);
      Alert.alert("Error", "No se pudo cargar la información del usuario");
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "Primer nombre es requerido";
    }

    if (!formData.first_last_name.trim()) {
      newErrors.first_last_name = "Primer apellido es requerido";
    }

    if (!formData.document_number.trim()) {
      newErrors.document_number = "Número de documento es requerido";
    } else if (!/^\d+$/.test(formData.document_number)) {
      newErrors.document_number = "El documento debe contener solo números";
    }

    return newErrors;
  };

  const handleUpdateProfile = async () => {
    if (isLoading) return;

    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      await axiosPrivate.put(`/users/users/${userId}`, {
        first_name: formData.first_name.trim(),
        second_name: formData.second_name.trim() || null,
        first_last_name: formData.first_last_name.trim(),
        second_last_name: formData.second_last_name.trim() || null,
        document_type_id: selectedDocumentType.id,
        document_number: formData.document_number.trim(),
      });

      await fetchUserData(userId);

      Alert.alert(
        "¡Perfil actualizado!",
        "Tu información ha sido actualizada exitosamente.",
        [{ text: "Continuar", onPress: () => router.back() }]
      );
    } catch (err) {
      console.error("Error actualizando perfil:", err);

      let errorMessage = "Error inesperado. Intenta nuevamente";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else {
        switch (err.response?.status) {
          case 400:
            errorMessage = "Datos inválidos";
            break;
          case 404:
            errorMessage = "Usuario no encontrado";
            break;
          case 422:
            errorMessage = "Los datos no cumplen los requisitos";
            break;
          case 500:
            errorMessage = "Error del servidor. Intenta más tarde";
            break;
          default:
            if (
              err.message?.includes("Network Error") ||
              err.code === "NETWORK_ERROR"
            ) {
              errorMessage = "Error de conexión. Verifica tu internet";
            }
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>Editar perfil</Text>
            <Text style={styles.subtitle}>
              Actualiza tu información personal
            </Text>
          </View>

          {errors.general && (
            <Text style={styles.generalError}>{errors.general}</Text>
          )}

          <View style={styles.stepContainer}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <CustomInput
                  label="Primer nombre *"
                  placeholder="Ej: Juan"
                  value={formData.first_name}
                  onChangeText={(value) =>
                    handleInputChange("first_name", value)
                  }
                  icon="person-outline"
                  editable={!isLoading}
                  error={errors.first_name}
                />
              </View>
              <View style={styles.halfInput}>
                <CustomInput
                  label="Segundo nombre"
                  placeholder="Ej: Carlos"
                  value={formData.second_name}
                  onChangeText={(value) =>
                    handleInputChange("second_name", value)
                  }
                  icon="person-outline"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <CustomInput
                  label="Primer apellido *"
                  placeholder="Ej: Pérez"
                  value={formData.first_last_name}
                  onChangeText={(value) =>
                    handleInputChange("first_last_name", value)
                  }
                  icon="person-outline"
                  editable={!isLoading}
                  error={errors.first_last_name}
                />
              </View>
              <View style={styles.halfInput}>
                <CustomInput
                  label="Segundo apellido"
                  placeholder="Ej: García"
                  value={formData.second_last_name}
                  onChangeText={(value) =>
                    handleInputChange("second_last_name", value)
                  }
                  icon="person-outline"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>Tipo de documento *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowDocumentModal(true)}
                disabled={isLoading}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={colors.textSec}
                />
                <Text style={styles.selectText}>
                  {selectedDocumentType?.name || "Seleccionar tipo"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textSec}
                />
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Número de documento *"
              placeholder="Ej: 1234567890"
              value={formData.document_number}
              onChangeText={(value) =>
                handleInputChange("document_number", value)
              }
              icon="card-outline"
              keyboardType="numeric"
              editable={!isLoading}
              error={errors.document_number}
            />

            <View style={styles.buttonContainer}>
              <CustomButton
                text={isLoading ? "Guardando..." : "Guardar cambios"}
                onPress={handleUpdateProfile}
                variant="primary"
                disabled={isLoading}
                style={styles.fullButton}
                width="full"
              />

              <CustomButton
                text="Cancelar"
                onPress={() => router.back()}
                variant="secondary"
                disabled={isLoading}
                style={styles.fullButton}
                width="full"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showDocumentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de documento</Text>
              <TouchableOpacity onPress={() => setShowDocumentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DOCUMENT_TYPES}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedDocumentType?.id === item.id &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedDocumentType(item);
                    setShowDocumentModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedDocumentType?.id === item.id &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedDocumentType?.id === item.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    ...typography.medium.medium,
    color: colors.textSec,
  },
  topSection: {
    marginBottom: 28,
  },
  mainTitle: {
    ...typography.bold.big,
    fontSize: 26,
    color: colors.text,
  },
  subtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  generalError: {
    ...typography.regular.regular,
    color: colors.error,
    marginBottom: 24,
    textAlign: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  stepContainer: {
    flex: 1,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 8,
    fontSize: 14,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  selectText: {
    flex: 1,
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 15,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  fullButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.bold.big,
    color: colors.text,
    fontSize: 18,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalItemSelected: {
    backgroundColor: "#efefef60",
  },
  modalItemText: {
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 15,
  },
  modalItemTextSelected: {
    ...typography.semibold.medium,
    color: colors.primary,
    fontSize: 15,
  },
});
