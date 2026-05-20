import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function App() {
  const [activeTab, setActiveTab] = useState('local');
  const [notes, setNotes] = useState(initialNotes);

  const tabStyles = useMemo(
    () => ({
      home: activeTab === 'home' ? styles.tabButtonActiveHome : null,
      local: activeTab === 'local' ? styles.tabButtonActiveLocal : null,
      global: activeTab === 'global' ? styles.tabButtonActiveGlobal : null,
    }),
    [activeTab]
  );

  const handleReactionClick = (noteId, reactionIndex) => {
    setNotes((currentNotes) =>
      currentNotes.map((note) => {
        if (note.id !== noteId) return note;
        const newReactions = [...note.reactions];
        const currentReaction = newReactions[reactionIndex];
        const nextReacted = !currentReaction.reacted;
        newReactions[reactionIndex] = {
          ...currentReaction,
          reacted: nextReacted,
          count: currentReaction.count + (nextReacted ? 1 : -1),
        };
        return { ...note, reactions: newReactions };
      })
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.phoneFrame}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarGlowWrap}>
              <View style={styles.avatarGlow} />
              <Image
                source={{ uri: meAvatar }}
                style={styles.myAvatar}
                resizeMode="cover"
              />
            </View>

            <Text style={styles.logoText}>Crispy</Text>

            <Pressable style={styles.menuButton}>
              <Ionicons name="menu" size={20} color="#cbd5e1" />
            </Pressable>
          </View>

          <View style={styles.tabCapsule}>
            <Pressable
              onPress={() => setActiveTab('home')}
              style={[styles.tabButton, tabStyles.home]}
            >
              <Ionicons
                name="home-outline"
                size={14}
                color={activeTab === 'home' ? '#A3E635' : '#64748b'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'home' && styles.tabLabelActiveHome,
                ]}
              >
                HOME
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('local')}
              style={[styles.tabButton, tabStyles.local]}
            >
              <Ionicons
                name="flash-outline"
                size={14}
                color={activeTab === 'local' ? '#FACC15' : '#64748b'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'local' && styles.tabLabelActiveLocal,
                ]}
              >
                LOCAL
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('global')}
              style={[styles.tabButton, tabStyles.global]}
            >
              <Ionicons
                name="earth-outline"
                size={14}
                color={activeTab === 'global' ? '#22D3EE' : '#64748b'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'global' && styles.tabLabelActiveGlobal,
                ]}
              >
                GLOBAL
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.timeline}
          contentContainerStyle={styles.timelineContent}
          showsVerticalScrollIndicator={false}
        >
          {notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              {note.renote && (
                <View style={styles.renoteLabel}>
                  <Ionicons name="repeat" size={12} color="#34d399" />
                  <Text style={styles.renoteText}>{note.renote.user} がリノート</Text>
                </View>
              )}

              <View style={styles.noteRow}>
                <Image source={{ uri: note.user.avatar }} style={styles.noteAvatar} />

                <View style={styles.noteMain}>
                  <View style={styles.noteHead}>
                    <Text style={styles.noteName} numberOfLines={1}>
                      {note.user.name}
                    </Text>
                    <Text style={styles.noteUsername} numberOfLines={1}>
                      {note.user.username}
                    </Text>
                    <Text style={styles.hostChip}>@{note.user.host}</Text>
                  </View>

                  <Text style={styles.noteContent}>{note.content}</Text>

                  <View style={styles.reactionDeck}>
                    {note.reactions.map((reaction, index) => (
                      <Pressable
                        key={`${note.id}-${reaction.emoji}-${index}`}
                        onPress={() => handleReactionClick(note.id, index)}
                        style={[
                          styles.reactionButton,
                          reaction.reacted && styles.reactionButtonActive,
                        ]}
                      >
                        <Text
                          style={
                            reaction.isCustom
                              ? styles.reactionEmojiCustom
                              : styles.reactionEmoji
                          }
                        >
                          {reaction.emoji}
                        </Text>
                        <Text style={styles.reactionCount}>{reaction.count}</Text>
                      </Pressable>
                    ))}

                    <Pressable style={styles.addReactionButton}>
                      <Ionicons name="add" size={14} color="#94a3b8" />
                    </Pressable>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={16} color="#94a3b8" />
                      <Text style={styles.actionText}>
                        {note.replies > 0 ? note.replies : ''}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.actionButton}>
                      <Ionicons name="repeat" size={16} color="#94a3b8" />
                      <Text style={styles.actionText}>
                        {note.renotes > 0 ? note.renotes : ''}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.actionButton}>
                      <Ionicons name="heart-outline" size={16} color="#94a3b8" />
                    </Pressable>
                    <Pressable style={styles.actionButtonRight}>
                      <Ionicons name="ellipsis-horizontal" size={16} color="#94a3b8" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Pressable style={styles.fab}>
          <Ionicons name="add" size={28} color="#0f172a" />
        </Pressable>

        <View style={styles.bottomNavWrap}>
          <View style={styles.bottomNav}>
            <Pressable style={styles.bottomNavItemActive}>
              <View style={styles.bottomNavHomeBubble}>
                <Ionicons name="home" size={20} color="#a3e635" />
              </View>
            </Pressable>
            <Pressable style={styles.bottomNavItem}>
              <MaterialCommunityIcons
                name="pound"
                size={20}
                color="#94a3b8"
              />
            </Pressable>
            <Pressable style={styles.bottomNavItem}>
              <View>
                <Ionicons name="notifications-outline" size={20} color="#94a3b8" />
                <View style={styles.notifyDot} />
              </View>
            </Pressable>
            <Pressable style={styles.bottomNavItem}>
              <Image source={{ uri: meAvatar }} style={styles.profileAvatar} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    maxHeight: 900,
    backgroundColor: '#0f172a',
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarGlowWrap: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#84cc16',
    opacity: 0.35,
    transform: [{ scale: 1.15 }],
  },
  myAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#A3E635',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCapsule: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabButtonActiveHome: {
    backgroundColor: '#1e293b',
  },
  tabButtonActiveLocal: {
    backgroundColor: '#1e293b',
  },
  tabButtonActiveGlobal: {
    backgroundColor: '#1e293b',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  tabLabelActiveHome: {
    color: '#A3E635',
  },
  tabLabelActiveLocal: {
    color: '#FACC15',
  },
  tabLabelActiveGlobal: {
    color: '#22D3EE',
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#1e293b88',
    borderWidth: 1,
    borderColor: '#334155aa',
    borderRadius: 24,
    padding: 14,
  },
  renoteLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingLeft: 4,
  },
  renoteText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  noteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#334155',
  },
  noteMain: {
    flex: 1,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  noteName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 88,
  },
  noteUsername: {
    color: '#94a3b8',
    fontSize: 11,
    maxWidth: 72,
  },
  hostChip: {
    color: '#cbd5e1',
    backgroundColor: '#334155',
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noteContent: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  reactionDeck: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#02061788',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 6,
    marginBottom: 10,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#33415588',
    borderRadius: 10,
  },
  reactionButtonActive: {
    backgroundColor: '#84cc1633',
    borderWidth: 1,
    borderColor: '#84cc1650',
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionEmojiCustom: {
    fontSize: 10,
    color: '#e2e8f0',
    backgroundColor: '#1e293b',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  reactionCount: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 22,
  },
  actionButtonRight: {
    marginLeft: 'auto',
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  bottomSpacer: {
    height: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#84cc16',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 30,
  },
  bottomNavWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    zIndex: 25,
  },
  bottomNav: {
    height: 64,
    borderRadius: 24,
    backgroundColor: '#1e293bee',
    borderWidth: 1,
    borderColor: '#33415588',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  bottomNavItem: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavItemActive: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavHomeBubble: {
    backgroundColor: '#84cc1633',
    borderRadius: 14,
    padding: 8,
  },
  notifyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ec4899',
    position: 'absolute',
    right: -2,
    top: -1,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
  },
});

const meAvatar =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Poteto&backgroundColor=b6e3f4';

const initialNotes = [
  {
    id: 1,
    user: {
      name: 'Poteto',
      username: '@poteto',
      host: 'misskey.io',
      avatar:
        'https://api.dicebear.com/9.x/avataaars/svg?seed=Poteto&backgroundColor=b6e3f4',
    },
    content:
      'Blueskyっぽさは捨てた！！これならどうだ！？😎🍟\nMisskeyの良さってもっとごちゃごちゃしてて自由なとこだよね！',
    time: '1分前',
    renote: null,
    reactions: [
      { emoji: '🍟', count: 99, reacted: true },
      { emoji: '天才', count: 42, reacted: false, isCustom: true },
      { emoji: 'わかる', count: 15, reacted: true, isCustom: true },
      { emoji: '🎉', count: 7, reacted: false },
    ],
    replies: 4,
    renotes: 2,
  },
  {
    id: 2,
    user: {
      name: 'サイバーねこ',
      username: '@cyber_cat',
      host: 'misskey.io',
      avatar:
        'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=ffb8b8',
    },
    content:
      'LTL（ローカルタイムライン）の流速早すぎて草\nみんな起きてるの？にゃーん🐈‍⬛✨',
    time: '5分前',
    renote: null,
    reactions: [
      { emoji: '草', count: 128, reacted: false, isCustom: true },
      { emoji: '🐈‍⬛', count: 56, reacted: true },
      { emoji: '起きてるよ', count: 12, reacted: false, isCustom: true },
    ],
    replies: 12,
    renotes: 3,
  },
  {
    id: 3,
    user: {
      name: 'お絵かきマン',
      username: '@draw',
      host: 'sushi.ski',
      avatar:
        'https://api.dicebear.com/9.x/avataaars/svg?seed=Art&backgroundColor=c0aede',
    },
    content: '進捗どうですか...？（震え声）',
    time: '15分前',
    renote: {
      user: 'Poteto',
    },
    reactions: [
      { emoji: '偉業', count: 88, reacted: true, isCustom: true },
      { emoji: '👀', count: 30, reacted: false },
      { emoji: '🙏', count: 10, reacted: false },
    ],
    replies: 5,
    renotes: 45,
  },
];
