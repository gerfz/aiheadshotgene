import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface LoadingScreenProps {
  isReady?: boolean; // Signal when app is ready to show
  onLoadingComplete?: () => void; // Callback when loading animation completes
}

const LOADING_MESSAGES = [
  'Initializing Act...',
  'Loading your workspace...',
  'Preparing magic...',
  'Almost ready...',
];

export function LoadingScreen({ isReady = false, onLoadingComplete }: LoadingScreenProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [displayProgress, setDisplayProgress] = useState(0);
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  
  useEffect(() => {
    // Spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Smooth fake progress - 0 to 100 over 17 seconds
    // Updates every 170ms for smooth animation
    intervalRef.current = setInterval(() => {
      progressRef.current += 1; // Increment by 1% every 170ms = 100% in 17 seconds
      
      if (progressRef.current >= 100) {
        progressRef.current = 100;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      
      setDisplayProgress(progressRef.current);
    }, 170); // Update every 170ms (17 seconds total)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // When app is ready, speed up to 100% if not already there
  useEffect(() => {
    if (isReady && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      
      // If we're past 50%, jump to 100% immediately
      if (progressRef.current >= 50) {
        console.log('⚡ App ready at', progressRef.current, '% - completing immediately');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setDisplayProgress(100);
        
        // Small delay to show 100% before transitioning
        setTimeout(() => {
          onLoadingComplete?.();
        }, 200);
      } else {
        // If below 50%, speed up to 100%
        console.log('⚡ App ready at', progressRef.current, '% - speeding up');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Speed up: go to 100% in remaining time
        const speedUpInterval = setInterval(() => {
          progressRef.current += 5; // 5% every 170ms = fast completion
          
          if (progressRef.current >= 100) {
            progressRef.current = 100;
            clearInterval(speedUpInterval);
            setDisplayProgress(100);
            
            setTimeout(() => {
              onLoadingComplete?.();
            }, 200);
          } else {
            setDisplayProgress(progressRef.current);
          }
        }, 170);
      }
    }
  }, [isReady, onLoadingComplete]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Auto-select message based on progress
  const autoMessage = LOADING_MESSAGES[Math.min(Math.floor(displayProgress / 25), LOADING_MESSAGES.length - 1)];

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Animated Logo/Spinner */}
          <View style={styles.loaderContainer}>
            <Animated.View
              style={[
                styles.spinner,
                {
                  transform: [{ rotate: spin }, { scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.spinnerInner} />
            </Animated.View>
            
            {/* Pulse rings */}
            <View style={[styles.pulseRing, styles.pulseRing1]} />
            <View style={[styles.pulseRing, styles.pulseRing2]} />
          </View>

          {/* Title */}
          <Text style={styles.title}>AI Portrait Studio</Text>

          {/* Dynamic message */}
          <Text style={styles.message}>{autoMessage}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(displayProgress, 100)}%`,
                  },
                ]}
              />
              <View style={styles.progressShine} />
            </View>
            <Text style={styles.progressText}>{Math.round(displayProgress)}%</Text>
          </View>

          {/* Helpful tip */}
          <Text style={styles.tip}>
            {displayProgress < 50 
              ? 'Setting up your AI studio...'
              : 'Almost there! Hang tight...'
            }
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  loaderContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  spinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#6366F1',
    borderTopColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  pulseRing1: {
    width: 100,
    height: 100,
  },
  pulseRing2: {
    width: 120,
    height: 120,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 32,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  tip: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

