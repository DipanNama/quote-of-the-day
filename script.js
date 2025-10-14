const data = document.getElementById("data");
const btn = document.getElementById("btn");
const prevBtn = document.getElementById("prevBtn");
const author = document.getElementById("author");
const themeToggle = document.getElementById("themeToggle");
const loading = document.getElementById("loading");
const copyBtn = document.getElementById("copyBtn");
const tooltip = document.getElementById("copiedTooltip");
const skeleton = document.getElementById("skeleton");

let history = [];
let currentQuote = {
  text: "LISP has assisted a number of our most gifted fellow humans in thinking previously impossible thoughts.",
  author: "Edsger W. Dijkstra",
};

const fallbackQuotes = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
];

const apiEndpoints = ["https://api.quotable.io/random", "https://zenquotes.io/api/random"];
const THEME_KEY = "theme";

// ========================
// 🌗 Theme Handling
// ========================
function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-theme");
    themeToggle.innerHTML = '<i class="ri-sun-line"></i>';
  } else {
    document.body.classList.remove("light-theme");
    themeToggle.innerHTML = '<i class="ri-moon-line"></i>';
  }
}

themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-theme");
  const newTheme = isLight ? "light" : "dark";
  localStorage.setItem(THEME_KEY, newTheme);
  applyTheme(newTheme);
});

// Initialize theme
applyTheme(localStorage.getItem(THEME_KEY));

// ========================
// ✨ Quote Logic
// ========================
function getRandomFallbackQuote() {
  let quote;
  do {
    quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  } while (quote.text === currentQuote.text);
  return quote;
}

function updateUI(quote) {
  data.textContent = quote.text;
  author.textContent = `— ${quote.author || "Unknown"}`;

  [data, author].forEach((el) => {
    el.classList.remove("fade-in");
    void el.offsetWidth; // Force reflow
    el.classList.add("fade-in");
  });
}

async function fetchQuote() {
  btn.disabled = true;
  btn.textContent = "Loading...";

  // Show skeleton and hide actual quote
  skeleton.classList.remove("hidden");
  data.classList.add("hidden");
  author.classList.add("hidden");
  loading.classList.remove("hidden");

  const getQuoteFrom = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const result = await response.json();

      if (url.includes("quotable.io")) return { text: result.content, author: result.author };
      if (url.includes("zenquotes.io")) return { text: result[0].q, author: result[0].a };
      throw new Error("Unknown API format");
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  try {
    const promises = apiEndpoints.map((url) => getQuoteFrom(url));
    const quote = await Promise.any(promises);

    history.push(currentQuote);
    currentQuote = quote;
    updateUI(quote);
  } catch (err) {
    console.error("API failed. Using fallback.", err);
    const fallback = getRandomFallbackQuote();
    history.push(currentQuote);
    currentQuote = fallback;
    updateUI(fallback);
  } finally {
    btn.textContent = "New Quote";
    btn.disabled = false;
    loading.classList.add("hidden");

    // Hide skeleton and show actual quote
    skeleton.classList.add("hidden");
    data.classList.remove("hidden");
    author.classList.remove("hidden");

    if (history.length > 0) prevBtn.classList.remove("hidden");
  }
}

// ========================
// 🔙 Previous Quote Handler
// ========================
prevBtn.addEventListener("click", () => {
  if (history.length === 0) return;
  const prev = history.pop();
  currentQuote = prev;
  updateUI(prev);
  if (history.length === 0) prevBtn.classList.add("hidden");
});

// ========================
// 🆕 New Quote Handler
// ========================
btn.addEventListener("click", fetchQuote);

// ========================
// 📋 Copy to Clipboard Feature
// ========================
if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    const quoteText = data.textContent;
    const authorText = author.textContent;
    const fullQuote = `${quoteText} ${authorText}`;

    navigator.clipboard.writeText(fullQuote).then(() => {
      tooltip.style.opacity = "1"; // Show tooltip
      setTimeout(() => {
        tooltip.style.opacity = "0"; // Hide after 2s
      }, 2000);
    }).catch((err) => {
      console.error("Failed to copy text: ", err);
      // Fallback for older browsers
      alert("Failed to copy. Please copy manually.");
    });
  });
}