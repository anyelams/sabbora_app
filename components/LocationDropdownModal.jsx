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
    if (step === 4) title = "Dirección (opcional)";

    return (
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={22} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderBreadcrumb = () => {
    if (step === 1) return null;

    return (
      <View style={styles.breadcrumb}>
        <Ionicons name="location" size={14} color="#666" />
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
              <Ionicons name="location-outline" size={18} color="#999" />
              <TextInput
                style={styles.addressInput}
                placeholder="Ej: Calle 123 #45-67"
                placeholderTextColor="#999"
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
                <Text style={styles.buttonPrimaryText}>
                  {address.trim() ? "Confirmar ubicación" : "Ingresa dirección"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#007AFF" />
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
                      color={hasLocationPermission ? "#007AFF" : "#999"}
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
                    color={hasLocationPermission ? "#007AFF" : "#999"}
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
              <Ionicons name="search" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Buscar ${
                  step === 1 ? "país" : step === 2 ? "departamento" : "ciudad"
                }...`}
                placeholderTextColor="#999"
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
                <ActivityIndicator size="large" color="#007AFF" />
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
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
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
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
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
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
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
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    letterSpacing: -0.3,
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
    backgroundColor: "#F8F9FA",
    gap: 6,
  },
  breadcrumbText: {
    flex: 1,
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  gpsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#007AFF",
    gap: 12,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  gpsButtonDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    backgroundColor: "#FFF",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gpsContent: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  gpsDescription: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
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
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  list: {
    flex: 1,
    backgroundColor: "#FFF",
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
    borderBottomColor: "#F5F5F5",
  },
  listItemText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  addressContainer: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
    lineHeight: 19,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
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
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: "#E5E5E5",
    shadowOpacity: 0,
  },
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    letterSpacing: -0.2,
  },
  buttonSecondary: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    letterSpacing: -0.2,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF",
    padding: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#D4EBFF",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#666",
    lineHeight: 17,
    fontWeight: "500",
  },
});
