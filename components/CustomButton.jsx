// components/CustomButton.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

const CustomButton = ({
  text,
  onPress,
  route,
  variant = "primary", // primary, secondary, outline
  icon,
  iconPosition = "right", // left, right
  disabled = false,
  width = "90%", // puede ser porcentaje o número
  fullWidth = false,
  style,
  textStyle,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (disabled) return;

    if (onPress) {
      onPress();
    } else if (route) {
      router.push(route);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      {
        width: fullWidth ? "100%" : width,
      },
    ];

    switch (variant) {
      case "primary":
        return [...baseStyle, styles.primaryButton];
      case "secondary":
        return [...baseStyle, styles.secondaryButton];
      case "outline":
        return [...baseStyle, styles.outlineButton];
      default:
        return [...baseStyle, styles.primaryButton];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];

    switch (variant) {
      case "primary":
        return [...baseStyle, styles.primaryText];
      case "secondary":
        return [...baseStyle, styles.secondaryText];
      case "outline":
        return [...baseStyle, styles.outlineText];
      default:
        return [...baseStyle, styles.primaryText];
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "primary":
        return colors.white;
      case "secondary":
      case "outline":
        return colors.text;
      default:
        return colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), disabled && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && iconPosition === "left" && (
        <Ionicons
          name={icon}
          size={18}
          color={getIconColor()}
          style={styles.iconLeft}
        />
      )}

      <Text style={[...getTextStyle(), textStyle]}>{text}</Text>

      {icon && iconPosition === "right" && (
        <Ionicons
          name={icon}
          size={18}
          color={getIconColor()}
          style={styles.iconRight}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  // Variantes de botón
  primaryButton: {
    backgroundColor: colors.secondary,
  },
  secondaryButton: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.secondary,
  },

  // Estilos de texto
  buttonText: {
    ...typography.semibold.medium,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.secondary,
  },

  // Estados
  disabled: {
    opacity: 0.5,
  },

  // Iconos
  iconLeft: {
    marginRight: -5,
  },
  iconRight: {
    marginLeft: -5,
  },
});

export default CustomButton;
