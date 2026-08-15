import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatMoneyPdf } from "@/lib/money";
import type { QuoteForDisplay } from "@/lib/quote-data";

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
    backgroundColor: "#eceef1",
    color: "#16234a",
  },
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
  totals: { alignSelf: "flex-end", width: 200, marginTop: 10 },
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

export function QuoteDocument({ quote, settings, logoPath }: QuoteForDisplay & { logoPath?: string }) {
  return (
    <Document title={`Quotation ${quote.quoteNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
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
            <Text style={{ fontSize: 13, fontWeight: 700 }}>Quotation {quote.quoteNumber}</Text>
            <Text style={styles.muted}>
              {new Date(quote.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Text>
            <Text style={styles.muted}>Prepared by {quote.staff.name}</Text>
            <Text style={styles.statusBadge}>{quote.status}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.label}>Customer</Text>
            <Text>{quote.customerName}</Text>
            <Text style={styles.muted}>{quote.whatsapp}</Text>
            {quote.contactNumber && <Text style={styles.muted}>{quote.contactNumber}</Text>}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.colItem, styles.label]}>Item</Text>
          <Text style={[styles.colCategory, styles.label]}>Category</Text>
          <Text style={[styles.colQty, styles.label]}>Qty</Text>
          <Text style={[styles.colPrice, styles.label]}>Price</Text>
          <Text style={[styles.colAmount, styles.label]}>Amount</Text>
        </View>
        {quote.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colItem}>{item.nameSnapshot}</Text>
            <Text style={[styles.colCategory, styles.muted]}>{item.categorySnapshot}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatMoneyPdf(item.unitPrice)}</Text>
            <Text style={styles.colAmount}>{formatMoneyPdf(item.lineTotal)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatMoneyPdf(quote.subtotal)}</Text>
          </View>
          {quote.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{formatMoneyPdf(quote.discountAmount)}</Text>
            </View>
          )}
          {quote.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>
                {settings.taxLabel} ({quote.taxRatePercent}%)
              </Text>
              <Text>{formatMoneyPdf(quote.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalFinal}>
            <Text>Quote Total</Text>
            <Text>{formatMoneyPdf(quote.totalAmount)}</Text>
          </View>
        </View>

        {quote.notes && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.muted}>{quote.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          This is an estimate, not a tax invoice. Prices may change if not accepted promptly.
        </Text>
      </Page>
    </Document>
  );
}
