export interface FcpxmlClip {
  sourceStart: number;
  sourceEnd: number;
  timelineStart: number;
  timelineEnd: number;
}

export interface FcpxmlCaption {
  timelineStart: number;
  timelineEnd: number;
  text: string;
}

export interface FcpxmlVideoInfo {
  filename: string;
  /** ローカルの絶対パス。file:// URL に変換して media-rep の src に使う */
  absolutePath: string;
  durationSec: number;
  width: number;
  height: number;
  fps: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toFileUrl(absolutePath: string): string {
  return absolutePath.startsWith("file://") ? absolutePath : `file://${absolutePath}`;
}

/** 秒数を FCPXML の有理数タイムコード形式 (frames/fps s) へ変換する */
function toRationalTime(sec: number, fps: number): string {
  const frames = Math.max(0, Math.round(sec * fps));
  return `${frames}/${fps}s`;
}

/**
 * カット後タイムラインを Final Cut Pro XML (FCPXML 1.10) として書き出す。
 * Premiere Pro は FCPXML の公式importに対応している（design doc §4）。
 * 映像/音声はカット済み区間ごとの asset-clip として出力する。
 *
 * キャプションは意図的にFCPXMLへ埋め込まない: FCPXMLの<title>はFinal Cut Pro/Motion付属の
 * テンプレート(.moti)への有効な参照(uid)が無いと「サポートされていないファイル形式」として
 * インポート全体が拒否される。Premiereでは持っていない/解決できないテンプレートのため、
 * 代わりに generateSrt() の出力を単独でインポートしてもらう（Premiereのネイティブ字幕トラックとして
 * 認識される、より確実な方法）。
 */
export function generateFcpxml(video: FcpxmlVideoInfo, clips: FcpxmlClip[]): string {
  const fps = Math.max(1, Math.round(video.fps));
  const t = (sec: number) => toRationalTime(sec, fps);
  const fileUrl = toFileUrl(video.absolutePath);

  const assetClipsXml = clips
    .map((clip, i) => {
      const clipDuration = t(clip.sourceEnd - clip.sourceStart);
      const clipStart = t(clip.sourceStart);
      const clipOffset = t(clip.timelineStart);

      return `        <asset-clip name="${escapeXml(video.filename)}-${i + 1}" ref="r2" offset="${clipOffset}" duration="${clipDuration}" start="${clipStart}" format="r1" tcFormat="NDF"/>`;
    })
    .join("\n");

  const totalDuration = clips.length ? t(clips[clips.length - 1]!.timelineEnd) : "0s";
  const assetDuration = t(video.durationSec);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="FFVideoFormat${video.width}x${video.height}p${fps}" frameDuration="1/${fps}s" width="${video.width}" height="${video.height}"/>
    <asset id="r2" name="${escapeXml(video.filename)}" start="0s" duration="${assetDuration}" hasVideo="1" hasAudio="1" format="r1">
      <media-rep kind="original-media" src="${escapeXml(fileUrl)}"/>
    </asset>
  </resources>
  <library>
    <event name="AI Auto Edit">
      <project name="${escapeXml(video.filename)}">
        <sequence format="r1" duration="${totalDuration}" tcStart="0s" tcFormat="NDF">
          <spine>
${assetClipsXml}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

function srtTimestamp(sec: number): string {
  const clamped = Math.max(0, sec);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

/** タイムライン上のキャプション（表示用タイムコード済み）から SRT 文字列を生成する */
export function generateSrt(captions: FcpxmlCaption[]): string {
  return captions
    .map((c, i) => {
      const index = i + 1;
      return `${index}\n${srtTimestamp(c.timelineStart)} --> ${srtTimestamp(c.timelineEnd)}\n${c.text}\n`;
    })
    .join("\n");
}
