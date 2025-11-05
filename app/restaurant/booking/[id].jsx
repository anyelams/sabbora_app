// app/restaurant/booking/[id].jsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../components/CustomButton";
import { colors } from "../../../config/theme";
import { typography } from "../../../config/typography";
import { useSession } from "../../../context/SessionContext";
import axiosPrivate from "../../../services/axiosPrivate";

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1.5 horas" },
  { value: 120, label: "2 horas" },
];

const OCCASION_ICONS = {
  Cumpleaños: "gift",
  Aniversario: "heart",
  "Cita Romántica": "wine",
  "Reunión de Negocios": "briefcase",
  "Cena Familiar": "home",
  Celebración: "star",
  Otro: "ellipsis-horizontal",
};

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { userId } = useSession();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [occasionTypes, setOccasionTypes] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(120);
  const [comments, setComments] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadRestaurantData();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, numberOfGuests]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const restaurantRes = await axiosPrivate.get(
        `/restaurant/locations/${id}`
      );
      setRestaurant(restaurantRes.data);

      try {
        const occasionTypesRes = await axiosPrivate.get(
          "/reservation/occasion_types/?limit=10&offset=0"
        );
        const occasions = occasionTypesRes.data.data || [];
        setOccasionTypes(occasions);

        if (occasions.length > 0) {
          setSelectedOccasion(occasions[0].id);
        }
      } catch (occasionError) {
        const defaultOccasions = [
          { id: 1, name: "Cumpleaños" },
          { id: 2, name: "Aniversario" },
          { id: 3, name: "Cita Romántica" },
          { id: 4, name: "Reunión de Negocios" },
          { id: 5, name: "Cena Familiar" },
        ];
        setOccasionTypes(defaultOccasions);
        setSelectedOccasion(1);
      }
    } catch (error) {
      console.error("Error cargando restaurante:", error);
      Alert.alert("Error", "No se pudo cargar la información del restaurante");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const formattedDate = formatDateForAPI(selectedDate);
      const response = await axiosPrivate.get(
        `/reservation/reservations/available_slots?location_id=${id}&desired_date=${formattedDate}`
      );
      setAvailableSlots(response.data.available_slots || []);
      setSelectedSlot(null);
      setSelectedTable(null);
    } catch (error) {
      console.error("Error cargando horarios disponibles:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    const suitableTable = slot.available_tables
      .filter((table) => table.capacity >= numberOfGuests)
      .sort((a, b) => a.capacity - b.capacity)[0];
    setSelectedTable(suitableTable || slot.available_tables[0]);
  };

  const handleSubmitReservation = async () => {
    if (!selectedSlot || !selectedTable) {
      Alert.alert("Error", "Por favor selecciona un horario y mesa");
      return;
    }

    if (!userId) {
      Alert.alert(
        "Error",
        "No se pudo obtener el ID del usuario. Por favor inicia sesión nuevamente."
      );
      return;
    }

    try {
      setSubmitting(true);

      const [hours, minutes] = selectedSlot.time.split(":");
      const reservationDate = new Date(selectedDate);
      reservationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const year = reservationDate.getFullYear();
      const month = String(reservationDate.getMonth() + 1).padStart(2, "0");
      const day = String(reservationDate.getDate()).padStart(2, "0");
      const hoursStr = String(hours).padStart(2, "0");
      const minutesStr = String(minutes).padStart(2, "0");
      const dateTimeString = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00`;

      const reservationData = {
        user_id: userId,
        table_id: selectedTable.table_id,
        date_time: dateTimeString,
        number_of_guests: numberOfGuests,
        occasion_type_id: selectedOccasion,
        comments: comments.trim() || undefined,
        duration_minutes: selectedDuration,
        location_id: parseInt(id),
      };

      const response = await axiosPrivate.post(
        "/reservation/reservations/",
        reservationData
      );

      // Navegar a la pantalla de confirmación con los datos de la reserva
      router.replace({
        pathname: "/restaurant/booking/confirmation",
        params: {
          reservationId: response.data.id,
          restaurantName: restaurant.name,
          restaurantId: id,
          date: formatDateForDisplay(selectedDate),
          time: selectedSlot.time,
          guests: numberOfGuests,
        },
      });
    } catch (error) {
      console.error("Error creando reserva:", error);
      Alert.alert(
        "Error",
        error.response?.data?.detail ||
          "No se pudo completar la reserva. Intenta nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableTablesForSlot = (slot) => {
    return slot.available_tables.filter(
      (table) => table.capacity >= numberOfGuests
    );
  };

  const isSlotInPast = (slotTime) => {
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate).setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today).setHours(0, 0, 0, 0);

    if (selectedDateOnly !== todayDateOnly) {
      return false;
    }

    const [hours, minutes] = slotTime.split(":");
    const slotDateTime = new Date();
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const minimumTime = new Date(today.getTime() + 30 * 60000);

    return slotDateTime < minimumTime;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Reservar Mesa</Text>
            <Text style={styles.headerSubtitle}>{restaurant?.name}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Selector de Fecha */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fecha</Text>
            <View style={styles.dateSelector}>
              <TouchableOpacity
                style={styles.dateArrow}
                onPress={() => handleDateChange(-1)}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>
                  {formatDateForDisplay(selectedDate)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.dateArrow}
                onPress={() => handleDateChange(1)}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Número de Personas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Número de personas</Text>
            <FlatList
              data={GUEST_OPTIONS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.guestOption,
                    numberOfGuests === item && styles.guestOptionActive,
                  ]}
                  onPress={() => setNumberOfGuests(item)}
                >
                  <Ionicons
                    name="person"
                    size={18}
                    color={numberOfGuests === item ? colors.white : colors.text}
                  />
                  <Text
                    style={[
                      styles.guestOptionText,
                      numberOfGuests === item && styles.guestOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.guestsContainer}
            />
          </View>

          {/* Horarios Disponibles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horarios disponibles</Text>
            {loadingSlots ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.slotsLoadingText}>
                  Cargando horarios...
                </Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.noSlotsContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={colors.gray}
                />
                <Text style={styles.noSlotsText}>
                  No hay horarios disponibles
                </Text>
                <Text style={styles.noSlotsSubtext}>
                  Intenta con otra fecha o número de personas
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot, index) => {
                  const availableTables = getAvailableTablesForSlot(slot);
                  const isDisabled =
                    availableTables.length === 0 || isSlotInPast(slot.time);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotCard,
                        selectedSlot?.time === slot.time &&
                          styles.slotCardActive,
                        isDisabled && styles.slotCardDisabled,
                      ]}
                      onPress={() => !isDisabled && handleSlotSelect(slot)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.slotTime,
                          selectedSlot?.time === slot.time &&
                            styles.slotTimeActive,
                          isDisabled && styles.slotTimeDisabled,
                        ]}
                      >
                        {slot.time}
                      </Text>
                      <Text
                        style={[
                          styles.slotTables,
                          selectedSlot?.time === slot.time &&
                            styles.slotTablesActive,
                          isDisabled && styles.slotTablesDisabled,
                        ]}
                      >
                        {availableTables.length} mesas
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Info de Mesa Seleccionada */}
          {selectedTable && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mesa seleccionada</Text>
              <View style={styles.tableInfo}>
                <View style={styles.tableInfoRow}>
                  <Ionicons name="restaurant" size={20} color={colors.text} />
                  <Text style={styles.tableInfoText}>
                    Mesa #{selectedTable.table_number}
                  </Text>
                </View>
                <View style={styles.tableInfoRow}>
                  <Ionicons name="people" size={20} color={colors.text} />
                  <Text style={styles.tableInfoText}>
                    Capacidad: {selectedTable.capacity} personas
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Tipo de Ocasión */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de ocasión</Text>
            <FlatList
              data={occasionTypes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.occasionChip,
                    selectedOccasion === item.id && styles.occasionChipActive,
                  ]}
                  onPress={() => setSelectedOccasion(item.id)}
                >
                  <Ionicons
                    name={OCCASION_ICONS[item.name] || "star"}
                    size={16}
                    color={
                      selectedOccasion === item.id ? colors.white : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.occasionText,
                      selectedOccasion === item.id && styles.occasionTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.occasionsContainer}
            />
          </View>

          {/* Duración */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duración estimada</Text>
            <FlatList
              data={DURATION_OPTIONS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.durationChip,
                    selectedDuration === item.value &&
                      styles.durationChipActive,
                  ]}
                  onPress={() => setSelectedDuration(item.value)}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={
                      selectedDuration === item.value
                        ? colors.white
                        : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.durationText,
                      selectedDuration === item.value &&
                        styles.durationTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.durationContainer}
            />
          </View>

          {/* Comentarios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Comentarios o peticiones especiales
            </Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Ej: Mesa cerca de la ventana, silla para bebé, alergias..."
              placeholderTextColor={colors.textSec}
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Botón de Reservar */}
        <View style={styles.bottomContainer}>
          <CustomButton
            text={submitting ? "Procesando..." : "Confirmar Reserva"}
            onPress={handleSubmitReservation}
            disabled={!selectedSlot || !selectedTable || submitting}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
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
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.bold.large,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    ...typography.bold.medium,
    color: colors.text,
    marginBottom: 12,
    fontSize: 16,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.base,
    borderRadius: 16,
    padding: 16,
  },
  dateArrow: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: "center",
  },
  dateText: {
    ...typography.semibold.medium,
    color: colors.text,
    textAlign: "center",
  },
  guestsContainer: {
    gap: 12,
  },
  guestOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.base,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  guestOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  guestOptionText: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  guestOptionTextActive: {
    color: colors.white,
  },
  slotsLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  slotsLoadingText: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 8,
  },
  noSlotsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noSlotsText: {
    ...typography.bold.medium,
    color: colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  noSlotsSubtext: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginTop: 8,
    textAlign: "center",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  slotCard: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: colors.base,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  slotCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotCardDisabled: {
    opacity: 0.4,
  },
  slotTime: {
    ...typography.bold.medium,
    color: colors.text,
  },
  slotTimeActive: {
    color: colors.white,
  },
  slotTimeDisabled: {
    color: colors.textSec,
  },
  slotTables: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  slotTablesActive: {
    color: colors.white,
  },
  slotTablesDisabled: {
    color: colors.lightGray,
  },
  tableInfo: {
    backgroundColor: colors.base,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tableInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tableInfoText: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  occasionsContainer: {
    gap: 12,
  },
  occasionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.base,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  occasionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  occasionText: {
    ...typography.medium.regular,
    color: colors.text,
  },
  occasionTextActive: {
    color: colors.white,
  },
  durationContainer: {
    gap: 12,
  },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.base,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationText: {
    ...typography.medium.regular,
    color: colors.text,
  },
  durationTextActive: {
    color: colors.white,
  },
  commentsInput: {
    backgroundColor: colors.base,
    borderRadius: 12,
    padding: 16,
    ...typography.regular.medium,
    color: colors.text,
    minHeight: 100,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
