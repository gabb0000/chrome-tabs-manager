// Utility function to show toast notifications
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Format date for display
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Adesso';
  if (diffMins < 60) return `${diffMins} minuti fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays < 7) return `${diffDays} giorni fa`;

  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Save current tab
async function saveCurrentTab() {
  const sessionName = document.getElementById('sessionName').value.trim();
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const session = {
    id: Date.now().toString(),
    name: sessionName || `Scheda - ${new Date().toLocaleString('it-IT')}`,
    timestamp: Date.now(),
    tabs: [{
      url: currentTab.url,
      title: currentTab.title,
      pinned: currentTab.pinned,
      index: currentTab.index
    }]
  };

  const saved = await saveSession(session);
  if (!saved) {
    showToast('Salvataggio annullato');
    return;
  }

  await chrome.tabs.remove(currentTab.id);

  document.getElementById('sessionName').value = '';
  showToast('Scheda salvata e chiusa!');
  loadSessions();
}

// Save all tabs in current window
async function saveAllTabs() {
  const sessionName = document.getElementById('sessionName').value.trim();
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const session = {
    id: Date.now().toString(),
    name: sessionName || `Tutte le schede - ${new Date().toLocaleString('it-IT')}`,
    timestamp: Date.now(),
    tabs: tabs.map(tab => ({
      url: tab.url,
      title: tab.title,
      pinned: tab.pinned,
      groupId: tab.groupId,
      index: tab.index
    }))
  };

  // Get group information if tabs are grouped
  const groupIds = [...new Set(tabs.map(t => t.groupId).filter(id => id !== -1))];
  if (groupIds.length > 0) {
    session.groups = {};
    for (const groupId of groupIds) {
      const group = await chrome.tabGroups.get(groupId);
      session.groups[groupId] = {
        title: group.title,
        color: group.color,
        collapsed: group.collapsed
      };
    }
  }

  const saved = await saveSession(session);
  if (!saved) {
    showToast('Salvataggio annullato');
    return;
  }

  await chrome.tabs.remove(tabs.map(tab => tab.id));

  document.getElementById('sessionName').value = '';
  showToast('Tutte le schede salvate e chiuse!');
  loadSessions();
}

// Save current tab group
async function saveTabGroup() {
  const sessionName = document.getElementById('sessionName').value.trim();
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (currentTab.groupId === -1) {
    showToast('La scheda corrente non è in un gruppo!');
    return;
  }

  const group = await chrome.tabGroups.get(currentTab.groupId);
  const groupTabs = await chrome.tabs.query({ groupId: currentTab.groupId });

  const session = {
    id: Date.now().toString(),
    name: sessionName || group.title || `Gruppo - ${new Date().toLocaleString('it-IT')}`,
    timestamp: Date.now(),
    tabs: groupTabs.map(tab => ({
      url: tab.url,
      title: tab.title,
      pinned: tab.pinned,
      groupId: tab.groupId,
      index: tab.index
    })),
    groups: {
      [currentTab.groupId]: {
        title: group.title,
        color: group.color,
        collapsed: group.collapsed
      }
    }
  };

  const saved = await saveSession(session);
  if (!saved) {
    showToast('Salvataggio annullato');
    return;
  }

  await chrome.tabs.remove(groupTabs.map(tab => tab.id));

  document.getElementById('sessionName').value = '';
  showToast('Gruppo salvato e chiuso!');
  loadSessions();
}

// Save entire window
async function saveWindow() {
  const sessionName = document.getElementById('sessionName').value.trim();
  const currentWindow = await chrome.windows.getCurrent({ populate: true });
  const tabs = currentWindow.tabs;

  const session = {
    id: Date.now().toString(),
    name: sessionName || `Finestra - ${new Date().toLocaleString('it-IT')}`,
    timestamp: Date.now(),
    isWindow: true,
    windowState: {
      state: currentWindow.state,
      width: currentWindow.width,
      height: currentWindow.height,
      top: currentWindow.top,
      left: currentWindow.left,
      focused: currentWindow.focused,
      incognito: currentWindow.incognito
    },
    tabs: tabs.map(tab => ({
      url: tab.url,
      title: tab.title,
      pinned: tab.pinned,
      groupId: tab.groupId,
      index: tab.index,
      active: tab.active
    }))
  };

  // Get group information if tabs are grouped
  const groupIds = [...new Set(tabs.map(t => t.groupId).filter(id => id !== -1))];
  if (groupIds.length > 0) {
    session.groups = {};
    for (const groupId of groupIds) {
      try {
        const group = await chrome.tabGroups.get(groupId);
        session.groups[groupId] = {
          title: group.title,
          color: group.color,
          collapsed: group.collapsed
        };
      } catch (e) {
        // Group might not exist anymore
      }
    }
  }

  const saved = await saveSession(session);
  if (!saved) {
    showToast('Salvataggio annullato');
    return;
  }

  await chrome.windows.remove(currentWindow.id);

  document.getElementById('sessionName').value = '';
  showToast('Finestra salvata e chiusa!');
  loadSessions();
}


// Save session to storage
async function saveSession(session, skipDuplicateCheck = false) {
  const { sessions = [] } = await chrome.storage.local.get('sessions');

  // Check for duplicate names (only if session has a custom name)
  if (!skipDuplicateCheck && session.name && !session.name.includes(' - ')) {
    const existingSession = sessions.find(s => s.name === session.name);

    if (existingSession) {
      const shouldReplace = confirm(
        `Esiste già una sessione con il nome "${session.name}".\n\n` +
        `Sessione esistente: ${existingSession.tabs.length} ${existingSession.tabs.length === 1 ? 'scheda' : 'schede'}\n` +
        `Nuova sessione: ${session.tabs.length} ${session.tabs.length === 1 ? 'scheda' : 'schede'}\n\n` +
        `Vuoi sostituire la sessione esistente?`
      );

      if (shouldReplace) {
        // Remove the old session and add the new one
        const updatedSessions = sessions.filter(s => s.name !== session.name);
        updatedSessions.unshift(session);
        await chrome.storage.local.set({ sessions: updatedSessions });
        return true;
      } else {
        // User cancelled, don't save
        return false;
      }
    }
  }

  // No duplicate or user wants to keep both
  sessions.unshift(session);
  await chrome.storage.local.set({ sessions });
  return true;
}

// Restore session
async function restoreSession(sessionId) {
  try {
    console.log('=== RESTORE SESSION DEBUG ===');
    console.log('Session ID:', sessionId);

    const { sessions = [] } = await chrome.storage.local.get('sessions');
    console.log('Total sessions found:', sessions.length);

    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      console.error('Session not found with ID:', sessionId);
      showToast('❌ Errore: Sessione non trovata');
      return;
    }

    console.log('Session found:', session.name);
    console.log('Session type:', session.isWindow ? 'WINDOW' : 'TABS');
    console.log('Session data:', JSON.stringify(session, null, 2));

    // Validate session data
    if (!session.tabs || session.tabs.length === 0) {
      showToast('❌ Errore: Sessione vuota o non valida');
      console.error('Invalid session data:', session);
      return;
    }

    // Check if this is a window session
    if (session.isWindow && session.windowState) {
      await restoreWindow(session);
      return;
    }

    // Regular tab restoration in current window
    const window = await chrome.windows.getCurrent();
    const createdTabs = [];

    // Sort tabs by their original index to restore in correct order
    const sortedTabs = [...session.tabs].sort((a, b) => (a.index || 0) - (b.index || 0));

    // Filter out invalid URLs
    const validTabs = sortedTabs.filter(tab => {
      if (!tab.url) {
        console.warn('Tab without URL found, skipping:', tab);
        return false;
      }
      // Chrome doesn't allow extensions to open certain URLs
      if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
        console.warn('Restricted URL found, skipping:', tab.url);
        return false;
      }
      return true;
    });

    if (validTabs.length === 0) {
      showToast('❌ Errore: Nessuna scheda valida da ripristinare');
      console.error('No valid tabs to restore in session:', session);
      return;
    }

    // Create tabs
    for (let i = 0; i < validTabs.length; i++) {
      const tabData = validTabs[i];
      try {
        console.log(`Creating tab ${i + 1}/${validTabs.length}:`, tabData.url);
        const tab = await chrome.tabs.create({
          url: tabData.url,
          pinned: tabData.pinned,
          active: i === 0,
          windowId: window.id,
          index: tabData.index !== undefined ? tabData.index : undefined
        });
        createdTabs.push({ ...tab, originalGroupId: tabData.groupId });
      } catch (tabError) {
        console.error(`Failed to create tab ${i}:`, tabData.url, tabError);
        // Continue with other tabs even if one fails
      }
    }

    // Recreate groups if they existed
    if (session.groups) {
      const groupMapping = {};

      for (const [originalGroupId, groupData] of Object.entries(session.groups)) {
        const tabsInGroup = createdTabs.filter(t => t.originalGroupId == originalGroupId);

        if (tabsInGroup.length > 0) {
          try {
            const groupId = await chrome.tabs.group({
              tabIds: tabsInGroup.map(t => t.id)
            });

            await chrome.tabGroups.update(groupId, {
              title: groupData.title,
              color: groupData.color,
              collapsed: groupData.collapsed
            });

            groupMapping[originalGroupId] = groupId;
          } catch (groupError) {
            console.error('Failed to create group:', groupData, groupError);
            // Continue even if group creation fails
          }
        }
      }
    }

    const skippedCount = sortedTabs.length - validTabs.length;
    if (skippedCount > 0) {
      showToast(`✅ Sessione ripristinata! (${skippedCount} scheda/e non valida/e saltata/e)`);
    } else {
      showToast('✅ Sessione ripristinata!');
    }
  } catch (error) {
    console.error('Error restoring session:', error);
    showToast(`❌ Errore nel ripristino della sessione: ${error.message}`);
  }
}

// Restore window session
async function restoreWindow(session) {
  try {
    console.log('=== RESTORE WINDOW DEBUG ===');
    console.log('Window session name:', session.name);

    // Validate session data
    if (!session || !session.tabs || session.tabs.length === 0) {
      showToast('❌ Errore: Sessione non valida o vuota');
      console.error('Invalid session data:', session);
      return;
    }
    console.log('✓ Session data valid, tabs count:', session.tabs.length);

    if (!session.windowState) {
      showToast('❌ Errore: Dati finestra mancanti');
      console.error('Missing windowState in session:', session);
      return;
    }
    console.log('✓ Window state exists:', session.windowState);

    const windowState = session.windowState;

    // Sort tabs by their original index
    const sortedTabs = [...session.tabs].sort((a, b) => (a.index || 0) - (b.index || 0));

    // Filter out invalid URLs
    const validTabs = sortedTabs.filter(tab => {
      if (!tab.url) {
        console.warn('Tab without URL found, skipping:', tab);
        return false;
      }
      // Chrome doesn't allow extensions to open certain URLs
      if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
        console.warn('Restricted URL found, skipping:', tab.url);
        return false;
      }
      return true;
    });

    if (validTabs.length === 0) {
      showToast('❌ Errore: Nessuna scheda valida da ripristinare');
      console.error('No valid tabs to restore in session:', session);
      return;
    }

    // Create window with first tab
    const firstTab = validTabs[0];
    console.log('Creating window with first tab:', firstTab.url);

    // Prepare window creation options
    const windowOptions = {
      url: firstTab.url,
      focused: true
    };

    // Chrome doesn't allow 'state' with custom width/height
    // Only add dimensions if they're valid, otherwise let Chrome use defaults
    if (windowState.width && windowState.height &&
      windowState.width > 0 && windowState.height > 0) {
      windowOptions.width = windowState.width;
      windowOptions.height = windowState.height;
      console.log('Using saved dimensions:', windowState.width, 'x', windowState.height);
    } else {
      // Use default dimensions
      windowOptions.width = 1200;
      windowOptions.height = 800;
      console.log('Using default dimensions: 1200 x 800');
    }

    // Only add position if valid (not negative or undefined)
    if (windowState.top != null && windowState.top >= 0) {
      windowOptions.top = windowState.top;
    }
    if (windowState.left != null && windowState.left >= 0) {
      windowOptions.left = windowState.left;
    }

    console.log('Window creation options:', windowOptions);

    const newWindow = await chrome.windows.create(windowOptions);

    if (!newWindow || !newWindow.tabs || newWindow.tabs.length === 0) {
      showToast('❌ Errore: Impossibile creare la finestra');
      console.error('Failed to create window');
      return;
    }

    const createdTabs = [{ ...newWindow.tabs[0], originalGroupId: firstTab.groupId, wasActive: firstTab.active }];

    // Create remaining tabs
    for (let i = 1; i < validTabs.length; i++) {
      const tabData = validTabs[i];
      try {
        console.log(`Creating tab ${i + 1}/${validTabs.length}:`, tabData.url);
        const tab = await chrome.tabs.create({
          url: tabData.url,
          pinned: tabData.pinned,
          active: false,
          windowId: newWindow.id
        });
        createdTabs.push({ ...tab, originalGroupId: tabData.groupId, wasActive: tabData.active });
      } catch (tabError) {
        console.error(`Failed to create tab ${i}:`, tabData.url, tabError);
        // Continue with other tabs even if one fails
      }
    }

    // Recreate groups if they existed
    if (session.groups) {
      for (const [originalGroupId, groupData] of Object.entries(session.groups)) {
        const tabsInGroup = createdTabs.filter(t => t.originalGroupId == originalGroupId);

        if (tabsInGroup.length > 0) {
          try {
            const groupId = await chrome.tabs.group({
              tabIds: tabsInGroup.map(t => t.id),
              createProperties: { windowId: newWindow.id }
            });

            await chrome.tabGroups.update(groupId, {
              title: groupData.title,
              color: groupData.color,
              collapsed: groupData.collapsed
            });
          } catch (groupError) {
            console.error('Failed to create group:', groupData, groupError);
            // Continue even if group creation fails
          }
        }
      }
    }

    // Activate the originally active tab
    const activeTab = createdTabs.find(t => t.wasActive);
    if (activeTab) {
      try {
        await chrome.tabs.update(activeTab.id, { active: true });
      } catch (activateError) {
        console.error('Failed to activate tab:', activateError);
        // Not critical, window is still restored
      }
    }

    const skippedCount = sortedTabs.length - validTabs.length;
    if (skippedCount > 0) {
      showToast(`✅ Finestra ripristinata! (${skippedCount} scheda/e non valida/e saltata/e)`);
    } else {
      showToast('✅ Finestra ripristinata!');
    }
  } catch (error) {
    console.error('Error restoring window:', error);
    showToast(`❌ Errore nel ripristino della finestra: ${error.message}`);
  }
}

// Update existing session with current state
async function updateSession(sessionId, sessionName, isWindow) {
  const { sessions = [] } = await chrome.storage.local.get('sessions');
  const existingSession = sessions.find(s => s.id === sessionId);

  if (!existingSession) {
    showToast('Sessione non trovata!');
    return;
  }

  // Get all windows to let user choose
  const allWindows = await chrome.windows.getAll({ populate: true });

  let selectedWindow;

  // If there's more than one window, let user choose
  if (allWindows.length > 1) {
    const windowChoices = allWindows.map((win, index) => {
      const tabCount = win.tabs.length;
      const windowType = win.incognito ? '🕵️ Incognito' : '🪟 Normale';
      return `${index + 1}. ${windowType} - ${tabCount} ${tabCount === 1 ? 'scheda' : 'schede'}`;
    }).join('\n');

    const choice = prompt(
      `Seleziona quale finestra usare per aggiornare la sessione "${sessionName}":\n\n` +
      windowChoices +
      `\n\nInserisci il numero della finestra (1-${allWindows.length}) o premi Annulla:`
    );

    if (!choice) {
      return; // User cancelled
    }

    const windowIndex = parseInt(choice) - 1;
    if (isNaN(windowIndex) || windowIndex < 0 || windowIndex >= allWindows.length) {
      showToast('Selezione non valida!');
      return;
    }

    selectedWindow = allWindows[windowIndex];
  } else {
    // Only one window, use it
    selectedWindow = allWindows[0];
  }

  const tabs = selectedWindow.tabs;

  // Confirm update
  const shouldUpdate = confirm(
    `Vuoi aggiornare la sessione "${sessionName}"?\n\n` +
    `Sessione attuale: ${existingSession.tabs.length} ${existingSession.tabs.length === 1 ? 'scheda' : 'schede'}\n` +
    `Nuova sessione: ${tabs.length} ${tabs.length === 1 ? 'scheda' : 'schede'}\n\n` +
    `Le schede/finestre correnti NON verranno chiuse.`
  );

  if (!shouldUpdate) {
    return;
  }

  // Get current state based on session type
  let updatedSession;

  if (isWindow === 'true' || isWindow === true) {
    // Update window session
    updatedSession = {
      ...existingSession,
      timestamp: Date.now(),
      windowState: {
        state: selectedWindow.state,
        width: selectedWindow.width,
        height: selectedWindow.height,
        top: selectedWindow.top,
        left: selectedWindow.left,
        focused: selectedWindow.focused,
        incognito: selectedWindow.incognito
      },
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        pinned: tab.pinned,
        groupId: tab.groupId,
        index: tab.index,
        active: tab.active
      }))
    };

    // Update group information
    const groupIds = [...new Set(tabs.map(t => t.groupId).filter(id => id !== -1))];
    if (groupIds.length > 0) {
      updatedSession.groups = {};
      for (const groupId of groupIds) {
        try {
          const group = await chrome.tabGroups.get(groupId);
          updatedSession.groups[groupId] = {
            title: group.title,
            color: group.color,
            collapsed: group.collapsed
          };
        } catch (e) {
          // Group might not exist anymore
        }
      }
    } else {
      delete updatedSession.groups;
    }
  } else {
    // Update tab session
    updatedSession = {
      ...existingSession,
      timestamp: Date.now(),
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        pinned: tab.pinned,
        groupId: tab.groupId,
        index: tab.index
      }))
    };

    // Update group information
    const groupIds = [...new Set(tabs.map(t => t.groupId).filter(id => id !== -1))];
    if (groupIds.length > 0) {
      updatedSession.groups = {};
      for (const groupId of groupIds) {
        try {
          const group = await chrome.tabGroups.get(groupId);
          updatedSession.groups[groupId] = {
            title: group.title,
            color: group.color,
            collapsed: group.collapsed
          };
        } catch (e) {
          // Group might not exist anymore
        }
      }
    } else {
      delete updatedSession.groups;
    }
  }

  // Replace the session in the array
  const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
  await chrome.storage.local.set({ sessions: updatedSessions });

  showToast('Sessione aggiornata!');
  loadSessions();
}

// Rename session
async function renameSession(sessionId, oldName) {
  const newName = prompt('Inserisci il nuovo nome per la sessione:', oldName);

  if (!newName || newName.trim() === '') {
    return;
  }

  if (newName.trim() === oldName) {
    return;
  }

  const { sessions = [] } = await chrome.storage.local.get('sessions');
  const updatedSessions = sessions.map(s =>
    s.id === sessionId ? { ...s, name: newName.trim() } : s
  );

  await chrome.storage.local.set({ sessions: updatedSessions });
  showToast('Sessione rinominata!');
  loadSessions();
}

// Move session up or down
async function moveSession(sessionId, direction) {
  const { sessions = [] } = await chrome.storage.local.get('sessions');
  const currentIndex = sessions.findIndex(s => s.id === sessionId);

  if (currentIndex === -1) return;

  let newIndex;
  if (direction === 'up') {
    if (currentIndex === 0) return;
    newIndex = currentIndex - 1;
  } else {
    if (currentIndex === sessions.length - 1) return;
    newIndex = currentIndex + 1;
  }

  // Swap sessions
  const updatedSessions = [...sessions];
  [updatedSessions[currentIndex], updatedSessions[newIndex]] =
    [updatedSessions[newIndex], updatedSessions[currentIndex]];

  await chrome.storage.local.set({ sessions: updatedSessions });
  loadSessions();
}

// Delete session
async function deleteSession(sessionId) {
  const { sessions = [] } = await chrome.storage.local.get('sessions');
  const updatedSessions = sessions.filter(s => s.id !== sessionId);
  await chrome.storage.local.set({ sessions: updatedSessions });

  showToast('Sessione eliminata!');
  loadSessions();
}

// Load and display sessions
async function loadSessions() {
  const { sessions = [] } = await chrome.storage.local.get('sessions');
  const sessionsList = document.getElementById('sessionsList');

  if (sessions.length === 0) {
    sessionsList.innerHTML = '<p class="empty-state">Nessuna sessione salvata</p>';
    return;
  }

  sessionsList.innerHTML = sessions.map((session, index) => `
    <div class="session-item" data-session-id="${session.id}" data-session-index="${index}">
      <div class="session-header">
        <span class="session-name" data-session-id="${session.id}">${session.isWindow ? '🪟 ' : ''}${session.name}</span>
        <div class="session-controls">
          <button class="btn-icon rename-btn" data-session-id="${session.id}" data-session-name="${session.name}" title="Rinomina">
            <span class="icon">✏️</span>
          </button>
          <div class="move-buttons">
            <button class="btn-icon move-up-btn" data-session-id="${session.id}" ${index === 0 ? 'disabled' : ''} title="Sposta su">
              <span class="icon">⬆️</span>
            </button>
            <button class="btn-icon move-down-btn" data-session-id="${session.id}" ${index === sessions.length - 1 ? 'disabled' : ''} title="Sposta giù">
              <span class="icon">⬇️</span>
            </button>
          </div>
        </div>
      </div>
      <div class="session-info">
        <span class="tab-count">${session.tabs.length} ${session.tabs.length === 1 ? 'scheda' : 'schede'}</span>
        <span class="session-date">${formatDate(session.timestamp)}</span>
      </div>
      <div class="session-actions">
        <button class="btn btn-primary restore-btn" data-session-id="${session.id}">
          <span class="icon">🔄</span>
          ${session.isWindow ? 'Ripristina Finestra' : 'Ripristina'}
        </button>
        <button class="btn btn-secondary update-btn" data-session-id="${session.id}" data-session-name="${session.name}" data-is-window="${session.isWindow || false}">
          <span class="icon">🔃</span>
          Aggiorna
        </button>
        <button class="btn btn-danger delete-btn" data-session-id="${session.id}">
          <span class="icon">🗑️</span>
          Elimina
        </button>
      </div>
    </div>
  `).join('');

  // Add event listeners
  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-session-id');
      restoreSession(sessionId);
    });
  });

  document.querySelectorAll('.update-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-session-id');
      const sessionName = e.currentTarget.getAttribute('data-session-name');
      const isWindow = e.currentTarget.getAttribute('data-is-window');
      updateSession(sessionId, sessionName, isWindow);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-session-id');
      if (confirm('Sei sicuro di voler eliminare questa sessione?')) {
        deleteSession(sessionId);
      }
    });
  });

  // Rename button listeners
  document.querySelectorAll('.rename-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-session-id');
      const sessionName = e.currentTarget.getAttribute('data-session-name');
      renameSession(sessionId, sessionName);
    });
  });

  // Move up button listeners
  document.querySelectorAll('.move-up-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-session-id');
      moveSession(sessionId, 'up');
    });
  });

  // Move down button listeners
  document.querySelectorAll('.move-down-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-session-id');
      moveSession(sessionId, 'down');
    });
  });
}

// Open tab selector modal
async function openTabSelector() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const modal = document.getElementById('tabSelectorModal');
  const tabsList = document.getElementById('tabsList');

  // Populate tabs list
  tabsList.innerHTML = tabs.map(tab => `
    <div class="tab-item" data-tab-id="${tab.id}">
      <input type="checkbox" class="tab-checkbox" data-tab-id="${tab.id}" checked>
      <img class="tab-item-favicon" src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2220%22 font-size=%2220%22>📄</text></svg>'}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2220%22 font-size=%2220%22>📄</text></svg>'">
      <div class="tab-item-content">
        <div class="tab-item-title">${tab.title || 'Untitled'}</div>
        <div class="tab-item-url">${tab.url}</div>
      </div>
    </div>
  `).join('');

  // Add click handlers for tab items
  document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        const checkbox = item.querySelector('.tab-checkbox');
        checkbox.checked = !checkbox.checked;
        updateTabItemSelection(item, checkbox.checked);
      } else {
        updateTabItemSelection(item, e.target.checked);
      }
      updateSelectAllCheckbox();
    });
  });

  // Add change handlers for checkboxes
  document.querySelectorAll('.tab-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      updateTabItemSelection(checkbox.closest('.tab-item'), checkbox.checked);
      updateSelectAllCheckbox();
    });
  });

  modal.classList.add('show');
}

// Update tab item visual selection
function updateTabItemSelection(item, selected) {
  if (selected) {
    item.classList.add('selected');
  } else {
    item.classList.remove('selected');
  }
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
  const allCheckboxes = document.querySelectorAll('.tab-checkbox');
  const checkedCheckboxes = document.querySelectorAll('.tab-checkbox:checked');
  const selectAllCheckbox = document.getElementById('selectAllTabs');

  selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length;
  selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
}

// Close modal
function closeTabSelector() {
  const modal = document.getElementById('tabSelectorModal');
  modal.classList.remove('show');
  document.getElementById('modalSessionName').value = '';
}

// Save selected tabs
async function saveSelectedTabs() {
  const sessionName = document.getElementById('modalSessionName').value.trim();
  const selectedCheckboxes = document.querySelectorAll('.tab-checkbox:checked');

  if (selectedCheckboxes.length === 0) {
    showToast('Seleziona almeno una scheda!');
    return;
  }

  const selectedTabIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.tabId));
  const allTabs = await chrome.tabs.query({ currentWindow: true });
  const selectedTabs = allTabs.filter(tab => selectedTabIds.includes(tab.id));

  const session = {
    id: Date.now().toString(),
    name: sessionName || `Schede selezionate - ${new Date().toLocaleString('it-IT')}`,
    timestamp: Date.now(),
    tabs: selectedTabs.map(tab => ({
      url: tab.url,
      title: tab.title,
      pinned: tab.pinned,
      groupId: tab.groupId,
      index: tab.index
    }))
  };

  // Get group information if tabs are grouped
  const groupIds = [...new Set(selectedTabs.map(t => t.groupId).filter(id => id !== -1))];
  if (groupIds.length > 0) {
    session.groups = {};
    for (const groupId of groupIds) {
      try {
        const group = await chrome.tabGroups.get(groupId);
        session.groups[groupId] = {
          title: group.title,
          color: group.color,
          collapsed: group.collapsed
        };
      } catch (e) {
        // Group might not exist anymore
      }
    }
  }

  const saved = await saveSession(session);
  if (!saved) {
    showToast('Salvataggio annullato');
    return;
  }

  await chrome.tabs.remove(selectedTabIds);

  closeTabSelector();
  showToast(`${selectedTabs.length} ${selectedTabs.length === 1 ? 'scheda salvata' : 'schede salvate'} e chiuse!`);
  loadSessions();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSessions();

  document.getElementById('saveCurrentTab').addEventListener('click', saveCurrentTab);
  document.getElementById('saveAllTabs').addEventListener('click', saveAllTabs);
  document.getElementById('saveWindow').addEventListener('click', saveWindow);
  document.getElementById('saveTabGroup').addEventListener('click', saveTabGroup);
  document.getElementById('selectTabs').addEventListener('click', openTabSelector);

  // Modal event listeners
  document.getElementById('closeModal').addEventListener('click', closeTabSelector);
  document.getElementById('cancelSelection').addEventListener('click', closeTabSelector);
  document.getElementById('saveSelectedTabs').addEventListener('click', saveSelectedTabs);

  // Select all checkbox
  document.getElementById('selectAllTabs').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.tab-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked;
      updateTabItemSelection(checkbox.closest('.tab-item'), checkbox.checked);
    });
  });

  // Close modal on background click
  document.getElementById('tabSelectorModal').addEventListener('click', (e) => {
    if (e.target.id === 'tabSelectorModal') {
      closeTabSelector();
    }
  });
});
