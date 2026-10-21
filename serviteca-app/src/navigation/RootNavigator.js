// ============================================================
// SERVITECA JM - NAVEGACIÓN
// ============================================================
// Estructura:
//
// NavigationContainer
// └── Stack (header oculto)
//     ├── "Login"  -> LoginScreen        (si NO hay sesión)
//     └── "Main"   -> Bottom Tabs        (si hay sesión)
//         ├── "Inicio"    -> DashboardScreen
//         ├── "Solicitar" -> SolicitarMantenimientoScreen
//         └── "Vehiculos" -> VehiculosScreen
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../screens/LoginScreen';
import SolicitarMantenimientoScreen from '../screens/SolicitarMantenimientoScreen';
import VehiculosScreen from '../screens/VehiculosScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Inicio: 'home',
  Solicitar: 'construct',
  Vehiculos: 'car',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={TAB_ICONS[route.name] || 'apps'}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ title: 'Serviteca JM' }}
      />

      <Tab.Screen
        name="Solicitar"
        component={SolicitarMantenimientoScreen}
        options={{ title: 'Solicitar mantenimiento' }}
      />

      <Tab.Screen
        name="Vehiculos"
        component={VehiculosScreen}
        options={{ title: 'Mis vehículos' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  // Pantalla de arranque mientras se restaura la sesión
  if (loading) {
    return <Loader text="Iniciando Serviteca JM..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
