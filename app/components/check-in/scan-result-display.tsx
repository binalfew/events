import type { ScanResultCode } from "~/services/check-in.server";

interface ScanResultDisplayProps {
  result: ScanResultCode;
  message: string;
  participantName?: string;
  registrationCode?: string;
  onDismiss: () => void;
}

const RESULT_STYLES: Record<ScanResultCode, { bg: string; border: string; text: string }> = {
  VALID: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-800 dark:text-green-200",
  },
  MANUAL_OVERRIDE: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-800 dark:text-green-200",
  },
  INVALID: {
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-800 dark:text-red-200",
  },
  REVOKED: {
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-800 dark:text-red-200",
  },
  EXPIRED: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-800 dark:text-yellow-200",
  },
  ALREADY_SCANNED: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-800 dark:text-yellow-200",
  },
};

const RESULT_LABELS: Record<ScanResultCode, string> = {
  VALID: "Access Granted",
  MANUAL_OVERRIDE: "Override Accepted",
  INVALID: "Invalid",
  REVOKED: "Revoked",
  EXPIRED: "Expired",
  ALREADY_SCANNED: "Already Scanned",
};

export function ScanResultDisplay({
  result,
  message,
  participantName,
  registrationCode,
  onDismiss,
}: ScanResultDisplayProps) {
  const style = RESULT_STYLES[result];

  return (
    <div
      className={`rounded-lg border-2 p-4 ${style.bg} ${style.border}`}
      role="alert"
      onClick={onDismiss}
    >
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-bold ${style.text}`}>{RESULT_LABELS[result]}</h3>
        <button className={`text-sm ${style.text} opacity-60`} onClick={onDismiss}>
          Dismiss
        </button>
      </div>
      <p className={`mt-1 ${style.text}`}>{message}</p>
      {participantName && (
        <p className={`mt-2 text-lg font-semibold ${style.text}`}>{participantName}</p>
      )}
      {registrationCode && (
        <p className={`text-sm ${style.text} opacity-75`}>Code: {registrationCode}</p>
      )}
    </div>
  );
}
