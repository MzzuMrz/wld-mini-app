import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Trophy } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import type { Collectible } from "@/types";

interface CollectibleEarnedDialogProps {
  collectible: Collectible | null;
  onClose: () => void;
}

export default function CollectibleEarnedDialog({ collectible, onClose }: CollectibleEarnedDialogProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (collectible) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [collectible]);

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={150} recycle={false} />}
      <Dialog open={!!collectible} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="animated-bg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center mb-2">Collectible Earned!</DialogTitle>
            <DialogDescription className="text-center">
              You've earned a new collectible for participating in a poll.
            </DialogDescription>
          </DialogHeader>

          {collectible && (
            <div className="flex flex-col items-center justify-center my-4">
              <div className="mb-4 w-40 h-40 relative">
                <div
                  className={`relative aspect-square bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center overflow-hidden ${
                    collectible.image.includes("golden") ? "golden-collectible" : "nft-border"
                  }`}
                >
                  <div className="trophy-case w-full h-full rounded-xl">
                    <div className="trophy-pedestal"></div>
                    <div className="trophy-spotlight"></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="rotate-trophy w-4/5 h-4/5">
                        <div className={`w-full h-full flex items-center justify-center ${collectible.image.includes("golden") ? "bg-amber-900/40" : "bg-gray-800/40"}`}>
                          <Trophy className={`w-12 h-12 ${collectible.image.includes("golden") ? "text-amber-500" : "text-gray-400"}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 cyber-badge">
                  <Trophy className="h-4 w-4" />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-1">
                {collectible.image.includes("golden")
                  ? `${collectible.name} (Golden Edition)`
                  : collectible.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Earned on {new Date(collectible.date).toLocaleDateString()}
              </p>

              <Button
                onClick={onClose}
                variant="default"
                className="w-full futuristic-button"
              >
                Awesome!
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}