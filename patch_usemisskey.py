import re

with open('src/hooks/useMisskey.ts', 'r', encoding='utf-8') as f:
    content = f.read()

search = """        if (path.includes('timeline')) {"""
replace = """        if (path === '/api/notes/search') {
          return [
            {
              id: 'mock_search_1',
              createdAt: new Date().toISOString(),
              text: `「${(payload.query as string) || ''}」の検索結果のモックです！`,
              user: {
                id: 'mock_user_search',
                name: 'Searcher',
                username: 'searcher',
                avatarUrl: 'https://sushi.ski/identicon/searcher',
                host: null,
              },
              repliesCount: 0,
              renotesCount: 0,
              reactions: {},
            }
          ] as unknown as T;
        }
        if (path.includes('timeline')) {"""

content = content.replace(search, replace)

with open('src/hooks/useMisskey.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("useMisskey.ts patched.")
