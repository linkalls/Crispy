import * as mk from 'misskey-js';
const cli = new mk.api.APIClient({
  origin: 'https://misskey.io',
  credential: 'token'
});
console.log(Object.keys(cli));
