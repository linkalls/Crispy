curl -i -X POST https://misskeytsf.love/api/notes/local-timeline -H "Content-Type: application/json" -d '{"limit":25,"allowPartial":false,"withFiles":true,"withReplies":true,"withRenotes":true}'
echo ""
curl -i -X POST https://misskey.io/api/notes/local-timeline -H "Content-Type: application/json" -d '{"limit":25,"allowPartial":false,"withFiles":true,"withReplies":true,"withRenotes":true}'
