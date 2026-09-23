const http = require("http");
const next = require("next");

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res));

  // Passenger "reverse port binding": no uses process.env.PORT
  if (typeof PhusionPassenger !== "undefined") {
    console.log("Running under Passenger: listen('passenger')");
    server.listen("passenger");
  } else {
    // Fallback solo si lo corrés a mano por SSH
    //   const port = Number(process.env.APP_PORT || 3000);
    //   console.log("Running standalone on port:", port);
    //   server.listen(port, "127.0.0.1");
  }
});
