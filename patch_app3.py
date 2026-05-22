import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """    try {
      await misskeyRequest(
        nextReacted ? '/api/notes/reactions/create' : '/api/notes/reactions/delete',
        nextReacted ? { noteId, reaction: target.emoji } : { noteId },
        true
      );
    } catch (error) {"""

replace = """    try {
      await misskeyRequest(
        nextReacted ? '/api/notes/reactions/create' : '/api/notes/reactions/delete',
        nextReacted ? { noteId: note.targetId, reaction: target.emoji } : { noteId: note.targetId },
        true
      );
    } catch (error) {"""

content = content.replace(search, replace)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx targetId patched.")
