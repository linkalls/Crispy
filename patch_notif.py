import re

with open('src/screens/NotificationsScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update MisskeyNotification type
search_type = """type MisskeyNotification = {
  id: string;
  type: string;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    username: string;
    host?: string | null;
    avatarUrl?: string | null;
  };
  note?: {
    id: string;
    text?: string | null;
  };
  reaction?: string;
};"""

replace_type = """type MisskeyUser = {
  id: string;
  name?: string | null;
  username: string;
  host?: string | null;
  avatarUrl?: string | null;
};

type MisskeyNotification = {
  id: string;
  type: string;
  createdAt: string;
  user?: MisskeyUser;
  note?: {
    id: string;
    text?: string | null;
  };
  reaction?: string;
  reactions?: Array<{
    user: MisskeyUser;
    reaction: string;
  }>;
  users?: Array<MisskeyUser>;
};"""

content = content.replace(search_type, replace_type)


# Update getNotificationIcon
search_icon = """function getNotificationIcon(type: string): { name: string; color: string } {
  switch (type) {
    case 'reaction':
      return { name: 'heart', color: '#ff6b6b' };
    case 'reply':
      return { name: 'chatbubble', color: '#4dabf7' };
    case 'renote':
      return { name: 'repeat', color: '#51cf66' };
    case 'quote':
      return { name: 'chatbubble-ellipses', color: '#845ef7' };
    case 'follow':
      return { name: 'person-add', color: '#339af0' };
    case 'mention':
      return { name: 'at', color: '#f59f00' };
    case 'pollEnded':
      return { name: 'bar-chart', color: '#20c997' };
    default:
      return { name: 'notifications', color: '#868e96' };
  }
}"""

replace_icon = """function getNotificationIcon(type: string): { name: string; color: string } {
  if (type.startsWith('reaction')) return { name: 'heart', color: '#ff6b6b' };
  if (type.startsWith('renote')) return { name: 'repeat', color: '#51cf66' };
  switch (type) {
    case 'reply':
      return { name: 'chatbubble', color: '#4dabf7' };
    case 'quote':
      return { name: 'chatbubble-ellipses', color: '#845ef7' };
    case 'follow':
    case 'receiveFollowRequest':
    case 'followRequestAccepted':
      return { name: 'person-add', color: '#339af0' };
    case 'mention':
      return { name: 'at', color: '#f59f00' };
    case 'pollEnded':
      return { name: 'bar-chart', color: '#20c997' };
    case 'achievementEarned':
      return { name: 'trophy', color: '#fcc419' };
    default:
      return { name: 'notifications', color: '#868e96' };
  }
}"""

content = content.replace(search_icon, replace_icon)

# Update renderNotification
search_render = """  const renderNotification = ({ item }: { item: MisskeyNotification }) => {
    const icon = getNotificationIcon(item.type);
    const message = getNotificationMessage(item.type, item.reaction);
    const userName = item.user?.name || item.user?.username || '不明';
    const userHost = item.user?.host ? `@${item.user.host}` : '';

    return (
      <View style={[localStyles.notifItem, { borderBottomColor: colors.border }]}>
        <View style={localStyles.iconWrap}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        <Image
          source={{ uri: item.user?.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }}
          style={localStyles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={[localStyles.userName, { color: colors.text }]} numberOfLines={1}>
            {userName}
            <Text style={{ color: colors.textMuted, fontWeight: '400', fontSize: 13 }}> @{item.user?.username}{userHost}</Text>
          </Text>
          <Text style={[localStyles.message, { color: colors.textMuted }]}>{message}</Text>
          {item.note?.text && (
            <Text style={[localStyles.notePreview, { color: colors.text }]} numberOfLines={2}>
              {item.note.text}
            </Text>
          )}
          <Text style={[localStyles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };"""

replace_render = """  const renderNotification = ({ item }: { item: MisskeyNotification }) => {
    const icon = getNotificationIcon(item.type);

    let targetUser = item.user;
    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 0) {
      targetUser = item.reactions[item.reactions.length - 1].user;
    } else if (item.type === 'renote:grouped' && item.users && item.users.length > 0) {
      targetUser = item.users[item.users.length - 1];
    }

    let message = getNotificationMessage(item.type, item.reaction);
    let userName = targetUser?.name || targetUser?.username || '不明';
    let userHost = targetUser?.host ? `@${targetUser.host}` : '';
    let suffix = '';

    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 1) {
      suffix = ` ほか${item.reactions.length - 1}人`;
      message = `${item.reactions.length}件のリアクション`;
    } else if (item.type === 'renote:grouped' && item.users && item.users.length > 1) {
      suffix = ` ほか${item.users.length - 1}人`;
      message = `${item.users.length}件のリノート`;
    }

    return (
      <View style={[localStyles.notifItem, { borderBottomColor: colors.border }]}>
        <View style={localStyles.iconWrap}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        <Image
          source={{ uri: targetUser?.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default' }}
          style={localStyles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={[localStyles.userName, { color: colors.text }]} numberOfLines={1}>
            {userName}
            <Text style={{ color: colors.textMuted, fontWeight: '400', fontSize: 13 }}>{suffix} @{targetUser?.username}{userHost}</Text>
          </Text>
          <Text style={[localStyles.message, { color: colors.textMuted }]}>{message}</Text>
          {item.note?.text && (
            <Text style={[localStyles.notePreview, { color: colors.text }]} numberOfLines={2}>
              {item.note.text}
            </Text>
          )}
          <Text style={[localStyles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };"""

content = content.replace(search_render, replace_render)

with open('src/screens/NotificationsScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("NotificationsScreen.tsx patched.")
