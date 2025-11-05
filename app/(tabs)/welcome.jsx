import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LocationSearchModal from "../../components/LocationDropdownModal";
import RestaurantCard from "../../components/RestaurantCard";
import SectionHeader from "../../components/SectionHeader";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import { usePermissions } from "../../hooks/usePermissions";
import { getFirstNameAndLastName } from "../../services/auth";
import axiosPrivate from "../../services/axiosPrivate";
import {
  getAllUserFavoritesWithIds,
  getLocationRatingSummary,
  getUserFavorites,
  toggleFavorite,
} from "../../services/favoriteService";
import { calculateDistance, formatDistance } from "../../utils/distanceUtils";

export default function WelcomeScreen() {
  const router = useRouter();
  const {
    userLocation,
    saveManualLocation,
    hasLocationPermission,
    getCurrentLocation,
  } = usePermissions();
  const { username, userId } = useSession();
  const { firstName, firstLastName } = getFirstNameAndLastName(username);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [locationTypes, setLocationTypes] = useState([]);
  const [ambiences, setAmbiences] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteIdsMap, setFavoriteIdsMap] = useState(new Map());
  const [error, setError] = useState(null);
  const [selectedAmbienceId, setSelectedAmbienceId] = useState(null);
  const [selectedLocationTypeId, setSelectedLocationTypeId] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  // Función para manejar clic en ubicación
  const handleLocationPress = () => {
    setShowLocationModal(true);
  };

  // Handler para usar GPS
  const handleUseGPS = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        console.log("✅ Ubicación GPS actualizada:", location.city);
        setShowLocationModal(false);
      } else {
        console.log("❌ No se pudo obtener ubicación GPS");
      }
    } catch (error) {
      console.error("Error obteniendo GPS:", error);
    }
  };

  const fetchFavoriteRestaurants = useCallback(async () => {
    if (!userId) return;
    try {
      const [favoritesResponse, favoritesData] = await Promise.all([
        getAllUserFavoritesWithIds(userId, 100, 0),
        getUserFavorites(userId, 10, 0),
      ]);

      const newFavoriteIdsMap = new Map();
      const newFavoriteIds = new Set();

      favoritesResponse.data.forEach((fav) => {
        newFavoriteIdsMap.set(fav.location_id, fav.id);
        newFavoriteIds.add(fav.location_id);
      });

      setFavoriteIdsMap(newFavoriteIdsMap);
      setFavoriteIds(newFavoriteIds);

      let enrichedFavorites = favoritesData;
      if (userLocation?.latitude && userLocation?.longitude) {
        enrichedFavorites = favoritesData.map((favorite) => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            favorite.latitude,
            favorite.longitude
          );
          return {
            ...favorite,
            distance,
            distanceFormatted: formatDistance(distance),
          };
        });
      }

      const ratingSummaries = await Promise.all(
        enrichedFavorites.map((favorite) =>
          getLocationRatingSummary(favorite.id)
        )
      );

      const favoritesWithRatings = enrichedFavorites.map((favorite, index) => ({
        ...favorite,
        rating: ratingSummaries[index]?.average_rating || 0,
        totalReviews: ratingSummaries[index]?.total_reviews_count || 0,
      }));

      setFavoriteRestaurants(favoritesWithRatings);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    }
  }, [userId, userLocation?.latitude, userLocation?.longitude]);

  const fetchData = useCallback(
    async (ambienceFilter = null, locationTypeFilter = null) => {
      try {
        setIsLoading(true);
        setError(null);

        let restaurantsUrl = "/restaurants/locations/?limit=50&offset=0";
        if (userLocation?.cityId) {
          restaurantsUrl += `&city_api_id=${userLocation.cityId}`;
        }
        if (ambienceFilter) {
          restaurantsUrl += `&ambience_id=${ambienceFilter}`;
        }
        if (locationTypeFilter) {
          restaurantsUrl += `&location_type_id=${locationTypeFilter}`;
        }

        const [restaurantsRes, typesRes, ambiencesRes] = await Promise.all([
          axiosPrivate.get(restaurantsUrl),
          axiosPrivate.get("/restaurants/location_types/?limit=10&offset=0"),
          axiosPrivate.get(
            "/restaurants/location_ambiences/?limit=10&offset=0"
          ),
        ]);

        let restaurantsData = restaurantsRes.data.data || [];

        if (userLocation?.latitude && userLocation?.longitude) {
          restaurantsData = restaurantsData
            .map((restaurant) => {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                restaurant.latitude,
                restaurant.longitude
              );
              return {
                ...restaurant,
                distance,
                distanceFormatted: formatDistance(distance),
              };
            })
            .sort((a, b) => a.distance - b.distance);
        }

        const ratingSummaries = await Promise.all(
          restaurantsData.map((restaurant) =>
            getLocationRatingSummary(restaurant.id)
          )
        );

        const restaurantsWithRatings = restaurantsData.map(
          (restaurant, index) => ({
            ...restaurant,
            rating: ratingSummaries[index]?.average_rating || 0,
            totalReviews: ratingSummaries[index]?.total_reviews_count || 0,
          })
        );

        setRestaurants(restaurantsWithRatings);
        setFilteredRestaurants(restaurantsWithRatings);
        setLocationTypes(typesRes.data.data || []);
        setAmbiences(ambiencesRes.data.data || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar los datos. Por favor intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    },
    [userLocation?.cityId, userLocation?.latitude, userLocation?.longitude]
  );

  const getNearbyRestaurants = useMemo(() => {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      return filteredRestaurants.slice(0, 5);
    }

    const MAX_DISTANCE_KM = 15;
    const nearbyRestaurants = filteredRestaurants.filter(
      (restaurant) =>
        restaurant.distance && restaurant.distance <= MAX_DISTANCE_KM
    );

    return nearbyRestaurants.slice(0, 5);
  }, [filteredRestaurants, userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRestaurants(restaurants);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = restaurants.filter((restaurant) => {
      const matchesName = restaurant.name?.toLowerCase().includes(query);
      const matchesAddress = restaurant.address?.toLowerCase().includes(query);
      const matchesCity = restaurant.city_name?.toLowerCase().includes(query);
      const matchesType = restaurant.location_types?.some((type) =>
        type.name?.toLowerCase().includes(query)
      );

      return matchesName || matchesAddress || matchesCity || matchesType;
    });

    setFilteredRestaurants(filtered);
  }, [searchQuery, restaurants]);

  useEffect(() => {
    fetchData(selectedAmbienceId, selectedLocationTypeId);
  }, [fetchData, selectedAmbienceId, selectedLocationTypeId]);

  useEffect(() => {
    if (userId) {
      fetchFavoriteRestaurants();
    }
  }, [fetchFavoriteRestaurants, userId]);

  useEffect(() => {
    if (!isLoading && !userLocation) {
      setShowLocationModal(true);
    }
  }, [isLoading, userLocation]);

  const handleLocationSelect = async (locationData) => {
    try {
      await saveManualLocation(locationData);
      setShowLocationModal(false);
    } catch (error) {
      console.error("Error guardando ubicación:", error);
    }
  };

  const handleRestaurantPress = useCallback(
    (restaurant) => {
      router.push({
        pathname: `/restaurant/${restaurant.id}`,
        params: { restaurant: JSON.stringify(restaurant) },
      });
    },
    [router]
  );

  const handleFavoritePress = useCallback(
    async (restaurantId) => {
      if (!userId) {
        console.log("Usuario no autenticado");
        return;
      }

      try {
        const result = await toggleFavorite(
          userId,
          restaurantId,
          favoriteIdsMap
        );

        setFavoriteIdsMap((prev) => {
          const newMap = new Map(prev);
          if (result.action === "added") {
            newMap.set(restaurantId, result.favoriteId);
          } else {
            newMap.delete(restaurantId);
          }
          return newMap;
        });

        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          if (result.action === "added") {
            newSet.add(restaurantId);
          } else {
            newSet.delete(restaurantId);
          }
          return newSet;
        });

        if (result.action === "added") {
          fetchFavoriteRestaurants();
        } else {
          setFavoriteRestaurants((prev) =>
            prev.filter((restaurant) => restaurant.id !== restaurantId)
          );
        }
      } catch (error) {
        console.error("Error al gestionar favorito:", error);
      }
    },
    [userId, favoriteIdsMap, fetchFavoriteRestaurants]
  );

  const handleCategoryPress = useCallback((category) => {
    setSelectedLocationTypeId((prevId) =>
      prevId === category.id ? null : category.id
    );
  }, []);

  const renderCategoryCard = useCallback(
    ({ item }) => {
      const getCategoryConfig = (name) => {
        const configs = {
          Gastropub: "🍺",
          Italiana: "🍝",
          Trattoria: "🍷",
          Estadounidense: "🍔",
          BBQ: "🥩",
          Europea: "🧀",
          Japonesa: "🍱",
          Sushi: "🍣",
          Mexicana: "🌮",
          Latina: "🌶️",
          Caribeña: "🥥",
          Mariscos: "🦞",
          Peruana: "🥘",
          Pizzería: "🍕",
          Bar: "🍸",
        };
        return configs[name] || "🍽️";
      };

      const isSelected = selectedLocationTypeId === item.id;

      return (
        <TouchableOpacity
          style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryCardContent}>
            <View style={styles.categoryEmojiContainer}>
              <Text style={styles.categoryEmoji}>
                {getCategoryConfig(item.name)}
              </Text>
            </View>
            <Text
              style={[
                styles.categoryCardName,
                isSelected && styles.categoryCardNameActive,
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleCategoryPress, selectedLocationTypeId]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando restaurantes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              fetchData(selectedAmbienceId, selectedLocationTypeId)
            }
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <LocationSearchModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        onUseGPS={handleUseGPS}
        hasLocationPermission={hasLocationPermission}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {username ? username.substring(0, 2).toUpperCase() : "AS"}
            </Text>
          </View>

          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Ubicación</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-sharp" size={16} color={colors.text} />
              <Text style={styles.locationValue} numberOfLines={1}>
                {userLocation?.city
                  ? `${userLocation.city}, ${
                      userLocation.country || "Colombia"
                    }`
                  : "Bogota, Colombia"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            {getGreeting()},{" "}
            <Text style={styles.greetingName}>{firstName}</Text>
          </Text>
          <Text style={styles.greetingSubtext}>
            Encuentra tu próximo lugar favorito
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar restaurantes, comida..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {!searchQuery.trim() && ambiences.length > 0 && (
          <View style={styles.ambiencesContainer}>
            <FlatList
              data={ambiences}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ambiencesList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ambienceChip,
                    selectedAmbienceId === item.id && styles.ambienceChipActive,
                  ]}
                  onPress={() =>
                    setSelectedAmbienceId(
                      selectedAmbienceId === item.id ? null : item.id
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ambienceChipText,
                      selectedAmbienceId === item.id &&
                        styles.ambienceChipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {searchQuery.trim() && (
          <View style={styles.section}>
            {filteredRestaurants.length > 0 ? (
              <>
                <SectionHeader
                  title={`${filteredRestaurants.length} resultado${
                    filteredRestaurants.length !== 1 ? "s" : ""
                  }`}
                />
                {filteredRestaurants.map((item) => (
                  <RestaurantCard
                    key={item.id}
                    restaurant={item}
                    onPress={() => handleRestaurantPress(item)}
                    onFavoritePress={() => handleFavoritePress(item.id)}
                    variant="list"
                    isFavorite={favoriteIds.has(item.id)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptySearchContainer}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={colors.textSec}
                />
                <Text style={styles.emptySearchText}>
                  No encontramos resultados
                </Text>
                <Text style={styles.emptySearchSubtext}>
                  Intenta con otros términos de búsqueda
                </Text>
              </View>
            )}
          </View>
        )}

        {!searchQuery.trim() && getNearbyRestaurants.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Cerca de ti"
              showSeeAll
              onSeeAllPress={() => console.log("Ver todos cerca")}
            />
            <FlatList
              data={getNearbyRestaurants}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  onPress={() => handleRestaurantPress(item)}
                  onFavoritePress={() => handleFavoritePress(item.id)}
                  variant="card"
                  isFavorite={favoriteIds.has(item.id)}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {!searchQuery.trim() &&
          (favoriteRestaurants.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Tus favoritos"
                showSeeAll
                onSeeAllPress={() => console.log("Ver todos favoritos")}
              />
              <FlatList
                data={favoriteRestaurants.slice(0, 5)}
                renderItem={({ item }) => (
                  <RestaurantCard
                    restaurant={item}
                    onPress={() => handleRestaurantPress(item)}
                    onFavoritePress={() => handleFavoritePress(item.id)}
                    variant="card"
                    isFavorite={true}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <SectionHeader title="Tus favoritos" />
              <View style={styles.emptyFavoritesContainer}>
                <View style={styles.emptyFavoritesIcon}>
                  <Ionicons
                    name="heart-outline"
                    size={24}
                    color={colors.textSec}
                  />
                </View>
                <Text style={styles.emptyFavoritesTitle}>
                  ¡Aún no tienes favoritos!
                </Text>
                <Text style={styles.emptyFavoritesSubtitle}>
                  Explora y guarda tus lugares preferidos
                </Text>
              </View>
            </View>
          ))}

        {!searchQuery.trim() && filteredRestaurants.length > 5 && (
          <View style={styles.section}>
            <SectionHeader
              title="Descubre más"
              showSeeAll
              onSeeAllPress={() => console.log("Ver todos")}
            />
            {filteredRestaurants.slice(5, 10).map((item) => (
              <RestaurantCard
                key={item.id}
                restaurant={item}
                onPress={() => handleRestaurantPress(item)}
                onFavoritePress={() => handleFavoritePress(item.id)}
                variant="list"
                isFavorite={favoriteIds.has(item.id)}
              />
            ))}
          </View>
        )}

        {!searchQuery.trim() && locationTypes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Explora por tipo de cocina"
              showSeeAll
              onSeeAllPress={() => console.log("Ver tipos de cocina")}
            />
            <View style={styles.categoriesWrapper}>
              <FlatList
                data={locationTypes}
                renderItem={renderCategoryCard}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 8,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: colors.white,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    ...typography.medium.regular,
    color: colors.gray,
  },
  locationContainer: {
    flex: 1,
    alignItems: "center",
  },
  locationLabel: {
    ...typography.regular.small,
    color: colors.textSec,
    marginBottom: 2,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationValue: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  notificationButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  greetingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  greetingText: {
    ...typography.regular,
    fontSize: 26,
    color: colors.text,
  },
  greetingName: {
    ...typography.bold.big,
    fontSize: 26,
    color: colors.text,
    marginBottom: 4,
  },
  greetingSubtext: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 24,
    marginBottom: 24,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...typography.regular.medium,
    color: colors.text,
  },
  section: {
    marginBottom: 28,
  },
  categoriesWrapper: {
    paddingVertical: 2,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 6,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 6,
  },
  ambiencesContainer: {
    marginBottom: 24,
  },
  ambiencesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  ambienceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
  },
  ambienceChipActive: {
    backgroundColor: colors.primary,
  },
  ambienceChipText: {
    ...typography.medium.regular,
    color: colors.text,
  },
  ambienceChipTextActive: {
    color: colors.white,
  },
  categoryCard: {
    width: 90,
    height: 80,
    marginRight: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    shadowColor: "#bcbcbcff",
    elevation: 1,
    borderWidth: 0.2,
    borderColor: colors.lightGray,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryCardContent: {
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  categoryEmojiContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryCardName: {
    ...typography.medium.small,
    color: colors.text,
    textAlign: "center",
    fontSize: 11,
  },
  categoryCardNameActive: {
    color: colors.white,
  },
  emptyFavoritesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  emptyFavoritesIcon: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyFavoritesTitle: {
    ...typography.bold.large,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyFavoritesSubtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
  },
  emptySearchContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptySearchText: {
    ...typography.bold.large,
    color: colors.text,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchSubtext: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
  },
});
