// app/restaurant/booking/menu.jsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../components/CustomButton";
import { colors } from "../../../config/theme";
import { typography } from "../../../config/typography";
import axiosPrivate from "../../../services/axiosPrivate";

export default function MenuPreorderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { reservationId, fromConfirmation } = params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Map());
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    loadReservationData();
  }, [reservationId]);

  useEffect(() => {
    if (selectedCategory) {
      loadMenuItems(selectedCategory);
    }
  }, [selectedCategory]);

  const loadReservationData = async () => {
    try {
      setLoading(true);

      // Obtener datos de la reserva
      const reservationRes = await axiosPrivate.get(
        `/reservation/reservations/${reservationId}`
      );
      const reservationData = reservationRes.data;
      setReservation(reservationData);

      // Obtener el menú del restaurante
      const locationId = reservationData.table?.location_id;
      if (!locationId) {
        throw new Error("No se encontró el restaurante asociado a la reserva");
      }

      // Obtener los menús del restaurante
      const menusRes = await axiosPrivate.get(
        `/menu/menus/${locationId}/by-location`
      );
      const menus = menusRes.data.data || [];

      if (menus.length === 0) {
        throw new Error("Este restaurante no tiene menú disponible");
      }

      const menuId = menus[0].id;

      // Obtener categorías del menú
      const categoriesRes = await axiosPrivate.get(
        `/menu/menu-categories/${menuId}/by-menu`
      );
      const categories = categoriesRes.data.data || [];
      setMenuCategories(categories);

      if (categories.length > 0) {
        setSelectedCategory(categories[0].id);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert(
        "Error",
        "No se pudo cargar la información del menú. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async (categoryId) => {
    try {
      setLoadingItems(true);
      const response = await axiosPrivate.get(
        `/menu/menu-items/${categoryId}/by-category`
      );
      setMenuItems(response.data.data || []);
    } catch (error) {
      console.error("Error cargando items del menú:", error);
      setMenuItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleItemQuantityChange = (item, change) => {
    const newSelected = new Map(selectedItems);
    const currentQuantity = newSelected.get(item.id) || 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity === 0) {
      newSelected.delete(item.id);
    } else {
      newSelected.set(item.id, newQuantity);
    }

    setSelectedItems(newSelected);
  };

  const getTotalItems = () => {
    let total = 0;
    selectedItems.forEach((quantity) => {
      total += quantity;
    });
    return total;
  };

  const handleSubmitOrder = async () => {
    if (selectedItems.size === 0) {
      Alert.alert(
        "Carrito vacío",
        "Selecciona al menos un item del menú para continuar"
      );
      return;
    }

    try {
      setSubmitting(true);

      console.log("=== INICIANDO PREORDEN ===");
      console.log("Reservation ID:", reservationId);
      console.log("Items seleccionados:", Array.from(selectedItems.entries()));

      // Crear un array de promesas para enviar cada item
      const promises = Array.from(selectedItems.entries()).map(
        async ([itemId, quantity]) => {
          const payload = {
            reservation_id: parseInt(reservationId, 10),
            menu_item_id: parseInt(itemId, 10),
            quantity: parseInt(quantity, 10),
          };

          console.log("📤 Enviando item:", JSON.stringify(payload));

          try {
            const response = await axiosPrivate.post(
              "/reservation/reservation_menu_items/",
              payload
            );
            console.log("✅ Item enviado exitosamente:", response.data);
            return response;
          } catch (err) {
            console.error("❌ Error enviando item:", JSON.stringify(payload));
            console.error("❌ Error response:", err.response?.data);
            console.error("❌ Error status:", err.response?.status);
            console.error("❌ Error message:", err.message);
            throw err;
          }
        }
      );

      // Enviar todos los items en paralelo
      const results = await Promise.allSettled(promises);

      // Verificar si alguno falló
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.error("❌ Items fallidos:", failed.length);
        failed.forEach((f, i) => {
          console.error(`Item ${i + 1} error:`, f.reason?.response?.data);
        });
        throw new Error("Algunos items no pudieron ser agregados");
      }

      console.log("✅ Todos los items enviados exitosamente");

      Alert.alert(
        "¡Preorden confirmada!",
        "Tus platos han sido preordenados exitosamente",
        [
          {
            text: "OK",
            onPress: () => {
              if (fromConfirmation === "true") {
                router.replace("/(tabs)/welcome");
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error general guardando preorden:", error.message);
      Alert.alert(
        "Error",
        "No se pudo completar la preorden. Revisa la consola para más detalles."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (fromConfirmation === "true") {
      router.replace("/(tabs)/welcome");
    } else {
      router.back();
    }
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toLocaleString("es-CO")}`;
  };

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive,
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderMenuItem = ({ item }) => {
    const quantity = selectedItems.get(item.id) || 0;
    const primaryPhoto = item.photos?.find(
      (photo) => photo.is_primary
    )?.photo_url;

    return (
      <View style={styles.menuItemCard}>
        <View style={styles.menuItemContent}>
          {primaryPhoto && (
            <Image
              source={{ uri: primaryPhoto }}
              style={styles.menuItemImage}
            />
          )}
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.menuItemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
          </View>
        </View>

        <View style={styles.quantityControls}>
          {quantity === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleItemQuantityChange(item, 1)}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleItemQuantityChange(item, -1)}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleItemQuantityChange(item, 1)}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando menú...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleSkip}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Preordenar Menú</Text>
          <Text style={styles.headerSubtitle}>
            {reservation?.location?.name || "Restaurante"}
          </Text>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      {/* Categorías */}
      {menuCategories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={menuCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Items del menú */}
      <View style={styles.menuItemsContainer}>
        {loadingItems ? (
          <View style={styles.loadingItemsContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingItemsText}>Cargando items...</Text>
          </View>
        ) : menuItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyText}>
              No hay items disponibles en esta categoría
            </Text>
          </View>
        ) : (
          <FlatList
            data={menuItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.menuItemsList}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>

      {/* Footer con botón de confirmar */}
      <View style={styles.footer}>
        {getTotalItems() > 0 && (
          <View style={styles.cartSummary}>
            <Ionicons name="cart" size={20} color={colors.primary} />
            <Text style={styles.cartText}>
              {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}{" "}
              seleccionados
            </Text>
          </View>
        )}
        <CustomButton
          text={submitting ? "Guardando..." : "Confirmar Preorden"}
          onPress={handleSubmitOrder}
          disabled={selectedItems.size === 0 || submitting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
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
    ...typography.bold.medium,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.regular.small,
    color: colors.textSec,
    marginTop: 2,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipButtonText: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.base,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...typography.medium.regular,
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.white,
  },
  menuItemsContainer: {
    flex: 1,
  },
  loadingItemsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingItemsText: {
    ...typography.regular.small,
    color: colors.textSec,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    marginTop: 16,
  },
  menuItemsList: {
    padding: 16,
  },
  menuItemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    overflow: "hidden",
  },
  menuItemContent: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  menuItemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  menuItemName: {
    ...typography.semibold.medium,
    color: colors.darkGray,
  },
  menuItemDescription: {
    ...typography.regular.small,
    color: colors.textSec,
    marginTop: 4,
  },
  menuItemPrice: {
    ...typography.bold.medium,
    color: colors.primary,
    marginTop: 4,
  },
  quantityControls: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    ...typography.semibold.small,
    color: colors.white,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.base,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    ...typography.bold.medium,
    color: colors.darkGray,
    minWidth: 40,
    textAlign: "center",
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cartSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  cartText: {
    ...typography.semibold.small,
    color: colors.primary,
  },
});
