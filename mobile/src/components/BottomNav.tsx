import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const BottomNav = () => {
  const pathname = usePathname();

  const handleNavigation = (route: string) => {
    if (pathname !== route) {
      router.push(route as any);
    }
  };

  const isActive = (route: string) => {
    if (route === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname === route;
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {/* Home Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('/home')}
        >
          <Ionicons 
            name={isActive('/home') ? "home" : "home-outline"} 
            size={24} 
            color={isActive('/home') ? "#FFFFFF" : "#9CA3AF"} 
          />
          <Text style={[styles.label, isActive('/home') && styles.labelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Create / Plus Button */}
        <TouchableOpacity
          style={styles.centerButtonContainer}
          onPress={() => handleNavigation('/upload')}
        >
          <View style={styles.plusButtonMain}>
            <Ionicons name="add" size={22} color="#000000" style={styles.plusIcon} />
          </View>
          <Text style={[styles.label, styles.labelCreate]}>Create</Text>
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('/profile')}
        >
          <Ionicons 
            name={isActive('/profile') ? "person" : "person-outline"} 
            size={24} 
            color={isActive('/profile') ? "#FFFFFF" : "#9CA3AF"} 
          />
          <Text style={[styles.label, isActive('/profile') && styles.labelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000', // Pitch black like TikTok
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 60,
  },
  label: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Custom Plus Button Styles
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  plusButtonMain: {
    width: 45,
    height: 32,
    backgroundColor: '#FFFFFF', // White
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontWeight: 'bold',
  },
  labelCreate: {
    color: '#FFFFFF', // Always white for emphasis
    fontWeight: '600',
  }
});

