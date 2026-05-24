with open('src/hooks/useMisskey.ts', 'r', encoding='utf-8') as f:
    content = f.read()

search = """      const result = await cli.request(endpoint as any, payload as any);
      return (result || {}) as T;"""
replace = """      // mk.api.APIClient falls back to GET if the endpoint is not registered in endpointReqTypes (which includes 'notes/local-timeline').
      // To strictly use POST for all Misskey APIs, we bypass this issue by explicitly hitting the endpoint using fetch with POST if needed,
      // or relying on our endpoint stripping. However, since misskey-js's `request` method has this bug, we use a custom POST call for missing endpoints.
      const method = endpoint.startsWith('drive/files/') ? 'multipart/form-data' : 'application/json';
      let result;
      try {
        result = await cli.request(endpoint as any, payload as any);
      } catch (e: any) {
        if (e.message?.includes('Cannot GET')) {
          // Fallback manual POST request if misskey-js made a GET request incorrectly
          const res = await fetch(`https://${hostUrl}/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, i: activeAccount.token })
          });
          if (!res.ok) throw new Error(`API Error: ${res.status}`);
          result = await res.json();
        } else {
          throw e;
        }
      }
      return (result || {}) as T;"""

content = content.replace(search, replace)

with open('src/hooks/useMisskey.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("useMisskey.ts patched again")
