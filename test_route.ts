import { GET } from './src/app/api/export-prospects/route.ts';
async function test() {
  const res = await GET();
  const blob = await res.blob();
  console.log('Blob size:', blob.size);
  const text = await blob.text();
  console.log('Text start:', text.substring(0, 50));
}
test();
