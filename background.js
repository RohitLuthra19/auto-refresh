const DEFAULT_REFRESH_SECONDS = 60;
const ALARM_NAME = "autoRefreshCurrentPage";

function scheduleRefreshAlarm() {
  chrome.storage.sync.get(
    { refreshIntervalSeconds: DEFAULT_REFRESH_SECONDS },
    ({ refreshIntervalSeconds }) => {
      const seconds = Math.max(5, Number(refreshIntervalSeconds) || DEFAULT_REFRESH_SECONDS);

      chrome.alarms.clear(ALARM_NAME, () => {
        chrome.alarms.create(ALARM_NAME, {
          periodInMinutes: seconds / 60,
        });
      });
    }
  );
}

function reloadActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (!tab || !tab.id || !tab.url) {
      return;
    }

    if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
      return;
    }

    chrome.tabs.reload(tab.id);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleRefreshAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleRefreshAlarm();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.refreshIntervalSeconds) {
    scheduleRefreshAlarm();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    reloadActiveTab();
  }
});
