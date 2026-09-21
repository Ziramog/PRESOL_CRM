import https from 'https';

const url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ5ZCDtsDzzZURo3JM_IxuSRo&query=3C+Biog%C3%A1s+S.A.';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Let's look for lat/lng patterns in the HTML
    const match = data.match(/@(-?\d+\.\d+),(-?\d+\.\d+),/);
    if (match) {
      console.log('Coordinates found in HTML:', match[1], match[2]);
    } else {
      console.log('No coords in HTML. Length:', data.length);
      // print first 500 chars to see what it is
      console.log(data.substring(0, 500));
    }
  });
});
