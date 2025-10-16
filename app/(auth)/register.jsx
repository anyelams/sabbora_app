// app/(auth)/register.jsx - Con redirección a permisos
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
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
import axiosPublic from "../../services/axiosPublic";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    firstLastName: "",
    secondLastName: "",
    documentNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [genders, setGenders] = useState([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: (currentStep - 1) / 2,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const loadInitialData = async () => {
    try {
      let gendersList = [];
      try {
        const gendersResponse = await axiosPublic.get(
          "/users/genders/?limit=10&offset=0"
        );
        gendersList = gendersResponse.data.data || [];
      } catch (genderError) {
        console.error("Error cargando géneros:", genderError);
        gendersList = [
          { id: 1, name: "Masculino" },
          { id: 2, name: "Femenino" },
          { id: 3, name: "No binario" },
        ];
      }

      const docTypes = [
        { id: 1, name: "Cédula de Ciudadanía" },
        { id: 2, name: "Cédula de Extranjería" },
        { id: 3, name: "Pasaporte" },
      ];

      setDocumentTypes(docTypes);
      setGenders(gendersList);
      setSelectedDocumentType(docTypes[0]);
      setSelectedGender(gendersList[0]);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.email.trim()) {
          newErrors.email = "Email es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          newErrors.email = "Email inválido";
        }
        if (!formData.password) {
          newErrors.password = "Contraseña es requerida";
        } else if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(
            formData.password
          )
        ) {
          newErrors.password =
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número";
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Confirmar contraseña es requerida";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Las contraseñas no coinciden";
        }
        break;

      case 2:
        if (!formData.firstName.trim()) {
          newErrors.firstName = "Primer nombre es requerido";
        }
        if (!formData.firstLastName.trim()) {
          newErrors.firstLastName = "Primer apellido es requerido";
        }
        break;

      case 3:
        if (!formData.documentNumber.trim()) {
          newErrors.documentNumber = "Número de documento es requerido";
        } else if (!/^\d+$/.test(formData.documentNumber.trim())) {
          newErrors.documentNumber = "El documento solo debe contener números";
        }
        break;
    }

    return newErrors;
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    const stepErrors = validateStep(3);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        first_name: formData.firstName.trim(),
        second_name: formData.secondName.trim() || null,
        first_last_name: formData.firstLastName.trim(),
        second_last_name: formData.secondLastName.trim(),
        document_type_id: selectedDocumentType?.id || 1,
        document_number: formData.documentNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        gender_id: selectedGender?.id || 1,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      };

      const response = await axiosPublic.post("/users/signup", payload);

      if (response.data.success || response.status === 201) {
        Alert.alert(
          "¡Registro exitoso!",
          "Tu cuenta ha sido creada correctamente. Inicia sesión para configurar tus permisos.",
          [
            {
              text: "Continuar",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      } else {
        setErrors({
          general: response.data.message || "Error en el registro",
        });
      }
    } catch (err) {
      console.error("Error en registro:", err);

      let errorMessage = "Error inesperado. Intenta nuevamente";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 409) {
        errorMessage = "El email o documento ya están registrados";
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepSubtitle}>
        Crea tu email y contraseña para acceder
      </Text>

      <CustomInput
        label="Email *"
        placeholder="tu@email.com"
        value={formData.email}
        onChangeText={(value) => handleInputChange("email", value)}
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />

      <CustomInput
        label="Contraseña *"
        placeholder="Mínimo 8 caracteres"
        value={formData.password}
        onChangeText={(value) => handleInputChange("password", value)}
        icon="lock-closed-outline"
        secureTextEntry={true}
        showPasswordToggle={true}
        error={errors.password}
      />

      <CustomInput
        label="Confirmar contraseña *"
        placeholder="Repite tu contraseña"
        value={formData.confirmPassword}
        onChangeText={(value) => handleInputChange("confirmPassword", value)}
        icon="lock-closed-outline"
        secureTextEntry={true}
        showPasswordToggle={true}
        error={errors.confirmPassword}
      />

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Continuar"
          onPress={nextStep}
          variant="primary"
          style={styles.fullButton}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepSubtitle}>Cuéntanos un poco sobre ti</Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <CustomInput
            label="Primer nombre *"
            placeholder="Juan"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange("firstName", value)}
            icon="person-outline"
            autoCapitalize="words"
            error={errors.firstName}
          />
        </View>
        <View style={styles.halfInput}>
          <CustomInput
            label="Segundo nombre"
            placeholder="Carlos"
            value={formData.secondName}
            onChangeText={(value) => handleInputChange("secondName", value)}
            icon="person-outline"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <CustomInput
            label="Primer apellido *"
            placeholder="Pérez"
            value={formData.firstLastName}
            onChangeText={(value) => handleInputChange("firstLastName", value)}
            icon="person-outline"
            autoCapitalize="words"
            error={errors.firstLastName}
          />
        </View>
        <View style={styles.halfInput}>
          <CustomInput
            label="Segundo apellido *"
            placeholder="García"
            value={formData.secondLastName}
            onChangeText={(value) => handleInputChange("secondLastName", value)}
            icon="person-outline"
            autoCapitalize="words"
            error={errors.secondLastName}
          />
        </View>
      </View>

      <View style={styles.selectContainer}>
        <Text style={styles.selectLabel}>Género *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowGenderModal(true)}
        >
          <Ionicons name="person-outline" size={20} color={colors.textSec} />
          <Text style={styles.selectText}>
            {selectedGender?.name || "Seleccionar género"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSec} />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Atrás"
          onPress={prevStep}
          variant="outline"
          style={styles.halfButton}
        />
        <CustomButton
          text="Continuar"
          onPress={nextStep}
          variant="primary"
          style={styles.halfButton}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepSubtitle}>
        Información para verificar tu identidad
      </Text>

      <View style={styles.selectContainer}>
        <Text style={styles.selectLabel}>Tipo de documento *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowDocumentModal(true)}
        >
          <Ionicons name="card-outline" size={20} color={colors.textSec} />
          <Text style={styles.selectText}>
            {selectedDocumentType?.name || "Seleccionar tipo"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSec} />
        </TouchableOpacity>
      </View>

      <CustomInput
        label="Número de documento *"
        placeholder="Ingresa tu número de documento"
        value={formData.documentNumber}
        onChangeText={(value) => handleInputChange("documentNumber", value)}
        icon="card-outline"
        keyboardType="numeric"
        error={errors.documentNumber}
      />

      <View style={styles.infoBox}>
        <Ionicons
          name="shield-checkmark-outline"
          size={24}
          color={colors.primary}
        />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Información segura</Text>
          <Text style={styles.infoText}>
            Tus datos están protegidos y solo se usan para verificar tu
            identidad
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Atrás"
          onPress={prevStep}
          variant="outline"
          style={styles.halfButton}
        />
        <CustomButton
          text={loading ? "Creando..." : "Crear cuenta"}
          onPress={handleRegister}
          variant="primary"
          disabled={loading}
          style={styles.halfButton}
        />
      </View>
    </View>
  );

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
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
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>Crear cuenta</Text>
              <Text style={styles.stepIndicator}>{currentStep}/3</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["33%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {errors.general && (
            <Text style={styles.generalError}>{errors.general}</Text>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <View style={styles.footer}>
            <View style={styles.footerLinks}>
              <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={styles.linkText}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Género</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={genders}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedGender?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedGender(item);
                    setShowGenderModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedGender?.id === item.id &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedGender?.id === item.id && (
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
              data={documentTypes}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  mainTitle: {
    ...typography.bold.big,
    fontSize: 26,
    color: colors.text,
  },
  stepIndicator: {
    ...typography.regular.medium,
    color: colors.textSec,
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  generalError: {
    ...typography.regular.regular,
    color: colors.error,
    marginBottom: 20,
    textAlign: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  stepContainer: {
    flex: 1,
  },
  stepSubtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginBottom: 22,
    fontSize: 15,
    lineHeight: 22,
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
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  fullButton: {
    flex: 1,
  },
  halfButton: {
    flex: 1,
  },
  footer: {
    paddingTop: 32,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    ...typography.regular.medium,
    color: colors.textSec,
    fontSize: 14,
  },
  linkText: {
    ...typography.semibold.regular,
    color: colors.secondary,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "flex-start",
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 4,
    fontSize: 14,
  },
  infoText: {
    ...typography.regular.small,
    color: colors.textSec,
    lineHeight: 18,
    fontSize: 13,
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
    backgroundColor: "#e3f2fd",
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
