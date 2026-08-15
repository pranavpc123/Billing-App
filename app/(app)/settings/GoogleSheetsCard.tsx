"use client";

import { useActionState } from "react";
import { updateGoogleSheetsSettings, sendGoogleSheetsTestRow } from "./_actions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function GoogleSheetsCard({
  enabled,
  spreadsheetId,
}: {
  enabled: boolean;
  spreadsheetId: string | null;
}) {
  const [testState, testAction, testPending] = useActionState(
    async () => sendGoogleSheetsTestRow(),
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Sheets Sync</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-navy-400">
          Every invoice and quote can be mirrored to a Google Sheet as a shareable backup — the
          app&apos;s own database stays in charge of billing, login, and reports.
        </p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-navy-300">
          <li>
            Create a Google Cloud service account, enable the Sheets API, and put its email +
            private key in this server&apos;s <code>.env</code> file as{" "}
            <code>GOOGLE_SHEETS_CLIENT_EMAIL</code> / <code>GOOGLE_SHEETS_PRIVATE_KEY</code>.
          </li>
          <li>Share your target Google Sheet with that service account&apos;s email as Editor.</li>
          <li>Paste the Spreadsheet ID below (the long id in the sheet&apos;s URL) and save.</li>
        </ol>

        <form action={updateGoogleSheetsSettings} className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-navy-400">
            <input type="checkbox" name="googleSheetsEnabled" defaultChecked={enabled} />
            Enable sync
          </label>
          <Field label="Spreadsheet ID">
            <Input
              name="googleSheetsSpreadsheetId"
              defaultValue={spreadsheetId ?? ""}
              placeholder="1AbC...xyz"
            />
          </Field>
          <Button type="submit" variant="secondary">
            Save Sheets Settings
          </Button>
        </form>

        <form action={testAction} className="border-t border-navy-100 pt-4">
          <Button type="submit" variant="secondary" disabled={testPending}>
            {testPending ? "Sending…" : "Send Test Row"}
          </Button>
          {testState?.ok && (
            <p className="mt-2 text-sm text-green-700">
              Sent — check the &quot;Test&quot; tab in your sheet.
            </p>
          )}
          {testState?.ok === false && (
            <p className="mt-2 text-sm text-red-700">{testState.error}</p>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
