import re

with open('src/screens/NotificationsScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """          {
            id: 'notif_1',
            type: 'reaction',"""

replace = """          {
            id: 'notif_grouped_1',
            type: 'reaction:grouped',
            createdAt: new Date(Date.now() - 60000).toISOString(),
            reactions: [
              { user: { id: 'u0', name: 'Zack', username: 'zack', avatarUrl: 'https://sushi.ski/identicon/zack' }, reaction: '❤️' },
              { user: { id: 'u1', name: 'Alice', username: 'alice', avatarUrl: 'https://sushi.ski/identicon/alice' }, reaction: '❤️' },
            ],
            note: { id: 'n0', text: 'すごい！' },
          },
          {
            id: 'notif_1',
            type: 'reaction',"""

content = content.replace(search, replace)

with open('src/screens/NotificationsScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("NotificationsScreen.tsx mock patched.")
