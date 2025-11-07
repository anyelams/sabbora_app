// components/LocationDropdownModal.jsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import {
  getCities,
  getCountries,
  getStates,
} from "../services/locationService";

export default function LocationSearchModal({
  visible,
  onClose,
  onLocationSelect,
  onUseGPS,
  hasLocationPermission,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Listas
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Selecciones
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Búsqueda
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  // Dirección adicional (opcional)
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (visible) {
      loadCountries();
    }
  }, [visible]);

  const loadCountries = async () => {
    setLoading(true);
    const data = await getCountries();
    setCountries(data);
    setLoading(false);
  };

  const loadStates = async (countryCode) => {
    setLoading(true);
    const data = await getStates(countryCode);
    setStates(data);
    setLoading(false);
  };

  const loadCities = async (countryCode, stateCode) => {
    setLoading(true);
    const data = await getCities(countryCode, stateCode);
    setCities(data);
    setLoading(false);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedCity(null);
    setAddress("");
    loadStates(country.iso2);
    setStep(2);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedCity(null);
    setAddress("");
    loadCities(selectedCountry.iso2, state.iso2);
    setStep(3);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setStep(4);
  };

  const handleConfirm = () => {
    if (selectedCity) {
      onLocationSelect({
        countryName: selectedCountry.name,
        countryCode: selectedCountry.iso2,
        stateName: selectedState.name,
        stateCode: selectedState.iso2,
        cityName: selectedCity.name,
        cityId: selectedCity.id,
        address: address.trim(),
      });
      resetModal();
    }
  };

  const handleSkipAddress = () => {
    if (selectedCity) {
      onLocationSelect({
        countryName: selectedCountry.name,
        countryCode: selectedCountry.iso2,
        stateName: selectedState.name,
        stateCode: selectedState.iso2,
        cityName: selectedCity.name,
        cityId: selectedCity.id,
        address: "",
      });
      resetModal();
    }
  };

  const handleUseGPS = async () => {
    if (onUseGPS) {
      await onUseGPS();
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedCity(null);
    setAddress("");
    setCountrySearch("");
    setStateSearch("");
    setCitySearch("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleBack = () => {
    if (step === 4) {
      setStep(3);
      setAddress("");
    } else if (step === 3) {
      setStep(2);
      setSelectedCity(null);
    } else if (step === 2) {
      setStep(1);
      setSelectedState(null);
    }
  };

  // Filtrar listas según búsqueda
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredStates = states.filter((state) =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const renderHeader = () => {
    let title = "Selecciona tu país";
    if (step === 2) title = "Selecciona tu departamento";
    if (step === 3) title = "Selecciona tu ciudad";
    if (step === 4) title = "Dirección";

    return (
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.textSec} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderBreadcrumb = () => {
    if (step === 1) return null;

    return (
      <View style={styles.breadcrumb}>
        <Ionicons name="location" size={14} color={colors.textSec} />
        <Text style={styles.breadcrumbText} numberOfLines={1}>
          {selectedCountry?.name}
          {selectedState && ` › ${selectedState.name}`}
          {selectedCity && ` › ${selectedCity.name}`}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderBreadcrumb()}

        {step === 4 ? (
          // Paso 4: Dirección opcional
          <View style={styles.addressContainer}>
            <Text style={styles.subtitle}>
              Ingresa una dirección específica para obtener distancias más
              precisas (opcional)
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.textSec}
              />
              <TextInput
                style={styles.addressInput}
                placeholder="Ej: Calle 123 #45-67"
                placeholderTextColor={colors.textSec}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.addressButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleSkipAddress}
              >
                <Text style={styles.buttonSecondaryText}>Omitir dirección</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  !address.trim() && styles.buttonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!address.trim()}
              >
                <Text
                  style={[
                    styles.buttonPrimaryText,
                    !address.trim() && styles.buttonPrimaryTextDisabled,
                  ]}
                >
                  {address.trim() ? "Confirmar ubicación" : "Ingresa dirección"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                Si no ingresas una dirección, usaremos el centro de tu ciudad
                como referencia
              </Text>
            </View>
          </View>
        ) : (
          // Pasos 1-3: Selección de país, departamento, ciudad
          <>
            {/* Botón GPS - Solo en paso 1 */}
            {step === 1 && onUseGPS && (
              <View style={styles.gpsSection}>
                <TouchableOpacity
                  style={[
                    styles.gpsButton,
                    !hasLocationPermission && styles.gpsButtonDisabled,
                  ]}
                  onPress={handleUseGPS}
                  disabled={!hasLocationPermission}
                  activeOpacity={0.7}
                >
                  <View style={styles.gpsIconCircle}>
                    <Ionicons
                      name="navigate"
                      size={18}
                      color={
                        hasLocationPermission ? colors.primary : colors.textSec
                      }
                    />
                  </View>
                  <View style={styles.gpsContent}>
                    <Text style={styles.gpsTitle}>
                      Usar mi ubicación actual
                    </Text>
                    <Text style={styles.gpsDescription}>
                      {hasLocationPermission
                        ? "Detectar automáticamente con GPS"
                        : "Permiso de ubicación no concedido"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={
                      hasLocationPermission ? colors.primary : colors.textSec
                    }
                  />
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o busca manualmente</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            )}

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={colors.textSec} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Buscar ${
                  step === 1 ? "país" : step === 2 ? "departamento" : "ciudad"
                }...`}
                placeholderTextColor={colors.textSec}
                value={
                  step === 1
                    ? countrySearch
                    : step === 2
                    ? stateSearch
                    : citySearch
                }
                onChangeText={
                  step === 1
                    ? setCountrySearch
                    : step === 2
                    ? setStateSearch
                    : setCitySearch
                }
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : (
              <ScrollView style={styles.list}>
                {step === 1 &&
                  filteredCountries.map((country) => (
                    <TouchableOpacity
                      key={country.iso2}
                      style={styles.listItem}
                      onPress={() => handleCountrySelect(country)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.listItemText}>{country.name}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.border}
                      />
                    </TouchableOpacity>
                  ))}

                {step === 2 &&
                  filteredStates.map((state) => (
                    <TouchableOpacity
                      key={state.iso2}
                      style={styles.listItem}
                      onPress={() => handleStateSelect(state)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.listItemText}>{state.name}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.border}
                      />
                    </TouchableOpacity>
                  ))}

                {step === 3 &&
                  filteredCities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={styles.listItem}
                      onPress={() => handleCitySelect(city)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.listItemText}>{city.name}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.border}
                      />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  title: {
    ...typography.semibold.large,
    flex: 1,
    color: colors.text,
    textAlign: "center",
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.lightGray,
    gap: 6,
  },
  breadcrumbText: {
    ...typography.medium.small,
    flex: 1,
    color: colors.textSec,
  },
  gpsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  gpsButtonDisabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.border,
    shadowColor: colors.darkGray,
    shadowOpacity: 0,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    backgroundColor: colors.white,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.darkGray,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gpsContent: {
    flex: 1,
  },
  gpsTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 2,
  },
  gpsDescription: {
    ...typography.medium.small,
    color: colors.textSec,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.medium.small,
    color: colors.textSec,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    ...typography.regular.large,
    flex: 1,
    color: colors.text,
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.medium.medium,
    marginTop: 12,
    color: colors.textSec,
  },
  list: {
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  listItemText: {
    ...typography.medium.medium,
    color: colors.text,
  },
  addressContainer: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginBottom: 16,
    lineHeight: 19,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressInput: {
    ...typography.regular.large,
    flex: 1,
    color: colors.text,
    minHeight: 50,
    textAlignVertical: "top",
    paddingVertical: 0,
  },
  addressButtons: {
    gap: 10,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  buttonDisabled: {
    backgroundColor: "#d9d9d92a",
    borderWidth: 1,
    borderColor: "#bfbfbf3e",
  },
  buttonPrimaryTextDisabled: {
    color: "#8c8c8c9e",
  },

  buttonSecondary: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    ...typography.regular.small,
    flex: 1,
    color: colors.textSec,
    lineHeight: 17,
  },
});
