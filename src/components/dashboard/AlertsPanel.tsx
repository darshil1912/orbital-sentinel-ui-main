import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Zap, Shield, ExternalLink, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { realTimeService } from "@/services/realTimeService";
import type { AlertItem, RealTimeConnection } from "@/types/orbital";


function getPriorityBadgeVariant(priority: string) {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'active': return 'default';
    case 'acknowledged': return 'secondary';
    default: return 'outline';
  }
}

function getTimeToImpact(timeString: string): string {
  const now = new Date();
  const impact = new Date(timeString);
  const diff = impact.getTime() - now.getTime();
  
  if (diff < 0) return 'Past';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<RealTimeConnection>({
    status: 'connected',
    lastHeartbeat: new Date().toISOString(),
    dataLatency: 75,
    subscribedChannels: [],
    messagesReceived: 0,
    connectionTime: new Date().toISOString()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to real-time alerts
    const unsubscribe = realTimeService.subscribe('alerts', (newAlerts: AlertItem[]) => {
      setAlerts(newAlerts);
      // Show toast for critical alerts
      const criticalAlerts = newAlerts.filter(alert => alert.priority === 'critical' && alert.status === 'active');
      if (criticalAlerts.length > 0) {
        toast.error(`${criticalAlerts.length} Critical Alert${criticalAlerts.length > 1 ? 's' : ''} Detected!`, {
          description: `High-risk collision${criticalAlerts.length > 1 ? 's' : ''} imminent. Immediate action required.`
        });
      }
    });

    // Subscribe to connection status updates
    const statusUnsubscribe = realTimeService.subscribe('connection', (newStatus: RealTimeConnection) => {
      setConnectionStatus(newStatus);
    });

    // Also listen to settings changes
    const settingsUnsubscribe = realTimeService.subscribe('settings', () => {
      setConnectionStatus(realTimeService.getConnectionStatus());
    });

    // Initial data fetch
    realTimeService.triggerUpdate('alerts');

    return () => {
      unsubscribe();
      statusUnsubscribe();
      settingsUnsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    realTimeService.triggerUpdate('alerts');
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleReconnect = () => {
    realTimeService.reconnect();
    toast.info('Reconnecting to real-time service...');
  };
  
  const handleAcknowledgeAlert = (alertId: string) => {
    // Update local state to acknowledge alert
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
    ));
    toast.success(`Alert ${alertId} acknowledged`);
  };
  
  const handleViewDetails = (alertId: string) => {
    toast.info(`Opening detailed view for ${alertId}`);
  };
  
  const handleSuggestManeuver = (alertId: string) => {
    toast.info(`Calculating maneuver suggestions for ${alertId}`);
  };

  const ConnectionIndicator = () => {
    const isConnected = connectionStatus.status === 'connected';
    return (
      <div className="flex items-center gap-1 text-xs">
        {isConnected ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
        <span className={isConnected ? "text-green-600" : "text-red-600"}>
          {connectionStatus.status}
        </span>
      </div>
    );
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const sortedAlerts = [...alerts].sort((a, b) => b.risk - a.risk);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Real-time Alerts
          <div className="flex items-center gap-2 ml-auto">
            <ConnectionIndicator />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant={activeAlerts.length > 0 ? "destructive" : "secondary"}>
              {activeAlerts.length} Active
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus.status === 'disconnected' && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <WifiOff className="h-4 w-4" />
                <span>Real-time connection lost</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleReconnect}>
                Reconnect
              </Button>
            </div>
          </div>
        )}
        
        {sortedAlerts.map((al) => {
          const high = al.risk >= 0.8;
          const critical = al.priority === 'critical';
          return (
            <div
              key={al.id}
              className={`rounded-lg border p-4 transition-all hover:shadow-md ${
                critical ? "border-destructive bg-destructive/5" : "border-border"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${high ? "text-destructive animate-pulse" : "text-primary"}`} />
                  <span className="font-medium">{al.pair}</span>
                  <Badge variant={getPriorityBadgeVariant(al.priority)} size="sm">
                    {al.priority}
                  </Badge>
                  {al.maneuverSuggested && (
                    <Badge variant="outline" size="sm" className="text-xs">
                      Maneuver Ready
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono">{al.id}</span>
              </div>

              {/* Risk and Time Info */}
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Impact in:</span>
                  <span className={high ? "font-semibold text-destructive" : "font-medium"}>
                    {getTimeToImpact(al.time)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Risk:</span>
                  <span className={`${high ? "text-destructive animate-pulse font-bold" : "text-foreground font-semibold"}`}>
                    {al.risk.toFixed(2)}
                  </span>
                  {al.confidenceLevel && (
                    <span className="text-xs text-muted-foreground">({(al.confidenceLevel * 100).toFixed(0)}%)</span>
                  )}
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-muted-foreground">
                <div>
                  <span className="block">Miss Distance</span>
                  <span className="font-mono font-medium text-foreground">{al.missDistance.toFixed(2)} km</span>
                </div>
                <div>
                  <span className="block">Altitude</span>
                  <span className="font-mono font-medium text-foreground">{al.altitude.toFixed(0)} km</span>
                </div>
                <div>
                  <span className="block">Rel. Velocity</span>
                  <span className="font-mono font-medium text-foreground">{al.relativeVelocity.toFixed(1)} km/s</span>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={getStatusBadgeVariant(al.status)} size="sm">
                  {al.status}
                </Badge>
                <div className="flex gap-1">
                  {al.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledgeAlert(al.id)}
                      className="h-6 px-2 text-xs"
                    >
                      Acknowledge
                    </Button>
                  )}
                  {al.maneuverSuggested && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuggestManeuver(al.id)}
                      className="h-6 px-2 text-xs"
                    >
                      Maneuver
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(al.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        {alerts.length === 0 && connectionStatus.status === 'connected' && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
            <p className="text-sm">All monitored objects are operating safely</p>
          </div>
        )}

        {alerts.length === 0 && connectionStatus.status === 'disconnected' && (
          <div className="text-center py-8 text-muted-foreground">
            <WifiOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Unable to load alerts</p>
            <p className="text-sm">Check your connection and try again</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
