async function test() {
  try {
    // Generate a ~5MB string
    const largeString = "a".repeat(5 * 1024 * 1024);
    const payload = "data:image/png;base64," + Buffer.from(largeString).toString('base64');
    
    console.log("Sending payload of length:", payload.length);
    
    const res = await fetch('http://localhost:3001/api/ai/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'screenshot', payload })
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
