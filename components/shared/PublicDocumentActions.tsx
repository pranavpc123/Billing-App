"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PublicDocumentActions({
  pdfUrl,
  filename,
  pageUrl,
  label,
}: {
  pdfUrl: string;
  filename: string;
  pageUrl: string;
  label: string;
}) {
  const [note, setNote] = useState<string | null>(null);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setNote("Invoice link copied successfully.");
    } catch {
      setNote("Couldn't copy the link — copy it from the address bar instead.");
    }
    setTimeout(() => setNote(null), 3000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: label, url: pageUrl });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    handleCopyLink();
  }

  return (
    <div className="space-y-2 print:hidden">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <a href={pdfUrl} download={filename}>
          <Button type="button" variant="secondary">
            Download PDF
          </Button>
        </a>
        <Button type="button" variant="secondary" onClick={handleCopyLink}>
          Copy Link
        </Button>
        <Button type="button" variant="secondary" onClick={handleShare}>
          Share
        </Button>
      </div>
      {note && <p className="text-sm text-navy-400">{note}</p>}
    </div>
  );
}
