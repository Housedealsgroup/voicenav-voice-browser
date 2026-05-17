import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store';
import { useBookmarkStore } from '../src/store/bookmarks';
import { useVoiceShortcutStore } from '../src/store/voiceCommands';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import BrowserView, { BrowserViewHandle } from '../src/browser/BrowserView';
import { PageSnapshot, AgentAction } from '../src/browser/types';
import { speak, stopSpeaking } from '../src/voice/textToSpeech';
import { useSpeechRecognition } from '../src/voice/speechToText';
import { parseVoiceCommand, getAgentStep, analyzePage } from '../src/agent/brain';
import VoiceButton from '../src/components/VoiceButton';

export default function BrowserScreen() {
  const router = useRouter();
  const browserRef = useRef<BrowserViewHandle>(null);
  const {
    currentUrl, setCurrentUrl, isLoading, setIsLoading,
    pageSnapshot, setPageSnapshot, pageTitle, setPageTitle,
    isAgentActive, setIsAgentActive, agentStatus, setAgentStatus,
    error, setError,
    addBrowsingHistory, addCommandHistory, speechRate,
  } = useAppStore();
  const { addBookmark, isBookmarked, removeBookmark, getBookmarkByUrl } = useBookmarkStore();
  const { findShortcut } = useVoiceShortcutStore();

  const [showUrlBar, setShowUrlBar] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [commandInput, setCommandInput] = useState('');
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const statusOpacity = useRef(new Animated.Value(0)).current;

  const {
    isListening,
    transcript,
    interimTranscript,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition();

  useEffect(() => {
    addBrowsingHistory(currentUrl);
  }, []);

  const flashStatus = useCallback(() => {
    Animated.sequence([
      Animated.timing(statusOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(statusOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [statusOpacity]);

  const addLog = useCallback((msg: string) => {
    setAgentLog((prev) => [msg, ...prev].slice(0, 30));
  }, []);

  const handleSnapshot = useCallback(
    (snapshot: PageSnapshot) => {
      setPageSnapshot(snapshot);
      setPageTitle(snapshot.title);
      if (snapshot.url !== currentUrl) {
        setCurrentUrl(snapshot.url);
        setUrlInput(snapshot.url);
        addBrowsingHistory(snapshot.url);
      }
    },
    [currentUrl, setCurrentUrl, setPageSnapshot, setPageTitle, addBrowsingHistory]
  );

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, [setIsLoading, setError]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => {
      browserRef.current?.extractDOM();
    }, 300);
  }, [setIsLoading]);

  const handleError = useCallback(
    (errorMsg: string) => {
      setIsLoading(false);
      setError(errorMsg);
      speak('Page failed to load.');
    },
    [setIsLoading, setError]
  );

  const handleNavigationStateChange = useCallback(
    (navState: any) => {
      if (navState.url !== currentUrl) {
        setCurrentUrl(navState.url);
        setUrlInput(navState.url);
      }
    },
    [currentUrl, setCurrentUrl]
  );

  const executeAgentAction = useCallback(
    (action: AgentAction) => {
      addLog(`> ${action.action}: ${action.speak || ''}`);
      setAgentStatus(action.speak || action.action);
      flashStatus();

      switch (action.action) {
        case 'click':
        case 'type':
        case 'select':
        case 'scroll':
        case 'submit':
          browserRef.current?.executeAction(action);
          break;
        case 'navigate':
          setUrlInput(action.url);
          browserRef.current?.navigate(action.url);
          break;
        case 'back':
          browserRef.current?.goBack();
          break;
        case 'speak':
          speak(action.text, { rate: speechRate });
          break;
        case 'done':
          setIsAgentActive(false);
          speak(action.speak, { rate: speechRate });
          break;
      }
    },
    [addLog, setAgentStatus, flashStatus, speechRate, setIsAgentActive]
  );

  const processCommand = useCallback(
    (command: string) => {
      if (!command.trim()) return;

      addCommandHistory(command);
      addLog(`Command: ${command}`);

      // Check voice shortcuts
      const shortcut = findShortcut(command);
      if (shortcut) {
        speak(`Shortcut: ${shortcut.phrase}`);
        if (shortcut.action === 'navigate') {
          browserRef.current?.navigate(shortcut.target);
          return;
        }
      }

      // Bookmark commands
      if (/bookmark this|save this page|add bookmark/i.test(command)) {
        if (pageSnapshot) {
          const title = pageSnapshot.title || pageSnapshot.url;
          const url = pageSnapshot.url;
          if (isBookmarked(url)) {
            speak('This page is already bookmarked.');
          } else {
            addBookmark(title, url);
            speak(`Bookmarked: ${title}`);
          }
        } else {
          speak('No page loaded to bookmark.');
        }
        return;
      }

      if (/remove bookmark|unbookmark/i.test(command)) {
        if (pageSnapshot && isBookmarked(pageSnapshot.url)) {
          const bm = getBookmarkByUrl(pageSnapshot.url);
          if (bm) {
            removeBookmark(bm.id);
            speak('Bookmark removed.');
          }
        } else {
          speak('This page is not bookmarked.');
        }
        return;
      }

      // Page analysis
      if (/describe|what'?s on|what is on|analyze/i.test(command)) {
        if (pageSnapshot) {
          const summary = analyzePage(pageSnapshot);
          speak(summary, { rate: speechRate });
        }
        return;
      }

      // Standard agent processing
      setIsAgentActive(true);
      setAgentStatus('Thinking...');

      const intent = parseVoiceCommand(command);
      const snapshot = pageSnapshot;

      if (!snapshot) {
        speak('Page is still loading. Please wait.');
        setIsAgentActive(false);
        return;
      }

      const { action, isComplete, nextStep } = getAgentStep(intent, snapshot, 0);
      executeAgentAction(action);

      if (action.speak) {
        speak(action.speak, { rate: speechRate });
      }

      if (!isComplete && action.action !== 'done' && action.action !== 'speak') {
        setTimeout(() => {
          browserRef.current?.extractDOM();
          setTimeout(() => {
            const updatedSnapshot = useAppStore.getState().pageSnapshot;
            if (updatedSnapshot) {
              const step2 = getAgentStep(intent, updatedSnapshot, nextStep);
              executeAgentAction(step2.action);
              if (step2.action.speak) {
                speak(step2.action.speak, { rate: speechRate });
              }
            }
            setIsAgentActive(false);
          }, 800);
        }, 1500);
      } else {
        setTimeout(() => setIsAgentActive(false), 1000);
      }
    },
    [pageSnapshot, addCommandHistory, addLog, setIsAgentActive, setAgentStatus,
      executeAgentAction, speechRate, findShortcut, isBookmarked, addBookmark,
      removeBookmark, getBookmarkByUrl]
  );

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript) {
        processCommand(transcript);
      }
    } else {
      startListening({
        onResult: (text, isFinal) => {
          if (isFinal) {
            processCommand(text);
          }
        },
        onError: () => {
          speak('Voice error. Type your command instead.');
        },
      });
    }
  }, [isListening, transcript, startListening, stopListening, processCommand]);

  const handleSubmitCommand = useCallback(() => {
    if (commandInput.trim()) {
      processCommand(commandInput.trim());
      setCommandInput('');
    }
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
      if (bm) {
        removeBookmark(bm.id);
        speak('Bookmark removed');
      }
    } else {
      addBookmark(title, url);
      speak(`Bookmarked: ${title}`);
    }
  }, [pageSnapshot, isBookmarked, addBookmark, removeBookmark, getBookmarkByUrl]);

  const handleAction = useCallback((result: any) => {
    if (result.success) {
      addLog('Action completed');
    } else {
      addLog(`Action failed: ${result.error}`);
    }
  }, [addLog]);

  const bookmarked = pageSnapshot ? isBookmarked(pageSnapshot.url) : false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Go back to home"
        >
          <Ionicons name="home" size={22} color={COLORS.dark.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.urlBar}
          onPress={() => setShowUrlBar(!showUrlBar)}
          accessibilityLabel="Current URL"
          accessibilityHint="Tap to edit the web address"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.dark.primary} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="lock-closed" size={14} color={COLORS.dark.textMuted} style={{ marginRight: 8 }} />
          )}
          <Text style={styles.urlText} numberOfLines={1}>
            {pageTitle || currentUrl.replace(/^https?:\/\//, '').substring(0, 40)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleBookmark}
          style={[styles.navButton, bookmarked && styles.navButtonActive]}
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? COLORS.dark.primary : COLORS.dark.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => browserRef.current?.extractDOM()}
          style={styles.navButton}
          accessibilityLabel="Refresh page"
        >
          <Ionicons name="refresh" size={22} color={COLORS.dark.text} />
        </TouchableOpacity>
      </View>

      {/* URL Edit Bar */}
      {showUrlBar && (
        <View style={styles.urlEditBar}>
          <TextInput
            style={styles.urlInput}
            value={urlInput}
            onChangeText={setUrlInput}
            onSubmitEditing={handleSubmitUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            placeholder="Enter URL..."
            placeholderTextColor={COLORS.dark.textMuted}
            accessibilityLabel="Web address"
          />
          <TouchableOpacity onPress={handleSubmitUrl} style={styles.urlGoButton}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.dark.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Status Bar */}
      <Animated.View style={[styles.statusBar, { opacity: statusOpacity }]}>
        <Text style={styles.statusText}>{agentStatus}</Text>
      </Animated.View>

      {/* Browser */}
      <View style={styles.browserContainer}>
        <BrowserView
          ref={browserRef}
          url={currentUrl}
          onSnapshot={handleSnapshot}
          onAction={handleAction}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
        />
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => browserRef.current?.goBack()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.dark.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => browserRef.current?.goForward()}
            accessibilityLabel="Go forward"
          >
            <Ionicons name="arrow-forward" size={20} color={COLORS.dark.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              if (pageSnapshot) {
                const summary = analyzePage(pageSnapshot);
                speak(summary, { rate: speechRate });
              }
            }}
            accessibilityLabel="Describe page"
          >
            <Ionicons name="eye" size={20} color={COLORS.dark.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => stopSpeaking()}
            accessibilityLabel="Stop speaking"
          >
            <Ionicons name="volume-mute" size={20} color={COLORS.dark.warning} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, showAgentPanel && styles.quickActionActive]}
            onPress={() => setShowAgentPanel(!showAgentPanel)}
            accessibilityLabel="Toggle agent log"
          >
            <Ionicons name="terminal" size={20} color={showAgentPanel ? COLORS.dark.primary : COLORS.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Command Input + Voice */}
        <View style={styles.commandBar}>
          <VoiceButton
            isListening={isListening}
            interimText={interimTranscript}
            onPress={handleVoiceToggle}
            size={38}
          />
          <TextInput
            style={styles.commandInput}
            value={commandInput}
            onChangeText={setCommandInput}
            onSubmitEditing={handleSubmitCommand}
            placeholder="Say or type a command..."
            placeholderTextColor={COLORS.dark.textMuted}
            returnKeyType="send"
            accessibilityLabel="Command input"
            accessibilityHint="Type a command like go to amazon or search for headphones"
          />
          {commandInput.length > 0 && (
            <TouchableOpacity onPress={handleSubmitCommand} style={styles.sendButton}>
              <Ionicons name="send" size={18} color={COLORS.dark.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Agent Log Panel */}
        {showAgentPanel && (
          <View style={styles.agentPanel}>
            <Text style={styles.agentPanelTitle}>Agent Log</Text>
            {agentLog.length === 0 ? (
              <Text style={styles.agentPanelEmpty}>No actions yet</Text>
            ) : (
              agentLog.map((log, i) => (
                <Text key={i} style={styles.agentPanelLog}>
                  {log}
                </Text>
              ))
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
    gap: SPACING.xs,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: COLORS.dark.primary + '20',
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surfaceLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    height: 38,
  },
  urlText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.text,
  },
  urlEditBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  urlInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.dark.surfaceLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.sm,
    marginRight: SPACING.sm,
  },
  urlGoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    backgroundColor: COLORS.dark.primary,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 96 : 76,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  statusText: {
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  browserContainer: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: COLORS.dark.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  quickAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionActive: {
    backgroundColor: COLORS.dark.primary + '30',
    borderWidth: 1,
    borderColor: COLORS.dark.primary,
  },
  commandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  commandInput: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.dark.surfaceLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.md,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentPanel: {
    maxHeight: 150,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  agentPanelTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.dark.accent,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  agentPanelEmpty: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
    fontStyle: 'italic',
  },
  agentPanelLog: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
});
