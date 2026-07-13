import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  History,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import { walletApi, AuditLog } from "@/api/walletApi";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/store/authStore";
import {
  WalletResponse,
  WithdrawalResponse,
  WithdrawalStatus,
  WalletTransactionResponse,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

type ActiveTab = "overview" | "withdrawals" | "reconciliation" | "audit";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const labelClass =
  "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export default function AdminWalletPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [page, setPage] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletTransactionResponse | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalResponse | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmingApprovalId, setConfirmingApprovalId] = useState<
    string | null
  >(null);
  const [payoutReference, setPayoutReference] = useState("");

  const summaryQuery = useQuery(
    ["admin-financial-summary"],
    walletApi.getFinancialSummary,
    {
      refetchInterval: 30_000,
    },
  );
  const transactionsQuery = useQuery(
    ["admin-wallet-transactions", page],
    () => walletApi.getAdminTransactions(page, 15),
    { enabled: activeTab === "overview", keepPreviousData: true },
  );
  const withdrawalsQuery = useQuery(
    ["admin-withdrawals"],
    walletApi.getAllWithdrawals,
    {
      enabled: activeTab === "withdrawals",
    },
  );
  const auditQuery = useQuery(
    ["admin-audit-logs", auditPage],
    () => walletApi.getAuditLogs(auditPage, 15),
    { enabled: activeTab === "audit", keepPreviousData: true },
  );
  const reconciliationQuery = useQuery(
    ["admin-wallet-reconciliation-required"],
    walletApi.getWalletsRequiringReconciliation,
    { enabled: activeTab === "reconciliation" },
  );

  const approveMutation = useMutation(
    (requestId: string) => walletApi.approveWithdrawal(requestId),
    {
      onSuccess: () => {
        toast.success(t("admin.wallet.approveSuccess"));
        setConfirmingApprovalId(null);
        setSelectedWithdrawal(null);
        void queryClient.invalidateQueries("admin-withdrawals");
        void queryClient.invalidateQueries("admin-financial-summary");
        void queryClient.invalidateQueries("admin-wallet-transactions");
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || t("admin.wallet.actionFailed"),
        );
      },
    },
  );

  const rejectMutation = useMutation(
    ({ requestId, reason }: { requestId: string; reason: string }) =>
      walletApi.rejectWithdrawal(requestId, reason),
    {
      onSuccess: () => {
        toast.success(t("admin.wallet.rejectSuccess"));
        setRejectingId(null);
        setRejectionReason("");
        setSelectedWithdrawal(null);
        void queryClient.invalidateQueries("admin-withdrawals");
        void queryClient.invalidateQueries("admin-financial-summary");
        void queryClient.invalidateQueries("admin-wallet-transactions");
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || t("admin.wallet.actionFailed"),
        );
      },
    },
  );

  const completeMutation = useMutation(
    ({
      requestId,
      gatewayTxnId,
    }: {
      requestId: string;
      gatewayTxnId: string;
    }) => walletApi.completeWithdrawal(requestId, gatewayTxnId),
    {
      onSuccess: () => {
        toast.success(t("admin.wallet.completeSuccess"));
        setPayoutReference("");
        setSelectedWithdrawal(null);
        void queryClient.invalidateQueries("admin-withdrawals");
        void queryClient.invalidateQueries("admin-financial-summary");
        void queryClient.invalidateQueries("admin-wallet-transactions");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || t("admin.wallet.actionFailed"));
      },
    },
  );

  const reconcileMutation = useMutation(walletApi.reconcileWallet, {
    onSuccess: () => {
      toast.success(t("admin.wallet.reconcileSuccess"));
      void queryClient.invalidateQueries(
        "admin-wallet-reconciliation-required",
      );
      void queryClient.invalidateQueries("admin-financial-summary");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t("admin.wallet.actionFailed"));
    },
  });

  const freezeMutation = useMutation(
    ({ walletId, active }: { walletId: string; active: boolean }) =>
      active
        ? walletApi.freezeWallet(walletId, "Manual administrative review")
        : walletApi.unfreezeWallet(walletId),
    {
      onSuccess: () => {
        toast.success(t("admin.wallet.walletStatusUpdated"));
        void queryClient.invalidateQueries(
          "admin-wallet-reconciliation-required",
        );
        void queryClient.invalidateQueries("admin-financial-summary");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || t("admin.wallet.actionFailed"));
      },
    },
  );

  const visibleWithdrawals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return withdrawalsQuery.data ?? [];
    return (withdrawalsQuery.data ?? []).filter((item) =>
      [
        item.id,
        item.userFullName,
        item.bankName,
        item.bankAccountName,
        item.bankAccountNo,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, withdrawalsQuery.data]);

  const refresh = () => {
    void queryClient.invalidateQueries("admin-financial-summary");
    void queryClient.invalidateQueries("admin-wallet-transactions");
    void queryClient.invalidateQueries("admin-withdrawals");
    void queryClient.invalidateQueries("admin-audit-logs");
    void queryClient.invalidateQueries("admin-wallet-reconciliation-required");
  };

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t("admin.wallet.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t("admin.wallet.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw
            className={`h-4 w-4 ${summaryQuery.isFetching ? "animate-spin" : ""}`}
          />
          {t("admin.wallet.refresh")}
        </button>
      </header>

      {summaryQuery.isError ? (
        <ErrorState
          message={t("admin.wallet.summaryError")}
          onRetry={() => summaryQuery.refetch()}
        />
      ) : (
        <SummaryStrip
          summary={summaryQuery.data}
          loading={summaryQuery.isLoading}
        />
      )}

      <nav
        aria-label={t("admin.wallet.sections")}
        className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800"
      >
        {(
          [
            ["overview", t("admin.wallet.ledger"), History],
            ["withdrawals", t("admin.wallet.withdrawals"), Clock3],
            ["reconciliation", t("admin.wallet.reconciliation"), ShieldAlert],
            ["audit", t("admin.wallet.audit"), ShieldCheck],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
              activeTab === id
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <LedgerTable
            data={transactionsQuery.data?.content ?? []}
            loading={transactionsQuery.isLoading}
            error={transactionsQuery.isError}
            selectedId={selectedTransaction?.id}
            onSelect={setSelectedTransaction}
            onRetry={() => transactionsQuery.refetch()}
          />
          <TransactionDetails transaction={selectedTransaction} />
          <Pagination
            page={page}
            totalPages={transactionsQuery.data?.totalPages ?? 0}
            onChange={setPage}
          />
        </div>
      )}

      {activeTab === "withdrawals" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className={panelClass}>
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-slate-50">
                  {t("admin.wallet.withdrawalQueue")}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("admin.wallet.withdrawalHint")}
                </p>
              </div>
              <label className="relative block">
                <span className="sr-only">{t("admin.wallet.search")}</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("admin.wallet.search")}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 sm:w-64"
                />
              </label>
            </div>
            <WithdrawalTable
              data={visibleWithdrawals}
              loading={withdrawalsQuery.isLoading}
              error={withdrawalsQuery.isError}
              selectedId={selectedWithdrawal?.id}
              onSelect={setSelectedWithdrawal}
              onRetry={() => withdrawalsQuery.refetch()}
            />
          </section>
          <WithdrawalDetails
            withdrawal={selectedWithdrawal}
            rejectingId={rejectingId}
            rejectionReason={rejectionReason}
            confirmingApprovalId={confirmingApprovalId}
            currentAdminId={user?.userId}
            payoutReference={payoutReference}
            busy={
              approveMutation.isLoading ||
              rejectMutation.isLoading ||
              completeMutation.isLoading
            }
            onStartApprove={(id) => {
              setRejectingId(null);
              setConfirmingApprovalId(id);
            }}
            onApprove={(id) => approveMutation.mutate(id)}
            onCancelApprove={() => setConfirmingApprovalId(null)}
            onStartReject={(id) => {
              setConfirmingApprovalId(null);
              setRejectingId(id);
            }}
            onReasonChange={setRejectionReason}
            onReject={(id) =>
              rejectMutation.mutate({
                requestId: id,
                reason: rejectionReason.trim(),
              })
            }
            onCancelReject={() => {
              setRejectingId(null);
              setRejectionReason("");
            }}
            onPayoutReferenceChange={setPayoutReference}
            onComplete={(id) =>
              completeMutation.mutate({
                requestId: id,
                gatewayTxnId: payoutReference.trim(),
              })
            }
          />
        </div>
      )}

      {activeTab === "reconciliation" && (
        <ReconciliationTable
          data={reconciliationQuery.data ?? []}
          loading={reconciliationQuery.isLoading}
          error={reconciliationQuery.isError}
          busy={reconcileMutation.isLoading || freezeMutation.isLoading}
          onRetry={() => reconciliationQuery.refetch()}
          onReconcile={(walletId) => reconcileMutation.mutate(walletId)}
          onToggleFreeze={(walletId, active) =>
            freezeMutation.mutate({ walletId, active })
          }
        />
      )}

      {activeTab === "audit" && (
        <section className={panelClass}>
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-950 dark:text-slate-50">
              {t("admin.wallet.balanceAudit")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("admin.wallet.auditHint")}
            </p>
          </div>
          <AuditTable
            data={auditQuery.data?.content ?? []}
            loading={auditQuery.isLoading}
            error={auditQuery.isError}
            onRetry={() => auditQuery.refetch()}
          />
          <div className="p-4">
            <Pagination
              page={auditPage}
              totalPages={auditQuery.data?.totalPages ?? 0}
              onChange={setAuditPage}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryStrip({
  summary,
  loading,
}: {
  summary?: Awaited<ReturnType<typeof walletApi.getFinancialSummary>>;
  loading: boolean;
}) {
  const { t } = useI18n();
  const items = [
    [
      t("admin.wallet.totalCirculation"),
      summary ? formatCurrency(summary.totalCirculation) : "—",
      Wallet,
    ],
    [
      t("admin.wallet.depositedToday"),
      summary ? formatCurrency(summary.totalDepositToday) : "—",
      ArrowDownLeft,
    ],
    [
      t("admin.wallet.withdrawnToday"),
      summary ? formatCurrency(summary.totalWithdrawToday) : "—",
      ArrowUpRight,
    ],
    [
      t("admin.wallet.pendingWithdrawals"),
      summary?.pendingWithdrawals ?? "—",
      Clock3,
    ],
    [
      t("admin.wallet.frozenWallets"),
      summary?.frozenAccountCount ?? "—",
      ShieldCheck,
    ],
  ] as const;
  return (
    <section
      aria-label={t("admin.wallet.financialSummary")}
      className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {items.map(([label, value, Icon], index) => (
        <div
          key={label}
          className={`p-4 ${index > 0 ? "border-t sm:border-l sm:border-t-0 border-slate-200 dark:border-slate-800" : ""}`}
        >
          <div className="flex items-center gap-2 text-slate-500">
            <Icon className="h-4 w-4" />
            <span className={labelClass}>{label}</span>
          </div>
          <p
            className={`mt-2 text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50 ${loading ? "animate-pulse" : ""}`}
          >
            {value}
          </p>
        </div>
      ))}
    </section>
  );
}

function LedgerTable({
  data,
  loading,
  error,
  selectedId,
  onSelect,
  onRetry,
}: {
  data: WalletTransactionResponse[];
  loading: boolean;
  error: boolean;
  selectedId?: string;
  onSelect: (transaction: WalletTransactionResponse) => void;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <section className={panelClass}>
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-950 dark:text-slate-50">
          {t("admin.wallet.recentTransactions")}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {t("admin.wallet.recentHint")}
        </p>
      </div>
      {error ? (
        <ErrorState
          message={t("admin.wallet.transactionsError")}
          onRetry={onRetry}
        />
      ) : loading ? (
        <LoadingRows />
      ) : data.length === 0 ? (
        <EmptyState message={t("admin.wallet.noTransactions")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
              <tr>
                <th className="px-4 py-3">{t("admin.wallet.transaction")}</th>
                <th className="px-4 py-3">{t("admin.wallet.owner")}</th>
                <th className="px-4 py-3">{t("admin.wallet.amount")}</th>
                <th className="px-4 py-3">{t("admin.wallet.status")}</th>
                <th className="px-4 py-3 text-right">
                  {t("admin.wallet.action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.map((transaction) => (
                <tr
                  key={transaction.id}
                  className={
                    selectedId === transaction.id
                      ? "bg-indigo-50/70 dark:bg-indigo-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {humanize(transaction.txnType)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      {shortId(transaction.id)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800 dark:text-slate-200">
                      {transaction.walletOwnerName ||
                        t("admin.wallet.systemWallet")}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      {shortId(transaction.walletId)}
                    </p>
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold tabular-nums ${transaction.direction === "CREDIT" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                  >
                    {transaction.direction === "CREDIT" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amountMxc))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={transaction.txnStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(transaction)}
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4" />
                      {t("common.viewDetails")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TransactionDetails({
  transaction,
}: {
  transaction: WalletTransactionResponse | null;
}) {
  const { t } = useI18n();
  return (
    <aside
      className={`${panelClass} h-fit xl:sticky xl:top-6`}
      aria-live="polite"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-950 dark:text-slate-50">
          {t("admin.wallet.transactionDetails")}
        </h2>
      </div>
      {!transaction ? (
        <EmptyState message={t("admin.wallet.selectTransaction")} />
      ) : (
        <dl className="space-y-4 p-4">
          <Detail
            label={t("admin.wallet.transactionId")}
            value={transaction.id}
            mono
          />
          <Detail
            label={t("admin.wallet.owner")}
            value={
              transaction.walletOwnerName || t("admin.wallet.systemWallet")
            }
          />
          <Detail
            label={t("admin.wallet.walletId")}
            value={transaction.walletId}
            mono
          />
          <Detail
            label={t("admin.wallet.typeDirection")}
            value={`${humanize(transaction.txnType)} · ${humanize(transaction.direction)}`}
          />
          <Detail
            label={t("admin.wallet.amount")}
            value={formatCurrency(Number(transaction.amountMxc))}
          />
          <Detail
            label={t("admin.wallet.balanceAfter")}
            value={formatCurrency(Number(transaction.balanceAfterMxc))}
          />
          <Detail
            label={t("admin.wallet.status")}
            value={humanize(transaction.txnStatus)}
          />
          <Detail
            label={t("admin.wallet.groupId")}
            value={transaction.transactionGroupId}
            mono
          />
          {transaction.referenceId && (
            <Detail
              label={t("admin.wallet.reference")}
              value={`${transaction.referenceType || "—"} · ${transaction.referenceId}`}
              mono
            />
          )}
          {transaction.gatewayTransactionId && (
            <Detail
              label={t("admin.wallet.gatewayReference")}
              value={transaction.gatewayTransactionId}
              mono
            />
          )}
          {transaction.note && (
            <Detail label={t("admin.wallet.note")} value={transaction.note} />
          )}
          <Detail
            label={t("admin.wallet.createdAt")}
            value={formatDateTime(transaction.createdAt)}
          />
        </dl>
      )}
    </aside>
  );
}

function WithdrawalTable({
  data,
  loading,
  error,
  selectedId,
  onSelect,
  onRetry,
}: {
  data: WithdrawalResponse[];
  loading: boolean;
  error: boolean;
  selectedId?: string;
  onSelect: (withdrawal: WithdrawalResponse) => void;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  if (error)
    return (
      <ErrorState
        message={t("admin.wallet.withdrawalsError")}
        onRetry={onRetry}
      />
    );
  if (loading) return <LoadingRows />;
  if (data.length === 0)
    return <EmptyState message={t("admin.wallet.noWithdrawals")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
          <tr>
            <th className="px-4 py-3">{t("admin.wallet.requester")}</th>
            <th className="px-4 py-3">{t("admin.wallet.amount")}</th>
            <th className="px-4 py-3">{t("admin.wallet.destination")}</th>
            <th className="px-4 py-3">{t("admin.wallet.status")}</th>
            <th className="px-4 py-3 text-right">{t("admin.wallet.action")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {data.map((item) => (
            <tr
              key={item.id}
              className={
                selectedId === item.id
                  ? "bg-indigo-50/70 dark:bg-indigo-950/20"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }
            >
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.userFullName || shortId(item.userId)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(item.createdAt)}
                </p>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold tabular-nums">
                  {formatCurrency(item.mxcAmount)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("admin.wallet.net")}: {formatCurrency(item.netMxc)}
                </p>
              </td>
              <td className="px-4 py-3">
                <p>{item.bankName || "—"}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {maskAccount(item.bankAccountNo)}
                </p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" />
                  {t("common.viewDetails")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawalDetails(props: {
  withdrawal: WithdrawalResponse | null;
  rejectingId: string | null;
  rejectionReason: string;
  confirmingApprovalId: string | null;
  currentAdminId?: string;
  payoutReference: string;
  busy: boolean;
  onStartApprove: (id: string) => void;
  onApprove: (id: string) => void;
  onCancelApprove: () => void;
  onStartReject: (id: string) => void;
  onReasonChange: (reason: string) => void;
  onReject: (id: string) => void;
  onCancelReject: () => void;
  onPayoutReferenceChange: (value: string) => void;
  onComplete: (id: string) => void;
}) {
  const { t } = useI18n();
  const item = props.withdrawal;
  return (
    <aside
      className={`${panelClass} h-fit xl:sticky xl:top-6`}
      aria-live="polite"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold">{t("admin.wallet.withdrawalDetails")}</h2>
      </div>
      {!item ? (
        <EmptyState message={t("admin.wallet.selectWithdrawal")} />
      ) : (
        <div className="space-y-5 p-4">
          <dl className="space-y-4">
            <Detail label={t("admin.wallet.requestId")} value={item.id} mono />
            <Detail
              label={t("admin.wallet.requester")}
              value={item.userFullName || item.userId}
            />
            <Detail
              label={t("admin.wallet.requestedAmount")}
              value={formatCurrency(item.mxcAmount)}
            />
            <Detail
              label={t("admin.wallet.fee")}
              value={formatCurrency(item.feeMxc)}
            />
            <Detail
              label={t("admin.wallet.netPayout")}
              value={formatCurrency(item.netMxc)}
            />
            <Detail
              label={t("admin.wallet.destination")}
              value={`${item.bankName || "—"} · ${item.bankAccountName || "—"} · ${item.bankAccountNo || "—"}`}
            />
            <Detail
              label={t("admin.wallet.status")}
              value={humanize(item.status)}
            />
            <Detail
              label={t("admin.wallet.createdAt")}
              value={formatDateTime(item.createdAt)}
            />
            {item.reviewedByUserId && (
              <Detail
                label={t("admin.wallet.reviewedBy")}
                value={item.reviewedByUserId}
                mono
              />
            )}
            {item.completedByUserId && (
              <Detail
                label={t("admin.wallet.completedBy")}
                value={item.completedByUserId}
                mono
              />
            )}
            {item.rejectionReason && (
              <Detail
                label={t("admin.wallet.rejectionReason")}
                value={item.rejectionReason}
              />
            )}
          </dl>
          {item.status === WithdrawalStatus.PENDING && (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              {props.confirmingApprovalId === item.id ? (
                <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    {t("admin.wallet.approveConfirm")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <ActionButton
                      onClick={() => props.onApprove(item.id)}
                      disabled={props.busy}
                      tone="success"
                    >
                      {t("admin.wallet.confirmFirstReview")}
                    </ActionButton>
                    <ActionButton
                      onClick={props.onCancelApprove}
                      disabled={props.busy}
                    >
                      {t("common.cancel")}
                    </ActionButton>
                  </div>
                </div>
              ) : props.rejectingId === item.id ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold">
                    {t("admin.wallet.rejectionReason")}
                    <textarea
                      value={props.rejectionReason}
                      onChange={(event) =>
                        props.onReasonChange(event.target.value)
                      }
                      maxLength={500}
                      className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <div className="flex gap-2">
                    <ActionButton
                      onClick={() => props.onReject(item.id)}
                      disabled={
                        props.busy || props.rejectionReason.trim().length < 3
                      }
                      tone="danger"
                    >
                      {t("admin.wallet.confirmReject")}
                    </ActionButton>
                    <ActionButton
                      onClick={props.onCancelReject}
                      disabled={props.busy}
                    >
                      {t("common.cancel")}
                    </ActionButton>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <ActionButton
                    onClick={() => props.onStartApprove(item.id)}
                    tone="success"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("admin.wallet.approve")}
                  </ActionButton>
                  <ActionButton
                    onClick={() => props.onStartReject(item.id)}
                    tone="danger"
                  >
                    <XCircle className="h-4 w-4" />
                    {t("admin.wallet.reject")}
                  </ActionButton>
                </div>
              )}
            </div>
          )}
          {item.status === WithdrawalStatus.PROCESSING && (
            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              {item.reviewedByUserId === props.currentAdminId ? (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  {t("admin.wallet.secondAdminRequired")}
                </div>
              ) : (
                <>
                  <label className="block text-sm font-semibold">
                    {t("admin.wallet.gatewayReference")}
                    <input
                      value={props.payoutReference}
                      onChange={(event) =>
                        props.onPayoutReferenceChange(event.target.value)
                      }
                      maxLength={255}
                      placeholder={t("admin.wallet.gatewayReferencePlaceholder")}
                      className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <ActionButton
                    onClick={() => props.onComplete(item.id)}
                    disabled={props.busy || props.payoutReference.trim().length < 3}
                    tone="success"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("admin.wallet.completePayout")}
                  </ActionButton>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function ReconciliationTable({
  data,
  loading,
  error,
  busy,
  onRetry,
  onReconcile,
  onToggleFreeze,
}: {
  data: WalletResponse[];
  loading: boolean;
  error: boolean;
  busy: boolean;
  onRetry: () => void;
  onReconcile: (walletId: string) => void;
  onToggleFreeze: (walletId: string, active: boolean) => void;
}) {
  const { t } = useI18n();
  if (error)
    return (
      <ErrorState
        message={t("admin.wallet.reconciliationError")}
        onRetry={onRetry}
      />
    );
  return (
    <section className={panelClass}>
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-950 dark:text-slate-50">
          {t("admin.wallet.reconciliationQueue")}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {t("admin.wallet.reconciliationHint")}
        </p>
      </div>
      {loading ? (
        <LoadingRows />
      ) : data.length === 0 ? (
        <EmptyState message={t("admin.wallet.noReconciliationIssues")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
              <tr>
                <th className="px-4 py-3">{t("admin.wallet.owner")}</th>
                <th className="px-4 py-3">{t("admin.wallet.wallet")}</th>
                <th className="px-4 py-3">{t("admin.wallet.balance")}</th>
                <th className="px-4 py-3">{t("admin.wallet.status")}</th>
                <th className="px-4 py-3 text-right">{t("admin.wallet.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.map((wallet) => (
                <tr key={wallet.id}>
                  <td className="px-4 py-3">{wallet.userFullName || shortId(wallet.userId)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{wallet.id}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(wallet.balanceMxc)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={wallet.isActive ? "ACTIVE" : "FROZEN"} />
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <ActionButton onClick={() => onReconcile(wallet.id)} disabled={busy}>
                      <RefreshCw className="h-4 w-4" />
                      {t("admin.wallet.reconcile")}
                    </ActionButton>
                    <ActionButton
                      onClick={() => onToggleFreeze(wallet.id, wallet.isActive)}
                      disabled={busy}
                      tone={wallet.isActive ? "danger" : "success"}
                    >
                      {wallet.isActive ? t("admin.wallet.freeze") : t("admin.wallet.unfreeze")}
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AuditTable({
  data,
  loading,
  error,
  onRetry,
}: {
  data: AuditLog[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  if (error)
    return (
      <ErrorState message={t("admin.wallet.auditError")} onRetry={onRetry} />
    );
  if (loading) return <LoadingRows />;
  if (data.length === 0)
    return <EmptyState message={t("admin.wallet.noAuditLogs")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
          <tr>
            <th className="px-4 py-3">{t("admin.wallet.createdAt")}</th>
            <th className="px-4 py-3">{t("admin.wallet.wallet")}</th>
            <th className="px-4 py-3">{t("admin.wallet.before")}</th>
            <th className="px-4 py-3">{t("admin.wallet.change")}</th>
            <th className="px-4 py-3">{t("admin.wallet.after")}</th>
            <th className="px-4 py-3">{t("admin.wallet.transaction")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {data.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3">{formatDateTime(log.changedAt)}</td>
              <td className="px-4 py-3">
                {log.wallet?.user?.fullName || shortId(log.wallet?.id)}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {formatCurrency(log.oldBalanceMxc)}
              </td>
              <td
                className={`px-4 py-3 font-semibold tabular-nums ${log.deltaMxc >= 0 ? "text-emerald-700" : "text-rose-700"}`}
              >
                {log.deltaMxc >= 0 ? "+" : ""}
                {formatCurrency(log.deltaMxc)}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {formatCurrency(log.newBalanceMxc)}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {log.changedByTxn ? shortId(log.changedByTxn) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className={labelClass}>{label}</dt>
      <dd
        className={`mt-1 break-words text-sm text-slate-900 dark:text-slate-100 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const warning = status === "PENDING" || status === "PROCESSING";
  const success = status === "COMPLETED" || status === "APPROVED";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${success ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : warning ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
    >
      {humanize(status)}
    </span>
  );
}
function ActionButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "success" | "danger";
}) {
  const tones = {
    neutral:
      "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    success:
      "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
    danger: "border-rose-700 bg-rose-700 text-white hover:bg-rose-800",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return <div />;
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        aria-label={t("common.previous")}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-slate-300 p-2 disabled:opacity-40 dark:border-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-slate-500">
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        aria-label={t("common.next")}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-slate-300 p-2 disabled:opacity-40 dark:border-slate-700"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
function LoadingRows() {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
        />
      ))}
    </div>
  );
}
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl bg-rose-50 p-5 text-center text-sm text-rose-800 dark:bg-rose-950/20 dark:text-rose-300">
      <AlertCircle className="h-5 w-5" />
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="font-semibold underline underline-offset-4"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
function shortId(value?: string) {
  return value ? `${value.slice(0, 8)}…` : "—";
}
function humanize(value?: string) {
  return value
    ? value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";
}
function maskAccount(value?: string) {
  if (!value) return "—";
  return value.length <= 4 ? value : `•••• ${value.slice(-4)}`;
}
