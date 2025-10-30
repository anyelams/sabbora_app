// app/restaurant/[id].jsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import axiosPrivate from "../../services/axiosPrivate";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = 300;

const TABS = ["Acerca", "Menu", "Galería", "Reseñas"];

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState("Acerca");
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Estados para reseñas
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Estados para menú
  const [menus, setMenus] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuItems, setMenuItems] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    loadRestaurantData();
  }, [id]);

  useEffect(() => {
    if (restaurant) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [restaurant]);

  useEffect(() => {
    if (activeTab === "Reseñas") {
      loadReviews();
    } else if (activeTab === "Menu") {
      loadMenu();
    }
  }, [activeTab]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get(`/restaurant/locations/${id}`);
      const locationData = response.data;
      setRestaurant(locationData);

      // La info del restaurante viene en locationData.restaurant
      if (locationData.restaurant) {
        setRestaurantInfo(locationData.restaurant);
      }
    } catch (error) {
      console.error("Error cargando restaurante:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const [summaryRes, reviewsRes] = await Promise.all([
        axiosPrivate.get(`/review/reviews/location/${id}/summary`),
        axiosPrivate.get(`/review/reviews/location/${id}?limit=10&offset=0`),
      ]);
      setReviewsSummary(summaryRes.data);
      setReviews(reviewsRes.data.data);
    } catch (error) {
      console.error("Error cargando reseñas:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      const menusRes = await axiosPrivate.get(`/menu/menus/${id}/by-location`);
      const menusData = menusRes.data.data;
      setMenus(menusData);

      if (menusData.length > 0) {
        const menuId = menusData[0].id;
        const categoriesRes = await axiosPrivate.get(
          `/menu/menu-categories/${menuId}/by-menu`
        );
        const categoriesData = categoriesRes.data.data.sort(
          (a, b) => a.order - b.order
        );
        setMenuCategories(categoriesData);

        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
          await loadMenuItems(categoriesData[0].id);
        }
      }
    } catch (error) {
      console.error("Error cargando menú:", error);
    } finally {
      setMenuLoading(false);
    }
  };

  const loadMenuItems = async (categoryId) => {
    try {
      const itemsRes = await axiosPrivate.get(
        `/menu/menu-items/${categoryId}/by-category`
      );
      setMenuItems((prev) => ({
        ...prev,
        [categoryId]: itemsRes.data.data,
      }));
    } catch (error) {
      console.error("Error cargando items del menú:", error);
    }
  };

  const handleCategorySelect = async (categoryId) => {
    setSelectedCategory(categoryId);
    if (!menuItems[categoryId]) {
      await loadMenuItems(categoryId);
    }
  };

  const getDescription = () => {
    // Prioridad 1: Descripción del restaurante padre
    if (restaurantInfo?.description) {
      return restaurantInfo.description;
    }

    // Prioridad 2: Descripción por defecto
    return "Disfruta de una experiencia gastronómica única. Ofrecemos los mejores platos preparados con ingredientes frescos y de la más alta calidad.";
  };

  const getTodayDay = () => {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return days[new Date().getDay()];
  };

  const renderAcerca = () => {
    return (
      <View style={styles.tabContent}>
        {/* Descripción */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>Sobre este lugar</Text>
          <Text style={styles.aboutDescription}>{getDescription()}</Text>
        </View>

        {/* Información de contacto y ubicación */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>Información</Text>

          {/* Dirección */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{restaurant?.address}</Text>
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{restaurant?.phone_number}</Text>
            </View>
          </View>
        </View>

        {/* Horarios */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>Horarios</Text>

          <View style={styles.schedulesList}>
            {restaurant?.schedules && restaurant.schedules.length > 0 ? (
              restaurant.schedules.map((schedule, index) => (
                <View key={index} style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>{schedule.day}</Text>
                  <Text style={styles.scheduleHours}>
                    {schedule.open_time} - {schedule.close_time}
                  </Text>
                </View>
              ))
            ) : (
              <>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>Lunes</Text>
                  <Text style={styles.scheduleHours}>10:00 - 22:00</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>Martes</Text>
                  <Text style={styles.scheduleHours}>10:00 - 22:00</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>Miércoles</Text>
                  <Text style={styles.scheduleHours}>10:00 - 22:00</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>Jueves</Text>
                  <Text style={styles.scheduleHours}>10:00 - 22:00</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>Viernes</Text>
                  <Text style={styles.scheduleHours}>10:00 - 22:00</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>Sábado</Text>
                  <Text style={styles.scheduleHours}>10:00 - 20:00</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>Domingo</Text>
                  <Text style={styles.scheduleHours}>12:00 - 20:00</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderMenu = () => (
    <View style={styles.tabContent}>
      {menuLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {menuCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.menuItemsContainer}>
            {menuItems[selectedCategory]?.map((item) => (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.menuItemDescription}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={styles.menuItemPrice}>
                    ${parseFloat(item.price).toLocaleString("es-CO")}
                  </Text>
                </View>
                {item.photos && item.photos.length > 0 && (
                  <Image
                    source={{ uri: item.photos[0].photo_url }}
                    style={styles.menuItemImage}
                  />
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );

  const renderGaleria = () => {
    const validPhotos =
      restaurant?.location_photos?.filter((p) => !p.deleted_at) || [];

    return (
      <View style={styles.tabContent}>
        <Text style={styles.galleryTitle}>{validPhotos.length} fotos</Text>
        <Text style={styles.gallerySubtitle}>
          Explora las fotos de {restaurant?.name}.
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.galleryScrollView}
        >
          <View style={styles.galleryGrid}>
            {validPhotos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                onPress={() => {
                  setPreviewPhotos(validPhotos);
                  setPreviewImageIndex(index);
                  setPreviewVisible(true);
                }}
                style={styles.galleryImageContainer}
              >
                <Animated.Image
                  source={{ uri: photo.photo_url }}
                  style={[styles.galleryImage, { opacity: fadeAnim }]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderReseñas = () => {
    const hasReviews = reviews && reviews.length > 0;
    const avgRating = reviewsSummary?.average_rating || 0;
    const totalReviews = reviews?.length || 0;

    return (
      <View style={styles.tabContent}>
        {reviewsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>Reseñas</Text>
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => router.push(`/review/create?locationId=${id}`)}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.error}
                />
                <Text style={styles.writeReviewText}>Escribir reseña</Text>
              </TouchableOpacity>
            </View>

            {/* Rating Summary - Siempre visible */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingLeft}>
                <Text
                  style={[styles.ratingBig, !hasReviews && styles.ratingEmpty]}
                >
                  {hasReviews ? avgRating.toFixed(1) : "0.0"}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={
                        star <= Math.round(avgRating) ? "star" : "star-outline"
                      }
                      size={16}
                      color={hasReviews ? "#FFC107" : colors.lightGray}
                    />
                  ))}
                </View>
                <Text style={styles.reviewCount}>
                  {hasReviews ? `${totalReviews} reseñas` : "Sin reseñas"}
                </Text>
              </View>

              <View style={styles.ratingBars}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsSummary?.star_counts?.[stars] || 0;
                  const percentage = hasReviews
                    ? (count / totalReviews) * 100
                    : 0;

                  return (
                    <View key={stars} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>{stars} ★</Text>
                      <View style={styles.ratingBar}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            !hasReviews && styles.ratingBarEmpty,
                            { width: `${percentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.ratingBarCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {!hasReviews && (
              <View style={styles.noReviewsContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={48}
                  color={colors.lightGray}
                />
                <Text style={styles.noReviewsTitle}>Aún no hay reseñas</Text>
                <Text style={styles.noReviewsText}>
                  Sé el primero en compartir tu experiencia
                </Text>
              </View>
            )}

            {hasReviews && (
              <>
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={colors.textSec}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    placeholder="Buscar en reseñas"
                    style={styles.searchInput}
                    placeholderTextColor={colors.textSec}
                  />
                </View>

                <View style={styles.filterButtons}>
                  <TouchableOpacity style={styles.filterButtonActive}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.white}
                    />
                    <Text style={styles.filterButtonActiveText}>
                      Más recientes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filterButton}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.filterButtonText}>Más antiguas</Text>
                  </TouchableOpacity>
                </View>

                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {review.user_name
                            ? review.user_name.charAt(0).toUpperCase()
                            : "U"}
                        </Text>
                      </View>
                      <View style={styles.reviewHeaderInfo}>
                        <Text style={styles.reviewUserName}>
                          {review.user_name || "Usuario"}
                        </Text>
                        <View style={styles.reviewRatingRow}>
                          {[1, 2, 3, 4, 5].map((star) => {
                            const diff = review.rating - (star - 1);
                            let iconName = "star-outline";
                            if (diff >= 1) {
                              iconName = "star";
                            } else if (diff >= 0.25) {
                              iconName = "star-half";
                            }
                            return (
                              <Ionicons
                                key={star}
                                name={iconName}
                                size={14}
                                color="#FFC107"
                              />
                            );
                          })}
                          <Text style={styles.reviewRating}>
                            {review.rating.toFixed(1)}
                          </Text>
                          <Text style={styles.reviewDate}>
                            • {new Date(review.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {review.review_text && (
                      <Text style={styles.reviewText}>
                        {review.review_text}
                      </Text>
                    )}

                    {review.photos && review.photos.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={[
                          styles.reviewPhotosScroll,
                          !review.review_text && { marginTop: 0 },
                        ]}
                      >
                        {review.photos.map((photo, photoIndex) => (
                          <TouchableOpacity
                            key={photo.id}
                            onPress={() => {
                              setPreviewPhotos(review.photos);
                              setPreviewImageIndex(photoIndex);
                              setPreviewVisible(true);
                            }}
                          >
                            <Image
                              source={{ uri: photo.photo_url }}
                              style={styles.reviewPhoto}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Restaurante no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const validPhotos =
    restaurant.location_photos?.filter((p) => !p.deleted_at) || [];
  const firstPhoto = validPhotos[0];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con imagen y degradado completo */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setPreviewPhotos(validPhotos);
            setPreviewImageIndex(0);
            setPreviewVisible(true);
          }}
        >
          <View style={styles.imageContainer}>
            {firstPhoto && (
              <Animated.Image
                source={{ uri: firstPhoto.photo_url }}
                style={[styles.headerImage, { opacity: fadeAnim }]}
              />
            )}

            {/* Degradado oscuro que cubre toda la imagen */}
            <View style={styles.gradientOverlay} />

            {/* Botones de navegación */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>

            {/* Badge de cantidad de fotos - al lado de favoritos */}
            {validPhotos.length > 0 && (
              <View style={styles.photoBadge}>
                <Ionicons name="images" size={16} color={colors.white} />
                <Text style={styles.photoBadgeText}>{validPhotos.length}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={colors.white}
              />
            </TouchableOpacity>

            {/* Información sobre la imagen */}
            <View style={styles.headerInfoOverlay}>
              <Text style={styles.headerRestaurantName}>{restaurant.name}</Text>
              <Text style={styles.headerCuisineText}>
                {[
                  ...(restaurant.location_types?.map((t) => t.name) || []),
                  ...(restaurant.ambiences?.map((a) => a.name) || []),
                ].join(" · ") || "Restaurante"}
              </Text>
              <View style={styles.headerRatingBadge}>
                <Ionicons name="star" size={16} color="#FFC107" />
                <Text style={styles.headerRatingText}>
                  {reviewsSummary?.average_rating?.toFixed(1) || "4.2"} (
                  {reviews.length})
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenido del tab activo */}
        {activeTab === "Acerca" && renderAcerca()}
        {activeTab === "Menu" && renderMenu()}
        {activeTab === "Galería" && renderGaleria()}
        {activeTab === "Reseñas" && renderReseñas()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón flotante de reservar */}
      <View style={styles.reserveButtonContainer}>
        <CustomButton
          text="Reservar una mesa"
          onPress={() => router.push(`/reservation/${id}`)}
          variant="primary"
          fullWidth
        />
      </View>

      {/* Modal de previsualización */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setPreviewVisible(false)}
          >
            <Ionicons name="close" size={32} color={colors.white} />
          </TouchableOpacity>

          {previewPhotos.length > 0 && (
            <>
              <Image
                source={{ uri: previewPhotos[previewImageIndex]?.photo_url }}
                style={styles.modalImage}
                resizeMode="contain"
              />

              {previewPhotos.length > 1 && (
                <>
                  <TouchableOpacity
                    style={styles.modalPrevButton}
                    onPress={() =>
                      setPreviewImageIndex((prev) =>
                        prev === 0 ? previewPhotos.length - 1 : prev - 1
                      )
                    }
                  >
                    <Ionicons
                      name="chevron-back"
                      size={32}
                      color={colors.white}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalNextButton}
                    onPress={() =>
                      setPreviewImageIndex((prev) =>
                        prev === previewPhotos.length - 1 ? 0 : prev + 1
                      )
                    }
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={32}
                      color={colors.white}
                    />
                  </TouchableOpacity>

                  <View style={styles.modalCounter}>
                    <Text style={styles.modalCounterText}>
                      {previewImageIndex + 1} / {previewPhotos.length}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  },
  errorText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  prevButton: {
    position: "absolute",
    left: 16,
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  nextButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  photoBadge: {
    position: "absolute",
    top: 16,
    right: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10,
  },
  photoBadgeText: {
    ...typography.semibold.small,
    color: colors.white,
  },
  headerInfoOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  headerRestaurantName: {
    ...typography.bold.big,
    fontSize: 32,
    color: colors.white,
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerCuisineText: {
    ...typography.regular.medium,
    color: colors.white,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "flex-start",
    gap: 6,
  },
  headerRatingText: {
    ...typography.semibold.medium,
    color: colors.white,
    fontSize: 15,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.error,
  },
  tabText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  tabTextActive: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  // Nuevos estilos para el diseño mejorado de "Acerca"
  aboutSection: {
    marginBottom: 24,
  },
  aboutSectionTitle: {
    ...typography.bold.medium,
    color: colors.text,
    marginBottom: 12,
  },
  aboutTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  aboutDescription: {
    ...typography.regular.medium,
    color: colors.textSec,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginBottom: 4,
  },
  infoValue: {
    ...typography.medium.large,
    color: colors.text,
    lineHeight: 22,
  },
  schedulesList: {
    gap: 0,
  },
  // Timeline styles para horarios
  scheduleTimeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderRadius: 8,
  },
  timelineItemToday: {
    backgroundColor: "#FFF3E0",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginRight: 16,
  },
  timelineDotToday: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineDay: {
    ...typography.regular.medium,
    color: colors.text,
    minWidth: 100,
  },
  timelineDayToday: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  timelineHours: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  timelineHoursToday: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  // Estilos antiguos de schedule (mantener por si acaso)
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  scheduleItemToday: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  scheduleDay: {
    ...typography.regular.medium,
    color: colors.text,
  },
  scheduleDayToday: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  scheduleHours: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  scheduleHoursToday: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  // Estilos antiguos (mantener por compatibilidad)
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    ...typography.bold.large,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: "auto",
  },
  statusOpen: {
    backgroundColor: "#E8F5E9",
  },
  statusClosed: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    ...typography.semibold.small,
    color: colors.text,
  },
  description: {
    ...typography.regular.medium,
    color: colors.textSec,
    lineHeight: 22,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressText: {
    ...typography.regular.medium,
    color: colors.text,
    flex: 1,
  },
  phoneText: {
    ...typography.regular.medium,
    color: colors.text,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  scheduleRowToday: {
    backgroundColor: "#FFF3E0",
  },
  dayText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  dayTextToday: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  hourText: {
    ...typography.regular.medium,
    color: colors.text,
  },
  hourTextToday: {
    ...typography.semibold.medium,
    color: colors.primary,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 12,
  },
  categoryChipActive: {
    backgroundColor: "#FFE8EA",
  },
  categoryChipText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  categoryChipTextActive: {
    ...typography.semibold.medium,
    color: colors.error,
  },
  menuItemsContainer: {
    gap: 20,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  menuItemName: {
    ...typography.semibold.large,
    color: colors.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginBottom: 8,
  },
  menuItemPrice: {
    ...typography.bold.medium,
    color: colors.text,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  galleryTitle: {
    ...typography.bold.large,
    color: colors.text,
    marginBottom: 4,
  },
  gallerySubtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginBottom: 20,
  },
  galleryScrollView: {
    maxHeight: 600,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  galleryImageContainer: {
    width: (width - 56) / 2,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  reviewsTitle: {
    ...typography.bold.large,
    color: colors.text,
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  writeReviewText: {
    ...typography.semibold.medium,
    color: colors.error,
  },
  ratingSection: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  ratingLeft: {
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBig: {
    ...typography.bold.big,
    fontSize: 48,
    color: colors.text,
  },
  ratingEmpty: {
    color: colors.lightGray,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginVertical: 8,
  },
  reviewCount: {
    ...typography.regular.regular,
    color: colors.textSec,
  },
  ratingBars: {
    flex: 1,
    gap: 8,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingBarLabel: {
    ...typography.regular.small,
    color: colors.textSec,
    width: 30,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#FFC107",
  },
  ratingBarEmpty: {
    backgroundColor: colors.lightGray,
  },
  ratingBarCount: {
    ...typography.regular.regular,
    color: colors.textSec,
    width: 20,
    textAlign: "right",
  },
  noReviewsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noReviewsTitle: {
    ...typography.bold.large,
    color: colors.textSec,
    marginTop: 16,
    marginBottom: 8,
  },
  noReviewsText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.regular.medium,
    color: colors.text,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterButtonActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    ...typography.regular.small,
    color: colors.primary,
  },
  filterButtonActiveText: {
    ...typography.regular.small,
    color: colors.white,
  },
  reviewCard: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  reviewHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarText: {
    ...typography.bold.medium,
    color: colors.textSec,
  },
  reviewHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewUserName: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewRating: {
    ...typography.semibold.regular,
    color: colors.text,
    marginLeft: 4,
  },
  reviewDate: {
    ...typography.regular.regular,
    color: colors.textSec,
  },
  reviewText: {
    ...typography.regular.medium,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewPhotosScroll: {
    marginTop: 12,
  },
  reviewPhoto: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 8,
  },
  reserveButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width,
    height: "80%",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalPrevButton: {
    position: "absolute",
    left: 20,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 10,
    padding: 8,
  },
  modalNextButton: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 10,
    padding: 8,
  },
  modalCounter: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalCounterText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
});
