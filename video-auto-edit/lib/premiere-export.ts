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
  /** ローカルの絶対パス。file:// URL に変換して pathurl に使う */
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
  const encodedPath = absolutePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `file://localhost${encodedPath}`;
}

function toFrames(sec: number, fps: number): number {
  return Math.max(0, Math.round(sec * fps));
}

/**
 * カット後タイムラインを Final Cut Pro 7 形式のXML（通称XMEML、拡張子 .xml）として書き出す。
 *
 * 当初はモダンなFCPXML(拡張子 .fcpxml)を生成していたが、実機のPremiere Pro (26.0.1) で検証した結果、
 * Premiere Proは「ファイル > 読み込み」のFCPXML importに対応しておらず、最新のFCPXMLでは
 * ファイル選択自体ができない（サポート対象外の拡張子として扱われる）ことが判明した。
 * Adobe公式ヘルプでも、PremiereがネイティブでimportできるのはFinal Cut Pro 7形式のXML
 * (このXMEML)のみで、Final Cut Pro X以降のFCPXMLを直接読み込むには別途変換ツールが必要、
 * と案内されている。無料構成のまま完結させるため、最初からこのXMEML形式で書き出す。
 *
 * キャプションはこのXMLへ埋め込まない。字幕は generateSrt() の出力を単独でPremiereに
 * インポートすることで、ネイティブの字幕トラックとして追加できる。
 */
export function generateFcpxml(video: FcpxmlVideoInfo, clips: FcpxmlClip[]): string {
  const fps = Math.max(1, Math.round(video.fps));
  const isNtsc = Math.abs(video.fps - fps) > 0.001;
  const ntscFlag = isNtsc ? "TRUE" : "FALSE";
  const rateXml = `<rate><timebase>${fps}</timebase><ntsc>${ntscFlag}</ntsc></rate>`;

  const fileUrl = toFileUrl(video.absolutePath);
  const totalSourceFrames = toFrames(video.durationSec, fps);
  const totalTimelineFrames = clips.length ? toFrames(clips[clips.length - 1]!.timelineEnd, fps) : 0;

  function fileRefXml(isFirst: boolean): string {
    if (!isFirst) return `<file id="file-1"/>`;
    return `<file id="file-1">
              <name>${escapeXml(video.filename)}</name>
              <pathurl>${escapeXml(fileUrl)}</pathurl>
              ${rateXml}
              <duration>${totalSourceFrames}</duration>
              <media>
                <video>
                  <samplecharacteristics>
                    <width>${video.width}</width>
                    <height>${video.height}</height>
                  </samplecharacteristics>
                </video>
                <audio>
                  <channelcount>2</channelcount>
                </audio>
              </media>
            </file>`;
  }

  function clipItemXml(clip: FcpxmlClip, id: string, isFirstFileRef: boolean): string {
    const inFrame = toFrames(clip.sourceStart, fps);
    const outFrame = toFrames(clip.sourceEnd, fps);
    const startFrame = toFrames(clip.timelineStart, fps);
    const endFrame = toFrames(clip.timelineEnd, fps);
    return `          <clipitem id="${id}">
            <name>${escapeXml(video.filename)}</name>
            <duration>${totalSourceFrames}</duration>
            ${rateXml}
            <start>${startFrame}</start>
            <end>${endFrame}</end>
            <in>${inFrame}</in>
            <out>${outFrame}</out>
            ${fileRefXml(isFirstFileRef)}
          </clipitem>`;
  }

  const videoClipItems = clips.map((clip, i) => clipItemXml(clip, `clipitem-v${i + 1}`, i === 0)).join("\n");
  const audioClipItems = clips.map((clip, i) => clipItemXml(clip, `clipitem-a${i + 1}`, false)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>${escapeXml(video.filename)}</name>
    <duration>${totalTimelineFrames}</duration>
    ${rateXml}
    <media>
      <video>
        <track>
${videoClipItems}
        </track>
      </video>
      <audio>
        <track>
${audioClipItems}
        </track>
      </audio>
    </media>
  </sequence>
</xmeml>`;
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
