const http = require('http');

async function test() {
  try {
    const largeString = "a".repeat(1 * 1024 * 1024); // 1MB
    const payload = "data:image/png;base64," + Buffer.from(largeString).toString('base64');
    
    // We don't have the Vercel production URL, but we can test if local express 
    // ever serves index.html. (It shouldn't, because it has no static middleware).
    
    console.log("Local Express has no static middleware, so if Vercel serves index.html, it's definitely Vercel's routing layer falling back to the SPA rewrite.");
  } catch (err) {
    console.error(err);
  }
}
test();
