const signupForm = document.querySelector(".signup-form");
const nameInput = document.querySelector("#signup-name");
const emailInput = document.querySelector("#signup-email");
const companyInput = document.querySelector("#signup-company");
const signupSubmit = document.querySelector(".signup-submit");
const signupMessage = document.querySelector("[data-signup-message]");

const setSignupMessage = (message, type = "error") => {
  signupMessage.textContent = message;
  signupMessage.dataset.state = type;
};

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || !email) {
    setSignupMessage("Please enter your name and email.");
    return;
  }

  if (!emailInput.validity.valid) {
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

    signupForm.reset();
    setSignupMessage(result.message || "You are on the waitlist.", "success");
  } catch {
    setSignupMessage("Could not reach the waitlist right now.");
  } finally {
    signupSubmit.disabled = false;
    signupSubmit.textContent = "Submit";
  }
});
