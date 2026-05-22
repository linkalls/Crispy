import re

with open('src/screens/NotificationsScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """function getNotificationMessage(type: string, reaction?: string): string {
  switch (type) {
    case 'reaction':
      return `${reaction || ''} リアクションしました`;
    case 'reply':
      return '返信しました';
    case 'renote':
      return 'リノートしました';
    case 'quote':
      return '引用しました';
    case 'follow':
      return 'フォローしました';
    case 'mention':
      return 'メンションしました';
    case 'pollEnded':
      return '投票が終了しました';
    default:
      return '通知';
  }
}"""

replace = """function getNotificationMessage(type: string, reaction?: string): string {
  if (type.startsWith('reaction')) return `${reaction || ''} リアクションしました`;
  if (type.startsWith('renote')) return 'リノートしました';
  switch (type) {
    case 'reply':
      return '返信しました';
    case 'quote':
      return '引用しました';
    case 'follow':
      return 'フォローしました';
    case 'receiveFollowRequest':
      return 'フォローリクエストが届きました';
    case 'followRequestAccepted':
      return 'フォローリクエストが承認されました';
    case 'mention':
      return 'メンションしました';
    case 'pollEnded':
      return '投票が終了しました';
    case 'achievementEarned':
      return '実績を解除しました';
    default:
      return '通知';
  }
}"""

content = content.replace(search, replace)

with open('src/screens/NotificationsScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("NotificationsScreen.tsx message patched.")
