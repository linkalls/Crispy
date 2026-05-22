import re

with open('src/screens/NotificationsScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """    let message = getNotificationMessage(item.type, item.reaction);
    let userName = targetUser?.name || targetUser?.username || '不明';
    let userHost = targetUser?.host ? `@${targetUser.host}` : '';
    let suffix = '';

    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 1) {
      suffix = ` ほか${item.reactions.length - 1}人`;
      message = `${item.reactions.length}件のリアクション`;
    } else if (item.type === 'renote:grouped' && item.users && item.users.length > 1) {
      suffix = ` ほか${item.users.length - 1}人`;
      message = `${item.users.length}件のリノート`;
    }"""

replace = """    let reactionEmoji = item.reaction;
    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 0) {
      reactionEmoji = item.reactions[item.reactions.length - 1].reaction;
    }

    let message = getNotificationMessage(item.type, reactionEmoji);
    let userName = targetUser?.name || targetUser?.username || '不明';
    let userHost = targetUser?.host ? `@${targetUser.host}` : '';
    let suffix = '';

    if (item.type === 'reaction:grouped' && item.reactions && item.reactions.length > 1) {
      suffix = ` ほか${item.reactions.length - 1}人`;
      message = `${item.reactions.length}件のリアクション`;
    } else if (item.type === 'renote:grouped' && item.users && item.users.length > 1) {
      suffix = ` ほか${item.users.length - 1}人`;
      message = `${item.users.length}件のリノート`;
    }"""

content = content.replace(search, replace)

with open('src/screens/NotificationsScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("NotificationsScreen.tsx message patched 2.")
