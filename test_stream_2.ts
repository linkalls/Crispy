import * as mk from 'misskey-js';
const stream = new mk.Stream('https://misskey.io', { token: 'token' });
console.log(Object.keys(stream));
