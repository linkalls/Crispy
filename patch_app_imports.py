with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing import for ReactionListModal
if "ReactionListModal" not in content[:1000]:
    content = content.replace(
        "import { ReactionPickerModal } from './src/components';",
        "import { ReactionPickerModal } from './src/components';\nimport { ReactionListModal } from './src/components/ReactionListModal';"
    )

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
