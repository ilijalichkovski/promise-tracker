document.addEventListener('DOMContentLoaded', function() {
    loadPromises();
    
    // Check if first time use
    chrome.storage.local.get(['firstUse', 'openaiApiKey'], function(data) {
        const settingsSection = document.getElementById('settings-section');
        if (data.firstUse === undefined) {
            // First time use - show settings
            settingsSection.classList.remove('hidden');
            chrome.storage.local.set({ firstUse: false });
        } else {
            // Not first time - hide settings
            settingsSection.classList.add('hidden');
        }
        
        // Still update API key status
        updateApiKeyStatus(data.openaiApiKey);
    });
    
    // Settings button
    document.getElementById('show-settings').addEventListener('click', function() {
        document.getElementById('settings-section').classList.remove('hidden');
    });
    
    // Close settings button
    document.getElementById('close-settings').addEventListener('click', function() {
        document.getElementById('settings-section').classList.add('hidden');
    });
    
    // Refresh button
    document.getElementById('refresh-list').addEventListener('click', function() {
        this.style.transform = 'rotate(360deg)';
        this.style.transition = 'transform 0.5s';
        loadPromises();
        setTimeout(() => {
            this.style.transform = '';
            this.style.transition = '';
        }, 500);
    });
    
    // API key input
    document.getElementById('save-api-key').addEventListener('click', function() {
        const apiKey = document.getElementById('api-key').value.trim();
        if (apiKey) {
            chrome.storage.local.set({ "openaiApiKey": apiKey }, function() {
                alert("API key saved successfully!");
                updateApiKeyStatus(apiKey);
            });
        }
    });
    
    // Show API key form when edit button is clicked
    document.getElementById('edit-api-key').addEventListener('click', function() {
        document.getElementById('api-key-saved').classList.add('hidden');
        document.getElementById('api-key-form').classList.remove('hidden');
    });
    
    // Add new promise button
    document.getElementById('add-promise').addEventListener('click', function() {
        const modal = document.getElementById('add-modal');
        modal.style.display = 'block';
        
        // Set default date to a week from now
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        document.getElementById('deadline').valueAsDate = defaultDate;
    });
    
    // Cancel button in modal
    document.getElementById('cancel-modal').addEventListener('click', function() {
        document.getElementById('add-modal').style.display = 'none';
    });
    
    // Save button in modal
    document.getElementById('save-modal').addEventListener('click', function() {
        const promiseText = document.getElementById('promise-text').value.trim();
        const deadline = document.getElementById('deadline').value;
        
        if (promiseText) {
            saveManualPromise(promiseText, deadline);
            document.getElementById('add-modal').style.display = 'none';
            document.getElementById('promise-text').value = '';
        }
    });
});

// Update API key status in UI
function updateApiKeyStatus(apiKey) {
    const apiKeyForm = document.getElementById('api-key-form');
    const apiKeySaved = document.getElementById('api-key-saved');
    
    if (apiKey) {
        apiKeyForm.classList.add('hidden');
        apiKeySaved.classList.remove('hidden');
    } else {
        apiKeyForm.classList.remove('hidden');
        apiKeySaved.classList.add('hidden');
    }
}

// Load promises from storage
function loadPromises() {
  chrome.storage.local.get("promises", (data) => {
    const promiseList = document.getElementById('promise-list');
    const noPromisesEl = document.getElementById('no-promises');
    
    // Clear current list
    while (promiseList.firstChild && promiseList.firstChild !== noPromisesEl) {
      promiseList.removeChild(promiseList.firstChild);
    }
    
    const promises = data.promises || [];
    
    if (promises.length === 0) {
      noPromisesEl.classList.remove('hidden');
    } else {
      noPromisesEl.classList.add('hidden');
      
      // Sort by deadline, closest first
      promises.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      
      promises.forEach(promise => {
        const promiseItem = document.createElement('div');
        promiseItem.className = 'promise-item';
        promiseItem.dataset.id = promise.id;
        
        // Format dates
        const createdDate = new Date(promise.createdAt);
        const deadlineDate = new Date(promise.deadline);
        const formattedCreated = createdDate.toLocaleDateString();
        const formattedDeadline = deadlineDate.toLocaleDateString();
        
        // Check if past deadline
        const isPastDeadline = new Date() > deadlineDate && !promise.completed;
        
        promiseItem.innerHTML = `
          <div class="promise-text" style="${promise.completed ? 'text-decoration: line-through;' : ''}${isPastDeadline ? 'color: red;' : ''}">
            ${promise.processedText || promise.text}
          </div>
          <div class="promise-meta">
            <span>Created: ${formattedCreated}</span>
            <span style="${isPastDeadline ? 'color: red; font-weight: bold;' : ''}">
              Deadline: ${formattedDeadline}
            </span>
          </div>
          <div class="checkbox-container">
            <input type="checkbox" class="complete-checkbox" ${promise.completed ? 'checked' : ''}>
            <label>Completed</label>
          </div>
          <div class="promise-actions">
            <button class="delete-btn" style="background: none; border: none; color: #666; cursor: pointer;">Delete</button>
          </div>
        `;
        
        promiseList.insertBefore(promiseItem, noPromisesEl);
        
        // Add event listeners for this promise item
        const checkbox = promiseItem.querySelector('.complete-checkbox');
        checkbox.addEventListener('change', function() {
          togglePromiseComplete(promise.id, this.checked);
        });
        
        const deleteBtn = promiseItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
          deletePromise(promise.id);
        });
      });
    }
  });
}

// Toggle promise completion status
function togglePromiseComplete(id, isComplete) {
  chrome.storage.local.get("promises", (data) => {
    const promises = data.promises || [];
    const updatedPromises = promises.map(promise => {
      if (promise.id === id) {
        return { ...promise, completed: isComplete };
      }
      return promise;
    });
    
    chrome.storage.local.set({ promises: updatedPromises }, () => {
      loadPromises();
    });
  });
}

// Delete a promise
function deletePromise(id) {
  chrome.storage.local.get("promises", (data) => {
    const promises = data.promises || [];
    const updatedPromises = promises.filter(promise => promise.id !== id);
    
    chrome.storage.local.set({ promises: updatedPromises }, () => {
      loadPromises();
    });
  });
}

// Save manually added promise
function saveManualPromise(text, deadline) {
  const now = new Date();
  const promise = {
    text: text,
    processedText: "",  // Will be filled after processing
    createdAt: now.toISOString(),
    deadline: deadline,
    completed: false,
    id: Date.now().toString()
  };
  
  // Process with OpenAI
  processWithLLM(text).then(result => {
    promise.processedText = result;
    
    // Save to storage
    chrome.storage.local.get("promises", (data) => {
      const promises = data.promises || [];
      promises.push(promise);
      chrome.storage.local.set({ promises: promises }, () => {
        loadPromises();
      });
    });
  });
}

// Function to process text with OpenAI API
async function processWithLLM(text) {
  try {
    // Get the API key from storage
    const data = await chrome.storage.local.get("openaiApiKey");
    const apiKey = data.openaiApiKey;
    
    if (!apiKey) {
      return "Please set your OpenAI API key in the extension settings";
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Extract the promise from this text and summarize it as a bullet point: "${text}"`
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      return "Error processing promise. Please check your API key.";
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error processing with API:', error);
    return `Promise to: ${text.trim()}`; // Fallback
  }
}