// VoiceNav Task Progress — visual task progress overlay with step checklist
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../a11y/theme';
import type { TaskDefinition, TaskStep } from '../agent/taskEngine';

type TaskProgressProps = {
  task: TaskDefinition | null;
  visible: boolean;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
  onDismiss: () => void;
};

export default function TaskProgress({
  task, visible, onCancel, onPause, onResume, onDismiss,
}: TaskProgressProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && task) {
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(progressAnim, {
          toValue: task.steps.length > 0 ? task.currentStepIndex / task.steps.length : 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, task?.currentStepIndex, task?.steps.length]);

  if (!visible || !task) return null;

  const progress = task.steps.length > 0 ? task.currentStepIndex / task.steps.length : 0;
  const isPaused = task.status === 'paused';
  const isComplete = task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled';

  const getStepIcon = (step: TaskStep, index: number) => {
    if (step.status === 'completed') return { name: 'checkmark-circle', color: COLORS.dark.success };
    if (step.status === 'failed') return { name: 'close-circle', color: COLORS.dark.error };
    if (step.status === 'running') return { name: 'play-circle', color: COLORS.dark.primary };
    if (step.status === 'paused') return { name: 'pause-circle', color: COLORS.dark.warning };
    if (index < task.currentStepIndex) return { name: 'checkmark-circle', color: COLORS.dark.success };
    return { name: 'ellipse-outline', color: COLORS.dark.textMuted };
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name={isComplete ? (task.status === 'completed' ? 'checkmark-circle' : 'close-circle') : 'sync'}
              size={20}
              color={isComplete ? (task.status === 'completed' ? COLORS.dark.success : COLORS.dark.error) : COLORS.dark.primary}
            />
            <Text style={styles.title} numberOfLines={1}>{task.name}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} accessibilityLabel="Dismiss task progress">
            <Ionicons name="close" size={18} color={COLORS.dark.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {Math.min(task.currentStepIndex + 1, task.steps.length)} of {task.steps.length}
          {task.steps[task.currentStepIndex] ? ` — ${task.steps[task.currentStepIndex].name}` : ''}
        </Text>

        {/* Steps */}
        <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
          {task.steps.map((step, i) => {
            const icon = getStepIcon(step, i);
            const isActive = i === task.currentStepIndex;
            return (
              <View key={step.id} style={[styles.stepRow, isActive && styles.stepRowActive]}>
                <Ionicons name={icon.name as any} size={16} color={icon.color} />
                <Text style={[styles.stepName, isActive && styles.stepNameActive, step.status === 'completed' && styles.stepNameCompleted]}>
                  {step.name}
                </Text>
                {step.error && <Text style={styles.stepError}>{step.error}</Text>}
              </View>
            );
          })}
        </ScrollView>

        {/* Controls */}
        {!isComplete && (
          <View style={styles.controls}>
            {isPaused ? (
              <TouchableOpacity style={styles.controlBtn} onPress={onResume} accessibilityLabel="Resume task">
                <Ionicons name="play" size={16} color={COLORS.dark.success} />
                <Text style={[styles.controlText, { color: COLORS.dark.success }]}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.controlBtn} onPress={onPause} accessibilityLabel="Pause task">
                <Ionicons name="pause" size={16} color={COLORS.dark.warning} />
                <Text style={[styles.controlText, { color: COLORS.dark.warning }]}>Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.controlBtn} onPress={onCancel} accessibilityLabel="Cancel task">
              <Ionicons name="stop" size={16} color={COLORS.dark.error} />
              <Text style={[styles.controlText, { color: COLORS.dark.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completion */}
        {isComplete && (
          <View style={styles.completion}>
            <Text style={[styles.completionText, { color: task.status === 'completed' ? COLORS.dark.success : COLORS.dark.error }]}>
              {task.status === 'completed' ? 'Task completed!' : task.status === 'cancelled' ? 'Task cancelled' : 'Task failed'}
            </Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} accessibilityLabel="Dismiss task result">
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 90,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 100,
  },
  card: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  title: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.dark.text, flex: 1 },
  closeBtn: { padding: SPACING.xs },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.dark.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.dark.primary,
    borderRadius: 2,
  },
  progressText: { fontSize: FONT_SIZE.xs, color: COLORS.dark.textMuted, marginBottom: SPACING.sm },
  stepsContainer: { maxHeight: 150, marginBottom: SPACING.sm },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  stepRowActive: { backgroundColor: COLORS.dark.primary + '10' },
  stepName: { fontSize: FONT_SIZE.sm, color: COLORS.dark.textSecondary, flex: 1 },
  stepNameActive: { color: COLORS.dark.text, fontWeight: '600' },
  stepNameCompleted: { textDecorationLine: 'line-through', color: COLORS.dark.textMuted },
  stepError: { fontSize: FONT_SIZE.xs, color: COLORS.dark.error },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  controlBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, padding: SPACING.xs },
  controlText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  completion: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  completionText: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  dismissBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.dark.surfaceLight,
    borderRadius: RADIUS.sm,
  },
  dismissText: { fontSize: FONT_SIZE.sm, color: COLORS.dark.text, fontWeight: '600' },
});
