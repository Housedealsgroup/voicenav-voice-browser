// VoiceNav Voice Profiles — v10
// User voice profiles for personalized recognition
// Adapts to user's speech patterns, speed, and vocabulary

import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VoiceProfile = {
  id: string;
  name: string;
  createdAt: number;
  lastUsed: number;
  settings: {
    speechRate: number;
    pitch: number;
    language: string;
    volume: number;
  };
  vocabulary: Record<string, number>; // word -> frequency
  commandPatterns: Record<string, number>; // pattern -> count
  avgCommandLength: number;
  totalCommands: number;
  preferredIntents: Record<string, number>; // intent -> count
};

const PROFILES_KEY = 'voicenav-voice-profiles';
const ACTIVE_PROFILE_KEY = 'voicenav-active-profile';

const profiles: Map<string, VoiceProfile> = new Map();
let activeProfileId: string | null = null;

export async function loadProfiles(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    if (data) {
      const parsed: VoiceProfile[] = JSON.parse(data);
      profiles.clear();
      for (const p of parsed) {
        profiles.set(p.id, p);
      }
    }

    const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeId && profiles.has(activeId)) {
      activeProfileId = activeId;
    }
  } catch (e) {
    logger.error('Failed to load voice profiles', e);
  }
}

async function saveProfiles(): Promise<void> {
  try {
    const data = JSON.stringify(Array.from(profiles.values()));
    await AsyncStorage.setItem(PROFILES_KEY, data);
    if (activeProfileId) {
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    }
  } catch (e) {
    logger.error('Failed to save voice profiles', e);
  }
}

export function createProfile(name: string, settings?: Partial<VoiceProfile['settings']>): VoiceProfile {
  const profile: VoiceProfile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    settings: {
      speechRate: settings?.speechRate ?? 1.0,
      pitch: settings?.pitch ?? 1.0,
      language: settings?.language ?? 'en-US',
      volume: settings?.volume ?? 1.0,
    },
    vocabulary: {},
    commandPatterns: {},
    avgCommandLength: 0,
    totalCommands: 0,
    preferredIntents: {},
  };

  profiles.set(profile.id, profile);
  saveProfiles();

  logger.agent('voiceProfiles', { event: 'create', name, id: profile.id });
  return profile;
}

export function deleteProfile(id: string): boolean {
  const deleted = profiles.delete(id);
  if (deleted) {
    if (activeProfileId === id) {
      activeProfileId = profiles.size > 0 ? (profiles.keys().next().value ?? null) : null;
    }
    saveProfiles();
  }
  return deleted;
}

export function setActiveProfile(id: string): boolean {
  if (!profiles.has(id)) return false;
  activeProfileId = id;
  const profile = profiles.get(id)!;
  profile.lastUsed = Date.now();
  saveProfiles();
  logger.agent('voiceProfiles', { event: 'activate', name: profile.name });
  return true;
}

export function getActiveProfile(): VoiceProfile | null {
  if (!activeProfileId) return null;
  return profiles.get(activeProfileId) || null;
}

export function getAllProfiles(): VoiceProfile[] {
  return Array.from(profiles.values());
}

export function updateProfileSettings(id: string, settings: Partial<VoiceProfile['settings']>): boolean {
  const profile = profiles.get(id);
  if (!profile) return false;

  Object.assign(profile.settings, settings);
  saveProfiles();
  return true;
}

export function recordCommand(command: string, intent?: string): void {
  const profile = getActiveProfile();
  if (!profile) return;

  profile.totalCommands++;
  profile.lastUsed = Date.now();

  // Update vocabulary
  const words = command.toLowerCase().split(/\s+/);
  for (const word of words) {
    profile.vocabulary[word] = (profile.vocabulary[word] || 0) + 1;
  }

  // Update command patterns
  const pattern = words.slice(0, 2).join(' ');
  profile.commandPatterns[pattern] = (profile.commandPatterns[pattern] || 0) + 1;

  // Update avg command length
  profile.avgCommandLength = (profile.avgCommandLength * (profile.totalCommands - 1) + words.length) / profile.totalCommands;

  // Update preferred intents
  if (intent) {
    profile.preferredIntents[intent] = (profile.preferredIntents[intent] || 0) + 1;
  }

  saveProfiles();
}

export function getProfileSuggestions(profile: VoiceProfile): string[] {
  const suggestions: string[] = [];

  // Top command patterns
  const topPatterns = Object.entries(profile.commandPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pattern]) => pattern);

  if (topPatterns.length > 0) {
    suggestions.push(`You often say: "${topPatterns.join('", "')}"`);
  }

  // Top intents
  const topIntents = Object.entries(profile.preferredIntents)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([intent]) => intent);

  if (topIntents.length > 0) {
    suggestions.push(`Your most used commands: ${topIntents.join(', ')}`);
  }

  // Speed suggestion
  if (profile.avgCommandLength > 5) {
    suggestions.push('Try shorter commands for faster recognition.');
  }

  return suggestions;
}

export function getTopVocabulary(profile: VoiceProfile, limit = 20): Array<{ word: string; count: number }> {
  return Object.entries(profile.vocabulary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export function exportProfile(id: string): string | null {
  const profile = profiles.get(id);
  if (!profile) return null;
  return JSON.stringify(profile, null, 2);
}

export function importProfile(json: string): VoiceProfile | null {
  try {
    const profile = JSON.parse(json) as VoiceProfile;
    if (!profile.id || !profile.name) return null;
    profiles.set(profile.id, profile);
    saveProfiles();
    return profile;
  } catch {
    return null;
  }
}

export function resetProfile(id: string): boolean {
  const profile = profiles.get(id);
  if (!profile) return false;

  profile.vocabulary = {};
  profile.commandPatterns = {};
  profile.avgCommandLength = 0;
  profile.totalCommands = 0;
  profile.preferredIntents = {};
  saveProfiles();

  return true;
}
