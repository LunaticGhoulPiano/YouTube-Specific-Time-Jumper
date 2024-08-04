chrome.runtime.onInstalled.addListener(() => {
    console.log("YouTube Specific Time Jumper installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if  (message.action === "preciseTotalDuration") console.log(`Precise total duration (ads + video): ${message.duration} seconds`);
    if (message.action === "jumpLog") console.log(`Jump to ${message.parts[0]} hours ${message.parts[1]} minutes ${message.parts[2]} seconds.`);
});

