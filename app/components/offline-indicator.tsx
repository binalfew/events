import { useEffect, useState, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { getSyncManager, type SyncStatus, type SyncResult } from "~/lib/sync-manager";
import { getStats, type QueueStats } from "~/lib/offline-store";
import { toast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";

export function OfflineIndicator() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [stats, setStats] = useState<QueueStats>({ pending: 0, syncing: 0, failed: 0 });
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const manager = getSyncManager();
    manager.start();

    // Set initial status
    setStatus(manager.getStatus());

    const unsubStatus = manager.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === "syncing") {
        setIsSyncing(true);
      } else {
        setIsSyncing(false);
      }
    });

    const unsubResult = manager.onSyncResult((result: SyncResult) => {
      setLastSync(new Date());
      refreshStats();

      // Show conflict toasts
      for (const conflict of result.conflicts) {
        toast({
          variant: "destructive",
          title: "Sync Conflict",
          description: `Your offline action on ${conflict.entityType} was superseded by a more recent update`,
        });
      }

      if (result.synced > 0 && result.conflicts.length === 0) {
        toast({
          title: "Sync Complete",
          description: `${result.synced} action${result.synced > 1 ? "s" : ""} synced successfully`,
        });
      }

      if (result.failed > 0) {
        toast({
          variant: "destructive",
          title: "Sync Issues",
          description: `${result.failed} action${result.failed > 1 ? "s" : ""} failed to sync`,
        });
      }
    });

    // Refresh stats periodically
    refreshStats();
    const interval = setInterval(refreshStats, 5000);

    return () => {
      unsubStatus();
      unsubResult();
      clearInterval(interval);
      manager.stop();
    };
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const s = await getStats();
      setStats(s);
    } catch {
      // IndexedDB might not be available
    }
  }, []);

  const handleSync = useCallback(async () => {
    const manager = getSyncManager();
    await manager.sync();
    await refreshStats();
  }, [refreshStats]);

  const totalQueued = stats.pending + stats.syncing + stats.failed;
  const isOffline = status === "offline";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative size-8", isOffline && "text-destructive")}
          aria-label={isOffline ? "Offline" : "Online"}
        >
          {isOffline ? (
            <WifiOff className="size-4" />
          ) : isSyncing ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <Wifi className="size-4" />
          )}
          {totalQueued > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {totalQueued > 9 ? "9+" : totalQueued}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-2 rounded-full",
                isOffline ? "bg-destructive" : isSyncing ? "bg-yellow-500" : "bg-green-500",
              )}
            />
            <span className="text-sm font-medium">
              {isOffline ? "Offline" : isSyncing ? "Syncing..." : "Online"}
            </span>
          </div>

          {/* Queue Stats */}
          {totalQueued > 0 && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {stats.pending > 0 && (
                <div className="flex justify-between">
                  <span>Pending</span>
                  <span>{stats.pending}</span>
                </div>
              )}
              {stats.syncing > 0 && (
                <div className="flex justify-between">
                  <span>Syncing</span>
                  <span>{stats.syncing}</span>
                </div>
              )}
              {stats.failed > 0 && (
                <div className="flex items-center justify-between text-destructive">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    Failed
                  </span>
                  <span>{stats.failed}</span>
                </div>
              )}
            </div>
          )}

          {totalQueued === 0 && !isOffline && (
            <p className="text-xs text-muted-foreground">All actions synced</p>
          )}

          {/* Last Sync */}
          {lastSync && (
            <p className="text-xs text-muted-foreground">
              Last sync: {lastSync.toLocaleTimeString()}
            </p>
          )}

          {/* Manual Sync Button */}
          {!isOffline && totalQueued > 0 && (
            <Button size="sm" className="w-full" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-1 size-3 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 size-3" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
