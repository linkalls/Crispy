with open('App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = app_content.replace(
    """        onReactionPress={handleReactionToggle}
        onRenotePress={handleRenoteOptions}""",
    """        onReactionPress={handleReactionToggle}
        onReactionListPress={(note) => {
          setSelectedNoteForReactionList(note);
          setIsReactionListVisible(true);
        }}
        onRenotePress={handleRenoteOptions}"""
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)
print("App.tsx patched for reaction props")
