chrome.runtime.onInstalled.addListener(() => {
    console.log("YouTube Specific Time Jumper installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if  (message.action === "totalDuration") console.log(`Total: ${message.total}`);
    if  (message.action === "currentDuration") console.log(`Current: ${message.current}`);
    if  (message.action === "trueDuration") console.log(`True duration: ${message.duration}`);
    if (message.action === "jumpLog") console.log(`Jump to ${message.parts[0]} hours ${message.parts[1]} minutes ${message.parts[2]} seconds.`);
});

