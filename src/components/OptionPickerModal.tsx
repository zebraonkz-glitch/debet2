import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';

export type SelectOption = {
  id: string;
  label: string;
  subtitle?: string;
};

type OptionPickerModalProps = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedId?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
};

const SHEET_MAX_RATIO = 0.7;
const HEADER_HEIGHT = 53;

export function OptionPickerModal({
  visible,
  title,
  options,
  selectedId,
  onClose,
  onSelect,
}: OptionPickerModalProps) {
  const insets = useSafeAreaInsets();
  const listMaxHeight =
    Dimensions.get('window').height * SHEET_MAX_RATIO - HEADER_HEIGHT - Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Закрыть</Text>
            </Pressable>
          </View>
          <ScrollView
            style={{ maxHeight: listMaxHeight }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {options.length === 0 ? (
              <Text style={styles.empty}>Нет вариантов для выбора</Text>
            ) : (
              options.map((item) => {
                const selected = item.id === selectedId;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.option, selected ? styles.optionSelected : null]}
                    onPress={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  >
                    <Text style={styles.optionLabel}>{item.label}</Text>
                    {item.subtitle ? (
                      <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  close: {
    fontSize: 16,
    color: Colors.primary,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: '#e8effd',
  },
  optionLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: Colors.textMuted,
  },
});
