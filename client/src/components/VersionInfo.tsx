import React, { useState } from 'react';
import { Info, Copy, Check, Server, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trackEvent } from '@/hooks/use-analytics';
import { useVersionInfo } from '@/hooks/use-version-info';

/**
 * A component that displays version information in the UI
 * Can be compact (just version number) or expanded (with dialog for details)
 */
export function VersionInfo({ 
  compact = false,
  className = '' 
}: { 
  compact?: boolean;
  className?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { versionInfo, isLoading, error, fromApi } = useVersionInfo();

  const copyVersionInfo = () => {
    // Create detailed version string
    const detailedInfo = `
    Version: ${versionInfo.appVersion}
    Build: ${versionInfo.buildNumber}
    Commit: ${versionInfo.commitHash}
    Environment: ${versionInfo.environment}
    Build Date: ${versionInfo.buildDate}
    Release: ${versionInfo.releaseTag}
    ${versionInfo.server ? `Server: ${versionInfo.server.nodeVersion} (Uptime: ${Math.floor(versionInfo.server.uptime / 3600)}h ${Math.floor((versionInfo.server.uptime % 3600) / 60)}m)` : ''}
    `;
    
    navigator.clipboard.writeText(detailedInfo.trim());
    setCopied(true);
    
    // Track the copy action in analytics
    trackEvent('Version', 'copy_version_details', versionInfo.appVersion);
    
    setTimeout(() => setCopied(false), 2000);
  };

  // Track when version details are viewed
  const handleOpenDialog = () => {
    trackEvent('Version', 'view_version_details', versionInfo.appVersion);
    setDialogOpen(true);
  };

  if (compact) {
    return (
      <span 
        className={`text-xs text-muted-foreground hover:text-primary cursor-pointer ${className}`}
        onClick={handleOpenDialog}
      >
        v{versionInfo.appVersion}
      </span>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Badge 
          variant="outline" 
          className={`cursor-pointer hover:bg-secondary ${className}`}
          onClick={handleOpenDialog}
        >
          <Info className="h-3 w-3 mr-1" />
          v{versionInfo.appVersion}
        </Badge>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Version Information</DialogTitle>
          <DialogDescription>
            Details about the current application build and version.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold">Application Version</div>
            <div>{versionInfo.appVersion}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Build Number</div>
            <div>{versionInfo.buildNumber}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Commit Hash</div>
            <div className="font-mono text-xs">{versionInfo.commitHash}</div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Environment</div>
            <Badge variant={versionInfo.environment === 'production' ? 'default' : 'secondary'}>
              {versionInfo.environment}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Release Tag</div>
            <div>{versionInfo.releaseTag}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Build Date</div>
            <div>{versionInfo.buildDate}</div>
          </div>
          
          {fromApi && versionInfo.server && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 font-semibold">
                  <Server className="h-4 w-4" />
                  <span>Server Information</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pl-5">
                <div className="text-sm text-muted-foreground">Node Version</div>
                <div className="text-sm font-mono">{versionInfo.server.nodeVersion}</div>
              </div>
              
              <div className="flex justify-between items-center pl-5">
                <div className="text-sm text-muted-foreground">Server Uptime</div>
                <div className="text-sm">
                  {Math.floor(versionInfo.server.uptime / 3600)}h {Math.floor((versionInfo.server.uptime % 3600) / 60)}m
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4 flex justify-between">
          <Badge variant="outline" className="gap-1">
            <Globe className="h-4 w-4" /> 
            {fromApi ? 'API data' : 'Local data'}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyVersionInfo}
            className="flex gap-1 items-center"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Details
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}