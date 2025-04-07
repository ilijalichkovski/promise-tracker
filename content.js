// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showDeadlineDialog") {
      // Prevent multiple dialogs
      if (document.getElementById('promise-dialog')) {
        sendResponse({status: "Dialog already exists"});
        return true;
      }

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'promise-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
      overlay.style.zIndex = '9998';
      
      // Create dialog
      const dialog = document.createElement('div');
      dialog.id = 'promise-dialog';
      dialog.style.position = 'fixed';
      dialog.style.top = '20%';
      dialog.style.left = '50%';
      dialog.style.transform = 'translateX(-50%) translateY(-20px)';
      dialog.style.opacity = '0';
      dialog.style.transition = 'all 0.3s ease-out';
      dialog.style.zIndex = '9999';
      dialog.style.backgroundColor = 'white';
      dialog.style.padding = '20px';
      dialog.style.borderRadius = '5px';
      dialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      dialog.style.width = '300px';
      
      dialog.innerHTML = `
        <h3 style="margin-top: 0; color: #333;">Save Promise</h3>
        <p style="margin-bottom: 15px; color: #666; font-size: 14px;">${message.text}</p>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333;">Set Deadline:</label>
          <input type="date" id="deadline-date" style="width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button id="cancel-btn" style="padding: 8px 12px; margin-right: 10px; border: none; background: #ddd; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button id="save-btn" style="padding: 8px 12px; border: none; background: #4285f4; color: white; border-radius: 4px; cursor: pointer;">Save Promise</button>
        </div>
      `;
      
      document.body.appendChild(overlay);
      document.body.appendChild(dialog);

      // Animate in
      requestAnimationFrame(() => {
        dialog.style.transform = 'translateX(-50%) translateY(0)';
        dialog.style.opacity = '1';
      });
      
      // Set default date to a week from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      document.getElementById('deadline-date').valueAsDate = defaultDate;
      
      const closeDialog = () => {
        dialog.style.transform = 'translateX(-50%) translateY(-20px)';
        dialog.style.opacity = '0';
        overlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(dialog);
          document.body.removeChild(overlay);
        }, 300);
      };

      // Add event listeners
      overlay.addEventListener('click', closeDialog);
      document.getElementById('cancel-btn').addEventListener('click', closeDialog);
      
      document.getElementById('save-btn').addEventListener('click', () => {
        const deadlineDate = document.getElementById('deadline-date').value;
        if (!deadlineDate) {
          alert('Please select a deadline date');
          return;
        }

        chrome.runtime.sendMessage({
          action: "savePromise",
          text: message.text,
          deadline: deadlineDate
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error saving promise:', chrome.runtime.lastError);
            alert('Failed to save promise. Please try again.');
          } else {
            console.log('Promise saved successfully:', response);
            closeDialog();
          }
        });
      });

      // Send response to indicate dialog was created
      sendResponse({status: "Dialog created"});
    }
    return true;
  });