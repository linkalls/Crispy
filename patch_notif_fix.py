import re

with open('src/screens/NotificationsScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """    let userName = targetUser?.name || targetUser?.username || '不明';"""
replace = """    let userName = targetUser?.name || targetUser?.username;
    if (!userName && item.type.startsWith('app')) {
      userName = item.header || 'システム通知';
    }
    userName = userName || '不明';"""

content = content.replace(search, replace)

search2 = """  if (type.startsWith('reaction')) return { name: 'heart', color: '#ff6b6b' };
  if (type.startsWith('renote')) return { name: 'repeat', color: '#51cf66' };
  switch (type) {"""
replace2 = """  if (type.startsWith('reaction')) return { name: 'heart', color: '#ff6b6b' };
  if (type.startsWith('renote')) return { name: 'repeat', color: '#51cf66' };
  switch (type) {
    case 'app':
    case 'login':
      return { name: 'information-circle', color: '#4dabf7' };"""

content = content.replace(search2, replace2)

search3 = """  if (type.startsWith('reaction')) return `${reaction || ''} リアクションしました`;
  if (type.startsWith('renote')) return 'リノートしました';
  switch (type) {"""
replace3 = """  if (type.startsWith('reaction')) return `${reaction || ''} リアクションしました`;
  if (type.startsWith('renote')) return 'リノートしました';
  switch (type) {
    case 'app':
      return 'システムからのお知らせ';
    case 'login':
      return '新しいログインがありました';"""

content = content.replace(search3, replace3)

with open('src/screens/NotificationsScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Notifications patched.")
