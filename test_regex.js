import https from 'https';

const url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ5ZCDtsDzzZURo3JM_IxuSRo&query=3C+Biog%C3%A1s+S.A.';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/2d(-?\d+\.\d+)%213d(-?\d+\.\d+)/);
    if (match) {
      console.log('Found Lng:', match[1], 'Lat:', match[2]);
    } else {
      console.log('Not found');
    }
  });
});
