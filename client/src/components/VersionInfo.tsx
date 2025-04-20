import React, { useState } from 'react';
import { Info, Copy, Check } from 'lucide-react';
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
import { VERSION, getDetailedVersionInfo } from '@shared/version';
import { trackEvent } from '@/hooks/use-analytics';

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

  const copyVersionInfo = () => {
    navigator.clipboard.writeText(getDetailedVersionInfo().trim());
    setCopied(true);
    
    // Track the copy action in analytics
    trackEvent('Version', 'copy_version_details', VERSION.appVersion);
    
    setTimeout(() => setCopied(false), 2000);
  };

  // Track when version details are viewed
  const handleOpenDialog = () => {
    trackEvent('Version', 'view_version_details', VERSION.appVersion);
    setDialogOpen(true);
  };

  if (compact) {
    return (
      <span 
        className={`text-xs text-muted-foreground hover:text-primary cursor-pointer ${className}`}
        onClick={handleOpenDialog}
      >
        v{VERSION.appVersion}
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
          v{VERSION.appVersion}
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
            <div>{VERSION.appVersion}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Build Number</div>
            <div>{VERSION.buildNumber}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Commit Hash</div>
            <div className="font-mono text-xs">{VERSION.commitHash}</div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Environment</div>
            <Badge variant={VERSION.environment === 'production' ? 'default' : 'secondary'}>
              {VERSION.environment}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Release Tag</div>
            <div>{VERSION.releaseTag}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="font-semibold">Build Date</div>
            <div>{VERSION.buildDate}</div>
          </div>
        </div>

        <DialogFooter className="mt-4">
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