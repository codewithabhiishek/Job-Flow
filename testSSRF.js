import { UrlExtractor } from './api/urlExtractor.js';
const extractor = new UrlExtractor();
async function test() {
  try {
    await extractor.extract('http://localhost:3001/api/jobs');
    console.log("FAIL: localhost allowed");
  } catch(e) {
    console.log("PASS localhost:", e.message);
  }
  try {
    await extractor.extract('http://169.254.169.254/latest/meta-data');
    console.log("FAIL: AWS Metadata allowed");
  } catch(e) {
    console.log("PASS AWS:", e.message);
  }
  try {
    await extractor.extract('http://10.0.0.1/admin');
    console.log("FAIL: 10.x allowed");
  } catch(e) {
    console.log("PASS 10.x:", e.message);
  }
}
test();
