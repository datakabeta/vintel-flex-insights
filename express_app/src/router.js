const Router = require("express").Router;
const router = new Router();

const { vintel } = require("./controller");
console.log("Router file loading");

// Middleware to handle pre-flight requests
router.options('/get-redacted-recording', (req, res) => {
  // Set the necessary CORS headers
  res.setHeader('ngrok-skip-browser-warning', '69420');
  res.setHeader('Access-Control-Allow-Origin', 'https://flex.twilio.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '-1');
  
  
  // Respond with a 200 status code
  res.sendStatus(200);
});

// Define the route
router.get('/get-redacted-recording', (req, res) => {
  console.log("rcvd request headers",req.headers);
  // Call the vintel function with the JSON object
  vintel(req.query, (headers, media_url) => {
    // Set the HTTP headers
    res.set(headers);
    res.sendStatus(200);
    // Send the JSON object as the response
    res.json(media_url);
    

    console.log("response headers ",res);
  });
});

module.exports = router;
