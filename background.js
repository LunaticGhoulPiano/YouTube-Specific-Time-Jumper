chrome.runtime.onInstalled.addListener(() => {
    console.log("YouTube Specific Time Jumper installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if  (message.action === "total") console.log(`Total: ${message.total}`);
    if  (message.action === "current") console.log(`Current: ${message.current}`);
    if (message.action === "jumpLog") console.log(`Jump to ${message.parts[0]} hours ${message.parts[1]} minutes ${message.parts[2]} seconds.`);
});

