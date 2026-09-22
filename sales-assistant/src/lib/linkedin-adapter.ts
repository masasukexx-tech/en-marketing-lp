"use client";

/**
 * LinkedIn連携アダプターのインターフェース。
 *
 * 重要: このアプリはLinkedIn規約に抵触するブラウザ自動操作・スクレイピング・
 * 自動クリック・自動送信を一切行わない。ログインID/パスワード/Cookie/セッション情報も
 * 取得・保存しない。送信操作は必ず人間がLinkedIn上で確認・実行する。
 *
 * 将来、正式に承認されたLinkedIn APIが利用可能になった場合は、このインターフェースを
 * 実装した別のアダプター（例: OfficialLinkedInApiAdapter）に差し替えることを想定している。
 * ただし承認前提のAPIキー等が必要になるため、現時点ではManualLinkedInAdapterのみを提供する。
 */
export interface LinkedInAdapter {
  /** LinkedInのプロフィールURLを新しいタブで開くだけ。自動操作は行わない。 */
  openProfile(url: string): void;
  /** テキストをクリップボードにコピーするだけ。送信は行わない。 */
  copyToClipboard(text: string): Promise<boolean>;
}

export class ManualLinkedInAdapter implements LinkedInAdapter {
  openProfile(url: string): void {
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async copyToClipboard(text: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        return true;
      } catch {
        return false;
      }
    }
  }
}

export const linkedInAdapter: LinkedInAdapter = new ManualLinkedInAdapter();
