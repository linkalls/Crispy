import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """        <ExploreScreen
          colors={colors}
          activeAccount={activeAccount}
          misskeyRequest={misskeyRequest}
          onNotePress={(note) => {
            setSelectedNoteForDetail(note);
            setIsDetailModalVisible(true);
          }}
          onReplyPress={(noteOrId) => {
            const note = typeof noteOrId === 'string' ? notes.find((n) => n.id === noteOrId) : noteOrId;
            if (note) {
              setReplyingNoteId(note.id);
              setIsReplyComposerVisible(true);
              setReplyText(`@${note.user.username} `);
            }
          }}
          onRenotePress={handleRenoteOptions}
          onSharePress={handleShare}
          onReactionPress={handleReactionToggle}
        />"""

replace = """        <ExploreScreen
          colors={colors}
          activeAccount={activeAccount}
          misskeyRequest={misskeyRequest}
          onNotePress={(note) => {
            setSelectedNoteForDetail(note);
            setIsDetailModalVisible(true);
          }}
          onReplyPress={(noteOrId) => {
            const note = typeof noteOrId === 'string' ? notes.find((n) => n.id === noteOrId) : noteOrId;
            if (note) {
              setSelectedNoteForDetail(note as any);
              setIsDetailModalVisible(true);
            }
          }}
          onRenotePress={handleRenoteOptions}
          onSharePress={handleShare}
          onReactionPress={handleReactionToggle}
        />"""

content = content.replace(search, replace)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/screens/ExploreScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search_explore = """        <Timeline
          notes={notes}
          colors={colors}
          onRefresh={handleSearch}
          onEndReached={() => {}}
          onNotePress={onNotePress}
          onReplyPress={onReplyPress}
          onRenotePress={onRenotePress}
          onSharePress={onSharePress}
          onReactionPress={onReactionPress}
        />"""

replace_explore = """        <Timeline
          notes={notes}
          isLoading={loading}
          isRefreshing={loading}
          error={null}
          replyingNoteId={null}
          replyText=""
          isSendingReply={false}
          colors={colors}
          onRefresh={handleSearch}
          onReplyTextChange={() => {}}
          onReplySubmit={() => {}}
          onNotePress={onNotePress}
          onReplyPress={onReplyPress}
          onRenotePress={onRenotePress}
          onSharePress={onSharePress}
          onReactionPress={onReactionPress}
        />"""

content = content.replace(search_explore, replace_explore)

with open('src/screens/ExploreScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Explore patched.")
