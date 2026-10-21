// Insignia que muestra el estado de un servicio o cita.

import { StyleSheet, Text, View } from 'react-native';

import { colors, estadoColors } from '../theme';

export default function EstadoBadge({ estado }) {
  const config = estadoColors[estado] || {
    bg: colors.background,
    fg: colors.textMuted,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.fg }]}>
        {String(estado || '').replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
