async function main() {
  const res = await fetch("metadata.json");
  const data = await res.json();

  const yearSelect = document.getElementById("yearSelect");
  const stormSelect = document.getElementById("stormSelect");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const matchSelect = document.getElementById("matchSelect");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const msg = document.getElementById("msg");
  const stormImg = document.getElementById("stormImg");

  const years = ["All years", ...data.years];
  const entries = data.entries;

  let currentYear = data.years[0];
  let currentStormValue = "All storms";

  function setOptions(select, options, selectedValue) {
    select.innerHTML = "";
    for (const opt of options) {
      const el = document.createElement("option");
      el.textContent = opt.label;
      el.value = JSON.stringify(opt.value);
      if (JSON.stringify(opt.value) === JSON.stringify(selectedValue)) {
        el.selected = true;
      }
      select.appendChild(el);
    }
  }

  function getYearEntries(year) {
    return entries.filter(e => e.year === year);
  }

  function getStormOptionsForYear(year) {
    if (year === "All years") {
      return [{ label: "All storms", value: "All storms" }];
    }

    const matches = entries.filter(e => e.year === year);
    const opts = matches.map(e => ({
      label: e.storm_label,
      value: e.storm_value
    }));

    const seen = new Set();
    return opts.filter(o => {
      const key = JSON.stringify(o.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function findEntry(year, stormValue) {
    return entries.find(
      e =>
        JSON.stringify(e.year) === JSON.stringify(year) &&
        JSON.stringify(e.storm_value) === JSON.stringify(stormValue)
    );
  }

  function renderImage() {
    const entry = findEntry(currentYear, currentStormValue);
    if (!entry) {
      msg.textContent = "No image found for that selection.";
      stormImg.removeAttribute("src");
      return;
    }
    msg.textContent = "";
    stormImg.src = entry.image;
    stormImg.alt = `${entry.year} ${entry.storm_label}`;
  }

  function refreshYearOptions() {
    setOptions(
      yearSelect,
      years.map(y => ({ label: String(y), value: y })),
      currentYear
    );
  }

  function refreshStormOptions() {
    const stormOpts = getStormOptionsForYear(currentYear);
    const found = stormOpts.some(
      o => JSON.stringify(o.value) === JSON.stringify(currentStormValue)
    );
    if (!found) currentStormValue = "All storms";
    setOptions(stormSelect, stormOpts, currentStormValue);
  }

  function setSelection(year, stormValue) {
    currentYear = year;
    currentStormValue = stormValue;
    refreshYearOptions();
    refreshStormOptions();
    renderImage();
  }

  function doSearch() {
    const q = searchInput.value.trim().toUpperCase();

    if (!q) {
      msg.textContent = "Type a storm name.";
      matchSelect.innerHTML = "";
      return;
    }

    const hits = entries
      .filter(e => e.year !== "All years")
      .filter(e => e.storm_value !== "All storms")
      .filter(e => e.storm_name.toUpperCase().includes(q))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.storm_value - b.storm_value;
      });

    if (!hits.length) {
      msg.textContent = "No matches found.";
      matchSelect.innerHTML = "";
      return;
    }

    const maxShow = 200;
    const shown = hits.slice(0, maxShow);

    setOptions(
      matchSelect,
      shown.map(h => ({
        label: `${h.year}  ${h.storm_label}`,
        value: { year: h.year, storm_value: h.storm_value }
      })),
      { year: shown[0].year, storm_value: shown[0].storm_value }
    );

    if (hits.length > maxShow) {
      msg.textContent = `Too many matches; showing first ${maxShow}. Refine search.`;
    } else {
      msg.textContent = `Found ${hits.length} match(es).`;
    }

    setSelection(shown[0].year, shown[0].storm_value);
  }

  yearSelect.addEventListener("change", () => {
    currentYear = JSON.parse(yearSelect.value);
    currentStormValue = "All storms";
    refreshStormOptions();
    renderImage();
  });

  stormSelect.addEventListener("change", () => {
    currentStormValue = JSON.parse(stormSelect.value);
    renderImage();
  });

  prevBtn.addEventListener("click", () => {
    if (currentYear === "All years") return;
    const idx = data.years.indexOf(currentYear);
    if (idx > 0) {
      setSelection(data.years[idx - 1], "All storms");
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentYear === "All years") return;
    const idx = data.years.indexOf(currentYear);
    if (idx < data.years.length - 1) {
      setSelection(data.years[idx + 1], "All storms");
    }
  });

  searchBtn.addEventListener("click", doSearch);

  matchSelect.addEventListener("change", () => {
    const val = JSON.parse(matchSelect.value);
    setSelection(val.year, val.storm_value);
  });

  refreshYearOptions();
  refreshStormOptions();
  renderImage();
}

main();