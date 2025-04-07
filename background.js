chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "savePromise",
      title: "Save as Promise",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "savePromise") {
      const selectedText = info.selectionText;
      
      // Send message to content script to show deadline input dialog
      chrome.tabs.sendMessage(tab.id, {
        action: "showDeadlineDialog",
        text: selectedText
      });
    }
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "savePromise") {
      const now = new Date();
      const promise = {
        text: message.text,
        processedText: "",  // This will be filled after Claude processing
        createdAt: now.toISOString(),
        deadline: message.deadline,
        completed: false,
        id: Date.now().toString()
      };
      
      // Process with Claude (placeholder for actual API integration)
      processWithLLM(promise.text).then(result => {
        promise.processedText = result;
        
        // Save to storage
        chrome.storage.local.get("promises", (data) => {
          const promises = data.promises || [];
          promises.push(promise);
          chrome.storage.local.set({ promises: promises }, () => {
            console.log("Promise saved");
          });
        });
      });
      
      sendResponse({status: "Processing promise"});
    }
    return true;
  });
  
  async function processWithLLM(text) {
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
  }