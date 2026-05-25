import * as mk from 'misskey-js';

const client = new mk.api.APIClient({
  origin: 'https://misskey.io',
  credential: 'dummy_token'
});

try {
    const res = client.request('notes/create' as any, {
        text: '',
        visibility: 'public',
        fileIds: ['123', '456']
    } as any);
    res.then(console.log).catch(console.error);
} catch (e) {
    console.log("Error:", e);
}
