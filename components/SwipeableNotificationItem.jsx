// components/SwipeableNotificationItem.jsx
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

// 🔧 Ajustes finos: umbral más bajo y animación física más natural
const SWIPE_THRESHOLD = 45;
const MAX_TRANSLATE = 100;

export default function SwipeableNotificationItem({
  item,
  onMarkAsRead,
  onDelete,
  getRelativeTime,
}) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isUnread = !item.is_read;

  const handleMarkAsRead = () => {
    if (!isUnread) {
      translateX.value = withSpring(0);
      return;
    }

    translateX.value = withTiming(-180, {
      duration: 180,
      easing: Easing.out(Easing.exp),
    });
    opacity.value = withTiming(0, { duration: 180 });
    setTimeout(() => {
      onMarkAsRead(item.id, item.notification.id, item.is_read);
      translateX.value = 0;
      opacity.value = 1;
    }, 180);
  };

  const handleDelete = () => {
    itemHeight.value = withTiming(0, {
      duration: 260,
      easing: Easing.out(Easing.exp),
    });
    opacity.value = withTiming(0, { duration: 180 });
    translateX.value = withTiming(180, { duration: 180 });
    setTimeout(() => {
      onDelete(item.id);
    }, 260);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
        if (event.translationX < 0) {
          translateX.value = Math.max(event.translationX, -MAX_TRANSLATE);
        } else {
          translateX.value = Math.min(event.translationX, MAX_TRANSLATE);
        }
      }
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleMarkAsRead)();
      } else if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleDelete)();
      } else {
        // rebote más fluido
        translateX.value = withSpring(0, {
          damping: 12,
          mass: 0.8,
          stiffness: 150,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value === 1 ? "auto" : itemHeight.value,
    overflow: "hidden",
  }));

  const leftActionStyle = useAnimatedStyle(() => {
    const progress = Math.min(-translateX.value / SWIPE_THRESHOLD, 1);
    return { opacity: progress, transform: [{ scale: progress }] };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const progress = Math.min(translateX.value / SWIPE_THRESHOLD, 1);
    return { opacity: progress, transform: [{ scale: progress }] };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Acción izquierda: Marcar como leída */}
      <Animated.View style={[styles.leftAction, leftActionStyle]}>
        <View style={styles.actionContent}>
          <Ionicons name="checkmark-circle" size={26} color={colors.white} />
          <Text style={styles.actionText}>
            {isUnread ? "Leída" : "Ya leída"}
          </Text>
        </View>
      </Animated.View>

      {/* Acción derecha: Eliminar */}
      <Animated.View style={[styles.rightAction, rightActionStyle]}>
        <View style={styles.actionContent}>
          <Ionicons name="trash" size={26} color={colors.white} />
          <Text style={styles.actionText}>Eliminar</Text>
        </View>
      </Animated.View>

      {/* Contenido */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.notificationItem,
            isUnread && styles.unreadItem,
            animatedStyle,
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              isUnread && styles.iconContainerUnread,
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color={colors.gray}
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.notification.title}
              </Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.body} numberOfLines={2}>
              {item.notification.body}
            </Text>

            <Text style={styles.time}>{getRelativeTime(item.created_at)}</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  leftAction: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 24,
  },
  rightAction: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 24,
  },
  actionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    ...typography.semibold.small,
    color: colors.white,
    marginTop: 4,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  unreadItem: { backgroundColor: "#F4F4F5" },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconContainerUnread: { backgroundColor: "#E5E5E5" },
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  title: { ...typography.semibold.medium, color: colors.text, flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.8,
    marginLeft: 8,
  },
  body: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginBottom: 4,
  },
  time: { ...typography.regular.small, color: colors.gray },
});
