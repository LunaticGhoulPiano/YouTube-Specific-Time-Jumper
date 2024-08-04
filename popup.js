const numberKeyMap = new Map();

// Initialize event listeners when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const jumpTimeInput = document.getElementById("jumpTime");

    // load video duration and current duration from the active tab
    loadVideoDetails();
    getTrueDuration();

    // add keydown event to the jump time input field
    jumpTimeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") performJump();
        else if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(event.key)) {
            // get numberKeyMap
        }
    });
});

// Load total and current duration from the active tab
function loadVideoDetails() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        // get current youtube webpage
        const activeTab = tabs[0];
        let totalDurationInSec, trueDurationInSec;
        
        // execute script to get total duration
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: getTotalDuration,
        }, (results) => {
            if (results && results[0]) {
                totalDurationInSec = results[0].result.totalDurationInSec;
                const formattedTime = results[0].result.formattedTime;
                document.getElementById("totalDuration").textContent = `Total duration: ${formattedTime}`;
                document.getElementById("jumpTime").placeholder = `Enter time`; // display on input field
                chrome.runtime.sendMessage({action: "totalDuration", duration: formattedTime});
            }
        });

        // execute script to get current video duration (ads or video)
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: getCurrentDuration,
        }, (results) => {
            if (results && results[0]) {
                const currentDuration = results[0].result;
                document.getElementById("currentDuration").textContent = `Current video duration: ${currentDuration}`;
            }
        });

        // execute script to check if the video has ads
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: getTrueDuration,
        }, (results) => {
            if (results && results[0]) {
                trueDurationInSec = results[0].result.trueDuraionInSec;
                const formattedTime = results[0].result.formattedTime;
                document.getElementById("trueDuration").textContent = `True video duration: ${formattedTime}`;
            }
        });

        /*
        // set numberKeyMap
        if (totalDurationInSec == -1 || trueDurationInSec == -1) document.getElementById("adStatus").placeholder = "No video found";
        else {
            let offset = Math.abs(totalDurationInSec - trueDurationInSec);
            
            // judge ad
            if (offset == 0 || offset == 1) {
                document.getElementById("adStatus").placeholder = "Video doesn't have ads";
            }
            else {
                document.getElementById("adStatus").placeholder = "Video has ads";
            }
            
            // set numberKeyMap

        }
        */
        
    });
}

// Get the duration of ads+video in hh:mm:ss format
function getTotalDuration() {
    const video = document.querySelector("video");
    if (video && video.duration) {
        chrome.runtime.sendMessage({action: "preciseTotalDuration", duration: video.duration});

        const totalSeconds = Math.floor(video.duration);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return {
            totalDurationInSec: totalSeconds,
            formattedTime: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}` // hh:mm:ss
        };
    }

    return {
        totalDurationInSec: -1,
        formattedTime: "Unavailable"
    };
}

// Get the current duration displayed on YouTube and format it as hh:mm:ss
function getCurrentDuration() {
    const durationElement = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-time-display.notranslate > span:nth-child(2) > span.ytp-time-duration");
    if (durationElement) {
        let timeParts = durationElement.textContent.split(":").map(Number);
        if (timeParts.length === 2) timeParts.unshift(0); // if the video length is in the format of mm:ss, prepend a 0 for hours
        let formattedTimeParts = timeParts.map(part => part.toString().padStart(2, "0")); // format each part to ensure two digits
        if (Number(formattedTimeParts) == 0) return "Unavailable"; // YouTube page but not video
        return formattedTimeParts.join(":");
    }
    // else main page, shorts ...
    return "Unavailable";
}

// Get the True duration of video
function getTrueDuration() {
    const scriptTag = document.querySelector("#microformat > player-microformat-renderer > script");
    if (scriptTag) {
        // get the JSON data of the true video from the script
        const jsonText = scriptTag.textContent;
        const jsonData = JSON.parse(jsonText);
        const durationText = jsonData.duration; // ISO 8601 (https://stackoverflow.com/questions/19061360/how-to-convert-youtube-api-duration-iso-8601-duration-in-the-format-ptms-to)

        // parse to hh:mm:ss format, precision +-1s due to video.duration in getTotalDuration() has rounding issue
        const regEx = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
        var hours = 0, minutes = 0, seconds = 0, durationInSec = 0;
        if (regEx.test(durationText)) {
            var parts = regEx.exec(durationText);
            if (parts[1]) hours = Number(parts[1]);
            if (parts[2]) minutes = Number(parts[2]);
            if (parts[3]) seconds = Number(parts[3]);

            // summarize seconds
            durationInSec = hours * 3600 + minutes * 60 + seconds;

            // transform to hh:mm:ss format
            hours = (Math.floor(durationInSec / 3600)).toString().padStart(2, "0");
            minutes = (Math.floor((durationInSec % 3600) / 60)).toString().padStart(2, "0");
            seconds = (durationInSec % 60).toString().padStart(2, "0");

            return {
                trueDuraionInSec: durationInSec,
                formattedTime: `${hours}:${minutes}:${seconds}`
            };
        }
        else return {
            trueDuraionInSec: -1,
            formattedTime: "Unavailable"
        };
    }
    else return {
        trueDuraionInSec: -1,
        formattedTime: "Unavailable"
    };
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