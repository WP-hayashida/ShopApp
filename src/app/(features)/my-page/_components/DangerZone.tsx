import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DangerZoneProps {
  onDelete: () => Promise<void>;
  loading: boolean;
}

export const DangerZone = ({ onDelete, loading }: DangerZoneProps) => (
  <>
    <Separator className="my-8" />
    <section>
      <h2 className="text-2xl font-bold text-red-600 mb-4">危険な操作</h2>
      <p className="text-gray-700 mb-4">
        このショップの投稿を完全に削除します。この操作は元に戻せません。
      </p>
      <Button variant="destructive" onClick={onDelete} disabled={loading}>
        {loading ? "削除中..." : "投稿を削除する"}
      </Button>
    </section>
  </>
);
