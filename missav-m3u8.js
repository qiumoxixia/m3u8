/*
#!name = MissAV m3u8 跳转播放器
#!desc = 仅用于 MissAV 捕获 m3u8，并通过 BoxJs 选择播放器
#!author = modified for Quantumult X + BoxJs

[MitM]
hostname = missav.*, *.missav.*, *.cloudfront.net, *.cdn2020.com, *.hdcdn.online, *.pear2.cc

[Script]
http-request \.m3u8 script-path=https://raw.githubusercontent.com/qiumoxixia/m3u8/refs/heads/main/missav-m3u8.js, requires-body=false, timeout=10, tag=MissAV跳转播放器

*/

const url = $request.url;
const headers = $request.headers || {};

const referer = headers["Referer"] || headers["referer"] || "";
const origin = headers["Origin"] || headers["origin"] || "";

const isMissAV = /missav/i.test(url) || /missav/i.test(referer) || /missav/i.test(origin);

if (!isMissAV) {
  console.log("不是 MissAV 相关 m3u8，跳过：");
  console.log(url);
  $done({});
}

const player = $persistentStore.read("missav_m3u8_player") || "VLC";
const encode = $persistentStore.read("missav_m3u8_encode") || "no";
const customScheme = $persistentStore.read("missav_m3u8_custom_scheme") || "";

const players = {
  "VLC": "vlc://",
  "Alook": "Alook://",
  "Infuse": "infuse://x-callback-url/play?url=",
  "NPlayer": "nplayer-http://",
  "SenPlayer": "SenPlayer://x-callback-url/play?url=",
  "VidHub": "vidhub://x-callback-url/play?url=",
  "Fileball": "filebox://play?url=",
  "KMPlayer": "kmplayer://",
  "IINA": "iina://weblink?url=",
  "Safari": ""
};

let playerName = player;
let scheme = customScheme || players[playerName] || "vlc://";

let openUrl = "";

if (playerName === "Safari") {
  openUrl = url;
} else {
  openUrl = scheme + (encode === "yes" ? encodeURIComponent(url) : url);
}

$notification.post(
  "MissAV m3u8 已捕获",
  `播放器：${playerName}`,
  "点击通知打开，m3u8 地址已复制",
  {
    openUrl: openUrl,
    clipboard: url
  }
);

$done({});
