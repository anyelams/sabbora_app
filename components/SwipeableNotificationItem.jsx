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

const SWIPE_THRESHOLD = 60;
const MAX_TRANSLATE = 120;

const springConfig = {
  damping: 20,
  mass: 0.5,
  stiffness: 180,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

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
      translateX.value = withSpring(0, springConfig);
      return;
    }

    translateX.value = withTiming(-MAX_TRANSLATE, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    opacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    setTimeout(() => {
      onMarkAsRead(item.id, item.notification.id, item.is_read);
      translateX.value = 0;
      opacity.value = 1;
    }, 200);
  };

  const handleDelete = () => {
    itemHeight.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    opacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
    translateX.value = withTiming(MAX_TRANSLATE, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
    setTimeout(() => {
      onDelete(item.id);
    }, 300);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      translateX.value = Math.max(
        Math.min(event.translationX, MAX_TRANSLATE),
        -MAX_TRANSLATE
      );
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const translation = event.translationX;

      if (translation < -SWIPE_THRESHOLD || velocity < -500) {
        runOnJS(handleMarkAsRead)();
      } else if (translation > SWIPE_THRESHOLD || velocity > 500) {
        runOnJS(handleDelete)();
      } else {
        translateX.value = withSpring(0, springConfig);
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
    return {
      opacity: translateX.value < 0 ? 1 : 0,
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    return {
      opacity: translateX.value > 0 ? 1 : 0,
    };
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
  container: {
    position: "relative",
    backgroundColor: colors.white,
  },
  leftAction: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: "#5dc670ff",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 24,
    zIndex: 1,
  },
  rightAction: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: "#ed4c4cff",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 24,
    zIndex: 1,
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
    zIndex: 2,
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
