import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMyThreats } from "../hooks/use-backend";
import { useSocket } from "../hooks/use-socket";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/AppCard";

type ThreatRecord = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  severity?: string;
  status?: string;
  type?: string;
  createdAt?: string;
};

const normalizeThreat = (item: any): ThreatRecord => ({
  _id: item?._id || item?.id,
  id: item?.id || item?._id,
  title: item?.title || "Security event",
  description: item?.description || item?.meta?.reason || "Threat signal detected.",
  severity: (item?.severity || "medium").toLowerCase(),
  status: item?.status || "open",
  type: item?.type || "threat",
  createdAt: item?.createdAt || new Date().toISOString(),
});

export function Threats() {
  const { data: initialThreats = [] } = useMyThreats();
  const { socket } = useSocket();
  const [liveThreats, setLiveThreats] = useState<ThreatRecord[]>([]);

  useEffect(() => {
    if (!socket) return undefined;

    const onThreatAlert = (payload: any) => {
      setLiveThreats((prev) => [normalizeThreat(payload), ...prev].slice(0, 20));
    };

    socket.on("threatAlert", onThreatAlert);
    return () => {
      socket.off("threatAlert", onThreatAlert);
    };
  }, [socket]);

  const threats = useMemo(() => {
    const merged = [...liveThreats, ...initialThreats.map(normalizeThreat)];
    const deduped = new Map<string, ThreatRecord>();
    merged.forEach((item) => {
      const key = item._id || item.id || `${item.title}-${item.createdAt}`;
      if (!deduped.has(key)) deduped.set(key, item);
    });
    return Array.from(deduped.values()).slice(0, 10);
  }, [initialThreats, liveThreats]);

  return (
    <Card data-ocid="threats.panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-destructive" />
          Live Threats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {threats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No threat alerts right now.</p>
        ) : (
          <div className="space-y-3">
            {threats.map((threat, idx) => (
              <div
                key={threat._id || threat.id || `${threat.title}-${idx}`}
                className="p-3 rounded-lg border border-border bg-muted/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm text-foreground">{threat.title}</p>
                  <span className="text-[10px] font-mono uppercase text-destructive">
                    {(threat.severity || "medium").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{threat.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
