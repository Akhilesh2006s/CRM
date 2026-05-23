import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { WebButton, DataTable } from '../../ui/WebPrimitives';
import { navigateRoot } from '../../navigation/navigationRef';

export default function ExpenseDetailScreen({ route }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.get(`/expenses/${id}`);
        setExpense(data);
      } catch {
        setExpense(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canResubmit =
    expense?.status === 'Needs Correction' &&
    user?._id &&
    String(expense?.createdBy?._id) === String(user._id);

  const fields: [string, string][] = expense
    ? [
        ['Title', expense.title],
        ['Category', expense.category],
        ['Amount', `₹${expense.amount}`],
        ['Status', expense.status],
        ['Date', expense.date ? new Date(expense.date).toLocaleDateString('en-IN') : '—'],
        ['Remarks', expense.employeeRemarks || '—'],
        ['Manager remarks', expense.managerRemarks || '—'],
        ['Rejection', expense.rejectionReason || '—'],
      ]
    : [];

  return (
    <ScreenShell title="Expense details" loading={loading} subtitle={expense ? undefined : 'Not found'}>
      {!expense && !loading ? (
        <PageSection title="Expense">
          <Text>Expense not found</Text>
        </PageSection>
      ) : (
        <PageSection title="Expense details">
          <DataTable
            columns={['Field', 'Value']}
            rows={fields.map(([k, v]) => [k, v])}
          />
          {canResubmit && (
            <WebButton title="Resubmit expense" onPress={() => navigateRoot('ExpenseResubmit', { id })} />
          )}
        </PageSection>
      )}
    </ScreenShell>
  );
}
