import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { isMoneyColumn, type ReportColumn, type ReportRow } from "@/lib/reports/registry";
import { formatMoneyPdf } from "@/lib/money";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#16234a" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#738199", fontSize: 9, marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d8df",
    paddingBottom: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eceef1",
    paddingVertical: 3,
  },
  cell: { flex: 1 },
  cellRight: { flex: 1, textAlign: "right" },
  label: { fontSize: 8, color: "#738199", textTransform: "uppercase" },
});

export function ReportDocument({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}) {
  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.muted}>{subtitle}</Text>

        <View style={styles.headerRow}>
          {columns.map((c) => (
            <Text key={c.key} style={[c.align === "right" ? styles.cellRight : styles.cell, styles.label]}>
              {c.label}
            </Text>
          ))}
        </View>
        {rows.map((row, i) => (
          <View key={i} style={styles.row}>
            {columns.map((c) => (
              <Text key={c.key} style={c.align === "right" ? styles.cellRight : styles.cell}>
                {isMoneyColumn(c.key)
                  ? formatMoneyPdf(Number(row[c.key] ?? 0))
                  : String(row[c.key] ?? "")}
              </Text>
            ))}
          </View>
        ))}
        {rows.length === 0 && <Text style={styles.muted}>No data for this period.</Text>}
      </Page>
    </Document>
  );
}
