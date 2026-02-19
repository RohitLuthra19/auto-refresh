const DEFAULT_REFRESH_SECONDS = 60;
const ALARM_NAME = "autoRefreshCurrentPage";

function scheduleRefreshAlarm() {
  chrome.storage.local.get(
    { isAutoRefreshEnabled: false },
    ({ isAutoRefreshEnabled }) => {
      if (!isAutoRefreshEnabled) {
        chrome.alarms.clear(ALARM_NAME);
        return;
      }

      chrome.storage.sync.get(
        { refreshIntervalSeconds: DEFAULT_REFRESH_SECONDS },
        ({ refreshIntervalSeconds }) => {
          const seconds = Math.max(
            5,
            Number(refreshIntervalSeconds) || DEFAULT_REFRESH_SECONDS
          );

          chrome.alarms.clear(ALARM_NAME, () => {
            chrome.alarms.create(ALARM_NAME, {
              periodInMinutes: seconds / 60,
            });
          });
        }
      );
    }
  );
}

function stopAutoRefresh() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.set({
    isAutoRefreshEnabled: false,
    targetTabId: null,
    targetWindowId: null,
    targetIncognito: null,
  });
}

function reloadActiveTab() {
  chrome.storage.local.get(
    { targetTabId: null, targetWindowId: null, targetIncognito: null },
    ({ targetTabId, targetWindowId, targetIncognito }) => {
      if (!targetTabId) {
        return;
      }

      chrome.tabs.get(targetTabId, (tab) => {
        if (chrome.runtime.lastError || !tab || !tab.id || !tab.url) {
          stopAutoRefresh();
          return;
        }

        if (
          Number.isInteger(targetWindowId) &&
          Number(tab.windowId) !== Number(targetWindowId)
        ) {
          return;
        }

        if (
          typeof targetIncognito === "boolean" &&
          Boolean(tab.incognito) !== targetIncognito
        ) {
          return;
        }

        if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
          return;
        }

        chrome.tabs.reload(tab.id);
      });
    }
  );
}

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get({ targetTabId: null }, ({ targetTabId }) => {
    if (Number(tabId) === Number(targetTabId)) {
      stopAutoRefresh();
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  scheduleRefreshAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleRefreshAlarm();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "START_AUTO_REFRESH") {
    const targetTabId = Number(message.tabId);
    const targetWindowId = Number(message.windowId);
    const targetIncognito = Boolean(message.incognito);

    if (Number.isInteger(targetTabId)) {
      chrome.storage.local.set(
        {
          isAutoRefreshEnabled: true,
          targetTabId,
          targetWindowId: Number.isInteger(targetWindowId)
            ? targetWindowId
            : null,
          targetIncognito,
        },
        () => {
          scheduleRefreshAlarm();
        }
      );
    }
    return;
  }

  if (message?.type === "STOP_AUTO_REFRESH") {
    stopAutoRefresh();
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.refreshIntervalSeconds) {
    scheduleRefreshAlarm();
  }

  if (area === "local" && changes.isAutoRefreshEnabled) {
    scheduleRefreshAlarm();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    reloadActiveTab();
  }
});
