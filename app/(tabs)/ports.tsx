
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | undefined) {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source;
}

export default function PortsScreen() {
  const { ports, loading } = useConferenceData();

  const openLink = (url?: string) => {
    if (url) {
      console.log('Opening port link:', url);
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ports</Text>
        <Text style={styles.headerSubtitle}>Participating ports</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ports.map((port, index) => {
          const portName = port.name;
          const hasLink = !!port.link;
          
          return (
            <React.Fragment key={index}>
              <View style={styles.portCard}>
                {port.logo && (
                  <Image
                    source={resolveImageSource(port.logo)}
                    style={styles.portLogo}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.portName}>{portName}</Text>
                {hasLink && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => openLink(port.link)}
                  >
                    <IconSymbol
                      ios_icon_name="link"
                      android_material_icon_name="link"
                      size={16}
                      color={colors.secondary}
                    />
                    <Text style={styles.linkButtonText}>Visit Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            </React.Fragment>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  portCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  portLogo: {
    width: 200,
    height: 100,
    marginBottom: 16,
  },
  portName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
});
