with open('src/components/NoteDetailModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """  onReactionPress: (note: import("../utils/types").TimelineNote) => void;
  onRenotePress: (note: import("../utils/types").TimelineNote) => void;"""

if search in content:
    content = content.replace(search, """  onReactionPress: (note: import("../utils/types").TimelineNote) => void;
  onReactionListPress?: (note: import("../utils/types").TimelineNote) => void;
  onRenotePress: (note: import("../utils/types").TimelineNote) => void;""")
else:
    # Look for alternative formatting
    search2 = """  onReactionPress: (note: TimelineNote) => void;
  onRenotePress: (note: TimelineNote) => void;"""
    if search2 in content:
        content = content.replace(search2, """  onReactionPress: (note: TimelineNote) => void;
  onReactionListPress?: (note: TimelineNote) => void;
  onRenotePress: (note: TimelineNote) => void;""")
    else:
        print("Could not find the props signature to inject onReactionListPress")

with open('src/components/NoteDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

if "import { ReactionListModal } from './src/components/ReactionListModal';" not in app_content:
    print("ReactionListModal not imported in App.tsx")
