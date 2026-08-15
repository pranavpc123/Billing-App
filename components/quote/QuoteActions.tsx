"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildWaLink } from "@/lib/whatsapp";

export function QuoteActions({
  quoteId,
  quoteNumber,
  whatsapp,
  whatsappMessage,
  publicUrl,
}: {
  quoteId: string;
  quoteNumber: string;
  whatsapp: string;
  whatsappMessage: string;
  publicUrl: string;
}) {
  const pdfUrl = `/quotes/${quoteId}/pdf`;
  const filename = `${quoteNumber}.pdf`;

  const [manualNumber, setManualNumber] = useState("");
  const [askingForNumber, setAskingForNumber] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function sendTo(number: string) {
    window.open(buildWaLink(number, whatsappMessage), "_blank", "noopener");
  }

  function handleSendWhatsApp() {
    if (whatsapp) {
      sendTo(whatsapp);
      return;
    }
    setAskingForNumber(true);
  }

  function handleManualSend() {
    if (!manualNumber.trim()) return;
    sendTo(manualNumber.trim());
    setAskingForNumber(false);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setNote("Quote link copied successfully.");
    } catch {
      setNote("Couldn't copy the link.");
    }
    setTimeout(() => setNote(null), 3000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Quote ${quoteNumber}`, url: publicUrl });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    handleCopyLink();
  }

  return (
    <div className="space-y-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          Print Quote
        </Button>
        <a href={pdfUrl} download={filename}>
          <Button type="button" variant="secondary">
            Download PDF
          </Button>
        </a>
        <Button type="button" variant="secondary" onClick={handleCopyLink}>
          Copy Quote Link
        </Button>
        <Button type="button" variant="secondary" onClick={handleShare}>
          Share Quote
        </Button>
        <Button type="button" variant="primary" onClick={handleSendWhatsApp}>
          Send Quote on WhatsApp
        </Button>
      </div>

      {askingForNumber && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gold-50 px-3 py-2">
          <span className="text-sm text-navy-500">Enter WhatsApp Number</span>
          <Input
            value={manualNumber}
            onChange={(e) => setManualNumber(e.target.value)}
            placeholder="919876543210"
            inputMode="tel"
            className="w-48 py-1.5"
          />
          <Button type="button" size="sm" onClick={handleManualSend}>
            Send
          </Button>
        </div>
      )}

      {note && <p className="text-sm text-navy-400">{note}</p>}
    </div>
  );
}
