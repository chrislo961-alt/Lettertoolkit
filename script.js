const form = document.querySelector("#unscramble-form");
const lettersInput = document.querySelector("#letters");
const minLengthSelect = document.querySelector("#min-length");
const maxLengthSelect = document.querySelector("#max-length");
const statusBox = document.querySelector("#status");
const resultsSection = document.querySelector("#results-section");
const resultsContainer = document.querySelector("#results");
const resultCount = document.querySelector("#result-count");
const exampleButton = document.querySelector("#example-button");
const clearButton = document.querySelector("#clear-button");

let dictionary = [];

function normalizeLetters(value) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function buildLetterCounts(value) {
  const counts = Object.create(null);

  for (const letter of value) {
    counts[letter] = (counts[letter] || 0) + 1;
  }

  return counts;
}

function canBuildWord(word, availableCounts) {
  const neededCounts = Object.create(null);

  for (const letter of word) {
    neededCounts[letter] = (neededCounts[letter] || 0) + 1;

    if (neededCounts[letter] > (availableCounts[letter] || 0)) {
      return false;
    }
  }

  return true;
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
}

function clearResults() {
  resultsContainer.replaceChildren();
  resultsSection.hidden = true;
  resultCount.textContent = "";
}

function renderResults(words) {
  clearResults();

  if (words.length === 0) {
    setStatus("No matching words were found with the current filters.");
    return;
  }

  const groups = new Map();

  for (const word of words) {
    const length = word.length;

    if (!groups.has(length)) {
      groups.set(length, []);
    }

    groups.get(length).push(word);
  }

  const fragment = document.createDocumentFragment();

  for (const [length, groupWords] of groups) {
    const section = document.createElement("section");
    section.className = "word-group";

    const heading = document.createElement("h4");
    heading.textContent = `${length}-letter words`;

    const list = document.createElement("div");
    list.className = "word-list";

    for (const word of groupWords) {
      const item = document.createElement("span");
      item.className = "word-chip";
      item.textContent = word;
      list.appendChild(item);
    }

    section.append(heading, list);
    fragment.appendChild(section);
  }

  resultsContainer.appendChild(fragment);
  resultCount.textContent = `${words.length} match${words.length === 1 ? "" : "es"}`;
  resultsSection.hidden = false;
  setStatus("Search complete.");
}

async function loadDictionary() {
  try {
    const response = await fetch("words.txt", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();

    dictionary = [...new Set(
      text
        .split(/\r?\n/)
        .map((word) => word.trim().toLowerCase())
        .filter((word) => /^[a-z]{2,15}$/.test(word))
    )];

    dictionary.sort((a, b) => b.length - a.length || a.localeCompare(b));
    setStatus(`${dictionary.length.toLocaleString()} words loaded. Enter letters to begin.`);
  } catch (error) {
    console.error("Could not load dictionary:", error);
    setStatus("The word list could not be loaded. Please refresh the page.", true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (dictionary.length === 0) {
    setStatus("The word list is not ready yet. Please refresh the page.", true);
    return;
  }

  const letters = normalizeLetters(lettersInput.value);

  if (letters.length < 2) {
    clearResults();
    setStatus("Please enter at least 2 letters.", true);
    lettersInput.focus();
    return;
  }

  if (letters.length > 15) {
    clearResults();
    setStatus("Please enter no more than 15 letters.", true);
    lettersInput.focus();
    return;
  }

  const minLength = Number(minLengthSelect.value);
  const selectedMax = Number(maxLengthSelect.value);
  const maxLength = Math.min(selectedMax, letters.length);

  if (minLength > maxLength) {
    clearResults();
    setStatus("Minimum length cannot be greater than maximum length.", true);
    return;
  }

  const availableCounts = buildLetterCounts(letters);

  const matches = dictionary.filter((word) => {
    return (
      word.length >= minLength &&
      word.length <= maxLength &&
      canBuildWord(word, availableCounts)
    );
  });

  renderResults(matches);
});

exampleButton.addEventListener("click", () => {
  lettersInput.value = "teacher";
  minLengthSelect.value = "3";
  maxLengthSelect.value = "15";
  lettersInput.focus();
});

clearButton.addEventListener("click", () => {
  form.reset();
  clearResults();
  setStatus(`${dictionary.length.toLocaleString()} words loaded. Enter letters to begin.`);
  lettersInput.focus();
});

loadDictionary();
