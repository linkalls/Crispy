import https from 'https';

https.get('https://misskey-hub.net/docs/api/endpoints/i/notifications.html', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data.slice(0, 1000));
  });
});
