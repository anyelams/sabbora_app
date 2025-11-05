import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import SwipeableNotificationItem from "../../components/SwipeableNotificationItem";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import {
  deleteNotification,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

export default function NotificationsScreen() {
  const router = useRouter();
  const { userId } = useSession();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const LIMIT = 10;

  const fetchNotifications = useCallback(
    async (newOffset = 0, append = false) => {
      if (!userId) return;
      try {
        if (newOffset === 0) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        const response = await getUserNotifications(userId, LIMIT, newOffset);

        if (append) setNotifications((prev) => [...prev, ...response.data]);
        else setNotifications(response.data);

        setOffset(newOffset);
        setHasNextPage(response.meta.hasNextPage);
      } catch (error) {
        console.error("Error cargando notificaciones:", error);
        setError("No se pudieron cargar las notificaciones");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [userId]
  );

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasNextPage) {
      const nextOffset = offset + LIMIT;
      fetchNotifications(nextOffset, true);
    }
  }, [isLoadingMore, hasNextPage, offset, fetchNotifications]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications(0, false);
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(
    async (userNotificationId, notificationId, isRead) => {
      if (isRead) return;
      try {
        await markNotificationAsRead(userId, notificationId);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === userNotificationId
              ? { ...notif, is_read: true }
              : notif
          )
        );
      } catch (error) {
        console.error("Error marcando como leída:", error);
        Alert.alert("Error", "No se pudo marcar la notificación como leída");
      }
    },
    [userId]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
      Alert.alert("Error", "No se pudieron marcar todas como leídas");
    }
  }, [userId]);

  const handleDeleteNotification = useCallback(
    async (userNotificationId) => {
      try {
        await deleteNotification(userId, userNotificationId);
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== userNotificationId)
        );
      } catch (error) {
        console.error("Error eliminando notificación:", error);
        Alert.alert("Error", "No se pudo eliminar la notificación");
      }
    },
    [userId]
  );

  const getRelativeTime = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });
  }, []);

  const getNotificationIcon = useCallback((typeName) => {
    const iconMap = {
      "Inicio de Sesión Exitoso": "log-in-outline",
      "Actualización de Contraseña": "key-outline",
      "Nueva Reseña": "star-outline",
      "Respuesta a Reseña": "chatbubble-outline",
      default: "notifications-outline",
    };
    return iconMap[typeName] || iconMap.default;
  }, []);

  const renderNotification = useCallback(
    ({ item }) => (
      <SwipeableNotificationItem
        item={item}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteNotification}
        getNotificationIcon={getNotificationIcon}
        getRelativeTime={getRelativeTime}
      />
    ),
    [
      handleMarkAsRead,
      handleDeleteNotification,
      getNotificationIcon,
      getRelativeTime,
    ]
  );

  useEffect(() => {
    if (userId) fetchNotifications(0, false);
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchNotifications(0, false)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={styles.backButton} />
        </View>

        {/* Lista */}
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="notifications-outline"
                size={64}
                color={colors.textSec}
              />
            </View>
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtitle}>
              Te avisaremos cuando haya algo nuevo
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
            />

            {/* FAB flotante */}
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.fabButton}
                onPress={handleMarkAllAsRead}
              >
                <Ionicons name="checkmark-done" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  headerTitle: {
    ...typography.bold.large,
    color: colors.text,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    ...typography.regular.large,
    color: colors.textSec,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    ...typography.bold.large,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
