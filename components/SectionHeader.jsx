import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

export default function SectionHeader({
  title,
  subtitle,
  showSeeAll = false,
  onSeeAllPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showSeeAll && (
        <TouchableOpacity onPress={onSeeAllPress} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>Ver todos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bold.large,
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginTop: 2,
  },
  seeAllText: {
    ...typography.semibold.regular,
    color: colors.primary,
    marginTop: 4,
  },
});
