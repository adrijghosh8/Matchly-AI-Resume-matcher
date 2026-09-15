/* =========================================================================
   Resume Match — frontend logic
   ---------------------------------------------------------------------
   Backend contract (inspected from the provided FastAPI app):

     POST {API_BASE_URL}/match/         multipart/form-data
       resume : UploadFile  (required)
       jd     : UploadFile  (required)

     Response JSON:
       {
         "Final Score": "82%",
         "Skill Match": "86%",
         "TF-IDF Similarity": "76%",
         "Matched Skills": [...],
         "Missing Skills": [...],
         "Resume Skills": [...],
         "JD Skills": [...]
       }
       or on failure: { "Error": "..." }

   There is currently no endpoint that accepts raw JD text or a job-role
   identifier. `read_file()` on the backend already dispatches by file
   extension and has a working .txt branch, so "Paste JD" is supported
   *without any backend change* by wrapping the typed text in an in-memory
   .txt file and sending it through the existing `jd` field. Predefined
   job roles have no backend support at all yet (no dataset, no endpoint
   parameter) — that mode is fully built in the UI but analysis stays
   disabled until a real endpoint/dataset exists, per instructions not to
   invent one.
   ========================================================================= */

const API_BASE_URL = "http://localhost:8000"; // change to your deployed backend URL

document.getElementById("apiBaseNote").textContent = `API: ${API_BASE_URL}`;

/* ---------------------------------------------------------------------
   State
   --------------------------------------------------------------------- */
const state = {
  resumeFile: null,
  jdMode: "paste",      // 'paste' | 'upload' | 'role'
  jdFile: null,
  jdText: "",
  jobRole: null,         // { id, name, required_skills, preferred_skills }
};

/* Predefined job roles: configurable data structure, intentionally empty.
   Populate this (or fetch it from a backend endpoint once one exists)
   with real role/skill data — see the JOB ROLE DATA section of the brief.
   No skill lists are fabricated here. */
const JOB_ROLES = [
  // { id: "example_role", name: "Example Role", required_skills: [], preferred_skills: [] },
];

/* ---------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------- */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidDoc(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".docx");
}

function showError(el) { el.classList.add("show"); }
function hideError(el) { el.classList.remove("show"); }

/* ---------------------------------------------------------------------
   Resume upload
   --------------------------------------------------------------------- */
const resumeDropzone = document.getElementById("resumeDropzone");
const resumeInput = document.getElementById("resumeInput");
const resumeChip = document.getElementById("resumeChip");
const resumeError = document.getElementById("resumeError");

function setResumeFile(file) {
  if (!file) return;
  if (!isValidDoc(file)) {
    showError(resumeError);
    return;
  }
  hideError(resumeError);
  state.resumeFile = file;
  document.getElementById("resumeName").textContent = file.name;
  document.getElementById("resumeSize").textContent = formatBytes(file.size);
  resumeDropzone.style.display = "none";
  resumeChip.style.display = "flex";
  refreshAnalyzeState();
}

function clearResumeFile() {
  state.resumeFile = null;
  resumeInput.value = "";
  resumeChip.style.display = "none";
  resumeDropzone.style.display = "block";
  refreshAnalyzeState();
}

resumeDropzone.addEventListener("click", () => resumeInput.click());
resumeDropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); resumeInput.click(); }
});
resumeInput.addEventListener("change", (e) => setResumeFile(e.target.files[0]));
document.getElementById("resumeRemove").addEventListener("click", clearResumeFile);

["dragenter", "dragover"].forEach(evt =>
  resumeDropzone.addEventListener(evt, (e) => { e.preventDefault(); resumeDropzone.classList.add("drag"); })
);
["dragleave", "drop"].forEach(evt =>
  resumeDropzone.addEventListener(evt, (e) => { e.preventDefault(); resumeDropzone.classList.remove("drag"); })
);
resumeDropzone.addEventListener("drop", (e) => setResumeFile(e.dataTransfer.files[0]));

/* ---------------------------------------------------------------------
   JD mode switching
   --------------------------------------------------------------------- */
const modeTabs = document.querySelectorAll(".mode-tab");
const modePanels = document.querySelectorAll(".mode-panel");

function jdSourceHasData() {
  if (state.jdMode === "paste") return state.jdText.trim().length > 0;
  if (state.jdMode === "upload") return !!state.jdFile;
  if (state.jdMode === "role") return !!state.jobRole;
  return false;
}

function clearJdSource() {
  state.jdFile = null;
  state.jdText = "";
  state.jobRole = null;

  document.getElementById("jdTextarea").value = "";
  updateJdCharCount();
  hideError(document.getElementById("jdTextError"));

  document.getElementById("jdInput").value = "";
  document.getElementById("jdChip").style.display = "none";
  document.getElementById("jdDropzone").style.display = "block";
  hideError(document.getElementById("jdFileError"));

  document.getElementById("roleSearchInput").value = "";
  document.getElementById("roleResults").innerHTML = "";
  document.getElementById("rolePreview").innerHTML = "";
  document.getElementById("roleSelectedChip").style.display = "none";
  document.getElementById("roleSearchWrap").style.display = "block";
}

function switchMode(newMode) {
  if (newMode === state.jdMode) return;

  if (jdSourceHasData()) {
    const ok = window.confirm("Switching sources will clear the job description you've entered. Continue?");
    if (!ok) return;
  }

  clearJdSource();
  state.jdMode = newMode;

  modeTabs.forEach(t => {
    const active = t.dataset.mode === newMode;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  });
  modePanels.forEach(p => p.classList.toggle("active", p.dataset.panel === newMode));

  refreshAnalyzeState();
}

modeTabs.forEach(tab => tab.addEventListener("click", () => switchMode(tab.dataset.mode)));

/* ---- paste mode ---- */
const jdTextarea = document.getElementById("jdTextarea");
const jdCharCount = document.getElementById("jdCharCount");
const jdTextError = document.getElementById("jdTextError");
const MIN_JD_CHARS = 40;

function updateJdCharCount() {
  const len = jdTextarea.value.length;
  jdCharCount.textContent = `${len} character${len === 1 ? "" : "s"}`;
}

jdTextarea.addEventListener("input", () => {
  state.jdText = jdTextarea.value;
  updateJdCharCount();
  if (state.jdText.trim().length > 0 && state.jdText.trim().length < MIN_JD_CHARS) {
    showError(jdTextError);
  } else {
    hideError(jdTextError);
  }
  refreshAnalyzeState();
});

document.getElementById("jdClearBtn").addEventListener("click", () => {
  jdTextarea.value = "";
  state.jdText = "";
  updateJdCharCount();
  hideError(jdTextError);
  refreshAnalyzeState();
});

/* ---- upload mode ---- */
const jdDropzone = document.getElementById("jdDropzone");
const jdInput = document.getElementById("jdInput");
const jdChip = document.getElementById("jdChip");
const jdFileError = document.getElementById("jdFileError");

function setJdFile(file) {
  if (!file) return;
  if (!isValidDoc(file)) {
    showError(jdFileError);
    return;
  }
  hideError(jdFileError);
  state.jdFile = file;
  document.getElementById("jdName").textContent = file.name;
  document.getElementById("jdSize").textContent = formatBytes(file.size);
  jdDropzone.style.display = "none";
  jdChip.style.display = "flex";
  refreshAnalyzeState();
}

function clearJdFileOnly() {
  state.jdFile = null;
  jdInput.value = "";
  jdChip.style.display = "none";
  jdDropzone.style.display = "block";
  refreshAnalyzeState();
}

jdDropzone.addEventListener("click", () => jdInput.click());
jdDropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jdInput.click(); }
});
jdInput.addEventListener("change", (e) => setJdFile(e.target.files[0]));
document.getElementById("jdRemove").addEventListener("click", clearJdFileOnly);

["dragenter", "dragover"].forEach(evt =>
  jdDropzone.addEventListener(evt, (e) => { e.preventDefault(); jdDropzone.classList.add("drag"); })
);
["dragleave", "drop"].forEach(evt =>
  jdDropzone.addEventListener(evt, (e) => { e.preventDefault(); jdDropzone.classList.remove("drag"); })
);
jdDropzone.addEventListener("drop", (e) => setJdFile(e.dataTransfer.files[0]));

/* ---- role mode ---- */
const roleSearchInput = document.getElementById("roleSearchInput");
const roleResults = document.getElementById("roleResults");
const rolePreview = document.getElementById("rolePreview");
const roleSelectedChip = document.getElementById("roleSelectedChip");
const roleSearchWrap = document.getElementById("roleSearchWrap");

function renderRoleResults(query) {
  const q = query.trim().toLowerCase();
  const matches = q.length === 0
    ? JOB_ROLES
    : JOB_ROLES.filter(r => r.name.toLowerCase().includes(q));

  roleResults.innerHTML = "";

  if (JOB_ROLES.length === 0) {
    roleResults.innerHTML = `<div class="role-empty">No job roles configured yet. Add entries to the JOB_ROLES list in app.js (or wire it to a backend endpoint) to enable this mode.</div>`;
    return;
  }
  if (matches.length === 0) {
    roleResults.innerHTML = `<div class="role-empty">No roles match "${query}".</div>`;
    return;
  }
  matches.forEach(role => {
    const div = document.createElement("div");
    div.className = "role-option";
    div.textContent = role.name;
    div.addEventListener("click", () => previewRole(role));
    roleResults.appendChild(div);
  });
}

function previewRole(role) {
  rolePreview.innerHTML = `
    <div class="role-preview">
      <h4>${role.name}</h4>
      <div class="skill-group">
        <div class="sg-label">Required skills</div>
        <div class="chip-row">${role.required_skills.map(s => `<span class="chip">${s}</span>`).join("") || "<span class='chip'>—</span>"}</div>
      </div>
      <div class="skill-group">
        <div class="sg-label">Preferred skills</div>
        <div class="chip-row">${role.preferred_skills.map(s => `<span class="chip">${s}</span>`).join("") || "<span class='chip'>—</span>"}</div>
      </div>
      <button class="use-role-btn" id="useRoleBtn" type="button">Use this role</button>
    </div>
  `;
  document.getElementById("useRoleBtn").addEventListener("click", () => selectRole(role));
}

function selectRole(role) {
  state.jobRole = role;
  roleSearchWrap.style.display = "none";
  rolePreview.innerHTML = "";
  roleSelectedChip.style.display = "flex";
  document.getElementById("roleSelectedName").textContent = role.name;
  refreshAnalyzeState();
}

document.getElementById("roleRemove").addEventListener("click", () => {
  state.jobRole = null;
  roleSearchWrap.style.display = "block";
  roleSelectedChip.style.display = "none";
  roleSearchInput.value = "";
  renderRoleResults("");
  refreshAnalyzeState();
});

roleSearchInput.addEventListener("input", () => renderRoleResults(roleSearchInput.value));
renderRoleResults("");

/* ---------------------------------------------------------------------
   Analyze button state
   --------------------------------------------------------------------- */
const analyzeBtn = document.getElementById("analyzeBtn");
const analyzeStatus = document.getElementById("analyzeStatus");
const apiErrorBanner = document.getElementById("apiErrorBanner");

function refreshAnalyzeState() {
  const hasResume = !!state.resumeFile;
  let hasValidJd = false;
  let statusMsg = "";

  if (!hasResume) {
    statusMsg = "Add a resume and a job description to continue.";
  } else if (state.jdMode === "paste") {
    hasValidJd = state.jdText.trim().length >= MIN_JD_CHARS;
    statusMsg = hasValidJd ? "Ready to analyze." : `Paste at least ${MIN_JD_CHARS} characters of job description.`;
  } else if (state.jdMode === "upload") {
    hasValidJd = !!state.jdFile;
    statusMsg = hasValidJd ? "Ready to analyze." : "Upload a job description file.";
  } else if (state.jdMode === "role") {
    hasValidJd = false; // backend has no role-matching support yet
    statusMsg = state.jobRole
      ? `"${state.jobRole.name}" selected — role-based matching needs a backend endpoint before it can run.`
      : "Select a predefined job role.";
  }

  analyzeBtn.disabled = !(hasResume && hasValidJd);
  analyzeStatus.textContent = statusMsg;
}

refreshAnalyzeState();

/* ---------------------------------------------------------------------
   API abstraction
   --------------------------------------------------------------------- */
async function analyzeResume({ resumeFile, jdFile = null, jdText = null, jobRole = null }) {
  if (jobRole) {
    throw new Error(
      "Predefined job-role matching isn't supported by the backend yet. " +
      "The current /match/ endpoint only accepts an uploaded resume and job description file."
    );
  }

  const formData = new FormData();
  formData.append("resume", resumeFile);

  if (jdFile) {
    formData.append("jd", jdFile);
  } else if (jdText) {
    // The backend has no dedicated text field. Its read_file() dispatches
    // purely by file extension and already has a working .txt branch, so
    // we reuse the existing `jd` upload field with an in-memory .txt file
    // instead of inventing a new backend parameter.
    const blob = new Blob([jdText], { type: "text/plain" });
    formData.append("jd", blob, "pasted-job-description.txt");
  } else {
    throw new Error("No job description source provided.");
  }

  const response = await fetch(`${API_BASE_URL}/match/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  const data = await response.json();
  if (data.Error) {
    throw new Error(data.Error);
  }

  return normalizeResult(data);
}

function normalizeResult(raw) {
  const toNum = (v) => parseFloat(String(v).replace("%", "")) || 0;
  return {
    finalScore: toNum(raw["Final Score"]),
    skillScore: toNum(raw["Skill Match"]),
    tfidfScore: toNum(raw["TF-IDF Similarity"]),
    matchedSkills: raw["Matched Skills"] || [],
    missingSkills: raw["Missing Skills"] || [],
  };
}

/* ---------------------------------------------------------------------
   Results rendering
   --------------------------------------------------------------------- */
const resultsBlock = document.getElementById("resultsBlock");

function scoreBand(score) {
  if (score >= 75) return { label: "Strong match", good: "good", bg: "var(--good-bg)", fg: "var(--good)" };
  if (score >= 50) return { label: "Partial match", good: "mid", bg: "var(--mid-bg)", fg: "var(--mid)" };
  return { label: "Weak match", good: "low", bg: "var(--low-bg)", fg: "var(--low)" };
}

function renderResults(result) {
  const band = scoreBand(result.finalScore);

  document.getElementById("scoreDial").style.background =
    `conic-gradient(${band.fg} ${result.finalScore * 3.6}deg, ${band.bg} 0deg)`;
  document.getElementById("scoreNum").textContent = `${Math.round(result.finalScore)}%`;
  document.getElementById("scoreNum").style.color = band.fg;
  document.getElementById("scoreLabel").textContent = band.label;

  document.getElementById("skillPct").textContent = `${Math.round(result.skillScore)}%`;
  document.getElementById("skillBar").style.width = `${result.skillScore}%`;
  document.getElementById("tfidfPct").textContent = `${Math.round(result.tfidfScore)}%`;
  document.getElementById("tfidfBar").style.width = `${result.tfidfScore}%`;

  const matchedEl = document.getElementById("matchedSkills");
  const missingEl = document.getElementById("missingSkills");
  matchedEl.innerHTML = result.matchedSkills.length
    ? result.matchedSkills.map(s => `<span class="chip">${s}</span>`).join("")
    : `<span class="chip">None found</span>`;
  missingEl.innerHTML = result.missingSkills.length
    ? result.missingSkills.map(s => `<span class="chip">${s}</span>`).join("")
    : `<span class="chip">None</span>`;

  let sourceLabel = "";
  if (state.jdMode === "upload") {
    sourceLabel = `Uploaded: ${state.jdFile.name}`;
  } else if (state.jdMode === "paste") {
    sourceLabel = "Pasted text";
  }
  document.getElementById("resultsSource").innerHTML =
    `Analyzed against<br><strong>${sourceLabel}</strong>`;

  resultsBlock.classList.add("show");
  resultsBlock.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------------------------------------------------------------
   Analyze click
   --------------------------------------------------------------------- */
analyzeBtn.addEventListener("click", async () => {
  hideError(apiErrorBanner);
  apiErrorBanner.textContent = "";

  analyzeBtn.disabled = true;
  analyzeBtn.classList.add("loading");
  document.getElementById("analyzeBtnLabel").textContent = "Analyzing…";

  try {
    const result = await analyzeResume({
      resumeFile: state.resumeFile,
      jdFile: state.jdMode === "upload" ? state.jdFile : null,
      jdText: state.jdMode === "paste" ? state.jdText : null,
      jobRole: state.jdMode === "role" ? state.jobRole : null,
    });
    renderResults(result);
  } catch (err) {
    apiErrorBanner.textContent =
      `Couldn't complete the analysis: ${err.message}. ` +
      `Check that the backend is running at ${API_BASE_URL} and has CORS enabled for this origin.`;
    showError(apiErrorBanner);
  } finally {
    analyzeBtn.classList.remove("loading");
    document.getElementById("analyzeBtnLabel").textContent = "Analyze match";
    refreshAnalyzeState();
  }
});
