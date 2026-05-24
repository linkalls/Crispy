with open('App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = app_content.replace(
    "import { ColorScheme, MisskeyNote, MisskeyNotification, MisskeyMiAuthCheck, StoredAccount, TimelineTab } from './src/utils/types';",
    "import { ColorScheme, MisskeyNote, MisskeyNotification, MisskeyMiAuthCheck, StoredAccount, TimelineTab } from './src/utils/types';\nimport { ReactionListModal } from './src/components/ReactionListModal';"
)

app_content = app_content.replace(
    "const [isReactionPickerVisible, setIsReactionPickerVisible] = useState(false);",
    "const [isReactionPickerVisible, setIsReactionPickerVisible] = useState(false);\n  const [isReactionListVisible, setIsReactionListVisible] = useState(false);\n  const [selectedNoteForReactionList, setSelectedNoteForReactionList] = useState<TimelineNote | null>(null);"
)

app_content = app_content.replace(
    """      <ReactionPickerModal
        visible={isReactionPickerVisible}
        note={selectedNoteForReaction}
        colors={colors}
        onClose={() => {
          setIsReactionPickerVisible(false);
          setSelectedNoteForReaction(null);
        }}
        onSelectReaction={(note, reaction) => {
          performReaction(note, reaction);
        }}
      />""",
    """      <ReactionPickerModal
        visible={isReactionPickerVisible}
        note={selectedNoteForReaction}
        colors={colors}
        onClose={() => {
          setIsReactionPickerVisible(false);
          setSelectedNoteForReaction(null);
        }}
        onSelectReaction={(note, reaction) => {
          performReaction(note, reaction);
        }}
      />

      <ReactionListModal
        visible={isReactionListVisible}
        note={selectedNoteForReactionList}
        colors={colors}
        misskeyRequest={misskeyRequest}
        onClose={() => {
          setIsReactionListVisible(false);
          setSelectedNoteForReactionList(null);
        }}
      />"""
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)
print("App.tsx patched to include ReactionListModal")
