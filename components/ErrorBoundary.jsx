import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii, minTouchTarget } from '../constants/theme';

/**
 * Catches React render errors and shows a recoverable message + Retry.
 * Phase 13.1 — Global error handling.
 */
export class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.primaryForeground,
  },
});
