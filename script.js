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
  courseStorageKey: "tdtu_course_filter_v1",
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
      "rounded-lg px-3 py-2 font-label-sm text-label-sm font-bold bg-primary text-on-primary shadow-sm",
    inactive:
      "rounded-lg px-3 py-2 font-label-sm text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors",
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

/* ---------- 4. Bộ lọc lộ trình học phần (Course Filter Tabs & Mode Selector) ---------- */
const filterButtons = document.querySelectorAll("[data-filter-course]");
const filterCards = document.querySelectorAll("[data-course-category]");
const filterStatusText = document.querySelector("[data-filter-status]");
const filterNoticeCard = document.querySelector("#filter-notice-card");
const filterResetBtn = document.querySelector("#filter-reset-view-btn");
const headerCourseBadge = document.querySelector("#header-course-badge");

function setCourseFilter(filter, save = true) {
  filterButtons.forEach((btn) => {
    const isActive = btn.dataset.filterCourse === filter;
    btn.setAttribute("aria-pressed", String(isActive));
    btn.className = isActive
      ? "rounded-lg px-3 py-2 font-label-sm text-label-sm font-bold bg-primary text-on-primary shadow-sm"
      : "rounded-lg px-3 py-2 font-label-sm text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors";
  });

  filterCards.forEach((card) => {
    const categories = (card.dataset.courseCategory || "").split(/\s+/);
    if (filter === "all") {
      card.classList.remove("is-dimmed", "is-hidden");
    } else if (categories.includes(filter) || categories.includes("common")) {
      card.classList.remove("is-dimmed", "is-hidden");
    } else {
      card.classList.add("is-hidden");
    }
  });

  const badgeLabels = {
    all: "Tất cả môn",
    tsnn: "Chỉ môn TSNN",
    ktcn: "Chỉ môn KTCN",
    dual: "Song Hành 2 Môn",
    early: "Thực Tập Sớm",
  };
  if (headerCourseBadge) {
    headerCourseBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${filter === 'all' ? 'bg-secondary' : 'bg-primary'}"></span> ${badgeLabels[filter] || badgeLabels.all}`;
  }

  const noticeTexts = {
    all: "Đang hiển thị: Toàn bộ quy trình chuẩn (TSNN & KTCN)",
    tsnn: "Đang lọc: Chỉ hiển thị nội dung Tập Sự Nghề Nghiệp (TSNN). Các mục dành riêng cho KTCN đã được ẩn gọn gàng.",
    ktcn: "Đang lọc: Chỉ hiển thị nội dung Kiến Tập Công Nghiệp (KTCN). Các mục dành riêng cho TSNN đã được ẩn gọn gàng.",
    dual: "Đang lọc: Hướng dẫn học Song Hành cùng lúc 2 môn (Bắt buộc ≥ 240H, chuẩn bị 2 bộ hồ sơ riêng biệt).",
    early: "Đang lọc: Chuyên đề Thực Tập Sớm (Diện tiền đăng ký môn học - Dự thảo).",
  };

  if (filterStatusText) {
    filterStatusText.textContent = noticeTexts[filter] || noticeTexts.all;
  }

  if (filterNoticeCard) {
    filterNoticeCard.classList.toggle("hidden", filter === "all");
  }

  // Auto-sync with Checklist tab
  if (filter === "tsnn" || filter === "ktcn") {
    const targetChecklistTab = document.querySelector(`[data-checklist-tab="${filter}"]`);
    if (targetChecklistTab && targetChecklistTab.getAttribute("aria-selected") !== "true") {
      targetChecklistTab.click();
    }
  }

  if (save) {
    localStorage.setItem(CONFIG.courseStorageKey, filter);
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filterCourse;
    setCourseFilter(filter);
    if (filter === "early") {
      const earlySection = document.getElementById("thuc-tap-som");
      if (earlySection) {
        earlySection.scrollIntoView({ behavior: "smooth" });
        earlySection.classList.remove("highlight-jump");
        void earlySection.offsetWidth;
        earlySection.classList.add("highlight-jump");
        setTimeout(() => earlySection.classList.remove("highlight-jump"), 2400);
      }
    }
  });
});

if (filterResetBtn) {
  filterResetBtn.addEventListener("click", () => {
    setCourseFilter("all");
  });
}

// Khởi tạo bộ lọc môn học từ localStorage
const savedCourse = localStorage.getItem(CONFIG.courseStorageKey);
if (savedCourse) {
  setCourseFilter(savedCourse, false);
}

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
      if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ checklist hồ sơ về trạng thái ban đầu?")) {
        saveChecklistState({});
        checklistInputs.forEach((input) => {
          input.checked = false;
          input.closest(".checklist-item")?.classList.remove("is-checked");
        });
        updateChecklistProgress();
        copyStatus.textContent = document.documentElement.lang === "en"
          ? "Checklist reset to default."
          : "Đã đặt lại toàn bộ checklist về mặc định.";
        copyStatus.classList.add("is-visible");
        setTimeout(() => copyStatus.classList.remove("is-visible"), CONFIG.copyFeedbackMs);
      }
    });
  }

  updateChecklistProgress();
}
initChecklist();

/* ---------- 6. Tìm kiếm FAQ tức thì (Live Search FAQ) ---------- */
const faqSearchInput = document.querySelector("#faq-search");
const faqSearchClear = document.querySelector("#faq-search-clear");
const faqCounter = document.querySelector("#faq-counter");
const faqToggleAllBtn = document.querySelector("#faq-toggle-all-btn");
const faqItems = document.querySelectorAll(".faq-details");
const faqNoResult = document.querySelector("#faq-no-result");
let faqAllExpanded = false;

function filterFaqItems(rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  let visibleCount = 0;

  if (faqSearchClear) {
    faqSearchClear.classList.toggle("hidden", query.length === 0);
  }

  faqItems.forEach((item) => {
    const text = item.textContent.toLowerCase();
    const isMatch = !query || text.includes(query);
    item.classList.toggle("hidden", !isMatch);
    if (isMatch) {
      visibleCount++;
      // Tự động mở câu hỏi khi tìm kiếm đích danh (khớp ít hơn 5 câu)
      if (query.length >= 2 && visibleCount <= 4) {
        item.setAttribute("open", "");
      }
    } else {
      item.removeAttribute("open");
    }
  });

  if (faqNoResult) {
    faqNoResult.classList.toggle("hidden", visibleCount > 0);
  }

  if (faqCounter) {
    if (!query) {
      faqCounter.innerHTML = `<span class="material-symbols-outlined text-[16px]">quiz</span> Hiển thị toàn bộ ${faqItems.length} câu hỏi giải đáp học vụ`;
    } else {
      faqCounter.innerHTML = `<span class="material-symbols-outlined text-[16px]">search</span> Tìm thấy ${visibleCount} / ${faqItems.length} câu hỏi phù hợp với "${rawQuery}"`;
    }
  }
}

if (faqSearchInput) {
  faqSearchInput.addEventListener("input", (e) => filterFaqItems(e.target.value));
}

if (faqSearchClear) {
  faqSearchClear.addEventListener("click", () => {
    if (faqSearchInput) {
      faqSearchInput.value = "";
      filterFaqItems("");
      faqSearchInput.focus();
    }
  });
}

if (faqToggleAllBtn) {
  faqToggleAllBtn.addEventListener("click", () => {
    faqAllExpanded = !faqAllExpanded;
    faqItems.forEach((item) => {
      if (!item.classList.contains("hidden")) {
        if (faqAllExpanded) {
          item.setAttribute("open", "");
        } else {
          item.removeAttribute("open");
        }
      }
    });
    faqToggleAllBtn.textContent = faqAllExpanded ? "Đóng tất cả câu hỏi" : "Mở tất cả câu hỏi";
  });
}

/* ---------- 7. Tìm kiếm toàn cẩm nang & Nhảy nhanh (Universal Search & Jump Engine) ---------- */
const globalSearchInput = document.querySelector("#global-search-input");
const globalSearchClear = document.querySelector("#global-search-clear");
const globalSearchDropdown = document.querySelector("#global-search-dropdown");
const globalSearchResultsList = document.querySelector("#global-search-results-list");
const searchChips = document.querySelectorAll("[data-search-chip]");

const SEARCH_DATABASE = [
  {
    title: "BM01 - Tiếp Nhận Thực Tập & Mộc Tròn Doanh Nghiệp",
    snippet: "Bản gốc có dấu mộc tròn pháp nhân (chấp nhận mộc treo, chữ ký số). Dùng HĐLĐ thay thế được.",
    category: "GĐ1 • Chuẩn bị",
    icon: "assignment",
    target: "#giai-doan-1",
    keywords: "bm01 giay tiep nhan moc tron phap nhan hdld hop dong lao dong cong ty",
  },
  {
    title: "Thời Lượng Giờ: Tối Thiểu 120H (Song Hành ≥ 240H)",
    snippet: "Ít nhất 120 giờ/học phần. Nếu học cùng lúc cả TSNN và KTCN thì tổng cộng bắt buộc đạt ≥ 240 giờ.",
    category: "Quy chế giờ",
    icon: "timer",
    target: "#tong-quan",
    keywords: "120h 240h gio thoi gian tuan ngay song hanh ca 2 mon",
  },
  {
    title: "Dấu Mộc Tròn Pháp Nhân, Mộc Treo & Chữ Ký Số",
    snippet: "Chấp nhận mộc treo giáp lai góc trái hoặc file PDF nhúng chữ ký số Digital Certificate hợp lệ.",
    category: "FAQ • Dấu mộc",
    icon: "approval",
    target: "#faq-su-co",
    keywords: "dau moc tron moc treo chu ky so phap nhan chi nhanh nuoc ngoai",
  },
  {
    title: "Quay Video Tổng Kết (4–5 Phút, Dung Lượng ≤ 100MB)",
    snippet: "Video demo sản phẩm và thu hoạch. Intro tối đa 1 phút, nội dung tối thiểu 4 phút. Nộp file trực tiếp.",
    category: "GĐ3 • Nghiệm thu",
    icon: "videocam",
    target: "#giai-doan-3",
    keywords: "video clip tong ket 4 phut 5 phut 100mb mp4 mov cam link youtube",
  },
  {
    title: "Quy Chuẩn Đặt Tên File Bản Mềm Upload",
    snippet: "Cú pháp: 1_MSSV_BM01.pdf, 2_MSSV_BM02.pdf/NhatKy, 4_MSSV_BM04.pdf, 5_MSSV_BaoCao.docx, 6_MSSV_Video.mp4",
    category: "GĐ3 • Đặt tên file",
    icon: "drive_file_rename_outline",
    target: "#giai-doan-3",
    keywords: "dat ten file ban mem upload cu phap mssv bm01 nhatky bm02 bm03 bm04 baocao video",
  },
  {
    title: "BM04 - Phiếu Chấm Điểm Của CBHD & Mộc Doanh Nghiệp",
    snippet: "Phiếu đánh giá cho CBHD cho điểm. Bắt buộc có mộc DN. Giữ nguyên bảng điểm RUBRIC.",
    category: "GĐ3 • Điểm số",
    icon: "grade",
    target: "#giai-doan-3",
    keywords: "bm04 phieu cham diem cbhd rubric thu lao thulao danh sach",
  },
  {
    title: "BM05 & BM06 - Phiếu Chấm GVGS & Giảng Viên Phản Biện",
    snippet: "Chỉ in ra và điền thông tin cá nhân. TUYỆT ĐỐI KHÔNG nhờ Thầy/Cô chấm điểm hay ký tên trước.",
    category: "GĐ3 • Biểu mẫu",
    icon: "rate_review",
    target: "#giai-doan-3",
    keywords: "bm05 bm06 gvgs gvpb khong ky chi in thong tin ban cung",
  },
  {
    title: "BM04B & BM05B - Thực Tập Tại Đơn Vị Nội Bộ TDTU",
    snippet: "Dành riêng cho sinh viên thực tập tại Lab, Viện, Phòng ban của TDTU. Tải biểu mẫu nhóm B.",
    category: "Đặc thù TDTU",
    icon: "domain_verification",
    target: "#tai-nguyen",
    keywords: "tdtu bm04b bm05b lab vien phong ban thuc tap noi bo",
  },
  {
    title: "Thực Tập Sớm (Diện Tiền Đăng Ký Môn Học - Dự Thảo)",
    snippet: "Dành cho SV thực tập trước khi trường mở cổng ĐKMH. Tích lũy đủ môn và nộp BM07, BM08.",
    category: "Chuyên đề • Dự thảo",
    icon: "event_available",
    target: "#thuc-tap-som",
    keywords: "thuc tap som tien dang ky bm07 bm08 cong nhan diem truoc dkmh",
  },
  {
    title: "Học Song Hành Cùng Lúc 2 Môn (TSNN & KTCN)",
    snippet: "Tổng thời gian ≥ 240 giờ. Nộp 2 bì hồ sơ bản cứng riêng biệt. TSNN dùng BM01 gốc, KTCN dùng BM01 sao.",
    category: "Song hành",
    icon: "layers",
    target: "#tong-quan",
    keywords: "song hanh cung luc 2 mon 240 gio 2 bo ho so rieng biet",
  },
  {
    title: "Giấy Giới Thiệu Thực Tập (GTTT)",
    snippet: "Chỉ xin khi công ty bắt buộc. Cấp mộc vuông Khoa CNTT. Nghiêm cấm dùng để rải CV ứng tuyển.",
    category: "GĐ1 • Thủ tục",
    icon: "badge",
    target: "#giai-doan-1",
    keywords: "giay gioi thieu gttt moc vuong khoa cntt ctsv",
  },
  {
    title: "Xử Lý Sự Cố Phần Mềm TDTU-TSNN & e-Learning",
    snippet: "Liên hệ Tổ Phần Mềm TDTU qua tophanmem@tdtu.edu.vn kèm ảnh chụp màn hình lỗi và MSSV.",
    category: "Sự cố • Hỗ trợ",
    icon: "bug_report",
    target: "#faq-su-co",
    keywords: "loi phan mem tophanmem dang nhap elearning tsnn su co",
  },
  {
    title: "Bảng Kiểm Tra Hồ Sơ Bản Cứng (Interactive Checklist)",
    snippet: "Checklist 6 loại (TSNN) hoặc 7 loại (KTCN) tự động lưu tiến độ trên trình duyệt.",
    category: "Checklist",
    icon: "checklist",
    target: "#interactive-checklist",
    keywords: "checklist kiem tra ho so ban cung bia ho so phong c004",
  },
  {
    title: "Kho Biểu Mẫu Trực Tiếp & Đường Dẫn Chính Thức",
    snippet: "Tải file Word/PDF BM01-BM06, mẫu báo cáo, quy chuẩn video và biểu mẫu tiếng Anh.",
    category: "Tài nguyên",
    icon: "folder_zip",
    target: "#tai-nguyen",
    keywords: "tai bieu mau bieu mau hoc phan link forms drive tinyurl",
  },
];

function normalizeText(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function jumpToTarget(targetSelector) {
  const targetEl = document.querySelector(targetSelector);
  if (!targetEl) return;

  // If inside details, open it
  if (targetEl.tagName === "DETAILS" || targetEl.closest("details")) {
    const parentDetails = targetEl.tagName === "DETAILS" ? targetEl : targetEl.closest("details");
    parentDetails.setAttribute("open", "");
  }

  targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
  targetEl.classList.remove("highlight-jump");
  void targetEl.offsetWidth;
  targetEl.classList.add("highlight-jump");
  setTimeout(() => targetEl.classList.remove("highlight-jump"), 2400);

  if (globalSearchDropdown) {
    globalSearchDropdown.classList.add("hidden");
  }
}

function renderGlobalSearchResults(query) {
  if (!globalSearchResultsList || !globalSearchDropdown) return;
  const cleanQ = normalizeText(query.trim());

  if (!cleanQ) {
    globalSearchDropdown.classList.add("hidden");
    if (globalSearchClear) globalSearchClear.classList.add("hidden");
    return;
  }

  if (globalSearchClear) globalSearchClear.classList.remove("hidden");

  const matched = SEARCH_DATABASE.filter((item) => {
    const titleNorm = normalizeText(item.title);
    const snippetNorm = normalizeText(item.snippet);
    const kwNorm = normalizeText(item.keywords);
    return titleNorm.includes(cleanQ) || snippetNorm.includes(cleanQ) || kwNorm.includes(cleanQ);
  });

  if (!matched.length) {
    globalSearchResultsList.innerHTML = `
      <div class="p-3 text-center text-xs text-on-surface-variant">
        Không tìm thấy mục phù hợp với "<strong>${query}</strong>". Hãy thử từ khóa: BM01, 120 giờ, dấu mộc, video...
      </div>
    `;
    globalSearchDropdown.classList.remove("hidden");
    return;
  }

  globalSearchResultsList.innerHTML = matched
    .map(
      (item) => `
      <button
        type="button"
        data-jump-target="${item.target}"
        class="p-2.5 rounded-lg text-left hover:bg-surface-container transition-colors flex items-start gap-2.5 group cursor-pointer w-full border-b border-outline-variant/10 last:border-b-0"
      >
        <span class="material-symbols-outlined text-secondary text-[20px] mt-0.5 group-hover:scale-110 transition-transform">${item.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-sm text-primary group-hover:underline truncate">${item.title}</span>
            <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">${item.category}</span>
          </div>
          <p class="text-xs text-on-surface-variant line-clamp-1 mt-0.5">${item.snippet}</p>
        </div>
      </button>
    `,
    )
    .join("");

  globalSearchDropdown.classList.remove("hidden");

  globalSearchResultsList.querySelectorAll("[data-jump-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      jumpToTarget(btn.dataset.jumpTarget);
    });
  });
}

if (globalSearchInput) {
  globalSearchInput.addEventListener("input", (e) => {
    renderGlobalSearchResults(e.target.value);
  });

  globalSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      globalSearchDropdown?.classList.add("hidden");
    }
  });
}

if (globalSearchClear) {
  globalSearchClear.addEventListener("click", () => {
    if (globalSearchInput) {
      globalSearchInput.value = "";
      renderGlobalSearchResults("");
      globalSearchInput.focus();
    }
  });
}

searchChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const term = chip.dataset.searchChip;
    if (globalSearchInput) {
      globalSearchInput.value = term;
      renderGlobalSearchResults(term);
    }
  });
});

// Đóng dropdown tìm kiếm khi nhấp ra ngoài
document.addEventListener("click", (e) => {
  if (!e.target.closest("#quick-search-box")) {
    globalSearchDropdown?.classList.add("hidden");
  }
});

