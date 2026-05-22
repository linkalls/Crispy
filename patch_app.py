import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix handleReactionToggle
search = """    try {
      await misskeyRequest(
        nextReacted ? '/api/notes/reactions/create' : '/api/notes/reactions/delete',
        {
          noteId,
          reaction: target.emoji,
        },
        true
      );
    } catch (error) {"""
replace = """    try {
      await misskeyRequest(
        nextReacted ? '/api/notes/reactions/create' : '/api/notes/reactions/delete',
        nextReacted ? { noteId, reaction: target.emoji } : { noteId },
        true
      );
    } catch (error) {"""

content = content.replace(search, replace)

# Fix performReaction
search2 = """  const performReaction = async (note: TimelineNote, reaction: string) => {
    if (!activeAccount) return;
    try {
      await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction }, true);
      showToast('成功', 'リアクションしました。');
      loadTimeline(true);
    } catch (error) {"""
replace2 = """  const performReaction = async (note: TimelineNote, reaction: string) => {
    if (!activeAccount) return;
    try {
      const existingReaction = note.reactions.find(r => r.reacted);
      if (existingReaction) {
        if (existingReaction.emoji === reaction) return; // Already reacted with this
        await misskeyRequest('/api/notes/reactions/delete', { noteId: note.targetId }, true);
      }
      await misskeyRequest('/api/notes/reactions/create', { noteId: note.targetId, reaction }, true);
      showToast('成功', 'リアクションしました。');
      loadTimeline(true);
    } catch (error) {"""

content = content.replace(search2, replace2)

# Fix ExploreScreen rendering
search3 = """{mainTab === 'explore' && <ExploreScreen colors={colors} />}"""
replace3 = """{mainTab === 'explore' && (
        <ExploreScreen
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
        />
      )}"""

content = content.replace(search3, replace3)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx patched.")
