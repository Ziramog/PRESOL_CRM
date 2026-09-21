import https from 'https';

function getFinalUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', res.headers.location);
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else {
        resolve(url);
      }
    });
  });
}

const url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ5ZCDtsDzzZURo3JM_IxuSRo&query=3C+Biog%C3%A1s+S.A.';
getFinalUrl(url).then(final => console.log('Final:', final));
