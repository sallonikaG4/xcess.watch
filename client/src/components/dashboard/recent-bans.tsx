import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Edit, User } from "lucide-react";
import { Link } from "wouter";
import type { BannedGuest } from "@shared/schema";

export function RecentBans() {
  const { t } = useTranslation();
  
  const { data: bans, isLoading } = useQuery<BannedGuest[]>({
    queryKey: ["/api/banned-guests"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "banned_sl":
        return "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400";
      case "banned_lr":
        return "bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400";
      case "revoked":
        return "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400";
      case "reinstated":
        return "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "banned_sl":
        return "Banned SL";
      case "banned_lr":
        return "Banned LR";
      case "revoked":
        return "Revoked";
      case "reinstated":
        return "Reinstated";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("recent_bans")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentBans = bans?.slice(0, 10) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("recent_bans")}</CardTitle>
          <Link href="/banned-guests">
            <Button variant="link" className="text-primary">
              {t("view_all")}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentBans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No banned guests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">
                    {t("name")}
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">
                    {t("status")}
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">
                    {t("date")}
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentBans.map((ban) => (
                  <tr key={ban.id} className="hover:bg-muted/50">
                    <td className="py-4">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-foreground">
                            {ban.firstName} {ban.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {ban.nationality}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusColor(ban.status)}>
                        {getStatusText(ban.status)}
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {new Date(ban.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
