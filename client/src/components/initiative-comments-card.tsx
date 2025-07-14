import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { InitiativeCommentEditor } from "./initiative-comment-editor";
import { InitiativeCommentList } from "./initiative-comment-list";

interface InitiativeCommentsCardProps {
  initiativeId: string;
}

export function InitiativeCommentsCard({ initiativeId }: InitiativeCommentsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/comments`],
  });

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            Komentar ({comments.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <InitiativeCommentEditor initiativeId={initiativeId} />
          <InitiativeCommentList initiativeId={initiativeId} />
        </CardContent>
      )}
    </Card>
  );
}