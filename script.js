const signupTrigger = document.querySelector(".signup-trigger");
const modalBackdrop = document.querySelector("[data-modal-backdrop]");
const nameInput = document.querySelector("#signup-name");

const openModal = () => {
  modalBackdrop.hidden = false;
  nameInput.focus();
};

const closeModal = () => {
  modalBackdrop.hidden = true;
  signupTrigger.focus();
};

signupTrigger.addEventListener("click", openModal);

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) {
    closeModal();
  }
});
