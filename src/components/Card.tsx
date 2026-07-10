import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Theme } from '@/utils/theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable style={[styles.card, style]} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

type SummaryRowProps = {
  label: string;
  value: string;
  valueTone?: 'default' | 'income' | 'expense';
  highlight?: boolean;
};

export function SummaryRow({
  label,
  value,
  valueTone = 'default',
  highlight,
}: SummaryRowProps) {
  return (
    <View style={[styles.summaryRow, highlight ? styles.summaryRowHighlight : null]}>
      <Text style={[styles.summaryLabel, highlight ? styles.summaryLabelHighlight : null]}>
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          valueTone === 'income' ? styles.income : null,
          valueTone === 'expense' ? styles.expense : null,
          highlight ? styles.summaryValueHighlight : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Theme.card,
    marginBottom: Theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  summaryRowHighlight: {
    marginTop: Theme.spacing.xs,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.card.borderColor,
  },
  summaryLabel: Theme.typography.body,
  summaryLabelHighlight: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.typography.body.color,
  },
  summaryValueHighlight: {
    fontSize: 17,
    fontWeight: '700',
  },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
});
