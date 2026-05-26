import { Tabs } from 'expo-router';
import { BottomNavigation } from '../../src/components';
import { useGlobalState } from '../../src/context/GlobalState';
import { MainScreenTab } from '../../src/utils/types';

export default function TabsLayout() {
  const { colors } = useGlobalState();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        // Map the route name to our MainScreenTab type
        const routeName = props.state.routes[props.state.index].name;
        let activeTab: MainScreenTab = 'home';
        if (routeName === 'explore') activeTab = 'explore';
        if (routeName === 'notifications') activeTab = 'notifications';
        if (routeName === 'profile') activeTab = 'profile';

        return (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (tab === 'home') props.navigation.navigate('index');
              else props.navigation.navigate(tab);
            }}
            colors={colors}
          />
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
