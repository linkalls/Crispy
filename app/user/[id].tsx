import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGlobalState } from '../../src/context/GlobalState';
import ProfileScreen from '../../app/(tabs)/profile';

export default function UserProfileStackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeAccount, colors } = useGlobalState();
  const decodedId = typeof id === 'string' ? decodeURIComponent(id) : id;

  if (!activeAccount) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileScreen viewingUserId={decodedId} />
    </View>
  );
}