const signupForm = document.querySelector(".signup-form");
const nameInput = document.querySelector("#signup-name");
const emailInput = document.querySelector("#signup-email");
const companyInput = document.querySelector("#signup-company");
const signupSubmit = document.querySelector(".signup-submit");
const signupMessage = document.querySelector("[data-signup-message]");

const JOINED_KEY = "marketdesk_waitlist_joined";

const setSignupMessage = (message, type = "error") => {
  signupMessage.textContent = message;
  signupMessage.dataset.state = type;
};

// Once this browser has joined, keep the form locked so it can't resubmit on
// reload or repeated clicks. (Client-side convenience; the server rate limit and
// the email UNIQUE constraint are the real guards.)
let alreadyJoined = false;
try {
  alreadyJoined = localStorage.getItem(JOINED_KEY) === "1";
} catch {
  alreadyJoined = false;
}

const lockForm = (message) => {
  signupSubmit.disabled = true;
  signupSubmit.textContent = "Joined ✓";
  if (message) setSignupMessage(message, "success");
};

if (alreadyJoined) {
  lockForm("You're already on the waitlist.");
}

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (alreadyJoined) {
    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || !email) {
    setSignupMessage("Please enter your name and email.");
    return;
  }

  if (name.length > 100) {
    setSignupMessage("Please enter a shorter name.");
    nameInput.focus();
    return;
  }

  if (email.length > 254 || !emailInput.validity.valid) {
    setSignupMessage("Please enter a valid email address.");
    emailInput.focus();
    return;
  }

  signupSubmit.disabled = true;
  signupSubmit.textContent = "Submitting...";
  setSignupMessage("", "idle");

  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, company: companyInput ? companyInput.value : "" }),
    });
    const result = await response.json();

    if (!response.ok) {
      setSignupMessage(result.error || "Could not join the waitlist right now.");
      return;
    }

    alreadyJoined = true;
    try {
      localStorage.setItem(JOINED_KEY, "1");
    } catch {
      /* storage unavailable (private mode); the success message still shows */
    }
    signupForm.reset();
    lockForm(result.message || "You are on the waitlist.");
  } catch {
    setSignupMessage("Could not reach the waitlist right now.");
  } finally {
    if (!alreadyJoined) {
      signupSubmit.disabled = false;
      signupSubmit.textContent = "Submit";
    }
  }
});
