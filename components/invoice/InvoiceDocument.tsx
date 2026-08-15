import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatMoneyPdf } from "@/lib/money";
import type { InvoiceForDisplay } from "@/lib/invoice-data";
import {
  getPaymentStatus,
  getPendingAmount,
  PAYMENT_STATUS_LABEL,
} from "@/lib/payment-status";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#16234a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { flexDirection: "row", gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 8 },
  businessName: { fontSize: 16, fontWeight: 700 },
  muted: { color: "#738199", fontSize: 9 },
  right: { textAlign: "right" },
  statusBadge: {
    marginTop: 4,
    alignSelf: "flex-end",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 8,
    fontWeight: 700,
  },
  statusPaid: { backgroundColor: "#eefaf0", color: "#15803d" },
  statusPartial: { backgroundColor: "#fff4df", color: "#855f1b" },
  statusPending: { backgroundColor: "#fef2f2", color: "#b91c1c" },
  pendingRow: { flexDirection: "row", justifyContent: "space-between", fontWeight: 700, color: "#b91c1c" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  label: { fontSize: 8, color: "#738199", textTransform: "uppercase", marginBottom: 2 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d8df",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eceef1",
    paddingVertical: 4,
  },
  colItem: { width: "36%" },
  colCategory: { width: "22%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  paymentSeal: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#ae812d",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-12deg)",
  },
  paymentSealText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#855f1b",
    textAlign: "center",
    lineHeight: 1.4,
  },
  totals: { width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#d4d8df",
    paddingTop: 4,
    marginTop: 3,
    fontWeight: 700,
    fontSize: 12,
  },
  footer: { marginTop: 28, textAlign: "center", color: "#738199", fontSize: 9 },
});

export function InvoiceDocument({ invoice, settings, logoPath }: InvoiceForDisplay & { logoPath?: string }) {
  const customFields = safeParseJson(invoice.customFields);
  const paymentStatus = getPaymentStatus(invoice.totalAmount, invoice.amountPaid);
  const pendingAmount = getPendingAmount(invoice.totalAmount, invoice.amountPaid);
  const statusStyle =
    paymentStatus === "PAID" ? styles.statusPaid : paymentStatus === "PARTIAL" ? styles.statusPartial : styles.statusPending;

  return (
    <Document title={`Invoice ${invoice.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {/* react-pdf's Image has no alt prop — this isn't a DOM <img> */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logoPath && <Image src={logoPath} style={styles.logo} />}
            <View>
              <Text style={styles.businessName}>{settings.businessName}</Text>
              {settings.tagline && <Text style={styles.muted}>{settings.tagline}</Text>}
              {settings.address && <Text style={styles.muted}>{settings.address}</Text>}
              {settings.phoneNumber && <Text style={styles.muted}>{settings.phoneNumber}</Text>}
            </View>
          </View>
          <View style={styles.right}>
            <Text style={{ fontSize: 13, fontWeight: 700 }}>Invoice {invoice.invoiceNumber}</Text>
            <Text style={styles.muted}>
              {new Date(invoice.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Text>
            <Text style={styles.muted}>Billed by {invoice.staff.name}</Text>
            <Text style={[styles.statusBadge, statusStyle]}>{PAYMENT_STATUS_LABEL[paymentStatus]}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.label}>Customer</Text>
            <Text>{invoice.customer.name}</Text>
            <Text style={styles.muted}>{invoice.customer.whatsapp}</Text>
            {invoice.contactNumber && <Text style={styles.muted}>{invoice.contactNumber}</Text>}
          </View>
          <View style={styles.right}>
            <Text style={styles.label}>Details</Text>
            <Text style={styles.muted}>Payment: {invoice.paymentMethod.name}</Text>
            <Text style={styles.muted}>Mode: {invoice.visitMode.name}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.colItem, styles.label]}>Item</Text>
          <Text style={[styles.colCategory, styles.label]}>Category</Text>
          <Text style={[styles.colQty, styles.label]}>Qty</Text>
          <Text style={[styles.colPrice, styles.label]}>Price</Text>
          <Text style={[styles.colAmount, styles.label]}>Amount</Text>
        </View>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colItem}>{item.nameSnapshot}</Text>
            <Text style={[styles.colCategory, styles.muted]}>{item.categorySnapshot}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatMoneyPdf(item.unitPrice)}</Text>
            <Text style={styles.colAmount}>{formatMoneyPdf(item.lineTotal)}</Text>
          </View>
        ))}

        <View style={styles.totalsRow}>
          {settings.showPaymentSeal && paymentStatus === "PAID" ? (
            <View style={styles.paymentSeal}>
              <Text style={styles.paymentSealText}>PAYMENT{"\n"}RECEIVED</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{formatMoneyPdf(invoice.subtotal)}</Text>
            </View>
            {invoice.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text>Discount</Text>
                <Text>-{formatMoneyPdf(invoice.discountAmount)}</Text>
              </View>
            )}
            {invoice.taxAmount > 0 && (
              <View style={styles.totalRow}>
                <Text>
                  {settings.taxLabel} ({invoice.taxRatePercent}%)
                </Text>
                <Text>{formatMoneyPdf(invoice.taxAmount)}</Text>
              </View>
            )}
            <View style={styles.totalFinal}>
              <Text>Total</Text>
              <Text>{formatMoneyPdf(invoice.totalAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Amount Paid</Text>
              <Text>{formatMoneyPdf(invoice.amountPaid)}</Text>
            </View>
            {pendingAmount > 0 && (
              <View style={styles.pendingRow}>
                <Text>Pending Balance</Text>
                <Text>{formatMoneyPdf(pendingAmount)}</Text>
              </View>
            )}
          </View>
        </View>

        {(invoice.notes || Object.keys(customFields).length > 0) && (
          <View style={{ marginTop: 16 }}>
            {Object.entries(customFields).map(([key, value]) =>
              value ? (
                <Text key={key} style={styles.muted}>
                  {key}: {String(value)}
                </Text>
              ) : null
            )}
            {invoice.notes && <Text style={styles.muted}>{invoice.notes}</Text>}
          </View>
        )}

        {settings.invoiceFooterText && (
          <Text style={styles.footer}>{settings.invoiceFooterText}</Text>
        )}
      </Page>
    </Document>
  );
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
