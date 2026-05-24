with open('src/components/NoteDetailModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    """<Text style={[styles.mainNoteStatCount, { color: colors.text }]}>{note.reactionsCount || note.reactions.reduce((sum, r) => sum + r.count, 0)}</Text>
                    <Text style={[styles.mainNoteStatText, { color: colors.textMuted }]}>リアクション</Text>""",
    """<Pressable onPress={() => onReactionListPress && onReactionListPress(note)} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                      <Text style={[styles.mainNoteStatCount, { color: colors.text }]}>{note.reactionsCount || note.reactions.reduce((sum, r) => sum + r.count, 0)}</Text>
                      <Text style={[styles.mainNoteStatText, { color: colors.textMuted }]}>リアクション</Text>
                    </Pressable>"""
)

# Also need to add onReactionListPress to the props of NoteDetailModal.tsx
search_props = """  onReactionPress: (note: TimelineNote) => void;
  onRenotePress: (note: TimelineNote) => void;"""
replace_props = """  onReactionPress: (note: TimelineNote) => void;
  onReactionListPress?: (note: TimelineNote) => void;
  onRenotePress: (note: TimelineNote) => void;"""
content = content.replace(search_props, replace_props)

search_destruct = """  onReactionPress,
  onRenotePress,"""
replace_destruct = """  onReactionPress,
  onReactionListPress,
  onRenotePress,"""
content = content.replace(search_destruct, replace_destruct)

with open('src/components/NoteDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("NoteDetailModal patched for reaction list")
