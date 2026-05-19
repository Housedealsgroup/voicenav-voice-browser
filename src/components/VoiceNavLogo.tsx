import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle, Path, Line, Text as SvgText } from 'react-native-svg';

interface VoiceNavLogoProps {
  size?: number;
}

export default function VoiceNavLogo({ size = 120 }: VoiceNavLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 1024 1024">
        <Defs>
          <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0a0a1a" />
            <Stop offset="50%" stopColor="#0d0d24" />
            <Stop offset="100%" stopColor="#111133" />
          </LinearGradient>
          <RadialGradient id="bgGlow" cx="50%" cy="35%" r="60%">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#0a0a1a" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="micBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#e0e7ff" />
            <Stop offset="100%" stopColor="#a5b4fc" />
          </LinearGradient>
          <LinearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#6366f1" />
            <Stop offset="50%" stopColor="#818cf8" />
            <Stop offset="100%" stopColor="#6366f1" />
          </LinearGradient>
          <LinearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#818cf8" stopOpacity="0.1" />
            <Stop offset="50%" stopColor="#c7d2fe" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <Stop offset="50%" stopColor="#818cf8" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect width="1024" height="1024" rx="220" fill="url(#bg)" />
        <Rect width="1024" height="1024" rx="220" fill="url(#bgGlow)" />

        {/* Outer ring */}
        <Circle cx="512" cy="460" r="320" fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" opacity="0.3" />
        <Circle cx="512" cy="460" r="320" fill="none" stroke="url(#ringGrad)" strokeWidth="6" opacity="0.06" strokeDasharray="4 16" />

        {/* Middle ring */}
        <Circle cx="512" cy="460" r="260" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.15" />

        {/* Inner glow */}
        <Circle cx="512" cy="440" r="180" fill="#6366f1" opacity="0.06" />

        {/* Sound waves — left */}
        <Path d="M200 340 Q170 460 200 580" fill="none" stroke="url(#waveGrad)" strokeWidth="7" strokeLinecap="round" opacity="0.25" />
        <Path d="M240 360 Q218 460 240 560" fill="none" stroke="url(#waveGrad)" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
        <Path d="M280 385 Q265 460 280 535" fill="none" stroke="url(#waveGrad)" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <Path d="M315 400 Q305 460 315 520" fill="none" stroke="url(#waveGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.75" />

        {/* Sound waves — right */}
        <Path d="M824 340 Q854 460 824 580" fill="none" stroke="url(#waveGrad)" strokeWidth="7" strokeLinecap="round" opacity="0.25" />
        <Path d="M784 360 Q806 460 784 560" fill="none" stroke="url(#waveGrad)" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
        <Path d="M744 385 Q759 460 744 535" fill="none" stroke="url(#waveGrad)" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <Path d="M709 400 Q719 460 709 520" fill="none" stroke="url(#waveGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.75" />

        {/* Microphone */}
        <Rect x="464" y="320" width="96" height="180" rx="48" fill="url(#micBody)" />
        <Line x1="484" y1="370" x2="540" y2="370" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5" />
        <Line x1="484" y1="395" x2="540" y2="395" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5" />
        <Line x1="484" y1="420" x2="540" y2="420" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5" />
        <Line x1="484" y1="445" x2="540" y2="445" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5" />
        <Line x1="484" y1="470" x2="540" y2="470" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5" />

        {/* Mic arc + stand + base */}
        <Path d="M385 545 Q385 640 512 640 Q639 640 639 545" fill="none" stroke="#c7d2fe" strokeWidth="8" strokeLinecap="round" />
        <Line x1="512" y1="640" x2="512" y2="695" stroke="#c7d2fe" strokeWidth="8" strokeLinecap="round" />
        <Line x1="465" y1="695" x2="559" y2="695" stroke="#c7d2fe" strokeWidth="8" strokeLinecap="round" />

        {/* Recording dot */}
        <Circle cx="512" cy="300" r="12" fill="#ef4444" />
        <Circle cx="512" cy="300" r="18" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.4" />

        {/* Accent line */}
        <Rect x="312" y="760" width="400" height="3" rx="1.5" fill="url(#accentLine)" opacity="0.4" />

        {/* Text */}
        <SvgText x="512" y="820" textAnchor="middle" fontFamily="System" fontSize="76" fontWeight="800" fill="#f8fafc" letterSpacing="10">VOICENAV</SvgText>
        <SvgText x="512" y="862" textAnchor="middle" fontFamily="System" fontSize="19" fill="#a5b4fc" letterSpacing="14" fontWeight="600">VOICE BROWSER</SvgText>
        <SvgText x="512" y="900" textAnchor="middle" fontFamily="System" fontSize="13" fill="rgba(248,250,252,0.35)" letterSpacing="4">by HouseDealsGroup</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
