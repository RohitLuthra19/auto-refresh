const DEFAULT_REFRESH_SECONDS = 60;
const toggleButton = document.getElementById("startOperation");
const statusLabel = document.getElementById("currentStatus");
const intervalLabel = document.getElementById("currentInterval");

function updateToggleUi(isRunning) {
  statusLabel.textContent = `Status: ${isRunning ? "Running" : "Stopped"}`;
  toggleButton.textContent = isRunning ? "Stop Operation" : "Start Operation";
}

function isCurrentTabTracked(tab, state) {
  if (!tab || !tab.id || !state.isAutoRefreshEnabled) {
    return false;
  }

  return (
    Number(tab.id) === Number(state.targetTabId) &&
    Number(tab.windowId) === Number(state.targetWindowId) &&
    Boolean(tab.incognito) === Boolean(state.targetIncognito)
  );
}

function refreshPopupState() {
  chrome.storage.sync.get(
    { refreshIntervalSeconds: DEFAULT_REFRESH_SECONDS },
    ({ refreshIntervalSeconds }) => {
      intervalLabel.textContent = `Interval: ${refreshIntervalSeconds} seconds`;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];

        chrome.storage.local.get(
          {
            isAutoRefreshEnabled: false,
            targetTabId: null,
            targetWindowId: null,
            targetIncognito: false,
          },
          (state) => {
            updateToggleUi(isCurrentTabTracked(tab, state));
          }
        );
      });
    }
  );
}

refreshPopupState();

document.getElementById("startOperation").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (!tab || !tab.id) {
      return;
    }

    chrome.storage.local.get(
      {
        isAutoRefreshEnabled: false,
        targetTabId: null,
        targetWindowId: null,
        targetIncognito: false,
      },
      (state) => {
        if (isCurrentTabTracked(tab, state)) {
          chrome.runtime.sendMessage({ type: "STOP_AUTO_REFRESH" }, () => {
            updateToggleUi(false);
          });
          return;
        }

        chrome.runtime.sendMessage(
          {
            type: "START_AUTO_REFRESH",
            tabId: tab.id,
            windowId: tab.windowId,
            incognito: Boolean(tab.incognito),
          },
          () => {
            updateToggleUi(true);
          }
        );
      }
    );
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.refreshIntervalSeconds) {
    refreshPopupState();
  }

  if (
    area === "local" &&
    (
      changes.isAutoRefreshEnabled ||
      changes.targetTabId ||
      changes.targetWindowId ||
      changes.targetIncognito
    )
  ) {
    refreshPopupState();
  }
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
