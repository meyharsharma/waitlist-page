const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const jsonResponse = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

const readRequestBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 16_384) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });

const getRequestPayload = async (request) => {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const body = typeof request.body === "string" ? request.body : await readRequestBody(request);
  return JSON.parse(body);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const handleWaitlistSignup = async (request, response) => {
  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "POST" });
    response.end("Method not allowed");
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    jsonResponse(response, 500, {
      error: "Server is missing Supabase environment variables.",
    });
    return;
  }

  let payload;

  try {
    payload = await getRequestPayload(request);
  } catch {
    jsonResponse(response, 400, { error: "Invalid signup request." });
    return;
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();

  if (!name || !email) {
    jsonResponse(response, 400, { error: "Please enter your name and email." });
    return;
  }

  if (!isValidEmail(email)) {
    jsonResponse(response, 400, { error: "Please enter a valid email address." });
    return;
  }

  try {
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ name, email }),
    });

    if (insertResponse.status === 409) {
      jsonResponse(response, 409, {
        error: "This email is already on the waitlist.",
      });
      return;
    }

    if (!insertResponse.ok) {
      const error = await insertResponse.json().catch(() => ({}));

      if (error.code === "23505") {
        jsonResponse(response, 409, {
          error: "This email is already on the waitlist.",
        });
        return;
      }

      jsonResponse(response, 502, {
        error: "Could not join the waitlist right now.",
      });
      return;
    }

    jsonResponse(response, 201, { message: "You are on the waitlist." });
  } catch {
    jsonResponse(response, 502, {
      error: "Could not reach the waitlist service.",
    });
  }
};

module.exports = handleWaitlistSignup;
module.exports.handleWaitlistSignup = handleWaitlistSignup;
module.exports.isValidEmail = isValidEmail;
