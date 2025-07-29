import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800',
  'urgent': 'bg-red-100 text-red-800'
};

export default function ProjectProgress({ projects, isLoading }) {
  if (isLoading) {
    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
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
          <FolderKanban className="w-5 h-5 text-purple-600" />
          Active Projects
        </CardTitle>
        <Link to={createPageUrl("Projects")}>
          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{project.title}</h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Due {project.end_date ? format(new Date(project.end_date), "MMM d") : "TBD"}
                  </div>
                </div>
                <Badge className={priorityColors[project.priority]}>
                  {project.priority}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active projects</p>
              <p className="text-sm">Start your first project</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}