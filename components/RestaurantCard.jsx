// components/RestaurantCard.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

export default function RestaurantCard({
  restaurant,
  onPress,
  onFavoritePress,
  variant = "nearby",
  isFavorite = false,
}) {
  const router = useRouter();

  const validPhotos =
    restaurant.location_photos?.filter((p) => !p.deleted_at) || [];
  const imageUrl =
    validPhotos.length > 0
      ? validPhotos[0].photo_url
      : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

  const rating = restaurant.rating || 0;
  const totalReviews = restaurant.totalReviews || 0;

  const getFullAddress = () => {
    const parts = [];
    if (restaurant.address) parts.push(restaurant.address);
    if (restaurant.city_name) parts.push(restaurant.city_name);
    return parts.join(", ") || "Sin dirección";
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/restaurant/${restaurant.id}`);
    }
  };

  const handleFavoritePress = (e) => {
    e.stopPropagation();
    if (onFavoritePress) {
      onFavoritePress();
    }
  };

  // Solo mostrar los location_types
  const getTypeText = () => {
    const types = restaurant.location_types?.map((t) => t.name) || [];
    return types.length > 0 ? types.join(" • ") : "Restaurante";
  };

  if (variant === "list") {
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.listCardImage}
          resizeMode="cover"
        />
        <View style={styles.listCardInfo}>
          <Text style={styles.listCardName} numberOfLines={1}>
            {restaurant.name}
          </Text>

          {/* Rating y reviews */}
          <View style={styles.cardMeta}>
            <Ionicons name="star" size={12} color={colors.primary} />
            <Text style={styles.ratingText}>
              {rating > 0 ? rating.toFixed(1) : "Nuevo"}
            </Text>
            {totalReviews > 0 && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.reviewsText}>({totalReviews})</Text>
              </>
            )}
          </View>

          {/* Tipos de comida en línea separada, con estilo de lista */}
          <Text style={styles.listCategoryText} numberOfLines={1}>
            {getTypeText()}
          </Text>

          <Text style={styles.addressText} numberOfLines={1}>
            {getFullAddress()}
          </Text>
        </View>

        <View style={styles.listCardRight}>
          {restaurant.distanceFormatted && (
            <View style={styles.distanceLabel}>
              <Ionicons
                name="location-sharp"
                size={12}
                color={colors.textSec}
              />
              <Text style={styles.distanceLabelText}>
                {restaurant.distanceFormatted}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.favoriteButtonSmall}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? colors.primary : colors.textSec}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {restaurant.distanceFormatted && (
        <View style={styles.distanceBadge}>
          <Ionicons name="location-sharp" size={10} color={colors.white} />
          <Text style={styles.distanceBadgeText}>
            {restaurant.distanceFormatted}
          </Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text style={styles.ratingText}>
            {rating > 0 ? rating.toFixed(1) : "Nuevo"}
          </Text>
          {totalReviews > 0 && (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.reviewsText}>({totalReviews})</Text>
            </>
          )}
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.categoryText}>{getTypeText()}</Text>
        </View>
        <Text style={styles.addressText} numberOfLines={1}>
          {getFullAddress()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={handleFavoritePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={20}
          color={isFavorite ? colors.primary : colors.textSec}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: colors.lightGray,
  },
  distanceBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  distanceBadgeText: {
    ...typography.semibold.small,
    color: colors.white,
    fontSize: 11,
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    ...typography.bold.medium,
    color: colors.text,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 4,
  },
  ratingText: {
    ...typography.semibold.small,
    color: colors.text,
  },
  reviewsText: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  metaDot: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  categoryText: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  addressText: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: colors.white,
  },
  listCardImage: {
    width: 108,
    height: 85,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  listCardInfo: {
    flex: 1,
  },
  listCardName: {
    ...typography.bold.regular,
    color: colors.text,
    marginBottom: 4,
  },
  listCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  listCategoryText: {
    ...typography.regular.small,
    color: colors.textSec,
    marginBottom: 3,
  },
  distanceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceLabelText: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  favoriteButtonSmall: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
