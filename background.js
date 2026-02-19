const DEFAULT_REFRESH_SECONDS = 60;
const ALARM_NAME = "autoRefreshCurrentPage";

function scheduleRefreshAlarm() {
  chrome.storage.sync.get(
    {
      refreshIntervalSeconds: DEFAULT_REFRESH_SECONDS,
      isAutoRefreshEnabled: false,
    },
    ({ refreshIntervalSeconds, isAutoRefreshEnabled }) => {
      if (!isAutoRefreshEnabled) {
        chrome.alarms.clear(ALARM_NAME);
        return;
      }

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
  chrome.storage.local.get({ targetTabId: null }, ({ targetTabId }) => {
    if (!targetTabId) {
      return;
    }

    chrome.tabs.get(targetTabId, (tab) => {
      if (chrome.runtime.lastError || !tab || !tab.id || !tab.url) {
        chrome.alarms.clear(ALARM_NAME);
        chrome.storage.sync.set({ isAutoRefreshEnabled: false });
        return;
      }

      if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
        return;
      }

      chrome.tabs.reload(tab.id);
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleRefreshAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleRefreshAlarm();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "START_AUTO_REFRESH") {
    const targetTabId = Number(message.tabId);

    if (Number.isInteger(targetTabId)) {
      chrome.storage.local.set({ targetTabId }, () => {
        scheduleRefreshAlarm();
      });
    } else {
      scheduleRefreshAlarm();
    }
    return;
  }

  if (message?.type === "STOP_AUTO_REFRESH") {
    chrome.alarms.clear(ALARM_NAME);
    chrome.storage.local.remove("targetTabId");
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === "sync" &&
    (changes.refreshIntervalSeconds || changes.isAutoRefreshEnabled)
  ) {
    scheduleRefreshAlarm();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    reloadActiveTab();
  }
});
