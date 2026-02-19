const DEFAULT_REFRESH_SECONDS = 60;
const toggleButton = document.getElementById("startOperation");
const statusLabel = document.getElementById("currentStatus");

function updateToggleUi(isRunning) {
  statusLabel.textContent = `Status: ${isRunning ? "Running" : "Stopped"}`;
  toggleButton.textContent = isRunning ? "Stop Operation" : "Start Operation";
}

chrome.storage.sync.get(
  {
    refreshIntervalSeconds: DEFAULT_REFRESH_SECONDS,
    isAutoRefreshEnabled: false,
  },
  ({ refreshIntervalSeconds, isAutoRefreshEnabled }) => {
    document.getElementById(
      "currentInterval"
    ).textContent = `Interval: ${refreshIntervalSeconds} seconds`;
    updateToggleUi(isAutoRefreshEnabled);
  }
);

document.getElementById("startOperation").addEventListener("click", () => {
  chrome.storage.sync.get({ isAutoRefreshEnabled: false }, ({ isAutoRefreshEnabled }) => {
    if (isAutoRefreshEnabled) {
      chrome.storage.sync.set({ isAutoRefreshEnabled: false }, () => {
        chrome.runtime.sendMessage({ type: "STOP_AUTO_REFRESH" });
        updateToggleUi(false);
      });
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (!tab || !tab.id) {
        return;
      }

      chrome.storage.sync.set({ isAutoRefreshEnabled: true }, () => {
        chrome.runtime.sendMessage({ type: "START_AUTO_REFRESH", tabId: tab.id });
        updateToggleUi(true);
      });
    });
  });
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
