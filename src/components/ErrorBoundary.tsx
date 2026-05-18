import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../a11y/theme';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  label?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  detailsExpanded: boolean;
  copied: boolean;
  retryCount: number;
};

const FRIENDLY_MESSAGES: Record<string, string> = {
  NetworkError: 'It looks like you are offline. Check your internet connection and try again.',
  TypeError: 'Something unexpected happened. This is likely a temporary glitch.',
  SyntaxError: 'The app encountered an issue parsing data. Try refreshing.',
  RangeError: 'A value went out of bounds. This should not happen -- please try again.',
  ReferenceError: 'A missing piece of data caused an issue. Try again to reload.',
  ChunkLoadError: 'Failed to load part of the app. This usually fixes itself on retry.',
  default: 'Something went wrong, but it is likely temporary. Give it another try.',
};

function getFriendlyMessage(error: Error | null): string {
  if (!error) return FRIENDLY_MESSAGES.default;
  const name = error.constructor?.name || '';
  if (FRIENDLY_MESSAGES[name]) return FRIENDLY_MESSAGES[name];
  if (error.message?.includes('Network')) return FRIENDLY_MESSAGES.NetworkError;
  if (error.message?.includes('fetch')) return FRIENDLY_MESSAGES.NetworkError;
  if (error.message?.includes('timeout')) return 'The request took too long. Check your connection and try again.';
  if (error.message?.includes('permission')) return 'Permission denied. Check your device settings.';
  if (error.message?.includes('storage')) return 'Device storage is full. Free up space and try again.';
  return FRIENDLY_MESSAGES.default;
}

const RECOVERY_SUGGESTIONS = [
  { icon: 'refresh' as const, text: 'Try again', action: 'retry' },
  { icon: 'home' as const, text: 'Go to home screen', action: 'home' },
  { icon: 'copy' as const, text: 'Copy error details', action: 'copy' },
];

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    detailsExpanded: false,
    copied: false,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      detailsExpanded: false,
      copied: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleToggleDetails = () => {
    this.setState((prev) => ({ detailsExpanded: !prev.detailsExpanded }));
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const label = this.props.label;
    const text = [
      'VoiceNav Error Report',
      '========================',
      label ? `Context: ${label}` : null,
      `Error: ${error?.message || 'Unknown'}`,
      `Type: ${error?.constructor?.name || 'Unknown'}`,
      `Stack: ${error?.stack || 'No stack trace'}`,
      errorInfo?.componentStack ? `Component Stack:\n${errorInfo.componentStack}` : null,
      `Platform: ${Platform.OS} ${Platform.Version}`,
      `Time: ${new Date().toISOString()}`,
      '========================',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Clipboard.setString(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard may not be available
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const friendlyMsg = getFriendlyMessage(this.state.error);
      const { detailsExpanded, copied, retryCount } = this.state;
      const stackLines = this.state.error?.stack?.split('\n').slice(0, 8) || [];

      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>!</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Oops, something went wrong</Text>

            {/* Friendly message */}
            <Text style={styles.friendlyMessage}>{friendlyMsg}</Text>

            {/* Technical error summary */}
            <View style={styles.errorSummary}>
              <Ionicons name="alert-circle" size={16} color={COLORS.dark.error} />
              <Text style={styles.errorSummaryText} numberOfLines={2}>
                {this.state.error?.message || 'Unknown error'}
              </Text>
            </View>

            {/* Error details expandable */}
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={this.handleToggleDetails}
              accessibilityLabel={detailsExpanded ? 'Hide error details' : 'Show error details'}
              accessibilityRole="button"
            >
              <Ionicons
                name={detailsExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.dark.textSecondary}
              />
              <Text style={styles.detailsToggleText}>
                {detailsExpanded ? 'Hide Details' : 'Show Technical Details'}
              </Text>
            </TouchableOpacity>

            {detailsExpanded && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsLabel}>Stack Trace</Text>
                <ScrollView style={styles.stackScroll} nestedScrollEnabled>
                  {stackLines.map((line, i) => (
                    <Text key={i} style={styles.stackLine}>{line.trim()}</Text>
                  ))}
                </ScrollView>

                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={[styles.detailsLabel, { marginTop: SPACING.md }]}>Component Stack</Text>
                    <ScrollView style={styles.stackScroll} nestedScrollEnabled>
                      <Text style={styles.stackLine}>
                        {this.state.errorInfo.componentStack.split('\n').slice(0, 5).join('\n')}
                      </Text>
                    </ScrollView>
                  </>
                )}

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Platform:</Text>
                  <Text style={styles.metaValue}>{Platform.OS} {Platform.Version}</Text>
                </View>
                {retryCount > 0 && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Retries:</Text>
                    <Text style={styles.metaValue}>{retryCount}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Recovery suggestions */}
            <View style={styles.suggestionsContainer}>
              {RECOVERY_SUGGESTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.action}
                  style={styles.suggestionButton}
                  onPress={
                    suggestion.action === 'retry'
                      ? this.handleRetry
                      : suggestion.action === 'copy'
                      ? this.handleCopyError
                      : undefined
                  }
                  accessibilityLabel={suggestion.text}
                >
                  <View style={[
                    styles.suggestionIcon,
                    {
                      backgroundColor:
                        suggestion.action === 'retry'
                          ? COLORS.dark.primary + '20'
                          : suggestion.action === 'copy'
                          ? (copied ? COLORS.dark.success + '20' : COLORS.dark.accent + '20')
                          : COLORS.dark.surfaceLight,
                    },
                  ]}>
                    <Ionicons
                      name={copied && suggestion.action === 'copy' ? 'checkmark' : suggestion.icon}
                      size={20}
                      color={
                        suggestion.action === 'retry'
                          ? COLORS.dark.primary
                          : suggestion.action === 'copy'
                          ? (copied ? COLORS.dark.success : COLORS.dark.accent)
                          : COLORS.dark.textSecondary
                      }
                    />
                  </View>
                  <Text style={styles.suggestionText}>
                    {copied && suggestion.action === 'copy' ? 'Copied!' : suggestion.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Retry button */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              accessibilityLabel="Try again"
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: SPACING.sm }} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.dark.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.dark.error,
  },
  iconText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.dark.error,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.dark.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  friendlyMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  errorSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.error + '10',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.error + '30',
    marginBottom: SPACING.md,
    maxWidth: '100%',
    gap: SPACING.sm,
  },
  errorSummaryText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.error,
    fontWeight: '500',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  detailsToggleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    marginBottom: SPACING.lg,
  },
  detailsLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  stackScroll: {
    maxHeight: 120,
    backgroundColor: COLORS.dark.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  stackLine: {
    fontSize: 11,
    color: COLORS.dark.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  metaLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textSecondary,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
    flexWrap: 'wrap',
  },
  suggestionButton: {
    alignItems: 'center',
    width: 90,
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  suggestionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    shadowColor: COLORS.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  retryText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
