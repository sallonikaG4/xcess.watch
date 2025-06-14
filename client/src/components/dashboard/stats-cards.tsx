import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Ban, List, IdCard, TrendingUp } from "lucide-react";

interface Stats {
  totalClubs: number;
  activeBans: number;
  guestlistEntries: number;
  idScans: number;
}

export function StatsCards() {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const statsData = [
    {
      title: t("total_clubs"),
      value: stats?.totalClubs || 0,
      icon: Building,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-500/20",
      change: "+2",
      changeText: t("this_month"),
      changeColor: "text-green-500"
    },
    {
      title: t("active_bans"),
      value: stats?.activeBans || 0,
      icon: Ban,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-500/20",
      change: "+5",
      changeText: t("this_week"),
      changeColor: "text-red-500"
    },
    {
      title: t("guestlist_entries"),
      value: stats?.guestlistEntries || 0,
      icon: List,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-500/20",
      change: "+18",
      changeText: t("today"),
      changeColor: "text-green-500"
    },
    {
      title: t("id_scans"),
      value: stats?.idScans || 0,
      icon: IdCard,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-500/20",
      change: "+156",
      changeText: t("today"),
      changeColor: "text-green-500"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card animate-pulse">
            <CardContent>
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="stats-card">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className={`h-4 w-4 ${stat.changeColor} mr-1`} />
                <span className={`${stat.changeColor} font-medium`}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">
                  {stat.changeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
