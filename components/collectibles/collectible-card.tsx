import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { Trophy } from "lucide-react";
import type { Collectible } from "@/types";

interface CollectibleCardProps {
  collectible: Collectible;
  showDate?: boolean;
}

// NFT-style collectible images
const nftImages = [
  "/collectibles/nft-collectible-1.png",
  "/collectibles/nft-collectible-2.png",
  "/collectibles/nft-collectible-3.png",
  "/collectibles/nft-collectible-4.png",
  "/collectibles/nft-collectible-5.png",
  "/collectibles/nft-collectible-6.png",
];

export default function CollectibleCard({ collectible }: CollectibleCardProps) {
  // Generate a consistent but random image for each collectible based on its ID
  const getImageForCollectible = (id: string) => {
    // Use the collectible ID to deterministically select an image
    const charSum = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const imageIndex = charSum % nftImages.length;
    return nftImages[imageIndex];
  };

  const nftImage = getImageForCollectible(collectible.id);

  // Check if this is a special duck collectible
  const isGoldenDuck = collectible.image?.includes("golden-duck");
  const isSimpleDuck = collectible.image?.includes("simple-duck");

  // Use the original image if it's a special duck, otherwise use the NFT image
  const displayImage = isGoldenDuck || isSimpleDuck ? collectible.image : nftImage;

  // Apply special classes for golden ducks
  const specialClasses = isGoldenDuck ? "golden-collectible pulse-glow" : "nft-border";

  // Fallback image if image loading fails
  const fallbackImageContent = (isGolden = false) => (
    <div className={`w-full h-full flex items-center justify-center ${isGolden ? "bg-amber-900/40" : "bg-gray-800/40"}`}>
      <Trophy className={`w-12 h-12 ${isGolden ? "text-amber-500" : "text-gray-400"}`} />
    </div>
  );

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 animated-bg bg-gray-900 border-gray-800">
      <CardContent className="p-0 relative">
        <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground rounded-full p-1 z-10 cyber-badge">
          <Trophy className="h-4 w-4" />
        </div>
        <div
          className={`relative aspect-square bg-gradient-to-br from-gray-800 to-black flex items-center justify-center overflow-hidden ${specialClasses}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {isGoldenDuck ? (
            <div className="trophy-case w-full h-full">
              <div className="trophy-pedestal"></div>
              <div className="trophy-spotlight"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="rotate-trophy w-4/5 h-4/5">
                  {fallbackImageContent(true)}
                </div>
              </div>
            </div>
          ) : (
            <div className={`relative w-full h-full ${isGoldenDuck ? "float-animation" : ""}`}>
              {fallbackImageContent(false)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-gray-900/80 border-t border-gray-800">
        <div className="w-full">
          <h3 className="text-sm font-medium truncate text-gray-200">
            {isGoldenDuck ? `${collectible.name} (Golden Edition)` : collectible.name}
          </h3>
          <p className="text-xs text-gray-400">{new Date(collectible.date).toLocaleDateString()}</p>
        </div>
      </CardFooter>
    </Card>
  );
}