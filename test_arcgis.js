import https from 'https';

const query = encodeURIComponent('3C Biogás S.A., Alcira Gigena, Córdoba, Argentina');
const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${query}&maxLocations=1`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.candidates && json.candidates.length > 0) {
      console.log('ArcGIS Found:', json.candidates[0].location);
    } else {
      console.log('ArcGIS Not Found');
    }
  });
});
