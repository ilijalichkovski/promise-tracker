document.addEventListener('DOMContentLoaded', function() {
    loadPromises();
    
    // Add new promise button
    document.getElementById('save-api-key').addEventListener('click', function() {
        const apiKey = document.getElementById('api-key').value.trim();
        if (apiKey) {
          chrome.storage.local.set({ "openaiApiKey": apiKey }, function() {
            alert("API key saved successfully!");
          });
        }
      });
    
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
        // Process with Claude and save
        saveManualPromise(promiseText, deadline);
        document.getElementById('add-modal').style.display = 'none';
        document.getElementById('promise-text').value = '';
      }
    });
  });
  
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
      processedText: "",  // Will be filled after Claude processing
      createdAt: now.toISOString(),
      deadline: deadline,
      completed: false,
      id: Date.now().toString()
    };
    
    // Process with Claude (placeholder)
    processWithClaude(text).then(result => {
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
  
  // Function to process text with Claude API (placeholder)
  async function processWithClaude(text) {
    // In a real implementation, you would call the Claude API here
    // For now, we'll just return a simplified version
    return `Promise to: ${text.trim()}`;
  }