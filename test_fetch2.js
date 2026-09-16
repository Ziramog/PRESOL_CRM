async function test() {
  const res = await fetch('http://localhost:3000/api/export-prospects');
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
test();
