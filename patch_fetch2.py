import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search_auth = """      const checkResponse = await fetch(`https://${host}/api/miauth/${session}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!checkResponse.ok) {
        throw new Error(`セッション確認失敗: ${checkResponse.status}`);
      }

      const auth = (await checkResponse.json()) as MisskeyMiAuthCheck;"""

replace_auth = """      const checkResponse = await fetch(`https://${host.replace(/\\/+$/, '')}/api/miauth/${session}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!checkResponse.ok) {
        throw new Error(`セッション確認失敗: ${checkResponse.status}`);
      }

      const auth = (await checkResponse.json()) as MisskeyMiAuthCheck;"""

content = content.replace(search_auth, replace_auth)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("App.tsx patched")
