import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

export function OptionPickerModal({
  visible,
  title,
  options,
  selectedId,
  onClose,
  onSelect,
}: OptionPickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Закрыть</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
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
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>Нет вариантов для выбора</Text>
            }
          />
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
    paddingBottom: 24,
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
