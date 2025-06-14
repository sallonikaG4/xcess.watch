import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListPlus, Building, UsersIcon } from "lucide-react";

export function QuickActions() {
  const { t } = useTranslation();

  const actions = [
    {
      title: t("add_ban"),
      icon: Plus,
      color: "bg-red-500 hover:bg-red-600",
      action: () => console.log("Add ban")
    },
    {
      title: t("create_guestlist"),
      icon: ListPlus,
      color: "bg-green-500 hover:bg-green-600",
      action: () => console.log("Create guestlist")
    },
    {
      title: t("add_club"),
      icon: Building,
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => console.log("Add club")
    },
    {
      title: t("manage_users"),
      icon: UsersIcon,
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => console.log("Manage users")
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("quick_actions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.action}
                className={`w-full ${action.color} text-white font-medium transition-colors flex items-center justify-center space-x-2 py-3`}
              >
                <Icon className="h-4 w-4" />
                <span>{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
