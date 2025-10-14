// components/CustomInput.jsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  secureTextEntry = false,
  editable = true,
  error,
  showPasswordToggle = false,
  style,
  inputStyle,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.error : colors.textSec}
          />
        )}

        <TextInput
          placeholder={placeholder}
          style={[styles.input, inputStyle]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholderTextColor={colors.textSec}
        />

        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity onPress={handleTogglePassword} disabled={!editable}>
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textSec}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    ...typography.semibold.regular,
    color: colors.textSec,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputContainerError: {
    borderColor: colors.error,
    backgroundColor: "#fef2f2",
  },
  inputContainerDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...typography.regular.medium,
    color: colors.text,
  },
  errorText: {
    ...typography.regular.small,
    color: colors.error,
    marginTop: 4,
  },
});

export default CustomInput;
