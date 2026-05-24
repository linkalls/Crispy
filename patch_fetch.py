import re

with open('src/hooks/useMisskey.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix activeAccount.host trailing slash just in case
search_host = """      const cli = new mk.api.APIClient({
        origin: `https://${activeAccount.host}`,
        credential: activeAccount.token || undefined
      });"""
replace_host = """      const hostUrl = activeAccount.host.replace(/\\/+$/, '');
      const cli = new mk.api.APIClient({
        origin: `https://${hostUrl}`,
        credential: activeAccount.token || undefined
      });"""
content = content.replace(search_host, replace_host)

with open('src/hooks/useMisskey.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("useMisskey.ts patched")
