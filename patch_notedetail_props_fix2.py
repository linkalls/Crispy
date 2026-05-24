with open('src/components/NoteDetailModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """  onReactionPress: (noteOrId: string | TimelineNote, reactionIndex: number) => Promise<void>;
  onRenotePress: (note: TimelineNote) => void;"""

replace = """  onReactionPress: (noteOrId: string | TimelineNote, reactionIndex: number) => Promise<void>;
  onReactionListPress?: (note: TimelineNote) => void;
  onRenotePress: (note: TimelineNote) => void;"""

content = content.replace(search, replace)

with open('src/components/NoteDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
