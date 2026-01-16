import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ErrorTextProps {
  message: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showIcon?: boolean;
}

const ErrorText: React.FC<ErrorTextProps> = ({
  message,
  style,
  textStyle,
  showIcon = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showIcon && <Text style={styles.icon}>⚠️</Text>}
      <Text style={[styles.text, textStyle]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: '#d32f2f',
    lineHeight: 20,
  },
});

export default ErrorText;