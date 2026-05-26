import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name:       string;
  title:      string;
  icon:       IoniconName;
  iconActive: IoniconName;
}

const TABS: TabConfig[] = [
  {
    name:       'index',
    title:      'Home',
    icon:       'home-outline',
    iconActive: 'home',
  },
  {
    name:       'collection',
    title:      'Coleção',
    icon:       'albums-outline',
    iconActive: 'albums',
  },
  {
    name:       'profile',
    title:      'Perfil',
    icon:       'person-outline',
    iconActive: 'person',
  },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   Colors.gold,
        tabBarInactiveTintColor: Colors.ash,
        tabBarStyle: {
          backgroundColor:  Colors.surface,
          borderTopColor:   Colors.border,
          borderTopWidth:   1,
          paddingBottom:    4,
          paddingTop:       4,
          height:           60,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
        headerStyle:      { backgroundColor: Colors.surface },
        headerTintColor:  Colors.snow,
        headerTitleStyle: { fontWeight: '700', color: Colors.snow },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
