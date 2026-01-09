
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardContent() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  const adminSections = [
    {
      title: 'Sponsors',
      description: 'Manage conference sponsors and tiers',
      icon: 'star',
      route: '/admin/sponsors',
      color: colors.primary,
    },
    {
      title: 'Exhibitors',
      description: 'Manage exhibitor listings and booth assignments',
      icon: 'store',
      route: '/admin/exhibitors',
      color: colors.secondary,
    },
    {
      title: 'Speakers',
      description: 'Manage speaker profiles and information',
      icon: 'person',
      route: '/admin/speakers',
      color: colors.accent,
    },
    {
      title: 'Sessions',
      description: 'Manage conference sessions and schedule',
      icon: 'calendar-today',
      route: '/admin/sessions',
      color: colors.primary,
    },
    {
      title: 'Rooms',
      description: 'Manage venue rooms and locations',
      icon: 'place',
      route: '/admin/rooms',
      color: colors.secondary,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.replace('/admin/login' as any);
  };

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mobileWarning}>
          <IconSymbol
            ios_icon_name="info"
            android_material_icon_name="info"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.mobileWarningTitle}>Admin Panel</Text>
          <Text style={styles.mobileWarningText}>
            The admin panel is only available on web. Please access this page from a desktop browser.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Port of the Future Conference 2026</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back, {user?.email || 'Admin'}</Text>
          <Text style={styles.welcomeSubtext}>
            Manage all aspects of the conference from this dashboard
          </Text>
        </View>

        <View style={styles.grid}>
          {adminSections.map((section, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(section.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: section.color }]}>
                  <IconSymbol
                    ios_icon_name={section.icon}
                    android_material_icon_name={section.icon}
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDescription}>{section.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardLink}>Manage</Text>
                  <IconSymbol
                    ios_icon_name="arrow-forward"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={section.color}
                  />
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          style={styles.backToAppButton}
          onPress={() => router.push('/(tabs)/' as any)}
        >
          <IconSymbol
            ios_icon_name="arrow-back"
            android_material_icon_name="arrow-back"
            size={16}
            color={colors.secondary}
          />
          <Text style={styles.backToAppText}>Back to Conference App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <DashboardContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  card: {
    width: 'calc(33.333% - 14px)',
    minWidth: 280,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  backToAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backToAppText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  mobileWarning: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  mobileWarningTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  mobileWarningText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
