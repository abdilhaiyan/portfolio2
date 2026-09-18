// --- Contact Form Delivery Module ---
// Placeholder keys per D-14 — replace with your real values from SETUP.md
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const SERVICE_ID = "YOUR_SERVICE_ID";
const TEMPLATE_ID = "YOUR_TEMPLATE_ID";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const formNameInput = document.getElementById("form-name");
  const formEmailInput = document.getElementById("form-email");
  const formSubjectInput = document.getElementById("form-subject");
  const formMessageInput = document.getElementById("form-message");
  const formSubmitBtn = contactForm.querySelector(".form-submit-btn");
  const hpField = document.getElementById("form-website");

  let submitInFlight = false;

  function showError(groupId) {
    document.getElementById(groupId).classList.add("has-error");
  }

  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  // --- Contact Form Submit Chain ---
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Honeypot silent abort: a filled decoy field means a bot — stop before any status change
    if (hpField.value.trim()) {
      return;
    }

    // Reset status and error states
    formStatus.style.display = "none";
    formStatus.className = "form-status-alert";

    const formGroups = contactForm.querySelectorAll(".form-group");
    formGroups.forEach(group => group.classList.remove("has-error"));

    // Validation
    let isValid = true;

    if (!formNameInput.value.trim()) {
      showError("group-name");
      isValid = false;
    }

    if (!formEmailInput.value.trim() || !validateEmail(formEmailInput.value)) {
      showError("group-email");
      isValid = false;
    }

    if (!formSubjectInput.value.trim()) {
      showError("group-subject");
      isValid = false;
    }

    if (!formMessageInput.value.trim()) {
      showError("group-message");
      isValid = false;
    }

    if (isValid) {
      // Sending state: show progress and block double submits (D-02)
      formStatus.innerText = "Sending...";
      formStatus.classList.add("is-sending");
      formStatus.style.display = "block";
      formSubmitBtn.disabled = true;
      submitInFlight = true;

      // Timeout fence (D-08): an unresolved submit flips to the failure path after 10s
      const timeoutId = setTimeout(() => {
        if (submitInFlight) {
          renderFailure();
        }
      }, 10000);

      // Firestore primary leg — its resolution drives the whole status (D-03)
      addDoc(collection(db, "messages"), {
        name: formNameInput.value.trim(),
        email: formEmailInput.value.trim(),
        subject: formSubjectInput.value.trim(),
        message: formMessageInput.value.trim(),
        createdAt: serverTimestamp(),
      }).then(
        () => {
          if (submitInFlight) {
            clearTimeout(timeoutId);
            submitInFlight = false;
            formSubmitBtn.disabled = false;
            formStatus.innerText = "Thank you! Your message has been sent successfully. I will get back to you shortly.";
            formStatus.classList.remove("is-sending");
            formStatus.classList.add("success");
            contactForm.reset();
            setTimeout(() => {
              formStatus.style.display = "none";
            }, 5000);
          }
        },
        () => {
          if (submitInFlight) {
            clearTimeout(timeoutId);
            submitInFlight = false;
            renderFailure();
          }
        },
      );

      // EmailJS secondary leg: skipped until real keys are pasted (D-16)
      if (
        window.emailjs &&
        !(EMAILJS_PUBLIC_KEY.indexOf("YOUR_") === 0 ||
          SERVICE_ID.indexOf("YOUR_") === 0 ||
          TEMPLATE_ID.indexOf("YOUR_") === 0)
      ) {
        emailjs.init({
          publicKey: EMAILJS_PUBLIC_KEY,
          blockHeadless: true,
          blockList: {
            list: [],
            watchVariable: "reply_to",
          },
          limitRate: { id: "app", throttle: 10000 },
        });
        emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          from_name: formNameInput.value.trim(),
          reply_to: formEmailInput.value.trim(),
          subject: formSubjectInput.value.trim(),
          message: formMessageInput.value.trim(),
        }).then(
          () => {},
          () => {},
        );
      }
    }
  });

  // --- Failure Path ---
  function renderFailure() {
    submitInFlight = false;
    formSubmitBtn.disabled = false;
    formStatus.classList.remove("success");
    formStatus.classList.remove("is-sending");
    formStatus.innerText = "Sorry, your message could not be sent. Please use one of these options instead:";
    formStatus.style.display = "block";

    const mailtoLink = document.createElement("a");
    mailtoLink.href =
      "mailto:abdilhaiyanhilmi@gmail.com?subject=" +
      encodeURIComponent(formSubjectInput.value) +
      "&body=" +
      encodeURIComponent(formMessageInput.value);
    mailtoLink.innerText = "Send by email";
    mailtoLink.style.display = "block";
    formStatus.appendChild(mailtoLink);

    const whatsappLink = document.createElement("a");
    whatsappLink.href = "https://wa.link/kx5upx";
    whatsappLink.innerText = "Send by WhatsApp";
    whatsappLink.style.display = "block";
    formStatus.appendChild(whatsappLink);
  }
});