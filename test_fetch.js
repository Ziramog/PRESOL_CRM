async function test() {
  const res = await fetch('http://localhost:3000/api/export-prospects');
  console.log(res.status);
  const blob = await res.blob();
  console.log('Size:', blob.size);
}
test();
