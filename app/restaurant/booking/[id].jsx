// app/restaurant/booking/[id].jsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30 min" },
  { value: 120, label: "2 horas" },
];

const OCCASION_ICONS = {
  Cumpleaños: "gift",
  Aniversario: "heart",
  "Cita Romántica": "wine",
  "De Cita romantica": "wine",
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

  const [currentMonth, setCurrentMonth] = useState(new Date());

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
          { id: 3, name: "De Cita romantica" },
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

  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getMonthData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(newDate);
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
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

  const { daysInMonth, startDayOfWeek, year, month } = getMonthData();
  const monthName = new Date(year, month).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

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
            <Text style={styles.headerTitle}>Reservar mesa</Text>
            <Text style={styles.headerSubtitle}>{restaurant?.name}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Título de sección */}
          <View style={styles.section}>
            <Text style={styles.mainSectionTitle}>Escoge la fecha y hora</Text>
          </View>

          {/* Calendario */}
          <View style={styles.section}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleMonthChange(-1)}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </Text>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleMonthChange(1)}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.calendar}>
              <View style={styles.weekDays}>
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                  (day) => (
                    <Text key={day} style={styles.weekDayText}>
                      {day}
                    </Text>
                  )
                )}
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: startDayOfWeek }).map((_, index) => (
                  <View key={`empty-${index}`} style={styles.dayCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayDate = new Date(year, month, day);
                  const isSelected = isSameDay(dayDate, selectedDate);
                  const isPast = dayDate < new Date().setHours(0, 0, 0, 0);

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => !isPast && handleDateSelect(day)}
                      disabled={isPast}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          isPast && styles.dayTextDisabled,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Horarios Disponibles */}
          <View style={styles.section}>
            {loadingSlots ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.slotsLoadingText}>
                  Cargando horarios...
                </Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.noSlotsContainer}>
                <Text style={styles.noSlotsText}>
                  No hay horarios disponibles
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeSlotsContainer}
              >
                {availableSlots.map((slot, index) => {
                  const availableTables = getAvailableTablesForSlot(slot);
                  const isDisabled =
                    availableTables.length === 0 || isSlotInPast(slot.time);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        selectedSlot?.time === slot.time &&
                          styles.timeSlotSelected,
                        isDisabled && styles.timeSlotDisabled,
                      ]}
                      onPress={() => !isDisabled && handleSlotSelect(slot)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedSlot?.time === slot.time &&
                            styles.timeSlotTextSelected,
                          isDisabled && styles.timeSlotTextDisabled,
                        ]}
                      >
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Número de invitados */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Numero de invitados</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.guestsContainer}
            >
              {GUEST_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.guestOption,
                    numberOfGuests === item && styles.guestOptionActive,
                  ]}
                  onPress={() => setNumberOfGuests(item)}
                >
                  <Text
                    style={[
                      styles.guestOptionText,
                      numberOfGuests === item && styles.guestOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tipo de Ocasión */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de ocasión</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.occasionsContainer}
            >
              {occasionTypes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.occasionChip,
                    selectedOccasion === item.id && styles.occasionChipActive,
                  ]}
                  onPress={() => setSelectedOccasion(item.id)}
                >
                  <Text
                    style={[
                      styles.occasionText,
                      selectedOccasion === item.id && styles.occasionTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Duración */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duración estimada</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationContainer}
            >
              {DURATION_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.durationChip,
                    selectedDuration === item.value &&
                      styles.durationChipActive,
                  ]}
                  onPress={() => setSelectedDuration(item.value)}
                >
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
              ))}
            </ScrollView>
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
        </ScrollView>

        {/* Botón de Reservar */}
        <View style={styles.bottomContainer}>
          <CustomButton
            text={submitting ? "Procesando..." : "Confirmar reserva"}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
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
    fontSize: 20,
  },
  headerSubtitle: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginTop: 2,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  mainSectionTitle: {
    ...typography.bold.large,
    color: colors.text,
    fontSize: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    ...typography.bold.medium,
    color: colors.text,
    marginBottom: 12,
    fontSize: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthArrow: {
    padding: 8,
  },
  monthText: {
    ...typography.semibold.medium,
    color: colors.text,
    fontSize: 16,
    textTransform: "capitalize",
  },
  calendar: {
    paddingBottom: 0,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  weekDayText: {
    ...typography.regular.small,
    color: colors.textSec,
    fontSize: 11,
    width: 40,
    textAlign: "center",
    textTransform: "uppercase",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 40, // en lugar de aspectRatio: 1
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 50,
  },
  dayText: {
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 15,
  },
  dayTextSelected: {
    ...typography.bold.medium,
    color: colors.white,
  },
  dayTextDisabled: {
    color: colors.lightGray,
  },
  timeSlotsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  timeSlot: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.base,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotDisabled: {
    opacity: 0.4,
  },
  timeSlotText: {
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 14,
  },
  timeSlotTextSelected: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  timeSlotTextDisabled: {
    color: colors.textSec,
  },
  slotsLoading: {
    paddingVertical: 24,
    alignItems: "center",
  },
  slotsLoadingText: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 12,
    fontSize: 14,
  },
  noSlotsContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noSlotsText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    fontSize: 14,
  },
  guestsContainer: {
    paddingRight: 20,
    gap: 10,
  },
  guestOption: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.base,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  guestOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  guestOptionText: {
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 16,
  },
  guestOptionTextActive: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  occasionsContainer: {
    paddingRight: 20,
    gap: 10,
  },
  occasionChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.base,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  occasionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  occasionText: {
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 14,
  },
  occasionTextActive: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  durationContainer: {
    paddingRight: 20,
    gap: 10,
  },
  durationChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.base,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationText: {
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 14,
  },
  durationTextActive: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  commentsInput: {
    backgroundColor: colors.base,
    borderRadius: 12,
    padding: 16,
    ...typography.regular.medium,
    color: colors.text,
    minHeight: 100,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});
