// VoiceNav Floating Assistant — persistent floating bubble with quick actions
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../a11y/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 56;
const EXPANDED_WIDTH = 280;

type Message = {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: number;
};

type FloatingAssistantProps = {
  visible: boolean;
  status: string;
  isListening: boolean;
  isProcessing: boolean;
  messages: Message[];
  suggestions: string[];
  onVoiceToggle: () => void;
  onSuggestionPress: (suggestion: string) => void;
  onExpand?: () => void;
  currentTaskName?: string;
  taskProgress?: { current: number; total: number } | null;
};

export default function FloatingAssistant({
  visible, status, isListening, isProcessing, messages, suggestions,
  onVoiceToggle, onSuggestionPress, onExpand, currentTaskName, taskProgress,
}: FloatingAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - BUBBLE_SIZE - 16, y: SCREEN_HEIGHT - 200 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation when listening
  useEffect(() => {
    let pulse: Animated.CompositeAnimation | null = null;
    if (isListening) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { pulse?.stop(); };
  }, [isListening]);

  // Expand animation
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [isExpanded]);

  // Drag handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
        // Snap to edges
        const x = (pan.x as any)._value;
        const y = (pan.y as any)._value;
        const snapX = x < SCREEN_WIDTH / 2 ? 16 : SCREEN_WIDTH - BUBBLE_SIZE - 16;
        const snapY = Math.max(60, Math.min(SCREEN_HEIGHT - BUBBLE_SIZE - 100, y));
        Animated.spring(pan, { toValue: { x: snapX, y: snapY }, useNativeDriver: false, tension: 65, friction: 11 }).start();
      },
    })
  ).current;

  const handleBubblePress = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  const handleLongPress = useCallback(() => {
    onVoiceToggle();
  }, [onVoiceToggle]);

  if (!visible) return null;

  const bubbleColor = isListening ? COLORS.dark.error : isProcessing ? COLORS.dark.warning : COLORS.dark.primary;
  const iconName = isListening ? 'mic' : isProcessing ? 'sync' : 'mic-outline';

  return (
    <Animated.View
      style={[styles.container, {
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
      }]}
      {...panResponder.panHandlers}
    >
      {/* Expanded Panel */}
      {isExpanded && (
        <Animated.View style={[styles.expandedPanel, {
          opacity: expandAnim,
          transform: [{ scale: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
        }]}>
          {/* Header */}
          <View style={styles.expandedHeader}>
            <View style={styles.expandedHeaderLeft}>
              <View style={[styles.statusDot, { backgroundColor: isListening ? COLORS.dark.error : COLORS.dark.success }]} />
              <Text style={styles.expandedTitle}>VoiceNav</Text>
            </View>
            <TouchableOpacity onPress={() => setIsExpanded(false)} accessibilityLabel="Close assistant panel">
              <Ionicons name="close" size={18} color={COLORS.dark.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Status */}
          <Text style={styles.statusText}>{status || 'Ready'}</Text>

          {/* Task Progress */}
          {currentTaskName && taskProgress && (
            <View style={styles.taskRow}>
              <Ionicons name="sync" size={14} color={COLORS.dark.primary} />
              <Text style={styles.taskText} numberOfLines={1}>{currentTaskName}</Text>
              <Text style={styles.taskProgress}>{taskProgress.current}/{taskProgress.total}</Text>
            </View>
          )}

          {/* Messages */}
          <View style={styles.messagesContainer}>
            {messages.slice(-4).map(msg => (
              <View key={msg.id} style={[styles.messageBubble, msg.type === 'user' ? styles.messageUser : styles.messageAssistant]}>
                <Text style={styles.messageText} numberOfLines={2}>{msg.text}</Text>
              </View>
            ))}
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.slice(0, 3).map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => onSuggestionPress(s)} accessibilityLabel={`Suggestion: ${s}`}>
                  <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={onVoiceToggle} accessibilityLabel={isListening ? 'Stop listening' : 'Start listening'}>
              <Ionicons name={isListening ? 'stop-circle' : 'mic'} size={20} color={isListening ? COLORS.dark.error : COLORS.dark.primary} />
            </TouchableOpacity>
            {onExpand && (
              <TouchableOpacity style={styles.quickAction} onPress={onExpand} accessibilityLabel="Open command palette">
                <Ionicons name="expand" size={20} color={COLORS.dark.accent} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Bubble */}
      <Animated.View style={[styles.bubble, {
        backgroundColor: bubbleColor,
        transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
      }]}>
        <TouchableOpacity style={styles.bubbleTouch} onPress={handleBubblePress} onLongPress={handleLongPress} activeOpacity={0.8} accessibilityLabel="VoiceNav assistant" accessibilityHint="Tap to expand, long press for voice command">
          <Ionicons name={iconName as any} size={24} color="#fff" />
          {taskProgress && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{taskProgress.current}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bubbleTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BUBBLE_SIZE / 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.dark.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  expandedPanel: {
    position: 'absolute',
    bottom: BUBBLE_SIZE + 8,
    right: 0,
    width: EXPANDED_WIDTH,
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  expandedHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  expandedTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.dark.text },
  statusText: { fontSize: FONT_SIZE.xs, color: COLORS.dark.textMuted, marginBottom: SPACING.sm },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.dark.primary + '10',
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  taskText: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.dark.primary, fontWeight: '600' },
  taskProgress: { fontSize: FONT_SIZE.xs, color: COLORS.dark.textMuted },
  messagesContainer: { maxHeight: 120, marginBottom: SPACING.sm },
  messageBubble: {
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  messageUser: { backgroundColor: COLORS.dark.primary + '15', alignSelf: 'flex-end', maxWidth: '80%' },
  messageAssistant: { backgroundColor: COLORS.dark.surfaceLight, alignSelf: 'flex-start', maxWidth: '80%' },
  messageText: { fontSize: FONT_SIZE.xs, color: COLORS.dark.text },
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: SPACING.sm },
  suggestionChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    backgroundColor: COLORS.dark.accent + '15',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.dark.accent + '30',
  },
  suggestionText: { fontSize: 10, color: COLORS.dark.accent },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md },
  quickAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
