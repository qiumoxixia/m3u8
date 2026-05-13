/*
#!name = MissAV m3u8 跳转播放器
#!desc = 仅用于 MissAV 捕获 m3u8，并通过 BoxJs 选择播放器
#!author = modified for Quantumult X + BoxJs
#!icon = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Video.png

[MitM]
hostname = missav.*, *.missav.*, *.cloudfront.net, *.cdn2020.com, *.hdcdn.online, *.pear2.cc

[Script]
http-request \.m3u8 script-path=script-path=https://raw.githubusercontent.com/qiumoxixia/m3u8/refs/heads/main/missav-m3u8.js, requires-body=false, timeout=10, tag=MissAV跳转播放器

*/

const url = $request?.url || "";
const headers = $request?.headers || {};

// ===============================
// 只允许 MissAV 相关请求触发
// ===============================

const host = getHost(url);
const referer = headers["Referer"] || headers["referer"] || "";
const origin = headers["Origin"] || headers["origin"] || "";

const isM3U8 = /\.m3u8(\?|$)/i.test(url);

const isMissAV =
  /(^|\.)missav\./i.test(host) ||
  /missav\./i.test(referer) ||
  /missav\./i.test(origin);

if (!isM3U8) {
  $done({});
}

if (!isMissAV) {
  console.log("非 MissAV 相关 m3u8，请求已跳过：");
  console.log(url);
  $done({});
}

// ===============================
// 读取 BoxJs 配置
// ===============================

const boxPlayer = $persistentStore.read("missav_m3u8_player") || "VLC";
const boxEncode = $persistentStore.read("missav_m3u8_encode") || "no";
const boxCustomScheme = $persistentStore.read("missav_m3u8_custom_scheme") || "";

// ===============================
// 播放器 Scheme
// ===============================

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

let playerName = boxPlayer.trim();
let scheme = "";

if (boxCustomScheme.trim()) {
  playerName = "自定义播放器";
  scheme = boxCustomScheme.trim();
} else {
  const key = Object.keys(players).find(
    item => item.toLowerCase() === playerName.toLowerCase()
  );

  if (!key) {
    $notification.post(
      "MissAV m3u8 捕获失败",
      "播放器设置错误",
      `BoxJs 中的播放器不存在：${playerName}`
    );
    $done({});
  }

  playerName = key;
  scheme = players[key];
}

// ===============================
// 生成跳转地址
// ===============================

let finalUrl = url;

if (boxEncode.toLowerCase() === "yes") {
  finalUrl = encodeURIComponent(url);
}

let openUrl = "";

if (playerName === "Safari") {
  openUrl = url;
} else {
  openUrl = scheme + finalUrl;
}

// ===============================
// 防止同一个 m3u8 重复弹通知
// ===============================

const cacheKey = "MISSAV_LAST_M3U8_URL";
const lastUrl = $persistentStore.read(cacheKey);

if (lastUrl === url) {
  console.log("重复 MissAV m3u8，已跳过通知。");
  $done({});
}

$persistentStore.write(url, cacheKey);

// ===============================
// 通知
// ===============================

console.log("捕获到 MissAV m3u8：");
console.log(url);
console.log("播放器：");
console.log(playerName);
console.log("跳转地址：");
console.log(openUrl);

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

function getHost(input) {
  try {
    return input.match(/^https?:\/\/([^\/]+)/i)?.[1] || "";
  } catch (e) {
    return "";
  }
}