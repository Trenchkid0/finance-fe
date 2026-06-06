import { useApp } from "@/components/layout/AppLayout";
import { AccountsClient } from "@/components/accounts/AccountsClient";

export default function Accounts() {
  const { accounts } = useApp();

  return <AccountsClient accounts={accounts as any} />;
}
