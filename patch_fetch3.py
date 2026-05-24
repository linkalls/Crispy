with open('src/components/NoteComposerModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """      const response = await fetch(`https://${activeAccount.host}/api/drive/files/create`, {"""
replace = """      const hostUrl = activeAccount.host.replace(/\\/+$/, '');
      const response = await fetch(`https://${hostUrl}/api/drive/files/create`, {"""

content = content.replace(search, replace)

with open('src/components/NoteComposerModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("NoteComposerModal.tsx patched")
