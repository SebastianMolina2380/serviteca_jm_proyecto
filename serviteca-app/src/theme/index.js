// ============================================================
// SERVITECA JM - TEMA (colores y utilidades visuales)
// ============================================================

export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  accent: '#F59E0B',
  background: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',
  dark: '#0F172A',
};

// Colores por estado (Servicio y Cita)
export const estadoColors = {
  PROGRAMADO: { bg: colors.infoLight, fg: colors.info },
  EN_PROCESO: { bg: colors.warningLight, fg: colors.warning },
  COMPLETADO: { bg: colors.successLight, fg: colors.success },
  COMPLETADA: { bg: colors.successLight, fg: colors.success },
  CANCELADO: { bg: colors.dangerLight, fg: colors.danger },
  CANCELADA: { bg: colors.dangerLight, fg: colors.danger },
  PENDIENTE: { bg: colors.warningLight, fg: colors.warning },
  CONFIRMADO: { bg: colors.primaryLight, fg: colors.primaryDark },
};

export const rolLabels = {
  CLIENTE: 'Cliente',
  TECNICO: 'Técnico',
  ADMIN: 'Administrador',
};

export default { colors, estadoColors, rolLabels };
