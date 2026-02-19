const DEFAULT_REFRESH_SECONDS = 60;

chrome.storage.sync.get(
  { refreshIntervalSeconds: DEFAULT_REFRESH_SECONDS },
  ({ refreshIntervalSeconds }) => {
    document.getElementById(
      "currentInterval"
    ).textContent = `Interval: ${refreshIntervalSeconds} seconds`;
  }
);

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
