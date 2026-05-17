import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
  Animated, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store';
import { useBookmarkStore } from '../src/store/bookmarks';
import { useVoiceShortcutStore } from '../src/store/voiceCommands';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import BrowserView, { BrowserViewHandle } from '../src/browser/BrowserView';
import { PageSnapshot, AgentAction, AgentContext } from '../src/browser/types';
import { speak, stopSpeaking } from '../src/voice/textToSpeech';
import { useSpeechRecognition } from '../src/voice/speechToText';
import { understand, resolveSiteAlias } from '../src/agent/nlu';
import { parseVoiceCommand, getAgentStep, analyzePage, getPageSuggestions } from '../src/agent/brain';
import { addTurn, updateEntityMemory, addPageToHistory, getContextForNLU, resetSession } from '../src/agent/sessionMemory';
import { createTask, submitTask, getActiveTask, advanceStep, cancelActiveTask, pauseActiveTask, resumeActiveTask, getTaskProgress, hasMultipleSteps, parseMultiStepCommand, matchTaskTemplate, createTaskFromTemplate } from '../src/agent/taskEngine';
import { findMacroByVoice, expandMacro, markMacroUsed, loadMacros } from '../src/voice/voiceMacros';
import { startContinuous, stopContinuous, handleSpeechResult, handleSpeechError, handleVolumeChange, isContinuousActive, checkBargeIn } from '../src/voice/continuousListener';
import VoiceButton from '../src/components/VoiceButton';
import TaskProgress from '../src/components/TaskProgress';
import CommandPalette from '../src/components/CommandPalette';
import FloatingAssistant from '../src/components/FloatingAssistant';
import OfflineBanner from '../src/components/OfflineBanner';
import type { CommandEntry } from '../src/components/CommandPalette';
import { logger } from '../src/utils/logger';
import { captureError } from '../src/utils/crashReporting';
import { useNetworkState } from '../src/hooks/useNetworkState';

export default function BrowserScreen() {
  const router = useRouter();
  const browserRef = useRef<BrowserViewHandle>(null);
  const {
    currentUrl, setCurrentUrl, isLoading, setIsLoading,
    pageSnapshot, setPageSnapshot, pageTitle, setPageTitle,
    isAgentActive, setIsAgentActive, agentStatus, setAgentStatus,
    error, setError, addBrowsingHistory, addCommandHistory, speechRate,
    continuousMode, setContinuousMode, addAssistantMessage, assistantMessages,
    activeTaskName, setActiveTaskName, taskProgress, setTaskProgress, commandHistory,
  } = useAppStore();
  const { addBookmark, isBookmarked, removeBookmark, getBookmarkByUrl } = useBookmarkStore();
  const { findShortcut } = useVoiceShortcutStore();

  const [showUrlBar, setShowUrlBar] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [commandInput, setCommandInput] = useState('');
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTaskProgress, setShowTaskProgress] = useState(false);
  const [showFloatingAssistant, setShowFloatingAssistant] = useState(true);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
  const { isOffline } = useNetworkState();
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const agentContextRef = useRef<AgentContext>({ stepHistory: [], retryCount: 0 });

  const { isListening, transcript, interimTranscript, start: startListening, stop: stopListening } = useSpeechRecognition();

  // Load macros on mount
  useEffect(() => { loadMacros(); }, []);

  // Flush offline queue when back online
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      speak(`Back online. Processing ${offlineQueue.length} queued commands.`);
      offlineQueue.forEach((cmd, i) => {
        trackedSetTimeout(() => processCommand(cmd), i * 3000);
      });
      setOfflineQueue([]);
    }
  }, [isOffline]);

  // Wire continuous listener
  useEffect(() => {
    if (continuousMode !== 'off') {
      logger.voice('continuousMode activated', { mode: continuousMode });
      startContinuous(continuousMode, {
        onCommand: (text) => processCommand(text),
        onWakeWord: () => speak('Yes?'),
        onListeningStart: () => addLog('Continuous listening started'),
        onListeningEnd: () => addLog('Continuous listening stopped'),
        onVolumeChange: (vol) => {
          if (checkBargeIn(vol)) stopSpeaking();
        },
        onError: (err) => {
          logger.voice('continuousListener error', err);
          addLog(`Voice error: ${err}`);
        },
      });
    } else {
      stopContinuous();
    }
    return () => { stopContinuous(); };
  }, [continuousMode]);

  // Cleanup
  useEffect(() => {
    return () => { timeoutsRef.current.forEach(id => clearTimeout(id)); timeoutsRef.current.clear(); };
  }, []);

  useEffect(() => { addBrowsingHistory(currentUrl); }, []);

  const trackedSetTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => { timeoutsRef.current.delete(id); fn(); }, ms);
    timeoutsRef.current.add(id);
    return id;
  }, []);

  const flashStatus = useCallback(() => {
    Animated.sequence([
      Animated.timing(statusOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(statusOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [statusOpacity]);

  const addLog = useCallback((msg: string) => { setAgentLog(prev => [msg, ...prev].slice(0, 30)); }, []);

  const handleSnapshot = useCallback((snapshot: PageSnapshot) => {
    setPageSnapshot(snapshot);
    setPageTitle(snapshot.title);
    if (snapshot.url !== currentUrl) {
      setCurrentUrl(snapshot.url);
      setUrlInput(snapshot.url);
      addBrowsingHistory(snapshot.url);
      addPageToHistory(snapshot.url, snapshot.title, snapshot.pageType, snapshot);
    }
    const newSuggestions = getPageSuggestions(snapshot);
    setSuggestions(newSuggestions);
  }, [currentUrl, setCurrentUrl, setPageSnapshot, setPageTitle, addBrowsingHistory]);

  const handleLoadStart = useCallback(() => { setIsLoading(true); setError(null); }, [setIsLoading, setError]);
  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    trackedSetTimeout(() => { browserRef.current?.extractDOM(); }, 300);
  }, [setIsLoading, trackedSetTimeout]);
  const handleError = useCallback((errorMsg: string) => { setIsLoading(false); setError(errorMsg); speak('Page failed to load.'); }, [setIsLoading, setError]);
  const handleNavigationStateChange = useCallback((navState: { url: string; canGoBack: boolean; canGoForward: boolean; loading: boolean; title: string }) => {
    if (navState.url !== currentUrl) { setCurrentUrl(navState.url); setUrlInput(navState.url); }
  }, [currentUrl, setCurrentUrl]);

  const executeAgentAction = useCallback((action: AgentAction) => {
    addLog(`> ${action.action}: ${'speak' in action ? action.speak || '' : ''}`);
    setAgentStatus('speak' in action ? action.speak || action.action : action.action);
    flashStatus();
    switch (action.action) {
      case 'click': case 'type': case 'select': case 'scroll': case 'submit': case 'focus': case 'hover': case 'doubleClick': case 'rightClick': case 'keypress': case 'fillForm': case 'multiClick':
        browserRef.current?.executeAction(action); break;
      case 'navigate': setUrlInput(action.url); browserRef.current?.navigate(action.url); break;
      case 'back': browserRef.current?.goBack(); break;
      case 'forward': browserRef.current?.goForward(); break;
      case 'refresh': browserRef.current?.reload(); break;
      case 'speak': speak(action.text, { rate: speechRate }); break;
      case 'done': setIsAgentActive(false); speak(action.speak, { rate: speechRate }); break;
      case 'wait': break;
    }
  }, [addLog, setAgentStatus, flashStatus, speechRate, setIsAgentActive]);

  const processSingleCommand = useCallback((command: string, stepIndex: number, totalSteps: number) => {
    logger.agent('processCommand', { command, step: stepIndex + 1, total: totalSteps });
    addCommandHistory(command);
    addLog(`Step ${stepIndex + 1}/${totalSteps}: ${command}`);
    addAssistantMessage(command, 'user');

    // Check voice shortcuts
    const shortcut = findShortcut(command);
    if (shortcut) {
      speak(`Shortcut: ${shortcut.phrase}`);
      if (shortcut.action === 'navigate') { browserRef.current?.navigate(shortcut.target); return; }
    }

    // Check macros
    const macroMatch = findMacroByVoice(command);
    if (macroMatch) {
      const { macro, variables } = macroMatch;
      markMacroUsed(macro.id);
      const steps = expandMacro(macro, variables);
      speak(`Running macro: ${macro.name}`);
      const task = createTask(macro.name, steps.map(s => ({ name: s.command, command: s.command })), macro.description);
      submitTask(task);
      setCurrentTask(task);
      setActiveTaskName(macro.name);
      setShowTaskProgress(true);
      // Execute first step
      if (steps.length > 0 && steps[0].command) {
        processSingleCommand(steps[0].command, 0, steps.length);
      }
      return;
    }

    // Check task templates
    const template = matchTaskTemplate(command);
    if (template) {
      const variables: Record<string, string> = {};
      const itemMatch = command.match(/(?:for|search for|buy|find|order)\s+(.+)/i);
      if (itemMatch) variables.item = itemMatch[1].trim();
      const storeMatch = command.match(/(?:on|from|at)\s+(\w+)/i);
      if (storeMatch) variables.store = storeMatch[1].trim();
      const task = createTaskFromTemplate(template, variables);
      submitTask(task);
      setCurrentTask(task);
      setActiveTaskName(task.name);
      setShowTaskProgress(true);
      speak(`Starting task: ${task.name}`);
      if (task.steps[0]?.command) {
        processSingleCommand(task.steps[0].command, 0, task.steps.length);
      }
      return;
    }

    // Bookmark commands
    if (/bookmark this|save this page|add bookmark/i.test(command)) {
      if (pageSnapshot) {
        const title = pageSnapshot.title || pageSnapshot.url;
        const url = pageSnapshot.url;
        if (isBookmarked(url)) { speak('This page is already bookmarked.'); }
        else { addBookmark(title, url); speak(`Bookmarked: ${title}`); }
      } else { speak('No page loaded to bookmark.'); }
      return;
    }
    if (/remove bookmark|unbookmark/i.test(command)) {
      if (pageSnapshot && isBookmarked(pageSnapshot.url)) {
        const bm = getBookmarkByUrl(pageSnapshot.url);
        if (bm) { removeBookmark(bm.id); speak('Bookmark removed.'); }
      } else { speak('This page is not bookmarked.'); }
      return;
    }

    // Page analysis
    if (/describe|what'?s on|what is on|analyze/i.test(command)) {
      if (pageSnapshot) { speak(analyzePage(pageSnapshot), { rate: speechRate }); }
      return;
    }

    // Standard agent processing
    logger.agent('standardProcessing', { command });
    setIsAgentActive(true);
    setAgentStatus('Thinking...');
    addAssistantMessage('Processing...', 'assistant');

    const intent = parseVoiceCommand(command, agentContextRef.current);
    const snapshot = pageSnapshot;

    if (!snapshot) {
      speak('Page is still loading. Please wait.');
      setIsAgentActive(false);
      return;
    }

    agentContextRef.current = { stepHistory: [], retryCount: 0 };
    const context = agentContextRef.current;

    const { action, isComplete, needsRetry } = getAgentStep(intent, snapshot, context);
    executeAgentAction(action);

    if ('speak' in action && action.speak) { speak(action.speak, { rate: speechRate }); }

    // Update session memory
    addTurn({ command, nluResult: understand(command), action, result: 'success', pageUrl: snapshot.url, pageTitle: snapshot.title });
    if (intent.target) updateEntityMemory({ lastElement: { id: 0, text: intent.target, role: '', label: '' } });

    // Update task progress
    const active = getActiveTask();
    if (active) {
      advanceStep();
      const progress = getTaskProgress();
      if (progress) {
        setTaskProgress({ current: progress.current, total: progress.total });
        setCurrentTask({ ...active });
      }
    }

    if (!isComplete || needsRetry) {
      context.stepHistory.push(command);
      trackedSetTimeout(() => {
        browserRef.current?.extractDOM();
        trackedSetTimeout(() => {
          const updatedSnapshot = useAppStore.getState().pageSnapshot;
          if (updatedSnapshot) {
            if (needsRetry) context.retryCount++;
            const step2 = getAgentStep(intent, updatedSnapshot, context);
            executeAgentAction(step2.action);
            if ('speak' in step2.action && step2.action.speak) { speak(step2.action.speak, { rate: speechRate }); }
          }
          setIsAgentActive(false);
        }, 800);
      }, 1500);
    } else {
      trackedSetTimeout(() => setIsAgentActive(false), 1000);
    }
  }, [pageSnapshot, addCommandHistory, addLog, setIsAgentActive, setAgentStatus, executeAgentAction, speechRate, findShortcut, isBookmarked, addBookmark, removeBookmark, getBookmarkByUrl, trackedSetTimeout, addAssistantMessage, setActiveTaskName, setTaskProgress]);

  const processCommand = useCallback((command: string) => {
    if (!command.trim()) return;
    if (isOffline) {
      setOfflineQueue(prev => [...prev, command]);
      speak('You are offline. Command queued.');
      return;
    }
    try {
    if (hasMultipleSteps(command)) {
      const steps = parseMultiStepCommand(command);
      addLog(`Multi-step: ${steps.length} commands`);
      steps.forEach((step, i) => {
        trackedSetTimeout(() => { processSingleCommand(step, i, steps.length); }, i * 3000);
      });
    } else {
      processSingleCommand(command, 0, 1);
    }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      captureError(error, { command, phase: 'processCommand' });
      logger.error('processCommand failed', error);
      speak('Something went wrong. Please try again.');
      setIsAgentActive(false);
    }
  }, [processSingleCommand, addLog, trackedSetTimeout, isOffline]);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript) processCommand(transcript);
    } else {
      stopSpeaking();
      startListening({
        onResult: (text, isFinal) => { if (isFinal) processCommand(text); },
        onError: () => { speak('Voice error. Type your command instead.'); },
      });
    }
  }, [isListening, transcript, startListening, stopListening, processCommand]);

  const handleSubmitCommand = useCallback(() => {
    if (commandInput.trim()) { processCommand(commandInput.trim()); setCommandInput(''); }
  }, [commandInput, processCommand]);

  const handleSubmitUrl = useCallback(() => {
    if (urlInput.trim()) {
      let url = urlInput.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      browserRef.current?.navigate(url);
      setShowUrlBar(false);
    }
  }, [urlInput]);

  const handleToggleBookmark = useCallback(() => {
    if (!pageSnapshot) return;
    const title = pageSnapshot.title || pageSnapshot.url;
    const url = pageSnapshot.url;
    if (isBookmarked(url)) {
      const bm = getBookmarkByUrl(url);
      if (bm) { removeBookmark(bm.id); speak('Bookmark removed'); }
    } else { addBookmark(title, url); speak(`Bookmarked: ${title}`); }
  }, [pageSnapshot, isBookmarked, addBookmark, removeBookmark, getBookmarkByUrl]);

  const handleAction = useCallback((result: { success: boolean; error?: string }) => {
    addLog(result.success ? 'Action completed' : `Action failed: ${result.error}`);
  }, [addLog]);

  const handleSuggestionPress = useCallback((suggestion: string) => { processCommand(suggestion); }, [processCommand]);

  // Command palette entries
  const commandEntries: CommandEntry[] = [
    { id: 'nav-home', name: 'Go Home', description: 'Navigate to Google homepage', category: 'Navigation', icon: 'home', action: 'go home' },
    { id: 'nav-back', name: 'Go Back', description: 'Go to previous page', category: 'Navigation', icon: 'arrow-back', action: 'go back' },
    { id: 'nav-forward', name: 'Go Forward', description: 'Go to next page', category: 'Navigation', icon: 'arrow-forward', action: 'go forward' },
    { id: 'nav-refresh', name: 'Refresh', description: 'Reload current page', category: 'Navigation', icon: 'refresh', action: 'refresh' },
    { id: 'shop-cart', name: 'Add to Cart', description: 'Add current item to shopping cart', category: 'Shopping', icon: 'cart', action: 'add to cart' },
    { id: 'shop-buy', name: 'Buy Now', description: 'Purchase current item', category: 'Shopping', icon: 'card', action: 'buy now' },
    { id: 'shop-compare', name: 'Compare Prices', description: 'Search for price comparisons', category: 'Shopping', icon: 'pricetag', action: 'compare prices' },
    { id: 'read-page', name: 'Read Page', description: 'Read and summarize current page', category: 'Reading', icon: 'book', action: 'read this page' },
    { id: 'read-scroll', name: 'Scroll Down', description: 'Scroll page down', category: 'Reading', icon: 'arrow-down', action: 'scroll down' },
    { id: 'form-submit', name: 'Submit Form', description: 'Submit the current form', category: 'Forms', icon: 'send', action: 'submit the form' },
    { id: 'form-login', name: 'Sign In', description: 'Click sign in button', category: 'Forms', icon: 'log-in', action: 'sign in' },
    { id: 'media-play', name: 'Play', description: 'Play video or audio', category: 'Media', icon: 'play', action: 'play' },
    { id: 'media-pause', name: 'Pause', description: 'Pause playback', category: 'Media', icon: 'pause', action: 'pause' },
    { id: 'bm-save', name: 'Bookmark Page', description: 'Save current page as bookmark', category: 'Custom', icon: 'bookmark', action: 'bookmark this page' },
    { id: 'help', name: 'Help', description: 'Show available commands', category: 'Custom', icon: 'help-circle', action: 'help' },
  ];

  const bookmarked = pageSnapshot ? isBookmarked(pageSnapshot.url) : false;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Offline Banner */}
      <OfflineBanner visible={isOffline} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton} accessibilityLabel="Go home">
          <Ionicons name="home" size={22} color={COLORS.dark.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.urlBar} onPress={() => setShowUrlBar(!showUrlBar)} accessibilityLabel="Current URL">
          {isLoading ? <ActivityIndicator size="small" color={COLORS.dark.primary} style={{ marginRight: 8 }} /> : <Ionicons name="lock-closed" size={14} color={COLORS.dark.textMuted} style={{ marginRight: 8 }} />}
          <Text style={styles.urlText} numberOfLines={1}>{pageTitle || currentUrl.replace(/^https?:\/\//, '').substring(0, 40)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleBookmark} style={[styles.navButton, bookmarked && styles.navButtonActive]} accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark page'}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? COLORS.dark.primary : COLORS.dark.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowCommandPalette(true)} style={styles.navButton} accessibilityLabel="Command palette">
          <Ionicons name="terminal" size={22} color={COLORS.dark.accent} />
        </TouchableOpacity>
      </View>

      {/* URL Edit Bar */}
      {showUrlBar && (
        <View style={styles.urlEditBar}>
          <TextInput style={styles.urlInput} value={urlInput} onChangeText={setUrlInput} onSubmitEditing={handleSubmitUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" placeholder="Enter URL..." placeholderTextColor={COLORS.dark.textMuted} />
          <TouchableOpacity onPress={handleSubmitUrl} style={styles.urlGoButton}><Ionicons name="arrow-forward" size={20} color={COLORS.dark.text} /></TouchableOpacity>
        </View>
      )}

      {/* Status Bar */}
      <Animated.View style={[styles.statusBar, { opacity: statusOpacity }]}><Text style={styles.statusText}>{agentStatus}</Text></Animated.View>

      {/* Task Progress */}
      <TaskProgress task={currentTask} visible={showTaskProgress && !!currentTask} onCancel={() => { cancelActiveTask(); setShowTaskProgress(false); setCurrentTask(null); setActiveTaskName(null); setTaskProgress(null); }} onPause={() => pauseActiveTask()} onResume={() => resumeActiveTask()} onDismiss={() => { setShowTaskProgress(false); setCurrentTask(null); setActiveTaskName(null); setTaskProgress(null); }} />

      {/* Browser */}
      <View style={styles.browserContainer}>
        <BrowserView ref={browserRef} url={currentUrl} onSnapshot={handleSnapshot} onAction={handleAction} onLoadStart={handleLoadStart} onLoadEnd={handleLoadEnd} onError={handleError} onNavigationStateChange={handleNavigationStateChange} />
      </View>

      {/* Suggestions Bar */}
      {suggestions.length > 0 && !isAgentActive && (
        <View style={styles.suggestionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
            {suggestions.map((s, i) => (
              <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => handleSuggestionPress(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => browserRef.current?.goBack()}><Ionicons name="arrow-back" size={20} color={COLORS.dark.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => browserRef.current?.goForward()}><Ionicons name="arrow-forward" size={20} color={COLORS.dark.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => { if (pageSnapshot) speak(analyzePage(pageSnapshot), { rate: speechRate }); }}><Ionicons name="eye" size={20} color={COLORS.dark.accent} /></TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => stopSpeaking()}><Ionicons name="volume-mute" size={20} color={COLORS.dark.warning} /></TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, continuousMode !== 'off' && styles.quickActionActive]} onPress={() => setContinuousMode(continuousMode === 'off' ? 'always_on' : 'off')}>
            <Ionicons name={continuousMode !== 'off' ? 'radio-button-on' : 'radio-button-off'} size={20} color={continuousMode !== 'off' ? COLORS.dark.success : COLORS.dark.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, showAgentPanel && styles.quickActionActive]} onPress={() => setShowAgentPanel(!showAgentPanel)}><Ionicons name="terminal" size={20} color={showAgentPanel ? COLORS.dark.primary : COLORS.dark.text} /></TouchableOpacity>
        </View>

        <View style={styles.commandBar}>
          <VoiceButton isListening={isListening} interimText={interimTranscript} onPress={handleVoiceToggle} size={38} />
          <TextInput style={styles.commandInput} value={commandInput} onChangeText={setCommandInput} onSubmitEditing={handleSubmitCommand} placeholder="Say or type a command..." placeholderTextColor={COLORS.dark.textMuted} returnKeyType="send" />
          {commandInput.length > 0 && (
            <TouchableOpacity onPress={handleSubmitCommand} style={styles.sendButton}><Ionicons name="send" size={18} color={COLORS.dark.text} /></TouchableOpacity>
          )}
        </View>

        {showAgentPanel && (
          <View style={styles.agentPanel}>
            <Text style={styles.agentPanelTitle}>Agent Log</Text>
            {agentLog.length === 0 ? <Text style={styles.agentPanelEmpty}>No actions yet</Text> : agentLog.map((log, i) => <Text key={i} style={styles.agentPanelLog}>{log}</Text>)}
          </View>
        )}
      </View>

      {/* Command Palette */}
      <CommandPalette visible={showCommandPalette} onClose={() => setShowCommandPalette(false)} onExecute={processCommand} commands={commandEntries} recentCommands={commandHistory.slice(0, 10)} contextSuggestions={suggestions} />

      {/* Floating Assistant */}
      <FloatingAssistant
        visible={showFloatingAssistant}
        status={agentStatus}
        isListening={isListening}
        isProcessing={isAgentActive}
        messages={assistantMessages}
        suggestions={suggestions}
        onVoiceToggle={handleVoiceToggle}
        onSuggestionPress={handleSuggestionPress}
        onExpand={() => setShowCommandPalette(true)}
        currentTaskName={activeTaskName || undefined}
        taskProgress={taskProgress}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: SPACING.sm, backgroundColor: COLORS.dark.surface, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border, gap: SPACING.xs },
  navButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.dark.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  navButtonActive: { backgroundColor: COLORS.dark.primary + '20' },
  urlBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.surfaceLight, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, height: 38 },
  urlText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.dark.text },
  urlEditBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border },
  urlInput: { flex: 1, height: 40, backgroundColor: COLORS.dark.surfaceLight, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, color: COLORS.dark.text, fontSize: FONT_SIZE.sm, marginRight: SPACING.sm },
  urlGoButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.dark.primary, justifyContent: 'center', alignItems: 'center' },
  statusBar: { backgroundColor: COLORS.dark.primary, paddingVertical: 4, paddingHorizontal: SPACING.md, position: 'absolute', top: Platform.OS === 'ios' ? 96 : 76, left: 0, right: 0, zIndex: 10 },
  statusText: { color: COLORS.dark.text, fontSize: FONT_SIZE.xs, fontWeight: '600', textAlign: 'center' },
  browserContainer: { flex: 1 },
  suggestionsBar: { backgroundColor: COLORS.dark.surface, borderTopWidth: 1, borderTopColor: COLORS.dark.border, paddingVertical: SPACING.xs },
  suggestionsContent: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  suggestionChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, backgroundColor: COLORS.dark.accent + '15', borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.dark.accent + '30' },
  suggestionText: { fontSize: FONT_SIZE.sm, color: COLORS.dark.accent, fontWeight: '500' },
  bottomPanel: { backgroundColor: COLORS.dark.surface, borderTopWidth: 1, borderTopColor: COLORS.dark.border },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border },
  quickAction: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.dark.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  quickActionActive: { backgroundColor: COLORS.dark.primary + '30', borderWidth: 1, borderColor: COLORS.dark.primary },
  commandBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  commandInput: { flex: 1, height: 42, backgroundColor: COLORS.dark.surfaceLight, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, color: COLORS.dark.text, fontSize: FONT_SIZE.md },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.dark.primary, justifyContent: 'center', alignItems: 'center' },
  agentPanel: { maxHeight: 150, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  agentPanelTitle: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.dark.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  agentPanelEmpty: { fontSize: FONT_SIZE.xs, color: COLORS.dark.textMuted, fontStyle: 'italic' },
  agentPanelLog: { fontSize: FONT_SIZE.xs, color: COLORS.dark.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 2 },
});
