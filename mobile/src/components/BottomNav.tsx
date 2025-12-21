import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';

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
          <Text style={[styles.icon, isActive('/home') && styles.iconActive]}>🏠</Text>
          <Text style={[styles.label, isActive('/home') && styles.labelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Create Portrait Button (Center - Emphasized) */}
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => handleNavigation('/upload')}
        >
          <View style={styles.centerIconContainer}>
            <Text style={styles.centerIcon}>+</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('/profile')}
        >
          <Text style={[styles.icon, isActive('/profile') && styles.iconActive]}>👤</Text>
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
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  centerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#1E293B',
  },
  centerIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
});

