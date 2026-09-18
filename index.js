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

  });
