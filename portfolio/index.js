document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById("theme-toggle");
  const sunIcon = document.getElementById("sun-icon");
  const moonIcon = document.getElementById("moon-icon");
  const htmlElement = document.documentElement;

  // Retrieve theme preference from local storage, fallback to system preference
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

  setTheme(initialTheme);

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });

  function setTheme(theme) {
    htmlElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    if (theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }

  // --- Mobile Menu Toggle ---
  const menuToggle = document.getElementById("menu-toggle");
  const navLinksList = document.getElementById("nav-links");
  const navLinks = document.querySelectorAll(".nav-links a");

  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("open");
    navLinksList.classList.toggle("open");
  });

  // Close mobile menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      menuToggle.classList.remove("open");
      navLinksList.classList.remove("open");
    });
  });

  // --- Skill Bars Animation & Category Filtering ---
  const skillBars = document.querySelectorAll(".skill-level-bar");
  
  // Set width dynamically to trigger CSS transition
  setTimeout(() => {
    skillBars.forEach(bar => {
      const targetLevel = bar.getAttribute("data-level");
      bar.style.width = targetLevel;
    });
  }, 200);

  const filterButtons = document.querySelectorAll(".filter-btn");
  const skillCards = document.querySelectorAll(".skill-card");

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Toggle active filter button style
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      skillCards.forEach(card => {
        const category = card.getAttribute("data-category");
        if (filterValue === "all" || category === filterValue) {
          card.classList.remove("hidden");
          // Re-trigger animation when shown
          const bar = card.querySelector(".skill-level-bar");
          bar.style.width = "0%";
          setTimeout(() => {
            bar.style.width = bar.getAttribute("data-level");
          }, 50);
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

  // --- Active Nav Link on Scroll (ScrollSpy) ---
  const sections = document.querySelectorAll("section");
  
  window.addEventListener("scroll", () => {
    let currentSectionId = "";
    const scrollPosition = window.scrollY + 100; // Offset for sticky navbar

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentSectionId}`) {
        link.classList.add("active");
      }
    });
  });

  // --- Contact Form Validation & Submission ---
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Reset status and error states
    formStatus.style.display = "none";
    formStatus.className = "form-status-alert";
    
    const formGroups = contactForm.querySelectorAll(".form-group");
    formGroups.forEach(group => group.classList.remove("has-error"));

    // Validation
    const nameInput = document.getElementById("form-name");
    const emailInput = document.getElementById("form-email");
    const subjectInput = document.getElementById("form-subject");
    const messageInput = document.getElementById("form-message");
    
    let isValid = true;

    if (!nameInput.value.trim()) {
      showError("group-name");
      isValid = false;
    }

    if (!emailInput.value.trim() || !validateEmail(emailInput.value)) {
      showError("group-email");
      isValid = false;
    }

    if (!subjectInput.value.trim()) {
      showError("group-subject");
      isValid = false;
    }

    if (!messageInput.value.trim()) {
      showError("group-message");
      isValid = false;
    }

    if (isValid) {
      // Simulate form submission success
      formStatus.innerText = "Thank you! Your message has been sent successfully. I will get back to you shortly.";
      formStatus.classList.add("success");
      contactForm.reset();
      
      // Reset skill bars after reset (if needed) or keep clean
      setTimeout(() => {
        formStatus.style.display = "none";
      }, 5000);
    }
  });

  function showError(groupId) {
    document.getElementById(groupId).classList.add("has-error");
  }

  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }
});
