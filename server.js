const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = __dirname;
const { handleWaitlistSignup, isValidEmail } = require("./api/waitlist");

const port = Number(process.env.PORT || 56321);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};
const allowedStaticFiles = new Set([
  "dashboard-img.png",
  "index.html",
  "script.js",
  "styles.css",
]);

const serveStaticFile = (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));

  if (!allowedStaticFiles.has(requestedPath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const filePath = path.join(rootDir, requestedPath);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(content);
  });
};

const createServer = () => http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/waitlist") {
    handleWaitlistSignup(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStaticFile(request, response);
    return;
  }

  response.writeHead(405, { Allow: "GET, POST" });
  response.end("Method not allowed");
});

if (require.main === module) {
  createServer().listen(port, () => {
    console.log(`MarketDesk waitlist running at http://localhost:${port}`);
  });
}

module.exports = {
  createServer,
  handleWaitlistSignup,
  isValidEmail,
};
