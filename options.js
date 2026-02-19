const DEFAULT_REFRESH_SECONDS = 60;

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    {
      refreshIntervalSeconds: DEFAULT_REFRESH_SECONDS,
    },
    (result) => {
      document.getElementById("refreshInterval").value =
        result.refreshIntervalSeconds;
    }
  );
});

document.getElementById("save").addEventListener("click", () => {
  const refreshInterval = Number(
    document.getElementById("refreshInterval").value
  );

  if (!Number.isFinite(refreshInterval) || refreshInterval < 5) {
    alert("Please enter a refresh interval of at least 5 seconds");
    return;
  }

  chrome.storage.sync.set(
    {
      refreshIntervalSeconds: Math.floor(refreshInterval),
    },
    () => {
      const status = document.getElementById("status");
      status.textContent = "Saved successfully!";
      setTimeout(() => (status.textContent = ""), 2000);
    }
  );
});
