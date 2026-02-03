const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Read the content script
const contentScriptPath = path.join(__dirname, '../content.js');
const contentScript = fs.readFileSync(contentScriptPath, 'utf8');

// Read mock HTML
const mockHtmlPath = path.join(__dirname, 'mock_linkedin.html');
const mockHtml = fs.readFileSync(mockHtmlPath, 'utf8');

// Setup JSDOM
const dom = new JSDOM(mockHtml, {
    url: "https://www.linkedin.com/jobs/view/123456",
    runScripts: "dangerously",
    resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;

// Mock chrome API
global.chrome = {
    runtime: {
        onMessage: {
            addListener: () => { }
        }
    }
};

// We need to inject the content script logic. 
// Since content.js is not a module export, we'll eval it or copy the function.
// For simplicity, let's just copy the critical function here or eval the script.
eval(contentScript);

// Now run the extraction
try {
    const data = extractLinkedInJobData();
    console.log("TEST RESULT:", JSON.stringify(data, null, 2));

    // Assertion
    if (data.title === "Senior Software Engineer" &&
        data.company === "TechCorp Inc." &&
        data.location === "San Francisco, CA") {
        console.log("PASS: Extraction Logic Works");
    } else {
        console.error("FAIL: Extraction Logic Failed");
        process.exit(1);
    }

} catch (e) {
    console.error("Error running usage:", e);
    process.exit(1);
}
