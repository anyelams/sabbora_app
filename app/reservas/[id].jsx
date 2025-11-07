import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import axiosPrivate from "../../services/axiosPrivate";

const ReservaDetalle = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [reserva, setReserva] = useState(null);
  const [menuItemsDetails, setMenuItemsDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservaDetalle();
  }, [id]);

  const fetchReservaDetalle = async () => {
    try {
      setError(null);
      const response = await axiosPrivate.get(
        `/reservation/reservations/${id}`
      );
      setReserva(response.data);

      if (response.data.menu_items && response.data.menu_items.length > 0) {
        await fetchMenuItems(response.data.menu_items);
      }
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      setError("Error al cargar los detalles de la reserva");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async (menuItems) => {
    try {
      const promises = menuItems.map((item) =>
        axiosPrivate.get(`/menu/menu-items/${item.menu_item_id}`)
      );
      const responses = await Promise.all(promises);
      setMenuItemsDetails(responses.map((r) => r.data));
    } catch (error) {
      console.error("Error al cargar items del menú:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !reserva) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.gray} />
          <Text style={styles.errorText}>
            {error || "Reserva no encontrada"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const firstPhoto = reserva.location?.photos?.[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={23} color={colors.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de Reserva</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {firstPhoto && (
          <Image source={{ uri: firstPhoto }} style={styles.image} />
        )}

        <View style={styles.content}>
          <Text style={styles.restaurantName}>{reserva.location?.name}</Text>

          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                {formatDate(reserva.date_time)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                {formatTime(reserva.date_time)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="people-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                {reserva.number_of_guests}{" "}
                {reserva.number_of_guests === 1 ? "persona" : "personas"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                {reserva.duration_minutes} minutos
              </Text>
            </View>

            {reserva.table && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="restaurant-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.infoText}>
                  Mesa {reserva.table.table_number}
                </Text>
              </View>
            )}

            {reserva.occasion_type && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="gift-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.infoText}>
                  {reserva.occasion_type.name}
                </Text>
              </View>
            )}
          </View>

          {menuItemsDetails.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items del Menú</Text>
              {menuItemsDetails.map((item) => {
                const reservaItem = reserva.menu_items.find(
                  (mi) => mi.menu_item_id === item.id
                );
                const primaryPhoto = item.photos?.find((p) => p.is_primary);

                return (
                  <View key={item.id} style={styles.menuItem}>
                    {primaryPhoto && (
                      <Image
                        source={{ uri: primaryPhoto.photo_url }}
                        style={styles.menuItemImage}
                      />
                    )}
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      {item.description && (
                        <Text style={styles.menuItemDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      <View style={styles.menuItemFooter}>
                        <Text style={styles.menuItemPrice}>
                          {formatPrice(item.price)}
                        </Text>
                        <Text style={styles.menuItemQuantity}>
                          x{reservaItem?.quantity || 1}
                        </Text>
                      </View>
                      {reservaItem?.notes && (
                        <Text style={styles.menuItemNotes}>
                          Nota: {reservaItem.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {reserva.comments && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comentarios</Text>
              <Text style={styles.commentsText}>{reserva.comments}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    ...typography.semibold.medium,
    color: colors.darkGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: 250,
  },
  content: {
    padding: 20,
  },
  restaurantName: {
    ...typography.semibold.big,
    fontSize: 24,
    color: colors.darkGray,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.semibold.medium,
    color: colors.darkGray,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  menuItem: {
    flexDirection: "row",
    backgroundColor: colors.base,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  menuItemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  menuItemName: {
    ...typography.semibold.medium,
    color: colors.darkGray,
    marginBottom: 4,
  },
  menuItemDesc: {
    ...typography.regular.small,
    color: colors.textSec,
    marginBottom: 8,
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemPrice: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  menuItemQuantity: {
    ...typography.semibold.small,
    color: colors.textSec,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  menuItemNotes: {
    ...typography.regular.small,
    color: colors.textSec,
    fontStyle: "italic",
    marginTop: 4,
  },
  commentsText: {
    ...typography.regular.medium,
    color: colors.textSec,
    lineHeight: 22,
  },
});

export default ReservaDetalle;
