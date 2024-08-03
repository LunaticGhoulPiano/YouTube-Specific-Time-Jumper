// Initialize event listeners when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const jumpTimeInput = document.getElementById("jumpTime");

    // load video duration and current duration from the active tab
    loadVideoDetails();

    // add keydown event to the jump time input field
    jumpTimeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") performJump();
    });
});

// Load total and current duration from the active tab
function loadVideoDetails() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        // get current youtube webpage
        const activeTab = tabs[0];
        
        // execute script to get total duration
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: getTotalDuration,
        }, (results) => {
            if (results && results[0]) {
                const totalDuration = results[0].result;
                document.getElementById("jumpTime").placeholder = `Enter time (total duration: ${totalDuration})`; // display on input field
            }
        });

        // execute script to get current video duration (ads or video)
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: getCurrentDuration,
        }, (results) => {
            if (results && results[0]) {
                const currentDuration = results[0].result;
                document.getElementById("currentDuration").textContent = "Current playing video duration: " + currentDuration;
            }
        });
    });
}

// Get the duration of ads+video in hh:mm:ss format
function getTotalDuration() {
    const video = document.querySelector("video");
    if (video) {
        const totalSeconds = Math.floor(video.duration);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // format hours, minutes, and seconds as hh:mm:ss
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return "Unavailable";
}

// Get the current duration displayed on YouTube and format it as hh:mm:ss
function getCurrentDuration() {
    const durationElement = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-time-display.notranslate > span:nth-child(2) > span.ytp-time-duration");
    if (durationElement) {
        let timeParts = durationElement.textContent.split(":").map(Number); // disassemble
        if (timeParts.length === 2) timeParts.unshift(0); // if the video length is in the format of mm:ss, prepend a 0 for hours
        let formattedTimeParts = timeParts.map(part => part.toString().padStart(2, "0")); // format each part to ensure two digits
        return formattedTimeParts.join(":");
    }
    return "Unavailable";
}

// Perform the jump action to the specified time
function performJump() {
    const jumpTime = document.getElementById("jumpTime").value;
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const activeTab = tabs[0];
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: jumpToTime,
            args: [jumpTime]
        });
    });
}

// Jump to the specified time
function jumpToTime(time) {
    let video = document.querySelector("video");
    if (video) {
        if (!/^[\d:]+$/.test(time)) return; // ensure only "+" and numbers
        let parts = time.split(":").map(Number);
        if (1 <= parts.length && parts.length <= 3) { // ensure between 00:00:00 and 23:59:59
            if (parts.length === 1 && parts[0] <= 59) parts = [0, 0, parts[0]]; // [0, 0, sec]
            else if (parts.length === 2 && parts[0] <= 59 && parts[1] <= 59) parts = [0, parts[0], parts[1]]; // [0, minutes, seconds]
            else if (parts.length === 3 && parts[0] <= 23 && parts[1] <= 59 && parts[2] <= 59) parts = [parts[0], parts[1], parts[2]]; // [hours, minutes, seconds] // do nothing, just check if hour's format is correct
            else return;

            chrome.runtime.sendMessage({action: "jumpLog", parts: parts}); // log
            video.currentTime = parts[0] * 3600 + parts[1] * 60 + parts[2]; // jump to [hours, minutes, seconds]
        }   
    }
}

// Ads need parts-----------------------------

// get current playing time
function getCurrentTime() {
    const timeElement = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-time-display.notranslate > span:nth-child(2) > span.ytp-time-current");
    if (timeElement) {
        return timeElement.textContent.trim();
    }
    return "Unavailable";
}