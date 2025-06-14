import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import type { Guestlist } from "@shared/schema";

export function ActiveGuestlists() {
  const { t } = useTranslation();
  
  const { data: guestlists, isLoading } = useQuery<Guestlist[]>({
    queryKey: ["/api/guestlists"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("active_guestlists")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGuestlists = guestlists?.filter(gl => gl.isActive).slice(0, 3) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("active_guestlists")}</CardTitle>
          <Badge variant="secondary">
            {activeGuestlists.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activeGuestlists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active guestlists found
          </div>
        ) : (
          <div className="space-y-3">
            {activeGuestlists.map((guestlist) => (
              <div key={guestlist.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{guestlist.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {guestlist.description || "No description"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">
                      {guestlist.maxGuests || 0}
                    </span>
                    <p className="text-xs text-muted-foreground">{t("guests")}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(guestlist.eventDate).toLocaleDateString()}</span>
                  {guestlist.eventTime && (
                    <>
                      <span className="mx-2">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{guestlist.eventTime}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
