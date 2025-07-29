import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  'draft': 'bg-gray-100 text-gray-800',
  'sent': 'bg-blue-100 text-blue-800',
  'viewed': 'bg-yellow-100 text-yellow-800',
  'accepted': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800'
};

const statusIcons = {
  'draft': Clock,
  'sent': FileText,
  'viewed': Eye,
  'accepted': CheckCircle,
  'rejected': Clock
};

export default function RecentActivity({ proposals, isLoading }) {
  if (isLoading) {
    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Recent Proposals
        </CardTitle>
        <Link to={createPageUrl("Proposals")}>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const StatusIcon = statusIcons[proposal.status];
            return (
              <div key={proposal.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <StatusIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{proposal.title}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(proposal.created_date), "MMM d, yyyy")} • ${proposal.total_amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge className={statusColors[proposal.status]}>
                  {proposal.status}
                </Badge>
              </div>
            );
          })}
          {proposals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No proposals yet</p>
              <p className="text-sm">Create your first proposal to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}