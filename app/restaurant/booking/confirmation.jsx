// app/restaurant/booking/confirmation.jsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../components/CustomButton";
import { colors } from "../../../config/theme";
import { typography } from "../../../config/typography";

export default function ReservationConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { reservationId, restaurantName, restaurantId, date, time, guests } =
    params;

  const handleGoHome = () => {
    // Navegar a la pantalla principal usando replace para limpiar el stack
    router.replace("/(tabs)/welcome");
  };

  const handlePreorderMenu = () => {
    // Navegar a la pantalla de menú con el restaurantId y reservationId
    router.push({
      pathname: `restaurant/booking/menu`,
      params: {
        reservationId,
        fromConfirmation: "true",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Icono de éxito con animación */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={64} color={colors.white} />
          </View>
        </View>

        {/* Título y mensaje */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>¡Reserva Confirmada!</Text>
          <Text style={styles.subtitle}>
            Tu mesa ha sido reservada exitosamente
          </Text>
        </View>

        {/* Detalles de la reserva */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="restaurant" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Restaurante</Text>
              <Text style={styles.detailValue}>{restaurantName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fecha</Text>
              <Text style={styles.detailValue}>{date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Hora</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Personas</Text>
              <Text style={styles.detailValue}>
                {guests} {parseInt(guests) === 1 ? "persona" : "personas"}
              </Text>
            </View>
          </View>
        </View>

        {/* Info adicional */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Puedes ver los detalles de tu reserva en la sección de "Reservas"
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <CustomButton
            text="Preordenar Menú"
            onPress={handlePreorderMenu}
            variant="primary"
            icon="restaurant"
            fullWidth
          />

          <CustomButton
            text="Volver al Inicio"
            onPress={handleGoHome}
            variant="secondary"
            icon="home"
            fullWidth
          />
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: "space-between",
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    ...typography.bold.big,
    fontSize: 28,
    color: colors.darkGray,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
  },
  detailsCard: {
    backgroundColor: colors.base,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...typography.regular.small,
    color: colors.textSec,
    marginBottom: 4,
  },
  detailValue: {
    ...typography.semibold.medium,
    color: colors.darkGray,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.base,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    ...typography.regular.small,
    color: colors.textSec,
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
});
