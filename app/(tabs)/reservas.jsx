import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import axiosPrivate from "../../services/axiosPrivate";

const Reservas = () => {
  const router = useRouter();
  const { userId } = useSession();
  const [reservas, setReservas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("proximas"); // "proximas" | "pasadas"

  const fetchReservas = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      const response = await axiosPrivate.get(
        `/reservation/reservations/by_user/${userId}?limit=100&offset=0`
      );
      setReservas(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      setError("Error al cargar las reservas");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReservas();
  }, [fetchReservas]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    return date.toLocaleDateString("es-ES", options);
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

  const separateReservas = () => {
    const now = new Date();
    const proximas = [];
    const pasadas = [];

    reservas.forEach((reserva) => {
      const reservaDate = new Date(reserva.date_time);
      if (reservaDate >= now) {
        proximas.push(reserva);
      } else {
        pasadas.push(reserva);
      }
    });

    return {
      proximas: proximas.sort(
        (a, b) => new Date(a.date_time) - new Date(b.date_time)
      ),
      pasadas: pasadas.sort(
        (a, b) => new Date(b.date_time) - new Date(a.date_time)
      ),
    };
  };

  const handleReservaPress = (reserva) => {
    router.push(`/reservas/${reserva.id}`);
  };

  const renderReservaItem = ({ item }) => {
    const firstPhoto = item.location?.photos?.[0];

    return (
      <TouchableOpacity
        style={styles.reservaItem}
        onPress={() => handleReservaPress(item)}
        activeOpacity={0.6}
      >
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={styles.restaurantImage} />
        ) : (
          <View style={[styles.restaurantImage, styles.placeholderImage]}>
            <Ionicons name="restaurant" size={28} color={colors.gray} />
          </View>
        )}

        <View style={styles.reservaInfo}>
          <View style={styles.topRow}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {item.location?.name || "Restaurante"}
            </Text>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={colors.textSec} />
              <Text style={styles.timeText}>{formatTime(item.date_time)}</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.textSec}
              />
              <Text style={styles.detailText}>
                {formatDate(item.date_time)}
              </Text>
            </View>
            <View style={styles.detailSeparator} />
            <View style={styles.detailItem}>
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.textSec}
              />
              <Text style={styles.detailText}>
                {item.number_of_guests}{" "}
                {item.number_of_guests === 1 ? "persona" : "personas"}
              </Text>
            </View>
          </View>

          {item.occasion_type?.name && (
            <View style={styles.occasionTag}>
              <Text style={styles.occasionText}>{item.occasion_type.name}</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === "proximas" ? "calendar-outline" : "time-outline"}
        size={64}
        color={colors.gray}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === "proximas"
          ? "No tienes reservas próximas"
          : "No tienes reservas pasadas"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "proximas"
          ? "Explora nuestros restaurantes y agenda tu primera reserva."
          : "Aquí aparecerán tus reservas completadas."}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reservas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando reservas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reservas</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.gray} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReservas}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { proximas, pasadas } = separateReservas();
  const currentData = activeTab === "proximas" ? proximas : pasadas;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reservas</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "proximas" && styles.activeTab]}
          onPress={() => setActiveTab("proximas")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "proximas" && styles.activeTabText,
            ]}
          >
            Próximas
          </Text>
          {proximas.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{proximas.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "pasadas" && styles.activeTab]}
          onPress={() => setActiveTab("pasadas")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pasadas" && styles.activeTabText,
            ]}
          >
            Pasadas
          </Text>
          {pasadas.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pasadas.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentData}
        renderItem={renderReservaItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          currentData.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  headerTitle: {
    ...typography.semibold.big,
    fontSize: 28,
    color: colors.darkGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  loadingText: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: colors.white,
  },
  errorText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.base,
    gap: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.semibold.medium,
    color: colors.textSec,
  },
  activeTabText: {
    color: colors.white,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    ...typography.semibold.small,
    color: colors.white,
    fontSize: 12,
  },
  list: {
    paddingTop: 8,
    backgroundColor: colors.white,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.semibold.medium,
    color: colors.darkGray,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.regular.medium,
    color: colors.gray,
    textAlign: "center",
  },
  reservaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    gap: 12,
  },
  restaurantImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  reservaInfo: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  restaurantName: {
    ...typography.semibold.medium,
    color: colors.darkGray,
    flex: 1,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    ...typography.semibold.small,
    color: colors.textSec,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  detailSeparator: {
    width: 1,
    height: 12,
    backgroundColor: colors.lightGray,
  },
  occasionTag: {
    alignSelf: "flex-start",
    backgroundColor: colors.base,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  occasionText: {
    ...typography.regular.small,
    color: colors.textSec,
    fontSize: 11,
  },
  separator: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginLeft: 96,
  },
});

export default Reservas;
