import { useLocalSearchParams } from 'expo-router';
import { AllocationRuleForm } from '@/components/AllocationRuleForm';

export default function EditAllocationRuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AllocationRuleForm mode="edit" ruleId={id} />;
}
