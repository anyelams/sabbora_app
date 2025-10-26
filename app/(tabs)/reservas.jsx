import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

// Datos de ejemplo para reservas
const mockReservas = [];

const Reservas = () => {
  const renderReservaItem = ({ item }) => (
    <TouchableOpacity style={styles.reservaCard}>
      <Text style={styles.establecimiento}>{item.establecimiento}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="bookmark-outline"
        size={80}
        color={colors.gray}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Todavía no has reservado</Text>
      <Text style={styles.emptySubtitle}>
        Explora nuestros restaurantes y agenda tu primera reserva.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={[typography.semibold.big, styles.title]}>Reservas</Text>
      </View>

      <FlatList
        data={mockReservas}
        renderItem={renderReservaItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          mockReservas.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.base,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    color: colors.darkGray,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  reservaCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  establecimiento: {
    ...typography.semibold.medium,
    color: colors.darkGray,
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
    ...typography.regular.big,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 24,
  },
});

export default Reservas;
