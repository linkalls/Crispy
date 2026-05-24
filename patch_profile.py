import re

with open('src/screens/ProfileScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for tabs and lists
search_state = "const [refreshing, setRefreshing] = useState(false);"
replace_state = """const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'following' | 'followers'>('notes');
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);"""
content = content.replace(search_state, replace_state)

# Add load data to loadProfile
search_load = """        const targetUserId = viewingUserId || activeAccount.userId;
        const [userInfo, userNotes] = await Promise.all([
          misskeyRequest<UserProfile>('/api/users/show', { userId: targetUserId }, true),
          misskeyRequest<any[]>('/api/users/notes', { userId: targetUserId, limit: 20 }, true),
        ]);
        setProfile(userInfo);
        setNotes(userNotes.map((n) => mapNote(n, activeAccount.host)));"""
replace_load = """        const targetUserId = viewingUserId || activeAccount.userId;
        const [userInfo, userNotes, followingRes, followersRes] = await Promise.all([
          misskeyRequest<UserProfile>('/api/users/show', { userId: targetUserId }, true),
          misskeyRequest<any[]>('/api/users/notes', { userId: targetUserId, limit: 20 }, true),
          misskeyRequest<any[]>('/api/users/following', { userId: targetUserId, limit: 30 }, true),
          misskeyRequest<any[]>('/api/users/followers', { userId: targetUserId, limit: 30 }, true),
        ]);
        setProfile(userInfo);
        setNotes(userNotes.map((n) => mapNote(n, activeAccount.host)));
        setFollowing(followingRes.map((f: any) => f.followee));
        setFollowers(followersRes.map((f: any) => f.follower));"""
content = content.replace(search_load, replace_load)

# Add tabs to header
search_tabs = """        {/* Divider */}
        <View style={[localStyles.divider, { backgroundColor: colors.border }]} />

        <Text style={[localStyles.sectionTitle, { color: colors.text }]}>投稿</Text>
      </View>
    </View>
  );"""
replace_tabs = """        {/* Divider */}
        <View style={[localStyles.divider, { backgroundColor: colors.border }]} />

        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
          <Pressable onPress={() => setActiveTab('notes')}>
            <Text style={[localStyles.sectionTitle, { color: activeTab === 'notes' ? colors.primary : colors.textMuted }]}>投稿</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('following')}>
            <Text style={[localStyles.sectionTitle, { color: activeTab === 'following' ? colors.primary : colors.textMuted }]}>フォロー</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('followers')}>
            <Text style={[localStyles.sectionTitle, { color: activeTab === 'followers' ? colors.primary : colors.textMuted }]}>フォロワー</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );"""
content = content.replace(search_tabs, replace_tabs)

# Modify FlatList render based on activeTab
search_flatlist = """  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      renderItem={renderNote}
      ListHeaderComponent={renderHeader}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>投稿はまだありません</Text>
        </View>
      }
    />
  );"""

replace_flatlist = """  const renderUser = ({ item }: { item: any }) => (
    <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => onUserPress?.(item.id)}>
      <Image source={{ uri: item.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }} style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }} numberOfLines={1}>{item.name || item.username}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14 }} numberOfLines={1}>@{item.username}{item.host ? `@${item.host}` : ''}</Text>
        {item.description && <Text style={{ color: colors.text, fontSize: 14, marginTop: 4 }} numberOfLines={2}>{item.description}</Text>}
      </View>
    </Pressable>
  );

  return (
    <FlatList
      data={activeTab === 'notes' ? notes : activeTab === 'following' ? following : followers}
      keyExtractor={(item) => item.id}
      renderItem={activeTab === 'notes' ? renderNote : renderUser}
      ListHeaderComponent={renderHeader}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>{activeTab === 'notes' ? '投稿はまだありません' : 'ユーザーがいません'}</Text>
        </View>
      }
    />
  );"""
content = content.replace(search_flatlist, replace_flatlist)

with open('src/screens/ProfileScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("ProfileScreen.tsx patched for Following/Followers")
