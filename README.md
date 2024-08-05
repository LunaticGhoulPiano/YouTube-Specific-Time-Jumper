# YouTube-Specific-Time-Jumper
Jump to specific time, skip server-inserted ads.
Also this is my first side project, and first time learning front-end developing (hence the code looks ugly).

## Current support functions:
- Jump to specific time of normal youtube video and ended-livestream (also can jump while playing ads, draging the progress bar and hotkey are disabled).
- The extension will be activated when user click the icon.

## Specific Time input form:
- Shouldn't longer than 23:59:59
- Examples:
    - Legal input format examples:
        - Standard format: "hh:mm:ss" (ex. "04:50:23")
        - "30": jump to 00:00:30
        - "6:5": jump to 00:06:05
        - "3:2:1": jump to 03:02:01
    - Illegal input format examples:
        - Characters not ":" and numbers (ex. "0hw8934ybv5o3", "(*&^%%*#&VNKS_+DN:::ODIHG)", etc.)
        - "100"
        - "1:1:1:1"

## AD detection method explanation:
When user click the extension icon, crawl current tab.
If current page is a YouTube normal video or ended livestream, get the duration info of playing video and wait for inputs.

### How to get the "true video" without YouTube Data API when YouTube insert ads with it:
YouTube merged all ads and the true video like above:
$ad_1 + ad_2 + ... + ad_n + trueVideo$
Hence, using ```document.querySelector("video").duration``` will get the duration of:
$TotalDuration = D_{ad_1} + D_{ad_2} + ... + D_{ad_n} + D_{trueVideo}$
(a precise duration in seconds)
We define this duration as _"TotalDuration"_.

But while playing, ```document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-time-display.notranslate > span:nth-child(2) > span.ytp-time-duration")``` display the duration of current play video, whether ad or the true video (dd:hh:mm:ss format, day is available in some special cases); and the duration of true video will display with progress bar. We define this duration as _"CurrentDuration"_.

Next, I found that YouTube set the duration of true video + 1 in ISO 8601 standard, by transforming ```document.querySelector("#microformat > player-microformat-renderer > script")``` to ```jsonData``` format and access ```jsonData.duration```. We define this duration as _"TrueDuration"_.

And I faced the above cases:
- Without ads:
    - Case 1. No ads, true video = https://youtu.be/5VDa5gTXhj8?si=9iyNuQg1YYRAUgdr:
        - _TotalDuration_ = "1461" seconds
        - _CurrentDuration_ = "24:21" (i.e. 1461 seconds)
        - _TrueDuration_ = "PT1462S" (i.e. 1462 seconds)
        
        We first assume that _CurrentDuration_ is obtained by rounding _TotalDuration_ to one decimal place, and _TrueDuration_ is obtained by truncating the decimal part of _TotalDuration_ then + 1.
    - Case 2. No ads, true video = https://www.youtube.com/live/atsFSksE7hs?si=Yve7mQGSPHOYY6iz:
        - _TotalDuration_ = "11903.021" seconds
        - _CurrentDuration_ = "3:18:23" (i.e. 11903 seconds)
        - _TrueDuration_ = "PT11904S" (i.e. 11904 seconds)
        
        Let's maintain the previous assumption.
    - Case 3. No ads, true video = https://youtu.be/pSD91e6gyZI?si=v6HJ0BEfBbMSQJeW: 
        - _TotalDuration_ = "623.501" seconds
        - _CurrentDuration_ = "10:23" (i.e. 623 seconds)
        - _TrueDuration_ = "PT624S" (i.e. 624 seconds)
        
        Findout that rounding _TotalDuration_ to one decimal place isn't equal to _CurrentDuration_, so maybe two decimal places? Also, _TrueDuration_ maintain the previous assumption.
    - Case 4. No ads, true video = https://youtu.be/M9e-_ijbsAg?si=Sy5QPxHXhLrJzc0p:
        - _TotalDuration_ = "483.161" seconds
        - _CurrentDuration_ = "8:03" (i.e. 483 seconds)
        - _TrueDuration_ = "PT484S" (i.e. 484 seconds)
    
    By the above cases, I assert that **without ads, _CurrentDuration_ is obtained by truncating _TotalDuration_, and _TrueDuration_ is obtained by truncating the decimal part of _TotalDuration_ then + 1**.
- With ads:
    - Case 1. 1 ad, true video = https://youtu.be/UKVioegPPds?si=XuEKzqllSOfn41qi:
        - _TotalDuration_ = "221.582" seconds (ad + true video)
        - _CurrentDuration_ while playing ad = "0:15" (i.e. 15 seconds)
        - _CurrentDuration_ while playing true video = "3:26" (i.e. 206 seconds)
        - _TrueDuration_ = "PT207S" (i.e. 207 seconds)
        
        We find that _CurrentDuration of ad_ + _CurrentDuration of true video_ = 206 + 15 = 221 seconds, equals to truncating _TotalDuration_, and _TrueDuration_ is obtained by truncating the decimal part of _TotalDuration_ then + 1.
    - Case 2. 2 ads, true video = https://youtu.be/NmpbK3n8nWo?si=Gaaad7mHzqfLRzn6:
        - _TotalDuration_ = "2255.603" seconds
        - _CurrentDuration_ while playing first ad = "0:32" (i.e. 32 seconds)
        - _CurrentDuration_ while playing second ad = "0:25" (i.e. 25 seconds)
        - _CurrentDuration_ while playing true video = "36:38" (i.e. 2198 seconds)
        - _TrueDuration_ = "PT2199S" (i.e. 2199 seconds)
        
        _CurrentDuration of first ad_ + _CurrentDuration of second ad_ + _CurrentDuration of true video_ = 32 + 25 + 2198 = 2255 seconds, equals to truncating _TotalDuration_, and _TrueDuration_ is obtained by truncating the decimal part of _TotalDuration_ then + 1.
    
    Because I didn't met cases more than 2 ads, hence by the above cases, I assert that **with ads, sum of _CurrentDuration_ equals to truncating _TotalDuration_, and _TrueDuration_ is still obtained by truncating the decimal part of _TotalDuration_ then + 1**.

With these experiments, we can sum up that:
Actual duration of the true video = $TrueDuration - 1$
The begin time of the true video = $Math.floor(TotalDuration) - (TrueDuration - 1)$

By entering the begin time of the true video, user can jump to the begin time of true video.