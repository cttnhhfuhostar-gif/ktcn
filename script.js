/* ==========================================================
   script.js
   0. Cấu hình
   1. Mục lục nhanh (scroll-spy)
   2. Đa ngôn ngữ (dữ liệu ở language.json)
   3. Nút sao chép tên file
   4. Bộ lọc lộ trình học phần (Course Filter Tabs)
   5. Bảng kiểm tra hồ sơ tương tác (Interactive Checklist)
   6. Tìm kiếm FAQ tức thì (Live Search FAQ)
   ========================================================== */

/* ---------- 0. Cấu hình ---------- */
const CONFIG = {
  languageFile: "language.json",
  defaultLanguage: "vi",
  languageStorageKey: "selectedLanguage",
  checklistStorageKey: "tdtu_intern_checklist_v1",
  copyFeedbackMs: 1800,
  copyErrorMs: 3000,
  navActiveClasses: ["bg-primary", "font-semibold", "text-on-primary"],
  languageButtonClass: {
    active:
      "rounded px-2 py-1 font-label-sm text-label-sm font-bold bg-primary text-on-primary",
    inactive:
      "rounded px-2 py-1 font-label-sm text-label-sm font-bold text-on-surface-variant hover:bg-surface-container-high",
  },
  filterButtonClass: {
    active:
      "rounded-lg px-3 py-1.5 font-label-sm text-label-sm font-bold bg-primary text-on-primary shadow-sm",
    inactive:
      "rounded-lg px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors",
  },
};

/* ---------- 1. Mục lục nhanh ---------- */
const quickNav = document.querySelector("[data-quick-nav]");
const quickLinks = quickNav ? [...quickNav.querySelectorAll('a[href^="#"]')] : [];
const quickSections = quickLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const quickLinkTrack = quickNav ? quickNav.querySelector(".overflow-x-auto") : null;
let scrollFrame = 0;

function setActiveQuickLink(sectionId) {
  let activeWasChanged = false;
  quickLinks.forEach((link) => {
    const isActive = link.hash === `#${sectionId}`;
    if (isActive && !link.hasAttribute("aria-current")) {
      activeWasChanged = true;
    }
    link.classList.toggle("bg-surface-container", !isActive);
    link.classList.toggle("text-on-surface", !isActive);
    CONFIG.navActiveClasses.forEach((className) =>
      link.classList.toggle(className, isActive),
    );
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const activeLink = quickLinks.find((link) => link.hash === `#${sectionId}`);
  if (activeLink && activeWasChanged && quickLinkTrack) {
    const trackBounds = quickLinkTrack.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();
    if (linkBounds.left < trackBounds.left) {
      quickLinkTrack.scrollBy({
        left: linkBounds.left - trackBounds.left - 8,
        behavior: "smooth",
      });
    } else if (linkBounds.right > trackBounds.right) {
      quickLinkTrack.scrollBy({
        left: linkBounds.right - trackBounds.right + 8,
        behavior: "smooth",
      });
    }
  }
}

function updateActiveQuickLink() {
  if (!quickNav || !quickSections.length) return;
  scrollFrame = 0;
  const activationPoint = quickNav.getBoundingClientRect().bottom + 24;
  let activeSection = quickSections[0];

  quickSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationPoint) {
      activeSection = section;
    }
  });

  if (activeSection) setActiveQuickLink(activeSection.id);
}

window.addEventListener(
  "scroll",
  () => {
    if (!scrollFrame) {
      scrollFrame = window.requestAnimationFrame(updateActiveQuickLink);
    }
  },
  { passive: true },
);
window.addEventListener("resize", updateActiveQuickLink);
quickLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveQuickLink(link.hash.slice(1)));
});
updateActiveQuickLink();

/* ---------- 2. Đa ngôn ngữ ---------- */
let languagePack = {};
const originalTitle = document.title;

const languageReady = fetch(CONFIG.languageFile)
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    languagePack = data;
  })
  .catch((error) => {
    console.error(`Không tải được ${CONFIG.languageFile}:`, error);
  });

const languageTextNodes = [];
const languageWalker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
);
while (languageWalker.nextNode()) {
  const node = languageWalker.currentNode;
  if (node.parentElement.closest("script, style, .material-symbols-outlined")) {
    continue;
  }
  const key = node.nodeValue.replace(/\s+/g, " ").trim();
  if (key) languageTextNodes.push({ node, source: node.nodeValue, key });
}

const originalAttributes = new Map();
function rememberAttribute(element, attribute) {
  if (!originalAttributes.has(element)) originalAttributes.set(element, {});
  const store = originalAttributes.get(element);
  if (!(attribute in store)) store[attribute] = element.getAttribute(attribute);
  return store[attribute];
}

function applyAttributes(dictionary) {
  originalAttributes.forEach((attrs, element) => {
    Object.entries(attrs).forEach(([attribute, value]) =>
      element.setAttribute(attribute, value),
    );
  });
  dictionary?.attributes?.forEach(({ selector, attribute, value, replace }) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!element.hasAttribute(attribute)) return;
      const original = rememberAttribute(element, attribute);
      element.setAttribute(
        attribute,
        replace ? original.replace(replace[0], replace[1]) : value,
      );
    });
  });
}

async function setPageLanguage(language) {
  await languageReady;
  const isDefault = language === CONFIG.defaultLanguage;
  const dictionary = isDefault ? null : languagePack[language];
  if (!isDefault && !dictionary) return;

  languageTextNodes.forEach(({ node, source, key }) => {
    if (!dictionary) {
      node.nodeValue = source;
      return;
    }
    const translated = dictionary.text?.[key];
    if (!translated) return;
    const leading = source.match(/^\s*/)[0];
    const trailing = source.match(/\s*$/)[0];
    node.nodeValue = `${leading}${translated}${trailing}`;
  });

  applyAttributes(dictionary);

  document.documentElement.lang = language;
  document.title = dictionary?.title ?? originalTitle;
  localStorage.setItem(CONFIG.languageStorageKey, language);

  document.querySelectorAll("[data-language]").forEach((button) => {
    const active = button.dataset.language === language;
    button.setAttribute("aria-pressed", String(active));
    button.className = active
      ? CONFIG.languageButtonClass.active
      : CONFIG.languageButtonClass.inactive;
  });
}

const savedLanguage = localStorage.getItem(CONFIG.languageStorageKey);
setPageLanguage(savedLanguage || CONFIG.defaultLanguage);

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () =>
    setPageLanguage(button.dataset.language),
  );
});

/* ---------- 3. Nút sao chép tên file ---------- */
const copyButtons = document.querySelectorAll("button[data-copy]");
const copyStatus = document.createElement("div");
copyStatus.className = "copy-toast";
copyStatus.setAttribute("role", "status");
copyStatus.setAttribute("aria-live", "polite");
copyStatus.setAttribute("aria-atomic", "true");
document.body.append(copyStatus);

let copyStatusTimer;
const copyButtonTimers = new WeakMap();

async function copyFileName(button) {
  const fileName = button.dataset.copy || button.querySelector("code")?.textContent.trim();
  if (!fileName) return;

  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(fileName);
      } catch {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = fileName;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.cssText =
          "position:fixed;opacity:0;pointer-events:none";
        document.body.append(temporaryInput);
        temporaryInput.select();
        document.execCommand("copy");
        temporaryInput.remove();
      }
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = fileName;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.cssText =
        "position:fixed;opacity:0;pointer-events:none";
      document.body.append(temporaryInput);
      temporaryInput.select();
      document.execCommand("copy");
      temporaryInput.remove();
    }

    const icon = button.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.dataset.copyIcon ??= icon.textContent;
      icon.textContent = "check";
    }
    button.dataset.copyLabel ??= button.getAttribute("aria-label");
    button.setAttribute(
      "aria-label",
      document.documentElement.lang === "en"
        ? `Copied ${fileName}`
        : `Đã sao chép ${fileName}`,
    );
    copyStatus.textContent =
      document.documentElement.lang === "en"
        ? `Copied: ${fileName}`
        : `Đã sao chép: ${fileName}`;
    copyStatus.classList.add("is-visible");
    clearTimeout(copyStatusTimer);
    copyStatusTimer = setTimeout(() => {
      copyStatus.classList.remove("is-visible");
    }, CONFIG.copyFeedbackMs);

    clearTimeout(copyButtonTimers.get(button));
    const resetButtonTimer = setTimeout(() => {
      if (icon && icon.dataset.copyIcon) {
        icon.textContent = icon.dataset.copyIcon;
        delete icon.dataset.copyIcon;
      }
      if (button.dataset.copyLabel) {
        button.setAttribute("aria-label", button.dataset.copyLabel);
      }
      copyButtonTimers.delete(button);
    }, CONFIG.copyFeedbackMs);
    copyButtonTimers.set(button, resetButtonTimer);
  } catch {
    copyStatus.textContent =
      document.documentElement.lang === "en"
        ? "Could not copy filename."
        : "Không thể sao chép tên file.";
    copyStatus.classList.add("is-visible");
    clearTimeout(copyStatusTimer);
    copyStatusTimer = setTimeout(() => {
      copyStatus.classList.remove("is-visible");
    }, CONFIG.copyErrorMs);
  }
}

copyButtons.forEach((button) => {
  button.removeAttribute("onclick");
  button.addEventListener("click", () => copyFileName(button));
});

/* ---------- 4. Bộ lọc lộ trình học phần (Course Filter Tabs) ---------- */
const filterButtons = document.querySelectorAll("[data-filter-course]");
const filterCards = document.querySelectorAll("[data-course-category]");
const filterStatusText = document.querySelector("[data-filter-status]");

function setCourseFilter(filter) {
  filterButtons.forEach((btn) => {
    const isActive = btn.dataset.filterCourse === filter;
    btn.setAttribute("aria-pressed", String(isActive));
    btn.className = isActive
      ? CONFIG.filterButtonClass.active
      : CONFIG.filterButtonClass.inactive;
  });

  filterCards.forEach((card) => {
    const categories = (card.dataset.courseCategory || "").split(/\s+/);
    if (filter === "all") {
      card.classList.remove("is-dimmed", "is-hidden");
    } else if (categories.includes(filter) || categories.includes("common")) {
      card.classList.remove("is-dimmed", "is-hidden");
    } else {
      card.classList.add("is-dimmed");
    }
  });

  if (filterStatusText) {
    const labels = {
      all: "Đang hiển thị: Toàn bộ quy trình chuẩn (TSNN & KTCN)",
      tsnn: "Đang lọc: Chỉ hiển thị hướng dẫn Tập Sự Nghề Nghiệp (TSNN)",
      ktcn: "Đang lọc: Chỉ hiển thị hướng dẫn Kiến Tập Công Nghiệp (KTCN)",
      dual: "Đang lọc: Hướng dẫn học Song Hành cùng lúc 2 môn (≥240H, 2 bộ hồ sơ)",
      early: "Đang lọc: Diện Thực Tập Sớm (Trước khi đăng ký môn học)",
    };
    filterStatusText.textContent = labels[filter] || labels.all;
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setCourseFilter(btn.dataset.filterCourse);
    if (btn.dataset.filterCourse === "early") {
      const earlySection = document.getElementById("thuc-tap-som");
      if (earlySection) {
        earlySection.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
});

/* ---------- 5. Bảng kiểm tra hồ sơ tương tác (Interactive Checklist) ---------- */
const checklistTabs = document.querySelectorAll("[data-checklist-tab]");
const checklistGroups = document.querySelectorAll("[data-checklist-group]");
const checklistInputs = document.querySelectorAll("input[data-checklist-item]");
const checklistProgressText = document.querySelector("#checklist-progress-text");
const checklistProgressBar = document.querySelector("#checklist-progress-bar");
const resetChecklistBtn = document.querySelector("#reset-checklist-btn");

function getChecklistState() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.checklistStorageKey)) || {};
  } catch {
    return {};
  }
}

function saveChecklistState(state) {
  localStorage.setItem(CONFIG.checklistStorageKey, JSON.stringify(state));
}

function updateChecklistProgress() {
  const activeTab = document.querySelector("[data-checklist-tab][aria-selected='true']")?.dataset.checklistTab || "tsnn";
  const activeInputs = [...document.querySelectorAll(`[data-checklist-group="${activeTab}"] input[data-checklist-item]`)];
  const total = activeInputs.length;
  const checked = activeInputs.filter((i) => i.checked).length;
  const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

  if (checklistProgressText) {
    checklistProgressText.textContent = `Đã hoàn thành ${checked}/${total} mục (${percent}%)`;
  }
  if (checklistProgressBar) {
    checklistProgressBar.style.width = `${percent}%`;
  }
}

function initChecklist() {
  const state = getChecklistState();

  checklistInputs.forEach((input) => {
    const id = input.dataset.checklistItem;
    if (state[id]) {
      input.checked = true;
      input.closest(".checklist-item")?.classList.add("is-checked");
    }

    input.addEventListener("change", () => {
      const currentState = getChecklistState();
      currentState[id] = input.checked;
      saveChecklistState(currentState);
      input.closest(".checklist-item")?.classList.toggle("is-checked", input.checked);
      updateChecklistProgress();
    });
  });

  checklistTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.checklistTab;
      checklistTabs.forEach((t) => {
        const isSelected = t === tab;
        t.setAttribute("aria-selected", String(isSelected));
        t.className = isSelected
          ? "px-4 py-2 rounded-lg font-bold text-sm bg-primary text-on-primary transition-all shadow-sm"
          : "px-4 py-2 rounded-lg font-medium text-sm text-on-surface hover:bg-surface-container transition-all";
      });
      checklistGroups.forEach((group) => {
        group.classList.toggle("hidden", group.dataset.checklistGroup !== target);
      });
      updateChecklistProgress();
    });
  });

  if (resetChecklistBtn) {
    resetChecklistBtn.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ checklist hồ sơ?")) {
        saveChecklistState({});
        checklistInputs.forEach((input) => {
          input.checked = false;
          input.closest(".checklist-item")?.classList.remove("is-checked");
        });
        updateChecklistProgress();
      }
    });
  }

  updateChecklistProgress();
}
initChecklist();

/* ---------- 6. Tìm kiếm FAQ tức thì (Live Search FAQ) ---------- */
const faqSearchInput = document.querySelector("#faq-search");
const faqItems = document.querySelectorAll(".faq-details");
const faqNoResult = document.querySelector("#faq-no-result");

if (faqSearchInput) {
  faqSearchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    let visibleCount = 0;

    faqItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const isMatch = !query || text.includes(query);
      item.classList.toggle("hidden", !isMatch);
      if (isMatch) {
        visibleCount++;
        if (query.length >= 2) {
          item.setAttribute("open", "");
        }
      } else {
        item.removeAttribute("open");
      }
    });

    if (faqNoResult) {
      faqNoResult.classList.toggle("hidden", visibleCount > 0);
    }
  });
}
