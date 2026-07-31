import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: "Test" })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get('content-type'));
    console.log("Response text:", text.substring(0, 500));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
test();
